import {
    confirmImage,
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

    it("getImageUrls returns mapping for provided ids", async () => {
        mockFetch(async (input, init) => {
            expect(input).toBe("/api/images/urls");
            expect(init?.method).toBe("POST");
            expect(init?.body).toBe(JSON.stringify(["img1", "img2"]));
            return new Response(
                JSON.stringify({
                    img1: { key: "thumb", value: "https://example/img1.png" },
                    img2: { key: "thumb", value: "https://example/img2.png" },
                }),
                { status: 200 },
            );
        });
        const res = await getImageUrls(["img1", "img2"]);
        expect(res).toEqual({
            img1: "https://example/img1.png",
            img2: "https://example/img2.png",
        });
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
});
