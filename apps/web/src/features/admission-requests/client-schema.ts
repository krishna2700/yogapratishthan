import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { admissionRequestBaseSchema } from "./schema";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/features/student-admission/constants";
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "./constants";

export const applyFormSchema = admissionRequestBaseSchema.and(
  z.object({
    photo: z
      .instanceof(File)
      .refine(
        (file) => ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]),
        "Photo must be a JPEG, PNG, or WEBP image",
      )
      .refine((file) => file.size <= MAX_PHOTO_SIZE_BYTES, "Photo must be smaller than 5MB")
      .optional(),
    aadhar: z
      .instanceof(File)
      .refine(
        (file) => ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number]),
        "Aadhar card must be a JPEG, PNG, WEBP, or PDF file",
      )
      .refine((file) => file.size <= MAX_DOCUMENT_SIZE_BYTES, "Aadhar card must be smaller than 8MB")
      .optional(),
  }),
);

export type ApplyFormInput = z.input<typeof applyFormSchema>;
export type ApplyFormValues = z.output<typeof applyFormSchema>;
export type ApplyUseFormReturn = UseFormReturn<ApplyFormInput, unknown, ApplyFormValues>;

export const applyFormDefaultValues: ApplyFormInput = {
  firstName: "",
  lastName: "",
  dob: "" as unknown as ApplyFormInput["dob"],
  gender: "" as unknown as ApplyFormInput["gender"],
  mobileNumber: "",
  whatsappNumber: "",
  healthIssues: [],
  healthIssueDetails: "",
  photo: undefined,
  aadhar: undefined,
};
