import { z } from 'zod';

// Helper to allow both string ("1.2", "3") and number (1.2, 3) input, parses to number and checks min
function numberOrStringNumber(minValue = 0, errorMsg = 'Must be a number and at least ' + minValue) {
  return z.coerce.number({
    required_error: errorMsg,
    invalid_type_error: 'Must be a number',
  }).min(minValue, errorMsg);
}

export const inventorySchema = z.object({
  Sales_Category: z.string().refine((val) => val !== '', 'Sales Category is required'),
  Price_Class: z.string(),
  Price_Subclass: z.string(),
  OTP_Number: numberOrStringNumber(0),
  Description: z.string().min(1, 'Description is required'),
  Pack: numberOrStringNumber(1, 'Pack must be at least 1'),
  UOM: z.string().min(1, 'UOM is required'),
  Section: z.string(),
  Location: numberOrStringNumber(0),
  Section2: z.string(),
  Location2: numberOrStringNumber(0),
  PickArea: z.string(),
  BaseCost: numberOrStringNumber(0),
  NetCost: numberOrStringNumber(0),
  Invoice_Cost: numberOrStringNumber(0),
  AvgCost: numberOrStringNumber(0),
  Price1: z.union([
    z.string().min(1, 'Price 1 is required'),
    z.number()
  ]).refine((val) => {
    if (typeof val === 'string') {
      return val.trim() !== '';
    }
    return val !== null && val !== undefined;
  }, 'Price 1 is required').transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    }
    return val;
  }).refine((val) => {
    return val > 0;
  }, 'Price 1 must be greater than 0') as z.ZodType<number>,
  Price2: numberOrStringNumber(0),
  Price3: numberOrStringNumber(0),
  Price4: numberOrStringNumber(0),
  Price5: numberOrStringNumber(0),
  Price6: numberOrStringNumber(0),
  Retail1: numberOrStringNumber(0),
  Retail2: numberOrStringNumber(0),
  Retail3: numberOrStringNumber(0),
  Primary_Vendor: z.string(),
  CaseCount: numberOrStringNumber(0),
  CaseWeight: numberOrStringNumber(0),
  Sequence: numberOrStringNumber(0),
  Case_Discounts: z.boolean(),
  ShortOrderForm: z.boolean(),
  PriceBook_Include: z.boolean(),
  Cig_Pack: z.string(),
  Cig_Sticks: numberOrStringNumber(0),
  Cig_PremDisc_Code: z.string(),
  AltDesc: z.string().max(50, 'Alternative Description must be 50 characters or less'),
  Item_Message: z.string().max(50, 'Item Message must be 50 characters or less'),
  I_Cube: numberOrStringNumber(0),
  DepositAmount: numberOrStringNumber(0),
  CaseDiscount_Pct: numberOrStringNumber(0),
  Project_Identifier: z.string(),
  UnitOunces: numberOrStringNumber(0),
  Reorder_Level: numberOrStringNumber(0),
  HeadingFlag: z.boolean(),
  Unit_Upcharge: numberOrStringNumber(0),
  Unit_Price: numberOrStringNumber(0),
  I_WeightRate: numberOrStringNumber(0),
  Vendor_ItemNumberAlpha: z.string(),
  Reorder_Qty: numberOrStringNumber(0),
  MSA_Category_Code: z.string(),
  I_Inactive: z.boolean(),
  MSA_Description: z.string(),
  ALT_Description2: z.string(),
  Manufacturer: z.coerce.string(),
  Breakable: z.boolean(),
  I_SalesTaxSelect: z.string(),
  I_NeverDiscount: z.boolean(),
  BumpToMinimum: numberOrStringNumber(0),
  NACS: z.string(),
  NACS_Unit: z.string(),
  Brand_ID: z.string(),
  MinimumQTY: numberOrStringNumber(0),
  MaximumQTY: numberOrStringNumber(0),
  SpecialTaxUnits: numberOrStringNumber(0),
  ExclusionGroup_ID: z.string(),
  RetailPct1: numberOrStringNumber(0),
  RetailPct2: numberOrStringNumber(0),
  RetailPct3: numberOrStringNumber(0),
  OnHand_Maximum: numberOrStringNumber(0),
  CaseLength: numberOrStringNumber(0),
  CaseWidth: numberOrStringNumber(0),
  CaseHeight: numberOrStringNumber(0),
  CasesPerPallet: numberOrStringNumber(0),
  I_PrepaidStatus: z.boolean(),
  Jurisdiction_State: z.coerce.string(),
  Jurisdiction_County: z.coerce.string(),
  Jurisdiction_City: z.coerce.string(),
  Inactive_Date: z.string().nullable(),
  EBT: z.boolean(),
  Lot_ID: numberOrStringNumber(0),
  I_ReturnStatus: z.string(),
  Item_GroupID: z.string(),
  FrozenFlag: z.boolean(),
  CoolerFlag: z.boolean(),
  HazMatFlag: z.boolean(),
  StandardUnitDescription: z.string(),
  Cig_Promo_Code: z.string(),
  MSA_Promotion: z.string(),
  MSA_Promotion_Code: z.string(),
  MSA_Component: z.boolean(),
  I_Discontinued: z.boolean(),
  Points: z.coerce.number({
    required_error: 'Points is required',
    invalid_type_error: 'Must be a number',
  }).min(0, 'Points must be at least 0').refine((val) => {
    // Check if the number has at most 5 digits
    const numStr = Math.abs(val).toString();
    return numStr.length <= 5;
  }, 'Points cannot have more than 5 digits'),
  PriceCostModifiedDate: z.string().nullable(),
  PriceCostModifiedUser: numberOrStringNumber(0),
  Track_ExpirationDate: z.boolean(),
  Track_LotRef: z.boolean(),
  MinimumStockAvailability: numberOrStringNumber(0),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
