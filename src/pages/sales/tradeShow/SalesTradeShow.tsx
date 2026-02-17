import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Typography, Box, IconButton, Input, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CommonTable, { TableColumn } from "../../../component/atoms/Table/CommonTable";
import TextInput from "../../../component/atoms/TextInput";
import { MultiSearchableDropdown } from "../../../component/atoms/SearchableDropdown";
import ViewModeToggle from "../../../component/atoms/ViewModeToggle";
import GridCard from "../../../component/atoms/GridCard";
import DeleteConfirmationModal from "../../../component/atoms/DeleteConfirmationModal";
import ProductDetailsModal from "../../../component/molecules/ProductDetailsModal";
import img1 from "../../../assets/Default-Product-Image.jpg";
import cart from "../../../assets/icons/cart.svg";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../../redux/store";
import { setSalesTradeShowCartCount } from "../../../redux/slices/salesTradeShowCartSlice";
import {
  getSalesTradeShow,
  getSalesTradeShowItems,
  addToSalesTradeShowCart,
  updateSalesTradeShowCartItem,
  removeFromSalesTradeShowCart,
  clearSalesTradeShowCart,
  getSalesTradeShowCartItems,
  GetSalesTradeShowItemsParams,
} from "../../../redux/apis/sales/salesTradeShowApis";
import { getSalesCategoryPriceClassByCustomer, getSalesCategoryByCustomer } from "../../../redux/apis/sales/salesOrderApis";
import { useShowPrepaidTax, calculateDisplayPrice } from "../../../utils/prepaidTaxDisplayUtils";
import TradeShowOrderDetails, { TradeShowOrderItem } from "../../retailer/tradeShow/TradeShowOrderDetails";

interface ApiProduct {
  Pack: number;
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  price: number;
  Tax_Rate: number;
  priceWithTax: number;
  UPCList: Array<{ UPC_Number: string }>;
  SalesCategory: string | { Category_Desc: string };
  PriceClass: string;
  showDistributorImage?: boolean;
  distributorImage?: string | null;
  masterImage?: string;
  UnitOunces?: any;
  showWithOutPrice?: boolean;
  allowToOrder?: boolean;
  prepaidTaxRate?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

interface Product {
  id: string;
  image: string;
  name: string;
  itemNumber: string;
  pack: string;
  case: string;
  size: string;
  UnitOunces: string;
  price: number;
  quantity: number;
  upc: string;
  category: string;
  subCategory: string;
  Tax_Rate: number;
  priceWithTax: number;
  showWithOutPrice: boolean;
  allowToOrder: boolean;
  prepaidTaxRate?: number;
  minQuantity: number;
  maxQuantity: number;
}

const getProductImage = (p: ApiProduct): string => {
  if (p.showDistributorImage && p.distributorImage) return p.distributorImage;
  if (p.masterImage) return p.masterImage;
  return img1;
};

const transformApiProduct = (apiProduct: ApiProduct): Product => {
  const itemNumber = apiProduct.Item_Number ?? (apiProduct as any).id ?? 0;
  const description = apiProduct.Description ?? (apiProduct as any).name ?? "";
  const pack = apiProduct.Pack ?? apiProduct.CaseCount ?? "";
  const caseCount = apiProduct.CaseCount ?? apiProduct.Pack ?? "";
  const uom = apiProduct.UOM ?? "";
  const price = apiProduct.price ?? apiProduct.Price1 ?? 0;
  const taxRate = apiProduct.Tax_Rate ?? 0;
  const priceWithTax = apiProduct.priceWithTax ?? price;
  let salesCategory = "";
  const sc = apiProduct.SalesCategory ?? (apiProduct as any).salesCategory;
  if (typeof sc === "object" && sc !== null) salesCategory = (sc as any).Category_Desc ?? "";
  else if (typeof sc === "string") salesCategory = sc;
  const upcList = apiProduct.UPCList ?? [];
  let priceClass = "";
  const pc = apiProduct.PriceClass ?? (apiProduct as any).priceClass;
  if (typeof pc === "object" && pc !== null) priceClass = (pc as any).Class_Desc ?? "";
  else if (typeof pc === "string") priceClass = pc;
  const minQty = Number(apiProduct.minQuantity) >= 0 ? apiProduct.minQuantity! : 1;
  const maxQty = Number(apiProduct.maxQuantity) > 0 ? apiProduct.maxQuantity! : 999999;
  return {
    id: String(itemNumber),
    image: getProductImage(apiProduct),
    name: description,
    itemNumber: String(itemNumber),
    pack: String(pack),
    case: String(caseCount),
    size: uom,
    UnitOunces: String(apiProduct.UnitOunces ?? ""),
    price,
    quantity: 0,
    upc: upcList[0]?.UPC_Number,
    subCategory: priceClass,
    category: salesCategory,
    Tax_Rate: taxRate,
    priceWithTax,
    showWithOutPrice: apiProduct.showWithOutPrice ?? false,
    allowToOrder: apiProduct.allowToOrder !== false,
    prepaidTaxRate: apiProduct.prepaidTaxRate ?? 0,
    minQuantity: minQty,
    maxQuantity: maxQty,
  };
};

const ProductImage: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => (
  <img src={src} alt={alt} style={style} onError={(e) => { e.currentTarget.src = img1; }} />
);

const SalesTradeShow: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const selectedCustomer = auth?.selectedCustomer;
  const customerId = selectedCustomer?.C_Number?.toString() ?? "";
  const { showWithPerpaidTax } = useShowPrepaidTax();
  const stateFromStore = auth?.storeDetail?.C_State ?? "TN";

