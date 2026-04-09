import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Button,
  TextField,
  Stack,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import dayjs, { Dayjs } from "dayjs";
import {
  bulkAssignItemsToTradeShow,
  bulkUpdateTradeShowItems,
  bulkAssignRetailersToTradeShow,
  bulkAssignTradeShowDeliveryProducts,
  bulkAssignVendorsToTradeShow,
  createTradeShow,
  deleteBulkTradeShowDeliveryProducts,
  deleteBulkTradeShowItems,
  deleteBulkTradeShowRetailers,
  deleteBulkTradeShowVendors,
  getListOfClassOfTrade,
  getCustomerListForTradeShow,
  getInventoryAsPerTradeWeek,
  getInventoryAsPerVendorIds,
  getRemainItemInDelivery,
  getTradeShowSummary,
  getTradeShowItems,
  getTradeShowRetailers,
  getTradeShowVendors,
  getVendorsForTradeShow,
  getTradeShowById,
  getTradeShowVendorIdsForEdit,
  getTradeShowItemForEdit,
  getTradeShowRetailerForEdit,
  updateTradeShow,
  TradeShowItemPayload,
  TradeShowItemBulkUpdatePayload,
} from "../../../redux/apis/distrubutor/tradeShowApis";
import { getProductCategory } from "../../../redux/apis/landingPageApis";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useDebounce } from "../../../hooks/useDebounce";
import { store, persistor, useAppDispatch, useAppSelector } from "../../../redux/store";
import {
  clearCurrentTradeShow,
  setCurrentTradeShow,
  setSelectedVendorIds,
  setCreateDraft,
  setActiveStep as setActiveStepRedux,
  setSelectedRetailerIds as setSelectedRetailerIdsRedux,
  setAppliedItems as setAppliedItemsRedux,
  setSavedTradeShowItems as setSavedTradeShowItemsRedux,
  mergeSavedTradeShowItems as mergeSavedTradeShowItemsRedux,
  setWeekProductAssignments as setWeekProductAssignmentsRedux,
  setSummaryData as setSummaryDataRedux,
  setLastSavedVendorIds as setLastSavedVendorIdsRedux,
  setLastSavedRetailerIds as setLastSavedRetailerIdsRedux,
  setLastSavedDeliveryItemNumbers as setLastSavedDeliveryItemNumbersRedux,
  setLastSavedItemNumbers as setLastSavedItemNumbersRedux,
} from "../../../redux/slices/tradeShowSlice";

const MAX_STEP_INDEX = 5; // 0: Tradeshow Details … 5: Summary
export const TRADESHOW_DRAFT_KEY = "createTradeshow_draft";

/** API limit for bulk add/delete; batch larger arrays into chunks of this size */
const BULK_API_BATCH_SIZE = 100;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function clearTradeshowDraft(): void {
  localStorage.removeItem(TRADESHOW_DRAFT_KEY);
}

