import React, { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  useMediaQuery,
  Typography,
  TextField,
  useTheme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  getWarehouseSetting,
  updateSalesRepSetting,
  updateItemGlobalSetting,
  updateRetailerSetting,
  updateWarehouseProfileSetting,
  getHomeSetting,
  updateHomeSetting,
  createContactUs,
  getAllContactUs,
  updateContactUs,
  createEmailManagement,
  getEmailManagement,
  updateEmailManagement,
  testEmailManagement,
  createErpUser,
  updateErpUser,
  getErpUsers,
  getDrivers,
  createDriver,
  updateDriver,
  getVehicles,
  createVehicle,
  updateVehicle,
} from "../../../redux/apis/distrubutor/settingApis";
import SwitchInput from "../../atoms/SwitchInput";
import CustomButton from "../../atoms/CustomButton";
import TimeSlotPicker from "../../atoms/TimeSlotPicker";
import TextInput from "../../atoms/TextInput";
import CommonTable from "../../atoms/Table/CommonTable";
import CommonModal from "../../atoms/CommonModal";
import { showSuccessToast, showErrorToast } from "../../../utils/toastUtils";
// import salesRepIcon from '../../../assets/salesrep.svg';
import salesRepActiveIcon from "../../../assets/salesrepactive.svg";
// import itemsIcon from '../../../assets/itemsGlobal.svg';
import itemsActiveIcon from "../../../assets/itemsGlobalActive.svg";
// import retailersIcon from '../../../assets/retailersGlobal.svg';
import retailersActiveIcon from "../../../assets/retailerGlobalActive.svg";
// import warehouseIcon from '../../../assets/retailersGlobal.svg';
import warehouseActiveIcon from "../../../assets/retailerGlobalActive.svg";
// Placeholder icons - replace with actual demanded items icons
// import demandedItemsIcon from '../../../assets/privacyPolicy (2).svg';
import demandedItemsActiveIcon from "../../../assets/privacyPolicyActive.svg";
// Contact Us icons - using phone call icon
import contactUsIcon from "../../../assets/phoneCall.svg";
// import contactUsActiveIcon from '../../../assets/Call_White.svg';
import emailIcon from "../../../assets/email_1.svg";
// import emailActiveIcon from '../../../assets/Email_White.svg';
import userIcon from "../../../assets/icons/user_1.svg";
import userActiveIcon from "../../../assets/icons/user_1.svg";
import PromotedItemsSelector from "./PromotedItemsSelector";
import { TableColumn } from "../../atoms/Table/CommonTable";
import PicklistTemplateTab from "../../../pages/admin/settings/PicklistTemplateTab";
import InventorySettings from "../../../pages/admin/settings/InventorySettings";
// import InvoiceTemplateTab from '../../../pages/admin/settings/InvoiceTemplateTab';
// import InvoiceTemplateTab from '../../../pages/admin/settings/InvoiceTemplateTab';
import EmailConfigurationTab from "../../../pages/admin/settings/EmailConfigurationTab";
import dayjs, { Dayjs } from "dayjs";
import CustomDatePicker from "../../atoms/CustomDatePicker"; // adjust path if needed
import { uploadImages } from "../../../redux/apis/distrubutor/retailerApis";


interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DayTimeSlots {
  day: string;
  timeSlots: TimeSlot[];
}

interface SettingsData {
  id: number;
  salesRep: {
    showStock: boolean;
    viewAccountReceivable: boolean;
    allowOrderInventoryUnAvaible: boolean;
    showWithOutPrice: boolean;
  };
  itemGlobal: {
    maxOrderLimit: number;
    InventoryThreshold: number;
    MiniMumOrderAmount: number;
  };
  showWithPerpaidTax: boolean;
  retailer: {
    showStock: boolean;
    allowOrderInventoryUnAvaible: boolean;
    showWithOutPrice: boolean;
  };
  warehouseProfile: {
    email: string;
    cutOffTime: string;
    storePickup: boolean;
    warehouseImage: string;
    timeSlots?: DayTimeSlots[];
    globalSearchOption?: boolean;
    splitSearchOption?: boolean;
  };
  demandedItems: {
    showMostSale: boolean;
    showAsPerCustomer: boolean;
    showCustomerHistory: boolean;
    showPromotedItems: boolean;
    maxPromotedItems: number;
    promotedItems: string[];
  };
  orderEmailNotification?: string | null;
  warehouseImage?: string;
}

interface ContactUsData {
  id: any;
  PhoneNO: string;
  WhatupNo: string;
  EmailAdd: string;
  Fax: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailManagementData {
  id: any;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ErpUserData {
  id?: any;
  UserNumber?: number;
  UserID: string;
  UserName: string;
  UserPassword: string;
  UserGroup?: number;
  UserIsPicker?: boolean;
  UserIsChecker?: boolean;
  UserIsAdmin?: boolean;
  UserIsEpickAdmin?: boolean;
  UserIsActive: boolean | number;
  createdAt?: string;
  updatedAt?: string;
}

interface DriverData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  isActive: boolean;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  driverLicenseNo?: string | null;
  licenseExpirationDate?: string | null;
  licenseClass?: "A" | "B" | "C" | "D" | null;
  driverPicture?: string | null;
  dotMedicalCertificate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface VehicleData {
  id?: number;
  description?: string;
  loadCapacityLbs?: number;
  truckType?: string;
  licenseRegistrationNumber?: string;
  vinNumber?: string;
  engineType?: "gasoline" | "electric" | "diesel";
  lastServiceDate?: string;
  lastOilChangeDate?: string;
  nextOilChangeAfterMonths?: number;
  mileageHours?: number;
  insurancePolicyNumber?: string;
  insuranceCarrier?: string;
  insuranceExpirationDate?: string;
  conditionStatus?: string;
  physicalNotes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  salesRep: {
    showStock: boolean;
    viewAccountReceivable: boolean;
    allowOrderInventoryUnAvaible: boolean;
    showWithOutPrice: boolean;
  };
  itemGlobal: {
    maxOrderLimit: number;
    InventoryThreshold: number;
    MiniMumOrderAmount: number;
  };
  showWithPerpaidTax: boolean;
  globalSearchOption: boolean;
  splitSearchOption: boolean;
  retailer: {
    showStock: boolean;
    allowOrderInventoryUnAvaible: boolean;
    showWithOutPrice: boolean;
  };
  warehouseProfile: {
    cutOffTime: string;
    storePickup: boolean;
    allowShipping: boolean;
    timeSlots?: DayTimeSlots[];
  };
  orderEmailNotification?: string;
  demandedItems: {
    showMostSale: boolean;
    showAsPerCustomer: boolean;
    showCustomerHistory: boolean;
    showPromotedItems: boolean;
    maxPromotedItems: number;
    promotedItems: string[];
  };
}

const homeSettingsSchema = z.object({
  showMostSale: z.boolean(),
  showAsPerCustomer: z.boolean(),
  showCustomerHistory: z.boolean(),
  showPromotedItems: z.boolean(),
  maxPromotedItems: z.number().min(0).optional(),
  promotedItems: z.array(z.string()).optional(),
});

const contactUsSchema = z.object({
  PhoneNO: z.string().min(1, "Phone number is required"),
  WhatupNo: z.string().min(1, "WhatsApp number is required"),
  EmailAdd: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  Fax: z.string().min(1, "Fax number is required"),
  id: z.number().optional(),
});

const emailManagementSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1, "Port is required"),
  secure: z.boolean(),
  username: z
    .string()
    .min(1, "Username is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z
    .string()
    .min(1, "From email is required")
    .email("Please enter a valid email address"),
  fromName: z.string().min(1, "From name is required"),
  id: z.number().optional(),
});

const erpUserSchema = z.object({
  UserID: z
    .string()
    .min(3, "User ID must be at least 3 characters")
    .max(5, "User ID must be at most 5 characters"),
  UserName: z
    .string()
    .min(1, "User Name is required")
    .max(50, "User Name must be at most 50 characters"),
  UserPassword: z
    .string()
    .min(3, "User Password must be at least 3 characters")
    .max(5, "User Password must be at most 5 characters"),
  UserIsActive: z.number().min(0).max(1),
  id: z.number().optional(),
});

const driverSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  password: z
  .string()
  .optional()
  .refine(
    (val) => !val || val.length >= 6,
    "Password must be at least 6 characters"
  ),
  driverLicenseNo: z.string().optional(),
  licenseExpirationDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return dayjs(val).isValid();
      },
      { message: "Invalid expiration date" }
    ),
  licenseClass: z.enum(["A", "B", "C", "D"]).optional(),
  driverPicture: z.string().optional(),
  dotMedicalCertificate: z.string().optional(),

  // currentLatitude: z
  //   .number({ invalid_type_error: "Latitude must be a number" })
  //   .min(-90, "Min -90")
  //   .max(90, "Max 90")
  //   .optional(),

  // currentLongitude: z
  //   .number({ invalid_type_error: "Longitude must be a number" })
  //   .min(-180, "Min -180")
  //   .max(180, "Max 180")
  //   .optional(),

  isActive: z.boolean(),
});

const vehicleSchema = z.object({
  description: z.string().optional(),

  loadCapacityLbs: z
    .number({ invalid_type_error: "Must be number" })
    .positive("Must be positive")
    .optional(),

  truckType: z.string().optional(),
  licenseRegistrationNumber: z.string().optional(),
  vinNumber: z.string().optional(),

  engineType: z.enum(["gasoline", "electric", "diesel"]).optional(),

  lastServiceDate: z.string().optional(),
  lastOilChangeDate: z.string().optional(),

  nextOilChangeAfterMonths: z
    .number()
    .positive("Must be positive")
    .optional(),

  mileageHours: z.number().positive().optional(),

  insurancePolicyNumber: z.string().optional(),
  insuranceCarrier: z.string().optional(),
  insuranceExpirationDate: z.string().optional(),

  conditionStatus: z.string().optional(),
  physicalNotes: z.string().optional(),

  isActive: z.boolean(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;
type DriverFormData = z.infer<typeof driverSchema>;
type ContactUsFormData = z.infer<typeof contactUsSchema> & { id?: number };
type EmailManagementFormData = z.infer<typeof emailManagementSchema> & {
  id?: number;
};
type ErpUserFormData = z.infer<typeof erpUserSchema> & { id?: number };

const InventoryHeaderTabs = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%",pt:2 }}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v)}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
        textColor="primary"
        indicatorColor="primary"
        sx={{
          minHeight: 42,
          "& .MuiTab-root": {
            textTransform:"none",
            minHeight: 42,
            fontSize: 15,
            px: 2,
            whiteSpace: "nowrap",
          },
        }}
      >
        <Tab label="Sales Category" />
        <Tab label="Item Groups" />
        <Tab label="Brands" />
        <Tab label="Price Class" />
      </Tabs>
    </Box>
  );
};

const RouteHeaderTabs = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant={isMobile ? "scrollable" : "standard"}
      scrollButtons={isMobile ? "auto" : false}
      allowScrollButtonsMobile
      textColor="primary"
      indicatorColor="primary"
      sx={{
        minHeight: 42,
        "& .MuiTab-root": {
          textTransform: "none",
          fontSize: 15,
          fontWeight: 500,
          minHeight: 42,
          px: 2,
        },
      }}
    >
      <Tab label="Routes" />
      <Tab label="Drivers" />
      <Tab label="Vehicles" />
    </Tabs>
  );
};


