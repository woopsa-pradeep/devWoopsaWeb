import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  // CheckCircle as DoneIcon,  
  // Inventory as InventoryIcon, 
  // Settings as SettingsIcon,
  // Info as InfoIcon,
  // AttachMoney as MoneyIcon,
  // Business as BusinessIcon,
  // Inventory2 as CaseIcon,
  // Flag as FlagIcon,
  // SmokingRooms as CigaretteIcon,
  // Calculate as CalculateIcon,
  // LocalTaxi as TaxIcon,
  // Warehouse as WarehouseIcon,
  // ShoppingCart as RetailIcon,
  // QrCode as CodeIcon,
  // Event as EventIcon,
  // Campaign as PromotionIcon,
  // MoreHoriz as MoreIcon,
} from '@mui/icons-material';
import TextInput from '../../../component/atoms/TextInput';
import SearchableSelectInput from '../../../component/atoms/SearchableSelectInput';
import CheckboxInput from '../../../component/atoms/CheckboxInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { inventorySchema, InventoryFormData } from './inventory.schema';
import { getListForInventory, createInventory, checkUPC, getInventoryById, updateInventory, updateUPC } from '../../../redux/apis/distrubutor/inventoryApis';
import toast from 'react-hot-toast';

interface UPCData {
  UPC_Number: string;
  UPC_Type: 'Primary' | 'Case' | 'Retail';
  Status: number;
  Priority: number;
  Qty: number;
  myKey?: number; // ID for existing UPCs in edit mode
}