const CreateTradeshow: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const stepFromUrl = searchParams.get("step");
  const parsed = stepFromUrl != null ? Number(stepFromUrl) : NaN;
  const initialStep =
    Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_STEP_INDEX
      ? parsed
      : 0;

  const [name, setName] = useState("");
  const [tradeShowDate, setTradeShowDate] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(initialStep);
  const { id: editId } = useParams<{ id?: string }>();

  const currentTradeShow = useAppSelector(
    (state) => state.tradeShow.currentTradeShow
  );
  const storedSelectedVendors = useAppSelector(
    (state) => state.tradeShow.selectedVendorIds
  );

  interface Vendor {
    id: number;
    code: string;
    name: string;
    city: string;
    state: string;
  }

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedVendorSearch, setDebouncedVendorSearch] = useState("");
  const [selectedVendorIdsLocal, setSelectedVendorIdsLocal] = useState<number[]>(
    storedSelectedVendors || []
  );
  const [lastSavedVendorIds, setLastSavedVendorIds] = useState<number[] | null>(
    null
  );
  const [vendorPage, setVendorPage] = useState(1);
  const VENDORS_PER_PAGE = 100;

  // Step 2: Products & Discounts — track last saved item numbers and API ids for PUT on re-edit
  const [lastSavedItemNumbers, setLastSavedItemNumbers] = useState<
    string[] | null
  >(null);
  /** itemNumber -> { id, discount, minQuantity, maxQuantity, disType } from POST response or summary */
  const [savedTradeShowItems, setSavedTradeShowItems] = useState<
    Record<
      string,
      {
        id: number;
        discount: string;
        minQuantity: number;
        maxQuantity: number;
        disType: "PERCENT" | "FLAT";
      }
    >
  >({});

  // Step 3: Products & Discounts
  interface ProductItem {
    id: string;
    itemNumber: string;
    name: string;
    price: string | number;
    category: string;
    categoryId?: number;
    subcategoryId?: number;
  }
  interface CategoryOption {
    id: number;
    name: string;
    subcategories: { id: number; name: string }[];
  }
  interface AppliedDiscountItem extends TradeShowItemPayload {
    id?: number;
    name?: string;
    price?: string | number;
  }
  const [items, setItems] = useState<ProductItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [priceClassIds, setPriceClassIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsLimit, setItemsLimit] = useState(100);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [appliedItems, setAppliedItems] = useState<AppliedDiscountItem[]>([]);
  const [applyDiscount, setApplyDiscount] = useState("");
  const [applyDisType, setApplyDisType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [applyMinQty, setApplyMinQty] = useState<string>("1");
  const [applyMaxQty, setApplyMaxQty] = useState<string>("10");

  // Step 3: Select Retailers
  interface Retailer {
    id: number;
    code?: string;
    name: string;
    email?: string;
    city?: string;
    state?: string;
  }
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [retailersTotalCount, setRetailersTotalCount] = useState(0);
  const [retailersLoading, setRetailersLoading] = useState(false);
  const [retailersError, setRetailersError] = useState<string | null>(null);
  const [retailerSearch, setRetailerSearch] = useState("");
  const [debouncedRetailerSearch, setDebouncedRetailerSearch] = useState("");
  const [retailerPage, setRetailerPage] = useState(1);
  const [retailerRowsPerPage, setRetailerRowsPerPage] = useState(100);
  const [retailerStatus, setRetailerStatus] = useState<"all" | "active" | "inactive">("all");
  const [cotOptions, setCotOptions] = useState<{ code: string; name?: string }[]>([]);
  const [selectedCot, setSelectedCot] = useState<string[]>([]);
  const [cotLoading, setCotLoading] = useState(false);
  const [selectedRetailerIds, setSelectedRetailerIds] = useState<number[]>([]);
  const [lastSavedRetailerIds, setLastSavedRetailerIds] = useState<number[] | null>(null);

  // Step 4: Delivery Schedule — dates auto from step 0; edit calls update API. Add Products uses remain-item-in-delivery.
  const [addProductsWeekIndex, setAddProductsWeekIndex] = useState<number | null>(null);
  interface RemainItem {
    id: string | number;
    itemNumber?: string;
    name?: string;
  }
  const [remainItems, setRemainItems] = useState<RemainItem[]>([]);
  const [remainItemsLoading, setRemainItemsLoading] = useState(false);
  const [remainItemsError, setRemainItemsError] = useState<string | null>(null);
  const [weekProductAssignments, setWeekProductAssignments] = useState<Record<number, string[]>>({});
  const [selectedRemainItemNumbers, setSelectedRemainItemNumbers] = useState<Set<string | number>>(new Set());
  const [viewWeekIndex, setViewWeekIndex] = useState<number | null>(null);
  const [viewWeekItems, setViewWeekItems] = useState<RemainItem[]>([]);
  const [viewWeekItemsLoading, setViewWeekItemsLoading] = useState(false);
  const [viewWeekItemsError, setViewWeekItemsError] = useState<string | null>(null);
  const [viewWeekPage, setViewWeekPage] = useState(1);
  const [viewWeekLimit, setViewWeekLimit] = useState(10);
  const [viewWeekTotal, setViewWeekTotal] = useState(0);
  const [alreadyInWeekItems, setAlreadyInWeekItems] = useState<RemainItem[]>([]);
  const [alreadyInWeekLoading, setAlreadyInWeekLoading] = useState(false);
  const [alreadyInWeekPage, setAlreadyInWeekPage] = useState(1);
  const [alreadyInWeekLimit, setAlreadyInWeekLimit] = useState(100);
  const [alreadyInWeekTotal, setAlreadyInWeekTotal] = useState(0);
  const [deliveryProductPage, setDeliveryProductPage] = useState(1);
  const [deliveryProductLimit, setDeliveryProductLimit] = useState(100);
  const [deliveryProductTotal, setDeliveryProductTotal] = useState(0);
  const [deliveryCategoryIds, setDeliveryCategoryIds] = useState<number[]>([]);
  const [deliveryPriceClassIds, setDeliveryPriceClassIds] = useState<number[]>([]);
  const [deliverySaveSubmitting, setDeliverySaveSubmitting] = useState(false);
  const [deliverySaveError, setDeliverySaveError] = useState<string | null>(null);
  const [lastSavedDeliveryItemNumbers, setLastSavedDeliveryItemNumbers] = useState<string[] | null>(null);
  /** True after we have synced local state from persisted Redux; prevents persist effects from overwriting Redux with initial state on first mount/refresh */
  const [hasRehydrated, setHasRehydrated] = useState(false);
  const [step4NextSubmitting, setStep4NextSubmitting] = useState(false);
  const [addProductsInitialCheckedItemNumbers, setAddProductsInitialCheckedItemNumbers] = useState<string[] | null>(null);

  // Step 5: Summary — getTradeShowSummary response (new shape: data, vendors, retails, tradeShow, weekWiseCounts)
  const [summaryData, setSummaryData] = useState<{
    data: Array<{
      id: number;
      itemNumber: string;
      description: string;
      discount: string;
      minQuantity: number;
      maxQuantity: number;
      disType: string;
      salesCategory?: number;
      priceClass?: number;
    }>;
    vendors: Array<{
      Primary_Vendor: number;
      V_Description: string;
      V_Email?: string;
      V_Phone?: string;
      V_Addr1?: string;
      V_City?: string;
      V_State?: string;
      V_Zip?: string;
    }>;
    retails?: {
      count: number;
      rows: Array<{ retailerId: number; retailerName: string }>;
    };
    tradeShow: {
      id: number;
      name: string;
      tradeShowDate: string;
      deliveryStartDate: string;
      deliveryEndDate: string;
      deliveryWeeks: number;
    };
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    weekWiseCounts?: Array<{ weekNumber: number; count: number }>;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // View All / View Product modals in Summary
  const [summaryViewProductsOpen, setSummaryViewProductsOpen] = useState(false);
  const [summaryViewProductsList, setSummaryViewProductsList] = useState<any[]>([]);
  const [summaryViewProductsLoading, setSummaryViewProductsLoading] = useState(false);
  const [summaryViewProductsSearch, setSummaryViewProductsSearch] = useState("");
  const [summaryViewProductsDisType, setSummaryViewProductsDisType] = useState<"PERCENT" | "FLAT" | "">("");
  const [summaryViewVendorsOpen, setSummaryViewVendorsOpen] = useState(false);
  const [summaryViewVendorsList, setSummaryViewVendorsList] = useState<any[]>([]);
  const [summaryViewVendorsLoading, setSummaryViewVendorsLoading] = useState(false);
  const [summaryViewVendorsSearch, setSummaryViewVendorsSearch] = useState("");
  const [summaryViewRetailersOpen, setSummaryViewRetailersOpen] = useState(false);
  const [summaryViewRetailersList, setSummaryViewRetailersList] = useState<any[]>([]);
  const [summaryViewRetailersLoading, setSummaryViewRetailersLoading] = useState(false);
  const [summaryViewRetailersSearch, setSummaryViewRetailersSearch] = useState("");
  const [summaryViewWeekProductsOpen, setSummaryViewWeekProductsOpen] = useState(false);
  const [summaryViewWeekProductsWeek, setSummaryViewWeekProductsWeek] = useState<number | null>(null);
  const [summaryViewWeekProductsList, setSummaryViewWeekProductsList] = useState<RemainItem[]>([]);
  const [summaryViewWeekProductsLoading, setSummaryViewWeekProductsLoading] = useState(false);
  const [summaryViewProductsPage, setSummaryViewProductsPage] = useState(0);
  const [summaryViewProductsRowsPerPage, setSummaryViewProductsRowsPerPage] = useState(10);
  const [summaryViewProductsTotal, setSummaryViewProductsTotal] = useState(0);
  const [summaryViewVendorsPage, setSummaryViewVendorsPage] = useState(0);
  const [summaryViewVendorsRowsPerPage, setSummaryViewVendorsRowsPerPage] = useState(10);
  const [summaryViewVendorsTotal, setSummaryViewVendorsTotal] = useState(0);
  const [summaryViewRetailersPage, setSummaryViewRetailersPage] = useState(0);
  const [summaryViewRetailersRowsPerPage, setSummaryViewRetailersRowsPerPage] = useState(10);
  const [summaryViewRetailersTotal, setSummaryViewRetailersTotal] = useState(0);
  const [summaryViewWeekProductsPage, setSummaryViewWeekProductsPage] = useState(0);
  const [summaryViewWeekProductsRowsPerPage, setSummaryViewWeekProductsRowsPerPage] = useState(10);
  const [summaryViewWeekProductsTotal, setSummaryViewWeekProductsTotal] = useState(0);

  const debouncedSummaryViewProductsSearch = useDebounce(summaryViewProductsSearch, 400);
  const debouncedSummaryViewVendorsSearch = useDebounce(summaryViewVendorsSearch, 400);
  const debouncedSummaryViewRetailersSearch = useDebounce(summaryViewRetailersSearch, 400);

  const today = dayjs().startOf("day");
  const steps = [
    "Tradeshow Details",
    "Select Vendors",
    "Products & Discounts",
    "Select Retailers",
    "Delivery Schedule",
    "Summary",
  ];

  // deliveryWeeks based on selected delivery window (rounded up to full weeks)
  const deliveryWeeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = endDate.endOf("day").diff(startDate.startOf("day"), "day") + 1;
    return Math.ceil(days / 7);
  }, [startDate, endDate]);

  // Week segments for Delivery Schedule (Week 1, Week 2, …) from step 0 dates
  const deliveryWeekSegments = useMemo(() => {
    if (!startDate || !endDate) return [];
    const segments: { weekIndex: number; startDate: Dayjs; endDate: Dayjs }[] = [];
    let weekStart = startDate.startOf("day");
    const end = endDate.endOf("day");
    let weekIndex = 0;
    while (weekStart.isBefore(end) || weekStart.isSame(end, "day")) {
      const weekEnd = weekStart.add(6, "day");
      const segmentEnd = weekEnd.isAfter(end) ? end : weekEnd;
      segments.push({
        weekIndex,
        startDate: weekStart,
        endDate: segmentEnd,
      });
      weekStart = weekStart.add(7, "day");
      weekIndex += 1;
    }
    return segments;
  }, [startDate, endDate]);

  // Keep URL in sync with active step so refresh stays on same step
  useEffect(() => {
    setSearchParams({ step: String(activeStep) }, { replace: true });
  }, [activeStep, setSearchParams]);

  // Rehydrate local state from persisted Redux only after redux-persist has bootstrapped (so refresh keeps all steps working)
  const hasRehydratedFromReduxRef = useRef(false);
  useEffect(() => {
    const runSyncFromRedux = () => {
      if (hasRehydratedFromReduxRef.current) return;
      hasRehydratedFromReduxRef.current = true;
      const ts = store.getState().tradeShow;
      const draft = ts.createDraft;
      const show = ts.currentTradeShow;
      if (draft.name !== undefined && draft.name !== "") setName(draft.name);
      else if (show?.name) setName(show.name);
      if (draft.tradeShowDate) setTradeShowDate(dayjs(draft.tradeShowDate));
      else if (show?.tradeShowDate) setTradeShowDate(dayjs(show.tradeShowDate));
      if (draft.startDate) setStartDate(dayjs(draft.startDate));
      else if (show?.deliveryStartDate) setStartDate(dayjs(show.deliveryStartDate));
      if (draft.endDate) setEndDate(dayjs(draft.endDate));
      else if (show?.deliveryEndDate) setEndDate(dayjs(show.deliveryEndDate));
      if (typeof ts.activeStep === "number" && ts.activeStep >= 0 && ts.activeStep <= MAX_STEP_INDEX) {
        setActiveStep(ts.activeStep);
      }
      if (ts.selectedRetailerIds?.length) setSelectedRetailerIds(ts.selectedRetailerIds);
      if (ts.appliedItems?.length) setAppliedItems(ts.appliedItems as AppliedDiscountItem[]);
      if (ts.savedTradeShowItems && Object.keys(ts.savedTradeShowItems).length > 0) {
        setSavedTradeShowItems(ts.savedTradeShowItems);
      }
      if (ts.weekProductAssignments && Object.keys(ts.weekProductAssignments).length > 0) {
        const weekAssignments: Record<number, string[]> = {};
        Object.entries(ts.weekProductAssignments).forEach(([k, v]) => {
          weekAssignments[Number(k)] = v ?? [];
        });
        setWeekProductAssignments(weekAssignments);
      }
      if (ts.summaryData) setSummaryData(ts.summaryData);
      if (ts.lastSavedVendorIds != null) setLastSavedVendorIds(ts.lastSavedVendorIds);
      if (ts.lastSavedRetailerIds != null) setLastSavedRetailerIds(ts.lastSavedRetailerIds);
      if (ts.lastSavedDeliveryItemNumbers != null) setLastSavedDeliveryItemNumbers(ts.lastSavedDeliveryItemNumbers);
      if (ts.lastSavedItemNumbers != null) setLastSavedItemNumbers(ts.lastSavedItemNumbers);
      setHasRehydrated(true);
    };

    const bootstrapped = (persistor.getState() as { bootstrapped?: boolean }).bootstrapped;
    if (bootstrapped) {
      runSyncFromRedux();
      return;
    }
    const unsub = persistor.subscribe(() => {
      const state = persistor.getState() as { bootstrapped?: boolean };
      if (state.bootstrapped) {
        runSyncFromRedux();
        unsub();
      }
    });
    return () => {
      unsub();
    };
  }, []);

  // Reset last-saved lists only when switching to a different tradeshow (prevId and currentId both set and different). Never on first mount (prevId === undefined) or refresh (same id).
  const prevTradeShowIdRef = useRef<number | string | null | undefined>(undefined);
  useEffect(() => {
    const currentId = currentTradeShow?.id ?? null;
    const prevId = prevTradeShowIdRef.current;
    const isSwitch = prevId !== undefined && prevId !== null && currentId !== prevId;
    if (isSwitch) {
      setLastSavedVendorIds(null);
      setLastSavedItemNumbers(null);
      setLastSavedRetailerIds(null);
      setLastSavedDeliveryItemNumbers(null);
      setSavedTradeShowItems({});
      dispatch(setLastSavedVendorIdsRedux(null));
      dispatch(setLastSavedRetailerIdsRedux(null));
      dispatch(setLastSavedDeliveryItemNumbersRedux(null));
      dispatch(setLastSavedItemNumbersRedux(null));
      dispatch(setSavedTradeShowItemsRedux({}));
    }
    prevTradeShowIdRef.current = currentId;
  }, [currentTradeShow?.id, dispatch]);

  // Edit mode refs — reset when editId changes so we reload when switching to another tradeshow edit
  const editStep0LoadedRef = useRef(false);
  const editStep1LoadedRef = useRef(false);
  const editStep2LoadedRef = useRef(false);
  const editStep3LoadedRef = useRef(false);
  const editStep4LoadedRef = useRef(false);
  /** In edit mode, the tradeshow date as loaded from API (YYYY-MM-DD). If user keeps this date, we allow past; if they change it, new date must be today or future. */
  const originalTradeShowDateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editId) return;
    editStep0LoadedRef.current = false;
    editStep1LoadedRef.current = false;
    editStep2LoadedRef.current = false;
    editStep3LoadedRef.current = false;
    editStep4LoadedRef.current = false;
    originalTradeShowDateRef.current = null;
  }, [editId]);

  // Edit mode: step 0 — load trade show by id and populate form + currentTradeShow
  useEffect(() => {
    if (!editId || editStep0LoadedRef.current) return;
    editStep0LoadedRef.current = true;
    getTradeShowById(editId)
      .then((res: any) => {
        const raw = res?.data ?? res;
        const d = raw?.data ?? raw;
        const nameVal = d?.name ?? "";
        const tradeShowDateVal = d?.tradeShowDate;
        const deliveryStart = d?.deliveryStartDate;
        const deliveryEnd = d?.deliveryEndDate;
        const weeks = Number(d?.deliveryWeeks ?? 0);
        if (nameVal) setName(nameVal);
        if (tradeShowDateVal) {
          setTradeShowDate(dayjs(tradeShowDateVal));
          originalTradeShowDateRef.current = dayjs(tradeShowDateVal).format("YYYY-MM-DD");
        }
        if (deliveryStart) setStartDate(dayjs(deliveryStart));
        if (deliveryEnd) setEndDate(dayjs(deliveryEnd));
        dispatch(
          setCurrentTradeShow({
            id: editId,
            name: nameVal,
            tradeShowDate: tradeShowDateVal ?? "",
            deliveryStartDate: deliveryStart ?? "",
            deliveryEndDate: deliveryEnd ?? "",
            deliveryWeeks: weeks,
          })
        );
      })
      .catch((err) => {
        console.error("Failed to load trade show for edit", err);
        editStep0LoadedRef.current = false;
      });
  }, [editId, dispatch]);

  // Edit mode: step 1 — load vendor IDs already assigned (to pre-check)
  useEffect(() => {
    if (activeStep !== 1) return;
    const tid = currentTradeShow?.id ?? editId;
    if (!tid || editStep1LoadedRef.current) return;
    editStep1LoadedRef.current = true;
    getTradeShowVendorIdsForEdit(tid)
      .then((res: any) => {
        // API: { success, message, data: { data: [ { vendorId: number }, ... ], total } }
        const raw = res?.data ?? res;
        const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        const ids = list.map((v: any) => Number(v?.vendorId ?? 0)).filter((n: number) => n > 0);
        if (ids.length > 0) {
          setSelectedVendorIdsLocal(ids);
          dispatch(setSelectedVendorIds(ids));
          setLastSavedVendorIds(ids);
          dispatch(setLastSavedVendorIdsRedux(ids));
        }
      })
      .catch((err) => {
        console.error("Failed to load trade show vendor IDs for edit", err);
        editStep1LoadedRef.current = false;
      });
  }, [activeStep, currentTradeShow?.id, editId, dispatch]);

  // Edit mode: step 2 — load items already assigned (to pre-check)
  useEffect(() => {
    if (activeStep !== 2) return;
    const tid = currentTradeShow?.id ?? editId;
    if (!tid || editStep2LoadedRef.current) return;
    editStep2LoadedRef.current = true;
    getTradeShowItemForEdit(tid)
      .then((res: any) => {
        // API: { success, message, data: [ { id, itemNumber, description, discount, minQuantity, maxQuantity, disType, ... }, ... ] }
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        const applied: AppliedDiscountItem[] = [];
        const saved: Record<string, { id: number; discount: string; minQuantity: number; maxQuantity: number; disType: "PERCENT" | "FLAT" }> = {};
        const itemNumbers: string[] = [];
        list.forEach((row: any) => {
          const itemNumber = String(row?.itemNumber ?? "");
          if (!itemNumber) return;
          const discount = String(row?.discount ?? "");
          const minQ = Number(row?.minQuantity ?? 0);
          const maxQ = Number(row?.maxQuantity ?? 0);
          const disType = row?.disType === "FLAT" ? "FLAT" : "PERCENT";
          applied.push({
            itemNumber,
            discount,
            minQuantity: minQ,
            maxQuantity: maxQ,
            disType,
            id: row?.id,
            name: row?.description ?? row?.name,
            price: row?.price,
          });
          saved[itemNumber] = { id: row?.id ?? 0, discount, minQuantity: minQ, maxQuantity: maxQ, disType };
          itemNumbers.push(itemNumber);
        });
        if (applied.length > 0) {
          setAppliedItems(applied);
          dispatch(setAppliedItemsRedux(applied));
          setSavedTradeShowItems((prev) => ({ ...prev, ...saved }));
          dispatch(mergeSavedTradeShowItemsRedux(saved));
          setLastSavedItemNumbers(itemNumbers);
          dispatch(setLastSavedItemNumbersRedux(itemNumbers));
        }
      })
      .catch((err) => {
        console.error("Failed to load trade show items for edit", err);
        editStep2LoadedRef.current = false;
      });
  }, [activeStep, currentTradeShow?.id, editId, dispatch]);

  // Edit mode: step 3 — load retailers already assigned (to pre-check)
  useEffect(() => {
    if (activeStep !== 3) return;
    const tid = currentTradeShow?.id ?? editId;
    if (!tid || editStep3LoadedRef.current) return;
    editStep3LoadedRef.current = true;
    getTradeShowRetailerForEdit(tid)
      .then((res: any) => {
        // API: { success, message, data: { data: [ { retailerId: number }, ... ], total } }
        const raw = res?.data ?? res;
        const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        const ids = list.map((r: any) => Number(r?.retailerId ?? 0)).filter((n: number) => n > 0);
        if (ids.length > 0) {
          setSelectedRetailerIds(ids);
          dispatch(setSelectedRetailerIdsRedux(ids));
          setLastSavedRetailerIds(ids);
          dispatch(setLastSavedRetailerIdsRedux(ids));
        }
      })
      .catch((err) => {
        console.error("Failed to load trade show retailers for edit", err);
        editStep3LoadedRef.current = false;
      });
  }, [activeStep, currentTradeShow?.id, editId, dispatch]);

  // Edit mode only: step 4 — load existing delivery products per week so lastSavedDeliveryItemNumbers and weekProductAssignments are set; then remove = delete API only, add = bulk API only
  useEffect(() => {
    if (activeStep !== 4 || !editId) return;
    const tid = currentTradeShow?.id ?? editId;
    if (!tid || !deliveryWeekSegments.length || editStep4LoadedRef.current) return;
    editStep4LoadedRef.current = true;
    const loadStep4Delivery = async () => {
      try {
        const assignments: Record<number, string[]> = {};
        const allItemNumbers = new Set<string>();
        for (let idx = 0; idx < deliveryWeekSegments.length; idx++) {
          const weekNumber = idx + 1;
          const res: any = await getInventoryAsPerTradeWeek({
            tradeId: tid,
            weekNumber,
            page: 1,
            limit: 500,
          });
          const payload = res?.data ?? res;
          const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
          const itemNumbers = list.map((row: any) => String(row?.Item_Number ?? row?.itemNumber ?? row?.id ?? "")).filter(Boolean);
          assignments[idx] = itemNumbers;
          itemNumbers.forEach((n: string) => allItemNumbers.add(n));
        }
        setWeekProductAssignments(assignments);
        const flat = Array.from(allItemNumbers);
        if (flat.length > 0) {
          setLastSavedDeliveryItemNumbers(flat);
          dispatch(setLastSavedDeliveryItemNumbersRedux(flat));
        }
        dispatch(setWeekProductAssignmentsRedux(Object.fromEntries(Object.entries(assignments).map(([k, v]) => [String(k), v]))));
      } catch (err) {
        console.error("Failed to load delivery products for edit step 4", err);
        editStep4LoadedRef.current = false;
      }
    };
    loadStep4Delivery();
  }, [activeStep, currentTradeShow?.id, editId, deliveryWeekSegments, dispatch]);

  // Persist step 0 form to Redux (survives refresh). Wait until after rehydration so we don't overwrite Redux with initial state.
  useEffect(() => {
    if (!hasRehydrated) return;
    dispatch(
      setCreateDraft({
        name,
        tradeShowDate: tradeShowDate ? tradeShowDate.format("YYYY-MM-DD") : null,
        startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
        endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
      })
    );
  }, [dispatch, hasRehydrated, name, tradeShowDate, startDate, endDate]);

  // Persist activeStep to Redux whenever it changes
  useEffect(() => {
    if (!hasRehydrated) return;
    dispatch(setActiveStepRedux(activeStep));
  }, [dispatch, hasRehydrated, activeStep]);

  // Persist appliedItems to Redux (for step 2 and update)
  useEffect(() => {
    if (!hasRehydrated) return;
    dispatch(setAppliedItemsRedux(appliedItems));
  }, [dispatch, hasRehydrated, appliedItems]);

  // Persist selectedRetailerIds to Redux
  useEffect(() => {
    if (!hasRehydrated) return;
    dispatch(setSelectedRetailerIdsRedux(selectedRetailerIds));
  }, [dispatch, hasRehydrated, selectedRetailerIds]);

  // Persist weekProductAssignments to Redux (keys as string for JSON)
  useEffect(() => {
    if (!hasRehydrated) return;
    const asStrings: Record<string, string[]> = {};
    Object.entries(weekProductAssignments).forEach(([k, v]) => {
      asStrings[String(k)] = v ?? [];
    });
    dispatch(setWeekProductAssignmentsRedux(asStrings));
  }, [dispatch, hasRehydrated, weekProductAssignments]);

  // Persist savedTradeShowItems to Redux (API response data for step 2 and update)
  useEffect(() => {
    if (!hasRehydrated) return;
    dispatch(setSavedTradeShowItemsRedux(savedTradeShowItems));
  }, [dispatch, hasRehydrated, savedTradeShowItems]);

  // Persist draft to localStorage as fallback (skip first run)
  const isFirstPersistRef = useRef(true);
  useEffect(() => {
    if (isFirstPersistRef.current) {
      isFirstPersistRef.current = false;
      return;
    }
    const hasData =
      name !== "" ||
      activeStep > 0 ||
      (appliedItems && appliedItems.length > 0) ||
      (selectedProductIds && selectedProductIds.length > 0) ||
      (selectedRetailerIds && selectedRetailerIds.length > 0) ||
      tradeShowDate != null ||
      startDate != null ||
      endDate != null;
    if (!hasData) return;
    const draft = {
      name,
      tradeShowDate: tradeShowDate ? tradeShowDate.format("YYYY-MM-DD") : null,
      startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
      endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
      activeStep,
      appliedItems,
      applyDiscount,
      applyDisType,
      applyMinQty,
      applyMaxQty,
      selectedProductIds,
      categoryIds,
      priceClassIds,
      productSearch,
      itemsPage,
      itemsLimit,
      selectedRetailerIds,
    };
    try {
      localStorage.setItem(TRADESHOW_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore quota errors
    }
  }, [
    name,
    tradeShowDate,
    startDate,
    endDate,
    activeStep,
    appliedItems,
    applyDiscount,
    applyDisType,
    applyMinQty,
    applyMaxQty,
    selectedProductIds,
    categoryIds,
    priceClassIds,
    productSearch,
    itemsPage,
    itemsLimit,
    selectedRetailerIds,
  ]);

  // Keep local selected vendors in sync with Redux (no update API — selections persist from Redux on Back)
  useEffect(() => {
    setSelectedVendorIdsLocal(storedSelectedVendors || []);
  }, [storedSelectedVendors]);

  // When entering step 2 (Select Vendors), restore selections from Redux so Back → Next shows them (no update API)
  useEffect(() => {
    if (activeStep === 1) {
      setSelectedVendorIdsLocal(storedSelectedVendors || []);
    }
  }, [activeStep, storedSelectedVendors]);

  // Debounce vendor search (400ms) for Step 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVendorSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce search (400ms) for inventory API (Step 2)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Debounce retailer search (400ms) for Step 3
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRetailerSearch(retailerSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [retailerSearch]);

  const loadVendors = async () => {
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const res: any = await getVendorsForTradeShow();
      // API returns { success, message, data: { data: [...], total } }
      const rawList = res?.data?.data ?? res?.data ?? res ?? [];
      const mapped: Vendor[] = rawList.map((item: any) => {
        const vendorId = Number(item.Primary_Vendor ?? item.id ?? item.vendorId ?? 0);
        const vendorNumber = String(item.Primary_Vendor ?? item.V_Number ?? item.code ?? "");
        const description = String(item.V_Description ?? item.name ?? item.companyName ?? "");
        return {
          id: vendorId,
          code: vendorNumber,
          name: description,
          city: String(item.V_City ?? item.city ?? ""),
          state: String(item.V_State ?? item.state ?? ""),
        };
      });
      setVendors(mapped);
    } catch (err) {
      console.error("Failed to load vendors for tradeshow", err);
      setVendorsError("Failed to load vendors");
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  // Load vendors when we enter step 2 for the first time
  useEffect(() => {
    if (activeStep === 1 && vendors.length === 0 && !vendorsLoading) {
      loadVendors();
    }
  }, [activeStep]);

  // Load categories (for step 3 filter) and items when entering step 3
  const loadCategories = async () => {
    try {
      const res: any = await getProductCategory();
      const raw = Array.isArray(res) ? res : res?.data ?? [];
      const mapped: CategoryOption[] = raw.map((cat: any) => ({
        id: cat.Sales_Category ?? cat.id,
        name: cat.Category_Desc ?? cat.name ?? "",
        subcategories: (cat.priceClasses ?? cat.subcategories ?? []).map((pc: any) => ({
          id: pc.Price_Class ?? pc.id,
          name: pc.Class_Desc ?? pc.name ?? "",
        })),
      }));
      setCategories(mapped);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const loadItems = async (overridePage?: number) => {
    if (!currentTradeShow?.id) return;
    const vendorIds = storedSelectedVendors ?? [];
    const page = overridePage ?? itemsPage;
    setItemsLoading(true);
    try {
      const res: any = await getInventoryAsPerVendorIds({
        salesCategoryId: categoryIds,
        ids: vendorIds,
        priceClassId: priceClassIds,
        search: debouncedSearch ?? "",
        page,
        limit: itemsLimit,
      });
      const dataPayload = res?.data;
      const rawList = dataPayload?.data ?? res?.data ?? res ?? [];
      const total = dataPayload?.total ?? rawList.length;
      setItemsTotal(Number(total));
      const mapped: ProductItem[] = rawList.map((row: any) => {
        const salesCat = row.SalesCategory;
        const priceClass = row.PriceClass;
        const price =
          row.Price1 !== undefined && row.Price1 !== null ? row.Price1 : "-";
        return {
          id: String(row.id ?? row.Item_Number ?? row.itemNumber ?? ""),
          itemNumber: String(row.Item_Number ?? row.itemNumber ?? row.id ?? ""),
          name: row.Description ?? row.name ?? row.description ?? "-",
          price,
          category:
            salesCat?.Category_Desc ?? row.Category_Desc ?? row.category ?? "-",
          categoryId: salesCat?.Sales_Category ?? row.Sales_Category ?? row.categoryId,
          subcategoryId: priceClass?.id ?? row.Price_Class ?? row.subcategoryId,
        };
      });
      setItems(mapped);
    } catch (e) {
      console.error("Failed to load trade show items", e);
      setItems([]);
      setItemsTotal(0);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadCotOptions = async () => {
    setCotLoading(true);
    try {
      const res: any = await getListOfClassOfTrade();
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCotOptions(
        list.map((item: any) => ({
          code: String(item.Trade_Code ?? item.code ?? item.id ?? "").trim(),
          name: item.Trade_Desc ?? item.name ?? item.description ?? item.Code_Desc ?? "",
        })).filter((x: { code: string }) => x.code !== "")
      );
    } catch {
      setCotOptions([]);
    } finally {
      setCotLoading(false);
    }
  };

  const loadCustomers = async () => {
    setRetailersLoading(true);
    setRetailersError(null);
    try {
      const res: any = await getCustomerListForTradeShow({
        cot: selectedCot,
        search: debouncedRetailerSearch || undefined,
        page: retailerPage,
        limit: retailerRowsPerPage,
      });
      const payload = res?.data ?? res;
      const rawList = Array.isArray(payload?.customerList)
        ? payload.customerList
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const totalCount =
        typeof payload?.totalCount === "number"
          ? payload.totalCount
          : typeof payload?.total === "number"
            ? payload.total
            : 0;
      const mapped: Retailer[] = rawList.map((item: any) => ({
        id: Number(item.C_Number ?? item.id ?? item.customerId ?? 0),
        code: String(item.C_Number ?? item.code ?? item.customerId ?? ""),
        name: String(item.C_Name ?? item.name ?? item.customerName ?? ""),
        email: item.C_Email ?? item.email ?? "",
        city: item.C_City ?? item.city ?? "",
        state: item.C_State ?? item.state ?? "",
      }));
      setRetailers(mapped);
      setRetailersTotalCount(totalCount);
    } catch (err) {
      console.error("Failed to load customers", err);
      setRetailersError("Failed to load customers");
      setRetailers([]);
    } finally {
      setRetailersLoading(false);
    }
  };

  useEffect(() => {
    if (activeStep === 2) {
      loadCategories();
    }
  }, [activeStep]);

  // Step 4 Add Products: load categories when panel opens so filter dropdowns are populated
  useEffect(() => {
    if (addProductsWeekIndex !== null && categories.length === 0) {
      loadCategories();
    }
  }, [addProductsWeekIndex]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    if (activeStep === 2) {
      setItemsPage(1);
    }
  }, [activeStep, debouncedSearch, categoryIds, priceClassIds]);

  useEffect(() => {
    if (activeStep === 2) {
      loadItems();
    }
  }, [activeStep, itemsPage, itemsLimit, debouncedSearch, categoryIds, priceClassIds]);

  useEffect(() => {
    if (activeStep === 3) {
      loadCotOptions();
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 3) {
      setRetailerPage(1);
    }
  }, [activeStep, debouncedRetailerSearch, retailerStatus, selectedCot, retailerRowsPerPage]);

  useEffect(() => {
    if (activeStep === 3) {
      loadCustomers();
    }
  }, [activeStep, retailerPage, retailerRowsPerPage, debouncedRetailerSearch, retailerStatus, selectedCot]);

  // Step 4: Load items for Add Products — show BOTH: (1) getInventoryAsPerTradeWeek = already in week, (2) getRemainItemInDelivery = remaining
  const toRemainItem = (item: any): RemainItem => {
    const num =
      item.itemNumber ??
      item.inventory?.Item_Number ??
      item.itemId ??
      item.id ??
      item.code;
    const name =
      item.name ??
      item.itemName ??
      item.inventory?.Description ??
      item.inventory?.Item_Name ??
      item.item?.description ??
      item.description ??
      "—";
    return {
      id: num ?? item.id ?? item.code,
      itemNumber: num != null ? String(num) : undefined,
      name: String(name),
    };
  };

  // Load only "Products in this week" — called when dialog opens or when this table's pagination changes
  const loadAlreadyInWeekItems = async () => {
    if (addProductsWeekIndex === null || !currentTradeShow?.id) return;
    setAlreadyInWeekLoading(true);
    setRemainItemsError(null);
    try {
      const weekNumber = addProductsWeekIndex + 1;
      const inventoryRes: any = await getInventoryAsPerTradeWeek({
        tradeId: currentTradeShow.id,
        weekNumber,
        page: alreadyInWeekPage,
        limit: alreadyInWeekLimit,
      });
      const invPayload = inventoryRes?.data ?? inventoryRes;
      const invList = Array.isArray(invPayload)
        ? invPayload
        : invPayload?.data ?? invPayload?.items ?? [];
      const invTotal = Number(invPayload?.total ?? 0);
      const alreadyInWeek = invList.map((item: any) => toRemainItem(item));
      setAlreadyInWeekItems(alreadyInWeek);
      setAlreadyInWeekTotal(invTotal);
      const itemNumbersInWeek = alreadyInWeek.map((item: RemainItem) => String(item.itemNumber ?? item.id ?? "")).filter(Boolean);
      setAddProductsInitialCheckedItemNumbers(itemNumbersInWeek.length > 0 ? itemNumbersInWeek : null);
      setSelectedRemainItemNumbers((prev) => {
        const next = new Set(prev);
        alreadyInWeek.forEach((item: RemainItem) => {
          const num = item.itemNumber ?? item.id;
          if (num != null) {
            next.add(num);
            next.add(String(num));
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to load products in week", err);
      setRemainItemsError("Failed to load products in week");
      setAlreadyInWeekItems([]);
      setAlreadyInWeekTotal(0);
    } finally {
      setAlreadyInWeekLoading(false);
    }
  };

  // Load only "Add more products" — called when dialog opens or when this table's pagination changes
  const loadRemainItemsForWeek = async () => {
    if (addProductsWeekIndex === null || !currentTradeShow?.id) return;
    setRemainItemsLoading(true);
    setRemainItemsError(null);
    try {
      const remainRes: any = await getRemainItemInDelivery(currentTradeShow.id, {
        page: deliveryProductPage,
        limit: deliveryProductLimit,
        ...(deliveryCategoryIds.length > 0 && { salesCategory: deliveryCategoryIds }),
        ...(deliveryPriceClassIds.length > 0 && { priceClass: deliveryPriceClassIds }),
      });
      const remainPayload = remainRes?.data ?? remainRes;
      const remainList = Array.isArray(remainPayload)
        ? remainPayload
        : remainPayload?.data ?? remainPayload?.items ?? [];
      const remainTotal = Number(remainPayload?.total ?? 0);
      const remaining = remainList.map((item: any) => toRemainItem(item));
      setRemainItems(remaining);
      setDeliveryProductTotal(remainTotal);
    } catch (err) {
      console.error("Failed to load remaining items", err);
      setRemainItemsError("Failed to load remaining items");
      setRemainItems([]);
      setDeliveryProductTotal(0);
    } finally {
      setRemainItemsLoading(false);
    }
  };

  // Products in this week: load when dialog opens or when this table's pagination changes
  useEffect(() => {
    if (addProductsWeekIndex !== null && currentTradeShow?.id) {
      loadAlreadyInWeekItems();
    } else {
      setAlreadyInWeekItems([]);
      setAlreadyInWeekTotal(0);
    }
  }, [addProductsWeekIndex, currentTradeShow?.id, alreadyInWeekPage, alreadyInWeekLimit]);

  // Reset delivery product page when filters change so results reload from page 1
  useEffect(() => {
    if (addProductsWeekIndex !== null) setDeliveryProductPage(1);
  }, [deliveryCategoryIds, deliveryPriceClassIds]);

  // Add more products: load when dialog opens or when this table's pagination or filters change
  useEffect(() => {
    if (addProductsWeekIndex !== null && currentTradeShow?.id) {
      loadRemainItemsForWeek();
    } else {
      setRemainItems([]);
      setDeliveryProductTotal(0);
    }
  }, [addProductsWeekIndex, currentTradeShow?.id, deliveryProductPage, deliveryProductLimit, deliveryCategoryIds, deliveryPriceClassIds]);

  // Clear error and initial checked when dialog closes
  useEffect(() => {
    if (addProductsWeekIndex === null) {
      setRemainItemsError(null);
      setAddProductsInitialCheckedItemNumbers(null);
    }
  }, [addProductsWeekIndex]);

  // When opening Add Products for a week, reset pagination and pre-select already assigned (by item number)
  useEffect(() => {
    if (addProductsWeekIndex === null) return;
    setAlreadyInWeekPage(1);
    setDeliveryProductPage(1);
    const assigned = weekProductAssignments[addProductsWeekIndex] ?? [];
    setSelectedRemainItemNumbers(new Set(assigned));
    setAddProductsInitialCheckedItemNumbers(assigned.length > 0 ? assigned : null);
  }, [addProductsWeekIndex, weekProductAssignments]);

  // View week modal: load getInventoryAsPerTradeWeek with pagination
  const loadViewWeekItems = async () => {
    if (viewWeekIndex === null || !currentTradeShow?.id) return;
    setViewWeekItemsLoading(true);
    setViewWeekItemsError(null);
    try {
      const weekNumber = viewWeekIndex + 1;
      const res: any = await getInventoryAsPerTradeWeek({
        tradeId: currentTradeShow.id,
        weekNumber,
        page: viewWeekPage,
        limit: viewWeekLimit,
      });
      // API returns { data: { data: [...], total, page, limit, totalPages } }
      const payload = res?.data ?? res;
      const list = Array.isArray(payload)
        ? payload
        : payload?.data ?? payload?.items ?? [];
      const total = Number(payload?.total ?? 0);
      const items: RemainItem[] = list.map((item: any) => toRemainItem(item));
      setViewWeekItems(items);
      setViewWeekTotal(total);
    } catch (err) {
      console.error("Failed to load week products", err);
      setViewWeekItemsError("Failed to load products");
      setViewWeekItems([]);
      setViewWeekTotal(0);
    } finally {
      setViewWeekItemsLoading(false);
    }
  };

  useEffect(() => {
    if (viewWeekIndex !== null && currentTradeShow?.id) {
      loadViewWeekItems();
    } else {
      setViewWeekItems([]);
      setViewWeekItemsError(null);
      setViewWeekTotal(0);
      setViewWeekPage(1);
    }
  }, [viewWeekIndex, currentTradeShow?.id, viewWeekPage, viewWeekLimit]);

  // Step 5: Load trade show summary when Summary step is active — single call page=1 limit=10, no pagination
  useEffect(() => {
    if (activeStep !== 5 || !currentTradeShow?.id) {
      setSummaryData(null);
      setSummaryError(null);
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    getTradeShowSummary(currentTradeShow.id, { page: 1, limit: 10 })
      .then((res: any) => {
        const raw = res?.data ?? res;
        const data = raw?.data ?? [];
        const summaryPayload = {
          data,
          vendors: raw?.vendors ?? [],
          retails: raw?.retails ?? undefined,
          tradeShow: raw?.tradeShow ?? {
            id: 0,
            name: "",
            tradeShowDate: "",
            deliveryStartDate: "",
            deliveryEndDate: "",
            deliveryWeeks: 0,
          },
          total: raw?.total,
          page: raw?.page,
          limit: raw?.limit,
          totalPages: raw?.totalPages,
          weekWiseCounts: raw?.weekWiseCounts ?? undefined,
        };
        setSummaryData(summaryPayload);
        dispatch(setSummaryDataRedux(summaryPayload));
        // Populate savedTradeShowItems so Back to step 2 has ids for PUT on re-edit
        const savedItems: Record<string, { id: number; discount: string; minQuantity: number; maxQuantity: number; disType: "PERCENT" | "FLAT" }> = {};
        data.forEach(
          (row: {
            id: number;
            itemNumber: string;
            discount: string;
            minQuantity: number;
            maxQuantity: number;
            disType: string;
          }) => {
            savedItems[row.itemNumber] = {
              id: row.id,
              discount: String(row.discount ?? ""),
              minQuantity: row.minQuantity ?? 0,
              maxQuantity: row.maxQuantity ?? 0,
              disType:
                row.disType === "PERCENT" || row.disType === "FLAT"
                  ? row.disType
                  : "PERCENT",
            };
          }
        );
        setSavedTradeShowItems((prev) => ({ ...prev, ...savedItems }));
        dispatch(mergeSavedTradeShowItemsRedux(savedItems));
        // So step 2 Next only ADD new / UPDATE / DELETE, not re-add all
        const itemNumbersFromSummary = data.map((row: { itemNumber: string }) => String(row.itemNumber));
        setLastSavedItemNumbers(itemNumbersFromSummary);
        dispatch(setLastSavedItemNumbersRedux(itemNumbersFromSummary));
        // Step 1: "already saved" vendor IDs so Next only add/delete diff
        const vendorIdsFromSummary = (raw?.vendors ?? []).map((v: { Primary_Vendor?: number }) => Number(v.Primary_Vendor ?? 0)).filter((id: number) => id > 0);
        if (vendorIdsFromSummary.length > 0) {
          setLastSavedVendorIds(vendorIdsFromSummary);
          dispatch(setLastSavedVendorIdsRedux(vendorIdsFromSummary));
        }
      })
      .catch((err) => {
        console.error("Failed to load trade show summary", err);
        setSummaryError("Failed to load summary");
        setSummaryData(null);
      })
      .finally(() => setSummaryLoading(false));
  }, [activeStep, currentTradeShow?.id]);

  // Summary View All / View Product modals — load functions (parse data.data from API, pagination)
  const loadSummaryViewProducts = async () => {
    if (!currentTradeShow?.id) return;
    setSummaryViewProductsLoading(true);
    try {
      const page = summaryViewProductsPage + 1;
      const limit = summaryViewProductsRowsPerPage;
      const res: any = await getTradeShowItems({
        tradeShowId: currentTradeShow.id,
        itemNumber: debouncedSummaryViewProductsSearch?.trim() || undefined,
        disType: summaryViewProductsDisType || undefined,
        page,
        limit,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? res?.items ?? res ?? [];
      const total = typeof payload?.total === "number" ? payload.total : (Array.isArray(list) ? list.length : 0);
      setSummaryViewProductsList(Array.isArray(list) ? list : []);
      setSummaryViewProductsTotal(total);
    } catch (err) {
      console.error("Failed to load trade show items", err);
      setSummaryViewProductsList([]);
      setSummaryViewProductsTotal(0);
    } finally {
      setSummaryViewProductsLoading(false);
    }
  };

  const loadSummaryViewVendors = async () => {
    if (!currentTradeShow?.id) return;
    setSummaryViewVendorsLoading(true);
    try {
      const page = summaryViewVendorsPage + 1;
      const limit = summaryViewVendorsRowsPerPage;
      const res: any = await getTradeShowVendors({
        tradeShowId: currentTradeShow.id,
        search: debouncedSummaryViewVendorsSearch?.trim() || undefined,
        page,
        limit,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? res?.vendors ?? res ?? [];
      const total = typeof payload?.total === "number" ? payload.total : (Array.isArray(list) ? list.length : 0);
      setSummaryViewVendorsList(Array.isArray(list) ? list : []);
      setSummaryViewVendorsTotal(total);
    } catch (err) {
      console.error("Failed to load trade show vendors", err);
      setSummaryViewVendorsList([]);
      setSummaryViewVendorsTotal(0);
    } finally {
      setSummaryViewVendorsLoading(false);
    }
  };

  const loadSummaryViewRetailers = async () => {
    if (!currentTradeShow?.id) return;
    setSummaryViewRetailersLoading(true);
    try {
      const page = summaryViewRetailersPage + 1;
      const limit = summaryViewRetailersRowsPerPage;
      const res: any = await getTradeShowRetailers({
        tradeShowId: currentTradeShow.id,
        search: debouncedSummaryViewRetailersSearch?.trim() || undefined,
        page,
        limit,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? res?.rows ?? res ?? [];
      const total = typeof payload?.total === "number" ? payload.total : (Array.isArray(list) ? list.length : 0);
      setSummaryViewRetailersList(Array.isArray(list) ? list : []);
      setSummaryViewRetailersTotal(total);
    } catch (err) {
      console.error("Failed to load trade show retailers", err);
      setSummaryViewRetailersList([]);
      setSummaryViewRetailersTotal(0);
    } finally {
      setSummaryViewRetailersLoading(false);
    }
  };

  const loadSummaryViewWeekProducts = async (weekNumber: number) => {
    if (!currentTradeShow?.id) return;
    setSummaryViewWeekProductsLoading(true);
    try {
      const page = summaryViewWeekProductsPage + 1;
      const limit = summaryViewWeekProductsRowsPerPage;
      const res: any = await getInventoryAsPerTradeWeek({
        tradeId: currentTradeShow.id,
        weekNumber,
        page,
        limit,
      });
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
      const total = typeof payload?.total === "number" ? payload.total : (Array.isArray(list) ? list.length : 0);
      const items: RemainItem[] = list.map((item: any) => toRemainItem(item));
      setSummaryViewWeekProductsList(items);
      setSummaryViewWeekProductsTotal(total);
    } catch (err) {
      console.error("Failed to load week products", err);
      setSummaryViewWeekProductsList([]);
      setSummaryViewWeekProductsTotal(0);
    } finally {
      setSummaryViewWeekProductsLoading(false);
    }
  };

  // When search or disType changes in Products modal, reset to page 0
  useEffect(() => {
    if (!summaryViewProductsOpen) return;
    setSummaryViewProductsPage(0);
  }, [debouncedSummaryViewProductsSearch, summaryViewProductsDisType]);

  // When View All Products modal is open, load/refetch when debounced search, disType, or pagination changes
  useEffect(() => {
    if (!summaryViewProductsOpen || !currentTradeShow?.id) return;
    loadSummaryViewProducts();
  }, [summaryViewProductsOpen, currentTradeShow?.id, debouncedSummaryViewProductsSearch, summaryViewProductsDisType, summaryViewProductsPage, summaryViewProductsRowsPerPage]);

  // When search changes in Vendors modal, reset to page 0
  useEffect(() => {
    if (!summaryViewVendorsOpen) return;
    setSummaryViewVendorsPage(0);
  }, [debouncedSummaryViewVendorsSearch]);

  // When View All Vendors modal is open, load/refetch when page, limit, or search changes
  useEffect(() => {
    if (!summaryViewVendorsOpen || !currentTradeShow?.id) return;
    loadSummaryViewVendors();
  }, [summaryViewVendorsOpen, currentTradeShow?.id, debouncedSummaryViewVendorsSearch, summaryViewVendorsPage, summaryViewVendorsRowsPerPage]);

  // When search changes in Retailers modal, reset to page 0
  useEffect(() => {
    if (!summaryViewRetailersOpen) return;
    setSummaryViewRetailersPage(0);
  }, [debouncedSummaryViewRetailersSearch]);

  // When View All Retailers modal is open, load/refetch when page, limit, or search changes
  useEffect(() => {
    if (!summaryViewRetailersOpen || !currentTradeShow?.id) return;
    loadSummaryViewRetailers();
  }, [summaryViewRetailersOpen, currentTradeShow?.id, debouncedSummaryViewRetailersSearch, summaryViewRetailersPage, summaryViewRetailersRowsPerPage]);

  // When View Week Products modal is open, refetch when page or rowsPerPage changes
  useEffect(() => {
    if (!summaryViewWeekProductsOpen || summaryViewWeekProductsWeek == null || !currentTradeShow?.id) return;
    loadSummaryViewWeekProducts(summaryViewWeekProductsWeek);
  }, [summaryViewWeekProductsOpen, summaryViewWeekProductsWeek, currentTradeShow?.id, summaryViewWeekProductsPage, summaryViewWeekProductsRowsPerPage]);

  // Unique price class options (dedupe by id across categories)
  const priceClassOptions = useMemo(() => {
    const seen = new Set<number>();
    return categories
      .flatMap((c) => c.subcategories)
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  }, [categories]);

  // API returns filtered results; no client-side filter needed
  const filteredItems = useMemo(() => items, [items]);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return Array.from(next);
      }
      next.add(id);
      return Array.from(next);
    });
  };

  const toggleSelectAllProducts = () => {
    const selectableItems = filteredItems.filter(
      (p) => !appliedItemNumbersSet.has(p.itemNumber)
    );
    if (selectableItems.length === 0) return;
    const ids = selectableItems.map((p) => p.id);
    const allSelected = ids.every((id) => selectedProductSet.has(id));
    if (allSelected) {
      const removeSet = new Set(ids);
      setSelectedProductIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleApplyDiscount = () => {
    const min = Number(applyMinQty);
    const max = Number(applyMaxQty);
    if (min < 1) {
      setError("Min quantity must be at least 1.");
      return;
    }
    if (max < 1) {
      setError("Max quantity must be at least 1.");
      return;
    }
    if (min > max) {
      setError("Min quantity cannot be greater than max quantity.");
      return;
    }
    const discountVal = applyDiscount.trim();
    if (!discountVal || isNaN(Number(discountVal))) {
      setError("Enter a valid discount.");
      return;
    }
    setError(null);
    const toAdd = filteredItems.filter((p) => selectedProductSet.has(p.id));
    const newEntries: AppliedDiscountItem[] = toAdd.map((p) => ({
      itemNumber: p.itemNumber,
      discount: discountVal,
      minQuantity: min,
      maxQuantity: max,
      disType: applyDisType,
      name: p.name,
      price: p.price,
    }));
    setAppliedItems((prev) => {
      const byItem = new Map(prev.map((a) => [a.itemNumber, a]));
      newEntries.forEach((a) => byItem.set(a.itemNumber, a));
      return Array.from(byItem.values());
    });
    setSelectedProductIds([]);
  };

  const removeAppliedItem = (itemNumber: string) => {
    setAppliedItems((prev) => prev.filter((a) => a.itemNumber !== itemNumber));
    const product = items.find((p) => p.itemNumber === itemNumber);
    if (product) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  const updateAppliedItem = (
    itemNumber: string,
    updates: Partial<
      Pick<AppliedDiscountItem, "discount" | "minQuantity" | "maxQuantity" | "disType">
    >
  ) => {
    setAppliedItems((prev) =>
      prev.map((a) =>
        a.itemNumber === itemNumber ? { ...a, ...updates } : a
      )
    );
  };

  const getFinalPrice = (a: AppliedDiscountItem): number | null => {
    const price = Number(a.price);
    if (isNaN(price) || price <= 0) return null;
    const discountVal = Number(a.discount);
    if (isNaN(discountVal)) return null;
    if (a.disType === "PERCENT") {
      return Math.round(price * (1 - discountVal / 100) * 100) / 100;
    }
    return Math.max(0, Math.round((price - discountVal) * 100) / 100);
  };

  const filteredVendors = useMemo(() => {
    if (!debouncedVendorSearch) return vendors;
    const q = debouncedVendorSearch.toLowerCase();
    return vendors.filter(
      (v) =>
        String(v.code).toLowerCase().includes(q) ||
        String(v.name).toLowerCase().includes(q) ||
        String(v.city).toLowerCase().includes(q) ||
        String(v.state).toLowerCase().includes(q)
    );
  }, [vendors, debouncedVendorSearch]);

  useEffect(() => {
    setVendorPage(1);
  }, [debouncedVendorSearch]);

  const paginatedVendors = useMemo(
    () =>
      filteredVendors.slice(
        (vendorPage - 1) * VENDORS_PER_PAGE,
        vendorPage * VENDORS_PER_PAGE
      ),
    [filteredVendors, vendorPage]
  );

  const selectedVendorSet = useMemo(
    () => new Set(selectedVendorIdsLocal),
    [selectedVendorIdsLocal]
  );

  const selectedProductSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );

  const selectedRetailerSet = useMemo(
    () => new Set(selectedRetailerIds),
    [selectedRetailerIds]
  );

  const toggleRetailerSelection = (id: number) => {
    setSelectedRetailerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return Array.from(next);
      }
      next.add(id);
      return Array.from(next);
    });
  };

  const toggleSelectAllRetailers = () => {
    if (retailers.length === 0) return;
    const ids = retailers.map((r) => r.id);
    const allSelected = ids.every((id) => selectedRetailerSet.has(id));
    if (allSelected) {
      const removeSet = new Set(ids);
      setSelectedRetailerIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedRetailerIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const appliedItemNumbersSet = useMemo(
    () => new Set(appliedItems.map((a) => a.itemNumber)),
    [appliedItems]
  );

  const toggleVendorSelection = (id: number) => {
    setSelectedVendorIdsLocal((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return Array.from(next);
      }
      next.add(id);
      return Array.from(next);
    });
  };

  const toggleSelectAllVendorsOnPage = (pageIds: number[]) => {
    if (pageIds.length === 0) return;
    const allOnPageSelected = pageIds.every((id) => selectedVendorSet.has(id));
    if (allOnPageSelected) {
      setSelectedVendorIdsLocal((prev) =>
        prev.filter((id) => !pageIds.includes(id))
      );
    } else {
      setSelectedVendorIdsLocal((prev) =>
        Array.from(new Set([...prev, ...pageIds]))
      );
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !tradeShowDate || !startDate || !endDate) {
      setError("Please fill all fields.");
      return;
    }

    // Validation rules: in edit mode, allow the original (possibly past) date; if user changed the date, it must be today or future
    const isOriginalDate =
      editId && originalTradeShowDateRef.current != null && tradeShowDate.format("YYYY-MM-DD") === originalTradeShowDateRef.current;
    if (!isOriginalDate && tradeShowDate.isBefore(today, "day")) {
      setError("Tradeshow date cannot be in the past.");
      return;
    }

    const minStart = tradeShowDate.add(1, "day").startOf("day");
    if (startDate.isBefore(minStart, "day")) {
      setError("Delivery start date must be after the tradeshow date.");
      return;
    }

    if (!endDate.isAfter(startDate, "day")) {
      setError("Delivery end date must be after the start date.");
      return;
    }

    const payload = {
      name: name.trim(),
      tradeShowDate: tradeShowDate.format("YYYY-MM-DD"),
      deliveryStartDate: startDate.format("YYYY-MM-DD"),
      deliveryEndDate: endDate.format("YYYY-MM-DD"),
      deliveryWeeks,
    };

    // If we already have an existing tradeshow and nothing changed (e.g. after refresh), skip API and go to next step
    if (currentTradeShow?.id) {
      const same =
        currentTradeShow.name === payload.name &&
        currentTradeShow.tradeShowDate === payload.tradeShowDate &&
        currentTradeShow.deliveryStartDate === payload.deliveryStartDate &&
        currentTradeShow.deliveryEndDate === payload.deliveryEndDate &&
        Number(currentTradeShow.deliveryWeeks) === payload.deliveryWeeks;
      if (same) {
        setActiveStep(1);
        return;
      }
    }

    try {
      setSubmitting(true);

      let apiResponse: any;
      // If we already have an ID, update instead of create
      if (currentTradeShow?.id) {
        apiResponse = await updateTradeShow(currentTradeShow.id, payload);
      } else {
        apiResponse = await createTradeShow(payload);
      }
      // Support multiple response shapes: { data: { id } }, { data: { data: { id } } }, or { id }
      const raw = apiResponse?.data ?? apiResponse;
      const created = raw?.data ?? raw;
      const tradeShowId =
        created?.id ?? raw?.id ?? currentTradeShow?.id ?? null;

      if (!tradeShowId) {
        throw new Error("Missing tradeshow id in response");
      }

      dispatch(
        setCurrentTradeShow({
          id: tradeShowId,
          ...payload,
        })
      );
      if (!currentTradeShow?.id) {
        setLastSavedItemNumbers(null);
        dispatch(setLastSavedItemNumbersRedux(null));
        setSavedTradeShowItems({});
        dispatch(setSavedTradeShowItemsRedux({}));
      }
      setActiveStep(1);
    } catch (err: any) {
      console.error("Failed to create tradeshow", err);
      const apiMessage = err?.response?.data?.message ?? err?.message;
      setError(apiMessage || "Failed to create tradeshow. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1, md: 3 },
        // pt: { xs: 3, md: 4 },
        pb: { xs: 2, md: 3 },
        height: "calc(100vh - 150px)",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        bgcolor: theme.palette.mode === "dark"
          ? "#050509"
          : "#F4F5F8",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => {
              clearTradeshowDraft();
              dispatch(clearCurrentTradeShow());
              navigate("/admin/tradeshow-management");
            }}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.primary.main,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
              },
            }}
            aria-label="Back to Tradeshow Management"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stepper
            activeStep={activeStep}
            
            alternativeLabel
            sx={{
              width: "100%",
              py: 1,
              borderRadius: 999,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(90deg,#0f172a,#020617)"
                  : "linear-gradient(90deg,#eef3f8,#dde6f2)",
              "& .MuiStepConnector-line": {
                borderTopWidth: 2,
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(148,163,184,0.6)"
                    : "rgba(148,163,184,0.8)",
              },
              "& .MuiStepIcon-root": {
                width: 26,
                height: 26,
                color: "rgba(148,163,184,0.8)",
                "&.Mui-active": {
                  color: theme.palette.primary.main,
                },
                "&.Mui-completed": {
                  color: theme.palette.primary.main,
                },
              },
              "& .MuiStepIcon-text": {
                fontSize: 12,
                fontWeight: 500,
                fill: theme.palette.getContrastText(theme.palette.primary.main),
              },
              "& .MuiStepLabel-label": {
                fontSize: 12,
                fontWeight: 400,
                mt: 0.75,
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(226,232,240,0.9)"
                    : "rgba(15,23,42,0.9)",
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          </Box>
        </Box>

        {activeStep === 0 && (
          <Paper
            sx={{
              p: { xs: 1.25, md: 1.5 },
              maxWidth: 720,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              height: "calc(100vh - 260px)",    
              display: "flex",
              flexDirection: "column",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={2.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    Tradeshow Details
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    label="Tradeshow Name"
                    placeholder="Enter tradeshow name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": { height: 36, fontSize: 12 },
                      "& .MuiInputLabel-root": { fontSize: 12 },
                    }}
                  />

                  <DatePicker
                    label="Date of Tradeshow"
                    value={tradeShowDate}
                    onChange={(value) => {
                      setTradeShowDate(value);
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    minDate={editId ? undefined : today}
                    disablePast={!editId}
                    disabled={!!editId}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        inputProps: { style: { fontSize: 11 } },
                        sx: {
                          "& .MuiInputBase-root": {
                            height: 36,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                          },
                          "& .MuiInputBase-input": {
                            fontSize: 11,
                            padding: "0 14px",
                            height: 36,
                            boxSizing: "border-box",
                          },
                          "& .MuiInputLabel-root": { fontSize: 11 },
                          "& .MuiPickersInputBase-root": {
                            height: 36,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                          },
                          "& .MuiPickersOutlinedInput-root": {
                            height: 36,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                          },
                          "& .MuiPickersInputBase-input": {
                            fontSize: 11,
                            padding: "0 14px",
                            height: 36,
                            boxSizing: "border-box",
                          },
                        },
                      },
                      day: {
                        sx: {
                          "&.Mui-selected": {
                            color: "#fff",
                          },
                        },
                      },
                    }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                    <Box flex={1} minWidth={200}>
                      <DatePicker
                        label="Delivery Start Date"
                        value={startDate}
                        onChange={(value) => {
                          setStartDate(value);
                          if (value && endDate && !endDate.isAfter(value, "day")) {
                            setEndDate(null);
                          }
                        }}
                        minDate={
                          tradeShowDate
                            ? tradeShowDate.add(1, "day")
                            : today.add(1, "day")
                        }
                        disabled={!!editId || !tradeShowDate}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            inputProps: { style: { fontSize: 11 } },
                            sx: {
                              "& .MuiInputBase-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiInputBase-input": {
                                fontSize: 11,
                                padding: "0 14px",
                                height: 36,
                                boxSizing: "border-box",
                              },
                              "& .MuiInputLabel-root": { fontSize: 11 },
                              "& .MuiPickersInputBase-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiPickersOutlinedInput-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiPickersInputBase-input": {
                                fontSize: 11,
                                padding: "0 14px",
                                height: 36,
                                boxSizing: "border-box",
                              },
                            },
                          },
                          day: {
                            sx: {
                              "&.Mui-selected": {
                                color: "#fff",
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                    <Box flex={1} minWidth={200}>
                      <DatePicker
                        label="Delivery End Date"
                        value={endDate}
                        onChange={(value) => setEndDate(value)}
                        minDate={startDate ? startDate.add(1, "day") : undefined}
                        disabled={!!editId || !startDate}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            inputProps: { style: { fontSize: 11 } },
                            sx: {
                              "& .MuiInputBase-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiInputBase-input": {
                                fontSize: 11,
                                padding: "0 14px",
                                height: 36,
                                boxSizing: "border-box",
                              },
                              "& .MuiInputLabel-root": { fontSize: 11 },
                              "& .MuiPickersInputBase-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiPickersOutlinedInput-root": {
                                height: 36,
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                              },
                              "& .MuiPickersInputBase-input": {
                                fontSize: 11,
                                padding: "0 14px",
                                height: 36,
                                boxSizing: "border-box",
                              },
                            },
                          },
                          day: {
                            sx: {
                              "&.Mui-selected": {
                                color: "#fff",
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  </Stack>

                  {startDate && endDate && (
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Delivery duration: {deliveryWeeks} weeks
                    </Typography>
                  )}

                  {error && (
                    <Typography sx={{ fontSize: 12, color: "error.main" }}>
                      {error}
                    </Typography>
                  )}
                </Stack>
              </LocalizationProvider>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                pt: 1.25,
                mt: 1.25,
              }}
            >
              <Box display="flex" justifyContent="flex-end">
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={submitting}
                  onClick={handleSubmit}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2.5,
                    color: "#fff",
                  }}
                >
                  {submitting ? "Saving..." : "Next"}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {activeStep === 1 && (
          <Paper
            sx={{
              p: { xs: 1.25, md: 1.5 },
              maxWidth: 900,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              mt: 1,
              height: "calc(100vh - 260px)",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <Stack spacing={1.25}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    Select Vendors
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Choose vendors to include in this tradeshow.
                  </Typography>
                </Box>

                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{
                    maxWidth: 320,
                    "& .MuiInputBase-root": { height: 36, fontSize: 12 },
                  }}
                />

                {vendorsLoading ? (
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Loading vendors...
                  </Typography>
                ) : vendorsError ? (
                  <Typography sx={{ fontSize: 12, color: "error.main" }}>
                    {vendorsError}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      maxHeight: "calc(100vh - 440px)",
                      minHeight: 200,
                      overflow: "auto",
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.25,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            padding="checkbox"
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            <Checkbox
                              size="small"
                              indeterminate={
                                paginatedVendors.length > 0 &&
                                (() => {
                                  const pageIds = paginatedVendors.map((v) => v.id);
                                  const selectedOnPage = pageIds.filter((id) =>
                                    selectedVendorSet.has(id)
                                  ).length;
                                  return selectedOnPage > 0 && selectedOnPage < pageIds.length;
                                })()
                              }
                              checked={
                                paginatedVendors.length > 0 &&
                                paginatedVendors.every((v) =>
                                  selectedVendorSet.has(v.id)
                                )
                              }
                              onChange={() =>
                                toggleSelectAllVendorsOnPage(
                                  paginatedVendors.map((v) => v.id)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Vendor ID
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Company Name
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            City
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            State
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedVendors.map((vendor) => (
                          <TableRow key={vendor.id} sx={{ "& td": { fontSize: 12 } }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedVendorSet.has(vendor.id)}
                                onChange={() => toggleVendorSelection(vendor.id)}
                              />
                            </TableCell>
                            <TableCell>{vendor.code}</TableCell>
                            <TableCell>{vendor.name}</TableCell>
                            <TableCell>{vendor.city}</TableCell>
                            <TableCell>{vendor.state}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={filteredVendors.length}
                      page={vendorPage - 1}
                      onPageChange={(_, newPage) =>
                        setVendorPage(newPage + 1)
                      }
                      rowsPerPage={VENDORS_PER_PAGE}
                      rowsPerPageOptions={[100]}
                      labelRowsPerPage="Rows:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                      }
                      sx={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: 1,
                        backgroundColor: theme.palette.background.paper,
                        borderTop: 1,
                        borderColor: "divider",
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                          { fontSize: 12 },
                      }}
                    />
                  </Box>
                )}
                {error && (
                  <Typography sx={{ fontSize: 12, color: "error.main", mt: 0.5 }}>
                    {error}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                pt: 1.25,
                mt: 1.25,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2,
                    color: "primary.main",
                  }}
                >
                  Back
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={submitting}
                  onClick={async () => {
                    if (!currentTradeShow?.id) {
                      setError("Missing tradeshow context");
                      return;
                    }
                    if (selectedVendorIdsLocal.length === 0) {
                      setError("Please select at least one vendor.");
                      return;
                    }
                    setSubmitting(true);
                    setError(null);
                    try {
                      const currentSorted = [...selectedVendorIdsLocal].sort(
                        (a, b) => a - b
                      );
                      const savedSorted =
                        lastSavedVendorIds != null
                          ? [...lastSavedVendorIds].sort((a, b) => a - b)
                          : null;
                      const noChange =
                        savedSorted != null &&
                        currentSorted.length === savedSorted.length &&
                        currentSorted.every(
                          (id, i) => id === savedSorted[i]
                        );

                      if (noChange) {
                        setActiveStep(2);
                        setSubmitting(false);
                        return;
                      }

                      const removedIds =
                        lastSavedVendorIds != null
                          ? lastSavedVendorIds.filter(
                              (id) => !selectedVendorIdsLocal.includes(id)
                            )
                          : [];
                      if (removedIds.length > 0) {
                        const removedChunks = chunkArray(
                          removedIds,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of removedChunks) {
                          await deleteBulkTradeShowVendors(
                            currentTradeShow.id,
                            chunk
                          );
                        }
                      }

                      const addedVendorIds =
                        lastSavedVendorIds != null
                          ? selectedVendorIdsLocal.filter(
                              (id) => !lastSavedVendorIds!.includes(id)
                            )
                          : selectedVendorIdsLocal;
                      if (addedVendorIds.length > 0) {
                        const vendorPayload = addedVendorIds.map((id) => {
                          const v = vendors.find((x) => x.id === id);
                          return {
                            Primary_Vendor: id,
                            V_Description: v?.name ?? "",
                          };
                        });
                        const addChunks = chunkArray(
                          vendorPayload,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of addChunks) {
                          await bulkAssignVendorsToTradeShow(
                            currentTradeShow.id,
                            chunk
                          );
                        }
                      }
                      setLastSavedVendorIds(selectedVendorIdsLocal);
                      dispatch(setLastSavedVendorIdsRedux(selectedVendorIdsLocal));
                      dispatch(setSelectedVendorIds(selectedVendorIdsLocal));
                      setActiveStep(2);
                    } catch (err) {
                      console.error("Failed to assign vendors", err);
                      setError("Failed to assign vendors. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2.5,
                    color: "#fff",
                  }}
                >
                  {submitting ? "Saving..." : "Next"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {activeStep === 2 && (
          <Paper
            sx={{
              p: { xs: 1.25, md: 1.5 },
              maxWidth: 1200,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              mt: 1,
              height: "calc(100vh - 260px)",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <Stack spacing={1.25}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  Products & Discounts
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Select products and apply discounts (Min Qty ≥ 1, Max Qty ≤ 10).
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
                  gap: 1.25,
                }}
              >
                {/* Left: product list */}
                <Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Search by item number / name (debounced)"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          sx={{
                            "& .MuiInputBase-root": { height: 36, fontSize: 12 },
                          }}
                        />
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                          <Select
                            multiple
                            value={categoryIds}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCategoryIds(
                                typeof next === "string" ? [] : next
                              );
                            }}
                            displayEmpty
                            renderValue={(selected: number[]) => {
                              if (selected.length === 0) return "All Categories";
                              if (selected.length <= 2) {
                                return selected
                                  .map(
                                    (id) =>
                                      categories.find((c) => c.id === id)
                                        ?.name ?? id
                                  )
                                  .join(", ");
                              }
                              return `${selected.length} categories`;
                            }}
                            sx={{
                              height: 36,
                              fontSize: 12,
                              "& .MuiSelect-select": { py: 0.75 },
                            }}
                          >
                            {categories.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                <Checkbox
                                  size="small"
                                  checked={categoryIds.includes(c.id)}
                                  sx={{ mr: 1 }}
                                />
                                {c.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                          <Select
                            multiple
                            value={priceClassIds}
                            onChange={(e) => {
                              const next = e.target.value;
                              setPriceClassIds(
                                typeof next === "string" ? [] : next
                              );
                            }}
                            displayEmpty
                            renderValue={(selected: number[]) => {
                              if (selected.length === 0)
                                return "All Price Classes";
                              if (selected.length <= 2) {
                                return selected
                                  .map(
                                    (id) =>
                                      priceClassOptions.find((s) => s.id === id)
                                        ?.name ?? id
                                  )
                                  .join(", ");
                              }
                              return `${selected.length} price classes`;
                            }}
                            sx={{
                              height: 36,
                              fontSize: 12,
                              "& .MuiSelect-select": { py: 0.75 },
                            }}
                          >
                            {priceClassOptions.map((s) => (
                              <MenuItem key={s.id} value={s.id}>
                                <Checkbox
                                  size="small"
                                  checked={priceClassIds.includes(s.id)}
                                  sx={{ mr: 1 }}
                                />
                                {s.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                          {itemsTotal} item(s) • {selectedProductIds.length} selected
                        </Typography>
                        {Math.ceil(itemsTotal / itemsLimit) > 1 && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Button
                              size="small"
                              disabled={itemsPage <= 1}
                              onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                              sx={{ minWidth: 64, fontSize: 11, textTransform: "none" }}
                            >
                              Prev
                            </Button>
                            <Typography sx={{ fontSize: 11 }}>
                              Page {itemsPage} of {Math.ceil(itemsTotal / itemsLimit)}
                            </Typography>
                            <Button
                              size="small"
                              disabled={itemsPage >= Math.ceil(itemsTotal / itemsLimit)}
                              onClick={() => setItemsPage((p) => p + 1)}
                              sx={{ minWidth: 64, fontSize: 11, textTransform: "none" }}
                            >
                              Next
                            </Button>
                          </Stack>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={toggleSelectAllProducts}
                          sx={{
                            height: 30,
                            fontSize: 11,
                            px: 1.25,
                            borderRadius: 1.25,
                            textTransform: "none",
                          }}
                        >
                          Select all
                        </Button>
                      </Stack>

                      <Divider />

                      {itemsLoading ? (
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          Loading products...
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            maxHeight: "calc(100vh - 510px)",
                            minHeight: 220,
                            overflow: "auto",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1.25,
                            bgcolor: theme.palette.background.paper,
                          }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  padding="checkbox"
                                  sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                  }}
                                >
                                  <Checkbox
                                    size="small"
                                    indeterminate={
                                      (() => {
                                        const selectable = filteredItems.filter(
                                          (p) =>
                                            !appliedItemNumbersSet.has(
                                              p.itemNumber
                                            )
                                        );
                                        if (selectable.length === 0)
                                          return false;
                                        const selectedCount = selectable.filter(
                                          (p) => selectedProductSet.has(p.id)
                                        ).length;
                                        return (
                                          selectedCount > 0 &&
                                          selectedCount < selectable.length
                                        );
                                      })()
                                    }
                                    checked={
                                      (() => {
                                        const selectable = filteredItems.filter(
                                          (p) =>
                                            !appliedItemNumbersSet.has(
                                              p.itemNumber
                                            )
                                        );
                                        return (
                                          selectable.length > 0 &&
                                          selectable.every((p) =>
                                            selectedProductSet.has(p.id)
                                          )
                                        );
                                      })()
                                    }
                                    onChange={toggleSelectAllProducts}
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    fontSize: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  Item
                                </TableCell>
                                <TableCell
                                  sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    fontSize: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  Name
                                </TableCell>
                                <TableCell
                                  sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    width: 90,
                                  }}
                                >
                                  Price
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredItems.map((p) => {
                                const isApplied = appliedItemNumbersSet.has(
                                  p.itemNumber
                                );
                                return (
                                  <TableRow
                                    key={p.id}
                                    hover={!isApplied}
                                    sx={{
                                      "& td": { fontSize: 12 },
                                      ...(isApplied && {
                                        opacity: 0.6,
                                        pointerEvents: "none",
                                      }),
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        size="small"
                                        checked={
                                          isApplied ||
                                          selectedProductSet.has(p.id)
                                        }
                                        disabled={isApplied}
                                        onChange={() =>
                                          toggleProductSelection(p.id)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>{p.itemNumber}</TableCell>
                                    <TableCell
                                      sx={{
                                        maxWidth: 320,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {p.name}
                                    </TableCell>
                                    <TableCell>{p.price}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                            <TablePagination
                              count={itemsTotal}
                              page={itemsPage - 1}
                              onPageChange={(_, newPage) =>
                                setItemsPage(newPage + 1)
                              }
                              rowsPerPage={itemsLimit}
                              rowsPerPageOptions={[25, 50, 100]}
                              onRowsPerPageChange={(e) => {
                                const newLimit = Number(e.target.value);
                                setItemsLimit(newLimit);
                                setItemsPage(1);
                              }}
                              labelRowsPerPage="Rows:"
                              labelDisplayedRows={({ from, to, count }) =>
                                `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                              }
                              sx={{
                                position: "sticky",
                                bottom: 0,
                                zIndex: 1,
                                backgroundColor: theme.palette.background.paper,
                                borderTop: 1,
                                borderColor: "divider",
                                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                                  { fontSize: 12 },
                              }}
                            />
                          </Table>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>

                {/* Right: discount + applied list */}
                <Box>
                  <Stack spacing={1.25}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.015)",
                      }}
                    >
                      <Stack spacing={1}>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                            Apply discount
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: "text.secondary" }}
                          >
                            Applies to {selectedProductIds.length} selected item(s)
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <TextField
                              size="small"
                              fullWidth
                              label="Discount"
                              value={applyDiscount}
                              onChange={(e) => setApplyDiscount(e.target.value)}
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: 36,
                                  fontSize: 12,
                                },
                                "& .MuiInputLabel-root": { fontSize: 12 },
                              }}
                            />
                          </Box>
                          <Box>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={applyDisType}
                                onChange={(e) =>
                                  setApplyDisType(
                                    e.target.value as "PERCENT" | "FLAT"
                                  )
                                }
                                sx={{
                                  height: 36,
                                  fontSize: 12,
                                  "& .MuiSelect-select": { py: 0.75 },
                                }}
                              >
                                <MenuItem value="PERCENT">Percent (%)</MenuItem>
                                <MenuItem value="FLAT">Flat ($)</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Box>
                            <TextField
                              size="small"
                              fullWidth
                              label="Min Qty"
                              type="number"
                              inputProps={{ min: 1 }}
                              value={applyMinQty}
                              onChange={(e) => setApplyMinQty(e.target.value)}
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: 36,
                                  fontSize: 12,
                                },
                                "& .MuiInputLabel-root": { fontSize: 12 },
                              }}
                            />
                          </Box>
                          <Box>
                            <TextField
                              size="small"
                              fullWidth
                              label="Max Qty"
                              type="number"
                              inputProps={{ min: 1 }}
                              value={applyMaxQty}
                              onChange={(e) => setApplyMaxQty(e.target.value)}
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: 36,
                                  fontSize: 12,
                                },
                                "& .MuiInputLabel-root": { fontSize: 12 },
                              }}
                            />
                          </Box>
                          <Box sx={{ gridColumn: "1 / -1" }}>
                            <Button
                              fullWidth
                              variant="contained"
                              disableElevation
                              onClick={handleApplyDiscount}
                              disabled={
                                submitting || selectedProductIds.length === 0
                              }
                              sx={{
                                height: 34,
                                fontSize: 12,
                                borderRadius: 1.5,
                                textTransform: "none",
                                color: "#fff",
                              }}
                            >
                              Apply to selection
                            </Button>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        mb={1}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                            Discounted items
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: "text.secondary" }}
                          >
                            {appliedItems.length} item(s) added
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          maxHeight: "calc(100vh - 660px)",
                          minHeight: 200,
                          overflow: "auto",
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.25,
                        }}
                      >
                        {appliedItems.length === 0 ? (
                          <Typography
                            sx={{ fontSize: 12, color: "text.secondary", p: 1 }}
                          >
                            No discounts added yet.
                          </Typography>
                        ) : (
                          appliedItems.map((a) => {
                            const finalPrice = getFinalPrice(a);
                            return (
                              <Box
                                key={a.itemNumber}
                                sx={{
                                  p: 1.25,
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  "&:last-child": { borderBottom: 0 },
                                }}
                              >
                                <Stack spacing={1}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                      gap: 1,
                                    }}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 500,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {a.name ?? a.itemNumber}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          fontSize: 10,
                                          color: "text.secondary",
                                        }}
                                      >
                                        {a.itemNumber}
                                        {a.price != null &&
                                          ` • Price $${Number(a.price)}`}
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        removeAppliedItem(a.itemNumber)
                                      }
                                      color="error"
                                    >
                                      <DeleteOutlineOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr auto auto",
                                      gap: 1,
                                      alignItems: "center",
                                    }}
                                  >
                                    <TextField
                                      size="small"
                                      label="Discount"
                                      value={a.discount}
                                      onChange={(e) =>
                                        updateAppliedItem(a.itemNumber, {
                                          discount: e.target.value,
                                        })
                                      }
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: 36,
                                          fontSize: 12,
                                        },
                                        "& .MuiInputLabel-root": {
                                          fontSize: 12,
                                        },
                                      }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 0 }}>
                                      <Select
                                        value={a.disType}
                                        onChange={(e) =>
                                          updateAppliedItem(a.itemNumber, {
                                            disType: e.target
                                              .value as "PERCENT" | "FLAT",
                                          })
                                        }
                                        sx={{
                                          height: 36,
                                          fontSize: 12,
                                          "& .MuiSelect-select": { py: 0.75 },
                                        }}
                                      >
                                        <MenuItem value="PERCENT">%</MenuItem>
                                        <MenuItem value="FLAT">$</MenuItem>
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      size="small"
                                      label="Min"
                                      type="number"
                                      inputProps={{ min: 1 }}
                                      value={a.minQuantity}
                                      onChange={(e) =>
                                        updateAppliedItem(a.itemNumber, {
                                          minQuantity: Number(e.target.value) || 1,
                                        })
                                      }
                                      sx={{
                                        width: 72,
                                        "& .MuiInputBase-root": {
                                          height: 36,
                                          fontSize: 12,
                                        },
                                        "& .MuiInputLabel-root": {
                                          fontSize: 12,
                                        },
                                      }}
                                    />
                                    <TextField
                                      size="small"
                                      label="Max"
                                      type="number"
                                      inputProps={{ min: 1 }}
                                      value={a.maxQuantity}
                                      onChange={(e) =>
                                        updateAppliedItem(a.itemNumber, {
                                          maxQuantity: Number(e.target.value) || 1,
                                        })
                                      }
                                      sx={{
                                        width: 72,
                                        "& .MuiInputBase-root": {
                                          height: 36,
                                          fontSize: 12,
                                        },
                                        "& .MuiInputLabel-root": {
                                          fontSize: 12,
                                        },
                                      }}
                                    />
                                  </Box>
                                  {finalPrice != null && (
                                    <Typography
                                      sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "success.main",
                                      }}
                                    >
                                      Final ${finalPrice.toFixed(2)}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            );
                          })
                        )}
                      </Box>
                    </Paper>
                  </Stack>
                </Box>
              </Box>
            </Stack>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                pt: 1.25,
                mt: 1.25,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setActiveStep(1)}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2,
                    color: "primary.main",
                  }}
                >
                  Back
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={submitting}
                  onClick={async () => {
                    if (!currentTradeShow?.id) {
                      setError("Missing tradeshow context");
                      return;
                    }
                    if (appliedItems.length === 0) {
                      setError(
                        "Apply at least one product discount before continuing."
                      );
                      return;
                    }
                    setSubmitting(true);
                    setError(null);
                    try {
                      const currentItemNumbers = appliedItems
                        .map((a) => String(a.itemNumber))
                        .sort();
                      const savedItemNumbers =
                        lastSavedItemNumbers != null
                          ? [...lastSavedItemNumbers].sort()
                          : null;
                      const sameSet =
                        savedItemNumbers != null &&
                        currentItemNumbers.length === savedItemNumbers.length &&
                        currentItemNumbers.every(
                          (num, i) => num === savedItemNumbers[i]
                        );
                      // Normalize itemNumber to string for consistent lookup (API may return number)
                      const itemKey = (a: AppliedDiscountItem) => String(a.itemNumber ?? "");
                      // Detect if any existing item (we have id for) has changed discount/min/max/disType → will call PUT
                      const hasEdit = (a: AppliedDiscountItem) => {
                        const key = itemKey(a);
                        const saved = savedTradeShowItems[key] ?? savedTradeShowItems[a.itemNumber];
                        if (!saved?.id) return false;
                        const d = Number(saved.discount);
                        const da = Number(a.discount);
                        const discountSame = (Number.isNaN(d) && Number.isNaN(da)) || d === da;
                        const minSame = Number(saved.minQuantity) === Number(a.minQuantity);
                        const maxSame = Number(saved.maxQuantity) === Number(a.maxQuantity);
                        const disTypeSame = String(saved.disType) === String(a.disType);
                        return !(discountSame && minSame && maxSame && disTypeSame);
                      };
                      const noEditsToExisting = !appliedItems.some(hasEdit);
                      const noChange = sameSet && noEditsToExisting;

                      if (noChange) {
                        setActiveStep(3);
                        setSubmitting(false);
                        return;
                      }

                      const appliedItemNumberSet = new Set(
                        appliedItems.map((a) => String(a.itemNumber))
                      );
                      const removedItemNumbers =
                        lastSavedItemNumbers != null
                          ? lastSavedItemNumbers.filter(
                              (num) => !appliedItemNumberSet.has(String(num))
                            )
                          : [];
                      if (removedItemNumbers.length > 0) {
                        const removedChunks = chunkArray(
                          removedItemNumbers,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of removedChunks) {
                          await deleteBulkTradeShowItems(
                            currentTradeShow.id,
                            chunk
                          );
                        }
                        setSavedTradeShowItems((prev) => {
                          const next = { ...prev };
                          removedItemNumbers.forEach((num) => {
                            delete next[String(num)];
                            delete next[num];
                          });
                          return next;
                        });
                      }

                      // Existing items (in lastSaved) that have id and changed -> PUT only changed items
                      const savedSet =
                        lastSavedItemNumbers != null
                          ? new Set(lastSavedItemNumbers.map((n) => String(n)))
                          : null;
                      const existingAppliedItems =
                        savedSet != null
                          ? appliedItems.filter((a) =>
                              savedSet.has(String(a.itemNumber))
                            )
                          : [];
                      const toUpdate: TradeShowItemBulkUpdatePayload[] =
                        existingAppliedItems.flatMap((a) => {
                          if (!hasEdit(a)) return [];
                          const key = itemKey(a);
                          const saved = savedTradeShowItems[key] ?? savedTradeShowItems[a.itemNumber];
                          if (saved?.id == null) return [];
                          return [
                            {
                              id: saved.id,
                              discount: a.discount,
                              minQuantity: a.minQuantity,
                              maxQuantity: a.maxQuantity,
                              disType: a.disType,
                            },
                          ];
                        });
                      if (toUpdate.length > 0) {
                        const updateChunks = chunkArray(
                          toUpdate,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of updateChunks) {
                          await bulkUpdateTradeShowItems(chunk);
                        }
                        setSavedTradeShowItems((prev) => {
                          const next = { ...prev };
                          existingAppliedItems.forEach((a) => {
                            if (!hasEdit(a)) return;
                            const key = itemKey(a);
                            const saved = prev[key] ?? prev[a.itemNumber];
                            if (!saved?.id) return;
                            next[key] = {
                              id: saved.id,
                              discount: a.discount,
                              minQuantity: a.minQuantity,
                              maxQuantity: a.maxQuantity,
                              disType: a.disType,
                            };
                          });
                          return next;
                        });
                      }

                      const addedAppliedItems =
                        savedSet != null
                          ? appliedItems.filter(
                              (a) => !savedSet.has(String(a.itemNumber))
                            )
                          : appliedItems;
                      if (addedAppliedItems.length > 0) {
                        const payload: TradeShowItemPayload[] =
                          addedAppliedItems.map((a) => {
                            const product = items.find(
                              (p) => p.itemNumber === a.itemNumber
                            );
                            return {
                              itemNumber: a.itemNumber,
                              discount: a.discount,
                              minQuantity: a.minQuantity,
                              maxQuantity: a.maxQuantity,
                              disType: a.disType,
                              salesCategory:
                                product?.categoryId ?? categoryIds[0] ?? 1,
                              priceClass:
                                product?.subcategoryId ?? priceClassIds[0] ?? 891,
                              description: product?.name ?? a.name ?? "",
                            };
                          });
                        const addChunks = chunkArray(
                          payload,
                          BULK_API_BATCH_SIZE
                        );
                        const allReturnedItems: Array<{
                          id: number;
                          itemNumber: string;
                          discount: string;
                          minQuantity: number;
                          maxQuantity: number;
                          disType: string;
                        }> = [];
                        for (const chunk of addChunks) {
                          const res = await bulkAssignItemsToTradeShow(
                            currentTradeShow.id,
                            chunk
                          );
                          // API returns { data: { items: [...] } } or { items: [...] }
                          const items =
                            (res as any)?.data?.items ?? res?.items ?? [];
                          if (Array.isArray(items) && items.length > 0) {
                            allReturnedItems.push(...items);
                          }
                        }
                        if (allReturnedItems.length > 0) {
                          const merged: Record<string, { id: number; discount: string; minQuantity: number; maxQuantity: number; disType: "PERCENT" | "FLAT" }> = {};
                          allReturnedItems.forEach((row: { id: number; itemNumber?: string; Item_Number?: number; item_number?: string; discount?: string; minQuantity?: number; maxQuantity?: number; disType?: string }) => {
                            const key = String(
                              row.itemNumber ?? row.Item_Number ?? row.item_number ?? ""
                            );
                            if (!key) return;
                            merged[key] = {
                              id: row.id,
                              discount: String(row.discount ?? ""),
                              minQuantity: Number(row.minQuantity ?? 0),
                              maxQuantity: Number(row.maxQuantity ?? 0),
                              disType:
                                row.disType === "PERCENT" || row.disType === "FLAT"
                                  ? row.disType
                                  : "PERCENT",
                            };
                          });
                          setSavedTradeShowItems((prev) => ({ ...prev, ...merged }));
                          dispatch(mergeSavedTradeShowItemsRedux(merged));
                        }
                      }
                      setLastSavedItemNumbers(currentItemNumbers);
                      dispatch(setLastSavedItemNumbersRedux(currentItemNumbers));
                      setActiveStep(3);
                    } catch (err) {
                      console.error("Failed to assign items", err);
                      setError(
                        "Failed to save products & discounts. Please try again."
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2.5,
                    color: "#fff",
                  }}
                >
                  {submitting ? "Saving..." : "Next"}
                </Button>
              </Stack>
              {error && (
                <Typography sx={{ fontSize: 12, color: "error.main", mt: 0.5 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {activeStep === 3 && (
          <Paper
            sx={{
              p: { xs: 1.25, md: 1.5 },
              maxWidth: 900,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              mt: 1,
              height: "calc(100vh - 260px)",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <Stack spacing={1.25}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    Select Retailers
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Choose customers to invite to this tradeshow.
                  </Typography>
                </Box>

                <Grid container spacing={1.5} sx={{ width: "100%" }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search customers..."
                      value={retailerSearch}
                      onChange={(e) => setRetailerSearch(e.target.value)}
                      sx={{
                        "& .MuiInputBase-root": { height: 36, fontSize: 12 },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl size="small" sx={{ minWidth: "100%", maxWidth: 320 }}>
                      <Select
                        value={retailerStatus}
                        onChange={(e) =>
                          setRetailerStatus(
                            e.target.value as "all" | "active" | "inactive"
                          )
                        }
                        sx={{
                          height: 36,
                          fontSize: 12,
                          "& .MuiSelect-select": { py: 0.75 },
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        multiple
                        displayEmpty
                        value={selectedCot}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedCot(typeof v === "string" ? (v ? [v] : []) : v);
                        }}
                        renderValue={(v) =>
                          v.length === 0
                            ? "Class of Trade (all)"
                            : v
                                .map((code) => cotOptions.find((c) => c.code === code)?.name ?? code)
                                .join(", ")
                        }
                        disabled={cotLoading}
                        sx={{
                          minHeight: 36,
                          fontSize: 12,
                          "& .MuiSelect-select": { py: 0.75 },
                        }}
                      >
                        <MenuItem value="" disabled>
                          Class of Trade
                        </MenuItem>
                        {cotOptions.map((opt) => (
                          <MenuItem key={opt.code} value={opt.code}>
                            {opt.name || opt.code}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {retailersLoading ? (
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Loading customers...
                  </Typography>
                ) : retailersError ? (
                  <Typography sx={{ fontSize: 12, color: "error.main" }}>
                    {retailersError}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      maxHeight: "calc(100vh - 490px)",
                      minHeight: 200,
                      overflow: "auto",
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.25,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            padding="checkbox"
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            <Checkbox
                              size="small"
                              indeterminate={
                                retailers.length > 0 &&
                                retailers.filter((r) =>
                                  selectedRetailerSet.has(r.id)
                                ).length > 0 &&
                                retailers.filter((r) =>
                                  selectedRetailerSet.has(r.id)
                                ).length < retailers.length
                              }
                              checked={
                                retailers.length > 0 &&
                                retailers.every((r) =>
                                  selectedRetailerSet.has(r.id)
                                )
                              }
                              onChange={toggleSelectAllRetailers}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Customer ID
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Customer Name
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Email
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            City
                          </TableCell>
                          <TableCell
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            State
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {retailers.map((r) => (
                          <TableRow key={r.id} sx={{ "& td": { fontSize: 12 } }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedRetailerSet.has(r.id)}
                                onChange={() => toggleRetailerSelection(r.id)}
                              />
                            </TableCell>
                            <TableCell>{r.code ?? r.id}</TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.email ?? "—"}</TableCell>
                            <TableCell>{r.city ?? "—"}</TableCell>
                            <TableCell>{r.state ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={retailersTotalCount}
                      page={retailerPage - 1}
                      onPageChange={(_, newPage) =>
                        setRetailerPage(newPage + 1)
                      }
                      rowsPerPage={retailerRowsPerPage}
                      rowsPerPageOptions={[1000, 50, 100, 500, 2000]}
                      onRowsPerPageChange={(e) => {
                        const value = Number((e.target as { value?: string }).value);
                        if (value > 0) {
                          setRetailerRowsPerPage(value);
                          setRetailerPage(1);
                        }
                      }}
                      labelRowsPerPage="Rows:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                      }
                      sx={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: 1,
                        backgroundColor: theme.palette.background.paper,
                        borderTop: 1,
                        borderColor: "divider",
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                          { fontSize: 12 },
                      }}
                    />
                  </Box>
                )}

                {error && (
                  <Typography sx={{ fontSize: 12, color: "error.main" }}>
                    {error}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                pt: 1.25,
                mt: 1.25,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setActiveStep(2)}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2,
                    color: "primary.main",
                  }}
                >
                  Back
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={submitting}
                  onClick={async () => {
                    if (!currentTradeShow?.id) {
                      setError("Missing tradeshow context");
                      return;
                    }
                    setSubmitting(true);
                    setError(null);
                    try {
                      const currentSorted = [...selectedRetailerIds].sort(
                        (a, b) => a - b
                      );
                      const savedSorted =
                        lastSavedRetailerIds != null
                          ? [...lastSavedRetailerIds].sort((a, b) => a - b)
                          : null;
                      const noChange =
                        savedSorted != null &&
                        currentSorted.length === savedSorted.length &&
                        currentSorted.every((id, i) => id === savedSorted[i]);

                      if (noChange) {
                        setActiveStep(4);
                        setSubmitting(false);
                        return;
                      }

                      const removedRetailerIds =
                        lastSavedRetailerIds != null
                          ? lastSavedRetailerIds.filter(
                              (id) => !selectedRetailerIds.includes(id)
                            )
                          : [];
                      if (removedRetailerIds.length > 0) {
                        const removedChunks = chunkArray(
                          removedRetailerIds,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of removedChunks) {
                          await deleteBulkTradeShowRetailers(
                            currentTradeShow.id,
                            chunk
                          );
                        }
                      }

                      const addedRetailerIds =
                        lastSavedRetailerIds != null
                          ? selectedRetailerIds.filter(
                              (id) => !lastSavedRetailerIds!.includes(id)
                            )
                          : selectedRetailerIds;
                      if (addedRetailerIds.length > 0) {
                        const retailerPayload = addedRetailerIds.map((id) => {
                          const r = retailers.find((x) => x.id === id);
                          return { id, name: r?.name ?? "" };
                        });
                        const addChunks = chunkArray(
                          retailerPayload,
                          BULK_API_BATCH_SIZE
                        );
                        for (const chunk of addChunks) {
                          await bulkAssignRetailersToTradeShow(
                            currentTradeShow.id,
                            chunk
                          );
                        }
                      }
                      setLastSavedRetailerIds(selectedRetailerIds);
                      dispatch(setLastSavedRetailerIdsRedux(selectedRetailerIds));
                      setActiveStep(4);
                    } catch (err) {
                      console.error("Failed to assign retailers", err);
                      setError(
                        "Failed to assign retailers. Please try again."
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  sx={{
                    height: 34,
                    fontSize: 12,
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2.5,
                    color: "#fff",
                  }}
                >
                  {submitting ? "Saving..." : "Next"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {activeStep === 4 && (
          <Paper
            sx={{
              p: { xs: 1.25, md: 1.5 },
              maxWidth: 900,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              mt: 1,
              height: "calc(100vh - 260px)",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {addProductsWeekIndex === null ? (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      Delivery Schedule
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Set up delivery dates and assign products to weeks
                    </Typography>
                  </Box>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                      <Box flex={1} minWidth={200}>
                        <DatePicker
                          label="Delivery Start Date"
                          value={startDate}
                          onChange={(d) => {
                            const next = d ?? null;
                            setStartDate(next);
                            if (next && endDate && !endDate.isAfter(next, "day")) {
                              setEndDate(null);
                            }
                            if (currentTradeShow?.id && name.trim() && tradeShowDate && next && endDate) {
                              const days =
                                endDate.endOf("day").diff(next.startOf("day"), "day") + 1;
                              const payload = {
                                name: name.trim(),
                                tradeShowDate: tradeShowDate.format("YYYY-MM-DD"),
                                deliveryStartDate: next.format("YYYY-MM-DD"),
                                deliveryEndDate: endDate.format("YYYY-MM-DD"),
                                deliveryWeeks: Math.ceil(days / 7),
                              };
                              updateTradeShow(currentTradeShow.id, payload).then(() => {
                                dispatch(setCurrentTradeShow({ id: currentTradeShow.id, ...payload }));
                              }).catch(console.error);
                            }
                          }}
                          minDate={
                            tradeShowDate
                              ? tradeShowDate.add(1, "day")
                              : today.add(1, "day")
                          }
                          disabled={!tradeShowDate}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              inputProps: { style: { fontSize: 11 } },
                              sx: {
                                "& .MuiInputBase-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiInputBase-input": {
                                  fontSize: 11,
                                  padding: "0 14px",
                                  height: 36,
                                  boxSizing: "border-box",
                                },
                                "& .MuiInputLabel-root": { fontSize: 11 },
                                "& .MuiPickersInputBase-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiPickersOutlinedInput-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiPickersInputBase-input": {
                                  fontSize: 11,
                                  padding: "0 14px",
                                  height: 36,
                                  boxSizing: "border-box",
                                },
                              },
                            },
                            day: {
                              sx: {
                                "&.Mui-selected": {
                                  color: "#fff",
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                      <Box flex={1} minWidth={200}>
                        <DatePicker
                          label="Delivery End Date"
                          value={endDate}
                          onChange={(d) => {
                            const next = d ?? null;
                            setEndDate(next);
                            if (currentTradeShow?.id && name.trim() && tradeShowDate && startDate && next) {
                              const days =
                                next.endOf("day").diff(startDate.startOf("day"), "day") + 1;
                              const payload = {
                                name: name.trim(),
                                tradeShowDate: tradeShowDate.format("YYYY-MM-DD"),
                                deliveryStartDate: startDate.format("YYYY-MM-DD"),
                                deliveryEndDate: next.format("YYYY-MM-DD"),
                                deliveryWeeks: Math.ceil(days / 7),
                              };
                              updateTradeShow(currentTradeShow.id, payload).then(() => {
                                dispatch(setCurrentTradeShow({ id: currentTradeShow.id, ...payload }));
                              }).catch(console.error);
                            }
                          }}
                          minDate={startDate ? startDate.add(1, "day") : undefined}
                          disabled={!startDate}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              inputProps: { style: { fontSize: 11 } },
                              sx: {
                                "& .MuiInputBase-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiInputBase-input": {
                                  fontSize: 11,
                                  padding: "0 14px",
                                  height: 36,
                                  boxSizing: "border-box",
                                },
                                "& .MuiInputLabel-root": { fontSize: 11 },
                                "& .MuiPickersInputBase-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiPickersOutlinedInput-root": {
                                  height: 36,
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                },
                                "& .MuiPickersInputBase-input": {
                                  fontSize: 11,
                                  padding: "0 14px",
                                  height: 36,
                                  boxSizing: "border-box",
                                },
                              },
                            },
                            day: {
                              sx: {
                                "&.Mui-selected": {
                                  color: "#fff",
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </LocalizationProvider>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, mt: 1 }}>
                    Weekly Delivery Schedule
                  </Typography>
                  {!startDate || !endDate ? (
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Set delivery start and end dates above.
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        maxHeight: "calc(100vh - 470px)",
                        overflow: "auto",
                        mt: 0.5,
                      }}
                    >
                      <Stack spacing={1}>
                        {deliveryWeekSegments.map((seg) => (
                            <Box
                              key={seg.weekIndex}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 1,
                                p: 1.25,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 1.25,
                                backgroundColor:
                                  theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,0.02)"
                                    : "rgba(0,0,0,0.02)",
                              }}
                            >
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                                  Week {seg.weekIndex + 1}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                  {seg.startDate.format("MM/DD/YYYY")} – {seg.endDate.format("MM/DD/YYYY")}
                                </Typography>
                              </Box>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setViewWeekPage(1);
                                    setViewWeekIndex(seg.weekIndex);
                                  }}
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    "&:hover": {
                                      color: theme.palette.primary.main,
                                      backgroundColor:
                                        theme.palette.mode === "dark"
                                          ? "rgba(255,255,255,0.06)"
                                          : "rgba(0,0,0,0.04)",
                                    },
                                  }}
                                  aria-label={`View Week ${seg.weekIndex + 1} products`}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setAddProductsWeekIndex(seg.weekIndex)}
                                  sx={{
                                    fontSize: 12,
                                    textTransform: "none",
                                    height: 32,
                                  }}
                                >
                                  Add Products
                                </Button>
                              </Stack>
                            </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      Add Products to Week {addProductsWeekIndex + 1}
                    </Typography>
                    {deliveryWeekSegments[addProductsWeekIndex] && (
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                        {deliveryWeekSegments[addProductsWeekIndex].startDate.format("MM/DD/YYYY")} –{" "}
                        {deliveryWeekSegments[addProductsWeekIndex].endDate.format("MM/DD/YYYY")}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <Select
                        multiple
                        value={deliveryCategoryIds}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDeliveryCategoryIds(typeof next === "string" ? [] : next);
                        }}
                        displayEmpty
                        renderValue={(selected: number[]) => {
                          if (selected.length === 0) return "All Categories";
                          if (selected.length <= 2) {
                            return selected
                              .map((id) => categories.find((c) => c.id === id)?.name ?? id)
                              .join(", ");
                          }
                          return `${selected.length} categories`;
                        }}
                        sx={{ height: 36, fontSize: 12, "& .MuiSelect-select": { py: 0.75 } }}
                      >
                        {categories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            <Checkbox size="small" checked={deliveryCategoryIds.includes(c.id)} sx={{ mr: 1 }} />
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <Select
                        multiple
                        value={deliveryPriceClassIds}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDeliveryPriceClassIds(typeof next === "string" ? [] : next);
                        }}
                        displayEmpty
                        renderValue={(selected: number[]) => {
                          if (selected.length === 0) return "All Price Classes";
                          if (selected.length <= 2) {
                            return selected
                              .map((id) => priceClassOptions.find((s) => s.id === id)?.name ?? id)
                              .join(", ");
                          }
                          return `${selected.length} price classes`;
                        }}
                        sx={{ height: 36, fontSize: 12, "& .MuiSelect-select": { py: 0.75 } }}
                      >
                        {priceClassOptions.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            <Checkbox size="small" checked={deliveryPriceClassIds.includes(s.id)} sx={{ mr: 1 }} />
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  {alreadyInWeekLoading || remainItemsLoading ? (
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Loading items...
                    </Typography>
                  ) : remainItemsError ? (
                    <Typography sx={{ fontSize: 12, color: "error.main" }}>
                      {remainItemsError}
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {/* Table 1: Products in this week */}
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>
                          Products in this week
                        </Typography>
                        <Box
                          sx={{
                            maxHeight: 280,
                            overflow: "auto",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1.25,
                          }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox" sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }} />
                                <TableCell sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>Product ID</TableCell>
                                <TableCell sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>Product Name</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {alreadyInWeekItems.map((item) => {
                                  const num = item.itemNumber ?? item.id;
                                  const numStr = String(num);
                                  return (
                                    <TableRow key={item.id} sx={{ "& td": { fontSize: 12 } }}>
                                      <TableCell padding="checkbox">
                                        <Checkbox
                                          size="small"
                                          checked={
                                            selectedRemainItemNumbers.has(num) ||
                                            selectedRemainItemNumbers.has(numStr)
                                          }
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedRemainItemNumbers((prev) =>
                                                new Set([...Array.from(prev), num])
                                              );
                                            } else {
                                              setSelectedRemainItemNumbers((prev) => {
                                                const next = new Set(prev);
                                                next.delete(num);
                                                next.delete(numStr);
                                                return next;
                                              });
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>{item.itemNumber ?? item.id}</TableCell>
                                      <TableCell>{item.name ?? "—"}</TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </Box>
                        {!alreadyInWeekLoading && !remainItemsError && (alreadyInWeekItems.length > 0 || alreadyInWeekTotal > 0) && (
                          <TablePagination
                            component="div"
                            count={alreadyInWeekTotal}
                            page={alreadyInWeekPage - 1}
                            onPageChange={(_, newPage) =>
                              setAlreadyInWeekPage(newPage + 1)
                            }
                            rowsPerPage={alreadyInWeekLimit}
                            onRowsPerPageChange={(e) => {
                              const raw = (e.target as { value?: string }).value;
                              const value = raw ? parseInt(String(raw), 10) : 0;
                              if (value > 0) {
                                setAlreadyInWeekLimit(value);
                                setAlreadyInWeekPage(1);
                              }
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            sx={{ borderTop: 1, borderColor: "divider", fontSize: 12, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 } }}
                          />
                        )}
                      </Box>

                      {/* Table 2: Add more products */}
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>
                          Add more products
                        </Typography>
                        <Box
                          sx={{
                            maxHeight: 280,
                            overflow: "auto",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1.25,
                          }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox" sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                  <Checkbox
                                    size="small"
                                    indeterminate={
                                      (() => {
                                        if (remainItems.length === 0) return false;
                                        const n = remainItems.filter(
                                          (i) =>
                                            selectedRemainItemNumbers.has(i.itemNumber ?? i.id) ||
                                            selectedRemainItemNumbers.has(String(i.itemNumber ?? i.id))
                                        ).length;
                                        return n > 0 && n < remainItems.length;
                                      })()
                                    }
                                    checked={
                                      remainItems.length > 0 &&
                                      remainItems.every(
                                        (i) =>
                                          selectedRemainItemNumbers.has(i.itemNumber ?? i.id) ||
                                          selectedRemainItemNumbers.has(String(i.itemNumber ?? i.id))
                                      )
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRemainItemNumbers((prev) =>
                                          new Set([
                                            ...Array.from(prev),
                                            ...remainItems.map((i) => i.itemNumber ?? i.id),
                                          ])
                                        );
                                      } else {
                                        const toRemove = new Set(remainItems.map((i) => i.itemNumber ?? i.id));
                                        setSelectedRemainItemNumbers((prev) => {
                                          const next = new Set(prev);
                                          toRemove.forEach((x) => {
                                            next.delete(x);
                                            next.delete(String(x));
                                          });
                                          return next;
                                        });
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>Product ID</TableCell>
                                <TableCell sx={{ fontSize: 12, fontWeight: 500, backgroundColor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>Product Name</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {remainItems.map((item) => {
                                const num = item.itemNumber ?? item.id;
                                const numStr = String(num);
                                return (
                                  <TableRow key={item.id} sx={{ "& td": { fontSize: 12 } }}>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        size="small"
                                        checked={
                                          selectedRemainItemNumbers.has(num) ||
                                          selectedRemainItemNumbers.has(numStr)
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedRemainItemNumbers((prev) =>
                                              new Set([...Array.from(prev), num])
                                            );
                                          } else {
                                            setSelectedRemainItemNumbers((prev) => {
                                              const next = new Set(prev);
                                              next.delete(num);
                                              next.delete(numStr);
                                              return next;
                                            });
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>{item.itemNumber ?? item.id}</TableCell>
                                    <TableCell>{item.name ?? "—"}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                        {!remainItemsLoading && !remainItemsError && (remainItems.length > 0 || deliveryProductTotal > 0) && (
                          <TablePagination
                            component="div"
                            count={deliveryProductTotal}
                            page={deliveryProductPage - 1}
                            onPageChange={(_, newPage) =>
                              setDeliveryProductPage(newPage + 1)
                            }
                            rowsPerPage={deliveryProductLimit}
                            onRowsPerPageChange={(e) => {
                              const raw = (e.target as { value?: string }).value;
                              const value = raw ? parseInt(String(raw), 10) : 0;
                              if (value > 0) {
                                setDeliveryProductLimit(value);
                                setDeliveryProductPage(1);
                              }
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            sx={{ borderTop: 1, borderColor: "divider", fontSize: 12, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 } }}
                          />
                        )}
                      </Box>
                    </Stack>
                  )}
                  {deliverySaveError && (
                    <Typography sx={{ fontSize: 12, color: "error.main" }}>
                      {deliverySaveError}
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => {
                        setDeliverySaveError(null);
                        setAddProductsWeekIndex(null);
                        setAddProductsInitialCheckedItemNumbers(null);
                      }}
                      sx={{
                        fontSize: 12,
                        textTransform: "none",
                        height: 34,
                        color: "primary.main",
                      }}
                    >
                      Back to Schedule
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      disabled={deliverySaveSubmitting}
                      onClick={async () => {
                        if (
                          addProductsWeekIndex === null ||
                          !currentTradeShow?.id ||
                          !deliveryWeekSegments[addProductsWeekIndex]
                        )
                          return;
                        const seg = deliveryWeekSegments[addProductsWeekIndex];
                        const weekNumber = addProductsWeekIndex + 1;
                        // initialChecked = items already in this week when modal opened (normalize to string set for comparison)
                        const initialCheckedSet = new Set(
                          (addProductsInitialCheckedItemNumbers ?? []).map(String)
                        );
                        const selectedSet = new Set(
                          Array.from(selectedRemainItemNumbers).map(String)
                        );
                        // Uncheck (remove): items that were checked but user unchecked → call delete API only (deleteBulkTradeShowDeliveryProducts)
                        const uncheckedItemNumbers = Array.from(
                          initialCheckedSet
                        ).filter((num) => !selectedSet.has(num));
                        // Add: only newly added from remain products → call trade-show-delivery-products/bulk only for these (never for removed items)
                        const newItemNumbers = Array.from(selectedSet).filter(
                          (num) => !initialCheckedSet.has(num)
                        );
                        setDeliverySaveError(null);
                        setDeliverySaveSubmitting(true);
                        try {
                          if (uncheckedItemNumbers.length > 0) {
                            const removedChunks = chunkArray(
                              uncheckedItemNumbers,
                              BULK_API_BATCH_SIZE
                            );
                            for (const chunk of removedChunks) {
                              await deleteBulkTradeShowDeliveryProducts(
                                currentTradeShow.id,
                                chunk
                              );
                            }
                          }
                          if (newItemNumbers.length > 0) {
                            const deliveries = newItemNumbers.map((num) => ({
                              itemNumber: Number(num),
                              weekNumber,
                              startDate: seg.startDate.format("YYYY-MM-DD"),
                              endDate: seg.endDate.format("YYYY-MM-DD"),
                              deliveryType: "delivery",
                            }));
                            const addChunks = chunkArray(
                              deliveries,
                              BULK_API_BATCH_SIZE
                            );
                            for (const chunk of addChunks) {
                              await bulkAssignTradeShowDeliveryProducts(
                                currentTradeShow.id,
                                chunk
                              );
                            }
                          }
                          const thisWeekItemNumbers = Array.from(
                            selectedRemainItemNumbers
                          ).map(String);
                          setWeekProductAssignments((prev) => ({
                            ...prev,
                            [addProductsWeekIndex]: thisWeekItemNumbers,
                          }));
                          setLastSavedDeliveryItemNumbers((prev) => {
                            const prevSet = new Set(prev ?? []);
                            uncheckedItemNumbers.forEach((n) =>
                              prevSet.delete(String(n))
                            );
                            thisWeekItemNumbers.forEach((n) => prevSet.add(n));
                            return Array.from(prevSet);
                          });
                          const nextSavedDelivery = Array.from(
                            new Set([
                              ...(lastSavedDeliveryItemNumbers ?? []).filter(
                                (n) => !uncheckedItemNumbers.includes(String(n))
                              ),
                              ...thisWeekItemNumbers,
                            ])
                          );
                          dispatch(setLastSavedDeliveryItemNumbersRedux(nextSavedDelivery));
                          setAddProductsWeekIndex(null);
                          setAddProductsInitialCheckedItemNumbers(null);
                        } catch (err) {
                          console.error("Failed to save delivery products", err);
                          setDeliverySaveError(
                            "Failed to save. Please try again."
                          );
                        } finally {
                          setDeliverySaveSubmitting(false);
                        }
                      }}
                      sx={{
                        fontSize: 12,
                        textTransform: "none",
                        height: 34,
                        px: 2,
                        color: "#fff",
                      }}
                    >
                      {deliverySaveSubmitting ? "Saving..." : "Save & Close"}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>
            {addProductsWeekIndex === null && (
              <Box
                sx={{
                  flexShrink: 0,
                  borderTop: 1,
                  borderColor: "divider",
                  pt: 1.25,
                  mt: 1.25,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setActiveStep(3)}
                    sx={{
                      height: 34,
                      fontSize: 12,
                      borderRadius: 1.5,
                      textTransform: "none",
                      px: 2,
                      color: "primary.main",
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    disabled={step4NextSubmitting}
                    onClick={async () => {
                      if (!currentTradeShow?.id || deliveryWeekSegments.length === 0) {
                        setActiveStep(5);
                        return;
                      }
                      const currentItemNumbers = Array.from(
                        new Set(
                          Object.values(weekProductAssignments).flat().map(String)
                        )
                      ).sort();
                      const savedSorted =
                        lastSavedDeliveryItemNumbers != null
                          ? [...lastSavedDeliveryItemNumbers].map(String).sort()
                          : null;
                      const noChange =
                        savedSorted != null &&
                        currentItemNumbers.length === savedSorted.length &&
                        currentItemNumbers.every(
                          (num, i) => num === savedSorted[i]
                        );

                      if (noChange) {
                        setActiveStep(5);
                        return;
                      }

                      setStep4NextSubmitting(true);
                      try {
                        const savedSet = (lastSavedDeliveryItemNumbers ?? []).map(String);
                        const currentSet = new Set(currentItemNumbers);

                        // Delete only: items that were saved but user unchecked — call deleteBulkTradeShowDeliveryProducts only (never call bulk add for these)
                        const removedItemNumbers = savedSet.filter(
                          (num) => !currentSet.has(num)
                        );
                        if (removedItemNumbers.length > 0) {
                          const removedChunks = chunkArray(
                            removedItemNumbers,
                            BULK_API_BATCH_SIZE
                          );
                          for (const chunk of removedChunks) {
                            await deleteBulkTradeShowDeliveryProducts(
                              currentTradeShow.id,
                              chunk
                            );
                          }
                        }

                        // Add only: first time (no lastSaved) → all selected; back on step → only newly added. Call trade-show-delivery-products/bulk only when there are new items.
                        const addedItemNumbers =
                          lastSavedDeliveryItemNumbers != null
                            ? currentItemNumbers.filter(
                                (num) => !savedSet.includes(String(num))
                              )
                            : currentItemNumbers;
                        if (addedItemNumbers.length > 0) {
                          const addedDeliveries = deliveryWeekSegments.flatMap(
                            (seg, idx) => {
                              const weekItemNumbers = (
                                weekProductAssignments[idx] ?? []
                              ).map(String);
                              const weekNumber = idx + 1;
                              return weekItemNumbers
                                .filter((itemNum) =>
                                  addedItemNumbers.includes(itemNum)
                                )
                                .map((itemNum) => ({
                                  itemNumber: Number(itemNum),
                                  weekNumber,
                                  startDate: seg.startDate.format("YYYY-MM-DD"),
                                  endDate: seg.endDate.format("YYYY-MM-DD"),
                                  deliveryType: "delivery",
                                }));
                            }
                          );
                          if (addedDeliveries.length > 0) {
                            const addChunks = chunkArray(
                              addedDeliveries,
                              BULK_API_BATCH_SIZE
                            );
                            for (const chunk of addChunks) {
                              await bulkAssignTradeShowDeliveryProducts(
                                currentTradeShow.id,
                                chunk
                              );
                            }
                          }
                        }
                        setLastSavedDeliveryItemNumbers(currentItemNumbers);
                        dispatch(setLastSavedDeliveryItemNumbersRedux(currentItemNumbers));
                        setActiveStep(5);
                      } catch (err) {
                        console.error(
                          "Failed to sync delivery products",
                          err
                        );
                        setDeliverySaveError(
                          "Failed to sync delivery. Please try again."
                        );
                      } finally {
                        setStep4NextSubmitting(false);
                      }
                    }}
                    sx={{
                      height: 34,
                      fontSize: 12,
                      borderRadius: 1.5,
                      textTransform: "none",
                      px: 2.5,
                      color: "#fff",
                    }}
                  >
                   {step4NextSubmitting ? "Saving..." : "Save & Finish"}
                  </Button>
                </Stack>
              </Box>
            )}
            <Dialog
              open={viewWeekIndex !== null}
              onClose={() => setViewWeekIndex(null)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 1.5,
                  height: "40vh",
                  maxHeight: "calc(100vh - 180px)",
                },
              }}
            >
              <DialogTitle sx={{ fontSize: 14, fontWeight: 500 }}>
                {viewWeekIndex !== null && (
                  <>
                    Week {viewWeekIndex + 1} – Products
                    {deliveryWeekSegments[viewWeekIndex] && (
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 400,
                          color: "text.secondary",
                          mt: 0.25,
                        }}
                      >
                        {deliveryWeekSegments[viewWeekIndex].startDate.format("MM/DD/YYYY")} –{" "} 
                        {deliveryWeekSegments[viewWeekIndex].endDate.format("MM/DD/YYYY")}
                      </Typography>
                    )}
                  </>
                )}
              </DialogTitle>
              <DialogContent dividers sx={{ minHeight: 200, p: 0 }}>
                {viewWeekItemsLoading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={120}
                  >
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Loading...
                    </Typography>
                  </Box>
                ) : viewWeekItemsError ? (
                  <Typography
                    sx={{ fontSize: 12, color: "error.main", p: 2 }}
                  >
                    {viewWeekItemsError}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      maxHeight: "calc(100vh - 320px)",
                      overflow: "auto",
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            Product ID
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: theme.palette.background.paper,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            Product Name
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewWeekItems.map((item) => (
                          <TableRow key={item.id} sx={{ "& td": { fontSize: 12 } }}>
                            <TableCell>{item.itemNumber ?? item.id}</TableCell>
                            <TableCell>{item.name ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {!viewWeekItemsLoading && !viewWeekItemsError && (viewWeekItems.length > 0 || viewWeekTotal > 0) && (
                      <TablePagination
                        component="div"
                        count={viewWeekTotal}
                        page={viewWeekPage - 1}
                        onPageChange={(_, newPage) =>
                          setViewWeekPage(newPage + 1)
                        }
                        rowsPerPage={viewWeekLimit}
                        onRowsPerPageChange={(e) => {
                          const raw = (e.target as { value?: string }).value;
                          const value = raw ? parseInt(String(raw), 10) : 0;
                          if (value > 0) {
                            setViewWeekLimit(value);
                            setViewWeekPage(1);
                          }
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        sx={{
                          borderTop: 1,
                          borderColor: "divider",
                          fontSize: 12,
                          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                            { fontSize: 12 },
                        }}
                      />
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2, py: 1.5 }}>
                <Button
                  size="small"
                  onClick={() => setViewWeekIndex(null)}
                  sx={{ fontSize: 12, textTransform: "none" }}
                >
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        )}

        {activeStep === 5 && (
          <Paper
            sx={{
              p: { xs: 1.5, md: 2 },
              maxWidth: 960,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              mx: "auto",
              mt: 0.5,
              height: "calc(100vh - 260px)",
              display: "flex",
              flexDirection: "column",
              boxShadow: theme.palette.mode === "dark" ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
            }}
            elevation={0}
          >
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontSize: 16, color: "text.primary" }}>
                Summary
              </Typography>
              {summaryLoading ? (
                <Typography sx={{ fontSize: 13, color: "text.secondary", py: 2 }}>Loading summary...</Typography>
              ) : summaryError ? (
                <Typography sx={{ fontSize: 13, color: "error.main", py: 2 }}>{summaryError}</Typography>
              ) : summaryData ? (
                <Stack spacing={2}>
                  {/* Trade show info — hero card */}
                  <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.primary" }}>Trade Show</Typography>
                    </Box>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ fontSize: 13 }}>
                        <Chip size="small" label={summaryData.tradeShow.name || "—"} sx={{ fontWeight: 500 }} />
                        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>Date: {summaryData.tradeShow.tradeShowDate ? dayjs(summaryData.tradeShow.tradeShowDate).format("MM/DD/YYYY") : "—"}</Typography>
                        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>Delivery: {summaryData.tradeShow.deliveryStartDate ? dayjs(summaryData.tradeShow.deliveryStartDate).format("MM/DD/YYYY") : "—"} – {summaryData.tradeShow.deliveryEndDate ? dayjs(summaryData.tradeShow.deliveryEndDate).format("MM/DD/YYYY") : "—"}</Typography>
                        <Chip size="small" variant="outlined" label={`${summaryData.tradeShow.deliveryWeeks ?? 0} weeks`} />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Products */}
                  <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
                    <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Products</Typography>
                      <Tooltip title="View all products">
                        <IconButton size="small" color="primary" onClick={() => { setSummaryViewProductsPage(0); setSummaryViewProductsOpen(true); }} sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Item #</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Description</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Discount</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Min / Max</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(summaryData.data ?? []).map((row) => (
                            <TableRow key={row.id} sx={{ "& td": { fontSize: 12, py: 0.75 }, "&:hover": { bgcolor: theme.palette.action.hover } }}>
                              <TableCell>{row.itemNumber ?? "—"}</TableCell>
                              <TableCell>{row.description ?? "—"}</TableCell>
                              <TableCell>{row.discount ?? "—"}</TableCell>
                              <TableCell>{row.minQuantity ?? "—"} / {row.maxQuantity ?? "—"}</TableCell>
                              <TableCell>{row.disType ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>

                  {/* Vendors */}
                  <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
                    <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Vendors</Typography>
                      <Tooltip title="View all vendors">
                        <IconButton size="small" color="primary" onClick={() => { setSummaryViewVendorsPage(0); setSummaryViewVendorsOpen(true); }} sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>ID</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Description</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Contact</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(summaryData.vendors ?? []).map((v, idx) => (
                            <TableRow key={v.Primary_Vendor ?? idx} sx={{ "& td": { fontSize: 12, py: 0.75 }, "&:hover": { bgcolor: theme.palette.action.hover } }}>
                              <TableCell>{v.Primary_Vendor ?? "—"}</TableCell>
                              <TableCell>{v.V_Description ?? "—"}</TableCell>
                              <TableCell sx={{ fontSize: 11 }}>{[v.V_Email, v.V_Phone].filter(Boolean).join(" · ") || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>

                  {/* Retailers */}
                  {(summaryData.retails?.rows?.length ?? 0) > 0 && (
                    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
                      <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Retailers</Typography>
                        <Tooltip title="View all retailers">
                          <IconButton size="small" color="primary" onClick={() => { setSummaryViewRetailersPage(0); setSummaryViewRetailersOpen(true); }} sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>ID</TableCell>
                              <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Name</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(summaryData.retails?.rows ?? []).map((r, idx) => (
                              <TableRow key={r.retailerId ?? idx} sx={{ "& td": { fontSize: 12, py: 0.75 }, "&:hover": { bgcolor: theme.palette.action.hover } }}>
                                <TableCell>{r.retailerId ?? "—"}</TableCell>
                                <TableCell>{r.retailerName ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Card>
                  )}

                  {/* Delivery by Week */}
                  {(summaryData.weekWiseCounts?.length ?? 0) > 0 && (
                    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
                      <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Delivery by Week</Typography>
                      </Box>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Week</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Start Date</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>End Date</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Products</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 1, backgroundColor: theme.palette.background.paper }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(summaryData.weekWiseCounts ?? []).map((w) => {
                            const hasDeliveryDates = summaryData.tradeShow?.deliveryStartDate && summaryData.tradeShow?.deliveryEndDate;
                            const deliveryStart = hasDeliveryDates ? dayjs(summaryData.tradeShow!.deliveryStartDate) : null;
                            const deliveryEnd = hasDeliveryDates ? dayjs(summaryData.tradeShow!.deliveryEndDate) : null;
                            const weekStart = deliveryStart ? deliveryStart.add((w.weekNumber - 1) * 7, "day") : null;
                            const weekEnd = weekStart && deliveryEnd
                              ? (deliveryEnd.isBefore(weekStart.add(6, "day")) ? deliveryEnd : weekStart.add(6, "day"))
                              : null;
                            return (
                              <TableRow key={w.weekNumber} sx={{ "& td": { fontSize: 12, py: 0.75 }, "&:hover": { bgcolor: theme.palette.action.hover } }}>
                                <TableCell>Week {w.weekNumber}</TableCell>
                                <TableCell>{weekStart ? weekStart.format("MM/DD/YYYY") : "—"}</TableCell>
                                <TableCell>{weekEnd ? weekEnd.format("MM/DD/YYYY") : "—"}</TableCell>
                                <TableCell><Chip size="small" label={w.count ?? 0} variant="outlined" /></TableCell>
                                <TableCell>
                                  <Tooltip title="View products in this week">
                                    <IconButton size="small" color="primary" onClick={() => { setSummaryViewWeekProductsPage(0); setSummaryViewWeekProductsWeek(w.weekNumber); setSummaryViewWeekProductsOpen(true); }} sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
                                      <VisibilityOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </Stack>
              ) : null}
            </Box>
            <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider", pt: 1.5, mt: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => setActiveStep(4)} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 2 }}>Back</Button>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    dispatch(clearCurrentTradeShow());
                    clearTradeshowDraft();
                    persistor.flush().then(() => navigate("/admin/tradeshow-management"));
                  }}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 2.5, color: "white" }}
                >
                  Close
                </Button>
              </Stack>
            </Box>

            {/* View All Products — debounced search, pagination, improved UI */}
            <Dialog open={summaryViewProductsOpen} onClose={() => setSummaryViewProductsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, boxShadow: 24, overflow: "hidden" } }}>
              <DialogTitle sx={{ fontSize: 15, fontWeight: 600, px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>View All Products</DialogTitle>
              <DialogContent sx={{ p: 2.5, "&.MuiDialogContent-root": { pt: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
                  <TextField size="small" placeholder="Search by item # (debounced)" value={summaryViewProductsSearch} onChange={(e) => setSummaryViewProductsSearch(e.target.value)} sx={{ minWidth: 200 }} />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select value={summaryViewProductsDisType} onChange={(e) => setSummaryViewProductsDisType((e.target.value as "PERCENT" | "FLAT") || "")} displayEmpty>
                      <MenuItem value="">All types</MenuItem>
                      <MenuItem value="PERCENT">PERCENT</MenuItem>
                      <MenuItem value="FLAT">FLAT</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                {summaryViewProductsLoading ? <Typography sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>Loading...</Typography> : (
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", bgcolor: theme.palette.background.paper }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Item #</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Discount</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Min</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Max</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryViewProductsList.map((row: any, idx: number) => (
                          <TableRow key={row.id ?? idx} sx={{ "&:hover": { bgcolor: theme.palette.action.hover } }}>
                            <TableCell sx={{ fontSize: 12 }}>{row.itemNumber ?? row.inventory?.Item_Number ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.description ?? row.inventory?.Description ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.discount ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.minQuantity ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.maxQuantity ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.disType ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      size="small"
                      component="div"
                      count={summaryViewProductsTotal}
                      page={summaryViewProductsPage}
                      onPageChange={(_, p) => setSummaryViewProductsPage(p)}
                      rowsPerPage={summaryViewProductsRowsPerPage}
                      onRowsPerPageChange={(e) => { setSummaryViewProductsRowsPerPage(parseInt(e.target.value, 10)); setSummaryViewProductsPage(0); }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Rows:"
                      sx={{ borderTop: 1, borderColor: "divider" }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <Button size="small" variant="outlined" onClick={() => setSummaryViewProductsOpen(false)} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>Close</Button>
              </DialogActions>
            </Dialog>

            {/* View All Vendors — debounced search, pagination, improved UI */}
            <Dialog open={summaryViewVendorsOpen} onClose={() => setSummaryViewVendorsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, boxShadow: 24, overflow: "hidden" } }}>
              <DialogTitle sx={{ fontSize: 15, fontWeight: 600, px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>View All Vendors</DialogTitle>
              <DialogContent sx={{ p: 2.5, "&.MuiDialogContent-root": { pt: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <TextField size="small" placeholder="Search by vendor name or ID (debounced)" value={summaryViewVendorsSearch} onChange={(e) => setSummaryViewVendorsSearch(e.target.value)} sx={{ minWidth: 260 }} />
                </Stack>
                {summaryViewVendorsLoading ? <Typography sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>Loading...</Typography> : (
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", bgcolor: theme.palette.background.paper }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>City</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>State</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryViewVendorsList.map((v: any, idx: number) => (
                          <TableRow key={v.id ?? v.vendorId ?? v.vendor?.Primary_Vendor ?? idx} sx={{ "&:hover": { bgcolor: theme.palette.action.hover } }}>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendorId ?? v.vendor?.Primary_Vendor ?? v.id ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendorName ?? v.vendor?.V_Description ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendor?.V_Email ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendor?.V_Phone ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendor?.V_City ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{v.vendor?.V_State ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      size="small"
                      component="div"
                      count={summaryViewVendorsTotal}
                      page={summaryViewVendorsPage}
                      onPageChange={(_, p) => setSummaryViewVendorsPage(p)}
                      rowsPerPage={summaryViewVendorsRowsPerPage}
                      onRowsPerPageChange={(e) => { setSummaryViewVendorsRowsPerPage(parseInt(e.target.value, 10)); setSummaryViewVendorsPage(0); }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Rows:"
                      sx={{ borderTop: 1, borderColor: "divider" }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <Button size="small" variant="outlined" onClick={() => setSummaryViewVendorsOpen(false)} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>Close</Button>
              </DialogActions>
            </Dialog>

            {/* View All Retailers — debounced search, pagination, improved UI */}
            <Dialog open={summaryViewRetailersOpen} onClose={() => setSummaryViewRetailersOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, boxShadow: 24, overflow: "hidden" } }}>
              <DialogTitle sx={{ fontSize: 15, fontWeight: 600, px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>View All Retailers</DialogTitle>
              <DialogContent sx={{ p: 2.5, "&.MuiDialogContent-root": { pt: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <TextField size="small" placeholder="Search by retailer name or ID (debounced)" value={summaryViewRetailersSearch} onChange={(e) => setSummaryViewRetailersSearch(e.target.value)} sx={{ minWidth: 260 }} />
                </Stack>
                {summaryViewRetailersLoading ? <Typography sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>Loading...</Typography> : (
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", bgcolor: theme.palette.background.paper }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>City</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>State</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryViewRetailersList.map((r: any, idx: number) => (
                          <TableRow key={r.id ?? r.retailerId ?? r.retailer?.C_Number ?? idx} sx={{ "&:hover": { bgcolor: theme.palette.action.hover } }}>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailerId ?? r.retailer?.C_Number ?? r.id ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailerName ?? r.retailer?.C_Name ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailer?.C_Email ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailer?.C_Phone ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailer?.C_City ?? "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.retailer?.C_State ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      size="small"
                      component="div"
                      count={summaryViewRetailersTotal}
                      page={summaryViewRetailersPage}
                      onPageChange={(_, p) => setSummaryViewRetailersPage(p)}
                      rowsPerPage={summaryViewRetailersRowsPerPage}
                      onRowsPerPageChange={(e) => { setSummaryViewRetailersRowsPerPage(parseInt(e.target.value, 10)); setSummaryViewRetailersPage(0); }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Rows:"
                      sx={{ borderTop: 1, borderColor: "divider" }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <Button size="small" variant="outlined" onClick={() => setSummaryViewRetailersOpen(false)} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>Close</Button>
              </DialogActions>
            </Dialog>

            {/* View Week Products — pagination, improved UI */}
            <Dialog open={summaryViewWeekProductsOpen} onClose={() => { setSummaryViewWeekProductsOpen(false); setSummaryViewWeekProductsWeek(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, boxShadow: 24, overflow: "hidden" } }}>
              <DialogTitle sx={{ fontSize: 15, fontWeight: 600, px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>Week {summaryViewWeekProductsWeek ?? ""} — Products</DialogTitle>
              <DialogContent sx={{ p: 2.5, "&.MuiDialogContent-root": { pt: 2 } }}>
                {summaryViewWeekProductsLoading ? <Typography sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>Loading...</Typography> : (
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", bgcolor: theme.palette.background.paper }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Product ID</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.25, fontSize: 12 }}>Product Name</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryViewWeekProductsList.map((item, idx) => (
                          <TableRow key={item.id ?? idx} sx={{ "&:hover": { bgcolor: theme.palette.action.hover } }}><TableCell sx={{ fontSize: 12 }}>{item.itemNumber ?? item.id}</TableCell><TableCell sx={{ fontSize: 12 }}>{item.name ?? "—"}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      size="small"
                      component="div"
                      count={summaryViewWeekProductsTotal}
                      page={summaryViewWeekProductsPage}
                      onPageChange={(_, p) => setSummaryViewWeekProductsPage(p)}
                      rowsPerPage={summaryViewWeekProductsRowsPerPage}
                      onRowsPerPageChange={(e) => { setSummaryViewWeekProductsRowsPerPage(parseInt(e.target.value, 10)); setSummaryViewWeekProductsPage(0); }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Rows:"
                      sx={{ borderTop: 1, borderColor: "divider" }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <Button size="small" variant="outlined" onClick={() => { setSummaryViewWeekProductsOpen(false); setSummaryViewWeekProductsWeek(null); }} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>Close</Button>
              </DialogActions>
            </Dialog>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default CreateTradeshow;

