using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using NetVips;

/// <summary>
/// One-time admin utility: re-generates thumbnails for all existing images at the
/// new 480×360 resolution. Safe to call multiple times — it always overwrites.
///
/// Usage:
///   curl -X POST https://{host}/api/admin/regenerate-thumbnails \
///        -H "X-Admin-Key: {ADMIN_KEY value from app settings}"
/// </summary>
public class RegenerateThumbnails(ILogger<RegenerateThumbnails> log)
{
    private readonly ILogger<RegenerateThumbnails> log = log;

    [Function("RegenerateThumbnails")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post",
            Route = "admin/regenerate-thumbnails")] HttpRequest req)
    {
        // Simple shared-secret guard so this can't be triggered by accident.
        string? expectedKey = Environment.GetEnvironmentVariable("ADMIN_KEY");
        if (string.IsNullOrEmpty(expectedKey))
        {
            log.LogError("ADMIN_KEY env var not set — refusing to run");
            return new ObjectResult(new { error = "ADMIN_KEY not configured" })
            { StatusCode = 500 };
        }
        string? providedKey = req.Headers["X-Admin-Key"].FirstOrDefault();
        if (providedKey != expectedKey)
            return new UnauthorizedObjectResult(new { error = "Invalid or missing X-Admin-Key header" });

        string containerName = Environment.GetEnvironmentVariable("BLOB_CONTAINER_NAME") ?? "images";
        string? connectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString");
        if (string.IsNullOrEmpty(connectionString))
        {
            log.LogError("StorageAccountConnectionString not configured");
            return new ObjectResult(new { error = "server misconfiguration" }) { StatusCode = 500 };
        }

        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        int processed = 0, skipped = 0, failed = 0;
        var failures = new List<string>();

        // Enumerate all blobs; filter to originals only.
        await foreach (var item in containerClient.GetBlobsAsync(
            traits: BlobTraits.Metadata, states: BlobStates.None, prefix: "", cancellationToken: default))
        {
            item.Metadata.TryGetValue("type", out var blobType);
            if (blobType != "original") { skipped++; continue; }

            // Derive thumbnail blob name from original: {id}/{id}-original.webp -> {id}/{id}-thumbnail.webp
            string originalName = item.Name;
            string thumbnailName = originalName.Replace("-original.webp", "-thumbnail.webp",
                StringComparison.OrdinalIgnoreCase);

            if (thumbnailName == originalName)
            {
                // Unexpected name format — skip rather than corrupt data
                log.LogWarning("Could not derive thumbnail name from {Name}", originalName);
                skipped++;
                continue;
            }

            try
            {
                // Download original
                var originalClient = containerClient.GetBlobClient(originalName);
                using var download = await originalClient.OpenReadAsync();
                using var downloadBuffer = new MemoryStream();
                await download.CopyToAsync(downloadBuffer);

                // Re-encode thumbnail at 480×360 (4:3 landscape crop). Thumbnail directly from
                // the downloaded bytes so libvips can shrink-on-load instead of decoding full-size first.
                using var thumb = Image.ThumbnailBuffer(downloadBuffer.ToArray(), 480, height: 360, crop: Enums.Interesting.Centre);
                using var ms = new MemoryStream(thumb.WebpsaveBuffer(q: 80));

                var thumbClient = containerClient.GetBlobClient(thumbnailName);

                // Fetch existing thumbnail metadata so we preserve keys set by ConfirmImage
                // (e.g. status=confirmed, space_id, box_id). Merge with our fixed keys.
                var mergedMeta = new Dictionary<string, string>
                {
                    ["derived_from"] = originalName,
                    ["type"] = "thumbnail",
                    ["regenerated"] = DateTimeOffset.UtcNow.ToString("O"),
                };
                if (await thumbClient.ExistsAsync())
                {
                    var props = await thumbClient.GetPropertiesAsync();
                    foreach (var kv in props.Value.Metadata)
                        mergedMeta.TryAdd(kv.Key, kv.Value); // existing keys win for unknown fields
                    // Ensure our controlled keys always reflect current truth
                    mergedMeta["derived_from"] = originalName;
                    mergedMeta["type"] = "thumbnail";
                    mergedMeta["regenerated"] = DateTimeOffset.UtcNow.ToString("O");
                }

                await thumbClient.UploadAsync(ms, new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = "image/webp",
                        CacheControl = "public, max-age=31536000",
                    },
                    Metadata = mergedMeta,
                });

                log.LogInformation("Regenerated thumbnail for {OriginalName}", originalName);
                processed++;
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Failed to regenerate thumbnail for {OriginalName}", originalName);
                failures.Add(originalName);
                failed++;
            }
        }

        return new OkObjectResult(new
        {
            processed,
            skipped,
            failed,
            failures,
            message = $"Done. {processed} thumbnail(s) regenerated, {skipped} blob(s) skipped, {failed} failed.",
        });
    }
}
