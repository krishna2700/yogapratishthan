import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { InvalidPhotoError, savePhoto } from "@/features/student-admission/services/photo-upload-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("No photo file was provided", 400);
  }

  try {
    const url = await savePhoto(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      return jsonError(error.message, 422);
    }
    throw error;
  }
}
