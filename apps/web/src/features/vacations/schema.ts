import { z } from "zod";

export const vacationSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(1, "Please provide a reason").max(200),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type VacationInput = z.infer<typeof vacationSchema>;
