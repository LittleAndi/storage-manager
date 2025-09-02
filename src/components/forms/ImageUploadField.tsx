import React, { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface ImageUploadFieldProps {
  name: string;
  label?: string;
  description?: string;
}

// NOTE: This is a stub – real upload (Supabase storage) can be plugged in later.
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ name, label = "Thumbnail", description }) => {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const current = watch(name) as string | undefined;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Placeholder: just create a temporary object URL. In production upload and set returned public URL.
    const url = URL.createObjectURL(file);
  setValue(name as any, url, { shouldDirty: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        {current && (
          <button
            type="button"
            onClick={() => setValue(name as any, undefined, { shouldDirty: true })} // eslint-disable-line @typescript-eslint/no-explicit-any
            className="text-xs underline text-destructive"
          >Remove</button>
        )}
      </label>
      {current && <img src={current} alt="thumbnail preview" className="w-24 h-24 object-cover rounded border" />}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm underline"
        >{current ? "Change" : "Upload"}</button>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
