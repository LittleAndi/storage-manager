import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import EditSpaceModal from "@/components/EditSpaceModal";
import EditBoxModal from "@/components/EditBoxModal";
import type { Space, Box } from "@/types/entities";

// Mock resolveImageUrl so that the edit modals preload an existing image
vi.mock("@/lib/imageUrls", () => ({
  resolveImageUrl: vi.fn().mockResolvedValue("https://cdn/existing.jpg"),
}));

// Spy for mutate calls from useEntityUpdate
const mutateSpy = vi.fn();
vi.mock("@/hooks/useEntityUpdate", () => ({
  useEntityUpdate: () => ({ mutate: mutateSpy, loading: false }),
}));

// Mock supabase client minimal surface
vi.mock("@/supabaseClient", () => ({
  supabase: {
    from: () => ({ update: () => ({ eq: () => ({ error: null }) }) }),
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
  },
}));

// Simplify UI primitives (define inside factory to avoid hoist ordering issues)
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
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));

describe("image clear behavior", () => {
  beforeEach(() => {
    mutateSpy.mockClear();
  });

  it("submits image_id null when clearing existing space image", async () => {
    const space: Space = { id: "space1", name: "My Space", owner_id: "u1", image_id: "img123", location: "Shelf" };
    render(<EditSpaceModal open={true} onClose={() => {}} space={space} />);

    const removeBtn = await screen.findByRole("button", { name: /remove/i });
    fireEvent.click(removeBtn);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mutateSpy).toHaveBeenCalled());
    const patchArg = mutateSpy.mock.calls[0][0];
    expect(patchArg.image_id).toBeNull();
  });

  it("submits image_id null when clearing existing box image", async () => {
    const box: Box = { id: "box1", name: "My Box", space_id: "space1", image_id: "imgABC", location: "Shelf", content: "Stuff" };
    render(<EditBoxModal open={true} onClose={() => {}} box={box} />);

    const removeBtn = await screen.findByRole("button", { name: /remove/i });
    fireEvent.click(removeBtn);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(() => expect(mutateSpy).toHaveBeenCalledTimes(1));
  const patchArg = mutateSpy.mock.calls[0][0];
  expect(patchArg.image_id).toBeNull();
  });
});
