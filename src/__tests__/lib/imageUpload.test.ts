import {
    confirmImage,
    confirmImages,
    deleteImages,
    getImageUrls,
    ImageUploadError,
    uploadAndMaybeConfirm,
    uploadImage,
} from "@/lib/imageUpload";
import { afterEach, describe, expect, it, vi } from "vitest";

// Simple mock for global fetch
const originalFetch = global.fetch;

function mockFetch(
    impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
    (global as unknown as { fetch: typeof fetch }).fetch = impl;
}

describe("imageUpload helper", () => {
    afterEach(() => {
        global.fetch = originalFetch;
        vi.resetAllMocks();
    });

    it("uploads an image and returns imageId + previewUrl", async () => {
        const file = new File(["abc"], "test.png", { type: "image/png" });
        mockFetch(async (input, init) => {
            // Expect POST to /api/images/<uuid>
            expect(init?.method).toBe("POST");
            const url = input.toString();
            expect(url.startsWith("/api/images/")).toBe(true);
            return new Response(
                JSON.stringify({
                    image_id: "img123",
                    preview_url: "https://example/preview.png",
                }),
                { status: 200 },
            );
        });

        const res = await uploadImage(file, "img123");
        expect(res.imageId).toBe("img123");
        expect(res.previewUrl).toBe("https://example/preview.png");
    });

    it("throws ImageUploadError on non-2xx upload", async () => {
        const file = new File(["abc"], "bad.png", { type: "image/png" });
        mockFetch(async () =>
            new Response("boom", { status: 500, statusText: "Server Error" })
        );
        await expect(uploadImage(file, "fail1")).rejects.toBeInstanceOf(
            ImageUploadError,
        );
    });

    it("confirms image when metadata provided", async () => {
        const calls: { url: string; method?: string; body?: string }[] = [];
        mockFetch(async (input, init) => {
            calls.push({
                url: input.toString(),
                method: init?.method,
                body: init?.body as string,
            });
            return new Response(JSON.stringify({ message: "ok" }), {
                status: 200,
            });
        });
        const ok = await confirmImage("img789", {
            metadataKey: "box_id",
            metadataValue: "box123",
        });
        expect(ok).toBe(true);
        expect(calls[0].url).toBe("/api/images/img789");
        expect(calls[0].method).toBe("PUT");
        expect(calls[0].body).toContain("box_id");
    });

    it("confirmImage returns false if missing metadata", async () => {
        // No fetch should fire
        const spy = vi.spyOn(global, "fetch");
        const ok = await confirmImage("imgNoMeta", {});
        expect(ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it("getImageUrls returns structured mapping with thumbnail/original/blobs", async () => {
        mockFetch(async (input, init) => {
            expect(input).toBe("/api/images/urls");
            expect(init?.method).toBe("POST");
            expect(init?.body).toBe(JSON.stringify(["img1", "img2"]));
            return new Response(
                JSON.stringify({
                    img1: [
                        {
                            name: "img1-thumb",
                            url: "https://example/img1-thumb.webp",
                            type: "thumbnail",
                        },
                        {
                            name: "img1-orig",
                            url: "https://example/img1-orig.webp",
                            type: "original",
                        },
                    ],
                    img2: [
                        {
                            name: "img2-orig",
                            url: "https://example/img2-orig.webp",
                            type: "original",
                        },
                    ],
                }),
                { status: 200 },
            );
        });
        const res = await getImageUrls(["img1", "img2"]);
        expect(Object.keys(res)).toEqual(["img1", "img2"]);
        expect(res.img1.thumbnail).toBe("https://example/img1-thumb.webp");
        expect(res.img1.original).toBe("https://example/img1-orig.webp");
        // For img2 only original provided; function should fallback to use same for thumbnail & original
        expect(res.img2.thumbnail).toBe("https://example/img2-orig.webp");
        expect(res.img2.original).toBe("https://example/img2-orig.webp");
        expect(res.img1.blobs.length).toBe(2);
        expect(res.img2.blobs.length).toBe(1);
    });

    it("uploadAndMaybeConfirm confirms immediately when entityId and metadataKey provided", async () => {
        let confirmCalled = false;
        mockFetch(async (input, init) => {
            const url = input.toString();
            if (url.startsWith("/api/images/") && init?.method === "POST") {
                return new Response(
                    JSON.stringify({ image_id: "imgC", preview_url: "p" }),
                    { status: 200 },
                );
            }
            if (url === "/api/images/imgC" && init?.method === "PUT") {
                confirmCalled = true;
                return new Response(JSON.stringify({ message: "ok" }), {
                    status: 200,
                });
            }
            return new Response("not found", { status: 404 });
        });

        const file = new File(["abc"], "confirm.png", { type: "image/png" });
        const res = await uploadAndMaybeConfirm(file, {
            entityId: "box999",
            metadataKey: "box_id",
        });
        expect(res.imageId).toBe("imgC");
        expect(confirmCalled).toBe(true);
    });

    it("confirmImages calls confirmImage for each unique id in parallel and swallows errors", async () => {
        const calls: string[] = [];
        mockFetch(async (input, init) => {
            const url = input.toString();
            if (init?.method === "PUT") {
                if (url.includes("bad-id")) {
                    return new Response("server error", { status: 500 });
                }
                calls.push(url.split("/").pop()!);
                return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
            }
            return new Response("not found", { status: 404 });
        });
        // Should not throw even though "bad-id" fails
        await expect(
            confirmImages(["id-a", "id-b", "id-a", "bad-id"], {
                metadataKey: "space_id",
                metadataValue: "space1",
            }),
        ).resolves.toBeUndefined();
        // Deduplication: id-a only called once
        expect(calls.filter((c) => c === "id-a").length).toBe(1);
        expect(calls.filter((c) => c === "id-b").length).toBe(1);
    });

    it("deleteImages sends DELETE for each unique id and ignores errors", async () => {
        const deleted: string[] = [];
        mockFetch(async (input, init) => {
            if (init?.method === "DELETE") {
                const id = input.toString().split("/").pop()!;
                if (id === "fail-id") return new Response("error", { status: 500 });
                deleted.push(id);
                return new Response(JSON.stringify({ deleted: true }), { status: 200 });
            }
            return new Response("not found", { status: 404 });
        });
        await expect(
            deleteImages(["del-a", "del-b", "del-a", "fail-id"]),
        ).resolves.toBeUndefined();
        expect(deleted.filter((d) => d === "del-a").length).toBe(1);
        expect(deleted.filter((d) => d === "del-b").length).toBe(1);
    });
});
