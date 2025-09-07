using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

public class UploadImage
{
    private readonly ILogger<UploadImage> log;

    public UploadImage(ILogger<UploadImage> log)
    {
        this.log = log;
    }

    [Function("UploadImage")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "images/{imageId}")] HttpRequest req,
        string imageId
        )
    {
        // Extract fields from multipart form
        var form = await req.ReadFormAsync();

        var file = form.Files["file"];
        if (file == null || file.Length == 0)
        {
            return new BadRequestObjectResult(new { error = "file is required" });
        }

        // Use the original extension (fallback: .jpg)
        string? extension = Path.GetExtension(file.FileName)?.ToLower();
        if (string.IsNullOrEmpty(extension)) extension = ".jpg";

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

            // MODIFIED: Read file into a memory stream to be reused for original and thumbnail
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0; // Reset stream position

            // 1. Upload the original image
            string originalBlobName = $"{imageId}/original{extension}";
            var originalBlobClient = containerClient.GetBlobClient(originalBlobName);
            await originalBlobClient.UploadAsync(memoryStream, overwrite: true);
            log.LogInformation("Uploaded original image: {OriginalBlobName}", originalBlobName);

            // 2. NEW: Create and upload the thumbnail
            memoryStream.Position = 0; // Reset stream position again for ImageSharp

            string thumbnailBlobName = $"{imageId}/thumbnail{extension}";
            var thumbnailBlobClient = containerClient.GetBlobClient(thumbnailBlobName);

            using (var image = await Image.LoadAsync(memoryStream))
            {
                // Define the resize options
                var options = new ResizeOptions
                {
                    Size = new Size(150, 150),
                    Mode = ResizeMode.Crop // Crop will ensure the image is exactly 150x150
                };

                // Mutate the image to resize it
                image.Mutate(x => x.Resize(options));

                // Save the resized image to a new memory stream
                using var thumbnailStream = new MemoryStream();
                await image.SaveAsync(thumbnailStream, new JpegEncoder()); // Saving as JPEG for web efficiency
                thumbnailStream.Position = 0;

                // Upload the thumbnail stream
                await thumbnailBlobClient.UploadAsync(thumbnailStream, overwrite: true);
                log.LogInformation("Uploaded thumbnail image: {ThumbnailBlobName}", thumbnailBlobName);
            }

            // --- MODIFIED: The rest of the function now generates the SAS token for the THUMBNAIL image ---

            int previewMinutes = 60 * 24; // 24 hours
            var previewEnv = Environment.GetEnvironmentVariable("PREVIEW_SAS_MINUTES");
            if (int.TryParse(previewEnv, out var parsed)) previewMinutes = parsed;

            var previewSasBuilder = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = thumbnailBlobName, // MODIFIED: SAS token now points to the thumbnail
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(previewMinutes)
            };
            previewSasBuilder.SetPermissions(BlobSasPermissions.Read);

            var previewUri = thumbnailBlobClient.GenerateSasUri(previewSasBuilder); // MODIFIED: Use the thumbnail client

            return new OkObjectResult(new
            {
                image_id = imageId,
                message = "Upload and thumbnail creation successful",
                preview_url = previewUri.ToString()
            });
        }
        catch (Exception ex)
        {
            log.LogError(ex, "An error occurred during image upload and processing for imageId: {ImageId}", imageId);
            return new ObjectResult(new { error = "An internal error occurred." }) { StatusCode = 500 };
        }
    }
}