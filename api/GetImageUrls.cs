using System.Text.Json;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

public class GetImageUrls(ILogger<GetImageUrls> log)
{
    private readonly ILogger<GetImageUrls> log = log;

    [Function("GetImageUrls")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "images/urls")] HttpRequest req
        )
    {
        // Parse request body into a list of image IDs
        string body = await new StreamReader(req.Body).ReadToEndAsync();
        var imageIds = JsonSerializer.Deserialize<List<string>>(body);

        if (imageIds == null || imageIds.Count == 0)
        {
            return new BadRequestObjectResult(new { error = "A non-empty list of image IDs is required in the request body." });
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
        // Result structure: imageId -> list of blobs (name, url, type)
        var result = new Dictionary<string, List<object>>();
        foreach (var imageId in imageIds ?? [])
        {
            var blobPrefix = $"{imageId}/";
            var blobsForImage = new List<object>();
            await foreach (var blobItem in containerClient.GetBlobsAsync(traits: Azure.Storage.Blobs.Models.BlobTraits.Metadata, prefix: blobPrefix))
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                var sasUri = blobClient.GenerateSasUri(Azure.Storage.Sas.BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(1));
                var fileName = Path.GetFileNameWithoutExtension(blobItem.Name);
                blobItem.Metadata.TryGetValue("type", out var typeValue);
                blobsForImage.Add(new
                {
                    name = fileName,
                    url = sasUri.ToString(),
                    type = typeValue ?? string.Empty
                });
            }
            result[imageId] = blobsForImage;
        }
        return new OkObjectResult(result);
    }
}