const tabConfigs = [
  {
    label: "Sales Rep",
    icon: salesRepActiveIcon,
    activeIcon: salesRepActiveIcon,
    apiType: "salesRep" as const,
  },
  {
    label: "Item Global",
    icon: itemsActiveIcon,
    activeIcon: itemsActiveIcon,
    apiType: "itemGlobal" as const,
  },
  {
    label: "Retailer",
    icon: retailersActiveIcon,
    activeIcon: retailersActiveIcon,
    apiType: "retailer" as const,
  },
  {
    label: "Warehouse Profile",
    icon: warehouseActiveIcon,
    activeIcon: warehouseActiveIcon,
    apiType: "warehouseProfile" as const,
  },
  {
    label: "Demanded Items",
    apiType: "demandedItems" as const,
    icon: demandedItemsActiveIcon,
    activeIcon: demandedItemsActiveIcon,
    schema: homeSettingsSchema,
    // isHomeSettings: true,
    fields: [
      { name: "showMostSale", label: "Show Most Sale", type: "switch" },
      {
        name: "showAsPerCustomer",
        label: "Show As Per Customer",
        type: "switch",
      },
      {
        name: "showCustomerHistory",
        label: "Show Customer History",
        type: "switch",
      },
      {
        name: "showPromotedItems",
        label: "Show Promoted Items",
        type: "switch",
      },
      {
        name: "maxPromotedItems",
        label: "Maximum Promoted Items",
        type: "text",
        controlledBy: "showPromotedItems",
      },
      { name: "promotedItems", label: "Promoted Items", type: "promotedItems" },
    ],
  },
  {
    label: "Contact Us",
    apiType: "contactUs" as const,
    icon: contactUsIcon,
    activeIcon: contactUsIcon,
  },
  {
    label: "Email Configuration",
    apiType: "emailConfiguration" as const,
    icon: emailIcon,
    activeIcon: emailIcon,
  },
  // {
  //   label: "Email Management",
  //   apiType: "emailManagement" as const,
  //   icon: emailIcon,
  //   activeIcon: emailIcon,
  // },
  {
    label: "User",
    apiType: "user" as const,
    icon: userIcon,
    activeIcon: userActiveIcon,
  },
  {
    label: "Picklist Template",
    apiType: "picklistTemplate" as const,
    icon: userIcon, // Using placeholder icon
    activeIcon: userActiveIcon
  },
  // {
  //   label: 'Invoice Template',
  //   apiType: 'invoiceTemplate' as const,
  //   icon: userIcon,
  //   activeIcon: userActiveIcon
  // },
  {
    label: "Inventory",
    apiType: "inventory" as const,
    icon: itemsActiveIcon,
    activeIcon: itemsActiveIcon,
  },
];

