import { z } from "zod";
import { GENDER_OPTIONS, HEALTH_ISSUE_VALUES, MOBILE_REGEX } from "@/features/student-admission/constants";

const genderValues = GENDER_OPTIONS.map((option) => option.value) as [
  (typeof GENDER_OPTIONS)[number]["value"],
  ...(typeof GENDER_OPTIONS)[number]["value"][],
];

const oldestValidDob = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 120);
  return date;
};

/**
 * The public self-admission form (/apply). Unlike the admin's quick-add
 * form (studentBaseSchema, mostly optional), everything here is mandatory
 * except the photo and Aadhar uploads — the applicant is filling this in
 * themselves, so there's no reason to let it through half-empty. Batch
 * assignment and admission details (payment, session count, joining date)
 * are deliberately absent — those are always filled in by the admin at
 * accept time.
 */
export const admissionRequestBaseSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z.coerce
      .date({ error: "Enter a valid date of birth" })
      .max(new Date(), { message: "Date of birth cannot be in the future" })
      .min(oldestValidDob(), { message: "Enter a valid date of birth" }),
    gender: z.enum(genderValues, { error: "Please select a gender" }),
    mobileNumber: z.string().trim().regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number"),
    whatsappNumber: z.string().trim().regex(MOBILE_REGEX, "Enter a valid 10-digit WhatsApp number"),
    healthIssues: z.array(z.enum(HEALTH_ISSUE_VALUES)).default([]),
    healthIssueDetails: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.healthIssues.includes("OTHER") && !data.healthIssueDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["healthIssueDetails"],
        message: "Please describe the health issue",
      });
    }
  });

export type AdmissionRequestBaseInput = z.infer<typeof admissionRequestBaseSchema>;

/** Server-side payload: photo/Aadhar, if provided, have already been uploaded to a URL. */
export const createAdmissionRequestSchema = admissionRequestBaseSchema.and(
  z.object({
    photoUrl: z.string().min(1).optional(),
    aadharUrl: z.string().min(1).optional(),
  }),
);

export type CreateAdmissionRequestInput = z.infer<typeof createAdmissionRequestSchema>;
