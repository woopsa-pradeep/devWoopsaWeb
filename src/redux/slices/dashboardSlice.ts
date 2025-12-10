import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getNewItem, getDiscountedItems, getPopularItems } from '../apis/dashboardApis';
import img1 from '../../assets/Default-Product-Image.jpg';

// Interface for API product response
interface ApiProduct {
  Pack: number;
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  price: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  UPCList: Array<{ UPC_Number: string }>;
  SalesCategory: string;
  PriceClass: string;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  Tax_Rate: number;
  priceWithTax: number;
  totalPriceWithTax: number;
  totalPrice: number;
  UnitOunces: any;
  showLowStock: boolean;
  showTheInventoryStock: boolean;
  showWithOutPrice: boolean;
  allowToOrder: boolean;
  Inventory_OnHand: number;
  // Product limit fields
  hasProductLimit: boolean;
  productLimit: number | null;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  // Additional fields for consistency with Order component
  isDiscounted?: boolean;
  isNewItem?: boolean;
  // Prepaid tax rate
  prepaidTaxRate?: number;
}

// Interface for dashboard product
interface DashboardProduct {
  id: string;
  image: string;
  name: string;
  itemNumber: string;
  pack: string;
  case: string;
  size: string;
  UnitOunces: any;
  stock: 'in stock' | 'low stock';
  price: number;
  crvPrice: number;
  quantity: number;
  upc: string;
  category: string;
  subCategory: string;
  Tax_Rate: number;
  priceWithTax: number;
  totalPriceWithTax: number;
  totalPrice: number;
  showLowStock: boolean;
  showTheInventoryStock: boolean;
  showWithOutPrice: boolean;
  allowToOrder: boolean;
  Inventory_OnHand: number;
  // Product limit fields
  hasProductLimit: boolean;
  productLimit: number | null;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  // Additional fields for consistency with Order component
  isDiscounted?: boolean;
  isNewItem?: boolean;
  // Prepaid tax rate
  prepaidTaxRate?: number;
  productDetails?: {
    brand: string;
    category: string;
    sku: string;
    weight: string;
    dimensions: string;
    description: string;
  };
}

// Function to get the appropriate image URL based on showDistributorImage flag
// Priority: distributorImage (if showDistributorImage is true) > masterImage > dummy image
const getProductImage = (apiProduct: ApiProduct): string => {
  if (apiProduct.showDistributorImage && apiProduct.distributorImage) {
    return apiProduct.distributorImage;
  } else if (apiProduct.masterImage) {
    return apiProduct.masterImage;
  } else {
    // Fallback to dummy image - using the same fallback as Order component
    return img1;
  }
};

// Function to transform API response to DashboardProduct interface
// Maps the API structure to match the Order component's Product interface
const transformApiProduct = (apiProduct: ApiProduct): DashboardProduct => {
  // Safely handle missing or undefined fields
  const itemNumber = apiProduct.Item_Number || (apiProduct as any).id || 0;
  const description = apiProduct.Description || (apiProduct as any).name || '';
  const pack = apiProduct.Pack || apiProduct.CaseCount || "";
  const caseCount = apiProduct.CaseCount || apiProduct.Pack || "";
  const uom = apiProduct.UOM || '';
  const unitOunces = apiProduct.UnitOunces || 0;
  const price = apiProduct.price || apiProduct.Price1 || 0;
  const price1 = apiProduct.Price1 || apiProduct.price || 0;
  const taxRate = apiProduct.Tax_Rate || 0;
  const priceWithTax = apiProduct.priceWithTax || price;
  const salesCategory = apiProduct.SalesCategory || '';
  const priceClass = apiProduct.PriceClass || '';
  const upcList = apiProduct.UPCList || [];
  const showTheInventoryStock = apiProduct.showTheInventoryStock || false;
  const inventoryOnHand = apiProduct.Inventory_OnHand || 0;
  const showWithOutPrice = apiProduct.showWithOutPrice || false;
  const allowToOrder = apiProduct.allowToOrder !== false; // Default to true if not specified
  const showLowStock = apiProduct.showLowStock || false;
  const hasProductLimit = apiProduct.hasProductLimit || false;
  const productLimit = apiProduct.productLimit || null;
  const hasQtyDiscount = apiProduct.hasQtyDiscount || false;
  const qtyDiscount = apiProduct.qtyDiscount || null;
  const isDiscounted = apiProduct.isDiscounted || false;
  const isNewItem = apiProduct.isNewItem || false;
  const prepaidTaxRate = apiProduct.prepaidTaxRate || 0;
  
  // Determine stock status based on API flags
  let stock: 'in stock' | 'low stock' = 'in stock';
  if (showTheInventoryStock) {
    stock = 'in stock'; // Default for display purposes
  } else {
    stock = showLowStock ? 'low stock' : 'in stock';
  }

  return {
    id: itemNumber.toString(),
    image: getProductImage(apiProduct),
    name: description,
    itemNumber: itemNumber.toString(),
    pack: pack.toString(),
    case: caseCount.toString(),
    size: uom,
    UnitOunces: unitOunces,
    stock,
    price: price, // Base price (Price from API)
    crvPrice: price1, // Using Price1 as CRV price
    quantity: 0, // Default quantity
    upc: upcList[0]?.UPC_Number || '', // Use actual UPC number, not item number
    subCategory: priceClass,
    category: salesCategory,
    productDetails: {
      brand: priceClass,
      category: salesCategory,
      sku: itemNumber.toString(),
      weight: '-', // Not available in API response 
      dimensions: '-', // Not available in API response
      description: description
    },
    Tax_Rate: taxRate,
    priceWithTax: priceWithTax, // Price with tax (main price for display and calculations)
    totalPriceWithTax: apiProduct.totalPriceWithTax || 0,
    totalPrice: apiProduct.totalPrice || 0,
    showLowStock: showLowStock,
    showTheInventoryStock: showTheInventoryStock,
    showWithOutPrice: showWithOutPrice,
    allowToOrder: allowToOrder,
    Inventory_OnHand: inventoryOnHand,
    // Product limit fields
    hasProductLimit: hasProductLimit,
    productLimit: productLimit,
    // Quantity discount fields
    hasQtyDiscount: hasQtyDiscount,
    qtyDiscount: qtyDiscount,
    // Additional fields for consistency with Order component
    isDiscounted: isDiscounted,
    isNewItem: isNewItem,
    // Prepaid tax rate
    prepaidTaxRate: prepaidTaxRate
  };
};