interface SettingsTabsProps {
  mode?: "settings" | "driverManagement";
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ mode = "settings" }) => {
  const isDriverManagementMode = mode === "driverManagement";
  const [inventoryTab, setInventoryTab] = useState(0);
  const [routeTab, setRouteTab] = useState(0);
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [homeSettings, setHomeSettings] = useState<any>(null);
  const [contactUsData, setContactUsData] = useState<ContactUsData | null>(
    null,
  );
  const [contactUsLoading, setContactUsLoading] = useState(false);
  const [emailManagementData, setEmailManagementData] =
    useState<EmailManagementData | null>(null);
  const [emailManagementLoading, setEmailManagementLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [erpUsers, setErpUsers] = useState<ErpUserData[]>([]);
  const [erpUsersLoading, setErpUsersLoading] = useState(false);
  const [erpUserModalOpen, setErpUserModalOpen] = useState(false);
  const [selectedErpUser, setSelectedErpUser] = useState<ErpUserData | null>(
    null,
  );
  const [erpUserFormLoading, setErpUserFormLoading] = useState(false);
  // const [contactUsLoadingTab, setContactUsLoadingTab] = useState(false);

 const [drivers, setDrivers] = useState<DriverData[]>([]);
const [driversLoading, setDriversLoading] = useState(false);
const [driverModalOpen, setDriverModalOpen] = useState(false);
const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
const imageInputRef = React.useRef<HTMLInputElement | null>(null);
const certificateInputRef = React.useRef<HTMLInputElement | null>(null);

const [driverImagePreview, setDriverImagePreview] = useState<string | null>(null);
const [driverCertificatePreview, setDriverCertificatePreview] = useState<string | null>(null);

const [vehicles, setVehicles] = useState<VehicleData[]>([]);
const [vehiclesLoading, setVehiclesLoading] = useState(false);
const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
const [searchKeyword, setSearchKeyword] = useState("");
const [selectedRouteFilter, setSelectedRouteFilter] = useState("");
const [selectedDayFilter, setSelectedDayFilter] = useState("");

  // React Hook Form setup
  const contactUsForm = useForm<ContactUsFormData>({
    resolver: zodResolver(contactUsSchema),
    defaultValues: {
      PhoneNO: "",
      WhatupNo: "",
      EmailAdd: "",
      Fax: "",
      id: 0,
    },
  });

  const emailManagementForm = useForm<EmailManagementFormData>({
    resolver: zodResolver(emailManagementSchema),
    defaultValues: {
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
      id: 0,
    },
  });

  const erpUserForm = useForm<ErpUserFormData>({
    resolver: zodResolver(erpUserSchema),
    defaultValues: {
      UserID: "",
      UserName: "",
      UserPassword: "",
      UserIsActive: 1,
      id: 0,
    },
  });

const driverForm = useForm<DriverFormData>({
  resolver: zodResolver(driverSchema),
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    driverLicenseNo: "",
    licenseExpirationDate: "",
    licenseClass: undefined,
    driverPicture: "",
    dotMedicalCertificate: "",
    // currentLatitude: undefined,
    // currentLongitude: undefined,
    isActive: true,
  },
});

const vehicleForm = useForm<VehicleFormData>({
  resolver: zodResolver(vehicleSchema),
  defaultValues: {
    description: "",
    loadCapacityLbs: undefined,
    truckType: "",
    licenseRegistrationNumber: "",
    vinNumber: "",
    lastServiceDate: "",
    lastOilChangeDate: "",
    nextOilChangeAfterMonths: undefined,
    mileageHours: undefined,
    insurancePolicyNumber: "",
    insuranceCarrier: "",
    insuranceExpirationDate: "",
    conditionStatus: "",
    physicalNotes: "",
    isActive: true,
  },
});

  const activeApiType = isDriverManagementMode
    ? ("routeManagement" as const)
    : tabConfigs[tab].apiType;


  // Effect to populate form when contact data is loaded
  useEffect(() => {
    if (activeApiType === "contactUs" && contactUsData?.id) {
      const existingData = contactUsData; // Assuming there's only one contact record
      contactUsForm.reset({
        id: existingData.id,
        PhoneNO: existingData.PhoneNO,
        WhatupNo: existingData.WhatupNo,
        EmailAdd: existingData.EmailAdd,
        Fax: existingData.Fax,
      });
    }
  }, [contactUsData, tab, activeApiType]);

  // Effect to populate email management form when data is loaded
  // useEffect(() => {
  //   if (
  //     tabConfigs[tab].apiType === "emailManagement" &&
  //     emailManagementData?.id
  //   ) {
  //     const existingData = emailManagementData;
  //     emailManagementForm.reset({
  //       id: existingData.id,
  //       host: existingData.host,
  //       port: existingData.port,
  //       secure: existingData.secure,
  //       username: existingData.username,
  //       password: existingData.password,
  //       fromEmail: existingData.fromEmail,
  //       fromName: existingData.fromName,
  //     });
  //   }
  // }, [emailManagementData, tab]);

  // Effect to populate ERP user form when editing
  useEffect(() => {
    if (selectedErpUser) {
      const isActive =
        typeof selectedErpUser.UserIsActive === "boolean"
          ? selectedErpUser.UserIsActive
            ? 1
            : 0
          : selectedErpUser.UserIsActive;
      erpUserForm.reset({
        id: selectedErpUser.id,
        UserID: selectedErpUser.UserID,
        UserName: selectedErpUser.UserName,
        UserPassword: selectedErpUser.UserPassword,
        UserIsActive: isActive,
      });
    } else {
      erpUserForm.reset({
        UserID: "",
        UserName: "",
        UserPassword: "",
        UserIsActive: 1,
        id: 0,
      });
    }
  }, [selectedErpUser]);

// useEffect(() => {
//   if (selectedDriver) {
//     setDriverImagePreview(selectedDriver.driverPicture || null);
//     setDriverCertificatePreview(selectedDriver.dotMedicalCertificate || null);
//   } else {
//     setDriverImagePreview(null);
//     setDriverCertificatePreview(null);
//   }
// }, [selectedDriver]);



  useEffect(() => {
    if (activeApiType === "demandedItems") {
      // Fetch home settings for Demanded Items tab
      getHomeSetting().then((res: any) => {
        setHomeSettings(res.data?.data);
      });
    } else if (activeApiType === "contactUs") {
      // Fetch Contact Us data
      fetchContactUsData();
    // } else if (tabConfigs[tab].apiType === "emailManagement") {
      // Fetch Email Management data
      // fetchEmailManagementData();
    } else if (activeApiType === "user") {
      // Fetch ERP Users data
      fetchErpUsers();
    } else if (activeApiType === "routeManagement") {
      if (routeTab === 1) fetchDrivers();
      if (routeTab === 2) fetchVehicles();
    }

  }, [tab, routeTab, activeApiType]);


  console.log(contactUsData, "contactUsData");
  // Fetch settings on mount and whenever tab changes
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response: any = await getWarehouseSetting();
        const data = response.data?.data;
        setSettings(data);

        // Initialize form data with API values
        if (data) {
          setFormData({
            salesRep: {
              showStock: data.salesRep?.showStock ?? true,
              viewAccountReceivable:
                data.salesRep?.viewAccountReceivable ?? true,
              allowOrderInventoryUnAvaible:
                data.salesRep?.allowOrderInventoryUnAvaible ?? true,
              showWithOutPrice: data.salesRep?.showWithOutPrice ?? false,
            },
            itemGlobal: {
              maxOrderLimit: data.itemGlobal?.maxOrderLimit ?? 100,
              InventoryThreshold: data.itemGlobal?.InventoryThreshold ?? 10,
              MiniMumOrderAmount: data.itemGlobal?.MiniMumOrderAmount ?? 1,
            },
            showWithPerpaidTax: data.showWithPerpaidTax ?? true,
            globalSearchOption: data.globalSearchOption ?? true,
            splitSearchOption: data.splitSearchOption ?? false,
            retailer: {
              showStock: data.retailer?.showStock ?? true,
              allowOrderInventoryUnAvaible:
                data.retailer?.allowOrderInventoryUnAvaible ?? true,
              showWithOutPrice: data.retailer?.showWithOutPrice ?? false,
            },
            warehouseProfile: {
              cutOffTime: data.warehouseProfile?.cutOffTime ?? "17:00:00",
              storePickup: data.warehouseProfile?.storePickup ?? false,
              allowShipping: data.warehouseProfile?.allowShipping ?? true,
              timeSlots: data.warehouseProfile?.timeSlots || [],
            },
            orderEmailNotification: data.orderEmailNotification ?? "",
            demandedItems: {
              showMostSale: data.demandedItems?.showMostSale ?? true,
              showAsPerCustomer: data.demandedItems?.showAsPerCustomer ?? true,
              showCustomerHistory:
                data.demandedItems?.showCustomerHistory ?? true,
              showPromotedItems: data.demandedItems?.showPromotedItems ?? true,
              maxPromotedItems: data.demandedItems?.maxPromotedItems ?? 5,
              promotedItems: data.demandedItems?.promotedItems || [],
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);


useEffect(() => {
  if (!selectedDriver) {
    driverForm.reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      driverLicenseNo: "",
      licenseExpirationDate: "",
      licenseClass: undefined,
      driverPicture: "",
      dotMedicalCertificate: "",
      isActive: true,
    });

    setDriverImagePreview(null);
    setDriverCertificatePreview(null);
    return;
  }

  // RESET FORM VALUES
  driverForm.reset({
    firstName: selectedDriver.firstName ?? "",
    lastName: selectedDriver.lastName ?? "",
    email: selectedDriver.email ?? "",
    password: selectedDriver.password ?? "",
    driverLicenseNo: selectedDriver.driverLicenseNo ?? "",
    licenseExpirationDate: selectedDriver.licenseExpirationDate ?? "",
    licenseClass: selectedDriver.licenseClass ?? undefined,
    driverPicture: selectedDriver.driverPicture ?? "",
    dotMedicalCertificate: selectedDriver.dotMedicalCertificate ?? "",
    isActive: selectedDriver.isActive ?? true,
  });

  // SET IMAGE PREVIEW
  if (selectedDriver.driverPicture) {
    setDriverImagePreview(selectedDriver.driverPicture);
  } else {
    setDriverImagePreview(null);
  }

  // SET CERTIFICATE PREVIEW
  if (selectedDriver.dotMedicalCertificate) {
    setDriverCertificatePreview(selectedDriver.dotMedicalCertificate);
  } else {
    setDriverCertificatePreview(null);
  }

}, [selectedDriver]);

  // Handle field changes
  const handleFieldChange = (
    section: keyof FormData | "",
    field: string,
    value: any,
  ) => {
    if (!formData) return;

    // Handle showWithPerpaidTax as a top-level field
    if (field === "showWithPerpaidTax") {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          showWithPerpaidTax: value,
        };
      });
      return;
    }

    // Handle globalSearchOption and splitSearchOption as mutually exclusive top-level fields (only one true at a time)
    if (field === "globalSearchOption" || field === "splitSearchOption") {
      setFormData((prev) => {
        if (!prev) return prev;
        const globalSearchOption =
          field === "globalSearchOption" ? value : !value;
        const splitSearchOption =
          field === "splitSearchOption" ? value : !value;
        return {
          ...prev,
          globalSearchOption,
          splitSearchOption,
        };
      });
      return;
    }

    // Handle orderEmailNotification as a top-level field
    if (field === "orderEmailNotification") {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orderEmailNotification: value,
        };
      });
      return;
    }

    // Special validation for warehouse profile
    if (section === "warehouseProfile") {
      if (field === "storePickup" || field === "allowShipping") {
        const currentStorePickup =
          field === "storePickup"
            ? value
            : formData.warehouseProfile.storePickup;
        const currentAllowShipping =
          field === "allowShipping"
            ? value
            : formData.warehouseProfile.allowShipping;

        // If both are being set to false, show error
        if (!currentStorePickup && !currentAllowShipping) {
          showErrorToast(
            "At least one option (Store Pickup or Allow Shipping) must be enabled.",
          );
          return;
        }
      }
    }

    if (!section || section === "showWithPerpaidTax") return; // Return early if no section provided or if it's showWithPerpaidTax

    setFormData((prev) => {
      if (!prev) return prev;

      // Type guard: ensure section is a key that points to an object
      const sectionValue = prev[section];
      if (
        typeof sectionValue !== "object" ||
        sectionValue === null ||
        Array.isArray(sectionValue)
      ) {
        return prev;
      }

      return {
        ...prev,
        [section]: {
          ...sectionValue,
          [field]: value,
        },
      };
    });
  };

  // Update the handleHomeSettingChange function to handle radio button behavior
  const handleHomeSettingChange = async (field: string, value: any) => {
    if (!homeSettings) return;

    // Create updated data
    const updatedData = { ...homeSettings, [field]: value };

    // Ensure only one toggle is true at a time for the first three switches
    // and ensure at least one is always true
    if (field === "showMostSale" && value === true) {
      updatedData.showAsPerCustomer = false;
      updatedData.showCustomerHistory = false;
    } else if (field === "showAsPerCustomer" && value === true) {
      updatedData.showMostSale = false;
      updatedData.showCustomerHistory = false;
    } else if (field === "showCustomerHistory" && value === true) {
      updatedData.showMostSale = false;
      updatedData.showAsPerCustomer = false;
    } else if (field === "showMostSale" && value === false) {
      // If trying to turn off showMostSale, check if it's the last one
      const otherTwoTrue =
        updatedData.showAsPerCustomer || updatedData.showCustomerHistory;
      if (!otherTwoTrue) {
        // If both others are false, show toast and don't allow turning off
        showErrorToast("At least one option must be enabled for retailers");
        return; // Don't update the state
      }
    } else if (field === "showAsPerCustomer" && value === false) {
      // If trying to turn off showAsPerCustomer, check if it's the last one
      const otherTwoTrue =
        updatedData.showMostSale || updatedData.showCustomerHistory;
      if (!otherTwoTrue) {
        // If both others are false, show toast and don't allow turning off
        showErrorToast("At least one option must be enabled for retailers");
        return; // Don't update the state
      }
    } else if (field === "showCustomerHistory" && value === false) {
      // If trying to turn off showCustomerHistory, check if it's the last one
      const otherTwoTrue =
        updatedData.showMostSale || updatedData.showAsPerCustomer;
      if (!otherTwoTrue) {
        // If both others are false, show toast and don't allow turning off
        showErrorToast("At least one option must be enabled for retailers");
        return; // Don't update the state
      }
    }

    // Handle promoted items logic
    if (field === "showPromotedItems" && value === false) {
      updatedData.maxPromotedItems = 0;
      updatedData.promotedItems = [];
    } else if (field === "maxPromotedItems") {
      // If maxPromotedItems is changed, ensure promotedItems doesn't exceed the new limit
      const currentPromotedItems = updatedData.promotedItems || [];
      if (currentPromotedItems.length > value) {
        updatedData.promotedItems = currentPromotedItems.slice(0, value);
      }
    }

    // Update local state first
    setHomeSettings(updatedData);

    // Call updateHomeSetting API immediately
    try {
      await updateHomeSetting(updatedData);
      showSuccessToast("Setting updated successfully!");
    } catch (error) {
      console.error("Failed to update home setting:", error);
      showErrorToast("Failed to update setting. Please try again.");
      // Revert local state if API call fails
      setHomeSettings(homeSettings);
    }
  };

  // Contact Us handlers
  const fetchContactUsData = async () => {
    // setContactUsLoadingTab(true);
    try {
      const response: any = await getAllContactUs();
      const contactData = response.data?.data;
      console.log(contactData, "contactData");
      console.log(contactData?.data[0], "contactData[0]");
      if (contactData?.data && contactData.data.length > 0) {
        // Take only the first index of data
        setContactUsData(contactData.data[0]);
      } else {
        // If no data exists, set empty array
        setContactUsData(null);
      }
    } catch (error) {
      console.error("Failed to fetch Contact Us data:", error);
      showErrorToast("Failed to fetch Contact Us data");
    } finally {
      // setContactUsLoadingTab(false);
    }
  };

  const handleContactUsSubmit = async (data: ContactUsFormData) => {
    console.log("handleContactUsSubmit called with data:", data);
    setContactUsLoading(true);
    try {
      // Remove id from data for API call
      const { ...formData } = data;
      console.log("formData:", formData);
      console.log("contactUsData:", contactUsData);

      if (contactUsData?.id && contactUsData.id !== 0) {
        // Update existing contact - use the contactUsData ID
        await updateContactUs(contactUsData.id, formData);
        showSuccessToast("Contact information updated successfully!");
      } else {
        // Create new contact
        await createContactUs(formData);
        showSuccessToast("Contact information created successfully!");
      }

      // Refresh data after successful operation
      await fetchContactUsData();
    } catch (error) {
      console.error("Failed to save Contact Us:", error);
      showErrorToast("Failed to save Contact Us");
    } finally {
      setContactUsLoading(false);
    }
  };

  // Email Management handlers
  const fetchEmailManagementData = async () => {
    try {
      const response: any = await getEmailManagement();
      console.log("Email Management API Response:", response);

      // Handle different response structures
      let emailData = null;

      if (response?.data?.data && Array.isArray(response.data.data)) {
        emailData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        emailData = response.data;
      } else if (response?.data && !Array.isArray(response.data)) {
        // If response.data is a single object, not an array
        emailData = [response.data];
      }

      console.log("Processed emailData:", emailData);

      if (emailData && emailData.length > 0) {
        // Take only the first index of data
        setEmailManagementData(emailData[0]);
        console.log("Set emailManagementData:", emailData[0]);
      } else {
        // If no data exists, set null
        setEmailManagementData(null);
        console.log("No email data found, set to null");
      }
    } catch (error) {
      console.error("Failed to fetch Email Management data:", error);
      showErrorToast("Failed to fetch Email Management data");
    }
  };

  const handleEmailManagementSubmit = async (data: EmailManagementFormData) => {
    console.log("handleEmailManagementSubmit called with data:", data);
    setEmailManagementLoading(true);
    try {
      // Remove id from data for API call
      const { ...formData } = data;
      console.log("emailManagementData:", emailManagementData);

      if (emailManagementData?.id && emailManagementData.id !== 0) {
        // Update existing email management - use the emailManagementData ID
        await updateEmailManagement(
          emailManagementData.id.toString(),
          formData,
        );
        showSuccessToast("Email management updated successfully!");
      } else {
        // Create new email management
        await createEmailManagement(formData);
        console.log("Creating email management with payload:", formData);
        showSuccessToast("Email management created successfully!");
      }

      // Refresh data after successful operation
      await fetchEmailManagementData();
    } catch (error) {
      console.error("Failed to save Email Management:", error);
      showErrorToast("Failed to save Email Management");
    } finally {
      setEmailManagementLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailManagementData?.username) {
      showErrorToast("Please save email configuration first before testing");
      return;
    }

    setTestEmailLoading(true);
    try {
      const testPayload = {
        to: emailManagementData.username, // Use username as the recipient
        subject: "testing",
        html: "<h1>Hello from your SMTP Config!</h1>",
      };

      console.log("Testing email with payload:", testPayload);
      await testEmailManagement(testPayload);
      showSuccessToast("Test email sent successfully! Check your inbox.");
    } catch (error) {
      console.error("Failed to send test email:", error);
      showErrorToast(
        "Failed to send test email. Please check your configuration.",
      );
    } finally {
      setTestEmailLoading(false);
    }
  };

  // ERP Users handlers
  const fetchErpUsers = async () => {
    setErpUsersLoading(true);
    try {
      const response: any = await getErpUsers();
      const usersData = response.data?.data || response.data || [];
      const normalizedUsers = Array.isArray(usersData)
        ? usersData.map((user: any) => ({
            ...user,
            // Ensure we have both id and UserNumber for compatibility
            // Handle UserNumber: 0 case properly (0 is falsy but valid)
            id: user.id !== undefined ? user.id : user.UserNumber,
            UserNumber:
              user.UserNumber !== undefined
                ? user.UserNumber
                : user.id !== undefined
                  ? user.id
                  : null,
          }))
        : [];
      console.log("Fetched ERP Users:", normalizedUsers);
      setErpUsers(normalizedUsers);
    } catch (error) {
      console.error("Failed to fetch ERP Users:", error);
      showErrorToast("Failed to fetch ERP Users");
      setErpUsers([]);
    } finally {
      setErpUsersLoading(false);
    }
  };

  const handleAddErpUser = () => {
    setSelectedErpUser(null);
    setErpUserModalOpen(true);
  };

  const handleEditErpUser = (user: ErpUserData) => {
    setSelectedErpUser(user);
    setErpUserModalOpen(true);
  };

  const handleCloseErpUserModal = () => {
    setErpUserModalOpen(false);
    setSelectedErpUser(null);
    erpUserForm.reset({
      UserID: "",
      UserName: "",
      UserPassword: "",
      UserIsActive: 1,
      id: 0,
    });
  };

  const handleToggleUserActive = async (user: ErpUserData) => {
    try {
      const currentActive =
        typeof user.UserIsActive === "boolean"
          ? user.UserIsActive
            ? 1
            : 0
          : user.UserIsActive;
      const newActive = currentActive === 1 ? 0 : 1;

      // Use UserNumber as the identifier (required by API)
      // Handle UserNumber: 0 case properly (0 is falsy but valid)
      const userNumber =
        user.UserNumber !== undefined ? user.UserNumber : user.id;
      console.log("Toggling user active status:", {
        user,
        userNumber,
        newActive,
      });

      if (
        userNumber === undefined ||
        userNumber === null ||
        (typeof userNumber !== "number" && typeof userNumber !== "string")
      ) {
        console.error("UserNumber not found:", user);
        showErrorToast("User Number not found. Please refresh the page.");
        return;
      }

      // Only send the changed field (UserIsActive) in the payload
      const updatePayload = {
        UserIsActive: newActive,
      };

      console.log("Updating user with UserNumber:", {
        userNumber,
        updatePayload,
      });
      await updateErpUser(userNumber.toString(), updatePayload);

      showSuccessToast(
        `User ${newActive === 1 ? "activated" : "deactivated"} successfully!`,
      );
      await fetchErpUsers();
    } catch (error: any) {
      console.error("Failed to toggle user active status:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update user status";
      showErrorToast(errorMessage);
    }
  };

  const handleErpUserSubmit = async (data: ErpUserFormData) => {
    setErpUserFormLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...formData } = data;

      // Use UserNumber as the identifier (required by API)
      // Handle UserNumber: 0 case properly (0 is falsy but valid)
      const userNumber =
        selectedErpUser?.UserNumber !== undefined
          ? selectedErpUser.UserNumber
          : selectedErpUser?.id !== undefined
            ? selectedErpUser.id
            : null;
      console.log("Submitting ERP User:", {
        data,
        selectedErpUser,
        userNumber,
      });

      // Check if userNumber is a valid number (including 0) or string
      if (
        userNumber !== undefined &&
        userNumber !== null &&
        (typeof userNumber === "number" || typeof userNumber === "string")
      ) {
        // Update existing user - use UserNumber
        console.log(
          "Updating user with UserNumber:",
          userNumber,
          "Payload:",
          formData,
        );
        await updateErpUser(userNumber.toString(), formData);
        showSuccessToast("User updated successfully!");
      } else {
        // Create new user
        console.log("Creating new user with payload:", formData);
        await createErpUser(formData);
        showSuccessToast("User created successfully!");
      }

      // Refresh users list
      await fetchErpUsers();
      handleCloseErpUserModal();
    } catch (error: any) {
      console.error("Failed to save ERP User:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save user";
      showErrorToast(errorMessage);
    } finally {
      setErpUserFormLoading(false);
    }
  };
  
