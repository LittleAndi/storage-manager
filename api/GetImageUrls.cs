using System.Text.Json;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

public class GetImageUrls
{
    private readonly ILogger<GetImageUrls> log;

    public GetImageUrls(ILogger<GetImageUrls> log)
    {
        this.log = log;
    }

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
        var result = new Dictionary<string, KeyValuePair<string, string>>();
        foreach (var imageId in imageIds ?? [])
        {
            var blobPrefix = $"{imageId}/";
            var urls = new KeyValuePair<string, string>();
            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: blobPrefix))
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                var sasUri = blobClient.GenerateSasUri(Azure.Storage.Sas.BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(1));
                var fileName = Path.GetFileNameWithoutExtension(blobItem.Name);
                urls = new KeyValuePair<string, string>(fileName, sasUri.ToString());
            }
            result[imageId] = urls;
        }
        return new OkObjectResult(result);
    }
}