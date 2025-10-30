import { z } from 'zod';

export const createRetailerRequestSchema = z.object({
  business_name: z.string().trim().min(1, 'Business name cannot be empty'),
  dba_name: z.string().trim().optional().nullable(),
  business_type: z.enum(['SOLE_PROP', 'PARTNERSHIP', 'LLC', 'CORP', 'OTHER'], {
    errorMap: () => ({ message: 'Business type must be one of: SOLE_PROP, PARTNERSHIP, LLC, CORP, OTHER' })
  }),
  federal_ein: z.string().max(15, 'Federal EIN cannot exceed 15 characters').optional().nullable(),
  ownership_type: z.string().trim().optional().nullable(),
  primary_contact: z.string().trim().min(1, 'Primary contact cannot be empty'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  email: z.string().email('Email must be a valid email address').min(1, 'Email is required'),
  website: z.string().trim().optional().nullable(),
  physical_street: z.string().trim().min(1, 'Physical street address cannot be empty'),
  physical_city: z.string().trim().min(1, 'Physical city cannot be empty'),
  physical_state: z.string().length(2, 'Physical state must be exactly 2 characters'),
  physical_zip: z.string().trim().min(1, 'Physical ZIP code cannot be empty'),
  physical_county: z.string().trim().optional().nullable(),
  mailing_same_as_physical: z.boolean().default(false),
  mailing_street: z.string().trim().optional().nullable(),
  mailing_city: z.string().trim().optional().nullable(),
  mailing_state: z.string().trim().optional().nullable(),
  mailing_zip: z.string().trim().optional().nullable(),
  sales_tax_id: z.string().trim().min(1, 'Sales Tax ID is required'),
  state_tobacco_license: z.string().trim().optional().nullable(),
  federal_tobacco_permit: z.string().trim().optional().nullable(),
  resale_certificate_url: z.custom<File>().nullable(),
  state_tobacco_license_url: z.custom<File>().nullable(),
  business_license_url: z.custom<File>().nullable(),
  owner_government_id_url: z.custom<File>().nullable(),
  owners: z.array(z.object({
    fullName: z.string().trim().min(1, 'Owner full name cannot be empty'),
    title: z.string().trim().optional().nullable(),
    ownership: z.string().optional().nullable(),
    dateOfBirth: z.string().trim().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Date of birth must be a valid ISO date (YYYY-MM-DD)'
    }).optional().nullable(),
    email: z.string().trim().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Owner email must be a valid email address'
    }).optional().nullable(),
    homeAddress: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable()
  })).min(1, 'At least one owner is required'),
  credit_limit_requested: z.boolean().default(false),
  bank_name: z.string().trim().optional().nullable(),
  bank_account_last4: z.string().trim().optional().nullable(),
  references: z.array(z.object({
    company: z.string().trim().min(1, 'Reference company cannot be empty'),
    contact: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Reference email must be a valid email address'
    }).optional().nullable()
  })).default([]),
  preferred_delivery_time: z.string().trim().optional().nullable(),
  special_delivery_instructions: z.string().trim().optional().nullable(),
  compliance_certification: z.boolean().refine((val) => val === true, {
    message: 'You must certify compliance with tobacco laws'
  }),
  authorized_signature: z.string().trim().min(1, 'Authorized signature is required'),
  signature_date: z.string().min(1, 'Signature date is required')
}).refine((data) => {
  // Conditional validation: if credit_limit_requested is true, bank fields are required
  if (data.credit_limit_requested) {
    if (!data.bank_name?.trim()) {
      return false;
    }
    if (!data.bank_account_last4?.trim()) {
      return false;
    }
    if (data.bank_account_last4.length !== 4) {
      return false;
    }
  }
  return true;
}, {
  message: "Bank name and account are required when requesting credit limit",
  path: ["credit_limit_requested"]
}).refine((data) => {
  // Validate bank name when credit limit is requested
  if (data.credit_limit_requested && !data.bank_name?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Bank name is required when requesting credit limit",
  path: ["bank_name"]
}).refine((data) => {
  // Validate bank account when credit limit is requested
  if (data.credit_limit_requested && !data.bank_account_last4?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Bank account last 4 digits are required when requesting credit limit",
  path: ["bank_account_last4"]
}).refine((data) => {
  // Validate bank account format when credit limit is requested
  if (data.credit_limit_requested && data.bank_account_last4 && data.bank_account_last4.length !== 4) {
    return false;
  }
  return true;
}, {
  message: "Bank account last 4 digits must be exactly 4 characters",
  path: ["bank_account_last4"]
}).refine((data) => {
  // Conditional validation: if mailing address is different from physical, mailing fields are required
  if (!data.mailing_same_as_physical) {
    if (!data.mailing_street?.trim()) {
      return false;
    }
    if (!data.mailing_city?.trim()) {
      return false;
    }
    if (!data.mailing_zip?.trim()) {
      return false;
    }
    // Only validate mailing state if it has a value and mailing address is different from physical
    if (data.mailing_state && data.mailing_state.trim()) {
      if (data.mailing_state.length !== 2) {
        return false;
      }
    }
  }
  return true;
}, {
  message: "Mailing address fields are required when mailing address is different from physical address",
  path: ["mailing_same_as_physical"]
});

export type CreateRetailerRequestType = z.infer<typeof createRetailerRequestSchema>;



export const retailerRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW']),
  notes: z.string().trim().optional()
});

export type RetailerRequestStatusType = z.infer<typeof retailerRequestStatusSchema>;