const fetchDrivers = async () => {
  setDriversLoading(true);
  try {
    const response: any = await getDrivers();

    const resData = response?.data?.data || {};

    const driverList =
      resData.drivers ||
      resData.rows ||
      resData.data ||
      [];

    setDrivers(driverList);

  } catch (error) {
    console.error("Failed to fetch drivers:", error);
    showErrorToast("Failed to fetch drivers");
  } finally {
    setDriversLoading(false);
  }
};

const fetchVehicles = async () => {
  setVehiclesLoading(true);
  try {
    const response: any = await getVehicles();
    const resData = response?.data?.data || {};
    const vehicleList =
      resData.vehicles || resData.rows || resData.data || [];
    setVehicles(vehicleList);
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    showErrorToast("Failed to fetch vehicles");
  } finally {
    setVehiclesLoading(false);
  }
};

  // Note: Modal-related handlers removed since we're using direct form approach

  // const handleCancelEdit = () => {
  //   contactUsForm.reset();
  //   setIsEditMode(false);
  // };

  // const handleUpdate = async (data: any) => {
  //   if (tabConfigs[tab].isHomeSettings) {
  //     // Handle home settings update with radio switch group behavior
  //     const updatedData = { ...homeSettings, ...data };

  //     // Ensure only one toggle is true at a time for home settings (excluding showPromotedItems)
  //     if (data.showMostSale) {
  //       updatedData.showAsPerCustomer = false;
  //       updatedData.showCustomerHistory = false;
  //     } else if (data.showAsPerCustomer) {
  //       updatedData.showMostSale = false;
  //       updatedData.showCustomerHistory = false;
  //     } else if (data.showCustomerHistory) {
  //       updatedData.showMostSale = false;
  //       updatedData.showAsPerCustomer = false;
  //     }

  //     // Handle promoted items logic
  //     if (data.showPromotedItems === false) {
  //       updatedData.maxPromotedItems = 0;
  //       updatedData.promotedItems = [];
  //     } else if (data.maxPromotedItems !== undefined) {
  //       // If maxPromotedItems is changed, ensure promotedItems doesn't exceed the new limit
  //       const currentPromotedItems = updatedData.promotedItems || [];
  //       if (currentPromotedItems.length > data.maxPromotedItems) {
  //         updatedData.promotedItems = currentPromotedItems.slice(0, data.maxPromotedItems);
  //       }
  //     }

  //     await updateHomeSetting(updatedData);
  //     setHomeSettings(updatedData);
  //   }
  // }

  // Handle save
  const handleSave = async () => {
    if (!formData) return;

    const currentTab = tabConfigs[tab];

    // Validate warehouse profile settings
    if (currentTab.apiType === "warehouseProfile") {
      if (
        !formData.warehouseProfile.storePickup &&
        !formData.warehouseProfile.allowShipping
      ) {
        showErrorToast(
          "At least one option (Store Pickup or Allow Shipping) must be enabled.",
        );
        return;
      }
    }

    setSaving(true);

    try {
      switch (currentTab.apiType) {
        case "salesRep":
          await updateSalesRepSetting({ salesRep: formData.salesRep });
          showSuccessToast("Sales Rep settings updated successfully!");
          break;
        case "itemGlobal":
          await updateItemGlobalSetting({
            itemGlobal: formData.itemGlobal,
            showWithPerpaidTax: formData.showWithPerpaidTax,
            globalSearchOption: formData.globalSearchOption ?? true,
            splitSearchOption: formData.splitSearchOption ?? false,
          });
          showSuccessToast("Item Global settings updated successfully!");
          break;
        case "retailer":
          await updateRetailerSetting({ retailer: formData.retailer });
          showSuccessToast("Retailer settings updated successfully!");
          break;
        case "warehouseProfile": {
          const normalizedTimeSlots = formData.warehouseProfile.timeSlots?.map(
            (day) => ({
              day: day.day,
              timeSlots: day.timeSlots.map((slot) => ({
                id: slot.id ?? undefined,
                startTime: slot.startTime,
                endTime: slot.endTime === "24:00" ? "00:00" : slot.endTime,
              })),
            }),
          );

          await updateWarehouseProfileSetting({
            warehouseProfile: {
              ...formData.warehouseProfile,
              timeSlots: normalizedTimeSlots,
            },
            orderEmailNotification: formData.orderEmailNotification,
          });

          showSuccessToast("Warehouse Profile settings updated successfully!");
          break;
        }

        case "demandedItems":
          // Handle home settings update with radio switch group behavior
          const updatedHomeData = { ...homeSettings };
          if (formData.demandedItems.showMostSale) {
            updatedHomeData.showAsPerCustomer = false;
            updatedHomeData.showCustomerHistory = false;
          } else if (formData.demandedItems.showAsPerCustomer) {
            updatedHomeData.showMostSale = false;
            updatedHomeData.showCustomerHistory = false;
          } else if (formData.demandedItems.showCustomerHistory) {
            updatedHomeData.showMostSale = false;
            updatedHomeData.showAsPerCustomer = false;
          }

          // Handle promoted items logic
          if (formData.demandedItems.showPromotedItems === false) {
            updatedHomeData.maxPromotedItems = 0;
            updatedHomeData.promotedItems = [];
          } else if (formData.demandedItems.maxPromotedItems !== undefined) {
            // If maxPromotedItems is changed, ensure promotedItems doesn't exceed the new limit
            const currentPromotedItems = updatedHomeData.promotedItems || [];
            if (
              currentPromotedItems.length >
              formData.demandedItems.maxPromotedItems
            ) {
              updatedHomeData.promotedItems = currentPromotedItems.slice(
                0,
                formData.demandedItems.maxPromotedItems,
              );
            }
          }

          // await updateHomeSetting(updatedHomeData); // Assuming updateHomeSetting is available
          setHomeSettings(updatedHomeData);
          showSuccessToast("Demanded Items settings updated successfully!");
          break;
      }

      // Refresh settings after save
      const response: any = await getWarehouseSetting();
      setSettings(response.data?.data);
    } catch (error) {
      console.error("Save failed:", error);
      showErrorToast("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  if (!settings || !formData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <Typography>No settings available</Typography>
      </Box>
    );
  }

  const {
    formState: { errors },
  } = contactUsForm;

  console.log(errors, "errors--->");
  // Render form based on current tab
  const renderForm = () => {
    const currentTab = isDriverManagementMode
      ? ({ apiType: "routeManagement" } as const)
      : tabConfigs[tab];

    switch (currentTab.apiType) {
      case "salesRep":
        return (
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Display inventory stock to Sales Rep.
              </Typography>
              <SwitchInput
                checked={formData.salesRep.showStock}
                onChange={(checked) =>
                  handleFieldChange("salesRep", "showStock", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Allow Order When Inventory Unavailable
              </Typography>
              <SwitchInput
                checked={formData.salesRep.allowOrderInventoryUnAvaible}
                onChange={(checked) =>
                  handleFieldChange(
                    "salesRep",
                    "allowOrderInventoryUnAvaible",
                    checked,
                  )
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                View Account Receivable
              </Typography>
              <SwitchInput
                checked={formData.salesRep.viewAccountReceivable}
                onChange={(checked) =>
                  handleFieldChange(
                    "salesRep",
                    "viewAccountReceivable",
                    checked,
                  )
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Show Without Price</Typography>
              <SwitchInput
                checked={formData.salesRep.showWithOutPrice}
                onChange={(checked) =>
                  handleFieldChange("salesRep", "showWithOutPrice", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
          </Box>
        );

      case "itemGlobal":
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, mb: 1 }}>
                Inventory Threshold
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={formData.itemGlobal.InventoryThreshold || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 0 : Number(value);
                  handleFieldChange(
                    "itemGlobal",
                    "InventoryThreshold",
                    numValue,
                  );
                }}
                size="small"
                inputProps={{
                  min: 0,
                  step: 1,
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, mb: 1 }}>
                Max Order Limit
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={formData.itemGlobal.maxOrderLimit || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 0 : Number(value);
                  handleFieldChange("itemGlobal", "maxOrderLimit", numValue);
                }}
                size="small"
                inputProps={{
                  min: 0,
                  step: 1,
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, mb: 1 }}>
                Minimum Order Amount
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={formData.itemGlobal.MiniMumOrderAmount || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 0 : Number(value);
                  handleFieldChange(
                    "itemGlobal",
                    "MiniMumOrderAmount",
                    numValue,
                  );
                }}
                size="small"
                inputProps={{
                  min: 0,
                  step: 1,
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Show Price With Prepaid Tax
              </Typography>
              <SwitchInput
                checked={formData.showWithPerpaidTax ?? true}
                onChange={(checked) =>
                  handleFieldChange("", "showWithPerpaidTax", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Search type - same UI as Demanded Items "For Retailers", below Show Price With Prepaid Tax */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                component="legend"
                sx={{ fontSize: 14, fontWeight: "bold", color: "primary.main" }}
              >
                Search type
              </Typography>
            </Box>

            {/* Global Search */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Word Search</Typography>
              <SwitchInput
                checked={formData.globalSearchOption ?? true}
                onChange={(checked) =>
                  handleFieldChange("", "globalSearchOption", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Split Search */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Split Search</Typography>
              <SwitchInput
                checked={formData.splitSearchOption ?? false}
                onChange={(checked) =>
                  handleFieldChange("", "splitSearchOption", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
          </Box>
        );

      case "retailer":
        return (
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Display inventory stock to Retailer.
              </Typography>
              <SwitchInput
                checked={formData.retailer.showStock}
                onChange={(checked) =>
                  handleFieldChange("retailer", "showStock", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Allow Order When Inventory Unavailable
              </Typography>
              <SwitchInput
                checked={formData.retailer.allowOrderInventoryUnAvaible}
                onChange={(checked) =>
                  handleFieldChange(
                    "retailer",
                    "allowOrderInventoryUnAvaible",
                    checked,
                  )
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Show Without Price</Typography>
              <SwitchInput
                checked={formData.retailer.showWithOutPrice}
                onChange={(checked) =>
                  handleFieldChange("retailer", "showWithOutPrice", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
          </Box>
        );

      case "warehouseProfile":
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14 }}>
                Cut Off Time (UTC Time)
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={formData.warehouseProfile.cutOffTime}
                onChange={(e) =>
                  handleFieldChange(
                    "warehouseProfile",
                    "cutOffTime",
                    e.target.value,
                  )
                }
                size="small"
                inputProps={{ step: 1 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Allow Shipping</Typography>
              <SwitchInput
                checked={formData.warehouseProfile.allowShipping}
                onChange={(checked) =>
                  handleFieldChange(
                    "warehouseProfile",
                    "allowShipping",
                    checked,
                  )
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Store Pickup</Typography>
              <SwitchInput
                checked={formData.warehouseProfile.storePickup}
                onChange={(checked) =>
                  handleFieldChange("warehouseProfile", "storePickup", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Time Slots Section - Only show when Store Pickup is enabled */}
            {formData.warehouseProfile.storePickup && (
              <Box sx={{ mt: 3 }}>
                <TimeSlotPicker
                  value={formData.warehouseProfile.timeSlots || []}
                  onChange={(timeSlots) =>
                    handleFieldChange(
                      "warehouseProfile",
                      "timeSlots",
                      timeSlots,
                    )
                  }
                />
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, mb: 1 }}>
                Order Email Notification
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={formData.orderEmailNotification || ""}
                onChange={(e) =>
                  handleFieldChange(
                    "",
                    "orderEmailNotification",
                    e.target.value,
                  )
                }
                size="small"
                placeholder="Enter email address for order notifications"
              />
            </Box>
          </Box>
        );

      case "demandedItems":
        if (!homeSettings) {
          return (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="400px"
            >
              <Typography>Loading Demanded Items settings...</Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ p: 2 }}>
            {/* Header */}

            {/* Retails's Legend */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                component="legend"
                sx={{ fontSize: 14, fontWeight: "bold", color: "primary.main" }}
              >
                For Retailers
              </Typography>
            </Box>

            {/* Show Most Sale */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Show Most Sale</Typography>
              <SwitchInput
                checked={homeSettings.showMostSale}
                onChange={(checked) =>
                  handleHomeSettingChange("showMostSale", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Show As Per Customer */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Show As Per Customer
              </Typography>
              <SwitchInput
                checked={homeSettings.showAsPerCustomer}
                onChange={(checked) =>
                  handleHomeSettingChange("showAsPerCustomer", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Show Customer History */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                Show Customer History
              </Typography>
              <SwitchInput
                checked={homeSettings.showCustomerHistory}
                onChange={(checked) =>
                  handleHomeSettingChange("showCustomerHistory", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            <hr />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                component="legend"
                sx={{ fontSize: 14, fontWeight: "bold", color: "primary.main" }}
              >
                For Sales Rep
              </Typography>
            </Box>
            {/* Show Promoted Items */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>Show Promoted Items</Typography>
              <SwitchInput
                checked={homeSettings.showPromotedItems}
                onChange={(checked) =>
                  handleHomeSettingChange("showPromotedItems", checked)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            {/* Max Promoted Items - Only show if showPromotedItems is true */}
            {homeSettings.showPromotedItems && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 14, mb: 1 }}>
                  Maximum Promoted Items For Sales Person
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={homeSettings.maxPromotedItems || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === "" ? 0 : Number(value);
                    handleHomeSettingChange("maxPromotedItems", numValue);
                  }}
                  size="small"
                  inputProps={{
                    min: 0,
                    step: 1,
                  }}
                />
              </Box>
            )}

            {/* Promoted Items Selector - Only show if showPromotedItems is true and maxPromotedItems > 0 */}
            {homeSettings.showPromotedItems &&
              homeSettings.maxPromotedItems > 0 && (
                <Box sx={{ mb: 2 }}>
                  <PromotedItemsSelector
                    value={homeSettings.promotedItems || []}
                    onChange={(items) =>
                      handleHomeSettingChange("promotedItems", items)
                    }
                    maxItems={homeSettings.maxPromotedItems}
                    disabled={!homeSettings.showPromotedItems}
                  />
                </Box>
              )}
          </Box>
        );

      case "contactUs":
        return (
          <Box sx={{ p: 2 }}>
            <form onSubmit={contactUsForm.handleSubmit(handleContactUsSubmit)}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Hidden ID field */}
                <input type="hidden" {...contactUsForm.register("id")} />

                <TextInput
                  label="Phone Number"
                  {...contactUsForm.register("PhoneNO")}
                  error={!!contactUsForm.formState.errors.PhoneNO}
                  helperText={contactUsForm.formState.errors.PhoneNO?.message}
                />

                <TextInput
                  label="WhatsApp Number"
                  {...contactUsForm.register("WhatupNo")}
                  error={!!contactUsForm.formState.errors.WhatupNo}
                  helperText={contactUsForm.formState.errors.WhatupNo?.message}
                />

                <TextInput
                  label="Email Address"
                  type="email"
                  {...contactUsForm.register("EmailAdd")}
                  error={!!contactUsForm.formState.errors.EmailAdd}
                  helperText={contactUsForm.formState.errors.EmailAdd?.message}
                />

                <TextInput
                  label="Fax Number"
                  {...contactUsForm.register("Fax")}
                  error={!!contactUsForm.formState.errors.Fax}
                  helperText={contactUsForm.formState.errors.Fax?.message}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <button
                    type="submit"
                    disabled={contactUsLoading}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: contactUsLoading ? "not-allowed" : "pointer",
                      opacity: contactUsLoading ? 0.6 : 1,
                    }}
                  >
                    {contactUsLoading
                      ? "Loading..."
                      : contactUsData?.id
                        ? "Update"
                        : "Save"}
                  </button>
                </Box>
              </Box>
            </form>
          </Box>
        );

      // case "emailManagement":
        return (
          <Box sx={{ p: 2 }}>
            <form
              onSubmit={emailManagementForm.handleSubmit(
                handleEmailManagementSubmit,
              )}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Hidden ID field */}
                <input type="hidden" {...emailManagementForm.register("id")} />

                <TextInput
                  label="SMTP Host"
                  {...emailManagementForm.register("host")}
                  error={!!emailManagementForm.formState.errors.host}
                  helperText={
                    emailManagementForm.formState.errors.host?.message
                  }
                />

                <TextInput
                  label="Port"
                  type="number"
                  {...emailManagementForm.register("port", {
                    valueAsNumber: true,
                  })}
                  error={!!emailManagementForm.formState.errors.port}
                  helperText={
                    emailManagementForm.formState.errors.port?.message
                  }
                />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 14 }}>
                    Secure Connection (SSL/TLS)
                  </Typography>
                  <SwitchInput
                    checked={emailManagementForm.watch("secure")}
                    onChange={(checked) =>
                      emailManagementForm.setValue("secure", checked)
                    }
                    sx={{ mb: 0 }}
                    isShowLabel={false}
                  />
                </Box>

                <TextInput
                  label="Username/Email"
                  type="email"
                  {...emailManagementForm.register("username")}
                  error={!!emailManagementForm.formState.errors.username}
                  helperText={
                    emailManagementForm.formState.errors.username?.message
                  }
                />

                <TextInput
                  label="Password"
                  type="password"
                  {...emailManagementForm.register("password")}
                  error={!!emailManagementForm.formState.errors.password}
                  helperText={
                    emailManagementForm.formState.errors.password?.message
                  }
                />

                <TextInput
                  label="From Email"
                  type="email"
                  {...emailManagementForm.register("fromEmail")}
                  error={!!emailManagementForm.formState.errors.fromEmail}
                  helperText={
                    emailManagementForm.formState.errors.fromEmail?.message
                  }
                />

                <TextInput
                  label="From Name"
                  {...emailManagementForm.register("fromName")}
                  error={!!emailManagementForm.formState.errors.fromName}
                  helperText={
                    emailManagementForm.formState.errors.fromName?.message
                  }
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={
                      testEmailLoading || !emailManagementData?.username
                    }
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#2e7d32",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        testEmailLoading || !emailManagementData?.username
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        testEmailLoading || !emailManagementData?.username
                          ? 0.6
                          : 1,
                    }}
                  >
                    {testEmailLoading ? "Testing..." : "Test Email"}
                  </button>

                  <button
                    type="submit"
                    disabled={emailManagementLoading}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: emailManagementLoading
                        ? "not-allowed"
                        : "pointer",
                      opacity: emailManagementLoading ? 0.6 : 1,
                    }}
                  >
                    {emailManagementLoading
                      ? "Loading..."
                      : emailManagementData?.id
                        ? "Update"
                        : "Save"}
                  </button>
                </Box>
              </Box>
            </form>
          </Box>
        );

      case "user":
        const erpUserColumns: TableColumn<ErpUserData>[] = [
          {
            id: "UserID",
            label: "User ID",
            minWidth: 100,
          },
          {
            id: "UserName",
            label: "User Name",
            minWidth: 150,
          },
          {
            id: "UserIsActive",
            label: "Status",
            minWidth: 100,
            align: "center",
            render: (row) => {
              const isActive =
                typeof row.UserIsActive === "boolean"
                  ? row.UserIsActive
                  : row.UserIsActive === 1;
              return (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <SwitchInput
                    checked={isActive}
                    onChange={() => handleToggleUserActive(row)}
                    sx={{ mb: 0 }}
                    isShowLabel={false}
                  />
                </Box>
              );
            },
          },
          {
            id: "actions",
            label: "Actions",
            minWidth: 100,
            align: "right",
            render: (row) => (
              <Box
                sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleEditErpUser(row)}
                  sx={{ color: "primary.main" }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            ),
          },
        ];

        return (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                position: "sticky",
                top: 0,
                zIndex: 5,
                backgroundColor: (theme) => theme.palette.background.paper,
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "grey" }}>
                Users
              </Typography>

              <CustomButton
                onClick={handleAddErpUser}
                fullWidth={false}
                sx={{ minWidth: 120, mt: 0 }}
              >
                Add User
              </CustomButton>
            </Box>
            <CommonTable
              data={erpUsers}
              columns={erpUserColumns}
              currentPage={1}
              totalPages={1}
              totalItems={erpUsers.length}
              pageSize={10}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              showPageSizeSelector={false}
              showTotalItems={false}
              showPageNumbers={false}
              loading={erpUsersLoading}
              isPagination={false}
              containerHeight="650px"
              emptyStateComponent={<Typography>No users found</Typography>}
              stickyHeader={true}
            />
          </Box>
        );

      case "inventory":
        return <InventorySettings activeTab={inventoryTab} />;

      case "picklistTemplate":
        return <PicklistTemplateTab />;

      // case 'invoiceTemplate':
      //   return <InvoiceTemplateTab />;

        case "routeManagement":
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Box 1: Tabs */}
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          px: { xs: 1, sm: 2 },
          py: 1,
        }}
      >
        <RouteHeaderTabs value={routeTab} onChange={setRouteTab} />
      </Paper>

      {/* Box 2: Filters + Table */}
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: 1, sm: 1.5 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 220px 220px auto" },
            gap: 1.5,
            alignItems: "center",
          }}
        >
        <TextField
          placeholder="Search Orders"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: <SearchIcon sx={{ color: "text.disabled", fontSize: 20 }} />,
          }}
        />
          <FormControl size="small" fullWidth>
          <InputLabel>Route</InputLabel>
          <Select
            label="Route"
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="route-1">Route 1</MenuItem>
            <MenuItem value="route-2">Route 2</MenuItem>
          </Select>
        </FormControl>
          <FormControl size="small" fullWidth>
          <InputLabel>Day</InputLabel>
          <Select
            label="Day"
            value={selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="monday">Monday</MenuItem>
            <MenuItem value="tuesday">Tuesday</MenuItem>
            <MenuItem value="wednesday">Wednesday</MenuItem>
            <MenuItem value="thursday">Thursday</MenuItem>
            <MenuItem value="friday">Friday</MenuItem>
            <MenuItem value="saturday">Saturday</MenuItem>
            <MenuItem value="sunday">Sunday</MenuItem>
          </Select>
          </FormControl>

          {routeTab === 1 ? (
            <CustomButton
              onClick={() => {
                setSelectedDriver(null);
                driverForm.reset();
                setDriverModalOpen(true);
              }}
              fullWidth={false}
              sx={{
                minWidth: { xs: "100%", md: 160 },
                justifySelf: { xs: "stretch", md: "end" },
                mt: 0,
              }}
            >
              Add Driver
            </CustomButton>
          ) : routeTab === 2 ? (
            <CustomButton
              onClick={() => {
                setSelectedVehicle(null);
                vehicleForm.reset({
                  description: "",
                  loadCapacityLbs: undefined,
                  truckType: "",
                  licenseRegistrationNumber: "",
                  vinNumber: "",
                  engineType: undefined,
                  lastServiceDate: "",
                  lastOilChangeDate: "",
                  nextOilChangeAfterMonths: undefined,
                  mileageHours: undefined,
                  insurancePolicyNumber: "",
                  insuranceCarrier: "",
                  insuranceExpirationDate: "",
                  conditionStatus: "",
                  physicalNotes: "",
                  isActive: true,
                });
                setVehicleModalOpen(true);
              }}
              fullWidth={false}
              sx={{
                minWidth: { xs: "100%", md: 160 },
                justifySelf: { xs: "stretch", md: "end" },
                mt: 0,
              }}
            >
              Add Vehicle
            </CustomButton>
          ) : (
            <Box />
          )}
        </Box>

      {/* TABLE SECTION */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: { xs: 1, sm: 1.5 }, pb: { xs: 1, sm: 1.5 } }}>
        {routeTab === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: "240px",
            }}
          >
            <Typography sx={{ fontSize: 16, color: "text.secondary", fontWeight: 500 }}>
              Coming soon
            </Typography>
          </Box>
        )}

        {routeTab === 1 && (
          <CommonTable
            data={drivers}
            columns={[
              { id: "id", label: "Driver ID" },
              {
                id: "driverName",
                label: "Driver Name",
                render: (row: any) =>
                  `${row.firstName ?? ""} ${row.lastName ?? ""}`,
              },
              { id: "driverLicenseNo", label: "License No" },
              {
                id: "licenseClass",
                label: "License Class",
                render: (row: any) =>
                  row.licenseClass ? `Class ${row.licenseClass}` : "-",
              },
              {
                id: "actions",
                label: "Actions",
                align: "right",
                render: (row: any) => (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedDriver(row);
                      setDriverModalOpen(true);
                    }}
                    sx={{ color: "primary.main" }}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                ),
              },
            ]}
            currentPage={1}
            totalPages={1}
            totalItems={drivers.length}
            pageSize={10}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={driversLoading}
            isPagination={false}
            showPageSizeSelector={false}
            showTotalItems={false}
            showPageNumbers={false}
            containerHeight={isMobile ? "420px" : "calc(100vh - 340px)"}
            emptyStateComponent={<Typography>No drivers found</Typography>}
          />
        )}

        {routeTab === 2 && (
          <CommonTable
            data={vehicles}
            columns={[
              { id: "id", label: "Vehicle ID" },
              { id: "description", label: "Description" },
              { id: "licenseRegistrationNumber", label: "License No" },
              {
                id: "loadCapacityLbs",
                label: "Load Capacity (lbs)",
                render: (row: any) =>
                  row.loadCapacityLbs
                    ? `${row.loadCapacityLbs} lbs`
                    : "-",
              },
              {
                id: "actions",
                label: "Actions",
                align: "right",
                render: (row: any) => (
                  <IconButton
                    size="small"
                   onClick={() => {
              setSelectedVehicle(row);

             vehicleForm.reset({
             description: row.description ?? "",
            loadCapacityLbs: row.loadCapacityLbs ?? undefined,
            truckType: row.truckType ?? "",
            licenseRegistrationNumber: row.licenseRegistrationNumber ?? "",
            vinNumber: row.vinNumber ?? "",
            engineType: row.engineType ?? undefined,
            lastServiceDate: row.lastServiceDate ?? "",
            lastOilChangeDate: row.lastOilChangeDate ?? "",
            nextOilChangeAfterMonths: row.nextOilChangeAfterMonths ?? undefined,
            mileageHours: row.mileageHours ?? undefined,
            insurancePolicyNumber: row.insurancePolicyNumber ?? "",
            insuranceCarrier: row.insuranceCarrier ?? "",
            insuranceExpirationDate: row.insuranceExpirationDate ?? "",
            conditionStatus: row.conditionStatus ?? "",
            physicalNotes: row.physicalNotes ?? "",
            isActive: row.isActive ?? true,
            });

           setVehicleModalOpen(true);
       }}
                   sx={{ color: "primary.main" }}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                ),
              },
            ]}
            currentPage={1}
            totalPages={1}
            totalItems={vehicles.length}
            pageSize={10}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={vehiclesLoading}
            isPagination={false}
            showPageSizeSelector={false}
            showTotalItems={false}
            showPageNumbers={false}
            containerHeight={isMobile ? "420px" : "calc(100vh - 340px)"}
            emptyStateComponent={<Typography>No vehicles found</Typography>}
          />
        )}
      </Box>
      </Paper>
    </Box>
  );

      case "emailConfiguration":
        return <EmailConfigurationTab />;

      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      mt={2}
      gap={3}
      sx={{
        minHeight: isDriverManagementMode ? { xs: 0, md: 0 } : { xs: 0, md: "calc(100vh - 210px)" },
        height: isDriverManagementMode ? { xs: "auto", md: "auto" } : { xs: "auto", md: "calc(100vh - 210px)" },
        flex: { xs: "1 1 auto", md: "0 0 auto" },
      }}
    >
      {/* Left Sidebar - Tabs: scrollable when many items so it is not cut off */}
      {!isDriverManagementMode && (
      <Paper
        sx={{
          width: { xs: "100%", md: 260 },
          flexShrink: 0,
          minHeight: { xs: 0, md: 0 },
          maxHeight: { xs: "none", md: "calc(100vh - 210px)" },
          borderRadius: 3,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          py: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
          },
        }}
      >
        <Tabs
          orientation={isMobile ? "horizontal" : "vertical"}
          variant="scrollable"
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: { md: "min-content" },
            flex: { md: "0 0 auto" },
            overflowX: { xs: "auto", md: "hidden" },
            overflowY: "visible",
          }}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          {tabConfigs.map((t, i) => (
            <Tab
              key={i}
              label={t.label}
              icon={
                <img
                  src={tab === i ? t.activeIcon : t.icon}
                  alt={t.label}
                  style={{ width: 20, height: 20 }}
                />
              }
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: "flex-start",
                textTransform: "none",
                minHeight: { xs: 35, md: 48 },
                fontWeight: 400,
                gap: { xs: 0.3, md: 1 },
                // color: tab === i ? '#ffffff' : theme.palette.text.primary,
                // backgroundColor: tab === i ? theme.palette.primary.main : 'transparent',
                // borderRadius: '8px',
                margin: "4px 8px",
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  // borderBottom:
                  // ? `2px solid ${theme.palette.primary.main}`
                  // : "none",
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>
      )}

      {/* Right Content - Form */}
      <Paper
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          minHeight: { xs: 0, md: "calc(100vh - 210px)" },
          borderRadius: 3,
          boxShadow: "none",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {/* Header - hidden for Invoice Template, User, and Inventory tabs (they have their own headers) */}
          {!["invoiceTemplate", "user", "inventory", "emailConfiguration", "routeManagement"].includes(activeApiType) && (
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "primary.main",
              borderRadius: "8px 8px 0 0",
              padding: "12px 20px",
              marginBottom: 2
            }}>
              <Typography sx={{ fontWeight: 500, fontSize: 16, color: "white" }}>
                {isDriverManagementMode ? "Driver Management" : tabConfigs[tab].label}
              </Typography>
            </Box>
          )}

          {/* Inventory sub-tabs - only when on Inventory tab */}
          {activeApiType === "inventory" && (
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                px: 2,
              }}
            >
              <InventoryHeaderTabs
                value={inventoryTab}
                onChange={setInventoryTab}
              />
            </Box>
          )}

          {/* Form */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {renderForm()}
          </Box>

          {/* Save Button - Hide for tabs that have their own save handling */}
          {!["demandedItems", "contactUs", "emailManagement", "user", "picklistTemplate", "invoiceTemplate", "inventory","routeManagement","emailConfiguration"].includes(activeApiType) && (
            <Box sx={{
              position: "sticky",
              bottom: 0,
              bgcolor: "background.paper",
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
              p: 2
            }}>
              <CustomButton
                onClick={handleSave}
                loading={saving}
                fullWidth={false}
                sx={{ minWidth: 120, mt: 0 }}
              >
                {saving ? 'Saving...' : 'Save'}
              </CustomButton>
            </Box>
          )}
        </Box>
      </Paper>

      {/* ERP User Modal */}
      <CommonModal
        open={erpUserModalOpen}
        onClose={handleCloseErpUserModal}
        title={selectedErpUser ? "Edit User" : "Add User"}
        size="md"
      >
        <form onSubmit={erpUserForm.handleSubmit(handleErpUserSubmit)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Hidden ID field */}
            <input type="hidden" {...erpUserForm.register("id")} />

            <TextInput
              label="User ID"
              {...erpUserForm.register("UserID")}
              error={!!erpUserForm.formState.errors.UserID}
              helperText={erpUserForm.formState.errors.UserID?.message}
              inputProps={{ maxLength: 5 }}
            />

            <TextInput
              label="User Name"
              {...erpUserForm.register("UserName")}
              error={!!erpUserForm.formState.errors.UserName}
              helperText={erpUserForm.formState.errors.UserName?.message}
              inputProps={{ maxLength: 50 }}
            />

            <TextInput
              label="User Password"
              type="password"
              {...erpUserForm.register("UserPassword")}
              error={!!erpUserForm.formState.errors.UserPassword}
              helperText={erpUserForm.formState.errors.UserPassword?.message}
              inputProps={{ maxLength: 5 }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>User Is Active</Typography>
              <SwitchInput
                checked={erpUserForm.watch("UserIsActive") === 1}
                onChange={(checked) =>
                  erpUserForm.setValue("UserIsActive", checked ? 1 : 0)
                }
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 1,
              }}
            >
              <CustomButton
                appearance="outlined"
                onClick={handleCloseErpUserModal}
                type="button"
                size="small"
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                appearance="filled"
                type="submit"
                size="small"
                fullWidth={false}
                loading={erpUserFormLoading}
                sx={{ mt: 0 }}
              >
                {selectedErpUser ? "Update" : "Save"}
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

         {/* driver modal */}
         <CommonModal
         open={driverModalOpen}
         onClose={() => setDriverModalOpen(false)}
         title={selectedDriver ? "Edit Driver" : "Add Driver"}
         size="lg"
         >
       <form
       onSubmit={driverForm.handleSubmit(async (formData) => {
       try {

       if (!selectedDriver && !formData.password) {
      showErrorToast("Password is required for new driver");
      return;
     }

        const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
       driverLicenseNo: formData.driverLicenseNo,
       licenseExpirationDate: formData.licenseExpirationDate,
       licenseClass: formData.licenseClass,
       driverPicture: formData.driverPicture,
       dotMedicalCertificate: formData.dotMedicalCertificate,
       isActive: formData.isActive,
      };

    if (formData.password) {
   payload.password = formData.password;
    }   

    if (selectedDriver?.id) {
      await updateDriver(selectedDriver.id, payload);
      showSuccessToast("Driver updated successfully");
    } else {
      await createDriver(payload);
      showSuccessToast("Driver created successfully");
    }

    await fetchDrivers();
    setDriverModalOpen(false);
    setSelectedDriver(null);
    driverForm.reset();

  } catch (error: any) {
    console.log("CREATE DRIVER ERROR:", error?.response?.data);
    showErrorToast(
      error?.response?.data?.message || "Failed to save driver"
    );
  }
})}

  >
   <Box
  sx={{
    maxHeight: "75vh",
    overflowY: "auto",
    pr: 1,
  }}
 >
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        md: "1fr 1fr",
      },
      gap: 3,
    }}
  >


  {/* LEFT COLUMN */}
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}> 
    <TextInput
      label="First Name"
      {...driverForm.register("firstName")}
    />

    <TextInput
      label="Last Name"
      {...driverForm.register("lastName")}
    />

    <TextInput
      label="Driver License No"
      {...driverForm.register("driverLicenseNo")}
    />

    <CustomDatePicker
      label="Expiration Date"
      value={
        driverForm.watch("licenseExpirationDate")
          ? dayjs(driverForm.watch("licenseExpirationDate"))
          : null
      }
      onChange={(date: Dayjs | null) =>
        driverForm.setValue(
          "licenseExpirationDate",
          date ? date.format("YYYY-MM-DD") : ""
        )
      }
      disablePast
    />

    <FormControl fullWidth size="small">
      <InputLabel>License Class</InputLabel>
      <Select
        value={driverForm.watch("licenseClass") ?? ""}
        label="License Class"
        onChange={(e) =>
          driverForm.setValue("licenseClass", e.target.value as any)
        }
      >
        <MenuItem value="A">Class A</MenuItem>
        <MenuItem value="B">Class B</MenuItem>
        <MenuItem value="C">Class C</MenuItem>
        <MenuItem value="D">Class D</MenuItem>
      </Select>
    </FormControl>

    <TextInput
      label="Email Id"
      {...driverForm.register("email")}
    />

  <TextInput
  label="Password"
  type="password"
  {...driverForm.register("password")}
