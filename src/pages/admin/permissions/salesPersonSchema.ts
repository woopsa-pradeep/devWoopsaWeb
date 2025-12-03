import { z } from "zod";

export const salesPersonSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  
  role: z
    .string()
    .min(1, "Role is required"),
  
  userNumber: z
    .string()
    .min(1, "User number is required"),
  
  salesRepNumber: z
    .array(z.string())
    .optional(),
  
  status: z.boolean(),
}).refine((data) => {
  // If role is not 'epick', salesRepNumber is required
  if (data.role !== 'epick') {
    return data.salesRepNumber && data.salesRepNumber.length > 0;
  }
  return true;
}, {
  message: "Sales rep number is required",
  path: ["salesRepNumber"],
});

export type SalesPersonFormData = z.infer<typeof salesPersonSchema>;

// Dropdown options
export const roleOptions = [
  { label: "Sales Representative", value: "sales"},
  { label: "E-pick", value: "epick"}
];