import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES } from "../constants";

export class InvalidPhotoError extends Error {}

const EXTENSION_BY_TYPE: Record<(typeof ACCEPTED_PHOTO_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validatePhoto(file: File) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
    throw new InvalidPhotoError("Photo must be a JPEG, PNG, or WEBP image");
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new InvalidPhotoError("Photo must be smaller than 5MB");
  }
  if (file.size === 0) {
    throw new InvalidPhotoError("Photo file is empty");
  }
}

/**
 * Vercel's filesystem is ephemeral and read-only in production, so local
 * disk storage only works for local dev. When a Blob store is linked
 * (BLOB_READ_WRITE_TOKEN present) we upload there instead; on Vercel
 * without that token we fail loudly rather than silently losing photos.
 */
export async function savePhoto(file: File): Promise<string> {
  validatePhoto(file);

  const extension = EXTENSION_BY_TYPE[file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]];
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
      "Photo storage isn't configured for this deployment. Add a Blob store in the Vercel dashboard and set BLOB_READ_WRITE_TOKEN.",
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