/>


    {/* <TextInput
  label="Current Latitude"
  type="number"
  inputProps={{ step: "any" }}
  {...driverForm.register("currentLatitude", {
    valueAsNumber: true,
  })}
/>

<TextInput
  label="Current Longitude"
  type="number"
  inputProps={{ step: "any" }}
  {...driverForm.register("currentLongitude", {
    valueAsNumber: true,
  })}
/> */}
  </Box>

 {/*Drivers picture */}
<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
  <Typography
  sx={{
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.6)",   
  }}
>
  Driver Picture
</Typography>
  <Box
    sx={{
      width: 200,
      height: 250,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      backgroundColor: "#fafafa",
      cursor: "pointer",
      mx: "auto",
      transition: "all 0.25s ease",
      "&:hover": {
        boxShadow: 3,
        borderColor: "primary.main",
      },
    }}
    onClick={() => imageInputRef.current?.click()}
  >
    {!driverImagePreview ? (
      <Typography
        fontSize={14}
        color="text.secondary"
        textAlign="center"
        px={2}
      >
        Click to upload image
      </Typography>
    ) : (
      <Box
        component="img"
        src={driverImagePreview}
        alt="Driver"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    )}

   <input
  ref={imageInputRef}
  hidden
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res: any = await uploadImages(file);

      const imageUrl =
        res?.data?.url ||
        res?.url ||
        res?.data ||
        "";

      driverForm.setValue("driverPicture", imageUrl, {
        shouldValidate: true,
      });

      setDriverImagePreview(imageUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  }}