const Inventory: React.FC = () => {
  const { itemNumber } = useParams<{ itemNumber?: string }>();
  const location = useLocation();
  const isEditMode = !!itemNumber;
  const productListPath = location.pathname.startsWith('/sales') ? '/sales/product' : '/admin/products';
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<any>(null);
  const [showInitialPopup, setShowInitialPopup] = useState(!isEditMode);
  const [originalData, setOriginalData] = useState<any>(null);
  const [showUPCPopup, setShowUPCPopup] = useState(false);
  const [upcData, setUpcData] = useState<UPCData[]>([]);
  const [primaryUPC, setPrimaryUPC] = useState('');
  const [caseUPC, setCaseUPC] = useState('');
  const [retailUPC, setRetailUPC] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [upcValidating, setUpcValidating] = useState(false);
  const [upcValidationErrors, setUpcValidationErrors] = useState<{
    primary?: string;
    case?: string;
    retail?: string;
  }>({});
  const lastLoadedUPCRef = useRef<string>('');
  const initialPrimaryUPCRef = useRef<string>('');
  const initialCaseUPCRef = useRef<string>('');
  const initialRetailUPCRef = useRef<string>('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
    trigger,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      Sales_Category: '12',
      Price_Class: '999',
      Price_Subclass: '0',
      OTP_Number: 0,
      Description: '',
      Pack: 1,
      UOM: 'ECH',
      Section: '',
      Location: 0,
      Section2: '',
      Location2: 0,
      PickArea: 'WHSE',
      BaseCost: 0,
      NetCost: 0,
      Invoice_Cost: 0,
      AvgCost: 0,
      Price1: 0,
      Price2: 0,
      Price3: 0,
      Price4: 0,
      Price5: 0,
      Price6: 0,
      Retail1: 0,
      Retail2: 0,
      Retail3: 0,
      Primary_Vendor: '',
      CaseCount: 1,
      CaseWeight: 0,
      Sequence: 0,
      Case_Discounts: true,
      ShortOrderForm: true,
      PriceBook_Include: true,
      Cig_Pack: '20',
      Cig_Sticks: 200,
      Cig_PremDisc_Code: 'P',
      AltDesc: '',
      Item_Message: '',
      I_Cube: 0,
      DepositAmount: 0,
      CaseDiscount_Pct: 0,
      Project_Identifier: '--',
      UnitOunces: 0,
      Reorder_Level: 0,
      HeadingFlag: false,
      Unit_Upcharge: 0,
      Unit_Price: 0,
      I_WeightRate: 0,
      Vendor_ItemNumberAlpha: '',
      Reorder_Qty: 0,
      MSA_Category_Code: '------',
      I_Inactive: false,
      MSA_Description: '',
      ALT_Description2: '',
      Manufacturer: '',
      Breakable: false,
      I_SalesTaxSelect: 'N',
      I_NeverDiscount: false,
      BumpToMinimum: 0,
      NACS: '',
      NACS_Unit: 'E',
      Brand_ID: '0',
      MinimumQTY: 0,
      MaximumQTY: 0,
      SpecialTaxUnits: 0,
      ExclusionGroup_ID: '',
      RetailPct1: 0,
      RetailPct2: 0,
      RetailPct3: 0,
      OnHand_Maximum: 0,
      CaseLength: 0,
      CaseWidth: 0,
      CaseHeight: 0,
      CasesPerPallet: 0,
      I_PrepaidStatus: false,
      Jurisdiction_State: '',
      Jurisdiction_County: '',
      Jurisdiction_City: '',
      Inactive_Date: null,
      EBT: false,
      Lot_ID: 0,
      I_ReturnStatus: 'S',
      Item_GroupID: '',
      FrozenFlag: false,
      CoolerFlag: false,
      HazMatFlag: false,
      StandardUnitDescription: '',
      Cig_Promo_Code: '0',
      MSA_Promotion: '',
      MSA_Promotion_Code: '',
      MSA_Component: false,
      I_Discontinued: false,
      Points: 0,
      PriceCostModifiedDate: null,
      PriceCostModifiedUser: 0,
      Track_ExpirationDate: true,
      Track_LotRef: true,
      MinimumStockAvailability: 0,
    },
  });

  // Fetch API data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response: any = await getListForInventory();
        setApiData(response.data);

        // If edit mode, fetch existing inventory data
        if (isEditMode && itemNumber) {
          try {
            const inventoryResponse: any = await getInventoryById(itemNumber);
            const inventoryData = inventoryResponse?.data || inventoryResponse;
            
            if (inventoryData) {
              setOriginalData(inventoryData);
              
              // Pre-fill form with existing data
              // Convert numeric fields to strings where schema expects strings
              const stringFields = [
                'Sales_Category', 'Price_Class', 'Price_Subclass', 
                'UOM', 'Section', 'PickArea', 'Project_Identifier',
                'Primary_Vendor', 'Cig_Pack', 'Cig_PremDisc_Code',
                'MSA_Category_Code', 'NACS', 'NACS_Unit', 'Brand_ID',
                'I_SalesTaxSelect', 'I_ReturnStatus', 'Item_GroupID',
                'Cig_Promo_Code', 'MSA_Promotion', 'MSA_Promotion_Code',
                'StandardUnitDescription', 'ExclusionGroup_ID',
                'Manufacturer', 'Jurisdiction_State', 'Jurisdiction_County', 'Jurisdiction_City'
              ];
              
              Object.keys(inventoryData).forEach((key) => {
                if (inventoryData[key] !== null && inventoryData[key] !== undefined) {
                  let value = inventoryData[key];
                  
                  // Convert to string if it's a string field and value is a number
                  if (stringFields.includes(key) && typeof value === 'number') {
                    value = String(value);
                  }
                  
                  // Handle boolean fields
                  if (typeof value === 'boolean') {
                    setValue(key as any, value);
                  } else if (value !== null && value !== undefined) {
                    setValue(key as any, value);
                  }
                }
              });

              // Handle UPC data
              if (inventoryData.upcData && Array.isArray(inventoryData.upcData)) {
                // Ensure myKey is preserved if it exists
                const upcsWithKey = inventoryData.upcData.map((u: any) => ({
                  ...u,
                  myKey: u.myKey,
                }));
                setUpcData(upcsWithKey);
                const primary = upcsWithKey.find((u: UPCData) => u.UPC_Type === 'Primary');
                const caseU = upcsWithKey.find((u: UPCData) => u.UPC_Type === 'Case');
                const retail = upcsWithKey.find((u: UPCData) => u.UPC_Type === 'Retail');
                if (primary) setPrimaryUPC(primary.UPC_Number);
                if (caseU) setCaseUPC(caseU.UPC_Number);
                if (retail) setRetailUPC(retail.UPC_Number);
              } else if (inventoryData.UPCList && Array.isArray(inventoryData.UPCList)) {
                // Handle alternative UPC format - preserve myKey for edit mode
                const upcs: UPCData[] = inventoryData.UPCList.map((upc: any, index: number) => {
                  // Determine UPC type based on Status or index
                  let upcType: 'Primary' | 'Case' | 'Retail' = 'Primary';
                  if (upc.Status === 1 || upc.Status === '1') {
                    upcType = 'Case';
                  } else if (upc.Status === 2 || upc.Status === '2') {
                    upcType = 'Retail';
                  } else if (upc.UPC_Type) {
                    upcType = upc.UPC_Type;
                  } else if (index === 1) {
                    upcType = 'Case';
                  } else if (index === 2) {
                    upcType = 'Retail';
                  }
                  
                  return {
                    UPC_Number: upc.UPC_Number || upc,
                    UPC_Type: upcType,
                    Status: upc.Status !== undefined ? upc.Status : (upcType === 'Primary' ? 0 : upcType === 'Case' ? 1 : 2),
                    Priority: upc.Priority || 1,
                    Qty: upc.Qty || 0,
                    myKey: upc.myKey, // Preserve myKey for edit mode
                  };
                });
                setUpcData(upcs);
                const primary = upcs.find((u) => u.UPC_Type === 'Primary');
                const caseU = upcs.find((u) => u.UPC_Type === 'Case');
                const retail = upcs.find((u) => u.UPC_Type === 'Retail');
                if (primary) setPrimaryUPC(primary.UPC_Number);
                if (caseU) setCaseUPC(caseU.UPC_Number);
                if (retail) setRetailUPC(retail.UPC_Number);
              }
            }
          } catch (error) {
            console.error('Error fetching inventory by ID:', error);
            toast.error('Failed to load inventory data');
          }
        } else {
          // Set Project Identifier to '--' (N/A) if available, otherwise first option
          if (response.data?.projectIdentifier && response.data.projectIdentifier.length > 0) {
            const defaultOption = response.data.projectIdentifier.find(
              (item: any) => item.Project_Identifier === '--'
            );
            if (defaultOption) {
              setValue('Project_Identifier', '--');
            } else {
              setValue('Project_Identifier', response.data.projectIdentifier[0].Project_Identifier);
            }
          }

          // Set NACS to first option if available
          if (response.data?.nacsCategory && response.data.nacsCategory.length > 0) {
            setValue('NACS', response.data.nacsCategory[0].NACS_Category_Code);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setValue, isEditMode, itemNumber]);

  // Watch MSA_Promotion and reset related fields to defaults when "00" is selected
  const msaPromotion = watch('MSA_Promotion');
  useEffect(() => {
    if (msaPromotion === '0') {
      setValue('MSA_Promotion_Code', '');
      setValue('MSA_Component', false);
      setValue('MSA_Description', '');
    }
  }, [msaPromotion, setValue]);

  // Watch Sales_Category and handle Cigarette selection
  const salesCategory = watch('Sales_Category');
  useEffect(() => {
    if (apiData?.salesCategory && salesCategory) {
      // Find the selected category to check if it's Cigarette
      const selectedCategory = apiData.salesCategory.find(
        (cat: any) => cat.Sales_Category?.toString() === salesCategory.toString()
      );
      
      const isCigarette = selectedCategory?.Category_Desc?.toLowerCase().includes('cigarette');
      
      if (isCigarette) {
        // Set OTP_Number to 255 (as string to match option values)
        setValue('OTP_Number', '255' as any);
        // Set Project_Identifier to 'PM'
        setValue('Project_Identifier', 'PM');
        // Set MSA_Category_Code to '003231'
        setValue('MSA_Category_Code', '003231');
      }
    }
  }, [salesCategory, apiData, setValue]);

  // Auto-load image when modal opens with existing Primary UPC or when UPC is entered
  useEffect(() => {
    if (primaryUPC.trim()) {
      const trimmedUPC = primaryUPC.trim();
      // Only load if this is a different UPC than last loaded
      if (lastLoadedUPCRef.current !== trimmedUPC) {
        // Small delay to ensure modal is fully rendered (if modal is open) or form is ready
        const timer = setTimeout(() => {
          setImageError(false);
          const imageUrl = `https://woopsacdn.blob.core.windows.net/product-images/${trimmedUPC}.jpg`;
          
          setImageLoading(true);
          const img = new Image();
          img.onload = () => {
            setProductImageUrl(imageUrl);
            setImageLoading(false);
            setImageError(false);
            lastLoadedUPCRef.current = trimmedUPC;
          };
          img.onerror = () => {
            setImageError(true);
            setImageLoading(false);
            setProductImageUrl(null);
            lastLoadedUPCRef.current = '';
          };
          img.src = imageUrl;
        }, showUPCPopup ? 100 : 0);

        return () => clearTimeout(timer);
      }
    } else if (!primaryUPC.trim()) {
      // Clear image if UPC is cleared
      setProductImageUrl(null);
      setImageError(false);
      setImageLoading(false);
      lastLoadedUPCRef.current = '';
    }
  }, [showUPCPopup, primaryUPC]);

  // Helper functions to transform API data to SelectInput format
  const transformToOptions = (data: any[], valueKey: string, labelKey: string) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Create a map to deduplicate by value, and track by both value and label to ensure uniqueness
    const optionsMap = new Map<string, { value: string; label: string; id: string }>();
    const seenLabels = new Set<string>();
    
    data.forEach((item, index) => {
      const value = item[valueKey]?.toString() || '';
      const label = item[labelKey]?.toString() || '';
      
      // Only add if value is not empty
      if (value) {
        // If we haven't seen this exact value-label combination, add it
        if (!optionsMap.has(value)) {
          // If label is duplicate but value is unique, make label unique
          let finalLabel = label;
          if (seenLabels.has(label)) {
            finalLabel = `${label} (${value})`;
          } else {
            seenLabels.add(label);
          }
          
          optionsMap.set(value, { 
            value, 
            label: finalLabel,
            id: `${value}_${index}` // Add unique ID for React keys
          });
        }
      }
    });
    
    return Array.from(optionsMap.values());
  };

  const transformToOptionsWithConcat = (data: any[], valueKey: string, labelKey1: string, labelKey2: string) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Create a map to deduplicate by value
    const optionsMap = new Map<string, { value: string; label: string; id: string }>();
    
    data.forEach((item, index) => {
      const value = item[valueKey]?.toString() || '';
      const label = `${item[labelKey1]?.toString() || ''} - ${item[labelKey2]?.toString() || ''}`;
      
      // Only add if value is not empty and not already in map
      if (value && !optionsMap.has(value)) {
        optionsMap.set(value, { 
          value, 
          label,
          id: `${value}_${index}` // Add unique ID for React keys
        });
      }
    });
    
    return Array.from(optionsMap.values());
  };

  const handleInitialPopupResponse = (addWithUPC: boolean) => {
    setShowInitialPopup(false);
    if (addWithUPC) {
      handleOpenUPCPopup();
    }
  };




  // UPC Form handling
  const handleRemoveUPC = (index: number) => {
    setUpcData(upcData.filter((_, i) => i !== index));
  };

  // Individual UPC validation handlers
  const handleValidatePrimaryUPC = async () => {
    if (!primaryUPC.trim()) {
      toast.error('Please enter a Primary UPC');
      return;
    }

    setUpcValidating(true);
    setUpcValidationErrors(prev => ({ ...prev, primary: undefined }));

    try {
      // Check if we're in edit mode and if this UPC already has a myKey
      const existingPrimary = upcData.find(upc => upc.UPC_Type === 'Primary');
      
      if (isEditMode && existingPrimary?.myKey) {
        // In edit mode with existing UPC - call edit API
        const editResponse: any = await updateUPC(existingPrimary.myKey, {
          upcNumber: primaryUPC.trim()
        });
        
        if (editResponse?.success) {
          // Update the UPC in upcData
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Primary');
          newUPCs.push({
            UPC_Number: primaryUPC.trim(),
            UPC_Type: 'Primary',
            Status: 0,
            Priority: 1,
            Qty: 0,
            myKey: existingPrimary.myKey, // Preserve myKey
          });
          setUpcData(newUPCs);
          toast.success('Primary UPC updated successfully');
        } else {
          const errorMsg = editResponse?.message || 'Failed to update Primary UPC';
          setUpcValidationErrors(prev => ({ ...prev, primary: errorMsg }));
          toast.error(errorMsg);
        }
      } else {
        // New UPC or create mode - validate first
        const response: any = await checkUPC(primaryUPC.trim());
        if (!response?.success) {
          const errorMsg = response?.message || 'Invalid Primary UPC';
          setUpcValidationErrors(prev => ({ ...prev, primary: errorMsg }));
          setPrimaryUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Primary')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else if (response?.data === true) {
          // UPC already exists and is assigned to a product
          const errorMsg = 'This UPC is already assigned to a product. Please change the UPC.';
          setUpcValidationErrors(prev => ({ ...prev, primary: errorMsg }));
          setPrimaryUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Primary')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else {
          // UPC is available (data === false), save it
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Primary');
          newUPCs.push({
            UPC_Number: primaryUPC.trim(),
            UPC_Type: 'Primary',
            Status: 0,
            Priority: 1,
            Qty: 0,
            myKey: existingPrimary?.myKey, // Preserve myKey if exists
          });
          setUpcData(newUPCs);
          toast.success('Primary UPC validated and saved');
        }
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to process Primary UPC';
      setUpcValidationErrors(prev => ({ ...prev, primary: errorMsg }));
      setPrimaryUPC(''); // Clear the input field
      setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Primary')); // Remove from saved UPCs
      toast.error(errorMsg);
    } finally {
      setUpcValidating(false);
    }
  };

  const handleValidateCaseUPC = async () => {
    if (!caseUPC.trim()) {
      toast.error('Please enter a Case UPC');
      return;
    }

    setUpcValidating(true);
    setUpcValidationErrors(prev => ({ ...prev, case: undefined }));

    try {
      // Check if we're in edit mode and if this UPC already has a myKey
      const existingCase = upcData.find(upc => upc.UPC_Type === 'Case');
      
      if (isEditMode && existingCase?.myKey) {
        // In edit mode with existing UPC - call edit API
        const editResponse: any = await updateUPC(existingCase.myKey, {
          upcNumber: caseUPC.trim()
        });
        
        if (editResponse?.success) {
          // Update the UPC in upcData
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Case');
          newUPCs.push({
            UPC_Number: caseUPC.trim(),
            UPC_Type: 'Case',
            Status: 1,
            Priority: 1,
            Qty: 0,
            myKey: existingCase.myKey, // Preserve myKey
          });
          setUpcData(newUPCs);
          toast.success('Case UPC updated successfully');
        } else {
          const errorMsg = editResponse?.message || 'Failed to update Case UPC';
          setUpcValidationErrors(prev => ({ ...prev, case: errorMsg }));
          toast.error(errorMsg);
        }
      } else {
        // New UPC or create mode - validate first
        const response: any = await checkUPC(caseUPC.trim());
        if (!response?.success) {
          const errorMsg = response?.message || 'Invalid Case UPC';
          setUpcValidationErrors(prev => ({ ...prev, case: errorMsg }));
          setCaseUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Case')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else if (response?.data === true) {
          // UPC already exists and is assigned to a product
          const errorMsg = 'This UPC is already assigned to a product. Please change the UPC.';
          setUpcValidationErrors(prev => ({ ...prev, case: errorMsg }));
          setCaseUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Case')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else {
          // UPC is available (data === false), save it
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Case');
          newUPCs.push({
            UPC_Number: caseUPC.trim(),
            UPC_Type: 'Case',
            Status: 1,
            Priority: 1,
            Qty: 0,
            myKey: existingCase?.myKey, // Preserve myKey if exists
          });
          setUpcData(newUPCs);
          toast.success('Case UPC validated and saved');
        }
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to process Case UPC';
      setUpcValidationErrors(prev => ({ ...prev, case: errorMsg }));
      setCaseUPC(''); // Clear the input field
      setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Case')); // Remove from saved UPCs
      toast.error(errorMsg);
    } finally {
      setUpcValidating(false);
    }
  };

  const handleValidateRetailUPC = async () => {
    if (!retailUPC.trim()) {
      toast.error('Please enter a Retail UPC');
      return;
    }

    setUpcValidating(true);
    setUpcValidationErrors(prev => ({ ...prev, retail: undefined }));

    try {
      // Check if we're in edit mode and if this UPC already has a myKey
      const existingRetail = upcData.find(upc => upc.UPC_Type === 'Retail');
      
      if (isEditMode && existingRetail?.myKey) {
        // In edit mode with existing UPC - call edit API
        const editResponse: any = await updateUPC(existingRetail.myKey, {
          upcNumber: retailUPC.trim()
        });
        
        if (editResponse?.success) {
          // Update the UPC in upcData
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Retail');
          newUPCs.push({
            UPC_Number: retailUPC.trim(),
            UPC_Type: 'Retail',
            Status: 2,
            Priority: 1,
            Qty: 0,
            myKey: existingRetail.myKey, // Preserve myKey
          });
          setUpcData(newUPCs);
          toast.success('Retail UPC updated successfully');
        } else {
          const errorMsg = editResponse?.message || 'Failed to update Retail UPC';
          setUpcValidationErrors(prev => ({ ...prev, retail: errorMsg }));
          toast.error(errorMsg);
        }
      } else {
        // New UPC or create mode - validate first
        const response: any = await checkUPC(retailUPC.trim());
        if (!response?.success) {
          const errorMsg = response?.message || 'Invalid Retail UPC';
          setUpcValidationErrors(prev => ({ ...prev, retail: errorMsg }));
          setRetailUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Retail')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else if (response?.data === true) {
          // UPC already exists and is assigned to a product
          const errorMsg = 'This UPC is already assigned to a product. Please change the UPC.';
          setUpcValidationErrors(prev => ({ ...prev, retail: errorMsg }));
          setRetailUPC(''); // Clear the input field
          setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Retail')); // Remove from saved UPCs
          toast.error(errorMsg);
        } else {
          // UPC is available (data === false), save it
          let newUPCs = [...upcData];
          newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Retail');
          newUPCs.push({
            UPC_Number: retailUPC.trim(),
            UPC_Type: 'Retail',
            Status: 2,
            Priority: 1,
            Qty: 0,
            myKey: existingRetail?.myKey, // Preserve myKey if exists
          });
          setUpcData(newUPCs);
          toast.success('Retail UPC validated and saved');
        }
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to process Retail UPC';
      setUpcValidationErrors(prev => ({ ...prev, retail: errorMsg }));
      setRetailUPC(''); // Clear the input field
      setUpcData(prev => prev.filter(upc => upc.UPC_Type !== 'Retail')); // Remove from saved UPCs
      toast.error(errorMsg);
    } finally {
      setUpcValidating(false);
    }
  };

  const handleCloseUPCPopup = () => {
    // Save any entered UPCs (without validation since individual Done buttons handle validation)
    let newUPCs: UPCData[] = [...upcData];

    // Remove existing UPCs of the same type before adding new ones
    if (primaryUPC.trim() !== '') {
      newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Primary');
      newUPCs.push({
        UPC_Number: primaryUPC.trim(),
        UPC_Type: 'Primary',
        Status: 0,
        Priority: 1,
        Qty: 0,
      });
    }

    if (caseUPC.trim() !== '') {
      newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Case');
      newUPCs.push({
        UPC_Number: caseUPC.trim(),
        UPC_Type: 'Case',
        Status: 1,
        Priority: 1,
        Qty: 0,
      });
    }

    if (retailUPC.trim() !== '') {
      newUPCs = newUPCs.filter(upc => upc.UPC_Type !== 'Retail');
      newUPCs.push({
        UPC_Number: retailUPC.trim(),
        UPC_Type: 'Retail',
        Status: 2,
        Priority: 1,
        Qty: 0,
      });
    }

    setUpcData(newUPCs);
    
    // Update Basic Information section fields with the saved values
    const savedPrimary = newUPCs.find(upc => upc.UPC_Type === 'Primary');
    const savedCase = newUPCs.find(upc => upc.UPC_Type === 'Case');
    const savedRetail = newUPCs.find(upc => upc.UPC_Type === 'Retail');
    
    setPrimaryUPC(savedPrimary?.UPC_Number || '');
    setCaseUPC(savedCase?.UPC_Number || '');
    setRetailUPC(savedRetail?.UPC_Number || '');
    
    // Reset image state (will reload if Primary UPC exists)
    setProductImageUrl(null);
    setImageError(false);
    setImageLoading(false);
    lastLoadedUPCRef.current = '';
    setUpcValidationErrors({});
    setShowUPCPopup(false);
  };

  const handleCancelUPCPopup = () => {
    // Restore to initial values before modal was opened (don't clear saved upcData)
    setPrimaryUPC(initialPrimaryUPCRef.current);
    setCaseUPC(initialCaseUPCRef.current);
    setRetailUPC(initialRetailUPCRef.current);
    setProductImageUrl(null);
    setImageError(false);
    setImageLoading(false);
    lastLoadedUPCRef.current = '';
    setUpcValidationErrors({});
    setShowUPCPopup(false);
  };

  // Populate modal fields when opening if UPCs already exist
  const handleOpenUPCPopup = () => {
    // Save current values before opening modal (for cancel restoration)
    initialPrimaryUPCRef.current = primaryUPC;
    initialCaseUPCRef.current = caseUPC;
    initialRetailUPCRef.current = retailUPC;

    // Find existing UPCs by type
    const existingPrimary = upcData.find(upc => upc.UPC_Type === 'Primary');
    const existingCase = upcData.find(upc => upc.UPC_Type === 'Case');
    const existingRetail = upcData.find(upc => upc.UPC_Type === 'Retail');

    // Also check Basic Information section for UPCs
    const basicPrimary = primaryUPC.trim() || existingPrimary?.UPC_Number || '';
    const basicCase = caseUPC.trim() || existingCase?.UPC_Number || '';
    const basicRetail = retailUPC.trim() || existingRetail?.UPC_Number || '';

    setPrimaryUPC(basicPrimary);
    setCaseUPC(basicCase);
    setRetailUPC(basicRetail);
    setUpcValidationErrors({});
    setShowUPCPopup(true);
  };

  // const handleLoadProductImage = () => {
  //   if (!primaryUPC.trim()) {
  //     return;
  //   }
    
  //   const trimmedUPC = primaryUPC.trim();
  //   setImageLoading(true);
  //   setImageError(false);
  //   const imageUrl = `https://woopsacdn.blob.core.windows.net/product-images/${trimmedUPC}.jpg`;
    
  //   // Create an image element to test if the image exists
  //   const img = new Image();
  //   img.onload = () => {
  //     setProductImageUrl(imageUrl);
  //     setImageLoading(false);
  //     setImageError(false);
  //     lastLoadedUPCRef.current = trimmedUPC;
  //   };
  //   img.onerror = () => {
  //     setImageError(true);
  //     setImageLoading(false);
  //     setProductImageUrl(null);
  //     lastLoadedUPCRef.current = '';
  //   };
  //   img.src = imageUrl;
  // };

  const onSubmit = async (data: InventoryFormData) => {
    try {
      // Check if there are validation errors
      if (Object.keys(errors).length > 0) {
        toast.error('Please fix all validation errors before submitting');
        return;
      }
      
      // Collect UPCs from both popup and direct input in Basic Information section
      const allUPCs: UPCData[] = [...upcData];
      
      // Add UPCs from Basic Information section if they exist and aren't already in upcData
      if (primaryUPC.trim() !== '') {
        const primaryExists = allUPCs.some(upc => upc.UPC_Number === primaryUPC.trim() && upc.UPC_Type === 'Primary');
        if (!primaryExists) {
          allUPCs.push({
            UPC_Number: primaryUPC.trim(),
            UPC_Type: 'Primary',
            Status: 0,
            Priority: 1,
            Qty: 0,
          });
        }
      }
      
      if (caseUPC.trim() !== '') {
        const caseExists = allUPCs.some(upc => upc.UPC_Number === caseUPC.trim() && upc.UPC_Type === 'Case');
        if (!caseExists) {
          allUPCs.push({
            UPC_Number: caseUPC.trim(),
            UPC_Type: 'Case',
            Status: 1,
            Priority: 1,
            Qty: 0,
          });
        }
      }
      
      if (retailUPC.trim() !== '') {
        const retailExists = allUPCs.some(upc => upc.UPC_Number === retailUPC.trim() && upc.UPC_Type === 'Retail');
        if (!retailExists) {
          allUPCs.push({
            UPC_Number: retailUPC.trim(),
            UPC_Type: 'Retail',
            Status: 2,
            Priority: 1,
            Qty: 0,
          });
        }
      }
      
      const hasAnyUPC = allUPCs.length > 0;
      
      const submitData: any = {
        ...data,
        hasAddUpc: hasAnyUPC,
        upcData: hasAnyUPC ? allUPCs : [],
      };

      if (isEditMode && itemNumber && originalData) {
        // Only send changed fields
        const changedFields: any = {};
        
        // Fields to exclude from comparison (handled separately)
        const excludeFields = ['upcData', 'hasAddUpc', 'UPCList', 'Date_Created', 'Date_CreatedUser', 'Date_LastChange', 'Date_LastChangeUser', 'Item_Number_Verify'];
        
        Object.keys(submitData).forEach((key) => {
          // Skip excluded fields
          if (excludeFields.includes(key)) {
            return;
          }
          
          const currentValue = submitData[key];
          const originalValue = originalData[key];
          
          // Handle null/undefined comparisons
          if (currentValue === null || currentValue === undefined) {
            if (originalValue !== null && originalValue !== undefined) {
              changedFields[key] = currentValue;
            }
            return;
          }
          
          if (originalValue === null || originalValue === undefined) {
            if (currentValue !== null && currentValue !== undefined) {
              changedFields[key] = currentValue;
            }
            return;
          }
          
          // Convert both to strings for comparison if they're numbers/strings
          const currentStr = typeof currentValue === 'number' || typeof currentValue === 'string' ? String(currentValue) : currentValue;
          const originalStr = typeof originalValue === 'number' || typeof originalValue === 'string' ? String(originalValue) : originalValue;
          
          // Deep comparison for objects/arrays, string comparison for primitives
          if (typeof currentValue === 'object' || Array.isArray(currentValue)) {
            if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
              changedFields[key] = currentValue;
            }
          } else if (currentStr !== originalStr) {
            changedFields[key] = currentValue;
          }
        });
        
        // Always include UPC data if it changed
        if (hasAnyUPC) {
          // Check both upcData and UPCList from original data
          const originalUPCs = originalData.upcData || originalData.UPCList || [];
          
          // Normalize original UPCs to match our format for comparison
          const normalizedOriginalUPCs = originalUPCs.map((upc: any) => ({
            UPC_Number: upc.UPC_Number || upc,
            UPC_Type: upc.UPC_Type || (upc.Status === 1 ? 'Case' : upc.Status === 2 ? 'Retail' : 'Primary'),
            Status: upc.Status !== undefined ? upc.Status : (upc.UPC_Type === 'Primary' ? 0 : upc.UPC_Type === 'Case' ? 1 : 2),
            Priority: upc.Priority || 1,
            Qty: upc.Qty || 0,
            myKey: upc.myKey,
          }));
          
          // Compare normalized arrays
          const upcChanged = JSON.stringify(allUPCs) !== JSON.stringify(normalizedOriginalUPCs);
          if (upcChanged) {
            changedFields.hasAddUpc = hasAnyUPC;
            changedFields.upcData = allUPCs;
          }
        } else {
          // If no UPCs in form but there were UPCs originally, that's also a change
          const originalUPCs = originalData.upcData || originalData.UPCList || [];
          if (originalUPCs.length > 0) {
            changedFields.hasAddUpc = false;
            changedFields.upcData = [];
          }
        }
        
        // Check if there are any changes
        if (Object.keys(changedFields).length === 0) {
          toast('No changes detected', { icon: 'ℹ️' });
          return;
        }
        
        await updateInventory(itemNumber, changedFields);
        toast.success('Inventory updated successfully!');
        navigate(productListPath);
      } else {
        await createInventory(submitData);
        toast.success('Inventory created successfully!');
        navigate(productListPath);
      }
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save inventory';
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    reset();
    setActiveStep(0);
    setPrimaryUPC('');
    setCaseUPC('');
    setRetailUPC('');
    setUpcData([]);
    setProductImageUrl(null);
    setImageError(false);
    setImageLoading(false);
    lastLoadedUPCRef.current = '';
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate required fields for Step 1
      const isValid = await trigger(['Description', 'Sales_Category', 'Pack', 'UOM', 'Price1']);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const steps = [
    {
      label: 'Step 1',
      // icon: <InventoryIcon />,
    },
    {
      label: 'Step 2',
      // icon: <SettingsIcon />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography variant="h6">Loading inventory data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1, md: 1.5 },
      minHeight: '100vh',
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 2, maxWidth: '1400px', mx: 'auto' }}>

        {/* UPC Button */}
        <Fade in={true} timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {activeStep > 0 && (
            <CustomButton
              type="button"
              buttonType="cancel"
              appearance="outlined"
              onClick={handleBack}
              sx={{ minWidth: 120 }}
              fullWidth={false}
            >
              Back
            </CustomButton>
          )}
          {activeStep === 0 && <Box />}
            <CustomButton
              type="button"
              buttonType="primary"
              appearance="filled"
              fullWidth={false}
              onClick={handleOpenUPCPopup}
              disabled={isEditMode}
              icon={<AddIcon />}
              iconPosition="left"
              sx={{
                minWidth: 140,
                // boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  // boxShadow: '0 6px 20px 0 rgba(25, 118, 210, 0.5)',
                }
              }}
            >
              {upcData.length > 0 || primaryUPC.trim() || caseUPC.trim() || retailUPC.trim() ? 'Update UPC' : 'Add UPC'}
            </CustomButton>
          </Box>
        </Fade>

        {/* Stepper */}
        <Grow in={true} timeout={800}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 3,
              mb: 2,
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconComponent={(props) => {
                      // Custom Step Icon with white inner (1/2) color
                      const { active, completed, className } = props;
                      // render a circle with white color for steps 1 and 2, else default
                      const isFirstOrSecond = index === 0 || index === 1;
                      return (
                        <Box
                          className={className}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: active || completed ? 'primary.main' : 'grey.400',
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${active || completed ? 'primary.main' : 'grey.400'}`,
                            boxShadow: active ? "0 0 0 4px rgba(25,118,210,0.12)" : undefined,
                            transition: "all 0.3s ease",
                          }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: isFirstOrSecond ? "#fff" : (active || completed ? "primary.main" : "grey.400"),
                              transition: "all 0.3s ease"
                            }}
                          />
                        </Box>
                      );
                    }}
                    StepIconProps={{
                      sx: {
                        '&.Mui-completed': {
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                          transition: 'all 0.3s ease',
                        },
                        '&.Mui-active': {
                          color: 'primary.main',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' },
                          },
                        },
                      },
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      }
                    }}>
                      <Typography variant="body2" sx={{
                        fontWeight: activeStep === index ? 500 : 400,
                        fontSize: '0.875rem',
                        color: activeStep === index ? 'primary.main' : 'text.secondary',
                        transition: 'all 0.3s ease',
                      }}>
                        {step.label}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grow>

      </Box>

      {/* Initial UPC Popup */}
      <Dialog
        open={showInitialPopup}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            padding: 0,
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 500,
          fontSize: '1.1rem',
          pt: 2,
        }}>
          Add With UPC
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            Confirm if you would like to add UPC details for this item.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1.5, gap: 1.5 }}>
          <CustomButton
            type="button"
            buttonType="cancel"
            appearance="outlined"
            fullWidth={false}
            onClick={() => handleInitialPopupResponse(false)}
            sx={{ minWidth: 100 }}
          >
            No
          </CustomButton>
          <CustomButton
            type="button"
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
            onClick={() => handleInitialPopupResponse(true)}
            sx={{ minWidth: 100 }}
          >
            Yes
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* UPC Form Popup */}
      <Dialog
        open={showUPCPopup}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            padding: 0,
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 500,
          fontSize: '1.1rem',
          pt: 2,
        }}>
          Add UPC Information
        </DialogTitle>
        <DialogContent sx={{ p: 2, mt: 2 }}>
          <Grid container spacing={2}>
            {/* Left Half - UPC Fields */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Primary UPC with Done Icon */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextInput
                        label="Primary UPC Number"
                        value={primaryUPC}
                        onChange={(e) => {
                          setPrimaryUPC(e.target.value);
                          setProductImageUrl(null);
                          setImageError(false);
                          // Clear validation error when user types
                          if (upcValidationErrors.primary) {
                            setUpcValidationErrors(prev => ({ ...prev, primary: undefined }));
                          }
                        }}
                        placeholder="Enter Primary UPC Number"
                        error={!!upcValidationErrors.primary}
                        helperText={upcValidationErrors.primary}
                        disabled={isEditMode}
                      />
                    </Box>
                    <CustomButton
                      type="button"
                      buttonType="primary"
                      appearance="filled"
                      onClick={handleValidatePrimaryUPC}
                      disabled={isEditMode || !primaryUPC.trim() || upcValidating}
                      fullWidth={false}
                      sx={{ 
                        mt: 3.5,
                        // minWidth: 80,
                        // height: 40,
                      }}
                    >
                      Done
                    </CustomButton>
                    {/* <IconButton
                      onClick={handleLoadProductImage}
                      disabled={!primaryUPC.trim() || imageLoading}
                      color="primary"
                      sx={{
                        mt: 2.5,
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        },
                        '&.Mui-disabled': {
                          opacity: 0.5
                        }
                      }}
                      title="Load Product Image"
                    >
                      {imageLoading ? (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      ) : (
                        <DoneIcon />
                      )}
                    </IconButton> */}
                  </Box>
                  {/* {imageError && (
                    <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1, display: 'block' }}>
                      Image not found for this UPC
                    </Typography>
                  )} */}
                </Box>

                {/* Case UPC */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextInput
                      label="Case UPC Number"
                      value={caseUPC}
                      onChange={(e) => {
                        setCaseUPC(e.target.value);
                        // Clear validation error when user types
                        if (upcValidationErrors.case) {
                          setUpcValidationErrors(prev => ({ ...prev, case: undefined }));
                        }
                      }}
                      placeholder="Enter Case UPC Number"
                      error={!!upcValidationErrors.case}
                      helperText={upcValidationErrors.case}
                      disabled={isEditMode}
                    />
                  </Box>
                  <CustomButton
                    type="button"
                    buttonType="primary"
                    appearance="filled"
                    onClick={handleValidateCaseUPC}
                    disabled={isEditMode || !caseUPC.trim() || upcValidating}
                    fullWidth={false}
                    sx={{ 
                      mt: 3.5,
                      // minWidth: 80,
                      // height: 40,
                    }}
                  >
                    Done
                  </CustomButton>
                </Box>

                {/* Retail UPC */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextInput
                      label="Retail UPC Number"
                      value={retailUPC}
                      onChange={(e) => {
                        setRetailUPC(e.target.value);
                        // Clear validation error when user types
                        if (upcValidationErrors.retail) {
                          setUpcValidationErrors(prev => ({ ...prev, retail: undefined }));
                        }
                      }}
                      placeholder="Enter Retail UPC Number"
                      error={!!upcValidationErrors.retail}
                      helperText={upcValidationErrors.retail}
                      disabled={isEditMode}
                    />
                  </Box>
                  <CustomButton
                    type="button"
                    buttonType="primary"
                    appearance="filled"
                    onClick={handleValidateRetailUPC}
                    disabled={isEditMode || !retailUPC.trim() || upcValidating}
                    fullWidth={false}
                    sx={{ 
                      mt: 3.5,
                      // minWidth: 80,
                      // height: 40,
                    }}
                  >
                    Done
                  </CustomButton>
                </Box>
              </Box>
            </Grid>

            {/* Right Half - Product Image */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, fontSize: '0.9375rem', color: 'primary.main' }}>
                  Product Image
                </Typography> */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: 'grey.50',
                    minHeight: { xs: 200, md: 300 },
                    height: '100%',
                  }}
                >
                  {imageLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          border: '3px solid',
                          borderColor: 'primary.light',
                          borderTopColor: 'primary.main',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Loading image...
                      </Typography>
                    </Box>
                  ) : (imageError || !productImageUrl) ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'grey.100',
                        borderRadius: 2,
                      }}
                    >
                      <ImageIcon
                        sx={{
                          fontSize: 80,
                          color: 'grey.400',
                        }}
                      />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          No Image Available
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Please check the UPC number
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <img
                      src={productImageUrl}
                      alt={`Product image for UPC ${primaryUPC}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: 4,
                      }}
                      onError={() => {
                        setImageError(true);
                        setProductImageUrl(null);
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Added UPC List */}
          {upcData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom sx={{ mb: 1.5, fontWeight: 500, fontSize: '0.9375rem', color: 'primary.main' }}>
                Added UPC Items
              </Typography>
              {upcData.map((upc, index) => (
                <Card
                  key={index}
                  elevation={1}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                        <strong>Type:</strong> {upc.UPC_Type} UPC |{' '}
                        <strong>Number:</strong> {upc.UPC_Number} |{' '}
                        <strong>Status:</strong> {upc.Status} |{' '}
                        <strong>Priority:</strong> {upc.Priority} |{' '}
                        <strong>Qty:</strong> {upc.Qty}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleRemoveUPC(index)}
                      color="error"
                      size="small"
                      disabled={isEditMode}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1.5, gap: 1.5 }}>
          <CustomButton
            type="button"
            buttonType="cancel"
            appearance="outlined"
            fullWidth={false}
            onClick={handleCancelUPCPopup}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            type="button"
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
            onClick={handleCloseUPCPopup}
            sx={{ minWidth: 100 }}
          >
            Close
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Form Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Fade in={true} timeout={1000}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Basic Information */}
                {activeStep === 0 && (
                  <Box>
                    {/* Basic Information Section Header with Image and UPC */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      gap: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      {/* Left Side - Product Image and UPC */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {/* Product Image */}
                        {primaryUPC.trim() && (
                          <Box
                            sx={{
                              width: { xs: 60, sm: 80 },
                              height: { xs: 60, sm: 80 },
                              minWidth: { xs: 60, sm: 80 },
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: 'divider',
                              backgroundColor: 'grey.50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {imageLoading ? (
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  border: '2px solid',
                                  borderColor: 'primary.light',
                                  borderTopColor: 'primary.main',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                  '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                  }
                                }}
                              />
                            ) : (imageError || !productImageUrl) ? (
                              <ImageIcon
                                sx={{
                                  fontSize: { xs: 30, sm: 40 },
                                  color: 'grey.400',
                                }}
                              />
                            ) : (
                              <img
                                src={productImageUrl}
                                alt={`Product image for UPC ${primaryUPC}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                                onError={() => {
                                  setImageError(true);
                                  setProductImageUrl(null);
                                }}
                              />
                            )}
                          </Box>
                        )}
                        
                        {/* Title and UPC Info */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                            Basic Information
                          </Typography>
                          {primaryUPC.trim() && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              <strong>UPC:</strong> {primaryUPC}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Right Side - Checkboxes */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                        <CheckboxInput
                          singleLabel="Allow for Web/App"
                          checked={watch('ShortOrderForm')}
                          onChange={(value, checked) => setValue('ShortOrderForm', checked)}
                        />

                        <CheckboxInput
                          singleLabel="Discontinued"
                          checked={watch('I_Discontinued')}
                          onChange={(value, checked) => setValue('I_Discontinued', checked)}
                        />
                        <CheckboxInput
                          singleLabel="Inactive"
                          checked={watch('I_Inactive')}
                          onChange={(value, checked) => setValue('I_Inactive', checked)}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                     

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Description')}
                          label="Description *"
                          error={!!errors.Description}
                          placeholder="Enter Description"
                          multiline
                          rows={2}
                          inputProps={{ maxLength: 50 }}
                          helperText={errors.Description?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Sales_Category"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Sales Category *"
                              options={transformToOptions(apiData?.salesCategory, 'Sales_Category', 'Category_Desc')}
                              error={!!errors.Sales_Category}
                              helperText={errors.Sales_Category?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Price_Class"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Price Class"
                              options={transformToOptions(apiData?.priceClass, 'Price_Class', 'Class_Desc')}
                              error={!!errors.Price_Class}
                              helperText={errors.Price_Class?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Price_Subclass"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Price Subclass"
                              options={transformToOptions(apiData?.priceSubclass, 'Price_Subclass', 'Subclass_Def')}
                              error={!!errors.Price_Subclass}
                              helperText={errors.Price_Subclass?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="OTP_Number"
                          control={control}
                          render={({ field }) => {
                            // Check if current Sales Category is Cigarette
                            const isCigarette = apiData?.salesCategory?.some(
                              (cat: any) => cat.Sales_Category?.toString() === salesCategory?.toString() &&
                                cat.Category_Desc?.toLowerCase().includes('cigarette')
                            );
                            
                            const { value: fieldValue, ...fieldRest } = field;
                            return (
                              <SearchableSelectInput
                                {...fieldRest}
                                value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : fieldValue}
                                label="OTP Number"
                                options={transformToOptions(apiData?.otherTaxes, 'OTP_Number', 'OTP_Description')}
                                error={!!errors.OTP_Number}
                                helperText={errors.OTP_Number?.message}
                                disabled={isCigarette}
                              />
                            );
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Pack')}
                          label="Pack *"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Pack}
                          helperText={errors.Pack?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('UOM')}
                          label="Size *"
                          error={!!errors.UOM}
                          helperText={errors.UOM?.message}
                          placeholder="Enter UOM"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('UnitOunces')}
                          label="Unit Ounces"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.UnitOunces}
                          helperText={errors.UnitOunces?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Section')}
                          label="Section"
                          error={!!errors.Section}
                          helperText={errors.Section?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Location')}
                          label="Location"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Location}
                          helperText={errors.Location?.message}
                          placeholder="Enter Location"
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextInput
                  {...register('Section2')}
                  label="Section 2"
                  error={!!errors.Section2}
                  helperText={errors.Section2?.message}
                />
              </Grid> */}
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextInput
                  {...register('Location2')}
                  label="Location 2"
                  type="number"
                  inputProps={{ step: 'any' }}
                  error={!!errors.Location2}
                  helperText={errors.Location2?.message}
                  placeholder="Enter Location 2"
                />
              </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="PickArea"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Pick Area"
                              options={transformToOptionsWithConcat(apiData?.pickRightArea, 'PickArea', 'PickArea', 'PickArea_Description')}
                              error={!!errors.PickArea}
                              helperText={errors.PickArea?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Project_Identifier"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Project Identifier"
                              options={transformToOptionsWithConcat(apiData?.projectIdentifier, 'Project_Identifier', 'Project_Identifier', 'Description')}
                              error={!!errors.Project_Identifier}
                              helperText={errors.Project_Identifier?.message}
                            />
                          )}
                        />
                      </Grid>
                       {/* UPC Fields */}
                       <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <TextInput
                              label="Primary UPC Number"
                              value={primaryUPC}
                              onChange={(e) => {
                                setPrimaryUPC(e.target.value);
                                setProductImageUrl(null);
                                setImageError(false);
                                // Clear validation error when user types
                                if (upcValidationErrors.primary) {
                                  setUpcValidationErrors(prev => ({ ...prev, primary: undefined }));
                                }
                              }}
                              placeholder="Enter Primary UPC Number"
                              error={!!upcValidationErrors.primary}
                              helperText={upcValidationErrors.primary}
                              disabled={isEditMode}
                            />
                          </Box>
                          <CustomButton
                            type="button"
                            buttonType="primary"
                            appearance="filled"
                            onClick={handleValidatePrimaryUPC}
                            disabled={isEditMode || !primaryUPC.trim() || upcValidating}
                            fullWidth={false}
                            sx={{ 
                              mt: 3.5,
                              // minWidth: 80,
                              // height: 40,
                            }}
                          >
                            Done
                          </CustomButton>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <TextInput
                              label="Case UPC Number"
                              value={caseUPC}
                              onChange={(e) => {
                                setCaseUPC(e.target.value);
                                // Clear validation error when user types
                                if (upcValidationErrors.case) {
                                  setUpcValidationErrors(prev => ({ ...prev, case: undefined }));
                                }
                              }}
                              placeholder="Enter Case UPC Number"
                              error={!!upcValidationErrors.case}
                              helperText={upcValidationErrors.case}
                              disabled={isEditMode}
                            />
                          </Box>
                          <CustomButton
                            type="button"
                            buttonType="primary"
                            appearance="filled"
                            onClick={handleValidateCaseUPC}
                            disabled={isEditMode || !caseUPC.trim() || upcValidating}
                            fullWidth={false}
                            sx={{ 
                              mt: 3.5,
                              // minWidth: 80,
                              // height: 40,
                            }}
                          >
                            Done
                          </CustomButton>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <TextInput
                              label="Retail UPC Number"
                              value={retailUPC}
                              onChange={(e) => {
                                setRetailUPC(e.target.value);
                                // Clear validation error when user types
                                if (upcValidationErrors.retail) {
                                  setUpcValidationErrors(prev => ({ ...prev, retail: undefined }));
                                }
                              }}
                              placeholder="Enter Retail UPC Number"
                              error={!!upcValidationErrors.retail}
                              helperText={upcValidationErrors.retail}
                              disabled={isEditMode}
                            />
                          </Box>
                          <CustomButton
                            type="button"
                            buttonType="primary"
                            appearance="filled"
                            onClick={handleValidateRetailUPC}
                            disabled={isEditMode || !retailUPC.trim() || upcValidating}
                            fullWidth={false}
                            sx={{ 
                              mt: 3.5,
                              // minWidth: 80,
                              // height: 40,
                            }}
                          >
                            Done
                          </CustomButton>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Pricing Information Section */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                          Pricing Information
                        </Typography>
                      </Box>
                      <CheckboxInput
                        singleLabel="Price Book Include"
                        checked={watch('PriceBook_Include')}
                        onChange={(value, checked) => setValue('PriceBook_Include', checked)}
                      />
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price1')}
                          label="Price 1 *"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price1}
                          helperText={errors.Price1?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price2')}
                          label="Price 2"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price2}
                          helperText={errors.Price2?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price3')}
                          label="Price 3"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price3}
                          helperText={errors.Price3?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price4')}
                          label="Price 4"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price4}
                          helperText={errors.Price4?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price5')}
                          label="Price 5"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price5}
                          helperText={errors.Price5?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Price6')}
                          label="Price 6"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Price6}
                          helperText={errors.Price6?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('BaseCost')}
                          label="Base Cost"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.BaseCost}
                          helperText={errors.BaseCost?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('NetCost')}
                          label="Net Cost"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.NetCost}
                          helperText={errors.NetCost?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Invoice_Cost')}
                          label="MFG Cost"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Invoice_Cost}
                          helperText={errors.Invoice_Cost?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Unit_Upcharge')}
                          label="Unit Upcharge"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Unit_Upcharge}
                          helperText={errors.Unit_Upcharge?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Unit_Price')}
                          label="Unit Price"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Unit_Price}
                          helperText={errors.Unit_Price?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('DepositAmount')}
                          label="Deposit Amount"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.DepositAmount}
                          helperText={errors.DepositAmount?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('I_WeightRate')}
                          label="Item Freight Rate"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.I_WeightRate}
                          helperText={errors.I_WeightRate?.message}
                        />
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />

                    {/* Retail Percentage Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Retail Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Retail1')}
                          label="Retail 1"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Retail1}
                          helperText={errors.Retail1?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Retail2')}
                          label="Retail 2"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Retail2}
                          helperText={errors.Retail2?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Retail3')}
                          label="Retail 3"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Retail3}
                          helperText={errors.Retail3?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('RetailPct1')}
                          label="Retail Percentage 1"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.RetailPct1}
                          helperText={errors.RetailPct1?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('RetailPct2')}
                          label="Retail Percentage 2"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.RetailPct2}
                          helperText={errors.RetailPct2?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('RetailPct3')}
                          label="Retail Percentage 3"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.RetailPct3}
                          helperText={errors.RetailPct3?.message}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Vendor Information Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Vendor Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Primary_Vendor"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Primary Vendor"
                              options={transformToOptions(apiData?.vendor, 'Primary_Vendor', 'V_Description')}
                              error={!!errors.Primary_Vendor}
                              helperText={errors.Primary_Vendor?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Vendor_ItemNumberAlpha')}
                          label="Vendor Item Number"
                          error={!!errors.Vendor_ItemNumberAlpha}
                          helperText={errors.Vendor_ItemNumberAlpha?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Manufacturer"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Manufacturer"
                              options={transformToOptions(apiData?.vendor, 'Primary_Vendor', 'V_Description')}
                              error={!!errors.Manufacturer}
                              helperText={errors.Manufacturer?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Case Information Section */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                          Case Information
                        </Typography>
                      </Box>
                      <CheckboxInput
                        singleLabel="Case Discounts"
                        checked={watch('Case_Discounts')}
                        onChange={(value, checked) => setValue('Case_Discounts', checked)}
                      />
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseCount')}
                          label="Case Count"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseCount}
                          helperText={errors.CaseCount?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseWeight')}
                          label="Case Weight"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseWeight}
                          helperText={errors.CaseWeight?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseLength')}
                          label="Case Length"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseLength}
                          helperText={errors.CaseLength?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseWidth')}
                          label="Case Width"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseWidth}
                          helperText={errors.CaseWidth?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseHeight')}
                          label="Case Height"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseHeight}
                          helperText={errors.CaseHeight?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CasesPerPallet')}
                          label="Cases Per Pallet"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CasesPerPallet}
                          helperText={errors.CasesPerPallet?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('CaseDiscount_Pct')}
                          label="Case Discount % (0.1 = 1%)"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.CaseDiscount_Pct}
                          helperText={errors.CaseDiscount_Pct?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('I_Cube')}
                          label="Item Cube"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.I_Cube}
                          helperText={errors.I_Cube?.message}
                        />
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />

                    {/* Stock Management Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Stock Management
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Reorder_Level')}
                          label="Reorder Level"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Reorder_Level}
                          helperText={errors.Reorder_Level?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Reorder_Qty')}
                          label="Reorder Quantity"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Reorder_Qty}
                          helperText={errors.Reorder_Qty?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('MaximumQTY')}
                          label="Maximum Quantity"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.MaximumQTY}
                          helperText={errors.MaximumQTY?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('MinimumStockAvailability')}
                          label="Minimum Stock Availability"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.MinimumStockAvailability}
                          helperText={errors.MinimumStockAvailability?.message}
                        />
                      </Grid>
                    </Grid>
                    {/* Navigation Buttons for Step 1 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <CustomButton
                        type="button"
                        buttonType="primary"
                        appearance="filled"
                        onClick={handleNext}
                        sx={{ minWidth: 120 }}
                        fullWidth={false}
                      >
                        Next
                      </CustomButton>
                    </Box>
                  </Box>
                )}

                {/* Step 2: Advanced Settings */}
                {activeStep === 1 && (
                  <Box>


                    {/* Cigarette Information Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Cigarette Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Cig_Pack"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Cigarette Pack"
                              options={transformToOptions(apiData?.cigPack, 'Cig_Pack', 'Cig_Pack')}
                              error={!!errors.Cig_Pack}
                              helperText={errors.Cig_Pack?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Cig_Sticks')}
                          label="Cigarette Sticks"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Cig_Sticks}
                          helperText={errors.Cig_Sticks?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Cig_PremDisc_Code"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="participate/Non-participate"
                              options={[
                                { label: 'P', value: 'P' },
                                { label: 'N', value: 'N' },
                                { label: 'D', value: 'D' },
                              ]}
                              error={!!errors.Cig_PremDisc_Code}
                              helperText={errors.Cig_PremDisc_Code?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Additional Numeric Fields Section */}
                    {/* <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Additional Numeric Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                    


                    </Grid>

                    <Divider sx={{ my: 2 }} /> */}

                    {/* Tax and Jurisdiction Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Sales and Special Tax Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="I_SalesTaxSelect"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Sales Tax Select"
                              options={[
                                { label: 'S', value: 'S' },
                                { label: 'A', value: 'A' },
                                { label: 'N', value: 'N' },
                              ]}
                              error={!!errors.I_SalesTaxSelect}
                              helperText={errors.I_SalesTaxSelect?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('SpecialTaxUnits')}
                          label="Special Tax Units"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.SpecialTaxUnits}
                          helperText={errors.SpecialTaxUnits?.message}
                        />
                      </Grid>
                    </Grid>





                    <Divider sx={{ my: 2 }} />

                    {/* Code and ID Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Codes and Identifiers
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="MSA_Category_Code"
                          control={control}
                          render={({ field }) => {
                            // Create options from API data
                            const apiOptions = apiData?.msaCategory?.map((item: any) => ({
                              value: item.MSA_Category_Code || '------',
                              label: `${item.MSA_Category_Code || ''} - ${item.MSA_Description || ''}`
                            })) || [];
                            
                            // Check if default value exists in options, if not add it
                            const hasDefault = apiOptions.some((opt: any) => opt.value === '------');
                            const options = hasDefault 
                              ? apiOptions 
                              : [{ value: '------', label: '------' }, ...apiOptions];
                            
                            return (
                              <SearchableSelectInput
                                {...field}
                                label="MSA Category Code"
                                options={options}
                                error={!!errors.MSA_Category_Code}
                                helperText={errors.MSA_Category_Code?.message}
                              />
                            );
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="NACS"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="NACS"
                              options={transformToOptions(apiData?.nacsCategory, 'NACS_Category_Code', 'NACS_Description')}
                              error={!!errors.NACS}
                              helperText={errors.NACS?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="NACS_Unit"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="NACS Unit"
                              options={[
                                { label: 'C', value: 'C' },
                                { label: 'B', value: 'B' },
                                { label: 'E', value: 'E' },
                              ]}
                              error={!!errors.NACS_Unit}
                              helperText={errors.NACS_Unit?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Brand_ID"
                          control={control}
                          render={({ field }) => {
                            // Create options from API data
                            const apiOptions = transformToOptions(apiData?.inventoryBrand, 'Brand_ID', 'Brand_Family');
                            
                            // Check if default value exists in options, if not add it
                            const hasDefault = apiOptions.some((opt: any) => opt.value === '0');
                            const options = hasDefault 
                              ? apiOptions 
                              : [{ value: '0', label: '0' }, ...apiOptions];
                            
                            return (
                              <SearchableSelectInput
                                {...field}
                                label="Brand ID"
                                options={options}
                                error={!!errors.Brand_ID}
                                helperText={errors.Brand_ID?.message}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="ExclusionGroup_ID"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              label="Exclusion Group ID"
                              options={transformToOptions(apiData?.exclusionGroup, 'ExclusionGroup_ID', 'ExclusionGroup_Description')}
                              error={!!errors.ExclusionGroup_ID}
                              helperText={errors.ExclusionGroup_ID?.message}
                            />
                          )}
                        />
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Item_GroupID"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Item Group ID"
                              options={transformToOptionsWithConcat(apiData?.inventoryItemGroup, 'Item_GroupID', 'Item_GroupID', 'Item_GroupDescription')}
                              error={!!errors.Item_GroupID}
                              helperText={errors.Item_GroupID?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Points"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              name={field.name}
                              value={field.value || ''}
                              label="Points"
                              type="number"
                              inputProps={{ 
                                step: 'any', 
                                min: 0,
                                max: 99999,
                                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                                  const target = e.target as HTMLInputElement;
                                  const value = target.value;
                                  // Prevent typing if already 5 digits (unless deleting or navigating)
                                  if (value.length >= 5 && 
                                      e.key !== 'Backspace' && 
                                      e.key !== 'Delete' && 
                                      e.key !== 'ArrowLeft' && 
                                      e.key !== 'ArrowRight' &&
                                      e.key !== 'Tab' &&
                                      e.key !== 'Home' &&
                                      e.key !== 'End' &&
                                      !e.ctrlKey && 
                                      !e.metaKey) {
                                    e.preventDefault();
                                  }
                                }
                              }}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Remove any non-digit characters and limit to 5 digits
                                const digitsOnly = value.replace(/\D/g, '');
                                if (digitsOnly.length > 5) {
                                  const limitedValue = digitsOnly.slice(0, 5);
                                  field.onChange(parseInt(limitedValue) || 0);
                                } else {
                                  field.onChange(digitsOnly === '' ? 0 : parseInt(digitsOnly) || 0);
                                }
                              }}
                              onBlur={field.onBlur}
                              error={!!errors.Points}
                              helperText={errors.Points?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Status and Date Section */}
                    {/* <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Status and Date Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      
                    </Grid>

                    <Divider sx={{ my: 2 }} /> */}

                    {/* Promotion Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Promotion Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Cig_Promo_Code"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="MSA Promotion"
                              options={[
                                { label: 'No Promotion', value: '0' },
                                { label: 'Promotional Item', value: '2' },
                                { label: 'Multipack Shipper (Components Required)', value: '3' },
                                { label: 'Shipper', value: '4' },
                              ]}
                              error={!!errors.Cig_Promo_Code}
                              helperText={errors.Cig_Promo_Code?.message}
                            />
                          )}
                        />
                      </Grid>
                      {watch('Cig_Promo_Code') !== '0' && (
                        <>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextInput
                              {...register('MSA_Promotion')}
                              label="MSA Promo Description"
                              error={!!errors.MSA_Promotion}
                              helperText={errors.MSA_Promotion?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextInput
                              {...register('MSA_Promotion_Code')}
                              label="MSA Promotion Code"
                              error={!!errors.MSA_Promotion_Code}
                              helperText={errors.MSA_Promotion_Code?.message}
                            />
                          </Grid>
                          
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <CheckboxInput
                              singleLabel="MSA Component"
                              checked={watch('MSA_Component')}
                              onChange={(value, checked) => setValue('MSA_Component', checked)}
                            />
                          </Grid>

                        </>
                      )}
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Additional Fields Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Additional Information
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('AltDesc')}
                          label="Alternative Description"
                          inputProps={{ maxLength: 50 }}
                          error={!!errors.AltDesc}
                          helperText={errors.AltDesc?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Item_Message')}
                          label="Item Message"
                          multiline
                          rows={2}
                          inputProps={{ maxLength: 50 }}
                          error={!!errors.Item_Message}
                          helperText={errors.Item_Message?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextInput
                              {...register('MSA_Description')}
                              label="MSA Description (Optional)"
                              error={!!errors.MSA_Description}
                              helperText={errors.MSA_Description?.message}
                            />
                          </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextInput
                  {...register('ALT_Description2')}
                  label="ALT Description 2"
                  error={!!errors.ALT_Description2}
                  helperText={errors.ALT_Description2?.message}
                />
              </Grid> */}
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="StandardUnitDescription"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              label="Standard Unit Description"
                              options={[
                                { label: 'ECH', value: 'ECH' },
                                { label: 'PAK', value: 'PAK' },
                                { label: 'STK', value: 'STK' },
                                { label: 'BOX', value: 'BOX' },
                                { label: 'BAG', value: 'BAG' },
                                { label: 'TIN', value: 'TIN' },
                                { label: 'FOI', value: 'FOI' },
                                { label: 'CAN', value: 'CAN' },
                                { label: 'BUL', value: 'BUL' },
                                { label: 'TUB', value: 'TUB' },
                                { label: 'PCH', value: 'PCH' },
                                { label: 'BUN', value: 'BUN' },
                                { label: 'PLG', value: 'PLG' },
                                { label: 'CUT', value: 'CUT' },
                                { label: 'BOT', value: 'BOT' },
                                { label: 'JAR', value: 'JAR' },
                                { label: 'OTH', value: 'OTH' },
                              ]}
                              error={!!errors.StandardUnitDescription}
                              helperText={errors.StandardUnitDescription?.message}
                            />
                          )}
                        />
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Sequence')}
                          label="Sequence"
                          type="number"
                          inputProps={{ step: 'any' }}
                          error={!!errors.Sequence}
                          helperText={errors.Sequence?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="I_ReturnStatus"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelectInput
                              {...field}
                              label="Return Status"
                              options={[
                                { label: 'S', value: 'S' },
                                { label: 'A', value: 'A' },
                                { label: 'N', value: 'N' },
                              ]}
                              error={!!errors.I_ReturnStatus}
                              helperText={errors.I_ReturnStatus?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    {/* Product Settings Section */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          fontSize: '1rem'
                        }}>
                          Product Settings
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>

                    
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CheckboxInput
                  singleLabel="Heading Flag"
                  checked={watch('HeadingFlag')}
                  onChange={(value, checked) => setValue('HeadingFlag', checked)}
                />
              </Grid> */}

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="Breakable"
                          checked={watch('Breakable')}
                          onChange={(value, checked) => setValue('Breakable', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="Never Discount"
                          checked={watch('I_NeverDiscount')}
                          onChange={(value, checked) => setValue('I_NeverDiscount', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="Prepaid Status"
                          checked={watch('I_PrepaidStatus')}
                          onChange={(value, checked) => setValue('I_PrepaidStatus', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="EBT"
                          checked={watch('EBT')}
                          onChange={(value, checked) => setValue('EBT', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="Frozen"
                          checked={watch('FrozenFlag')}
                          onChange={(value, checked) => setValue('FrozenFlag', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="Cooler"
                          checked={watch('CoolerFlag')}
                          onChange={(value, checked) => setValue('CoolerFlag', checked)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <CheckboxInput
                          singleLabel="HazMat"
                          checked={watch('HazMatFlag')}
                          onChange={(value, checked) => setValue('HazMatFlag', checked)}
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CheckboxInput
                  singleLabel="Track Expiration Date"
                  checked={watch('Track_ExpirationDate')}
                  onChange={(value, checked) => setValue('Track_ExpirationDate', checked)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CheckboxInput
                  singleLabel="Track Lot Ref"
                  checked={watch('Track_LotRef')}
                  onChange={(value, checked) => setValue('Track_LotRef', checked)}
                />
              </Grid> */}
                    </Grid>

                    {/* Navigation Buttons for Step 2 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <CustomButton
                        type="button"
                        buttonType="cancel"
                        appearance="outlined"
                        onClick={handleBack}
                        sx={{ minWidth: 120 }}
                        fullWidth={false}
                      >
                        Back
                      </CustomButton>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <CustomButton
                          type="button"
                          buttonType="cancel"
                          appearance="outlined"
                          onClick={handleReset}
                          sx={{ minWidth: 120 }}
                          fullWidth={false}
                        >
                          Reset
                        </CustomButton>
                        <CustomButton
                          type="submit"
                          buttonType="primary"
                          appearance="filled"
                          sx={{ minWidth: 120 }}
                          fullWidth={false}
                          onClick={async (e) => {
                            e.preventDefault();
                            
                            // Use handleSubmit which properly validates and calls onSubmit
                            // handleSubmit will only call onSubmit if validation passes
                            handleSubmit(
                              (data) => {
                                onSubmit(data);
                              },
                              (errors) => {
                                // Find the first error field
                                const firstError = Object.keys(errors)[0];
                                const firstErrorMsg = errors[firstError as keyof typeof errors]?.message;
                                toast.error(firstErrorMsg || 'Please fix all validation errors before submitting');
                              }
                            )();
                          }}
                        >
                          {isEditMode ? 'Update' : 'Submit'}
                        </CustomButton>
                      </Box>
                    </Box>
                  </Box>
                )}
              </form>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </Box>
  );
};

export default Inventory;
