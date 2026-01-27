import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Drawer,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { inventoryItemsForUpdate, bulkUpdateInventory } from '../../../redux/apis/distrubutor/productApis';
import { getListForInventory } from '../../../redux/apis/distrubutor/listApis';
import { updateInventory } from '../../../redux/apis/distrubutor/inventoryApis';
import SwitchInput from '../../../component/atoms/SwitchInput';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import BulkUpdateFields, { FieldUpdate } from '../../../component/molecules/BulkUpdateFields';

interface InventoryItem {
  Pack: number;
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  Price2: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  eCommerce: boolean;
  I_Inactive: boolean;
  Date_Created: string;
  OTP_Number: number;
  Price_Subclass: number;
  UnitOunces: number;
  Sales_Category: number;
  Price_Class: number;
  ShortOrderForm: boolean;
  SalesCategory: {
    Category_Desc: string;
    Sales_Category: number;
  };
  PriceClass: {
    Class_Desc: string;
  };
  [key: string]: any;
}

interface FilterOption {
  label: string;
  value: string;
}

interface InventoryListOptions {
  salesCategory: FilterOption[];
  priceClass: FilterOption[];
  priceSubclass: FilterOption[];
  otherTaxes: FilterOption[];
  inventoryItemGroup: FilterOption[];
  vendor: FilterOption[];
  inventoryBrand: FilterOption[];
  msaCategory: FilterOption[];
  nacsCategory: FilterOption[];
  projectIdentifier: FilterOption[];
}

// Define columns to display and their order
const TABLE_COLUMNS = [
  'Item_Number', 'Description', 
  'Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6',
  'Retail1', 'Retail2', 'Retail3',
  'RetailPct1', 'RetailPct2', 'RetailPct3',
  'Unit_Upcharge', 'Unit_Price', 'BaseCost', 'NetCost', 'Invoice_Cost',
  'Item_GroupID', 'Sales_Category', 'Price_Class', 'Price_Subclass', 'OTP_Number',
  'UOM', 'Pack', 'UnitOunces', 'CaseCount', 'Cig_Sticks',
  'Primary_Vendor', 'Manufacturer',
  'ShortOrderForm', 'PriceBook_Include', 'Breakable', 'I_Inactive', 'I_Discontinued', 'EBT', 'Track_ExpirationDate',
  'Brand_ID', 'PriceCostModifiedDate', 'PriceCostModifiedUser', 'Date_LastChange', 'Date_LastChangeUser',
  'MSA_Category_Code', 'NACS', 'Project_Identifier'
];

// Non-editable fields (display only)
const NON_EDITABLE_FIELDS = ['Item_Number', 'PriceCostModifiedDate', 'PriceCostModifiedUser', 'Date_LastChange', 'Date_LastChangeUser'];

// Checkbox/toggle fields
const TOGGLE_FIELDS = ['ShortOrderForm', 'PriceBook_Include', 'Breakable', 'I_Inactive', 'I_Discontinued', 'EBT', 'Track_ExpirationDate', 'eCommerce'];

// Dropdown fields with their option keys
const DROPDOWN_FIELDS: Record<string, keyof InventoryListOptions> = {
  'Sales_Category': 'salesCategory',
  'Price_Class': 'priceClass',
  'Price_Subclass': 'priceSubclass',
  'OTP_Number': 'otherTaxes',
  'Item_GroupID': 'inventoryItemGroup',
  'Primary_Vendor': 'vendor',
  'Manufacturer': 'vendor',
  'Brand_ID': 'inventoryBrand',
  'MSA_Category_Code': 'msaCategory',
  'NACS': 'nacsCategory',
  'Project_Identifier': 'projectIdentifier',
};

// Column display name mapping
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  'ShortOrderForm': 'Web Allow',
  'Price1': 'Price 1',
  'Price2': 'Price 2',
  'Price3': 'Price 3',
  'Price4': 'Price 4',
  'Price5': 'Price 5',
  'Price6': 'Price 6',
  'Retail1': 'Retail 1',
  'Retail2': 'Retail 2',
  'Retail3': 'Retail 3',
  'RetailPct1': 'Retail % 1',
  'RetailPct2': 'Retail % 2',
  'RetailPct3': 'Retail % 3',
  'BaseCost': 'Base Cost',
  'UnitOunces': 'Ounces/ml',
  'Cig_Sticks': 'Sticks',
  'Primary_Vendor': 'Vendor',
  'I_Inactive': 'Inactive',
  'I_Discontinued': 'Discontinued',
  'UOM': 'Size',
  'Unit_Upcharge': 'Unit Upcharge',
  'Unit_Price': 'Unit Price',
  'Invoice_Cost': 'MFG Cost',
  'NetCost': 'Net Cost',
  'Item_GroupID': 'Item Group ID',
  'Sales_Category': 'Sales Category',
  'Price_Class': 'Price Class',
  'Price_Subclass': 'Price Subclass',
  'OTP_Number': 'OTP Number',
  'CaseCount': 'Case Count',
  'PriceBook_Include': 'Price Book Include',
  'Track_ExpirationDate': 'Track Expiration Date',
  'Brand_ID': 'Brand ID',
  'PriceCostModifiedDate': 'Price Cost Modified Date',
  'PriceCostModifiedUser': 'Price Cost Modified User',
  'Date_LastChange': 'Date Last Change',
  'Date_LastChangeUser': 'Date Last Change User',
  'MSA_Category_Code': 'MSA Category Code',
  'Project_Identifier': 'Project Identifier',
};