/>
  </Box>


  {/* DOT MEDICAL CERTIFICATE */}
<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
  <Typography
  sx={{
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.6)",
  }}
>
  DOT Medical Certificate
</Typography>

  <CustomButton
    appearance="outlined"
    fullWidth
    sx={{ mt: 0 }}   
    onClick={() => certificateInputRef.current?.click()}
  >
    UPLOAD FILE
  </CustomButton>

 <input
  ref={certificateInputRef}
  hidden
  type="file"
  accept="application/pdf,image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res: any = await uploadImages(file);

      const fileUrl =
        res?.data?.url ||
        res?.url ||
        res?.data ||
        "";

      driverForm.setValue("dotMedicalCertificate", fileUrl, {
        shouldValidate: true,
      });

      setDriverCertificatePreview(fileUrl);
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }}
/>

  {driverCertificatePreview && (
  <Typography
    fontSize={13}
    sx={{
      color: "primary.main",
      cursor: "pointer",
      textDecoration: "underline",
      mt: 0.5,
    }}
    onClick={() => window.open(driverCertificatePreview, "_blank")}
  >
    {driverCertificatePreview.substring(
      driverCertificatePreview.lastIndexOf("/") + 1
    )}
  </Typography>
)}
  </Box>
  </Box>

  {/* ACTIVE SWITCH  */}
  <Box
  sx={{
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    py: 1,
  }}
