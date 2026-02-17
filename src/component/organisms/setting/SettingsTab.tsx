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
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import EditIcon from "@mui/icons-material/Edit";
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
import InvoiceTemplateTab from '../../../pages/admin/settings/InvoiceTemplateTab';

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
    <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v)}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
        textColor="primary"
        indicatorColor="primary"
        sx={{
          minHeight: 40,
          "& .MuiTab-root": {
            minHeight: 40,
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
    label: "Email Management",
    apiType: "emailManagement" as const,
    icon: emailIcon,
    activeIcon: emailIcon,
  },
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
  {
    label: 'Invoice Template',
    apiType: 'invoiceTemplate' as const,
    icon: userIcon,
    activeIcon: userActiveIcon
  },
  {
    label: "Inventory",
    apiType: "inventory" as const,
    icon: itemsActiveIcon,
    activeIcon: itemsActiveIcon,
  },
];

const SettingsTabs = () => {
  const [inventoryTab, setInventoryTab] = useState(0);
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

  // Effect to populate form when contact data is loaded
  useEffect(() => {
    if (tabConfigs[tab].apiType === "contactUs" && contactUsData?.id) {
      const existingData = contactUsData; // Assuming there's only one contact record
      contactUsForm.reset({
        id: existingData.id,
        PhoneNO: existingData.PhoneNO,
        WhatupNo: existingData.WhatupNo,
        EmailAdd: existingData.EmailAdd,
        Fax: existingData.Fax,
      });
    }
  }, [contactUsData, tab]);

  // Effect to populate email management form when data is loaded
  useEffect(() => {
    if (
      tabConfigs[tab].apiType === "emailManagement" &&
      emailManagementData?.id
    ) {
      const existingData = emailManagementData;
      emailManagementForm.reset({
        id: existingData.id,
        host: existingData.host,
        port: existingData.port,
        secure: existingData.secure,
        username: existingData.username,
        password: existingData.password,
        fromEmail: existingData.fromEmail,
        fromName: existingData.fromName,
      });
    }
  }, [emailManagementData, tab]);

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

  useEffect(() => {
    if (tabConfigs[tab].apiType === "demandedItems") {
      // Fetch home settings for Demanded Items tab
      getHomeSetting().then((res: any) => {
        setHomeSettings(res.data?.data);
      });
    } else if (tabConfigs[tab].apiType === "contactUs") {
      // Fetch Contact Us data
      fetchContactUsData();
    } else if (tabConfigs[tab].apiType === "emailManagement") {
      // Fetch Email Management data
      fetchEmailManagementData();
    } else if (tabConfigs[tab].apiType === "user") {
      // Fetch ERP Users data
      fetchErpUsers();
    }
  }, [tab]);

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
    const currentTab = tabConfigs[tab];

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

      case "emailManagement":
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
              containerHeight="calc(100vh -350px)"
              emptyStateComponent={<Typography>No users found</Typography>}
            />
          </Box>
        );

      case "inventory":
        return <InventorySettings activeTab={inventoryTab} />;

      case "picklistTemplate":
        return <PicklistTemplateTab />;

      case 'invoiceTemplate':
        return <InvoiceTemplateTab />;

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
      height="calc(100vh - 210px)"
    >
      {/* Left Sidebar - Tabs */}
      <Paper
        sx={{
          width: { xs: "100%", md: 260 },
          height: { xs: "auto", md: "100%" },
          maxHeight: { md: "calc(100vh - 210px)" },
          borderRadius: 3,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          py: 1,
          overflow: "hidden",
        }}
      >
        <Tabs
          orientation={isMobile ? "horizontal" : "vertical"}
          variant="scrollable"
          scrollButtons={false}
          allowScrollButtonsMobile
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            height: { md: "100%" },
            overflowY: { md: "auto" },
            overflowX: { xs: "auto", md: "hidden" },

            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "4px",
            },
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

      {/* Right Content - Form */}
      <Paper
        sx={{
          flexGrow: 1,
          borderRadius: 3,
          boxShadow: "none",
          position: "relative",
          height: "100%",
          overflow: "auto",
        }}
      >
        <Box sx={{ position: "relative", height: "100%" }}>
          {/* Header - hidden for Invoice Template, User, and Inventory tabs (they have their own headers) */}
          {!["invoiceTemplate", "user", "inventory"].includes(tabConfigs[tab].apiType) && (
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
                {tabConfigs[tab].label}
              </Typography>
            </Box>
          )}

          {/* Inventory sub-tabs - only when on Inventory tab */}
          {tabConfigs[tab].apiType === "inventory" && (
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
          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            {renderForm()}
          </Box>

          {/* Save Button - Hide for tabs that have their own save handling */}
          {!["demandedItems", "contactUs", "emailManagement", "user", "picklistTemplate", "invoiceTemplate", "inventory"].includes(tabConfigs[tab].apiType) && (
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
    </Box>
  );
};

export default SettingsTabs;
