using System.Text.Json;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

public class ConfirmImage
{
    private readonly ILogger<ConfirmImage> log;

    public ConfirmImage(ILogger<ConfirmImage> log)
    {
        this.log = log;
    }

    // Record matching the expected JSON payload posted to this function (metadata only)
    public record ConfirmImageRequest(string metadata_key, string metadata_value);

    [Function("ConfirmImage")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "images/{imageId}")] HttpRequest req
    )
    {
        // Parse request body into a typed record
        string body = await new StreamReader(req.Body).ReadToEndAsync();
        var request = JsonSerializer.Deserialize<ConfirmImageRequest>(body);

        if (request is null)
        {
            return new BadRequestObjectResult(new { error = "invalid request body" });
        }

        string imageId = req.RouteValues["imageId"]?.ToString() ?? string.Empty;

        string metadataKey = request?.metadata_key ?? string.Empty;
        string metadataValue = request?.metadata_value ?? string.Empty;

        if (string.IsNullOrEmpty(imageId) || string.IsNullOrEmpty(metadataKey) || string.IsNullOrEmpty(metadataValue))
        {
            return new BadRequestObjectResult(new { error = "image_id, metadata_key, and metadata_value are required" });
        }

        string containerName = Environment.GetEnvironmentVariable("BLOB_CONTAINER_NAME") ?? "images";
        string? connectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString");

        if (string.IsNullOrEmpty(connectionString))
        {
            log.LogError("StorageAccountConnectionString not configured");
            return new ObjectResult(new { error = "server misconfiguration" }) { StatusCode = 500 };
        }

        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        var blobPrefix = $"{imageId}/";
        await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: blobPrefix))
        {
            var blobClient = containerClient.GetBlobClient(blobItem.Name);
            var metadata = new Dictionary<string, string>(blobItem.Metadata)
            {
                [metadataKey] = metadataValue
            };

            await blobClient.SetMetadataAsync(metadata);
            log.LogInformation("Set metadata for blob {BlobName}", blobItem.Name);
        }

        return new OkObjectResult(new { message = "Metadata updated successfully" });
    }
}