// Helper function to format column names
const formatColumnName = (column: string): string => {
  // First check if there's a custom display name
  if (COLUMN_DISPLAY_NAMES[column]) {
    return COLUMN_DISPLAY_NAMES[column];
  }
  // Otherwise, replace underscores with spaces and capitalize first letter of each word
  return column
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Field groups for bulk update
const FIELD_GROUPS: Record<string, { label: string; fields: string[]; isPriceGroup: boolean }> = {
  'all': { 
    label: 'All Fields', 
    fields: TABLE_COLUMNS.filter(f => !NON_EDITABLE_FIELDS.includes(f)), 
    isPriceGroup: false 
  },
  'price_all': { 
    label: 'Price All', 
    fields: ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6', 'BaseCost', 'NetCost', 'Invoice_Cost', 'Unit_Upcharge', 'Unit_Price'], 
    isPriceGroup: true 
  },
  'price_1_6': { 
    label: 'Price 1-6', 
    fields: ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6'], 
    isPriceGroup: true 
  },
  'retail_all': { 
    label: 'Retail All', 
    fields: ['Retail1', 'Retail2', 'Retail3', 'RetailPct1', 'RetailPct2', 'RetailPct3'], 
    isPriceGroup: true 
  },
  'cost': { 
    label: 'Cost', 
    fields: ['BaseCost', 'NetCost', 'Invoice_Cost', 'Unit_Upcharge', 'Unit_Price'], 
    isPriceGroup: true 
  },
  'category': { 
    label: 'Category', 
    fields: ['Sales_Category', 'Price_Class', 'Price_Subclass', 'Item_GroupID', 'OTP_Number'], 
    isPriceGroup: false 
  },
  'msa_nacs': { 
    label: 'MSA/NACS', 
    fields: ['MSA_Category_Code', 'NACS', 'Project_Identifier'], 
    isPriceGroup: false 
  },
  'vendor_brand': { 
    label: 'Vendor/Brand', 
    fields: ['Primary_Vendor', 'Manufacturer', 'Brand_ID'], 
    isPriceGroup: false 
  },
  'product_info': { 
    label: 'Product Info', 
    fields: ['UOM', 'Pack', 'UnitOunces', 'CaseCount', 'Cig_Sticks'], 
    isPriceGroup: false 
  },
  'flags': { 
    label: 'Flags', 
    fields: ['ShortOrderForm', 'PriceBook_Include', 'Breakable', 'I_Inactive', 'I_Discontinued', 'EBT', 'Track_ExpirationDate'], 
    isPriceGroup: false 
  },
};

const BulkUpdate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Local filter state (for drawer - not applied until Apply is clicked)
  const [localSalesCategory, setLocalSalesCategory] = useState<FilterOption[]>([]);
  const [localPriceClass, setLocalPriceClass] = useState<FilterOption[]>([]);
  const [localFilter, setLocalFilter] = useState<string>('ShortOrderForm');
  
  // Applied filter state (used for API calls)
  const [appliedSalesCategory, setAppliedSalesCategory] = useState<FilterOption[]>([]);
  const [appliedPriceClass, setAppliedPriceClass] = useState<FilterOption[]>([]);
  const [appliedFilter, setAppliedFilter] = useState<string>('ShortOrderForm');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  
  const [inventoryOptions, setInventoryOptions] = useState<InventoryListOptions>({
    salesCategory: [],
    priceClass: [],
    priceSubclass: [],
    otherTaxes: [],
    inventoryItemGroup: [],
    vendor: [],
    inventoryBrand: [],
    msaCategory: [],
    nacsCategory: [],
    projectIdentifier: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Bulk update form state
  const [fieldUpdates, setFieldUpdates] = useState<FieldUpdate[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Pagination state for large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [updating, setUpdating] = useState(false);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  
  // Ref to track if we should skip the initial fetch
  const isInitialMount = useRef(true);
  // Ref to track previous filter values to prevent duplicate calls
  const prevFiltersRef = useRef<string>('');
  // Ref to track the latest request ID to ignore stale responses
  const requestIdRef = useRef(0);
  
  // Editable cell state
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    column: string;
    value: any;
  } | null>(null);
  
  // Focused cell state (for arrow key navigation when not editing)
  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    column: string;
  } | null>(null);
  
  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    type: 'individual' | 'bulk';
    data?: any;
    itemNumber?: number;
    field?: string;
  } | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    // Increment request ID for this new request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    
    setLoading(true);
    try {
      const params: any = {};
      
      if (appliedSalesCategory.length > 0) {
        params.salesCategoryId = appliedSalesCategory.map(cat => cat.value);
      }
      
      if (appliedPriceClass.length > 0) {
        params.priceClassId = appliedPriceClass.map(pc => Number(pc.value));
      }
      
      if (appliedFilter && appliedFilter !== 'All') {
        params.filter = appliedFilter;
      }
      
      if (appliedSearch && appliedSearch.trim()) {
        params.search = appliedSearch.trim();
      }
      
      const res = await inventoryItemsForUpdate(params) as any;
      
      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        const items = res?.data?.data?.productList || [];
        setData(items);
        setHasDataLoaded(true);
        setCurrentPage(1); // Reset to first page on new data
      }
    } catch (error: any) {
      // Only show error and update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        console.error('Error fetching inventory items:', error);
        toast.error(error?.response?.data?.message || 'Failed to load inventory items');
        setData([]);
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [appliedSalesCategory, appliedPriceClass, appliedFilter, appliedSearch]);

  useEffect(() => {
    fetchInventoryOptions();
  }, []);

  // Sync local filters with applied filters when drawer opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setLocalSalesCategory(appliedSalesCategory);
      setLocalPriceClass(appliedPriceClass);
      setLocalFilter(appliedFilter);
    }
  }, [filterDrawerOpen, appliedSalesCategory, appliedPriceClass, appliedFilter]);

  const fetchInventoryOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getListForInventory() as any;
      const data = response?.data?.data || {};
      
      setInventoryOptions({
        salesCategory: (data.salesCategory || []).map((cat: any) => ({
          label: cat.Category_Desc,
          value: cat.Sales_Category.toString()
        })),
        priceClass: (data.priceClass || []).map((pc: any) => ({
          label: pc.Class_Desc || 'N/A',
          value: pc.Price_Class.toString()
        })),
        priceSubclass: (data.priceSubclass || []).map((ps: any) => ({
          label: ps.Subclass_Def,
          value: ps.Price_Subclass.toString()
        })),
        otherTaxes: (data.otherTaxes || []).map((ot: any) => ({
          label: ot.OTP_Description,
          value: ot.OTP_Number.toString()
        })),
        inventoryItemGroup: (data.inventoryItemGroup || []).map((ig: any) => ({
          label: ig.Item_GroupDescription,
          value: ig.Item_GroupID.toString()
        })),
        vendor: (data.vendor || []).map((v: any) => ({
          label: v.V_Description || `Vendor ${v.Primary_Vendor}`,
          value: v.Primary_Vendor.toString()
        })),
        inventoryBrand: (data.inventoryBrand || []).map((b: any) => ({
          label: b.Brand_Family,
          value: b.Brand_ID.toString()
        })),
        msaCategory: (data.msaCategory || []).map((m: any) => ({
          label: `${m.MSA_Category_Code} - ${m.MSA_Description}`,
          value: m.MSA_Category_Code
        })),
        nacsCategory: (data.nacsCategory || []).map((n: any) => ({
          label: `${n.NACS_Category_Code} - ${n.NACS_Description}`,
          value: n.NACS_Category_Code
        })),
        projectIdentifier: (data.projectIdentifier || []).map((p: any) => ({
          label: `${p.Project_Identifier} - ${p.Description}`,
          value: p.Project_Identifier
        })),
      });
    } catch (error) {
      console.error('Error fetching inventory options:', error);
      toast.error('Failed to load dropdown options');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Handle Sales Category change with mutual exclusivity
  const handleLocalSalesCategoryChange = (options: FilterOption[]) => {
    setLocalSalesCategory(options);
    // If Sales Category is selected, clear and disable Price Class
    if (options.length > 0) {
      setLocalPriceClass([]);
    }
  };

  // Handle Price Class change with mutual exclusivity
  const handleLocalPriceClassChange = (options: FilterOption[]) => {
    setLocalPriceClass(options);
    // If Price Class is selected, clear and disable Sales Category
    if (options.length > 0) {
      setLocalSalesCategory([]);
    }
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setAppliedSalesCategory(localSalesCategory);
    setAppliedPriceClass(localPriceClass);
    setAppliedFilter(localFilter);
    setFilterDrawerOpen(false);
    // API will be called via useEffect when applied filters change
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setLocalSalesCategory([]);
    setLocalPriceClass([]);
    setLocalFilter('ShortOrderForm');
    setAppliedSalesCategory([]);
    setAppliedPriceClass([]);
    setAppliedFilter('ShortOrderForm');
    setFilterDrawerOpen(false);
    // Note: Search is reset separately in the header field
  };

  // Calculate pagination - only render visible rows for performance
  const totalPages = useMemo(() => Math.ceil(data.length / pageSize), [data.length, pageSize]);
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Check if field is toggle field
  const isToggleField = (fieldName: string): boolean => {
    return TOGGLE_FIELDS.includes(fieldName);
  };

  // Check if field is dropdown field
  const isDropdownField = (fieldName: string): boolean => {
    return fieldName in DROPDOWN_FIELDS;
  };

  // Check if field is non-editable
  const isNonEditableField = (fieldName: string): boolean => {
    return NON_EDITABLE_FIELDS.includes(fieldName);
  };

  // Get dropdown options for a field
  const getDropdownOptions = (fieldName: string): FilterOption[] => {
    const optionKey = DROPDOWN_FIELDS[fieldName];
    if (optionKey) {
      return inventoryOptions[optionKey] || [];
    }
    return [];
  };

  const handleBulkUpdate = () => {
    if (fieldUpdates.length === 0) {
      toast.error('Please add at least one field to update');
      return;
    }

    // Validate all fields
    for (const fieldUpdate of fieldUpdates) {
      if (!fieldUpdate.field) {
        toast.error('Please select a field for all entries');
        return;
      }
      if (fieldUpdate.value === '') {
        toast.error(`Please enter a value for ${fieldUpdate.field}`);
        return;
      }
    }

    // Show confirmation modal
    setPendingUpdate({ type: 'bulk' });
    setConfirmModalOpen(true);
  };

  const performBulkUpdate = async () => {
    setUpdating(true);
    try {
      // Check if search or per-field match filters are present - if so, use singleUpdateData approach
      const hasSearch = appliedSearch && appliedSearch.trim().length > 0;
      const hasMatchFilters = fieldUpdates.some(fu => fu.matchValue && fu.matchValue !== '');

      if (hasSearch || hasMatchFilters) {
        // Build singleUpdateData array with all items that match the search
        const singleUpdateData: Array<Record<string, any>> = [];
        
        // Fields that should use 0/1 values
        const toggleFields = TOGGLE_FIELDS;
        // Fields that should use dropdown (number values from options)
        const dropdownFields = Object.keys(DROPDOWN_FIELDS);
        
        // Parse field update values once
        const parsedFieldUpdates: Record<string, any> = {};
        const firstItem = data[0];
        
        for (const fieldUpdate of fieldUpdates) {
          let parsedValue: any = fieldUpdate.value;
          
          // Handle toggle fields (0/1)
          if (toggleFields.includes(fieldUpdate.field)) {
            parsedValue = fieldUpdate.value === '1' || fieldUpdate.value === 'true' ? 1 : 0;
          }
          // Handle dropdown fields (convert string value to number)
          else if (dropdownFields.includes(fieldUpdate.field)) {
            parsedValue = Number(fieldUpdate.value);
            if (isNaN(parsedValue)) {
              toast.error(`Please select a valid option for ${fieldUpdate.field}`);
              setUpdating(false);
              return;
            }
          }
          else if (firstItem && firstItem[fieldUpdate.field] !== undefined) {
            const originalValue = firstItem[fieldUpdate.field];
            if (typeof originalValue === 'number') {
              parsedValue = Number(fieldUpdate.value);
              if (isNaN(parsedValue)) {
                toast.error(`Please enter a valid number for ${fieldUpdate.field}`);
                setUpdating(false);
                return;
              }
            } else if (typeof originalValue === 'boolean') {
              parsedValue = fieldUpdate.value.toLowerCase() === 'true' || fieldUpdate.value === '1';
            }
          }
          
          parsedFieldUpdates[fieldUpdate.field] = parsedValue;
        }
        
        const shouldIncludeItem = (item: any): boolean => {
          if (!hasMatchFilters) return true;

          for (const fu of fieldUpdates) {
            if (!fu.matchValue) continue;
            const itemValue = item?.[fu.field];
            let desired: any = fu.matchValue;

            if (toggleFields.includes(fu.field)) {
              desired = fu.matchValue === '1' || fu.matchValue.toLowerCase() === 'true';
              const normalizedItem = itemValue === 1 || itemValue === true;
              if (normalizedItem !== desired) return false;
            } else if (dropdownFields.includes(fu.field) || typeof itemValue === 'number') {
              const desiredNum = Number(fu.matchValue);
              if (isNaN(desiredNum)) return false;
              if (Number(itemValue) !== desiredNum) return false;
            } else if (typeof itemValue === 'boolean') {
              const desiredBool = fu.matchValue.toLowerCase() === 'true' || fu.matchValue === '1';
              if (itemValue !== desiredBool) return false;
            } else {
              if (String(itemValue) !== String(desired)) return false;
            }
          }
          return true;
        };

        // Create update object for each item with only the fields being updated and matching current-value filters
        for (const item of data) {
          if (!shouldIncludeItem(item)) continue;
          const itemUpdate: Record<string, any> = {
            Item_Number: item.Item_Number,
          };
          
          // Add only the fields that are being updated
          for (const fieldName of Object.keys(parsedFieldUpdates)) {
            itemUpdate[fieldName] = parsedFieldUpdates[fieldName];
          }
          
          singleUpdateData.push(itemUpdate);
        }
        
        if (singleUpdateData.length === 0) {
          toast.error('No items match the current-value filter.');
          return;
        }

        const payload = {
          field: {},
          data: {},
          hasBulkUpdate: false,
          singleUpdateData: singleUpdateData
        };

        const res = await bulkUpdateInventory(payload) as any;
        
        if (res?.data?.success) {
          toast.success(res?.data?.message || 'Bulk update successful!');
          // Reset form
          setFieldUpdates([]);
          // Refresh data
          fetchInventoryItems();
        } else {
          toast.error(res?.data?.message || 'Bulk update failed');
        }
      } else {
        // Original bulk update logic (when no search)
        // Build field filter object
        const fieldFilter: Record<string, any> = {};
        
        if (appliedSalesCategory.length > 0) {
          fieldFilter.Sales_Category = appliedSalesCategory.map(cat => Number(cat.value));
        }
        
        if (appliedPriceClass.length > 0) {
          fieldFilter.Price_Class = appliedPriceClass.map(pc => Number(pc.value));
        }
        
        if (appliedFilter && appliedFilter !== 'All') {
          if (appliedFilter === 'I_Inactive') {
            fieldFilter.I_Inactive = true;
          } else if (appliedFilter === 'ShortOrderForm') {
            fieldFilter.ShortOrderForm = true;
          }
        }

        // Build data object with all field updates
        const updateData: Record<string, any> = {};
        const firstItem = data[0];
        
        // Fields that should use 0/1 values
        const toggleFields = TOGGLE_FIELDS;
        // Fields that should use dropdown (number values from options)
        const dropdownFields = Object.keys(DROPDOWN_FIELDS);
        
        for (const fieldUpdate of fieldUpdates) {
          let parsedValue: any = fieldUpdate.value;
          
          // Handle toggle fields (0/1)
          if (toggleFields.includes(fieldUpdate.field)) {
            parsedValue = fieldUpdate.value === '1' || fieldUpdate.value === 'true' ? 1 : 0;
          }
          // Handle dropdown fields (convert string value to number)
          else if (dropdownFields.includes(fieldUpdate.field)) {
            parsedValue = Number(fieldUpdate.value);
            if (isNaN(parsedValue)) {
              toast.error(`Please select a valid option for ${fieldUpdate.field}`);
              setUpdating(false);
              return;
            }
          }
          else if (firstItem && firstItem[fieldUpdate.field] !== undefined) {
            const originalValue = firstItem[fieldUpdate.field];
            if (typeof originalValue === 'number') {
              parsedValue = Number(fieldUpdate.value);
              if (isNaN(parsedValue)) {
                toast.error(`Please enter a valid number for ${fieldUpdate.field}`);
                setUpdating(false);
                return;
              }
            } else if (typeof originalValue === 'boolean') {
              parsedValue = fieldUpdate.value.toLowerCase() === 'true' || fieldUpdate.value === '1';
            }
          }
          
          updateData[fieldUpdate.field] = parsedValue;
        }

        const payload = {
          field: fieldFilter,
          data: updateData,
          hasBulkUpdate: true
        };

        const res = await bulkUpdateInventory(payload) as any;
        
        if (res?.data?.success) {
          toast.success(res?.data?.message || 'Bulk update successful!');
          // Reset form
          setFieldUpdates([]);
          // Refresh data
          fetchInventoryItems();
        } else {
          toast.error(res?.data?.message || 'Bulk update failed');
        }
      }
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast.error(error?.response?.data?.message || 'Failed to update inventory');
    } finally {
      setUpdating(false);
      setConfirmModalOpen(false);
      setPendingUpdate(null);
    }
  };

  // Handle individual cell edit
  const handleCellClick = useCallback((rowIndex: number, column: string, value: any) => {
    // Don't allow editing non-editable fields
    if (isNonEditableField(column)) {
      return;
    }
    setEditingCell({ rowIndex, column, value });
    setFocusedCell({ rowIndex, column });
  }, []);

  // Handle cell value change
  const handleCellValueChange = (newValue: any) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: newValue });
    }
  };

  // Handle cell update (Enter key or blur)
  const handleCellUpdate = (skipCheck = false, overrideValue?: any) => {
    if (!editingCell) return;

    const actualRowIndex = startIndex + editingCell.rowIndex;
    const row = data[actualRowIndex];
    if (!row) {
      setEditingCell(null);
      setFocusedCell(null);
      return;
    }

    const originalValue = row[editingCell.column];
    let newValue: any = overrideValue !== undefined ? overrideValue : editingCell.value;

    // Parse value based on field type
    if (isToggleField(editingCell.column)) {
      newValue = newValue === true || newValue === 1 || newValue === '1' || newValue === 'true' ? 1 : 0;
      // Compare with original boolean value
      const originalBool = originalValue === true || originalValue === 1;
      if (newValue === (originalBool ? 1 : 0)) {
        setEditingCell(null);
        return;
      }
    } else if (isDropdownField(editingCell.column)) {
      newValue = Number(newValue);
      if (isNaN(newValue)) {
        toast.error(`Please select a valid option for ${editingCell.column}`);
        setEditingCell(null);
        return;
      }
      // Compare with original number value
      if (newValue === Number(originalValue)) {
        setEditingCell(null);
        return;
      }
    } else if (typeof originalValue === 'number') {
      newValue = Number(newValue);
      if (isNaN(newValue)) {
        toast.error(`Please enter a valid number for ${editingCell.column}`);
        setEditingCell(null);
        return;
      }
    // Check if value actually changed (unless skipCheck is true)
    if (!skipCheck && newValue === originalValue) {
      setEditingCell(null);
      setFocusedCell(null);
      return;
    }
    } else {
      // For string values, check if changed
      if (String(newValue) === String(originalValue)) {
        setEditingCell(null);
        return;
      }
    }

    // Show confirmation modal
    setPendingUpdate({
      type: 'individual',
      itemNumber: row.Item_Number,
      field: editingCell.column,
      data: { [editingCell.column]: newValue }
    });
    setConfirmModalOpen(true);
  };

  // Perform individual item update
  const performIndividualUpdate = async () => {
    if (!pendingUpdate || pendingUpdate.type !== 'individual' || !pendingUpdate.itemNumber || !pendingUpdate.data) {
      return;
    }

    setUpdating(true);
    try {
      await updateInventory(pendingUpdate.itemNumber.toString(), pendingUpdate.data);
      toast.success('Inventory updated successfully!');
      // Refresh data
      fetchInventoryItems();
      setEditingCell(null);
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast.error(error?.response?.data?.message || 'Failed to update inventory');
    } finally {
      setUpdating(false);
      setConfirmModalOpen(false);
      setPendingUpdate(null);
    }
  };


  // Get all available fields based on selected group
  const getAvailableFields = (): string[] => {
    return groupAvailableFields;
  };

  // Get field type for input
  const getFieldType = (fieldName: string): string => {
    if (data.length === 0) return 'text';
    const firstItem = data[0];
    const value = firstItem[fieldName];
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'text';
    return 'text';
  };

  // Get available fields based on selected group
  const groupAvailableFields = useMemo((): string[] => {
    const group = FIELD_GROUPS[selectedGroup];
    return group ? group.fields : [];
  }, [selectedGroup]);

  // Get date fields to show based on group
  const groupDateFields = useMemo((): string[] => {
    const group = FIELD_GROUPS[selectedGroup];
    if (!group) return [];
    return group.isPriceGroup 
      ? ['PriceCostModifiedDate', 'PriceCostModifiedUser'] 
      : ['Date_LastChange', 'Date_LastChangeUser'];
  }, [selectedGroup]);

  // Get all table columns - show group fields or selected fields
  const tableColumns = useMemo((): string[] => {
    if (data.length === 0) return [];
    
    const selectedFields = fieldUpdates.filter(fu => fu.field).map(fu => fu.field);
    
    // Always show Item_Number and Description
    const columnsToShow: string[] = ['Item_Number', 'Description'];
    
    if (selectedFields.length > 0) {
      // Show selected fields
      selectedFields.forEach(field => {
        if (!columnsToShow.includes(field)) {
          columnsToShow.push(field);
        }
      });
    } else {
      // Show group fields
      groupAvailableFields.forEach(field => {
        if (!columnsToShow.includes(field)) {
          columnsToShow.push(field);
        }
      });
    }
    
    // Add date fields at the end
    groupDateFields.forEach(field => {
      if (!columnsToShow.includes(field)) {
        columnsToShow.push(field);
      }
    });
    
    return columnsToShow;
  }, [data, fieldUpdates, groupAvailableFields, groupDateFields]);

  // Fast navigation helper - direct DOM focus without state update first
  const focusCell = useCallback((rowIndex: number, column: string) => {
    const cellId = `${startIndex + rowIndex}-${column}`;
    const cell = document.querySelector(`[data-cell-id="${cellId}"]`) as HTMLElement;
    cell?.focus();
  }, [startIndex]);

  // Handle keyboard navigation - simplified and fast
  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, column: string) => {
    const key = e.key;
    
    // ESC - always cancel and blur
    if (key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      setFocusedCell(null);
      (document.activeElement as HTMLElement)?.blur();
      return;
    }
    
    // If editing, don't handle navigation
    if (editingCell) return;
    
    // Enter - start editing
    if (key === 'Enter') {
      e.preventDefault();
      handleCellClick(rowIndex, column, paginatedData[rowIndex]?.[column]);
      return;
    }
    
    const colIndex = tableColumns.indexOf(column);
    
    const isEditableCol = (col: string) => !isNonEditableField(col);
    const editableCols = tableColumns.filter(isEditableCol);
    
    // Arrow navigation - skip non-editable columns, wrap to next/prev row
    if (key === 'ArrowRight') {
      e.preventDefault();
      for (let i = colIndex + 1; i < tableColumns.length; i++) {
        if (isEditableCol(tableColumns[i])) {
          focusCell(rowIndex, tableColumns[i]);
          return;
        }
      }
      // Wrap to next row first editable column
      if (rowIndex < paginatedData.length - 1 && editableCols.length > 0) {
        focusCell(rowIndex + 1, editableCols[0]);
      }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      for (let i = colIndex - 1; i >= 0; i--) {
        if (isEditableCol(tableColumns[i])) {
          focusCell(rowIndex, tableColumns[i]);
          return;
        }
      }
      // Wrap to previous row last editable column
      if (rowIndex > 0 && editableCols.length > 0) {
        focusCell(rowIndex - 1, editableCols[editableCols.length - 1]);
      }
    } else if (key === 'ArrowDown' && rowIndex < paginatedData.length - 1) {
      e.preventDefault();
      focusCell(rowIndex + 1, column);
    } else if (key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      focusCell(rowIndex - 1, column);
    }
  }, [editingCell, paginatedData, tableColumns, focusCell, handleCellClick]);

  const formatCellValue = (value: any, column?: string): string => {
    if (value === null || value === undefined) return '-';
    
    // For toggle/flag fields, show 0 or 1 instead of Yes/No
    if (column && isToggleField(column)) {
      if (typeof value === 'boolean') return value ? '1' : '0';
      if (typeof value === 'number') return value === 1 ? '1' : '0';
      if (value === '1' || value === 'true' || value === true) return '1';
      return '0';
    }
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      // Check if it's a date (timestamp)
      if (value > 1000000000000) {
        return new Date(value).toLocaleDateString();
      }
      return value.toString();
    }
    if (typeof value === 'object') {
      // Handle nested objects like SalesCategory and PriceClass
      if (value.Category_Desc) return value.Category_Desc;
      // Handle PriceClass - show N/A if Class_Desc is missing or empty
      if (value.hasOwnProperty('Class_Desc')) {
        return value.Class_Desc || 'N/A';
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Call API when applied filters change
  useEffect(() => {
    // Create a string representation of current filters to compare
    const currentFilters = JSON.stringify({
      salesCategory: appliedSalesCategory.map(c => c.value),
      priceClass: appliedPriceClass.map(c => c.value),
      filter: appliedFilter,
      search: appliedSearch
    });
    
    // Skip if filters haven't actually changed
    if (prevFiltersRef.current === currentFilters) {
      return;
    }
    
    // Update the ref with current filters
    prevFiltersRef.current = currentFilters;
    
    // Skip on initial mount - only fetch when filters actually change
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Only fetch on initial mount if we have a filter or search
      if (appliedFilter || appliedSearch || appliedSalesCategory.length > 0 || appliedPriceClass.length > 0) {
        fetchInventoryItems();
      }
      return;
    }
    
    // For subsequent changes, always fetch when filters change
    fetchInventoryItems();
  }, [appliedSalesCategory, appliedPriceClass, appliedFilter, appliedSearch, fetchInventoryItems]);

  // Global ESC key handler - toggle between focused mode and normal mode
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingCell && paginatedData.length > 0) {
        e.preventDefault();
        
        // If there's a focused cell, clear it (exit focused mode)
        if (focusedCell) {
          setFocusedCell(null);
          (document.activeElement as HTMLElement)?.blur();
        } else {
          // If no focused cell, enter focused mode by focusing Description column in first row
          if (tableColumns.includes('Description')) {
            setFocusedCell({ rowIndex: 0, column: 'Description' });
            const cellId = `${startIndex}-Description`;
            const cell = document.querySelector(`[data-cell-id="${cellId}"]`) as HTMLElement;
            cell?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell, paginatedData, tableColumns, startIndex, focusedCell]);


  return (
    <Box sx={{ p: { xs: 1, md: 2 }, pt: { xs: 1, md: 1 } }}>
      {/* Header with Back Button, Search, and Filter Button */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton 
            onClick={() => navigate('/admin/products')}
            sx={{ p: 0.5 }}
          >
            <ArrowBackIcon sx={{color: 'primary.main', fontSize: 20}}/>
          </IconButton>
          <Typography fontSize={18} fontWeight={600} color="primary.main">
            Bulk Update Inventory
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, maxWidth: 400, ml: 'auto' }}>
          <TextField
            fullWidth
            size="small"
            value={appliedSearch}
            onChange={(e) => setAppliedSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Search will be applied via useEffect when appliedSearch changes
              }
            }}
            onBlur={() => {
              // Search will be applied via useEffect when appliedSearch changes
            }}
            placeholder="Search items (e.g., 24/7)"
            sx={{ 
              fontSize: "14px",
              '& .MuiInputBase-root': {
                height: '36px',
              }
            }}
          />
          <CustomButton
            onClick={() => setFilterDrawerOpen(true)}
            icon={<FilterListIcon sx={{ fontSize: 18 }} />}
            iconPosition="left"
            appearance="outlined"
            fullWidth={false}
            size="small"
            sx={{ mt: 0, minWidth: 'auto' }}
          >
            Filters
          </CustomButton>
        </Box>
      </Box>

      {/* Main Content: 8 columns table + 4 columns bulk update */}
      <Grid container spacing={2}>
        {/* Table Section - 8 columns */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper 
            sx={{ 
              boxShadow: 'none', 
              borderRadius: '0px', 
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              height: 'calc(100vh - 240px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {!hasDataLoaded ? (
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography fontSize={14} color="text.secondary" mb={2}>
                  No data loaded. Please apply filters to load inventory items.
                </Typography>
                <CustomButton
                  onClick={() => setFilterDrawerOpen(true)}
                  appearance="filled"
                  fullWidth={false}
                  size="small"
                  sx={{ mt: 0 }}
                >
                  Open Filters
                </CustomButton>
              </Box>
            ) : (
              <>
                <TableContainer 
                  sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    '& .MuiTableCell-root': {
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRight: `1px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[800] 
                        : theme.palette.grey[100],
                      fontWeight: 600,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      color: theme.palette.text.primary,
                    }
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {tableColumns.map((column) => (
                          <TableCell 
                            key={column}
                            sx={{ 
                              minWidth: 100,
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            {formatColumnName(column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, rowIndex) => (
                          <TableRow key={`skeleton-${rowIndex}`}>
                            {tableColumns.map((column) => (
                              <TableCell key={column}>
                                <Skeleton variant="text" width="100%" height={20} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={tableColumns.length} align="center" sx={{ py: 4 }}>
                            <Typography fontSize={12} color="text.secondary">
                              No data available. Please adjust your filters.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((row, index) => (
                          <TableRow key={startIndex + index} hover>
                            {tableColumns.map((column) => {
                              const isEditing = editingCell?.rowIndex === index && editingCell?.column === column;
                              const isEditable = !isNonEditableField(column);
                              const canEdit = !isNonEditableField(column);
                              const cellValue = row[column];
                              
                              const isFocused = focusedCell?.rowIndex === index && focusedCell?.column === column;
                              
                              return (
                                <TableCell 
                                  key={column}
                                  data-cell-id={`${startIndex + index}-${column}`}
                                  onClick={isEditable ? () => {
                                    setFocusedCell({ rowIndex: index, column });
                                  } : undefined}
                                  onDoubleClick={isEditable ? () => {
                                    handleCellClick(index, column, cellValue);
                                  } : undefined}
                                  onFocus={isEditable ? () => setFocusedCell({ rowIndex: index, column }) : undefined}
                                  onKeyDown={isEditable ? (e) => handleCellKeyDown(e, index, column) : undefined}
                                  tabIndex={isEditable ? 0 : -1}
                                  sx={{ 
                                    fontSize: '11px',
                                    whiteSpace: 'nowrap',
                                    cursor: isEditable ? 'pointer' : 'default',
                                    position: 'relative',
                                    outline: isFocused && !isEditing ? `2px solid ${theme.palette.primary.main}` : 'none',
                                    outlineOffset: '-2px',
                                    transition: 'outline 0.1s ease',
                                    '&:hover': {
                                      bgcolor: isEditable && !isEditing ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                                    },
                                    '&:focus': {
                                      outline: isEditable ? `2px solid ${theme.palette.primary.main}` : 'none',
                                      outlineOffset: '-2px',
                                    },
                                    '&:focus-visible': {
                                      outline: isEditable ? `2px solid ${theme.palette.primary.main}` : 'none',
                                      outlineOffset: '-2px',
                                    },
                                    p: isEditing ? 0 : '4px 8px',
                                  }}
                                >
                                  {isEditing && canEdit ? (
                                    <Box sx={{ p: 0.5 }}>
                                      {isToggleField(column) ? (
                                        <Box 
                                          sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            height: '32px',
                                            px: 1,
                                            border: `1px solid ${theme.palette.primary.main}`,
                                            borderRadius: 1,
                                            bgcolor: 'background.paper',
                                          }}
                                        >
                                          <Typography fontSize={11} color="text.secondary">
                                            {column}
                                          </Typography>
                                          <SwitchInput
                                            checked={editingCell.value === true || editingCell.value === 1 || editingCell.value === '1' || editingCell.value === 'true'}
                                            onChange={(checked) => {
                                              const newValue = checked ? 1 : 0;
                                              handleCellValueChange(newValue);
                                              // Automatically trigger update with new value
                                              handleCellUpdate(false, newValue);
                                            }}
                                            sx={{ mb: 0 }}
                                            isShowLabel={false}
                                          />
                                        </Box>
                                      ) : isDropdownField(column) ? (
                                        <FormControl fullWidth size="small">
                                          <Select
                                            value={editingCell.value?.toString() || ''}
                                            onChange={(e) => {
                                              const newValue = e.target.value;
                                              handleCellValueChange(newValue);
                                              // Automatically trigger update with new value
                                              handleCellUpdate(false, newValue);
                                            }}
                                            onClose={() => {
                                              // Trigger update when dropdown closes (in case onChange didn't fire)
                                              handleCellUpdate();
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCellUpdate();
                                              } else if (e.key === 'Escape') {
                                                e.preventDefault();
                                                setEditingCell(null);
                                                setFocusedCell(null);
                                              }
                                            }}
                                            autoFocus
                                            sx={{ fontSize: '11px', height: '32px' }}
                                          >
                                            {getDropdownOptions(column).map((option) => (
                                              <MenuItem key={option.value} value={option.value} sx={{ fontSize: '11px' }}>
                                                {option.label}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      ) : (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          value={editingCell.value ?? ''}
                                          onChange={(e) => handleCellValueChange(e.target.value)}
                                          onBlur={() => handleCellUpdate()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleCellUpdate();
                                            } else if (e.key === 'Escape') {
                                              e.preventDefault();
                                              setEditingCell(null);
                                              setFocusedCell(null);
                                            }
                                          }}
                                          autoFocus
                                          type={typeof cellValue === 'number' ? 'number' : 'text'}
                                          sx={{
                                            fontSize: '11px',
                                            '& .MuiInputBase-input': { 
                                              fontSize: '11px',
                                              py: 0.5,
                                              height: '32px',
                                            }
                                          }}
                                        />
                                      )}
                                    </Box>
                                  ) : (
                                    formatCellValue(cellValue, column)
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {data.length > 0 && (
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderTop: `1px solid ${theme.palette.divider}`, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[900] 
                        : 'background.paper',
                    }}
                  >
                    <Typography fontSize={12} color="text.secondary" fontWeight={500}>
                      Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} items
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          sx={{ fontSize: '11px', height: '32px' }}
                        >
                          <MenuItem value={25}>25</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                          <MenuItem value={100}>100</MenuItem>
                          <MenuItem value={200}>200</MenuItem>
                        </Select>
                      </FormControl>
                      <Box display="flex" gap={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Typography fontSize={11} sx={{ px: 1, display: 'flex', alignItems: 'center' }}>
                          Page {currentPage} of {totalPages || 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages || loading}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowForwardIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Bulk Update Fields Section - 4 columns */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <BulkUpdateFields
            availableFields={getAvailableFields()}
            fieldUpdates={fieldUpdates}
            onFieldUpdatesChange={setFieldUpdates}
            onUpdate={handleBulkUpdate}
            updating={updating}
            getFieldType={getFieldType}
            getFieldValue={(fieldName: string) => {
              if (data.length > 0) {
                return data[0][fieldName];
              }
              return undefined;
            }}
            salesCategoryOptions={inventoryOptions.salesCategory}
            priceClassOptions={inventoryOptions.priceClass}
            inventoryOptions={inventoryOptions}
            selectedGroup={selectedGroup}
            onGroupChange={(group) => {
              setSelectedGroup(group);
              setFieldUpdates([]); // Clear field updates when group changes
            }}
            groupOptions={Object.entries(FIELD_GROUPS).map(([key, val]) => ({ value: key, label: val.label }))}
          />
        </Grid>
      </Grid>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            bgcolor: 'background.paper',
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography fontSize={18} fontWeight={600} color="text.primary">
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ p: 0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Filter Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MultiSearchableDropdown
              options={inventoryOptions.salesCategory}
              value={localSalesCategory}
              onChange={handleLocalSalesCategoryChange}
              loading={loadingOptions}
              placeholder="Select sales categories"
              disabled={localPriceClass.length > 0}
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />

            <MultiSearchableDropdown
              options={inventoryOptions.priceClass}
              value={localPriceClass}
              onChange={handleLocalPriceClassChange}
              loading={loadingOptions}
              placeholder="Select sub category"
              disabled={localSalesCategory.length > 0}
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />

            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                label="Filter"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="I_Inactive">{formatColumnName('I_Inactive')}</MenuItem>
                <MenuItem value="ShortOrderForm">{formatColumnName('ShortOrderForm')}</MenuItem>
                {/* <MenuItem value="All">All</MenuItem> */}
              </Select>
            </FormControl>
          </Box>

          {/* Drawer Footer with Action Buttons */}
          <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box display="flex" gap={2}>
              <CustomButton
                onClick={handleResetFilters}
                appearance="outlined"
                fullWidth
                sx={{ fontSize: '14px', py: 1, mt: 0 }}
              >
                Reset
              </CustomButton>
              <CustomButton
                onClick={handleApplyFilters}
                appearance="filled"
                fullWidth
                loading={loading}
                sx={{ fontSize: '14px', py: 1, mt: 0 }}
              >
                Apply
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => {
          if (!updating) {
            setConfirmModalOpen(false);
            setPendingUpdate(null);
            if (editingCell) {
              setEditingCell(null);
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !updating) {
            e.preventDefault();
            if (pendingUpdate?.type === 'bulk') {
              performBulkUpdate();
            } else if (pendingUpdate?.type === 'individual') {
              performIndividualUpdate();
            }
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {pendingUpdate?.type === 'bulk' ? 'Confirm Bulk Update' : 'Confirm Update'}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" color="text.secondary" fontSize={14}>
            {pendingUpdate?.type === 'bulk' 
              ? 'Are you sure you want to update all items with the selected fields?'
              : `Are you sure you want to update ${pendingUpdate?.field} for item ${pendingUpdate?.itemNumber}?`
            }
          </Typography>
          {pendingUpdate?.type === 'individual' && pendingUpdate.data && (
            <Box mt={1.5}>
              <Typography variant="body2" fontWeight={500} color="text.primary" fontSize={12}>
                Field: {pendingUpdate.field}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize={12}>
                New Value: {String(Object.values(pendingUpdate.data)[0])}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => {
              if (!updating) {
                setConfirmModalOpen(false);
                setPendingUpdate(null);
                if (editingCell) {
                  setEditingCell(null);
                }
              }
            }}
            appearance="outlined"
            disabled={updating}
            fullWidth={false}
            size="small"
            sx={{ minWidth: 100, mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={() => {
              if (pendingUpdate?.type === 'bulk') {
                performBulkUpdate();
              } else if (pendingUpdate?.type === 'individual') {
                performIndividualUpdate();
              }
            }}
            loading={updating}
            disabled={updating}
            fullWidth={false}
            size="small"
            sx={{ minWidth: 100, mt: 0 }}
          >
            Confirm
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkUpdate;
