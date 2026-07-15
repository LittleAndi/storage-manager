using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Azure.Storage.Blobs.Models; // added for BlobHttpHeaders
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using NetVips;

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
            byte[] uploadedBytes = originalBuffer.ToArray();

            // Decode original and apply EXIF orientation so images are stored correctly regardless of source orientation
            using Image image = Image.NewFromBuffer(uploadedBytes).Autorot();
            // original detected format (for metadata only), e.g. "jpegload_buffer" -> "jpeg"
            string decodedFormat = image.Contains("vips-loader")
                ? ((string)image.Get("vips-loader")).Replace("load_buffer", string.Empty)
                : "unknown";

            // Blob names (fixed extensions now)
            string originalBlobName = $"{imageId}/{imageId}-original.webp";
            string thumbnailBlobName = $"{imageId}/{imageId}-thumbnail.webp";

            // We will ALWAYS store as WebP (lossy) for both original-sized image and thumbnail.
            // Encode full-size (no resize) as WebP — higher quality/effort for the preserved-size original
            using var webpOriginalStream = new MemoryStream(image.WebpsaveBuffer(q: 90, effort: 6));

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
                        ["source_format"] = decodedFormat,
                        ["type"] = "original"
                    }
                });

            log.LogInformation("Uploaded original (converted WebP) image {OriginalBlob}", originalBlobName);

            // Create thumbnail (4:3 landscape crop) then encode as WebP.
            // 480×360 covers a 4-column card grid on a 1440px screen at 1× and a
            // 2-column grid on a 375px mobile at 2× (Retina), without being wasteful.
            // Thumbnail directly from the source bytes so libvips can shrink-on-load
            // instead of resizing the already-decoded full-size bitmap.
            using var thumbnailImage = Image.ThumbnailBuffer(uploadedBytes, 480, height: 360, crop: Enums.Interesting.Centre);
            using var thumbnailStream = new MemoryStream(thumbnailImage.WebpsaveBuffer(q: 80));

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