using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System;

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
        FunctionContext executionContext)
    {
        // Extract fields from multipart form
        var form = await req.ReadFormAsync();

        // Get the imageId from the route parameter
        string imageId = req.RouteValues["imageId"]?.ToString() ?? string.Empty;
        if (string.IsNullOrEmpty(imageId))
        {
            return new BadRequestObjectResult(new { error = "imageId is required in the URL path" });
        }

        var file = form.Files["file"];
        if (file == null || file.Length == 0)
        {
            return new BadRequestObjectResult(new { error = "file is required" });
        }

        // Use the original extension (fallback: .jpg)
        string? extension = Path.GetExtension(file.FileName)?.ToLower();
        if (string.IsNullOrEmpty(extension)) extension = ".jpg";

        string blobName = $"{imageId}/original{extension}";

        string containerName = Environment.GetEnvironmentVariable("BLOB_CONTAINER_NAME") ?? "images";
        string? connectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString");

        if (string.IsNullOrEmpty(connectionString))
        {
            log.LogError("StorageAccountConnectionString not configured");
            return new ObjectResult(new { error = "server misconfiguration" }) { StatusCode = 500 };
        }

        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(blobName);

        // Upload the file stream
        using (var stream = file.OpenReadStream())
        {
            await blobClient.UploadAsync(stream, overwrite: true);
        }

        // Create a read SAS for previewing the uploaded image. Default expiry 24 hours,
        // configurable via PREVIEW_SAS_MINUTES environment variable.
        int previewMinutes = 60 * 24; // 24 hours
        var previewEnv = Environment.GetEnvironmentVariable("PREVIEW_SAS_MINUTES");
        if (int.TryParse(previewEnv, out var parsed)) previewMinutes = parsed;

        var previewSasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(previewMinutes)
        };
        previewSasBuilder.SetPermissions(BlobSasPermissions.Read);

        var previewUri = blobClient.GenerateSasUri(previewSasBuilder);

        return new OkObjectResult(new
        {
            image_id = imageId,
            message = "Upload successful",
            preview_url = previewUri.ToString()
        });
    }
}
