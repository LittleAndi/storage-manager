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
  /** name of the field in react-hook-form; will store ImageFieldValue (object) */
  name: string;
  label?: string;
  description?: string;
  /** Called after successful upload (imageId + preview) */
  onUploaded?: (result: UploadResult) => void;
  /** Visual style. 'simple' matches the original Space form look, 'compact' is small inline buttons. */
  variant?: 'simple' | 'compact';
  /** Override preview size (px). Default 128 for simple, 96 for compact. */
  previewSize?: number;
  /** Whether a clear/remove control should be rendered even if no image_id yet. */
  canClear?: boolean;
  /** Callback invoked when user clears image (after field state reset). */
  onClear?: () => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  name,
  label = "Image",
  description,
  onUploaded,
  variant = 'simple',
  previewSize,
  canClear = true,
  onClear,
}) => {
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
    onClear?.();
  }

  const size = previewSize ?? (variant === 'simple' ? 128 : 96);

  if (variant === 'simple') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${name}-input`}>{label}</label>
        <Input
          id={`${name}-input`}
          ref={fileInputRef}
          onChange={handleFileChange}
            type="file"
          accept="image/*"
          className="block w-full text-sm"
          disabled={uploading}
        />
        {value?.preview_url && (
          <div className="mt-2">
            <img
              src={value.preview_url}
              alt="Selected image preview"
              style={{ width: size, height: size }}
              className="object-cover rounded border"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
          {(canClear && (value?.image_id || value?.preview_url)) && !uploading && (
            <button type="button" onClick={handleRemove} className="text-xs underline text-destructive">{value?.image_id ? 'Remove' : 'Clear'}</button>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        {(canClear && (value?.image_id || value?.preview_url)) && (
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
          alt="Selected image preview"
          style={{ width: size, height: size }}
          className="object-cover rounded border"
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