  const [tradeShowId, setTradeShowId] = useState<number | null>(null);
  const [data, setData] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [masterSearchTerm] = useState("");
  const [salesCategory, setSalesCategory] = useState<{ label: string; value: string }[]>([]);
  const [priceClass, setPriceClass] = useState<{ label: string; value: string }[]>([]);
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<{ label: string; value: string }[]>([]);
  const [allPriceClasses, setAllPriceClasses] = useState<any[]>([]);
  const [userSalesCategory, setUserSalesCategory] = useState<number[]>([]);
  const [loadingSalesCategory, setLoadingSalesCategory] = useState(false);
  const [loadingPriceClass, setLoadingPriceClass] = useState(false);

  const [orderItems, setOrderItems] = useState<Record<string, { quantity: number; price: number; Description: string; productId: number }>>({});
  const [cartItemsData, setCartItemsData] = useState<Record<string, Product>>({});
  const [itemInsertionOrder, setItemInsertionOrder] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [productLoadingStates, setProductLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cartLoadedRef = useRef(false);
  const quantityDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await getSalesTradeShow();
        const id = res?.data?.data?.id ?? res?.data?.id ?? res?.data?.tradeShowId;
        if (cancelled) return;
        if (id != null) setTradeShowId(Number(id));
        else setError("No active trade show found.");
      } catch {
        if (!cancelled) setError("Failed to load trade show.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!customerId) return;
    setLoadingSalesCategory(true);
    setLoadingPriceClass(true);
    getSalesCategoryPriceClassByCustomer(customerId)
      .then((response: any) => {
        const salesCategories = response?.data?.salesCategories ?? [];
        setSalesCategoryOptions(salesCategories.map((c: any) => ({ label: c.Category_Desc, value: String(c.Sales_Category) })));
        const priceClasses = response?.data?.priceClasses ?? [];
        setAllPriceClasses(priceClasses);
        setPriceClassOptions(priceClasses.map((p: any) => ({ label: p.Class_Desc, value: String(p.Price_Class) })));
      })
      .finally(() => {
        setLoadingSalesCategory(false);
        setLoadingPriceClass(false);
      });
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;
    getSalesCategoryByCustomer(customerId).then((response: any) => {
      setUserSalesCategory(response?.data ?? []);
    });
  }, [customerId]);

  useEffect(() => {
    if (salesCategory.length === 0) {
      setPriceClassOptions(allPriceClasses.map((p: any) => ({ label: p.Class_Desc, value: String(p.Price_Class) })));
      return;
    }
    const selected = salesCategory.map((c) => parseInt(c.value));
    const filtered = allPriceClasses.filter((p: any) => selected.includes(p.Sales_Category_Group));
    setPriceClassOptions(filtered.map((p: any) => ({ label: p.Class_Desc, value: String(p.Price_Class) })));
  }, [salesCategory, allPriceClasses]);