>
  <Typography fontSize={14} fontWeight={500}>
    Driver Is Active
  </Typography>

  <SwitchInput
    checked={driverForm.watch("isActive")}
    onChange={(checked) =>
      driverForm.setValue("isActive", checked)
    }
    isShowLabel={false}
    sx={{ m: 0 }}
  />
</Box>


  {/* ACTION BUTTONS  */}
  <Box
    sx={{
      gridColumn: "1 / -1",
      display: "flex",
      justifyContent: "flex-end",
      gap: 2,
      mt: 2,
    }}
  >
    <CustomButton
      appearance="outlined"
      onClick={() => setDriverModalOpen(false)}
    >
      Cancel
    </CustomButton>

    <CustomButton type="submit">
      {selectedDriver ? "Update" : "Save"}
    </CustomButton>
  </Box>

</Box>
</Box>
  </form>
</CommonModal>  

{/* Vehicles Modal */}
  <CommonModal
  open={vehicleModalOpen}
  onClose={() => setVehicleModalOpen(false)}
  title={selectedVehicle ? "Edit Vehicle" : "Add Vehicle"}
  size="lg"
>
   <form
    onSubmit={vehicleForm.handleSubmit(async (data) => {
      try {
       const payload = {
  description: data.description,
  loadCapacityLbs: data.loadCapacityLbs,
  truckType: data.truckType,
  licenseRegistrationNumber: data.licenseRegistrationNumber,
  vinNumber: data.vinNumber,
  engineType: data.engineType,
  lastServiceDate: data.lastServiceDate,
  lastOilChangeDate: data.lastOilChangeDate,
  nextOilChangeAfterMonths: data.nextOilChangeAfterMonths,
  mileageHours: data.mileageHours,
  insurancePolicyNumber: data.insurancePolicyNumber,
  insuranceCarrier: data.insuranceCarrier,
  insuranceExpirationDate: data.insuranceExpirationDate,
  conditionStatus: data.conditionStatus,
  physicalNotes: data.physicalNotes,
  isActive: data.isActive,
};

if (selectedVehicle && selectedVehicle.id !== undefined && selectedVehicle.id !== null) {
  await updateVehicle(selectedVehicle.id, payload);
  showSuccessToast("Vehicle updated successfully");
} else {
  await createVehicle(payload);
  showSuccessToast("Vehicle created successfully");
}

        await fetchVehicles();
        setVehicleModalOpen(false);
        setSelectedVehicle(null);
        vehicleForm.reset({
  description: "",
  loadCapacityLbs: undefined,
  truckType: "",
  licenseRegistrationNumber: "",
  vinNumber: "",
  engineType: undefined,
  lastServiceDate: "",
  lastOilChangeDate: "",
  nextOilChangeAfterMonths: undefined,
  mileageHours: undefined,
  insurancePolicyNumber: "",
  insuranceCarrier: "",
  insuranceExpirationDate: "",
  conditionStatus: "",
  physicalNotes: "",
  isActive: true,
});
      } catch (error: any) {
        showErrorToast(
          error?.response?.data?.message || "Failed to save vehicle"
        );
      }
    })}
  >
     <Box
    sx={{
      maxHeight: "70vh",     
      overflowY: "auto",     
      pr: 1,
    }}
  >
 
 <Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "1fr 1fr",
    },
    columnGap: 3,
    rowGap: 2,
    alignItems: "start",
  }}
