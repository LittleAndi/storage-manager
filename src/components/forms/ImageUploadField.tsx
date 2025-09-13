import React, { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { uploadImage, type UploadResult } from "@/lib/imageUpload";

// Shape we keep in form state: store image_id plus local preview (not persisted)
interface ImageFieldValue {
  image_id?: string; // persisted id
  preview_url?: string; // ephemeral preview (signed)
}

interface ImageUploadFieldProps {
  /** name of the field in react-hook-form; will store ImageFieldValue */
  name: string;
  label?: string;
  description?: string;
  /** Optional callback after successful upload */
  onUploaded?: (result: UploadResult) => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ name, label = "Image", description, onUploaded }) => {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const value = watch(name) as ImageFieldValue | undefined;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const field: ImageFieldValue = { image_id: result.imageId, preview_url: result.previewUrl || URL.createObjectURL(file) };
      setValue(name as any, field, { shouldDirty: true, shouldTouch: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
      onUploaded?.(result);
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setValue(name as any, undefined, { shouldDirty: true, shouldTouch: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        {value?.image_id && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs underline text-destructive"
          >Remove</button>
        )}
      </label>
      {value?.preview_url && (
        <img
          src={value.preview_url}
          alt="image preview"
          className="w-24 h-24 object-cover rounded border"
        />
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm underline disabled:opacity-50"
          disabled={uploading}
        >{uploading ? "Uploading..." : value?.image_id ? "Change" : "Upload"}</button>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Input
        ref={fileInputRef}
        onChange={handleFileChange}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