  const getItems = useCallback(async () => {
    if (tradeShowId == null || !customerId) return;
    setLoading(true);
    setError(null);
    try {
      const params: GetSalesTradeShowItemsParams = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
        masterSearch: masterSearchTerm,
        salesCategoryId: salesCategory.map((c) => c.value),
        priceClassId: priceClass.map((p) => p.value),
        salesCategory: userSalesCategory,
        state: stateFromStore,
        tradeShowId,
      };
      const response: any = await getSalesTradeShowItems(customerId, params);
      const list = response?.data?.finalProductList ?? response?.data?.data ?? response?.data ?? [];
      const transformed = (Array.isArray(list) ? list : []).map((p: ApiProduct) => transformApiProduct(p));
      setData(transformed);
      setTotalItems(response?.data?.totalCount ?? response?.totalCount ?? transformed.length);
      setTotalPages(Math.ceil((response?.data?.totalCount ?? response?.totalCount ?? 0) / pageSize) || 1);
    } catch {
      setError("Failed to load items.");
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [tradeShowId, customerId, currentPage, pageSize, debouncedSearchTerm, masterSearchTerm, salesCategory, priceClass, userSalesCategory, stateFromStore]);

  useEffect(() => {
    if (tradeShowId != null && customerId) getItems();
  }, [tradeShowId, customerId, getItems]);

  const applyTradeShowCartResponse = useCallback((items: any[]) => {
    const cartItems: Record<string, { quantity: number; price: number; Description: string; productId: number }> = {};
    const cartData: Record<string, Product> = {};
    const order: string[] = [];
    (Array.isArray(items) ? items : []).forEach((item: any) => {
      const productData: ApiProduct = {
        Pack: item.CaseCount ?? 1,
        Description: item.Description,
        Item_Number: item.Item_Number,
        CaseCount: item.CaseCount ?? 1,
        UOM: item.UOM ?? "",
        Price1: item.Price1 ?? item.price ?? 0,
        price: item.price ?? item.Price1 ?? 0,
        Tax_Rate: item.Product?.Tax_Rate ?? 0,
        priceWithTax: item.Product?.Price_With_Tax ?? item.price ?? 0,
        UPCList: [],
        SalesCategory: item.salesCategory ?? item.SalesCategory ?? "",
        PriceClass: item.PriceClass ?? "",
        UnitOunces: item.UnitOunces ?? 0,
        showWithOutPrice: item.showWithOutPrice ?? false,
        allowToOrder: item.allowToOrder !== false,
        prepaidTaxRate: item.prepaidTaxRate ?? 0,
        minQuantity: item.minQuantity ?? 1,
        maxQuantity: item.maxQuantity ?? 999999,
      };
      const product = transformApiProduct(productData);
      const id = String(item.Item_Number);
      cartItems[id] = {
        quantity: item.Product?.Qty ?? 0,
        price: Number(item.Product?.Price_With_Tax ?? item.price ?? 0),
        Description: item.Description ?? "",
        productId: item.Product?.id ?? 0,
      };
      cartData[id] = product;
      order.push(id);
    });
    setOrderItems(cartItems);
    setCartItemsData(cartData);
    setItemInsertionOrder(order);
    dispatch(setSalesTradeShowCartCount(order.length));
  }, [dispatch]);

  const loadTradeShowCart = useCallback(async () => {
    if (!customerId || tradeShowId == null || cartLoadedRef.current) return;
    try {
      const response: any = await getSalesTradeShowCartItems(customerId, tradeShowId);
      const items = response?.data?.finalCartItems ?? response?.finalCartItems ?? response?.data ?? [];
      applyTradeShowCartResponse(items);
      cartLoadedRef.current = true;
    } catch {
      cartLoadedRef.current = true;
    }
  }, [customerId, tradeShowId, applyTradeShowCartResponse]);

  const refreshTradeShowCart = useCallback(async () => {
    if (!customerId || tradeShowId == null) return;
    try {
      const response: any = await getSalesTradeShowCartItems(customerId, tradeShowId);
      const items = response?.data?.finalCartItems ?? response?.finalCartItems ?? response?.data ?? [];
      applyTradeShowCartResponse(items);
    } catch {
      // keep current state on error
    }
  }, [customerId, tradeShowId, applyTradeShowCartResponse]);

  useEffect(() => {
    if (tradeShowId != null && customerId) loadTradeShowCart();
    return () => { cartLoadedRef.current = false; };
  }, [tradeShowId, customerId, loadTradeShowCart]);

  const calculateCartPayload = (product: Product, quantity: number, finalPriceWithTax?: number) => {
    const basePrice = Number(product.price) || 0;
    const prepaidTaxRate = Number(product.prepaidTaxRate) || 0;
    const taxRate = Number(product.Tax_Rate) || 0;
    const qty = Number(quantity) || 0;
    let priceWithTax: number;
    let price: number;
    if (finalPriceWithTax !== undefined) {
      priceWithTax = Number(finalPriceWithTax) || 0;
      const basePriceWithTax = prepaidTaxRate > 0 ? priceWithTax / (1 + prepaidTaxRate) : priceWithTax;
      price = basePriceWithTax - taxRate;
    } else {
      const basePriceWithTax = basePrice + taxRate;
      priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      price = basePrice;
    }
    return {
      Price: Number(price.toFixed(2)),
      Price_With_Tax: Number(priceWithTax.toFixed(2)),
      Qty: qty,
      Tax_Rate: Number(taxRate.toFixed(2)),
      TotalPrice: Number((price * qty).toFixed(2)),
      TotalPriceWithTax: Number((priceWithTax * qty).toFixed(2)),
      prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)),
    };
  };

  const setProductLoading = (id: string, value: boolean) => {
    setProductLoadingStates((prev) => ({ ...prev, [id]: value }));
  };
  const isProductLoading = (id: string) => productLoadingStates[id] ?? false;

  const handleQuantityChange = async (id: string, change: number) => {
    if (!customerId) return;
    const item = data.find((d) => d.id === id) ?? cartItemsData[id];
    if (!item || !item.allowToOrder) return;
    if (isProductLoading(id)) return;

    const current = orderItems[id];
    let newQty = (current?.quantity ?? 0) + change;
    const minQty = item.minQuantity ?? 1;
    const maxQty = item.maxQuantity ?? 999999;
    if (newQty > 0) newQty = Math.min(maxQty, Math.max(minQty, newQty));

    if (newQty <= 0) {
      setProductLoading(id, true);
      try {
        if (current?.productId) await removeFromSalesTradeShowCart(current.productId, customerId);
        await refreshTradeShowCart();
      } finally {
        setProductLoading(id, false);
      }
      return;
    }

    setOrderItems((prev) => ({
      ...prev,
      [id]: {
        quantity: newQty,
        Description: item.name,
        price: item.priceWithTax,
        productId: current?.productId ?? 0,
      },
    }));
    if (!current || current.quantity === 0) setItemInsertionOrder((prev) => [...prev, id]);

    if (quantityDebounceRef.current[id]) clearTimeout(quantityDebounceRef.current[id]);
    quantityDebounceRef.current[id] = setTimeout(async () => {
      if (isProductLoading(id)) return;
      setProductLoading(id, true);
      try {
        const payload = calculateCartPayload(item, newQty);
        if (current?.productId) {
          await updateSalesTradeShowCartItem(current.productId, customerId, payload);
        } else {
          await addToSalesTradeShowCart(customerId, { Item_Number: parseInt(id, 10), ...payload });
        }
        await refreshTradeShowCart();
      } finally {
        setProductLoading(id, false);
      }
    }, 300);
  };

  const handleAddToCart = (id: string) => {
    const item = data.find((d) => d.id === id) ?? cartItemsData[id];
    if (!item || !item.allowToOrder || isProductLoading(id)) return;
    const minQty = item.minQuantity ?? 1;
    const current = orderItems[id]?.quantity ?? 0;
    if (current === 0) {
      handleQuantityChange(id, minQty);
    } else {
      handleQuantityChange(id, 1);
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!customerId || isProductLoading(id)) return;
    setProductLoading(id, true);
    try {
      const productId = orderItems[id]?.productId;
      if (productId) await removeFromSalesTradeShowCart(productId, customerId);
      await refreshTradeShowCart();
    } finally {
      setProductLoading(id, false);
    }
  };

  const handleClearOrder = () => setClearModalOpen(true);

  const handleConfirmClear = async () => {
    if (!customerId) return;
    try {
      await clearSalesTradeShowCart(customerId);
      setClearModalOpen(false);
      Object.values(quantityDebounceRef.current).forEach(clearTimeout);
      quantityDebounceRef.current = {};
      cartLoadedRef.current = false;
      await refreshTradeShowCart();
    } catch {
      // ignore
    }
  };

  const handleContinueOrder = () => navigate("/sales/trade-show/cart");

  const handleOrderDetailsQuantityChange = (id: string, change: number) => {
    const current = orderItems[id]?.quantity ?? 0;
    const productData = cartItemsData[id] ?? data.find((p) => p.id === id);
    const minQty = productData?.minQuantity ?? 1;
    const maxQty = productData?.maxQuantity ?? 999999;
    const newQty = current + change;
    if (newQty <= 0 || (newQty >= minQty && newQty <= maxQty)) handleQuantityChange(id, change);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const filterConfig = {
    searchTerm,
    setSearchTerm,
    salesCategory,
    setSalesCategory,
    priceClass,
    setPriceClass,
    salesCategoryOptions,
    priceClassOptions,
  };

  const sidebarItems: TradeShowOrderItem[] = itemInsertionOrder
    .filter((id) => orderItems[id])
    .map((id) => {
      const item = orderItems[id];
      const productData = cartItemsData[id] ?? data.find((p) => p.id === id);
      const basePrice = Number(productData?.price) ?? 0;
      const taxRate = Number(productData?.Tax_Rate) ?? 0;
      const prepaidTaxRate = Number(productData?.prepaidTaxRate) ?? 0;
      return {
        id,
        name: item.Description,
        quantity: item.quantity,
        price: item.price,
        priceWithTax: item.price,
        originalPrice: basePrice,
        showWithOutPrice: productData?.showWithOutPrice,
        basePrice,
        taxRate,
        prepaidTaxRate,
      };
    });

  if (!customerId) {
    return (
      <Box p={2}>
        <Typography color="text.secondary">Please select a customer to view the trade show.</Typography>
      </Box>
    );
  }

  if (error && !tradeShowId) {
    return (
      <Box p={2}>
        <Typography color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  const columns: TableColumn<any>[] = [
    { id: "itemNumber", label: "Item #", minWidth: 60, render: (row) => <Typography fontSize="14px" color="textSecondary">{row.itemNumber}</Typography> },
    {
      id: "products",
      label: "Products",
      minWidth: 300,
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }} onClick={() => handleProductClick(row)}>
          <ProductImage src={row.image} alt={row.name} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: "4px" }} />
          <Box>
            <Typography fontSize="13px" fontWeight={400} sx={{ maxWidth: "90%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {row.name}
            </Typography>
            <Typography fontSize="11px" color="textSecondary">Pack: {row.pack} | Size: {row.size} | Case: {row.case} | Unit: {row.UnitOunces}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: "priceWithTax",
      label: "Price",
      minWidth: 80,
      align: "right",
      render: (row) => (
        <Typography fontSize="14px" color="textSecondary">
          {row.showWithOutPrice ? "-" : `$${calculateDisplayPrice(Number(row.price || 0), row.Tax_Rate || 0, row.prepaidTaxRate || 0, showWithPerpaidTax)}`}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Quantity",
      minWidth: 100,
      align: "right",
      render: (row) =>
        !row.allowToOrder ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%", padding: "5px" }}>
            <Typography fontSize="12px" color="textSecondary">Out of Stock</Typography>
          </Box>
        ) : (orderItems[row.id]?.quantity ?? 0) === 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%", padding: "5px" }}>
            <Box
              component="img"
              src={cart}
              onClick={() => !isProductLoading(row.id) && handleAddToCart(row.id)}
              sx={{
                cursor: isProductLoading(row.id) ? "not-allowed" : "pointer",
                backgroundColor: isProductLoading(row.id) ? "grey.400" : "primary.main",
                borderRadius: "50%",
                transition: "transform 0.2s ease-in-out",
                opacity: isProductLoading(row.id) ? 0.6 : 1,
                "&:hover": { transform: isProductLoading(row.id) ? "none" : "scale(1.1)" },
              }}
            />
          </Box>
        ) : (
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
            <Box
              sx={{
                backgroundColor: (theme: any) => theme.palette.background.paper,
                borderRadius: 1.5,
                border: (theme: any) => `1px solid ${theme.palette.divider}`,
                padding: "2px 4px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                width: "fit-content",
                "&:hover": { borderColor: (theme: any) => theme.palette.primary.main },
              }}
            >
              <IconButton
                disabled={isProductLoading(row.id)}
                size="small"
                onClick={() => handleQuantityChange(row.id, -1)}
                sx={{ color: "primary.main", padding: "2px" }}
              >
                <RemoveIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Input
                value={orderItems[row.id]?.quantity ?? 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  const maxQty = row.maxQuantity ?? 999999;
                  if (v >= 0 && v <= maxQty) setOrderItems((prev) => ({ ...prev, [row.id]: { ...prev[row.id], quantity: v, Description: row.name, price: row.priceWithTax, productId: prev[row.id]?.productId ?? 0 } }));
                }}
                onBlur={(e) => {
                  const raw = parseInt(e.target.value) || 0;
                  const minQty = row.minQuantity ?? 1;
                  const maxQty = row.maxQuantity ?? 999999;
                  const v = raw <= 0 ? 0 : Math.min(maxQty, Math.max(minQty, raw));
                  if (v === 0) handleRemoveItem(row.id);
                  else handleQuantityChange(row.id, v - (orderItems[row.id]?.quantity ?? 0));
                }}
                disabled={isProductLoading(row.id)}
                disableUnderline
                sx={{ width: 32, mx: 0.5, "& input": { textAlign: "center", padding: "1px", fontSize: "0.8125rem" } }}
                inputProps={{ min: 0, max: row.maxQuantity ?? 999999, "data-product-id": row.id }}
              />
              <IconButton
                disabled={isProductLoading(row.id) || (orderItems[row.id]?.quantity ?? 0) >= (row.maxQuantity ?? 999999)}
                size="small"
                onClick={() => handleQuantityChange(row.id, 1)}
                sx={{ color: "primary.main", padding: "2px" }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        ),
    },
  ];

  const gridItems = data.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `Pack: ${item.pack} | Size: ${item.size}`,
    description: `Case: ${item.case} | Unit: ${item.UnitOunces} | Item: ${item.itemNumber}`,
    avatarText: item.name.charAt(0).toUpperCase(),
    avatarImage: item.image,
    upc: item.upc,
    productDetails: { category: item.category, brand: item.subCategory },
    tags: [],
    price: item.showWithOutPrice ? undefined : (calculateDisplayPrice(Number(item.price || 0), item.Tax_Rate || 0, item.prepaidTaxRate ?? 0, showWithPerpaidTax) as number),
    customActions: !item.allowToOrder ? (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "fit-content", padding: "8px", backgroundColor: "grey.300", borderRadius: "8px", cursor: "not-allowed" }}>
        <Typography sx={{ color: "grey.600", fontSize: "0.75rem", fontWeight: 600 }}>Out of Stock</Typography>
      </Box>
    ) : (orderItems[item.id]?.quantity ?? 0) === 0 ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
          padding: "8px",
          backgroundColor: isProductLoading(item.id) ? "grey.400" : "primary.main",
          borderRadius: "8px",
          cursor: isProductLoading(item.id) ? "not-allowed" : "pointer",
          transition: "all 0.2s ease-in-out",
          opacity: isProductLoading(item.id) ? 0.6 : 1,
          "&:hover": {
            backgroundColor: isProductLoading(item.id) ? "grey.400" : "primary.dark",
            transform: isProductLoading(item.id) ? "none" : "translateY(-1px)",
            boxShadow: isProductLoading(item.id) ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
          },
        }}
        onClick={() => !isProductLoading(item.id) && handleAddToCart(item.id)}
      >
        <ShoppingCartIcon sx={{ color: "white", fontSize: "20px", mr: 1 }} />
        <Typography sx={{ color: "white", fontSize: "0.75rem", fontWeight: 600 }}>
          {isProductLoading(item.id) ? "Adding..." : "Add to Cart"}
        </Typography>
      </Box>
    ) : (
      <Box
        display="flex"
        alignItems="center"
        sx={{
          backgroundColor: (theme: any) => theme.palette.background.paper,
          borderRadius: 1.5,
          border: (theme: any) => `1px solid ${theme.palette.divider}`,
          padding: "2px 4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          width: "fit-content",
          "&:hover": { borderColor: (theme: any) => theme.palette.primary.main },
        }}
      >
        <IconButton
          disabled={isProductLoading(item.id)}
          size="small"
          onClick={() => handleQuantityChange(item.id, -1)}
          sx={{ color: "primary.main", padding: "2px" }}
        >
          <RemoveIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Input
          value={orderItems[item.id]?.quantity ?? 0}
          onChange={(e) => {
            const v = parseInt(e.target.value) || 0;
            const maxQty = item.maxQuantity ?? 999999;
            if (v >= 0 && v <= maxQty) setOrderItems((prev) => ({ ...prev, [item.id]: { ...prev[item.id], quantity: v, Description: item.name, price: item.priceWithTax, productId: prev[item.id]?.productId ?? 0 } }));
          }}
          onBlur={(e) => {
            const raw = parseInt(e.target.value) || 0;
            const minQty = item.minQuantity ?? 1;
            const maxQty = item.maxQuantity ?? 999999;
            const v = raw <= 0 ? 0 : Math.min(maxQty, Math.max(minQty, raw));
            if (v === 0) handleRemoveItem(item.id);
            else handleQuantityChange(item.id, v - (orderItems[item.id]?.quantity ?? 0));
          }}
          data-product-id={item.id}
          disabled={isProductLoading(item.id)}
          disableUnderline
          sx={{ width: 32, mx: 0.5, "& input": { textAlign: "center", padding: "1px", fontSize: "0.8125rem" } }}
          inputProps={{ min: 0, max: item.maxQuantity ?? 999999 }}
        />
        <IconButton
          disabled={isProductLoading(item.id) || (orderItems[item.id]?.quantity ?? 0) >= (item.maxQuantity ?? 999999)}
          size="small"
          onClick={() => handleQuantityChange(item.id, 1)}
          sx={{ color: "primary.main", padding: "2px" }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    ),
  }));

  return (
    <Box p={{ xs: "10px", sm: "10px", md: "0px 15px" }}>
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography fontSize="18px" fontWeight={400}>Trade Show</Typography>
        {selectedCustomer && (
          <Typography fontSize="14px" color="text.secondary">
            Customer: {selectedCustomer.C_Name} (#{selectedCustomer.C_Number})
          </Typography>
        )}
      </Box>

      {error && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "error.light", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontSize="14px" color="error.contrastText">{error}</Typography>
          <IconButton size="small" onClick={() => setError(null)} sx={{ color: "error.contrastText" }}><RemoveIcon /></IconButton>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 9 }}>
          {viewMode === "table" ? (
            <CommonTable
              data={data}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              stickyLastColumn
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
              filterComponent={
                <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems="center" gap={2} mb={2} width="100%">
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, width: "90%" }}>
                    <TextInput placeholder="Search product" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                    <MultiSearchableDropdown options={salesCategoryOptions} value={salesCategory} onChange={setSalesCategory} loading={loadingSalesCategory} placeholder="Sales categories" sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                    <MultiSearchableDropdown options={priceClassOptions} value={priceClass} onChange={setPriceClass} loading={loadingPriceClass} placeholder="Sub category" sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                  </Box>
                  <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                </Box>
              }
              containerHeight="calc(100vh - 200px)"
            />
          ) : (
            <Paper sx={{ p: 2, borderRadius: "10px", boxShadow: "none" }}>
              <GridCard
                items={gridItems}
                showFilters
                filterConfig={filterConfig}
                viewMode={viewMode}
                setViewMode={setViewMode}
                showViewToggle
                loading={loading}
                showMenuIcons={false}
                filterComponent={
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems="center" gap={2} mb={2} width="100%">
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, width: "90%" }}>
                      <TextInput placeholder="Search product" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                      <MultiSearchableDropdown options={salesCategoryOptions} value={salesCategory} onChange={setSalesCategory} loading={loadingSalesCategory} placeholder="Sales categories" sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                      <MultiSearchableDropdown options={priceClassOptions} value={priceClass} onChange={setPriceClass} loading={loadingPriceClass} placeholder="Sub category" sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" } }} />
                    </Box>
                    <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                  </Box>
                }
                spacing={2}
                containerHeight="calc(100vh - 200px)"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeSelector
                showTotalItems
                showPageNumbers
                maxPageNumbers={5}
              />
            </Paper>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TradeShowOrderDetails
            items={sidebarItems}
            onQuantityChange={handleOrderDetailsQuantityChange}
            onRemoveItem={handleRemoveItem}
            onClear={handleClearOrder}
            onContinue={handleContinueOrder}
          />
        </Grid>
      </Grid>

      <ProductDetailsModal open={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
      <DeleteConfirmationModal open={clearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={handleConfirmClear} title="Clear Trade Show Cart" message="Are you sure you want to clear all items from your trade show cart?" />
    </Box>
  );
};

export default SalesTradeShow;
