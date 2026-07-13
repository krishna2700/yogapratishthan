import { z } from "zod";
import { GENDER_OPTIONS, HEALTH_ISSUE_VALUES, MOBILE_REGEX } from "./constants";

const genderValues = GENDER_OPTIONS.map((option) => option.value) as [
  (typeof GENDER_OPTIONS)[number]["value"],
  ...(typeof GENDER_OPTIONS)[number]["value"][],
];

const oldestValidDob = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 120);
  return date;
};

/** Treats an empty string (from a not-yet-filled input) as "missing" so it's
 *  cleanly skipped by `.optional()` rather than failing coercion. */
export const blankToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/**
 * Fields shared by the client form and the API payload. Photo handling
 * differs between the two (File on the client, an uploaded URL on the
 * server) so it is layered on separately by each consumer.
 *
 * Only firstName, lastName, and batchId are mandatory — everything else can
 * be filled in later (via edit, or a renewal once payment/session details
 * are known).
 */
export const studentBaseSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z.preprocess(
      blankToUndefined,
      z.coerce
        .date({ error: "Enter a valid date of birth" })
        .max(new Date(), { message: "Date of birth cannot be in the future" })
        .min(oldestValidDob(), { message: "Enter a valid date of birth" })
        .optional(),
    ),
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
    healthIssues: z.array(z.enum(HEALTH_ISSUE_VALUES)).default([]),
    healthIssueDetails: z.string().trim().max(1000).optional().or(z.literal("")),
    joiningDate: z.preprocess(
      blankToUndefined,
      z.coerce.date({ error: "Enter a valid date of joining" }).optional(),
    ),
    paymentReceived: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: "Enter a valid amount" })
        .positive("Payment received must be greater than ₹0")
        .max(10_000_000, "Enter a realistic payment amount")
        .optional(),
    ),
    numberOfSessions: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: "Enter a valid number of sessions" })
        .int("Sessions must be a whole number")
        .positive("Number of sessions must be greater than 0")
        .max(1000, "Enter a realistic number of sessions")
        .optional(),
    ),
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

export type StudentBaseInput = z.infer<typeof studentBaseSchema>;

/** Server-side payload: photo, if provided, has already been uploaded to a URL. */
export const createStudentSchema = studentBaseSchema.and(
  z.object({
    photoUrl: z.string().min(1).optional(),
  }),
);

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
