import { z } from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .refine((val) => val.trim().length > 0, {
      message: "Name cannot be only spaces",
    }),

  email: z.string().email("Invalid email"),

  role: z.enum(["customer", "driver", "sales", "epick"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),

  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Please select your gender" }),
  }),

  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
  ownedVehicles: z.array(z.string()).min(1, "Select at least one vehicle"),
  ownedVehiclesTurm: z
    .array(z.string())
    .min(1, "Select at least one vehicle term"),

  resume: z.instanceof(File).refine((file) => file.size > 0, {
    message: "Please upload a resume file",
  }),
});

export type FormData = z.infer<typeof formSchema>;
