import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { put } from "@vercel/blob";

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

/**
 * Where an uploaded file (photo, Aadhar card) actually lands depends on
 * what's configured, checked in this order:
 *   1. Cloudflare R2 (R2_* env vars) — works from any host, not just Vercel.
 *   2. Vercel Blob (BLOB_READ_WRITE_TOKEN) — only relevant when deployed on
 *      Vercel.
 *   3. Local disk (apps/web/public/uploads) — dev only; the filesystem on
 *      every serverless/free-tier host this app targets is ephemeral, so
 *      this must never be reached in production.
 */
export async function saveFile(file: File, filename: string, contentType: string): Promise<string> {
  if (process.env.R2_ACCOUNT_ID) {
    const buffer = Buffer.from(await file.arrayBuffer());
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `uploads/${filename}`,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${process.env.R2_PUBLIC_URL}/uploads/${filename}`;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }

  if (process.env.VERCEL || process.env.RENDER) {
    throw new Error(
      "File storage isn't configured for this deployment. Set R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME/R2_PUBLIC_URL (or BLOB_READ_WRITE_TOKEN on Vercel).",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
