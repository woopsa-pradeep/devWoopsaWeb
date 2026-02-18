import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Grid,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  FormControl,
  Select,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import TextInput from "../../../component/atoms/TextInput";
import SelectInput from "../../../component/atoms/SelectInput";
import SwitchInput from "../../../component/atoms/SwitchInput";
import {
  customerList,
  updateCustomer,
  getCustomerById,
  listOfCustomersCreate,
  uploadRetailerDocuments,
  updateRetailerDocuments,
  uploadImages,
} from "../../../redux/apis/distrubutor/retailerApis";
import { geocodeAddress } from "../../../utils/geocodingUtils";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
// import ViewListIcon from "@mui/icons-material/ViewList";
// import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { useDebounce } from "../../../hooks/useDebounce";
import RetailerViewModal from "../../../component/molecules/RetailerViewModal";
import CustomerLimitModal from "../../../component/molecules/CustomerLimitModal";
import { setCustomerLimit } from "../../../redux/apis/distrubutor/settingApis";
import { CustomerLimitFormData } from "./customerLimitSchema";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../../component/atoms/CustomButton";
import Tooltip from "@mui/material/Tooltip";
// import AssessmentIcon from '@mui/icons-material/Assessment';
import LossQtyReportModal from "../../../component/molecules/LossQtyReportModal";

