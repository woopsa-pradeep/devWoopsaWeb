import { z } from 'zod';

// Helper to allow both string and number input, parses to number
function numberOrStringNumber(minValue = 0, errorMsg = 'Must be a number and at least ' + minValue) {
  return z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: 'Must be a number',
  }).min(minValue, errorMsg);
}

export const vendorSchema = z.object({
  V_Description: z.string().min(1, 'Company Name is required'),
  V_Addr1: z.string().min(1, 'Address Line 1 is required'),
  V_Addr2: z.string(),
  V_City: z.string().min(1, 'City is required'),
  V_State: z.string()
    .min(1, 'State is required')
    .length(2, 'State must be exactly 2 characters')
    .regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters (e.g., TN)'),
  V_Zip: z.string()
    .min(1, 'Zip Code is required')
    .max(10, 'Zip Code must be maximum 10 characters')
    .regex(/^[0-9-]+$/, 'Zip Code can only contain numbers and hyphens'),
  V_Country: z.string(),
  AddressType: numberOrStringNumber(0),
  V_Phone: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty
      if (val.length > 12) return false; // Max length check
      return /^\+?[0-9]{1,12}$/.test(val); // Format validation only when value exists
    }, {
      message: 'Phone Number must start with + followed by numbers (max 12 characters)'
    }),
  V_Fax: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty
      if (val.length > 12) return false; // Max length check
      return /^\+?[0-9]{1,12}$/.test(val); // Format validation only when value exists
    }, {
      message: 'Fax Number must start with + followed by numbers (max 12 characters)'
    }),
  V_Broker: z.string(),
  V_Broker_Rep: z.string(),
  V_Broker_Phone: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty
      if (val.length > 12) return false; // Max length check
      return /^\+?[0-9]{1,12}$/.test(val); // Format validation only when value exists
    }, {
      message: 'Broker Phone Number must start with + followed by numbers (max 12 characters)'
    }),
  V_Broker_Fax: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty
      if (val.length > 12) return false; // Max length check
      return /^\+?[0-9]{1,12}$/.test(val); // Format validation only when value exists
    }, {
      message: 'Broker Fax Number must start with + followed by numbers (max 12 characters)'
    }),
  V_MinOrder_Weight: numberOrStringNumber(0).max(999999, 'Minimum Order Weight must be maximum 6 digits'),
  V_MinOrder_Dollars: numberOrStringNumber(0).max(999999, 'Minimum Order Dollars must be maximum 6 digits'),
  V_MinOrder_Cases: numberOrStringNumber(0).max(9999, 'Minimum Order Cases must be maximum 4 digits'),
  V_Terms: z.string(),
  V_AccountNumber: z.string(),
  V_EFT: z.string(),
  V_Comment: z.string(),
  V_Backorders: numberOrStringNumber(0),
  V_BackorderAmount: numberOrStringNumber(0),
  V_BillTo_Name: z.string(),
  V_BillTo_Addr1: z.string(),
  V_BillTo_Addr2: z.string(),
  V_BillTo_City: z.string(),
  V_BillTo_State: z.string(),
  V_BillTo_Zip: z.string(),
  V_BillTo: numberOrStringNumber(0),
  V_PurchasesMTD: numberOrStringNumber(0),
  V_PurchasesYTD: numberOrStringNumber(0),
  V_Order_Interval: numberOrStringNumber(0),
  V_Lead_Time: numberOrStringNumber(0),
  V_Email: z.string().email('Invalid email address').or(z.literal('')),
  Pad_Pct: numberOrStringNumber(0),
  Vendor_Group: numberOrStringNumber(0),
  FTP_Host: z.string(),
  FTP_User: z.string(),
  FTP_Password: z.string(),
  FTP_Directory: z.string(),
  QB_Name: z.string(),
  V_Order_IntervalDays: numberOrStringNumber(0),
  V_Lead_TimeDays: numberOrStringNumber(0),
  V_PO_OutputFormat: numberOrStringNumber(0),
  V_PO_OutputFolder: z.string(),
  Jurisdiction_State: z.string(),
  Jurisdiction_County: z.string(),
  Jurisdiction_City: z.string(),
  V_TID: z.string(),
  V_FEIN: z.string(),
  V_Status: z.string(),
  Taxes_Prepaid: numberOrStringNumber(0),
  PrepaidTax_Calculation_Select: z.string(),
  MSA_Status: z.string(),
  First_Importer: numberOrStringNumber(0),
  TaxPaid_State: z.string(),
  Foreign_Manufacturer: numberOrStringNumber(0),
  V_PO_InputFormat: numberOrStringNumber(0),
  V_PO_InputFolder: z.string(),
  QB_TaxVendor: z.string(),
  OTP_TaxReverseOnEntry: numberOrStringNumber(0),
  Buyer_ID: z.string(),
  V_PO_InputOption: numberOrStringNumber(0),
  FTP_Protocol: numberOrStringNumber(0),
  FTP_Mode: numberOrStringNumber(0),
  FTP_FileExt: z.string(),
  V_FullCase: z.string().refine((val) => ['S', 'A', 'N'].includes(val), {
    message: 'Full Case must be S, A, or N'
  }),
  V_Inactive: numberOrStringNumber(0),
  V_EmailSend: numberOrStringNumber(0),
  V_PO_ReportFormat: z.string(),
  V_PrimarySupplier: numberOrStringNumber(0),
  V_PurchaseSchedule: numberOrStringNumber(0),
  TermsCode: z.string(),
  V_ReturnStatus: z.string().refine((val) => ['S', 'N', 'A'].includes(val), {
    message: 'Return Status must be S, N, or A'
  }),
  V_BackorderStatus: z.string().nullable(),
  Product_ExpDays: numberOrStringNumber(0),
  ExpDate_License: z.string(),
  V_MinOrder_Pallets: numberOrStringNumber(0).max(999, 'Minimum Order Pallets must be maximum 3 digits'),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

