using System.Text.Json;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

public class ConfirmImage(ILogger<ConfirmImage> log)
{
    private readonly ILogger<ConfirmImage> log = log;

    // Record matching the expected JSON payload posted to this function (metadata only)
    public record ConfirmImageRequest(string metadata_key, string metadata_value);

    [Function("ConfirmImage")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "images/{imageId}")] HttpRequest req,
        string imageId
        )
    {
        // Parse request body into a typed record
        string body = await new StreamReader(req.Body).ReadToEndAsync();
        var request = JsonSerializer.Deserialize<ConfirmImageRequest>(body);

        if (request is null)
        {
            return new BadRequestObjectResult(new { error = "invalid request body" });
        }

        string metadataKey = request.metadata_key;
        string metadataValue = request.metadata_value;

        if (string.IsNullOrEmpty(metadataKey) || string.IsNullOrEmpty(metadataValue))
        {
            return new BadRequestObjectResult(new { error = "metadata_key and metadata_value are required" });
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

            // Merge existing metadata with ownership + confirmed status
            var metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var kv in blobItem.Metadata)
            {
                metadata[kv.Key] = kv.Value;
            }
            metadata[metadataKey] = metadataValue; // e.g. box_id / space_id
            metadata["status"] = "confirmed";

            try
            {
                await blobClient.SetMetadataAsync(metadata);
                log.LogInformation("Updated metadata for blob {BlobName}", blobItem.Name);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Failed setting confirmed metadata for blob {BlobName}", blobItem.Name);
            }
        }

        return new OkObjectResult(new { message = "Metadata updated successfully" });
    }
}