function ActionMenu({
  row,
  onView,
  onSetLimit,
  onEdit,
}: {
  row: any;
  onView: (row: any) => void;
  onSetLimit: (row: any) => void;
  onEdit: (row: any) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    onView(row);
    handleClose();
  };

  const handleSetLimit = () => {
    onSetLimit(row);
    handleClose();
  };

  const handleEdit = () => {
    onEdit(row);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={handleView}
          sx={{ fontSize: 14, gap: 1, color: "text.primary" }}
        >
          <VisibilityIcon fontSize="small" /> View
        </MenuItem>
        <MenuItem
          onClick={handleEdit}
          sx={{ fontSize: 14, gap: 1, color: "text.primary" }}
        >
          <EditIcon fontSize="small" sx={{ color: "primary.main" }} /> Edit
        </MenuItem>
        {row?.isRegisterCustomer && (
          <MenuItem
            onClick={handleSetLimit}
            sx={{ fontSize: 14, gap: 1, color: "text.primary" }}
          >
            <SettingsIcon fontSize="small" /> Set Limit
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

const Retailer = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedLimitRetailer, setSelectedLimitRetailer] = useState<any>(null);
  const [savingLimit, setSavingLimit] = useState(false);

  // Filter state for Inactive
  const [inactiveFilter, setInactiveFilter] = useState<boolean | null>(null); // null = all, true = inactive, false = active

  // Loss Qty Report Modal state
  const [lossQtyReportModalOpen, setLossQtyReportModalOpen] = useState(false);

  // Detailed view state - only table view for now (view tab commented out)
  const viewMode = useState<"table" | "detailed">("table")[0];
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedCurrentPage, setDetailedCurrentPage] = useState(1);
  const [detailedPageSize, setDetailedPageSize] = useState(10);
  const [detailedTotalItems, setDetailedTotalItems] = useState(0);
  const [detailedTotalPages, setDetailedTotalPages] = useState(0);
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: { [section: string]: boolean };
  }>({});

  // Full details state - stores detailed data per customer
  const [detailedCustomersWithFullData, setDetailedCustomersWithFullData] =
    useState<{ [key: number]: any }>({});
  const [loadingFullDetails, setLoadingFullDetails] = useState<{
    [key: number]: boolean;
  }>({});

  // Inline editing state
  const [editingRetailers, setEditingRetailers] = useState<{
    [key: string]: boolean;
  }>({});
  const [retailerEditData, setRetailerEditData] = useState<{
    [key: string]: any;
  }>({});
  const [retailerOriginalData, setRetailerOriginalData] = useState<{
    [key: string]: any;
  }>({});
  const [savingRetailer, setSavingRetailer] = useState<{
    [key: string]: boolean;
  }>({});
  const [retailerDropdownOptions, setRetailerDropdownOptions] = useState<any>({
    salesRep: [],
    classOfTrade: [],
    invoiceFormat: [],
    deliveryId: [],
    ediFormat: [],
    termCode: [],
    customerStatus: [],
    jurisdictionState: [],
    jurisdictionCounty: [],
    jurisdictionCity: [],
  });

  // Geocoding state per retailer
  const [geocodingState, setGeocodingState] = useState<{
    [key: string]: {
      lat: number | null;
      long: number | null;
      loading: boolean;
    };
  }>({});

  // Document state per retailer
  const [documentState, setDocumentState] = useState<{
    [key: string]: {
      attachments: File[];
      salesTaxDoc: File | null;
      CigTaxDoc: File | null;
      licenseAttachments: File[];
      feinDocument: File | null;
      existingUrls: {
        attachments?: string[];
        salesTaxDoc?: string | null;
        CigTaxDoc?: string | null;
        licenseAttachments?: string[];
        feinDocument?: string | null;
      };
      retailerDocumentId: number | null;
    };
  }>({});

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const params: any = {
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize,
      };
      // Add Inactive filter if set (not null)
      if (inactiveFilter !== null) {
        params.Inactive = inactiveFilter;
      }
      const res = (await customerList(params)) as any;
      setRetailers(res?.data?.customerList || []);
      setTotalItems(res?.data?.totalCount || 0);
      setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
    } catch (error) {
      console.error("Error fetching retailers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "table") {
      fetchRetailers();
    }
  }, [currentPage, pageSize, debouncedSearch, viewMode, inactiveFilter]);

  // Store all fetched data and filtered data
  const [allFetchedData, setAllFetchedData] = useState<any[]>([]);
  const [allFilteredData, setAllFilteredData] = useState<any[]>([]);

  // Fetch data using customerList API (same as table view)
  useEffect(() => {
    if (viewMode === "detailed") {
      let ignore = false;
      const fetchDetailedRetailers = async () => {
        setDetailedLoading(true);
        try {
          const params: any = {
            search: debouncedSearch,
            page: detailedCurrentPage,
            limit: detailedPageSize,
          };
          // Add Inactive filter if set (not null)
          if (inactiveFilter !== null) {
            params.Inactive = inactiveFilter;
          }
          const res = (await customerList(params)) as any;

          // Handle customerList response format
          let list = [];
          if (Array.isArray(res?.data?.customerList)) {
            list = res.data.customerList;
          } else if (Array.isArray(res?.data?.data?.customerList)) {
            list = res.data.data.customerList;
          } else if (Array.isArray(res?.customerList)) {
            list = res.customerList;
          } else if (Array.isArray(res?.data?.data)) {
            list = res.data.data;
          } else if (Array.isArray(res?.data)) {
            list = res.data;
          }

          const total =
            res?.data?.totalCount || res?.data?.data?.totalCount || 0;

          if (!ignore) {
            setAllFetchedData(list);
            setDetailedTotalItems(total);
            setDetailedTotalPages(Math.ceil(total / detailedPageSize));
          }
        } catch (error) {
          console.error("Error fetching detailed retailers:", error);
          toast.error("Failed to load detailed retailers");
          if (!ignore) {
            setAllFetchedData([]);
            setDetailedTotalItems(0);
            setDetailedTotalPages(0);
          }
        } finally {
          if (!ignore) setDetailedLoading(false);
        }
      };
      fetchDetailedRetailers();
      return () => {
        ignore = true;
      };
    }
  }, [
    viewMode,
    debouncedSearch,
    detailedCurrentPage,
    detailedPageSize,
    inactiveFilter,
  ]);

  // Set filtered data from fetched data
  useEffect(() => {
    if (viewMode === "detailed") {
      setAllFilteredData(allFetchedData);

      // Reset to first page when search changes
      if (debouncedSearch) {
        setDetailedCurrentPage(1);
      }
    }
  }, [allFetchedData, debouncedSearch, viewMode]);

  // Set detailed data directly from allFetchedData (already paginated by API)
  useEffect(() => {
    if (viewMode === "detailed") {
      setDetailedData(allFilteredData);
    }
  }, [allFilteredData, viewMode]);

  // Fetch full customer details when accordion is opened
  useEffect(() => {
    if (viewMode === "detailed") {
      // Find newly expanded cards that don't have full details yet
      Object.keys(expandedCards).forEach((cardId) => {
        if (expandedCards[cardId]) {
          // Extract customer number from cardId (format: "card-34008")
          const customerNumber = cardId.replace("card-", "");
          const customerNum = parseInt(customerNumber);

          // Check if we already have full details or are currently loading
          if (
            customerNum &&
            !detailedCustomersWithFullData[customerNum] &&
            !loadingFullDetails[customerNum]
          ) {
            // Check if this customer is in the current page data
            const customer = detailedData.find(
              (item: any) => item.C_Number?.toString() === customerNumber,
            );

            if (customer) {
              // Set loading state
              setLoadingFullDetails((prev) => ({
                ...prev,
                [customerNum]: true,
              }));

              const ignore = false;
              const fetchFullDetailsForCustomer = async () => {
                try {
                  console.log(
                    "Fetching full details for customer:",
                    customerNumber,
                  );
                  const response = (await getCustomerById(
                    customerNumber,
                  )) as any;

                  if (!ignore && response?.data) {
                    const fullData = response.data;

                    // retailerDocuments and customerLimit are already in the customerList response (item)
                    // They will be merged in renderDetailedCard, so we don't need to fetch them here

                    // Store full details
                    setDetailedCustomersWithFullData((prev) => ({
                      ...prev,
                      [customerNum]: fullData,
                    }));
                  }
                } catch (error) {
                  console.error(
                    "Error fetching full details for customer:",
                    error,
                  );
                  // On error, keep basic data
                } finally {
                  if (!ignore) {
                    setLoadingFullDetails((prev) => {
                      const newState = { ...prev };
                      delete newState[customerNum];
                      return newState;
                    });
                  }
                }
              };
              fetchFullDetailsForCustomer();
            }
          }
        }
      });
    }
  }, [
    expandedCards,
    viewMode,
    detailedData,
    detailedCustomersWithFullData,
    loadingFullDetails,
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const onViewRetailer = (retailer: any) => {
    setSelectedRetailer(retailer);
    setViewModalOpen(true);
  };

  const onSetLimitRetailer = (retailer: any) => {
    setSelectedLimitRetailer(retailer);
    setLimitModalOpen(true);
  };

  const onEditRetailer = (retailer: any) => {
    // if (viewMode === 'detailed') {
    //   handleEditRetailer(retailer.C_Number, retailer);
    // } else {
    navigate(`/admin/retailer/edit/${retailer.C_Number}`);
    // }
  };

  // Fetch retailer dropdown options
  useEffect(() => {
    if (viewMode === "detailed") {
      fetchRetailerDropdownOptions();
    }
  }, [viewMode]);

  const fetchRetailerDropdownOptions = async () => {
    try {
      const response = (await listOfCustomersCreate()) as any;
      const data = response?.data || {}; // Match AddRetailer.tsx structure

      setRetailerDropdownOptions({
        salesRep: (data.salesRep || []).map((sr: any) => ({
          label:
            `${sr.S_Number || ""} - ${sr.S_Desc || ""}`.trim() ||
            `Sales Rep ${sr.S_Number || ""}`,
          value: String(sr.S_Number || ""),
        })),
        classOfTrade: (data.classOfTrade || []).map((cot: any) => ({
          label: cot.Trade_Desc || "",
          value: cot.Trade_Code || "",
        })),
        invoiceFormat: (data.documentAdditionalFormat || []).map(
          (ifmt: any) => ({
            label: ifmt.Document_Description || "",
            value: String(ifmt.Document_FormatID || ""),
          }),
        ),
        deliveryId: (data.deliveryType || []).map((del: any) => ({
          label: del.Delivery_Description || "",
          value: String(del.Delivery_ID || ""),
        })),
        ediFormat: (data.ediFormatUser || []).map((edi: any) => ({
          label: edi.EDI_DescriptionUser || "",
          value: String(edi.EDI_Format || ""),
        })),
        termCode: (data.terms || []).map((term: any) => ({
          label: term.Terms || "",
          value: String(term.TermsCode || ""),
        })),
        customerStatus: (data.customerStatus || []).map((status: any) => ({
          label:
            `${status.C_Status || ""} - ${status.C_StatusDescription || ""}`.trim() ||
            `Status ${status.C_StatusCode || ""}`,
          value: String(status.C_StatusCode ?? 0),
        })),
        jurisdictionState: (data.taxRate || []).map((state: any) => ({
          label: state.TaxDescription || "",
          value: String(state.Jurisdiction_State ?? 0),
        })),
        jurisdictionCounty: (data.taxRateCounty || []).map((county: any) => ({
          label: county.TaxDescription || "",
          value: String(county.Jurisdiction_County ?? 0),
        })),
        jurisdictionCity: (data.taxRateCity || []).map((city: any) => ({
          label: city.TaxDescription || "",
          value: String(city.Jurisdiction_City ?? 0),
        })),
      });
    } catch (error) {
      console.error("Error fetching retailer dropdown options:", error);
      toast.error("Failed to load dropdown options");
    }
  };

  // Inline editing handlers
  // Helper to upload file and get URL
  const uploadFileAndGetUrl = async (file: File): Promise<string> => {
    try {
      const response = (await uploadImages(file)) as any;
      return response?.data?.url || response?.url || response?.data || "";
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // Geocoding effect - watch address fields and geocode
  useEffect(() => {
    const geocodeAddresses = async () => {
      const geocodePromises: Promise<void>[] = [];

      Object.keys(retailerEditData).forEach((customerNumber) => {
        const editData = retailerEditData[customerNumber];
        if (editData && editingRetailers[customerNumber]) {
          const address = editData.C_Address;
          const city = editData.C_City;
          const state = editData.C_State;
          const zip = editData.C_Zip;
          const country = editData.C_Country || "";

          if (address && city && state && zip) {
            // Set loading state
            setGeocodingState((prev) => ({
              ...prev,
              [customerNumber]: { ...prev[customerNumber], loading: true },
            }));

            geocodePromises.push(
              geocodeAddress(address, city, state, country, zip)
                .then((result) => {
                  if (result) {
                    setGeocodingState((prev) => ({
                      ...prev,
                      [customerNumber]: {
                        lat: result.lat,
                        long: result.long,
                        loading: false,
                      },
                    }));
                  } else {
                    setGeocodingState((prev) => ({
                      ...prev,
                      [customerNumber]: {
                        lat: null,
                        long: null,
                        loading: false,
                      },
                    }));
                  }
                })
                .catch(() => {
                  setGeocodingState((prev) => ({
                    ...prev,
                    [customerNumber]: {
                      lat: null,
                      long: null,
                      loading: false,
                    },
                  }));
                }),
            );
          } else {
            setGeocodingState((prev) => ({
              ...prev,
              [customerNumber]: { lat: null, long: null, loading: false },
            }));
          }
        }
      });

      await Promise.all(geocodePromises);
    };

    // Debounce geocoding
    const timeoutId = setTimeout(() => {
      geocodeAddresses();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [retailerEditData, editingRetailers]);

  const handleEditRetailer = (
    customerNumber: string | number,
    retailerData: any,
  ) => {
    setEditingRetailers((prev) => ({ ...prev, [customerNumber]: true }));

    // Use full details if available, otherwise use basic data
    const fullDetails = detailedCustomersWithFullData[Number(customerNumber)];
    const dataToUse = fullDetails || retailerData;

    // Store original data for comparison (like AddRetailer.tsx)
    // We'll transform it to match editData format when comparing, but store raw data first
    setRetailerOriginalData((prev) => ({
      ...prev,
      [customerNumber]: { ...dataToUse },
    }));

    // Initialize document state
    if (dataToUse.retailerDocuments) {
      const docs = dataToUse.retailerDocuments;
      setDocumentState((prev) => ({
        ...prev,
        [customerNumber]: {
          attachments: [],
          salesTaxDoc: null,
          CigTaxDoc: null,
          licenseAttachments: [],
          feinDocument: null,
          existingUrls: {
            attachments: docs.attachments || [],
            salesTaxDoc: docs.salesTaxDoc || null,
            CigTaxDoc: docs.CigTaxDoc || null,
            licenseAttachments: docs.licenseAttachments || [],
            feinDocument: docs.feinDocument || null,
          },
          retailerDocumentId: docs.id || null,
        },
      }));
    } else {
      setDocumentState((prev) => ({
        ...prev,
        [customerNumber]: {
          attachments: [],
          salesTaxDoc: null,
          CigTaxDoc: null,
          licenseAttachments: [],
          feinDocument: null,
          existingUrls: {},
          retailerDocumentId: null,
        },
      }));
    }

    // Initialize edit data with current retailer data - ALL fields from form
    setRetailerEditData((prev) => ({
      ...prev,
      [customerNumber]: {
        // Customer Information
        C_Name: dataToUse.C_Name || "",
        C_CoName: dataToUse.C_CoName || "",
        C_Alias: dataToUse.C_Alias || "",
        C_Email: dataToUse.C_Email || "",
        // Address
        C_Address: dataToUse.C_Address || "",
        C_City: dataToUse.C_City || "",
        C_State: dataToUse.C_State || "",
        C_Zip: dataToUse.C_Zip || "",
        // Contact
        C_Contact1: dataToUse.C_Contact1 || "",
        C_Contact2: dataToUse.C_Contact2 || "",
        C_Phone: dataToUse.C_Phone || "",
        C_PhoneMobile: dataToUse.C_PhoneMobile || "",
        C_Fax: dataToUse.C_Fax || "",
        // Jurisdiction
        Jurisdiction_State: dataToUse.Jurisdiction_State?.toString() || "0",
        Jurisdiction_County: dataToUse.Jurisdiction_County?.toString() || "0",
        Jurisdiction_City: dataToUse.Jurisdiction_City?.toString() || "0",
        // Business Details
        C_SalesTaxNumber: dataToUse.C_SalesTaxNumber || "",
        C_CigtLicenseNumber: dataToUse.C_CigtLicenseNumber || "",
        C_OtherLicenseNumber: dataToUse.C_OtherLicenseNumber || "",
        C_OtherLicenseNumber2: dataToUse.C_OtherLicenseNumber2 || "",
        C_OtherLicenseNumber3: dataToUse.C_OtherLicenseNumber3 || "",
        C_FEIN: dataToUse.C_FEIN || "",
        C_SalesTaxSelect: dataToUse.C_SalesTaxSelect || "N",
        // Sales Rep & Trade
        C_Salesman:
          dataToUse.C_Salesman?.toString() ||
          retailerData.salesRep?.S_Number?.toString() ||
          retailerData.C_Salesman?.toString() ||
          "",
        C_ClassOfTrade:
          dataToUse.C_ClassOfTrade ||
          retailerData.classOfTrade?.Trade_Code ||
          retailerData.C_ClassOfTrade ||
          "000",
        // Operations
        C_OperationHours1:
          dataToUse.C_OperationHours1 !== undefined
            ? dataToUse.C_OperationHours1
            : retailerData.C_OperationHours1 || 0,
        C_OperationHours2:
          dataToUse.C_OperationHours2 !== undefined
            ? dataToUse.C_OperationHours2
            : retailerData.C_OperationHours2 || 0,
        C_Inactive:
          dataToUse.C_Inactive !== undefined
            ? dataToUse.C_Inactive === true || dataToUse.C_Inactive === 1
              ? 1
              : 0
            : retailerData.C_Inactive !== undefined
              ? retailerData.C_Inactive === true ||
                retailerData.C_Inactive === 1
                ? 1
                : 0
              : 0,
        C_StatusCode:
          dataToUse.C_StatusCode !== undefined
            ? dataToUse.C_StatusCode
            : retailerData.C_StatusCode !== undefined
              ? retailerData.C_StatusCode
              : 0,
        C_OrderDay:
          dataToUse.C_OrderDay !== undefined
            ? dataToUse.C_OrderDay
            : retailerData.C_OrderDay || 0,
        C_OrderDaySequence:
          dataToUse.C_OrderDaySequence !== undefined
            ? dataToUse.C_OrderDaySequence
            : retailerData.C_OrderDaySequence || 1,
        // Delivery
        Delivery_Charge:
          dataToUse.Delivery_Charge !== undefined
            ? dataToUse.Delivery_Charge === true ||
              dataToUse.Delivery_Charge === 1
              ? 1
              : 0
            : retailerData.Delivery_Charge !== undefined
              ? retailerData.Delivery_Charge === true ||
                retailerData.Delivery_Charge === 1
                ? 1
                : 0
              : 0,
        Delivery_Amount:
          dataToUse.Delivery_Amount !== undefined
            ? dataToUse.Delivery_Amount
            : retailerData.Delivery_Amount || 0,
        Delivery_ID:
          dataToUse.Delivery_ID !== undefined
            ? dataToUse.Delivery_ID
            : retailerData.Delivery_ID !== undefined
              ? retailerData.Delivery_ID
              : 0,
        // Pricing & Discounts
        C_CaseDiscount:
          dataToUse.C_CaseDiscount !== undefined
            ? dataToUse.C_CaseDiscount === true ||
              dataToUse.C_CaseDiscount === 1
              ? 1
              : 0
            : retailerData.C_CaseDiscount !== undefined
              ? retailerData.C_CaseDiscount === true ||
                retailerData.C_CaseDiscount === 1
                ? 1
                : 0
              : 0,
        // Invoice & EDI
        C_InvoiceFormat:
          dataToUse.C_InvoiceFormat !== undefined
            ? dataToUse.C_InvoiceFormat
            : retailerData.C_InvoiceFormat !== undefined
              ? retailerData.C_InvoiceFormat
              : 0,
        EDI_Format:
          dataToUse.EDI_Format !== undefined
            ? dataToUse.EDI_Format
            : retailerData.EDI_Format !== undefined
              ? retailerData.EDI_Format
              : 0,
        // Terms & Credit
        TermCode:
          dataToUse.TermsCode !== undefined
            ? dataToUse.TermsCode
            : dataToUse.TermCode !== undefined
              ? dataToUse.TermCode
              : retailerData.terms?.TermsCode !== undefined
                ? retailerData.terms.TermsCode
                : retailerData.TermCode !== undefined
                  ? retailerData.TermCode
                  : 0,
        Credit_Limit:
          dataToUse.Credit_Limit !== undefined
            ? dataToUse.Credit_Limit
            : retailerData.Credit_Limit || 0,
        // Additional
        C_Memo: dataToUse.C_Memo || retailerData.C_Memo || "",
        Service_Charge:
          dataToUse.Service_Charge !== undefined
            ? dataToUse.Service_Charge === true ||
              dataToUse.Service_Charge === 1
              ? 1
              : 0
            : retailerData.Service_Charge !== undefined
              ? retailerData.Service_Charge === true ||
                retailerData.Service_Charge === 1
                ? 1
                : 0
              : 0,
        Other_Amount:
          dataToUse.Other_Amount !== undefined
            ? dataToUse.Other_Amount
            : retailerData.Other_Amount || 0,
        // POS
        POS_CashC:
          dataToUse.POS_CashC !== undefined
            ? dataToUse.POS_CashC === true || dataToUse.POS_CashC === 1
              ? 1
              : 0
            : retailerData.POS_CashC !== undefined
              ? retailerData.POS_CashC === true || retailerData.POS_CashC === 1
                ? 1
                : 0
              : 1,
        POS_CheckC:
          dataToUse.POS_CheckC !== undefined
            ? dataToUse.POS_CheckC === true || dataToUse.POS_CheckC === 1
              ? 1
              : 0
            : retailerData.POS_CheckC !== undefined
              ? retailerData.POS_CheckC === true ||
                retailerData.POS_CheckC === 1
                ? 1
                : 0
              : 1,
        POS_CreditC:
          dataToUse.POS_CreditC !== undefined
            ? dataToUse.POS_CreditC === true || dataToUse.POS_CreditC === 1
              ? 1
              : 0
            : retailerData.POS_CreditC !== undefined
              ? retailerData.POS_CreditC === true ||
                retailerData.POS_CreditC === 1
                ? 1
                : 0
              : 1,
        POS_DebitC:
          dataToUse.POS_DebitC !== undefined
            ? dataToUse.POS_DebitC === true || dataToUse.POS_DebitC === 1
              ? 1
              : 0
            : retailerData.POS_DebitC !== undefined
              ? retailerData.POS_DebitC === true ||
                retailerData.POS_DebitC === 1
                ? 1
                : 0
              : 1,
        POS_OtherC:
          dataToUse.POS_OtherC !== undefined
            ? dataToUse.POS_OtherC === true || dataToUse.POS_OtherC === 1
              ? 1
              : 0
            : retailerData.POS_OtherC !== undefined
              ? retailerData.POS_OtherC === true ||
                retailerData.POS_OtherC === 1
                ? 1
                : 0
              : 1,
        POS_HouseC:
          dataToUse.POS_HouseC !== undefined
            ? dataToUse.POS_HouseC === true || dataToUse.POS_HouseC === 1
              ? 1
              : 0
            : retailerData.POS_HouseC !== undefined
              ? retailerData.POS_HouseC === true ||
                retailerData.POS_HouseC === 1
                ? 1
                : 0
              : 1,
        // MSA
        MSA_AcceptPromo:
          dataToUse.MSA_AcceptPromo !== undefined
            ? dataToUse.MSA_AcceptPromo === true ||
              dataToUse.MSA_AcceptPromo === 1
              ? 1
              : 0
            : retailerData.MSA_AcceptPromo !== undefined
              ? retailerData.MSA_AcceptPromo === true ||
                retailerData.MSA_AcceptPromo === 1
                ? 1
                : 0
              : 1,
        // Email Settings
        emailInvoice:
          dataToUse.emailInvoice !== undefined
            ? dataToUse.emailInvoice === true || dataToUse.emailInvoice === 1
              ? 1
              : 0
            : retailerData.emailInvoice !== undefined
              ? retailerData.emailInvoice === true ||
                retailerData.emailInvoice === 1
                ? 1
                : 0
              : 0,
        emailInvoiceEDI:
          dataToUse.emailInvoiceEDI !== undefined
            ? dataToUse.emailInvoiceEDI === true ||
              dataToUse.emailInvoiceEDI === 1
              ? 1
              : 0
            : retailerData.emailInvoiceEDI !== undefined
              ? retailerData.emailInvoiceEDI === true ||
                retailerData.emailInvoiceEDI === 1
                ? 1
                : 0
              : 0,
        emailReport:
          dataToUse.emailReport !== undefined
            ? dataToUse.emailReport === true || dataToUse.emailReport === 1
              ? 1
              : 0
            : retailerData.emailReport !== undefined
              ? retailerData.emailReport === true ||
                retailerData.emailReport === 1
                ? 1
                : 0
              : 0,
        emailStatement:
          dataToUse.emailStatement !== undefined
            ? dataToUse.emailStatement === true ||
              dataToUse.emailStatement === 1
              ? 1
              : 0
            : retailerData.emailStatement !== undefined
              ? retailerData.emailStatement === true ||
                retailerData.emailStatement === 1
                ? 1
                : 0
              : 0,
        emailPromo:
          dataToUse.emailPromo !== undefined
            ? dataToUse.emailPromo === true || dataToUse.emailPromo === 1
              ? 1
              : 0
            : retailerData.emailPromo !== undefined
              ? retailerData.emailPromo === true ||
                retailerData.emailPromo === 1
                ? 1
                : 0
              : 0,
        // Category Allow
        Category_Allow01:
          dataToUse.Category_Allow01 !== undefined
            ? dataToUse.Category_Allow01 === true ||
              dataToUse.Category_Allow01 === 1
              ? 1
              : 0
            : retailerData.Category_Allow01 !== undefined
              ? retailerData.Category_Allow01 === true ||
                retailerData.Category_Allow01 === 1
                ? 1
                : 0
              : 1,
        Category_Allow02:
          dataToUse.Category_Allow02 !== undefined
            ? dataToUse.Category_Allow02 === true ||
              dataToUse.Category_Allow02 === 1
              ? 1
              : 0
            : retailerData.Category_Allow02 !== undefined
              ? retailerData.Category_Allow02 === true ||
                retailerData.Category_Allow02 === 1
                ? 1
                : 0
              : 1,
        Category_Allow03:
          dataToUse.Category_Allow03 !== undefined
            ? dataToUse.Category_Allow03 === true ||
              dataToUse.Category_Allow03 === 1
              ? 1
              : 0
            : retailerData.Category_Allow03 !== undefined
              ? retailerData.Category_Allow03 === true ||
                retailerData.Category_Allow03 === 1
                ? 1
                : 0
              : 1,
        Category_Allow04:
          dataToUse.Category_Allow04 !== undefined
            ? dataToUse.Category_Allow04 === true ||
              dataToUse.Category_Allow04 === 1
              ? 1
              : 0
            : retailerData.Category_Allow04 !== undefined
              ? retailerData.Category_Allow04 === true ||
                retailerData.Category_Allow04 === 1
                ? 1
                : 0
              : 1,
        Category_Allow05:
          dataToUse.Category_Allow05 !== undefined
            ? dataToUse.Category_Allow05 === true ||
              dataToUse.Category_Allow05 === 1
              ? 1
              : 0
            : retailerData.Category_Allow05 !== undefined
              ? retailerData.Category_Allow05 === true ||
                retailerData.Category_Allow05 === 1
                ? 1
                : 0
              : 1,
        Category_Allow06:
          dataToUse.Category_Allow06 !== undefined
            ? dataToUse.Category_Allow06 === true ||
              dataToUse.Category_Allow06 === 1
              ? 1
              : 0
            : retailerData.Category_Allow06 !== undefined
              ? retailerData.Category_Allow06 === true ||
                retailerData.Category_Allow06 === 1
                ? 1
                : 0
              : 1,
        Category_Allow07:
          dataToUse.Category_Allow07 !== undefined
            ? dataToUse.Category_Allow07 === true ||
              dataToUse.Category_Allow07 === 1
              ? 1
              : 0
            : retailerData.Category_Allow07 !== undefined
              ? retailerData.Category_Allow07 === true ||
                retailerData.Category_Allow07 === 1
                ? 1
                : 0
              : 1,
        Category_Allow08:
          dataToUse.Category_Allow08 !== undefined
            ? dataToUse.Category_Allow08 === true ||
              dataToUse.Category_Allow08 === 1
              ? 1
              : 0
            : retailerData.Category_Allow08 !== undefined
              ? retailerData.Category_Allow08 === true ||
                retailerData.Category_Allow08 === 1
                ? 1
                : 0
              : 1,
        Category_Allow09:
          dataToUse.Category_Allow09 !== undefined
            ? dataToUse.Category_Allow09 === true ||
              dataToUse.Category_Allow09 === 1
              ? 1
              : 0
            : retailerData.Category_Allow09 !== undefined
              ? retailerData.Category_Allow09 === true ||
                retailerData.Category_Allow09 === 1
                ? 1
                : 0
              : 1,
        Category_Allow10:
          dataToUse.Category_Allow10 !== undefined
            ? dataToUse.Category_Allow10 === true ||
              dataToUse.Category_Allow10 === 1
              ? 1
              : 0
            : retailerData.Category_Allow10 !== undefined
              ? retailerData.Category_Allow10 === true ||
                retailerData.Category_Allow10 === 1
                ? 1
                : 0
              : 1,
        Category_Allow11:
          dataToUse.Category_Allow11 !== undefined
            ? dataToUse.Category_Allow11 === true ||
              dataToUse.Category_Allow11 === 1
              ? 1
              : 0
            : retailerData.Category_Allow11 !== undefined
              ? retailerData.Category_Allow11 === true ||
                retailerData.Category_Allow11 === 1
                ? 1
                : 0
              : 1,
        Category_Allow12:
          dataToUse.Category_Allow12 !== undefined
            ? dataToUse.Category_Allow12 === true ||
              dataToUse.Category_Allow12 === 1
              ? 1
              : 0
            : retailerData.Category_Allow12 !== undefined
              ? retailerData.Category_Allow12 === true ||
                retailerData.Category_Allow12 === 1
                ? 1
                : 0
              : 1,
      },
    }));
  };
  console.log(handleEditRetailer);
  const handleCancelEditRetailer = (customerNumber: string | number) => {
    setEditingRetailers((prev) => {
      const newState = { ...prev };
      delete newState[customerNumber];
      return newState;
    });
    setRetailerEditData((prev) => {
      const newState = { ...prev };
      delete newState[customerNumber];
      return newState;
    });
    setRetailerOriginalData((prev) => {
      const newState = { ...prev };
      delete newState[customerNumber];
      return newState;
    });
    // Clear geocoding state
    setGeocodingState((prev) => {
      const newState = { ...prev };
      delete newState[customerNumber];
      return newState;
    });
    // Clear document state
    setDocumentState((prev) => {
      const newState = { ...prev };
      delete newState[customerNumber];
      return newState;
    });
  };

  const handleSaveRetailer = async (customerNumber: string | number) => {
    const editData = retailerEditData[customerNumber];
    const originalData = retailerOriginalData[customerNumber];
    if (!editData || !originalData) return;

    setSavingRetailer((prev) => ({ ...prev, [customerNumber]: true }));
    try {
      // Geocode the address before submitting (same as AddRetailer.tsx)
      let geocodedAddress = null;
      try {
        geocodedAddress = await geocodeAddress(
          editData.C_Address || "",
          editData.C_City || "",
          editData.C_State || "",
          editData.C_Country || "",
          editData.C_Zip || "",
        );
        if (!geocodedAddress) {
          console.warn(
            "Address geocoding failed, but continuing with form submission",
          );
        }
      } catch (error) {
        console.error("Error during address geocoding:", error);
        // Continue with form submission even if geocoding fails
      }

      // Only send changed fields (exact same approach as AddRetailer.tsx)
      // Transform originalData to match editData field names and formats for comparison
      const transformedOriginalData: any = { ...originalData };

      // Map API field names to form field names
      if (originalData.TermsCode !== undefined) {
        transformedOriginalData.TermCode = originalData.TermsCode;
      } else if (originalData.TermCode !== undefined) {
        transformedOriginalData.TermCode = originalData.TermCode;
      } else {
        transformedOriginalData.TermCode = 0;
      }

      // Ensure Jurisdiction fields are strings (matching editData format)
      if (transformedOriginalData.Jurisdiction_State !== undefined) {
        transformedOriginalData.Jurisdiction_State = String(
          transformedOriginalData.Jurisdiction_State,
        );
      } else {
        transformedOriginalData.Jurisdiction_State = "0";
      }
      if (transformedOriginalData.Jurisdiction_County !== undefined) {
        transformedOriginalData.Jurisdiction_County = String(
          transformedOriginalData.Jurisdiction_County,
        );
      } else {
        transformedOriginalData.Jurisdiction_County = "0";
      }
      if (transformedOriginalData.Jurisdiction_City !== undefined) {
        transformedOriginalData.Jurisdiction_City = String(
          transformedOriginalData.Jurisdiction_City,
        );
      } else {
        transformedOriginalData.Jurisdiction_City = "0";
      }

      // Ensure C_Salesman is string (matching editData format)
      if (transformedOriginalData.C_Salesman !== undefined) {
        transformedOriginalData.C_Salesman = String(
          transformedOriginalData.C_Salesman,
        );
      } else if (originalData.salesRep?.S_Number !== undefined) {
        transformedOriginalData.C_Salesman = String(
          originalData.salesRep.S_Number,
        );
      } else {
        transformedOriginalData.C_Salesman = "";
      }

      const changedFields: any = {};
      Object.keys(editData).forEach((key) => {
        const currentValue = editData[key];
        const originalValue = transformedOriginalData[key];

        // Deep comparison for objects/arrays (exact same as AddRetailer.tsx)
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          // Map form field names to API field names
          if (key === "TermCode") {
            // API expects TermsCode, not TermCode
            changedFields.TermsCode = currentValue;
          } else {
            changedFields[key] = currentValue;
          }
        }
      });

      // Add geocoded address if available
      if (geocodedAddress) {
        changedFields.address = geocodedAddress;
      }

      const response = (await updateCustomer(
        String(customerNumber),
        changedFields,
      )) as any;
      if (response?.success) {
        // Upload documents if any (same as AddRetailer.tsx)
        const docState = documentState[customerNumber];
        if (
          docState &&
          (docState.attachments.length > 0 ||
            docState.salesTaxDoc ||
            docState.CigTaxDoc ||
            docState.licenseAttachments.length > 0 ||
            docState.feinDocument)
        ) {
          try {
            const documentData: {
              attachments?: string[];
              salesTaxDoc?: string | null;
              CigTaxDoc?: string | null;
              licenseAttachments?: string[];
              feinDocument?: string | null;
            } = {
              attachments: [...(docState.existingUrls.attachments || [])],
              salesTaxDoc: docState.existingUrls.salesTaxDoc || null,
              CigTaxDoc: docState.existingUrls.CigTaxDoc || null,
              licenseAttachments: [
                ...(docState.existingUrls.licenseAttachments || []),
              ],
              feinDocument: docState.existingUrls.feinDocument || null,
            };

            // Upload new attachments
            if (docState.attachments.length > 0) {
              const uploadedUrls = await Promise.all(
                docState.attachments.map((file) => uploadFileAndGetUrl(file)),
              );
              documentData.attachments = [
                ...(documentData.attachments || []),
                ...uploadedUrls,
              ];
            }

            // Upload new salesTaxDoc
            if (docState.salesTaxDoc) {
              documentData.salesTaxDoc = await uploadFileAndGetUrl(
                docState.salesTaxDoc,
              );
            }

            // Upload new CigTaxDoc
            if (docState.CigTaxDoc) {
              documentData.CigTaxDoc = await uploadFileAndGetUrl(
                docState.CigTaxDoc,
              );
            }

            // Upload new licenseAttachments
            if (docState.licenseAttachments.length > 0) {
              const uploadedUrls = await Promise.all(
                docState.licenseAttachments.map((file) =>
                  uploadFileAndGetUrl(file),
                ),
              );
              documentData.licenseAttachments = [
                ...(documentData.licenseAttachments || []),
                ...uploadedUrls,
              ];
            }

            // Upload new feinDocument
            if (docState.feinDocument) {
              documentData.feinDocument = await uploadFileAndGetUrl(
                docState.feinDocument,
              );
            }

            // Save documents (same as AddRetailer.tsx)
            if (docState.retailerDocumentId) {
              await updateRetailerDocuments(docState.retailerDocumentId, {
                customerNumber: Number(customerNumber),
                ...documentData,
              });
            } else {
              const docResponse = (await uploadRetailerDocuments({
                customerNumber: Number(customerNumber),
                ...documentData,
              })) as any;
              if (docResponse?.data?.id) {
                setDocumentState((prev) => ({
                  ...prev,
                  [customerNumber]: {
                    ...prev[customerNumber],
                    retailerDocumentId: docResponse.data.id,
                  },
                }));
              }
            }
          } catch (docError: any) {
            console.error("Error uploading documents:", docError);
            toast.error("Retailer updated but documents upload failed");
          }
        }

        toast.success(response?.message || "Retailer updated successfully!");
        handleCancelEditRetailer(customerNumber);
        // Refresh the full details
        const res = (await getCustomerById(String(customerNumber))) as any;
        const updatedRetailer = res?.data;
        if (updatedRetailer) {
          // Update full details cache
          setDetailedCustomersWithFullData((prev) => ({
            ...prev,
            [Number(customerNumber)]: updatedRetailer,
          }));
          // Also update basic data in list
          setDetailedData((prev) => {
            const index = prev.findIndex(
              (r: any) => r.C_Number === customerNumber,
            );
            if (index >= 0) {
              const newData = [...prev];
              newData[index] = { ...newData[index], ...updatedRetailer };
              return newData;
            }
            return prev;
          });
        }
      } else {
        toast.error(response?.message || "Failed to update retailer");
      }
    } catch (error: any) {
      console.error("Error updating retailer:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update retailer",
      );
    } finally {
      setSavingRetailer((prev) => {
        const newState = { ...prev };
        delete newState[customerNumber];
        return newState;
      });
    }
  };

  const updateRetailerEditField = (
    customerNumber: string | number,
    field: string,
    value: any,
  ) => {
    setRetailerEditData((prev) => ({
      ...prev,
      [customerNumber]: {
        ...prev[customerNumber],
        [field]: value,
      },
    }));
  };

  // Helper to render editable field for retailer
  const renderEditableRetailerField = (
    customerNumber: string | number,
    label: string,
    field: string,
    value: any,
    type: "text" | "number" | "dropdown" | "toggle" = "text",
    options?: Array<{ label: string; value: string }>,
    formatValue?: (val: any) => string,
  ) => {
    const isEditing = editingRetailers[customerNumber];
    const editValue = retailerEditData[customerNumber]?.[field] ?? value;

    return (
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          py: 0.75,
          px: 1,
          borderRadius: 0.5,
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: isEditing
              ? "transparent"
              : (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
          },
        }}
      >
        <Typography
          fontSize={13}
          color="text.secondary"
          sx={{
            minWidth: "140px",
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
        {isEditing ? (
          type === "number" ? (
            <TextInput
              type="number"
              value={editValue || ""}
              onChange={(e) =>
                updateRetailerEditField(customerNumber, field, e.target.value)
              }
              sx={{
                fontSize: 13,
                "& .MuiInputBase-input": {
                  fontSize: 13,
                  py: 0.75,
                  px: 1,
                  textAlign: "right",
                },
                width: "140px",
                "& .MuiOutlinedInput-root": {
                  height: "32px",
                },
              }}
            />
          ) : type === "dropdown" && options ? (
            <SelectInput
              value={String(editValue || "")}
              onChange={(e) =>
                updateRetailerEditField(customerNumber, field, e.target.value)
              }
              options={options}
              sx={{
                fontSize: 13,
                "& .MuiSelect-select": {
                  fontSize: 13,
                  py: 0.75,
                  px: 1,
                },
                minWidth: "140px",
                mb: 0,
                "& .MuiOutlinedInput-root": {
                  height: "32px",
                },
              }}
            />
          ) : type === "toggle" ? (
            <SwitchInput
              checked={editValue === true || editValue === 1}
              onChange={(checked) => {
                // Convert boolean to 0/1 for number fields (same as AddRetailer.tsx)
                // Fields that should be numbers: POS_*, email*, Category_Allow*, MSA_AcceptPromo, C_Inactive, Delivery_Charge, C_CaseDiscount, Service_Charge
                const numberFields = [
                  "POS_CashC",
                  "POS_CheckC",
                  "POS_CreditC",
                  "POS_DebitC",
                  "POS_OtherC",
                  "POS_HouseC",
                  "emailInvoice",
                  "emailInvoiceEDI",
                  "emailReport",
                  "emailStatement",
                  "emailPromo",
                  "Category_Allow01",
                  "Category_Allow02",
                  "Category_Allow03",
                  "Category_Allow04",
                  "Category_Allow05",
                  "Category_Allow06",
                  "Category_Allow07",
                  "Category_Allow08",
                  "Category_Allow09",
                  "Category_Allow10",
                  "Category_Allow11",
                  "Category_Allow12",
                  "MSA_AcceptPromo",
                  "C_Inactive",
                  "Delivery_Charge",
                  "C_CaseDiscount",
                  "Service_Charge",
                ];
                const value = numberFields.includes(field)
                  ? checked
                    ? 1
                    : 0
                  : checked;
                updateRetailerEditField(customerNumber, field, value);
              }}
              sx={{ mb: 0 }}
              isShowLabel={false}
            />
          ) : (
            <TextInput
              value={editValue || ""}
              onChange={(e) =>
                updateRetailerEditField(customerNumber, field, e.target.value)
              }
              sx={{
                fontSize: 13,
                "& .MuiInputBase-input": {
                  fontSize: 13,
                  py: 0.75,
                  px: 1,
                },
                flex: 1,
                maxWidth: "200px",
                "& .MuiOutlinedInput-root": {
                  height: "32px",
                },
              }}
            />
          )
        ) : (
          <Typography
            fontSize={13}
            fontWeight={400}
            color="text.primary"
            sx={{ flex: 1, textAlign: "right" }}
          >
            {formatValue ? formatValue(value) : String(value || "-")}
          </Typography>
        )}
      </Box>
    );
  };

  const handleLimitSubmit = async (data: CustomerLimitFormData) => {
    if (!selectedLimitRetailer) return;

    setSavingLimit(true);
    try {
      await setCustomerLimit(selectedLimitRetailer.C_Number, data);
      toast.success("Customer limit updated successfully!");
      await fetchRetailers(); // Fetch updated data after successful limit update
      setLimitModalOpen(false);
      setSelectedLimitRetailer(null);
    } catch (error) {
      console.error("Failed to update customer limit:", error);
      toast.error("Failed to update customer limit");
    } finally {
      setSavingLimit(false);
    }
  };

  // Shop SVG Icon Component
  const ShopIcon = ({ size = 100 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
        stroke="#1976d2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 22V12H15V22"
        stroke="#1976d2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  // Render detailed view card
  const renderDetailedCard = (item: any, index: number) => {
    const cardId = `card-${item.C_Number}`;

    // Find full details if available
    const fullDetails = detailedCustomersWithFullData[item.C_Number];
    const isLoading = loadingFullDetails[item.C_Number];

    // Merge data: ALWAYS use retailerDocuments and customerLimit from customerList (item) - ONLY from listing API
    // Use fullDetails for other fields, fallback to item
    // Never use retailerDocuments or customerLimit from fullDetails - only from listing API
    const retailerDocs =
      item.retailerDocuments !== null && item.retailerDocuments !== undefined
        ? item.retailerDocuments
        : null;

    const customerLimitData = item.customerLimit || null;

    const customerData = fullDetails
      ? {
          ...fullDetails,
          // ONLY use retailerDocuments and customerLimit from listing API (item)
          retailerDocuments: retailerDocs,
          customerLimit: customerLimitData,
        }
      : {
          ...item,
          retailerDocuments: retailerDocs,
          customerLimit: customerLimitData,
        };

    // All cards closed by default - only open when user clicks
    const isCardExpanded = expandedCards[cardId] || false;

    // Initialize expanded sections for this card if not exists (all closed by default)
    if (!expandedSections[cardId]) {
      setExpandedSections((prev) => ({
        ...prev,
        [cardId]: {
          profile: false,
          contact: false,
          business: false,
          financial: false,
          routes: false,
          documents: false,
          additional: false,
        },
      }));
    }

    const sectionExpanded = expandedSections[cardId] || {};

    return (
      <Accordion
        key={item.C_Number || index}
        expanded={isCardExpanded}
        onChange={(_, expanded) => {
          setExpandedCards((prev) => ({ ...prev, [cardId]: expanded }));
        }}
        sx={{
          mb: 1.5,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 1px 4px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(0,0,0,0.08)",
          borderRadius: 1,
          bgcolor: "background.paper",
          "&:before": { display: "none" },
          transition: "all 0.3s ease-in-out",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "grey.50",
            px: 1.5,
            py: 1,
            minHeight: 56,
            "&.Mui-expanded": { minHeight: 56 },
            transition: "all 0.3s ease-in-out",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={{ xs: 1, md: 2 }}
            width="100%"
            sx={{ maxWidth: "100%", overflow: "hidden" }}
          >
            <Box
              sx={{
                width: { xs: 60, md: 100 },
                height: { xs: 60, md: 100 },
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "grey.100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShopIcon size={80} />
            </Box>
            <Box
              flex={1}
              minWidth={0}
              sx={{ maxWidth: "100%", overflow: "hidden" }}
            >
              {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
              <Typography
                fontSize={{ xs: 12, md: 14 }}
                fontWeight={500}
                color="primary.main"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 2, md: 1 },
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                }}
              >
                {customerData.C_Name || item.C_Name || "N/A"}
              </Typography>
              <Box
                display="flex"
                gap={{ xs: 0.5, md: 1 }}
                mt={0.5}
                flexWrap="wrap"
                sx={{ maxWidth: "100%" }}
              >
                <Chip
                  label={`#${item.C_Number}`}
                  size="small"
                  sx={{ height: 20, fontSize: 10 }}
                />
                <Chip
                  label={!item.C_Inactive ? "Active" : "Inactive"}
                  size="small"
                  color={!item.C_Inactive ? "success" : "error"}
                  sx={{ height: 20, fontSize: 9 }}
                />
                {item.salesRep?.S_Desc && (
                  <Chip
                    label={item.salesRep.S_Desc}
                    size="small"
                    sx={{ height: 20, fontSize: 9 }}
                  />
                )}
                {item.classOfTrade?.Trade_Desc && (
                  <Chip
                    label={item.classOfTrade.Trade_Desc}
                    size="small"
                    sx={{ height: 20, fontSize: 9 }}
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={{ xs: 0.25, md: 0.5 }} flexShrink={0}>
              {editingRetailers[item.C_Number] ? (
                <>
                  <Tooltip title="Save Changes">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveRetailer(item.C_Number);
                      }}
                      disabled={savingRetailer[item.C_Number]}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: { xs: 0.5, md: 1 },
                      }}
                    >
                      {savingRetailer[item.C_Number] ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon
                          sx={{ fontSize: { xs: 16, md: 18 } }}
                          color="primary"
                        />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel Edit">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditRetailer(item.C_Number);
                      }}
                      disabled={savingRetailer[item.C_Number]}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: { xs: 0.5, md: 1 },
                      }}
                    >
                      <CancelIcon
                        sx={{ fontSize: { xs: 16, md: 18 } }}
                        color="error"
                      />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRetailer(item);
                      }}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: { xs: 0.5, md: 1 },
                      }}
                    >
                      <VisibilityIcon
                        sx={{ fontSize: { xs: 16, md: 18 } }}
                        color="primary"
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Retailer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRetailer(item);
                      }}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: { xs: 0.5, md: 1 },
                      }}
                    >
                      <EditIcon
                        sx={{ fontSize: { xs: 16, md: 18 } }}
                        color="primary"
                      />
                    </IconButton>
                  </Tooltip>
                  {item?.isRegisterCustomer && (
                    <Tooltip title="Set Limit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetLimitRetailer(item);
                        }}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          p: { xs: 0.5, md: 1 },
                        }}
                      >
                        <SettingsIcon
                          sx={{ fontSize: { xs: 16, md: 18 } }}
                          color="secondary"
                        />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails
          sx={{ p: { xs: 0.5, md: 1 }, maxWidth: "100%", overflow: "hidden" }}
        >
          <Grid
            container
            spacing={{ xs: 1, md: 1.5 }}
            sx={{ maxWidth: "100%", margin: 0 }}
          >
            {/* Customer Profile Section */}
            <Grid
              size={{ xs: 12, md: 6, lg: 4 }}
              sx={{ display: "flex", maxWidth: "100%" }}
            >
              <Accordion
                expanded={sectionExpanded.profile === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], profile: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                    maxWidth: "100%",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Customer Profile
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1,
                    pb: 1,
                    pt: 0.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={1}>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Customer ID:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.C_Number || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Company Name:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.C_CoName || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Sales Rep:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.salesRep?.S_Desc || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Class of Trade:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.classOfTrade?.Trade_Desc || 'N/A'}</Typography>
                    </Box> */}
                    {/* {renderEditableRetailerField(item.C_Number, 'Customer Name', 'C_Name', customerData.C_Name || item.C_Name, 'text')}
                    {renderEditableRetailerField(item.C_Number, 'Company Name', 'C_CoName', customerData.C_CoName || item.C_CoName, 'text')}
                    {renderEditableRetailerField(item.C_Number, 'Alias', 'C_Alias', customerData.C_Alias || item.C_Alias, 'text')} */}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Customer ID",
                      "C_Number",
                      item.C_Number,
                      "text",
                    )}

                    {renderEditableRetailerField(
                      item.C_Number,
                      "Customer Name",
                      "C_Name",
                      customerData.C_Name || item.C_Name,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Company Name",
                      "C_CoName",
                      customerData.C_CoName || item.C_CoName,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Sales Rep",
                      "C_Salesman",
                      customerData.C_Salesman ||
                        item.salesRep?.S_Number ||
                        item.C_Salesman,
                      "dropdown",
                      retailerDropdownOptions.salesRep,
                      (val) => {
                        const option = retailerDropdownOptions.salesRep.find(
                          (opt: any) => opt.value === String(val),
                        );
                        return option
                          ? option.label
                          : item.salesRep?.S_Desc || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Address",
                      "C_Address",
                      customerData.C_Address || item.C_Address,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "City",
                      "C_City",
                      customerData.C_City || item.C_City,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "State",
                      "C_State",
                      customerData.C_State || item.C_State,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Zip",
                      "C_Zip",
                      customerData.C_Zip || item.C_Zip,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Inactive",
                      "C_Inactive",
                      customerData.C_Inactive !== undefined
                        ? customerData.C_Inactive
                        : item.C_Inactive,
                      "toggle",
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Contact Details Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.contact === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], contact: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Contact Details & License Info
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1.5,
                    pb: 1.5,
                    pt: 1,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "400px",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "#f1f1f1",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.2)"
                          : "#888",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.3)"
                          : "#555",
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {/* Geocoding Display */}
                    {editingRetailers[item.C_Number] &&
                      (() => {
                        const geoState = geocodingState[item.C_Number];
                        const editData = retailerEditData[item.C_Number];
                        const hasAddressFields =
                          editData?.C_Address &&
                          editData?.C_City &&
                          editData?.C_State &&
                          editData?.C_Zip;
                        const lat = geoState?.lat ?? null;
                        const long = geoState?.long ?? null;
                        const loading = geoState?.loading ?? false;
                        return (
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{
                              py: 0.75,
                              px: 1,
                              borderRadius: 0.5,
                              transition: "background-color 0.2s",
                              "&:hover": {
                                bgcolor: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,0.03)"
                                    : "rgba(0,0,0,0.02)",
                              },
                            }}
                          >
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              sx={{ minWidth: "140px", fontWeight: 500 }}
                            >
                              Latitude / Longitude
                            </Typography>
                            <Typography
                              fontSize={13}
                              fontWeight={400}
                              color="text.primary"
                              sx={{ flex: 1, textAlign: "right" }}
                            >
                              {loading ? (
                                <CircularProgress size={14} />
                              ) : lat !== null && long !== null ? (
                                `${lat.toFixed(6)}, ${long.toFixed(6)}`
                              ) : hasAddressFields ? (
                                "Unable to geocode address"
                              ) : (
                                "Fill all address fields to get coordinates"
                              )}
                            </Typography>
                          </Box>
                        );
                      })()}
                    {/* {renderEditableRetailerField(item.C_Number, 'Contact 1', 'C_Contact1', customerData.C_Contact1 || item.C_Contact1, 'text')}
                    {renderEditableRetailerField(item.C_Number, 'Contact 2', 'C_Contact2', customerData.C_Contact2 || item.C_Contact2, 'text')} */}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Phone",
                      "C_Phone",
                      customerData.C_Phone || item.C_Phone,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Mobile",
                      "C_PhoneMobile",
                      customerData.C_PhoneMobile || item.C_PhoneMobile,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email",
                      "C_Email",
                      customerData.C_Email || item.C_Email,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Fax",
                      "C_Fax",
                      customerData.C_Fax || item.C_Fax,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Sales Tax Number",
                      "C_SalesTaxNumber",
                      customerData.C_SalesTaxNumber || item.C_SalesTaxNumber,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Cig License Number",
                      "C_CigtLicenseNumber",
                      customerData.C_CigtLicenseNumber ||
                        item.C_CigtLicenseNumber,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "FEIN",
                      "C_FEIN",
                      customerData.C_FEIN || item.C_FEIN,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Other License Number",
                      "C_OtherLicenseNumber",
                      customerData.C_OtherLicenseNumber ||
                        item.C_OtherLicenseNumber,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Other License Number 2",
                      "C_OtherLicenseNumber2",
                      customerData.C_OtherLicenseNumber2 ||
                        item.C_OtherLicenseNumber2,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Other License Number 3",
                      "C_OtherLicenseNumber3",
                      customerData.C_OtherLicenseNumber3 ||
                        item.C_OtherLicenseNumber3,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Credit Limit",
                      "Credit_Limit",
                      customerData.Credit_Limit !== undefined
                        ? customerData.Credit_Limit
                        : item.Credit_Limit,
                      "number",
                      undefined,
                      (val) => `$${Number(val || 0).toFixed(2)}`,
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Alias",
                      "C_Alias",
                      customerData.C_Alias || item.C_Alias,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Order Day",
                      "C_OrderDay",
                      customerData.C_OrderDay !== undefined
                        ? customerData.C_OrderDay
                        : item.C_OrderDay,
                      "number",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Order Day Sequence",
                      "C_OrderDaySequence",
                      customerData.C_OrderDaySequence !== undefined
                        ? customerData.C_OrderDaySequence
                        : item.C_OrderDaySequence,
                      "number",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Memo",
                      "C_Memo",
                      customerData.C_Memo || item.C_Memo,
                      "text",
                    )}
                    {item.C_Memo && (
                      <Box>
                        <Typography
                          fontSize={11}
                          color="text.secondary"
                          mb={0.5}
                        >
                          Memo:
                        </Typography>
                        <Typography
                          fontSize={11}
                          fontWeight={400}
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {item.C_Memo}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
            {/* Email Settings Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.email === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], email: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Email Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1.5,
                    pb: 1.5,
                    pt: 1,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "400px",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "#f1f1f1",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.2)"
                          : "#888",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.3)"
                          : "#555",
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email Invoice",
                      "emailInvoice",
                      customerData.emailInvoice !== undefined
                        ? customerData.emailInvoice === true ||
                            customerData.emailInvoice === 1
                        : item.emailInvoice !== undefined
                          ? item.emailInvoice === true ||
                            item.emailInvoice === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email Invoice EDI",
                      "emailInvoiceEDI",
                      customerData.emailInvoiceEDI !== undefined
                        ? customerData.emailInvoiceEDI === true ||
                            customerData.emailInvoiceEDI === 1
                        : item.emailInvoiceEDI !== undefined
                          ? item.emailInvoiceEDI === true ||
                            item.emailInvoiceEDI === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email Report",
                      "emailReport",
                      customerData.emailReport !== undefined
                        ? customerData.emailReport === true ||
                            customerData.emailReport === 1
                        : item.emailReport !== undefined
                          ? item.emailReport === true || item.emailReport === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email Statement",
                      "emailStatement",
                      customerData.emailStatement !== undefined
                        ? customerData.emailStatement === true ||
                            customerData.emailStatement === 1
                        : item.emailStatement !== undefined
                          ? item.emailStatement === true ||
                            item.emailStatement === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Email Promo",
                      "emailPromo",
                      customerData.emailPromo !== undefined
                        ? customerData.emailPromo === true ||
                            customerData.emailPromo === 1
                        : item.emailPromo !== undefined
                          ? item.emailPromo === true || item.emailPromo === 1
                          : false,
                      "toggle",
                    )}
                    {/* {renderEditableRetailerField(
                      item.C_Number,
                      "MSA Accept Promo",
                      "MSA_AcceptPromo",
                      customerData.MSA_AcceptPromo !== undefined
                        ? customerData.MSA_AcceptPromo === true ||
                            customerData.MSA_AcceptPromo === 1
                        : item.MSA_AcceptPromo !== undefined
                          ? item.MSA_AcceptPromo === true ||
                            item.MSA_AcceptPromo === 1
                          : true,
                      "toggle",
                    )} */}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Business Details Section */}
            {/* <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.business === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], business: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Business Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  px: 1.5, 
                  pb: 1.5, 
                  pt: 1, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#888',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#555',
                  },
                }}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    
                    {renderEditableRetailerField(item.C_Number, 'Operation Hours 1', 'C_OperationHours1', customerData.C_OperationHours1 !== undefined ? customerData.C_OperationHours1 : item.C_OperationHours1, 'number')}
                    {renderEditableRetailerField(item.C_Number, 'Operation Hours 2', 'C_OperationHours2', customerData.C_OperationHours2 !== undefined ? customerData.C_OperationHours2 : item.C_OperationHours2, 'number')}
                    
                    {renderEditableRetailerField(item.C_Number, 'Delivery Charge', 'Delivery_Charge', customerData.Delivery_Charge !== undefined ? (customerData.Delivery_Charge === true || customerData.Delivery_Charge === 1) : (item.Delivery_Charge !== undefined ? (item.Delivery_Charge === true || item.Delivery_Charge === 1) : false), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Case Discount', 'C_CaseDiscount', customerData.C_CaseDiscount !== undefined ? (customerData.C_CaseDiscount === true || customerData.C_CaseDiscount === 1) : (item.C_CaseDiscount !== undefined ? (item.C_CaseDiscount === true || item.C_CaseDiscount === 1) : false), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Other Amount', 'Other_Amount', customerData.Other_Amount !== undefined ? customerData.Other_Amount : item.Other_Amount, 'number', undefined, (val) => `$${Number(val || 0).toFixed(2)}`)}
                    
                    
                    {renderEditableRetailerField(
                      item.C_Number, 
                      'Sales Tax Select', 
                      'C_SalesTaxSelect', 
                      customerData.C_SalesTaxSelect || item.C_SalesTaxSelect, 
                      'dropdown',
                      [{ label: 'S', value: 'S' }, { label: 'A', value: 'A' }, { label: 'N', value: 'N' }]
                    )}
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Balance:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(customerData.LastBalance !== undefined ? customerData.LastBalance : item.LastBalance || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Invoice:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{customerData.LastInvoiceNumber !== undefined ? customerData.LastInvoiceNumber : item.LastInvoiceNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Invoice Amount:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(customerData.LastInvoiceAmount !== undefined ? customerData.LastInvoiceAmount : item.LastInvoiceAmount || 0).toFixed(2)}</Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number 2:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber2 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number 3:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber3 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Order Day:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OrderDay || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Order Day Sequence:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OrderDaySequence || 'N/A'}</Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Operation Hours 1:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OperationHours1 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Operation Hours 2:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OperationHours2 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Delivery ID:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.Delivery_ID || 'N/A'}</Typography>
                    </Box>
                    
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

            {/* Tax J Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.financial === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], financial: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Tax Jurisdiction
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1,
                    pb: 1,
                    pt: 0.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={1}>
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Terms",
                      "TermCode",
                      customerData.TermsCode !== undefined
                        ? customerData.TermsCode
                        : item.terms?.TermsCode || item.TermCode,
                      "dropdown",
                      retailerDropdownOptions.termCode,
                      (val) => {
                        const option = retailerDropdownOptions.termCode.find(
                          (opt: any) => opt.value === String(val),
                        );
                        return option
                          ? option.label
                          : item.terms?.Terms || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Jurisdiction State",
                      "Jurisdiction_State",
                      customerData.Jurisdiction_State !== undefined
                        ? customerData.Jurisdiction_State
                        : item.Jurisdiction_State,
                      "dropdown",
                      retailerDropdownOptions.jurisdictionState,
                      (val) => {
                        const option =
                          retailerDropdownOptions.jurisdictionState.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.Jurisdiction_State || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Jurisdiction County",
                      "Jurisdiction_County",
                      customerData.Jurisdiction_County !== undefined
                        ? customerData.Jurisdiction_County
                        : item.Jurisdiction_County,
                      "dropdown",
                      retailerDropdownOptions.jurisdictionCounty,
                      (val) => {
                        const option =
                          retailerDropdownOptions.jurisdictionCounty.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.Jurisdiction_County || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Jurisdiction City",
                      "Jurisdiction_City",
                      customerData.Jurisdiction_City !== undefined
                        ? customerData.Jurisdiction_City
                        : item.Jurisdiction_City,
                      "dropdown",
                      retailerDropdownOptions.jurisdictionCity,
                      (val) => {
                        const option =
                          retailerDropdownOptions.jurisdictionCity.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.Jurisdiction_City || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Customer Status",
                      "C_StatusCode",
                      customerData.C_StatusCode !== undefined
                        ? customerData.C_StatusCode
                        : item.C_StatusCode,
                      "dropdown",
                      retailerDropdownOptions.customerStatus,
                      (val) => {
                        const option =
                          retailerDropdownOptions.customerStatus.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.C_StatusCode || "N/A";
                      },
                    )}
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Last Invoice Date:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {customerData.LastInvoiceDate || item.LastInvoiceDate
                          ? new Date(
                              customerData.LastInvoiceDate ||
                                item.LastInvoiceDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Last Payment Date:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {customerData.LastPaymentDate || item.LastPaymentDate
                          ? new Date(
                              customerData.LastPaymentDate ||
                                item.LastPaymentDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Last Payment Amount:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        $
                        {Number(
                          customerData.LastPaymentAmount !== undefined
                            ? customerData.LastPaymentAmount
                            : item.LastPaymentAmount || 0,
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Delivery Amount:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        $
                        {Number(
                          customerData.Delivery_Amount !== undefined
                            ? customerData.Delivery_Amount
                            : item.Delivery_Amount || 0,
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Tax Rate:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.taxRate?.TaxDescription || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Tax Rate City:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.taxRateCity?.TaxDescription || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Tax Rate County:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.taxRateCounty?.TaxDescription || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Exp Date Sales Tax:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_SalesTax
                          ? new Date(item.ExpDate_SalesTax).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Exp Date Cig Tax:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_CigtTax
                          ? new Date(item.ExpDate_CigtTax).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Exp Date Other Tax:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax
                          ? new Date(item.ExpDate_OtherTax).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Exp Date Other Tax 2:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax2
                          ? new Date(
                              item.ExpDate_OtherTax2,
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Exp Date Other Tax 3:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax3
                          ? new Date(
                              item.ExpDate_OtherTax3,
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box> */}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Routes Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.routes === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], routes: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Routes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1,
                    pb: 1,
                    pt: 0.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {item.Routes && item.Routes.length > 0 ? (
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {item.Routes.map((route: any, idx: number) => (
                        <Chip
                          key={idx}
                          label={`Route ${route.Route_Number}`}
                          size="small"
                          sx={{ height: 20, fontSize: 9 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography fontSize={11} color="text.secondary">
                      No routes assigned
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Documents Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.documents === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], documents: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Documents
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1,
                    pb: 1,
                    pt: 0.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* ONLY use retailerDocuments from listing API (item.retailerDocuments) */}
                  {/* Check if retailerDocuments exists and has any actual documents */}
                  {(() => {
                    const docs = customerData.retailerDocuments;
                    if (!docs) {
                      return (
                        <Typography fontSize={13} color="text.secondary">
                          No documents available
                        </Typography>
                      );
                    }

                    const hasDocuments =
                      docs.feinDocument ||
                      docs.salesTaxDoc ||
                      docs.CigTaxDoc ||
                      (docs.attachments && docs.attachments.length > 0) ||
                      (docs.licenseAttachments &&
                        docs.licenseAttachments.length > 0);

                    if (!hasDocuments) {
                      return (
                        <Typography fontSize={13} color="text.secondary">
                          No documents available
                        </Typography>
                      );
                    }

                    return (
                      <Box display="flex" flexDirection="column" gap={1}>
                        {docs.feinDocument && (
                          <Box>
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              mb={0.5}
                              sx={{ fontWeight: 500 }}
                            >
                              FEIN Document:
                            </Typography>
                            <Typography
                              component="a"
                              href={docs.feinDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontSize={13}
                              fontWeight={500}
                              color="primary.main"
                              sx={{
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              View FEIN Document
                            </Typography>
                          </Box>
                        )}
                        {docs.salesTaxDoc && (
                          <Box>
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              mb={0.5}
                              sx={{ fontWeight: 500 }}
                            >
                              Sales Tax Document:
                            </Typography>
                            <Typography
                              component="a"
                              href={docs.salesTaxDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontSize={13}
                              fontWeight={500}
                              color="primary.main"
                              sx={{
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              View Sales Tax Document
                            </Typography>
                          </Box>
                        )}
                        {docs.CigTaxDoc && (
                          <Box>
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              mb={0.5}
                              sx={{ fontWeight: 500 }}
                            >
                              Cig Tax Document:
                            </Typography>
                            <Typography
                              component="a"
                              href={docs.CigTaxDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontSize={13}
                              fontWeight={500}
                              color="primary.main"
                              sx={{
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              View Cig Tax Document
                            </Typography>
                          </Box>
                        )}
                        {docs.attachments && docs.attachments.length > 0 && (
                          <Box>
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              mb={0.5}
                              sx={{ fontWeight: 500 }}
                            >
                              Attachments:
                            </Typography>
                            <Box
                              display="flex"
                              flexDirection="column"
                              gap={0.5}
                            >
                              {docs.attachments.map(
                                (url: string, idx: number) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    fontSize={13}
                                    fontWeight={500}
                                    color="primary.main"
                                    sx={{
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Attachment {idx + 1}
                                  </Typography>
                                ),
                              )}
                            </Box>
                          </Box>
                        )}
                        {docs.licenseAttachments &&
                          docs.licenseAttachments.length > 0 && (
                            <Box>
                              <Typography
                                fontSize={13}
                                color="text.secondary"
                                mb={0.5}
                                sx={{ fontWeight: 500 }}
                              >
                                License Attachments:
                              </Typography>
                              <Box
                                display="flex"
                                flexDirection="column"
                                gap={0.5}
                              >
                                {docs.licenseAttachments.map(
                                  (url: string, idx: number) => (
                                    <Typography
                                      key={idx}
                                      component="a"
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      fontSize={13}
                                      fontWeight={500}
                                      color="primary.main"
                                      sx={{
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                      }}
                                    >
                                      License Attachment {idx + 1}
                                    </Typography>
                                  ),
                                )}
                              </Box>
                            </Box>
                          )}
                      </Box>
                    );
                  })()}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* POS Settings Section */}
            {/* <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.pos === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], pos: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    POS Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  px: 1.5, 
                  pb: 1.5, 
                  pt: 1, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#888',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#555',
                  },
                }}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {renderEditableRetailerField(item.C_Number, 'POS Cash', 'POS_CashC', customerData.POS_CashC !== undefined ? (customerData.POS_CashC === true || customerData.POS_CashC === 1) : (item.POS_CashC !== undefined ? (item.POS_CashC === true || item.POS_CashC === 1) : true), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'POS Check', 'POS_CheckC', customerData.POS_CheckC !== undefined ? (customerData.POS_CheckC === true || customerData.POS_CheckC === 1) : (item.POS_CheckC !== undefined ? (item.POS_CheckC === true || item.POS_CheckC === 1) : true), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'POS Credit', 'POS_CreditC', customerData.POS_CreditC !== undefined ? (customerData.POS_CreditC === true || customerData.POS_CreditC === 1) : (item.POS_CreditC !== undefined ? (item.POS_CreditC === true || item.POS_CreditC === 1) : true), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'POS Debit', 'POS_DebitC', customerData.POS_DebitC !== undefined ? (customerData.POS_DebitC === true || customerData.POS_DebitC === 1) : (item.POS_DebitC !== undefined ? (item.POS_DebitC === true || item.POS_DebitC === 1) : true), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'POS Other', 'POS_OtherC', customerData.POS_OtherC !== undefined ? (customerData.POS_OtherC === true || customerData.POS_OtherC === 1) : (item.POS_OtherC !== undefined ? (item.POS_OtherC === true || item.POS_OtherC === 1) : true), 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'POS House', 'POS_HouseC', customerData.POS_HouseC !== undefined ? (customerData.POS_HouseC === true || customerData.POS_HouseC === 1) : (item.POS_HouseC !== undefined ? (item.POS_HouseC === true || item.POS_HouseC === 1) : true), 'toggle')}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

            {/* Category Allow Section */}
            {/* <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.categoryAllow === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], categoryAllow: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Category Allow
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  px: 1.5, 
                  pb: 1.5, 
                  pt: 1, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#888',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#555',
                  },
                }}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 01', 'Category_Allow01', customerData.Category_Allow01 !== undefined ? customerData.Category_Allow01 : item.Category_Allow01, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 02', 'Category_Allow02', customerData.Category_Allow02 !== undefined ? customerData.Category_Allow02 : item.Category_Allow02, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 03', 'Category_Allow03', customerData.Category_Allow03 !== undefined ? customerData.Category_Allow03 : item.Category_Allow03, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 04', 'Category_Allow04', customerData.Category_Allow04 !== undefined ? customerData.Category_Allow04 : item.Category_Allow04, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 05', 'Category_Allow05', customerData.Category_Allow05 !== undefined ? customerData.Category_Allow05 : item.Category_Allow05, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 06', 'Category_Allow06', customerData.Category_Allow06 !== undefined ? customerData.Category_Allow06 : item.Category_Allow06, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 07', 'Category_Allow07', customerData.Category_Allow07 !== undefined ? customerData.Category_Allow07 : item.Category_Allow07, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 08', 'Category_Allow08', customerData.Category_Allow08 !== undefined ? customerData.Category_Allow08 : item.Category_Allow08, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 09', 'Category_Allow09', customerData.Category_Allow09 !== undefined ? customerData.Category_Allow09 : item.Category_Allow09, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 10', 'Category_Allow10', customerData.Category_Allow10 !== undefined ? customerData.Category_Allow10 : item.Category_Allow10, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 11', 'Category_Allow11', customerData.Category_Allow11 !== undefined ? customerData.Category_Allow11 : item.Category_Allow11, 'toggle')}
                    {renderEditableRetailerField(item.C_Number, 'Category Allow 12', 'Category_Allow12', customerData.Category_Allow12 !== undefined ? customerData.Category_Allow12 : item.Category_Allow12, 'toggle')}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

            {/* Additional Information Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
              <Accordion
                expanded={sectionExpanded.additional === true}
                onChange={(_, expanded) => {
                  setExpandedSections((prev) => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], additional: expanded },
                  }));
                }}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "& .MuiAccordionDetails-root": {
                    maxHeight: "400px",
                    overflowY: "auto",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-expanded": { minHeight: 36 },
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={500}
                    color="primary.main"
                  >
                    Additional Customer Info
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 1,
                    pb: 1,
                    pt: 0.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={1}>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">
                        Date Created:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {customerData.C_DateCreated || item.C_DateCreated
                          ? new Date(
                              customerData.C_DateCreated || item.C_DateCreated,
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Box> */}
                    {/* <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Inactive:</Typography>
                      <Chip 
                        label={item.C_Inactive ? 'Yes' : 'No'} 
                        size="small" 
                        color={item.C_Inactive ? 'error' : 'success'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box> */}
                    {/* <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography fontSize={11} color="text.secondary">
                        Is Register Customer:
                      </Typography>
                      <Chip
                        label={item.isRegisterCustomer ? "Yes" : "No"}
                        size="small"
                        color={item.isRegisterCustomer ? "success" : "default"}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box> */}

                    {/* {customerData.customerLimit && (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Max Order Limit:</Typography>
                          <Typography fontSize={11} fontWeight={500}>
                            {customerData.customerLimit.maxOrderLimit !== null ? `$${Number(customerData.customerLimit.maxOrderLimit).toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Min Order Amount:</Typography>
                          <Typography fontSize={11} fontWeight={500}>
                            {customerData.customerLimit.minOrderAmount !== null ? `$${Number(customerData.customerLimit.minOrderAmount).toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                      </>
                    )} */}
                    {item.orderStats && (
                      <>
                        {renderEditableRetailerField(
                          item.C_Number,
                          "Web Orders",
                          "WebOrders",
                          item.orderStats.Web || 0,
                          "number",
                        )}
                        {renderEditableRetailerField(
                          item.C_Number,
                          "Mobile Orders",
                          "MobileOrders",
                          item.orderStats.Mobile || 0,
                          "number",
                        )}
                        {renderEditableRetailerField(
                          item.C_Number,
                          "ERP Orders",
                          "ERPOrders",
                          item.orderStats.ERP || 0,
                          "number",
                        )}
                      </>
                    )}

                    {renderEditableRetailerField(
                      item.C_Number,
                      "Pricing Account",
                      "C_PricingAccount",
                      customerData.C_PricingAccount || item.C_PricingAccount,
                      "text",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Retail Rounding",
                      "C_RetailRounding",
                      customerData.C_RetailRounding || item.C_RetailRounding,
                      "text",
                    )}

                    {renderEditableRetailerField(
                      item.C_Number,
                      "Invoice Format",
                      "C_InvoiceFormat",
                      customerData.C_InvoiceFormat !== undefined
                        ? customerData.C_InvoiceFormat
                        : item.C_InvoiceFormat,
                      "dropdown",
                      retailerDropdownOptions.invoiceFormat,
                      (val) => {
                        const option =
                          retailerDropdownOptions.invoiceFormat.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.C_InvoiceFormat || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "EDI Format",
                      "EDI_Format",
                      customerData.EDI_Format !== undefined
                        ? customerData.EDI_Format
                        : item.EDI_Format,
                      "dropdown",
                      retailerDropdownOptions.ediFormat,
                      (val) => {
                        const option = retailerDropdownOptions.ediFormat.find(
                          (opt: any) => opt.value === String(val),
                        );
                        return option ? option.label : item.EDI_Format || "N/A";
                      },
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Delivery Charge",
                      "Delivery_Charge",
                      customerData.Delivery_Charge !== undefined
                        ? customerData.Delivery_Charge === true ||
                            customerData.Delivery_Charge === 1
                        : item.Delivery_Charge !== undefined
                          ? item.Delivery_Charge === true ||
                            item.Delivery_Charge === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Service Charge",
                      "Service_Charge",
                      customerData.Service_Charge !== undefined
                        ? customerData.Service_Charge === true ||
                            customerData.Service_Charge === 1
                        : item.Service_Charge !== undefined
                          ? item.Service_Charge === true ||
                            item.Service_Charge === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Case Discount",
                      "C_CaseDiscount",
                      customerData.C_CaseDiscount !== undefined
                        ? customerData.C_CaseDiscount === true ||
                            customerData.C_CaseDiscount === 1
                        : item.C_CaseDiscount !== undefined
                          ? item.C_CaseDiscount === true ||
                            item.C_CaseDiscount === 1
                          : false,
                      "toggle",
                    )}
                    {renderEditableRetailerField(
                      item.C_Number,
                      "Class of Trade",
                      "C_ClassOfTrade",
                      customerData.C_ClassOfTrade ||
                        item.classOfTrade?.Trade_Code ||
                        item.C_ClassOfTrade,
                      "dropdown",
                      retailerDropdownOptions.classOfTrade,
                      (val) => {
                        const option =
                          retailerDropdownOptions.classOfTrade.find(
                            (opt: any) => opt.value === String(val),
                          );
                        return option
                          ? option.label
                          : item.classOfTrade?.Trade_Desc || "N/A";
                      },
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const columns: TableColumn<any>[] = [
    {
      id: "C_Number",
      label: "Customer ID",
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>
          {row.C_Number || "-"}
        </Typography>
      ),
    },
    {
      id: "C_Name",
      label: "Customer Name",
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>
          {row.C_Name || "-"}
        </Typography>
      ),
    },
    {
      id: "C_PhoneMobile",
      label: "Phone number",
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>
          {row.C_PhoneMobile || "-"}
        </Typography>
      ),
    },
    {
      id: "C_Email",
      label: "Email address",
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>
          {row.C_Email || "-"}
        </Typography>
      ),
    },
    {
      id: "C_Inactive",
      label: "Status",
      render: (row) => (
        <Box
          sx={{
            color: !row.C_Inactive ? "rgb(8, 194, 33)" : "rgb(255, 102, 102)",
            bgcolor: !row.C_Inactive
              ? "rgba(10, 255, 112, 0.1)"
              : "rgba(255, 102, 102, 0.1)",
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 400,
            display: "inline-block",
          }}
        >
          {!row.C_Inactive ? "Active" : "Inactive"}
        </Box>
      ),
    },
    {
      id: "web_order",
      label: "Web Order",
      render: (row) => {
        return (
          <Box
            p={1}
            height={30}
            width={30}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              bgcolor: row?.orderStats?.Web
                ? "rgba(41, 230, 130, 0.2)"
                : "rgba(243, 78, 78, 0.2)",
              borderRadius: 2,
            }}
          >
            <Typography
              color={
                row?.orderStats?.Web
                  ? "rgba(39, 158, 130, 1)"
                  : "rgba(243, 78, 78, 1)"
              }
              fontSize={14}
            >
              {row?.orderStats?.Web || "0"}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "mobile_order",
      label: "Mobile Order",
      render: (row) => {
        return (
          <Box
            p={1}
            height={30}
            width={30}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              bgcolor: row?.orderStats?.Mobile
                ? "rgba(41, 230, 130, 0.2)"
                : "rgba(243, 78, 78, 0.2)",
              borderRadius: 2,
            }}
          >
            <Typography
              color={
                row?.orderStats?.Mobile
                  ? "rgba(39, 158, 130, 1)"
                  : "rgba(243, 78, 78, 1)"
              }
              fontSize={14}
            >
              {row?.orderStats?.Mobile || "0"}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "ERP Order",
      label: "ERP Order",
      render: (row) => {
        return (
          <Box
            p={1}
            height={30}
            width={30}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              bgcolor: row?.orderStats?.ERP
                ? "rgba(41, 230, 130, 0.2)"
                : "rgba(243, 78, 78, 0.2)",
              borderRadius: 2,
            }}
          >
            <Typography
              color={
                row?.orderStats?.ERP
                  ? "rgba(39, 158, 130, 1)"
                  : "rgba(243, 78, 78, 1)"
              }
              fontSize={14}
            >
              {row?.orderStats?.ERP || "0"}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      render: (row) => (
        <ActionMenu
          row={row}
          onView={onViewRetailer}
          onSetLimit={onSetLimitRetailer}
          onEdit={onEditRetailer}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 1, md: 3 },
        pt: { xs: 1, md: 0 },
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        mb={2}
        mt={0}
        gap={{ xs: 2, md: 0 }}
        sx={{ width: "100%" }}
      >
        <Typography
          fontSize={{ xs: 16, md: 18 }}
          fontWeight={400}
          color="text.primary"
          sx={{ mb: { xs: 1, md: 0 } }}
        >
          Retailers
        </Typography>
        <Box
          display="flex"
          gap={{ xs: 1, md: 2 }}
          alignItems="center"
          flexWrap="wrap"
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {/* View tab commented - showing only table view for now
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                px: { xs: 1, md: 1.5 },
              },
            }}
          >
            <ToggleButton value="table">
              <ViewListIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Table
              </Box>
            </ToggleButton>
            <ToggleButton value="detailed">
              <ViewModuleIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Detailed
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
          */}
          {/* <CustomButton 
            fullWidth={false}
            onClick={() => setLossQtyReportModalOpen(true)}
            icon={<AssessmentIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            iconPosition="left"
            sx={{ 
              mt: 0,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              px: { xs: 1, md: 1.5 },
              '& .MuiButton-startIcon': {
                mr: { xs: 0.5, md: 1 }
              }
            }} 
          >
            <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Loss Qty Report</Box>
            <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Report</Box>
          </CustomButton> */}
          <CustomButton
            fullWidth={false}
            onClick={() => navigate("/admin/retailer/add")}
            icon={<AddIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            iconPosition="left"
            sx={{
              mt: 0,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              px: { xs: 1, md: 1.5 },
              "& .MuiButton-startIcon": {
                mr: { xs: 0.5, md: 1 },
              },
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              Add Retailer
            </Box>
            <Box
              component="span"
              sx={{ display: { xs: "inline", sm: "none" } }}
            >
              Add
            </Box>
          </CustomButton>
        </Box>
      </Box>
      <Paper
        sx={{
          mb: 2,
          boxShadow: "none",
          borderRadius: "0px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={{ xs: 1, md: 2 }}
          sx={{ maxWidth: "100%", overflow: "hidden" }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{ width: "100%", flexWrap: "wrap" }}
          >
            <TextInput
              placeholder="Search Customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: "100%", md: 220 } }}
            />
            <ToggleButtonGroup
              value={
                inactiveFilter === null
                  ? "all"
                  : inactiveFilter
                    ? "inactive"
                    : "active"
              }
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setInactiveFilter(
                    newValue === "all" ? null : newValue === "inactive",
                  );
                  setCurrentPage(1);
                  if (viewMode === "detailed") {
                    setDetailedCurrentPage(1);
                  }
                }
              }}
              size="small"
              sx={{
                height: { xs: "32px", md: "36px" },
                "& .MuiToggleButton-root": {
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  px: { xs: 1.5, md: 2 },
                  border: "1px solid",
                  borderColor: "divider",
                },
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="active">Active</ToggleButton>
              <ToggleButton value="inactive">Inactive</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {viewMode === "table" ? (
          <CommonTable
            data={retailers}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
            containerHeight="calc(100vh - 393px)"
          />
        ) : (
          <Box
            sx={{
              maxWidth: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 280px)",
              "@media (max-width: 1024px)": {
                height: "calc(100vh - 240px)",
              },
              "@media (max-width: 600px)": {
                height: "calc(100vh - 200px)",
              },
            }}
          >
            <Box
              px={{ xs: 1, md: 2 }}
              pb={{ xs: 1, md: 2 }}
              sx={{
                maxWidth: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                flex: 1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "#f1f1f1",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "#888",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.3)"
                      : "#555",
                },
              }}
            >
              {detailedLoading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="400px"
                >
                  <CircularProgress />
                </Box>
              ) : detailedData.length > 0 ? (
                <>
                  {detailedData.map((item, index) =>
                    renderDetailedCard(item, index),
                  )}
                </>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="400px"
                >
                  <Typography color="text.secondary">
                    No retailers found
                  </Typography>
                </Box>
              )}
            </Box>
            {!detailedLoading && detailedData.length > 0 && (
              <Box
                sx={{
                  bgcolor: "background.paper",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  py: { xs: 1, md: 1.5 },
                  px: { xs: 1, md: 2 },
                  zIndex: 10,
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 -2px 8px rgba(0,0,0,0.5)"
                      : "0 -2px 8px rgba(0,0,0,0.1)",
                  maxWidth: "100%",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  gap={{ xs: 1, sm: 0 }}
                  sx={{ maxWidth: "100%" }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    flexWrap="wrap"
                    sx={{ maxWidth: "100%" }}
                  >
                    <FormControl
                      size="small"
                      sx={{ minWidth: { xs: 60, md: 70 } }}
                    >
                      <Select
                        value={detailedPageSize}
                        onChange={(e) => {
                          setDetailedPageSize(Number(e.target.value));
                          setDetailedCurrentPage(1);
                        }}
                        sx={{
                          bgcolor: "background.paper",
                          fontSize: { xs: "0.75rem", md: "0.875rem" },
                          height: { xs: "28px", md: "32px" },
                          "& .MuiSelect-select": {
                            py: 0.5,
                            color: "text.primary",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "divider",
                          },
                        }}
                        displayEmpty
                      >
                        <MenuItem
                          value={10}
                          sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                        >
                          10
                        </MenuItem>
                        <MenuItem
                          value={25}
                          sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                        >
                          25
                        </MenuItem>
                        <MenuItem
                          value={50}
                          sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                        >
                          50
                        </MenuItem>
                        <MenuItem
                          value={100}
                          sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                        >
                          100
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Typography
                      fontSize={{ xs: 10, md: 12 }}
                      color="text.secondary"
                      sx={{ whiteSpace: { xs: "normal", sm: "nowrap" } }}
                    >
                      Showing {(detailedCurrentPage - 1) * detailedPageSize + 1}
                      -
                      {Math.min(
                        detailedCurrentPage * detailedPageSize,
                        detailedTotalItems,
                      )}{" "}
                      of {detailedTotalItems} items
                    </Typography>
                  </Box>
                  <Pagination
                    count={detailedTotalPages}
                    page={detailedCurrentPage}
                    onChange={(_, page) => setDetailedCurrentPage(page)}
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                    sx={{
                      "& .MuiPaginationItem-root": {
                        bgcolor: "background.paper",
                        fontSize: { xs: "0.7rem", md: "0.875rem" },
                        minWidth: { xs: "28px", md: "32px" },
                        height: { xs: "28px", md: "32px" },
                        border: "1px solid",
                        borderColor: "divider",
                        color: "text.primary",
                      },

                      "& .MuiPaginationItem-root.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "#ffffff",
                        borderColor: "primary.main",
                      },

                      "& .MuiPaginationItem-root.Mui-selected:hover": {
                        bgcolor: "primary.dark",
                        color: "#ffffff",
                        borderColor: "primary.dark",
                      },

                      "& .MuiPaginationItem-root:not(.Mui-selected):hover": {
                        bgcolor: "background.paper",
                        color: "grey",
                        borderColor: "primary.main",
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <RetailerViewModal
        retailer={selectedRetailer}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />

      <CustomerLimitModal
        open={limitModalOpen}
        onClose={() => {
          setLimitModalOpen(false);
          setSelectedLimitRetailer(null);
        }}
        customerId={selectedLimitRetailer?.C_Number || ""}
        customerName={selectedLimitRetailer?.C_Name || ""}
        initialData={{
          maxOrderLimit: selectedLimitRetailer?.customerLimit?.maxOrderLimit,
          minOrderAmount: selectedLimitRetailer?.customerLimit?.minOrderAmount,
        }}
        onSubmit={handleLimitSubmit}
        loading={savingLimit}
      />

      {/* Loss Qty Report Modal */}
      <LossQtyReportModal
        open={lossQtyReportModalOpen}
        onClose={() => setLossQtyReportModalOpen(false)}
        groupBy="retailer"
      />
    </Box>
  );
};

export default Retailer;
