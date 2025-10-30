import { z } from "zod";

export const customerLimitSchema = z.object({
  maxOrderLimit: z
    .number()
    .min(0, "Max order limit must be 0 or greater")
    .max(999999, "Max order limit must be less than 999,999"),
  
  minOrderAmount: z
    .number()
    .min(0, "Min order amount must be 0 or greater")
    .max(999999.99, "Min order amount must be less than 999,999.99"),
});

export type CustomerLimitFormData = z.infer<typeof customerLimitSchema>; 