interface DashboardState {
  newItems: DashboardProduct[];
  discountedItems: DashboardProduct[];
  popularItems: DashboardProduct[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  newItems: [],
  discountedItems: [],
  popularItems: [],
  loading: false,
  error: null,
};

// Async thunks for fetching dashboard data
export const fetchNewItems = createAsyncThunk(
  'dashboard/fetchNewItems',
  async ({ role, c_number }: { role: string; c_number: string }, { rejectWithValue }) => {
    try {
      // Validate parameters before making API call
      if (!role || !c_number || role === 'undefined' || c_number === 'undefined') {
        return rejectWithValue('Invalid parameters: role and c_number are required');
      }
      
      const response: any = await getNewItem(role, c_number);
      const apiProducts = response?.data?.finalProductList || [];
      return apiProducts.map((product: ApiProduct) => transformApiProduct(product));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch new items');
    }
  }
);

export const fetchDiscountedItems = createAsyncThunk(
  'dashboard/fetchDiscountedItems',
  async ({ role, c_number }: { role: string; c_number: string }, { rejectWithValue }) => {
    try {
      // Validate parameters before making API call
      if (!role || !c_number || role === 'undefined' || c_number === 'undefined') {
        return rejectWithValue('Invalid parameters: role and c_number are required');
      }
      
      const response: any = await getDiscountedItems(role, c_number);
      const apiProducts = response?.data?.finalProductList || [];
      return apiProducts.map((product: ApiProduct) => transformApiProduct(product));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch discounted items');
    }
  }
);

export const fetchPopularItems = createAsyncThunk(
  'dashboard/fetchPopularItems',
  async ({ role, c_number }: { role: string; c_number: string }, { rejectWithValue }) => {
    try {
      // Validate parameters before making API call
      if (!role || !c_number || role === 'undefined' || c_number === 'undefined') {
        return rejectWithValue('Invalid parameters: role and c_number are required');
      }
      
      const response: any = await getPopularItems(role, c_number);
      const apiProducts = response?.data?.finalProductList || [];
      return apiProducts.map((product: ApiProduct) => transformApiProduct(product));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch popular items');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.newItems = [];
      state.discountedItems = [];
      state.popularItems = [];
      state.error = null;
    },
    setDashboardError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // New Items
      .addCase(fetchNewItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.newItems = action.payload;
        }
      })
      .addCase(fetchNewItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch new items';
      })
      // Discounted Items
      .addCase(fetchDiscountedItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscountedItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.discountedItems = action.payload;
        }
      })
      .addCase(fetchDiscountedItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch discounted items';
      })
      // Popular Items
      .addCase(fetchPopularItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.popularItems = action.payload;
        }
      })
      .addCase(fetchPopularItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch popular items';
      });
  },
});

export const { clearDashboardData, setDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 