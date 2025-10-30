export interface ApiProfileResponse {
  C_Number: number;
  C_Address: string;
  C_CigtLicenseNumber: string;
  C_City: string;
  C_CoName: string;
  C_Country: string;
  C_Email: string;
  C_Name: string;
  C_OperationHours1: number;
  C_OperationHours2: number;
  C_OtherLicenseNumber: string;
  C_Phone: string;
  C_PhoneMobile: string;
  C_SalesTaxNumber: string;
  C_State: string;
  C_Zip: string;
  ExpDate_CigtTax: string;
  logo?: string | null;
  ExpDate_OtherTax: string;
  salesRep: {
    S_Desc: string;
  };
}

export interface CompanyDetailsData {
  accountNumber: string;
  storeName: string;
  salesRep: string;
  companyName: string;
  primaryAddress: string;
  city: string;
  county?: string;
  state: string;
  zip: string;
  country: string;
  photoUrl: string;
  logo?: string;
}

export interface ContactData {
  phoneNumber: string;
  email: string;
  altPhone: string;
  storeTiming: string;
  altEmail: string;
  mobileNumber: string;
}

export interface LicenseData {
  licenseExpiry: string;
  licenseType: string;
  salesTaxNumber: string;
  cigaretteLicense: string;
  cigaretteLicenseExpirationDate: string;
  otherLicense1: string;
  otherLicense1ExpirationDate: string;
  taxCode: string;
  taxCodeCountry: string;
  taxCodeCity: string;
  invoiceFormat: string;
}

// Helper function to format empty values
const formatValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

// Helper function to format time range
const formatTimeRange = (start: number, end: number): string => {
  if (start === null || end === null || start === undefined || end === undefined) {
    return "-";
  }
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };
  
  return `${formatHour(start)} - ${formatHour(end)}`;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString || dateString === "") {
    return "-";
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return "-";
  }
};

export const mapApiToCompanyDetails = (apiData: ApiProfileResponse): CompanyDetailsData => {
  return {
    accountNumber: formatValue(apiData.C_Number), // Not provided in API
    storeName: formatValue(apiData.C_Name),
    salesRep: formatValue(apiData.salesRep?.S_Desc),
    companyName: formatValue(apiData.C_CoName),
    primaryAddress: formatValue(apiData.C_Address),
    city: formatValue(apiData.C_City),
    state: formatValue(apiData.C_State),
    zip: formatValue(apiData.C_Zip),
    country: formatValue(apiData.C_Country),
    photoUrl: "https://via.placeholder.com/64",
    logo: apiData.logo || ""
  };
};

export const mapApiToContactData = (apiData: ApiProfileResponse): ContactData => {
  return {
    phoneNumber: formatValue(apiData.C_Phone),
    email: formatValue(apiData.C_Email),
    altPhone: "-", // Not provided in API
    storeTiming: formatTimeRange(apiData.C_OperationHours1, apiData.C_OperationHours2),
    altEmail: "-", // Not provided in API
    mobileNumber: formatValue(apiData.C_PhoneMobile)
  };
};

export const mapApiToLicenseData = (apiData: ApiProfileResponse): LicenseData => {
  return {
    licenseExpiry: "-", // Not provided in API
    licenseType: "-", // Not provided in API
    salesTaxNumber: formatValue(apiData.C_SalesTaxNumber),
    cigaretteLicense: formatValue(apiData.C_CigtLicenseNumber),
    cigaretteLicenseExpirationDate: formatDate(apiData.ExpDate_CigtTax),
    otherLicense1: formatValue(apiData.C_OtherLicenseNumber),
    otherLicense1ExpirationDate: formatDate(apiData.ExpDate_OtherTax),
    taxCode: "-", // Not provided in API
    taxCodeCountry: "-", // Not provided in API
    taxCodeCity: "-", // Not provided in API
    invoiceFormat: "-" // Not provided in API
  };
}; 