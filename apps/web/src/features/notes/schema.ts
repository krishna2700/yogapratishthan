import { z } from "zod";

export const NOTE_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "HEALTH", label: "Health" },
  { value: "SCHEDULING", label: "Scheduling" },
  { value: "PAYMENT", label: "Payment" },
  { value: "OTHER", label: "Other" },
] as const;

export const addNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(2000),
  category: z.enum(NOTE_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;