>

     <TextInput label="Description" {...vehicleForm.register("description")} />
<TextInput label="Truck Type" {...vehicleForm.register("truckType")} />

<TextInput
  label="License Registration No"
  {...vehicleForm.register("licenseRegistrationNumber")}
/>

<TextInput label="VIN Number" {...vehicleForm.register("vinNumber")} />

<TextInput
  type="number"
  label="Load Capacity (lbs)"
  inputProps={{ min: 0, step: 1 }}
  {...vehicleForm.register("loadCapacityLbs", {
    valueAsNumber: true,
    min: 0,
  })}
/>

<TextInput
  type="number"
  label="Mileage Hours"
  inputProps={{ min: 0, step: 1 }}
  {...vehicleForm.register("mileageHours", {
    valueAsNumber: true,
    min: 0,
  })}
/>

<CustomDatePicker
  label="Last Service Date"
  value={
    vehicleForm.watch("lastServiceDate")
      ? dayjs(vehicleForm.watch("lastServiceDate"))
      : null
  }
  onChange={(d) =>
    vehicleForm.setValue(
      "lastServiceDate",
      d ? d.format("YYYY-MM-DD") : ""
    )
  }
/>

<CustomDatePicker
  label="Last Oil Change"
  value={
    vehicleForm.watch("lastOilChangeDate")
      ? dayjs(vehicleForm.watch("lastOilChangeDate"))
      : null
  }
  onChange={(d) =>
    vehicleForm.setValue(
      "lastOilChangeDate",
      d ? d.format("YYYY-MM-DD") : ""
    )
  }
/>

<FormControl fullWidth size="small">
  <InputLabel>Engine Type</InputLabel>
  <Select
    value={vehicleForm.watch("engineType") ?? ""}
    label="Engine Type"
    onChange={(e) =>
      vehicleForm.setValue("engineType", e.target.value as any)
    }
  >
    <MenuItem value="gasoline">Gasoline</MenuItem>
    <MenuItem value="diesel">Diesel</MenuItem>
    <MenuItem value="electric">Electric</MenuItem>
  </Select>
</FormControl>
   
<Typography
  sx={{
    gridColumn: "1 / -1",
    fontSize: 15,
    fontWeight: 600,
    color: "primary.main",
    borderBottom: "1px solid",
    borderColor: "divider",
    pb: 1,
    mt: 4,
  }}
>
  Insurance Details
</Typography>

     <TextInput
  label="Policy Number "
  {...vehicleForm.register("insurancePolicyNumber")}
/>

<TextInput
  label="Carrier"
  {...vehicleForm.register("insuranceCarrier")}
/>

<Box sx={{ width: "100%" }}>
  <CustomDatePicker
    label="Expiration"
    value={
      vehicleForm.watch("insuranceExpirationDate")
        ? dayjs(vehicleForm.watch("insuranceExpirationDate"))
        : null
    }
    onChange={(d) =>
      vehicleForm.setValue(
        "insuranceExpirationDate",
        d ? d.format("YYYY-MM-DD") : ""
      )
    }
  />
</Box>

<Box
  sx={{
    gridColumn: "1 / -1",
    mt: 3,
    mb: 1.5,
  }}
>
  <Typography
    sx={{
      fontSize: 15,
      fontWeight: 600,
      color: "primary.main",
      mb: 1,
    }}
  >
    Condition & Physical Notes
  </Typography>

  <Box
    sx={{
      height: "1px",
      width: "100%",
      backgroundColor: "divider",
    }}
  />
</Box>

<Box sx={{ width: "100%" }}>
  <FormControl fullWidth size="small">
    <InputLabel>Condition Status</InputLabel>
    <Select
      value={vehicleForm.watch("conditionStatus") ?? ""}
      label="Condition Status"
      onChange={(e) =>
        vehicleForm.setValue("conditionStatus", e.target.value)
      }
    >
      <MenuItem value="Good">Good</MenuItem>
      <MenuItem value="Needs Repair">Needs Repair</MenuItem>
      <MenuItem value="Excellent">Excellent</MenuItem>
    </Select>
  </FormControl>
</Box>

<TextField
  label="Physical Notes"
  multiline
  rows={3}
  fullWidth
  value={vehicleForm.watch("physicalNotes") ?? ""}
  onChange={(e) =>
    vehicleForm.setValue("physicalNotes", e.target.value)
  }
  sx={{
    gridColumn: "1 / -1",
    mt: 0.5,
  }}
/>

 <Box
  sx={{
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mt: 2,
    pt: 1.5,
  }}
>
  <Typography
    sx={{
      fontSize: 14,
      fontWeight: 500,
    }}
  >
    Vehicle Is Active
  </Typography>

  <SwitchInput
    checked={vehicleForm.watch("isActive")}
    onChange={(checked) =>
      vehicleForm.setValue("isActive", checked)
    }
    isShowLabel={false}
    sx={{ m: 0 }}
  />
 </Box>  
 
<Box
  sx={{
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: 2,
    mt: 4,
    pt: 2,
    borderTop: "1px solid",
    borderColor: "divider",
  }}
>

  <CustomButton
    appearance="outlined"
    onClick={() => setVehicleModalOpen(false)}
  >
    Cancel
  </CustomButton>

  <CustomButton type="submit">
    {selectedVehicle ? "Update" : "Save"}
  </CustomButton>
</Box>

    </Box>
    </Box>
  </form>
</CommonModal>

    </Box>
  );
};

export default SettingsTabs;
