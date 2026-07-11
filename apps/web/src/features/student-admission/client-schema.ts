import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { studentBaseSchema } from "./schema";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES } from "./constants";

export const admissionFormSchema = studentBaseSchema.and(
  z.object({
    photo: z
      .instanceof(File)
      .refine(
        (file) => ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]),
        "Photo must be a JPEG, PNG, or WEBP image",
      )
      .refine((file) => file.size <= MAX_PHOTO_SIZE_BYTES, "Photo must be smaller than 5MB")
      .optional(),
  }),
);

// The schema pre-processes raw HTML input strings (dob, payment, sessions)
// into numbers/dates, so the form's *input* shape (what RHF holds while
// typing) differs from its *output* shape (what gets submitted). Both are
// needed to type useForm's generics correctly.
export type AdmissionFormInput = z.input<typeof admissionFormSchema>;
export type AdmissionFormValues = z.output<typeof admissionFormSchema>;
export type AdmissionUseFormReturn = UseFormReturn<AdmissionFormInput, unknown, AdmissionFormValues>;

export const admissionFormDefaultValues: AdmissionFormInput = {
  firstName: "",
  lastName: "",
  dob: "" as unknown as AdmissionFormInput["dob"],
  // Empty string (not undefined) so the RadioGroup starts controlled —
  // Base UI warns if a field flips from uncontrolled to controlled later.
  gender: "" as unknown as AdmissionFormInput["gender"],
  mobileNumber: "",
  whatsappNumber: "",
  healthIssues: [],
  healthIssueDetails: "",
  // Default to today — the common case is same-day admission — but the
  // instructor can change it for backdated entries or a future start.
  joiningDate: new Date().toISOString().split("T")[0] as unknown as AdmissionFormInput["joiningDate"],
  paymentReceived: "" as unknown as AdmissionFormInput["paymentReceived"],
  numberOfSessions: "" as unknown as AdmissionFormInput["numberOfSessions"],
  batchId: "",
  photo: undefined,
};
