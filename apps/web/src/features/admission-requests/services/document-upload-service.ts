import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "../constants";

export class InvalidDocumentError extends Error {}

const EXTENSION_BY_TYPE: Record<(typeof ACCEPTED_DOCUMENT_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function validateDocument(file: File) {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
    throw new InvalidDocumentError("File must be a JPEG, PNG, WEBP, or PDF");
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new InvalidDocumentError("File must be smaller than 8MB");
  }
  if (file.size === 0) {
    throw new InvalidDocumentError("File is empty");
  }
}

/** Same Blob-vs-local-disk split as photo-upload-service.ts — see that file for why. */
export async function saveDocument(file: File): Promise<string> {
  validateDocument(file);

  const extension = EXTENSION_BY_TYPE[file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number]];
  const filename = `${randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Document storage isn't configured for this deployment. Add a Blob store in the Vercel dashboard and set BLOB_READ_WRITE_TOKEN.",
    );
  }

  return saveToLocalDisk(file, filename);
}

async function saveToLocalDisk(file: File, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
