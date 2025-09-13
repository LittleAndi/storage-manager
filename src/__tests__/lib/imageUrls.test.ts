import { beforeEach, describe, expect, it, vi } from "vitest";
import { prefetchImageUrls, resolveImageUrl } from "@/lib/imageUrls";
import * as imageUpload from "@/lib/imageUpload";

// Helper to access internal cache indirectly by calling resolve and reading getCachedImageUrl

describe("imageUrls caching + resolution", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("returns null for falsy id", async () => {
        const r1 = await resolveImageUrl(undefined);
        const r2 = await resolveImageUrl("");
        expect(r1).toBeNull();
        expect(r2).toBeNull();
    });

    it("fetches and caches a URL (resolveImageUrl)", async () => {
        const spy = vi.spyOn(imageUpload, "getImageUrls").mockResolvedValue({
            abc: "https://cdn/x/abc.jpg",
        });
        const url = await resolveImageUrl("abc");
        expect(url).toBe("https://cdn/x/abc.jpg");
        expect(spy).toHaveBeenCalledTimes(1);
        // Second call should hit cache only
        const url2 = await resolveImageUrl("abc");
        expect(url2).toBe("https://cdn/x/abc.jpg");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("coalesces concurrent requests for same id", async () => {
        const spy = vi.spyOn(imageUpload, "getImageUrls").mockImplementation(
            async (ids: string[]) => {
                await new Promise((r) => setTimeout(r, 10));
                return { [ids[0]]: "https://cdn/x/shared.jpg" } as Record<
                    string,
                    string
                >;
            },
        );
        const p1 = resolveImageUrl("shared");
        const p2 = resolveImageUrl("shared");
        const [u1, u2] = await Promise.all([p1, p2]);
        expect(u1).toBe("https://cdn/x/shared.jpg");
        expect(u2).toBe("https://cdn/x/shared.jpg");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("prefetchImageUrls batches multiple ids and populates cache", async () => {
        const spy = vi.spyOn(imageUpload, "getImageUrls").mockResolvedValue({
            a: "u/a",
            b: "u/b",
        });
        const res = await prefetchImageUrls(["a", "b"]);
        expect(res).toEqual({ a: "u/a", b: "u/b" });
        expect(spy).toHaveBeenCalledTimes(1);
        // Now resolveImageUrl should not trigger a fetch
        const urlA = await resolveImageUrl("a");
        expect(urlA).toBe("u/a");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("prefetchImageUrls skips cached ids and only fetches missing", async () => {
        vi.spyOn(imageUpload, "getImageUrls").mockResolvedValueOnce({
            c: "u/c",
        });
        await prefetchImageUrls(["c"]);
        // Now fetch d + cached c
        const spy2 = vi.spyOn(imageUpload, "getImageUrls").mockResolvedValue({
            d: "u/d",
        });
        const res = await prefetchImageUrls(["c", "d"]);
        expect(res).toEqual({ d: "u/d" });
        // Only new id fetched
        expect(spy2).toHaveBeenCalledTimes(1);
    });

    it("gracefully handles missing url from API (returns null and not cached)", async () => {
        const spy = vi.spyOn(imageUpload, "getImageUrls").mockResolvedValue({
            missing: undefined as unknown as string,
        });
        const url = await resolveImageUrl("missing");
        expect(url).toBeNull();
        // Second call should trigger another fetch since not cached
        const spy2 = vi.spyOn(imageUpload, "getImageUrls").mockResolvedValue({
            missing: "later-url",
        });
        const url2 = await resolveImageUrl("missing");
        expect(url2).toBe("later-url");
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });
});
