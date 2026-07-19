import "server-only";
import { randomUUID } from "node:crypto";
import { saveFile } from "@/lib/file-storage";
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

export async function saveDocument(file: File): Promise<string> {
  validateDocument(file);
  const extension = EXTENSION_BY_TYPE[file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number]];
  return saveFile(file, `${randomUUID()}.${extension}`, file.type);
}
