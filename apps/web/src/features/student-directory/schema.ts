import { z } from "zod";
import { GENDER_OPTIONS, HEALTH_ISSUE_VALUES, MOBILE_REGEX } from "@/features/student-admission/constants";
import { blankToUndefined } from "@/features/student-admission/schema";

const genderValues = GENDER_OPTIONS.map((option) => option.value) as [
  (typeof GENDER_OPTIONS)[number]["value"],
  ...(typeof GENDER_OPTIONS)[number]["value"][],
];

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z.preprocess(blankToUndefined, z.coerce.date({ error: "Enter a valid date of birth" }).optional()),
    gender: z.preprocess(blankToUndefined, z.enum(genderValues, { error: "Please select a gender" }).optional()),
    mobileNumber: z.preprocess(
      blankToUndefined,
      z.string().trim().regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number").optional(),
    ),
    whatsappNumber: z
      .string()
      .trim()
      .regex(MOBILE_REGEX, "Enter a valid 10-digit WhatsApp number")
      .optional()
      .or(z.literal("")),
    photoUrl: z.string().min(1).optional(),
    healthIssues: z.array(z.enum(HEALTH_ISSUE_VALUES)).default([]),
    healthIssueDetails: z.string().trim().max(1000).optional().or(z.literal("")),
    batchId: z.string().min(1, "Please assign a batch"),
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

export type UpdateStudentFormInput = z.input<typeof updateStudentSchema>;
export type UpdateStudentSchemaInput = z.output<typeof updateStudentSchema>;
