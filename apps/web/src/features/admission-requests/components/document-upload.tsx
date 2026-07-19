"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "../constants";

interface DocumentUploadProps {
  value: File | undefined;
  onChange: (file: File | undefined) => void;
  error?: string;
}

export function DocumentUpload({ value, onChange, error }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value || value.type === "application/pdf") {
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
        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {value ? (
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Aadhar card preview" className="size-full object-cover" />
          ) : (
            <FileText className="size-8 text-muted-foreground" />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload Aadhar card"
          className={cn(
            "flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground",
            error && "border-destructive/60 text-destructive",
          )}
        >
          <FileText className="size-5" />
          <span className="text-[11px] font-medium">Upload Aadhar</span>
        </button>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          JPEG, PNG, WEBP or PDF. Max {Math.round(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))}MB.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <RotateCcw className="size-3.5" />
            {value ? "Replace" : "Choose file"}
          </Button>
          {value && (
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
