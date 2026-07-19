import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { InvalidDocumentError, saveDocument } from "@/features/admission-requests/services/document-upload-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("No file was provided", 400);
  }

  try {
    const url = await saveDocument(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidDocumentError) {
      return jsonError(error.message, 422);
    }
    throw error;
  }
}
