import "server-only";
import { randomUUID } from "node:crypto";
import { saveFile } from "@/lib/file-storage";
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

export async function savePhoto(file: File): Promise<string> {
  validatePhoto(file);
  const extension = EXTENSION_BY_TYPE[file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]];
  return saveFile(file, `${randomUUID()}.${extension}`, file.type);
}
