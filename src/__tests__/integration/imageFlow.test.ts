import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    confirmImage,
    getImageUrls,
    uploadAndMaybeConfirm,
    uploadImage,
} from "@/lib/imageUpload";

// We'll simulate fetch with a simple implementation that inspects URL & method

interface FetchCall {
    url: string;
    init?: RequestInit;
}
const calls: FetchCall[] = [];

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// Dynamic behavior controls
let failUpload = false;
let failConfirm = false;
// deterministic mapping handled inline (ids other than 'missing' map to https://cdn/<id>.jpg)

// @ts-expect-error override global
global.fetch = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    // We need to check for /api/images/urls first, otherwise 'urls' will be interpreted as a imageId
    if (url === "/api/images/urls" && init?.method === "POST") {
        const ids: string[] = JSON.parse(init.body as string);
        const result: Record<string, { key: string; value: string } | null> =
            {};
        ids.forEach((id) => {
            if (id === "missing") {
                // simulate backend returning null entry for missing id
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[id] = null;
            } else {
                result[id] = { key: id, value: `https://cdn/${id}.jpg` };
            }
        });
        return makeResponse(result);
    }
    if (
        url.startsWith("/api/images/") && init?.method === "POST" &&
        /\/api\/images\/.+/.test(url)
    ) {
        if (failUpload) return makeResponse({ message: "error" }, 500);
        const imageId = url.split("/").pop()!;
        return makeResponse({
            image_id: imageId,
            preview_url: `https://preview/${imageId}.jpg`,
        });
    }
    if (url.startsWith("/api/images/") && init?.method === "PUT") {
        if (failConfirm) return makeResponse({ message: "fail" }, 500);
        return makeResponse({ message: "ok" });
    }
    return makeResponse({ message: "not found" }, 404);
});

beforeEach(() => {
    calls.length = 0;
    failUpload = false;
    failConfirm = false;
    // nothing else to reset
    vi.clearAllMocks();
});

describe("image upload + confirm + batch URL flow", () => {
    it("uploads and returns preview URL", async () => {
        const file = new File(["data"], "a.png", { type: "image/png" });
        const res = await uploadImage(file, "fixed-id");
        expect(res.imageId).toBe("fixed-id");
        expect(res.previewUrl).toBe("https://preview/fixed-id.jpg");
        expect(calls[0].url).toBe("/api/images/fixed-id");
        expect(calls[0].init?.method).toBe("POST");
    });

    it("throws on failed upload", async () => {
        failUpload = true;
        const file = new File(["x"], "b.png");
        await expect(uploadImage(file, "bad")).rejects.toThrow();
    });

    it("confirms image with metadata", async () => {
        const ok = await confirmImage("cid", {
            metadataKey: "space_id",
            metadataValue: "space123",
        });
        expect(ok).toBe(true);
        const confirmCall = calls.find((c) =>
            c.url === "/api/images/cid" && c.init?.method === "PUT"
        );
        expect(confirmCall).toBeTruthy();
        expect(confirmCall?.init?.body).toContain("space_id");
    });

    it("confirmImage returns false when missing metadata", async () => {
        const ok = await confirmImage("cid", { metadataKey: "space_id" });
        expect(ok).toBe(false); // missing value
    });

    it("uploadAndMaybeConfirm confirms immediately when entityId present", async () => {
        const file = new File(["data"], "c.png");
        const res = await uploadAndMaybeConfirm(file, {
            entityId: "box1",
            metadataKey: "box_id",
        });
        expect(res.imageId).toBeTruthy();
        const putCall = calls.find((c) => c.init?.method === "PUT");
        expect(putCall).toBeTruthy();
    });

    it("getImageUrls maps ids and skips missing", async () => {
        const map = await getImageUrls(["a1", "a2", "missing"]);
        expect(map).toEqual({
            a1: "https://cdn/a1.jpg",
            a2: "https://cdn/a2.jpg",
        });
        expect(map).not.toHaveProperty("missing");
    });
});
