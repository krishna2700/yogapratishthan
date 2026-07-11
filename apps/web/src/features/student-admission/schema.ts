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

/** Treats an empty string (from a not-yet-filled input) as "missing" so the
 *  usual required_error fires instead of a confusing coercion failure. */
const blankToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/** Zod v4's unified `error` callback: distinguishes a missing value from an
 *  invalid one so each gets its own friendly message. */
const requiredOr = (requiredMessage: string, invalidMessage: string) => (issue: { input?: unknown }) =>
  issue.input === undefined ? requiredMessage : invalidMessage;

/**
 * Fields shared by the client form and the API payload. Photo handling
 * differs between the two (File on the client, an uploaded URL on the
 * server) so it is layered on separately by each consumer.
 */
export const studentBaseSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z.preprocess(
      blankToUndefined,
      z.coerce
        .date({ error: requiredOr("Date of birth is required", "Enter a valid date of birth") })
        .max(new Date(), { message: "Date of birth cannot be in the future" })
        .min(oldestValidDob(), { message: "Enter a valid date of birth" }),
    ),
    gender: z.enum(genderValues, { error: "Please select a gender" }),
    mobileNumber: z
      .string()
      .trim()
      .regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number"),
    whatsappNumber: z
      .string()
      .trim()
      .regex(MOBILE_REGEX, "Enter a valid 10-digit WhatsApp number")
      .optional()
      .or(z.literal("")),
    healthIssues: z.array(z.enum(HEALTH_ISSUE_VALUES)).default([]),
    healthIssueDetails: z.string().trim().max(1000).optional().or(z.literal("")),
    paymentReceived: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: requiredOr("Payment received is required", "Enter a valid amount") })
        .positive("Payment received must be greater than ₹0")
        .max(10_000_000, "Enter a realistic payment amount"),
    ),
    numberOfSessions: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({
          error: requiredOr("Number of sessions is required", "Enter a valid number of sessions"),
        })
        .int("Sessions must be a whole number")
        .positive("Number of sessions must be greater than 0")
        .max(1000, "Enter a realistic number of sessions"),
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

/** Server-side payload: photo has already been uploaded to a URL. */
export const createStudentSchema = studentBaseSchema.and(
  z.object({
    photoUrl: z.string().min(1, "Student photo is required"),
  }),
);

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
