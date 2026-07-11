"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES } from "../constants";

interface PhotoUploadProps {
  value: File | undefined;
  onChange: (file: File | undefined) => void;
  error?: string;
}

export function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handleFileSelect(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    onChange(file);
  }

  function handleRemove() {
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {previewUrl ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Student preview" className="size-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload student photo"
          className={cn(
            "flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground",
            error && "border-destructive/60 text-destructive",
          )}
        >
          <Camera className="size-5" />
          <span className="text-[11px] font-medium">Upload photo</span>
        </button>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          JPEG, PNG or WEBP. Max {Math.round(MAX_PHOTO_SIZE_BYTES / (1024 * 1024))}MB.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <RotateCcw className="size-3.5" />
            {previewUrl ? "Replace" : "Choose file"}
          </Button>
          {previewUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <X className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
