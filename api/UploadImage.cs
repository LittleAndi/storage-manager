using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Azure.Storage.Blobs.Models; // added for BlobHttpHeaders
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Webp;

public class UploadImage(ILogger<UploadImage> log)
{
    private readonly ILogger<UploadImage> log = log;

    [Function("UploadImage")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "images/{imageId}")] HttpRequest req,
        string imageId
        )
    {
        var form = await req.ReadFormAsync();
        var file = form.Files["file"];
        if (file == null || file.Length == 0)
        {
            return new BadRequestObjectResult(new { error = "file is required" });
        }

        string? suppliedExtension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        string containerName = Environment.GetEnvironmentVariable("BLOB_CONTAINER_NAME") ?? "images";
        string? connectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString");

        if (string.IsNullOrEmpty(connectionString))
        {
            log.LogError("StorageAccountConnectionString not configured");
            return new ObjectResult(new { error = "server misconfiguration" }) { StatusCode = 500 };
        }

        try
        {
            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
            await containerClient.CreateIfNotExistsAsync();

            // Read entire upload into memory once
            using var originalBuffer = new MemoryStream();
            await file.CopyToAsync(originalBuffer);
            originalBuffer.Position = 0;

            // Decode original to ImageSharp Image object
            originalBuffer.Position = 0;
            using Image image = await Image.LoadAsync(originalBuffer);
            // Apply EXIF orientation so images are stored correctly regardless of source orientation
            image.Mutate(x => x.AutoOrient());
            IImageFormat? decodedFormat = image.Metadata.DecodedImageFormat; // original detected format (for metadata only)

            // We will ALWAYS store as WebP (lossy) for both original-sized image and thumbnail.
            // Decide quality settings:
            var webpOriginalEncoder = new WebpEncoder
            {
                Quality = 90, // higher quality for the preserved-size original
                Method = WebpEncodingMethod.BestQuality
            };
            var webpThumbEncoder = new WebpEncoder
            {
                Quality = 80,
                Method = WebpEncodingMethod.Default // use default method for faster encode
            };

            // Blob names (fixed extensions now)
            string originalBlobName = $"{imageId}/{imageId}-original.webp";
            string thumbnailBlobName = $"{imageId}/{imageId}-thumbnail.webp";

            // Encode full-size (no resize) as WebP
            using var webpOriginalStream = new MemoryStream();
            await image.SaveAsync(webpOriginalStream, webpOriginalEncoder);
            webpOriginalStream.Position = 0;

            var originalBlobClient = containerClient.GetBlobClient(originalBlobName);
            await originalBlobClient.UploadAsync(
                webpOriginalStream,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = "image/webp",
                        CacheControl = "public, max-age=31536000"
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["status"] = "unconfirmed",
                        ["source_ext"] = suppliedExtension ?? string.Empty,
                        ["source_format"] = decodedFormat?.Name ?? "unknown",
                        ["type"] = "original"
                    }
                });

            log.LogInformation("Uploaded original (converted WebP) image {OriginalBlob}", originalBlobName);

            // Create thumbnail (square crop) then encode as WebP
            const int thumbSize = 150;
            using var thumbnailImage = image.Clone(ctx =>
                ctx.Resize(new ResizeOptions
                {
                    Size = new Size(thumbSize, thumbSize),
                    Mode = ResizeMode.Crop
                }));

            using var thumbnailStream = new MemoryStream();
            await thumbnailImage.SaveAsync(thumbnailStream, webpThumbEncoder);
            thumbnailStream.Position = 0;

            var thumbnailBlobClient = containerClient.GetBlobClient(thumbnailBlobName);
            await thumbnailBlobClient.UploadAsync(
                thumbnailStream,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = "image/webp",
                        CacheControl = "public, max-age=31536000"
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["status"] = "unconfirmed",
                        ["derived_from"] = originalBlobName,
                        ["type"] = "thumbnail"
                    }
                });

            log.LogInformation("Uploaded thumbnail (WebP) image {ThumbnailBlob}", thumbnailBlobName);

            // SAS for thumbnail preview
            int previewMinutes = 60 * 24;
            var previewEnv = Environment.GetEnvironmentVariable("PREVIEW_SAS_MINUTES");
            if (int.TryParse(previewEnv, out var parsed)) previewMinutes = parsed;

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = thumbnailBlobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(previewMinutes)
            };
            sasBuilder.SetPermissions(BlobSasPermissions.Read);
            var previewUri = thumbnailBlobClient.GenerateSasUri(sasBuilder);

            return new OkObjectResult(new
            {
                image_id = imageId,
                message = "Upload and thumbnail creation successful",
                original_blob = originalBlobName,
                original_mime = "image/webp",
                thumbnail_blob = thumbnailBlobName,
                preview_url = previewUri.ToString()
            });
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Error during image upload for {ImageId}", imageId);
            return new ObjectResult(new { error = "An internal error occurred." }) { StatusCode = 500 };
        }
    }
}