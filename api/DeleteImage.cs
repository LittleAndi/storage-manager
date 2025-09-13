using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

public class DeleteImage
{
    private readonly ILogger<DeleteImage> _log;
    public DeleteImage(ILogger<DeleteImage> log)
    {
        _log = log;
    }

    [Function("DeleteImage")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "images/{imageId}")] HttpRequest req,
        string imageId
    )
    {
        if (string.IsNullOrWhiteSpace(imageId))
        {
            return new BadRequestObjectResult(new { error = "imageId required" });
        }

        string containerName = Environment.GetEnvironmentVariable("BLOB_CONTAINER_NAME") ?? "images";
        string? connectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString");
        if (string.IsNullOrEmpty(connectionString))
        {
            _log.LogError("StorageAccountConnectionString not configured");
            return new ObjectResult(new { error = "server misconfiguration" }) { StatusCode = 500 };
        }

        try
        {
            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
            var prefix = imageId + "/";
            int deleted = 0;
            await foreach (var blob in containerClient.GetBlobsAsync(prefix: prefix))
            {
                try
                {
                    await containerClient.DeleteBlobIfExistsAsync(blob.Name);
                    deleted++;
                }
                catch (Exception exDel)
                {
                    _log.LogWarning(exDel, "Failed deleting blob {Name} for imageId {ImageId}", blob.Name, imageId);
                }
            }
            return new OkObjectResult(new { image_id = imageId, deleted });
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Error deleting image prefix {ImageId}", imageId);
            return new ObjectResult(new { error = "internal error" }) { StatusCode = 500 };
        }
    }
}