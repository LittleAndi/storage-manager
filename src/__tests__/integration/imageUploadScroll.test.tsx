import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import EditSpaceModal from "@/components/EditSpaceModal";
import type { Space } from "@/types/entities";

// Mock imageUrls so that edit modals and MultiImageUploadField can resolve previews
vi.mock("@/lib/imageUrls", () => ({
  resolveImageUrl: vi.fn().mockResolvedValue("https://cdn/existing.jpg"),
  getCachedImageUrl: vi.fn().mockReturnValue(undefined),
  prefetchImageUrls: vi.fn().mockResolvedValue({}),
}));

// Mock uploadImage/confirmImages so uploads resolve without hitting the network
vi.mock("@/lib/imageUpload", () => ({
  uploadImage: vi
    .fn()
    .mockResolvedValueOnce({ imageId: "new1", previewUrl: "https://cdn/new1.jpg" })
    .mockResolvedValueOnce({ imageId: "new2", previewUrl: "https://cdn/new2.jpg" }),
  confirmImages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/useEntityUpdate", () => ({
  useEntityUpdate: () => ({ mutate: vi.fn(), loading: false }),
}));

vi.mock("@/supabaseClient", () => ({
  supabase: {
    from: () => ({ update: () => ({ eq: () => ({ error: null }) }) }),
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
  },
}));

vi.mock("@/components/ui/alert-dialog", () => {
  const W: React.FC<React.PropsWithChildren> = ({ children }) => <div>{children}</div>;
  return {
    AlertDialog: W,
    AlertDialogContent: W,
    AlertDialogHeader: W,
    AlertDialogTitle: W,
    AlertDialogFooter: W,
    AlertDialogDescription: W,
  };
});
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, type = "button", ...rest }: React.PropsWithChildren<{ type?: "button" | "submit" | "reset"; disabled?: boolean; onClick?: () => void }>) => (
    <button type={type} {...rest}>{children}</button>
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />,
  ),
}));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));

describe("scroll to newly uploaded image", () => {
  const scrollIntoViewSpy = vi.fn();

  beforeEach(() => {
    scrollIntoViewSpy.mockClear();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewSpy;
  });

  it("scrolls to the first newly added image after an upload, not an existing one", async () => {
    const space: Space = {
      id: "space1",
      name: "My Space",
      owner_id: "u1",
      image_id: "existing1",
      image_ids: ["existing1"],
      location: "Shelf",
    };
    render(<EditSpaceModal open={true} onClose={() => {}} space={space} />);

    const fileInput = document.getElementById("image_ids-input") as HTMLInputElement;
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    Object.defineProperty(fileInput, "files", { value: files });
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1));

    // Order is deterministic: existing1 (index 0), new1 (index 1), new2 (index 2).
    // The first newly uploaded image, new1, should be the one scrolled into view.
    const grid = document.querySelector(".grid.gap-3") as HTMLElement;
    const scrolledEl = scrollIntoViewSpy.mock.contexts[0] as HTMLElement;
    expect(scrolledEl).toBe(grid.children[1]);
  });
});
