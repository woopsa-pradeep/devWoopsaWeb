export interface SalesPerson {
  id: number;
  email: string;
  status: boolean;
  firstName: string;
  lastName: string;
  role: string;
  userNumber: string;
  salesRepNumber: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  setUserDiscountLimit?: number;
  userLimit?: number; // User discount limit
  allowDiscount?: boolean;
  salesRep?: {
    S_Number: number;
    S_Desc: string;
  }[];
} 