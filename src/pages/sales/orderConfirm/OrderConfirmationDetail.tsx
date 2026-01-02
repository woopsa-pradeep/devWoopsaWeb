import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, Tabs, Tab } from '@mui/material';
import { KeyboardBackspaceOutlined, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';
import CommonModal from '../../../component/atoms/CommonModal';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import {
  fetchOrderConfirmationList,
  fetchOrderConfirmationDetails,
  updateOrderConfirmationThunk,
  setCurrentOrderNumber,
  setIsScanning,
  addScannedItem,
  clearScannedItems,
  updateConfirmedLine,
  clearOrderDetails,
  resetConfirmedLines,
  OrderDetailItem,
} from '../../../redux/slices/orderConfirmSlice';
import toast from 'react-hot-toast';
import image from '../../../assets/Default-Product-Image.jpg';
import dayjs from 'dayjs';
import type { LabelSize } from '../../../utils/labelGenerator';
import { generateBarcode } from '../../../utils/labelGenerator';
import { getSalesCategoryList } from '../../../redux/apis/distrubutor/listApis';
import { getInventoryItemsForOrderConfirmation, placeOrderForCustomer } from '../../../redux/apis/sales/orderConfirmApis';
import { roundPrepaidTax } from '../../../utils/prepaidTaxUtils';

const OrderConfirmationDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'restart', 'continue', or 'review'
  const isReviewMode = mode === 'review';
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const {
    currentOrderNumber,
    orderHeader,
    orderDetails,
    detailsLoading,
    isScanning,
    confirmedLines,
    updateLoading,
    orderList,
  } = useAppSelector((state) => state.orderConfirm);

  const [isCapturingUPC, setIsCapturingUPC] = useState(false);
  const [upcBuffer, setUpcBuffer] = useState('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentOrderline, setCurrentOrderline] = useState<number>(0);
  const [currentActiveLine, setCurrentActiveLine] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [modalManuallyClosed, setModalManuallyClosed] = useState(false);
  const [editingLineNumber, setEditingLineNumber] = useState<number | null>(null);
  const [manualQuantity, setManualQuantity] = useState<string>('');
  const [noUPCModalOpen, setNoUPCModalOpen] = useState(false);
  const [noUPCLineNumber, setNoUPCLineNumber] = useState<number | null>(null);
  const [bundlesModalOpen, setBundlesModalOpen] = useState(false);
  const [bundlesValue, setBundlesValue] = useState<string>('');
  const [bundleSizeModalOpen, setBundleSizeModalOpen] = useState(false);
  const [selectedBundleSize, setSelectedBundleSize] = useState<LabelSize>('4x6');
  const [pendingBundlesCount, setPendingBundlesCount] = useState<number | null>(null);
  const [bundlePrintConfirmationModalOpen, setBundlePrintConfirmationModalOpen] = useState(false);
  const [bundlePrintConfirmationData, setBundlePrintConfirmationData] = useState<{
    bundlesCount: number;
    size: LabelSize;
    isReviewMode: boolean;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs()); // For real-time clock updates
  const [pageOpenTime, setPageOpenTime] = useState<dayjs.Dayjs | null>(null); // Track when page opened for not confirmed orders
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('pending'); // Tab state - default to pending
  const [salesCategorySummaryModalOpen, setSalesCategorySummaryModalOpen] = useState(false);
  const [salesCategorySummaryData, setSalesCategorySummaryData] = useState<Array<{
    salesCategory: number;
    categoryDesc: string;
    totalOrderedQty: number;
    totalShippedQty: number;
    totalOrderedPrice: number;
    totalShippedPrice: number;
  }>>([]);
  const [loadingSalesCategorySummary, setLoadingSalesCategorySummary] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [scannedUPCForSearch, setScannedUPCForSearch] = useState<string>('');
  const [addProductQuantity, setAddProductQuantity] = useState<string>('1');
  const addProductQuantityRef = useRef<string>('1');
  const [manualAddItemModalOpen, setManualAddItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingInventory, setSearchingInventory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addingSelectedProduct, setAddingSelectedProduct] = useState(false);
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<string>('1');
  const selectedProductQuantityRef = useRef<string>('1');
  const location = useLocation();
  
  const previousLocationRef = useRef<string | null>(null);
  const hasSavedRef = useRef(false);
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent duplicate saves
  const isReviewModeRef = useRef(isReviewMode);
  // Refs to store latest values for route change detection (prevents effect from running on state changes)
  const confirmedLinesRef = useRef(confirmedLines);
  const orderDetailsRef = useRef(orderDetails);
  const currentOrderNumberRef = useRef(currentOrderNumber);
  const currentOrderlineRef = useRef(currentOrderline);
  const isOrderCompletedRef = useRef(isOrderCompleted);

  // Enable scanning by default (unless in review mode)
  useEffect(() => {
    if (!isReviewMode) {
      dispatch(setIsScanning(true));
    } else {
      dispatch(setIsScanning(false));
    }
  }, [dispatch, isReviewMode]);

  // Get bundles from order list for review mode
  const getBundlesFromOrderList = useCallback((): number => {
    if (!currentOrderNumber || !orderList.length) return 0;
    const orderItem = orderList.find((item) => item.Order_Number === currentOrderNumber);
    // Access bunddles property (from API response, not in type definition)
    return (orderItem as any)?.Bundles || 0;
  }, [currentOrderNumber, orderList]);

  // Fetch order list to get salesRep and Bundles (needed for display and print)
  useEffect(() => {
    if (orderId) {
      const orderNumber = parseInt(orderId, 10);
      // Fetch order list to ensure salesRep and Bundles are available
      // Only fetch if orderList is empty or doesn't contain this order
      const hasOrderInList = orderList.some((item) => item.Order_Number === orderNumber);
      if (!hasOrderInList || orderList.length === 0) {
        // Fetch order list with search by order number, or fetch recent orders
        dispatch(
          fetchOrderConfirmationList({
            page: 1,
            limit: 50, // Fetch enough orders to likely include the current one
            search: orderNumber.toString(), // Try searching by order number
          })
        );
      }
    }
  }, [orderId, dispatch, orderList]);

  // Fetch order details
  useEffect(() => {
    if (orderId) {
      const orderNumber = parseInt(orderId, 10);
      dispatch(setCurrentOrderNumber(orderNumber));
      dispatch(fetchOrderConfirmationDetails(orderNumber));
      
      // Get current_orderline from order list if in continue mode
      if (mode === 'continue') {
        const orderItem = orderList.find((item) => item.Order_Number === orderNumber);
        if (orderItem?.isOrderConfirmed?.current_orderline) {
          const confirmedLine = orderItem.isOrderConfirmed.current_orderline;
          setCurrentOrderline(confirmedLine);
        }
      } else {
        // Restart mode - start from line 1
        setCurrentOrderline(0);
      }
    }
    
    return () => {
      // Cleanup will be handled by the unmount effect which saves and clears data
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [orderId, mode, dispatch, orderList]);

  // Set page open time for not confirmed orders (start timer from 0)
  useEffect(() => {
    if (orderId && orderList.length > 0) {
      const orderNumber = parseInt(orderId, 10);
      const currentOrder = orderList.find((item) => item.Order_Number === orderNumber);
      
      // If order is not confirmed (no isOrderConfirmed or status is "Not Confirmed"), start timer from now
      if (currentOrder && (!currentOrder.isOrderConfirmed || currentOrder.status === 'Not Confirmed')) {
        setPageOpenTime(dayjs());
      } else {
        // Reset pageOpenTime for confirmed/pending orders
        setPageOpenTime(null);
      }
    } else {
      setPageOpenTime(null);
    }
  }, [orderId, orderList]);

  // Initialize confirmed lines for continue mode
  useEffect(() => {
    if (mode === 'continue' && orderDetails.length > 0) {
      // Use actual Quantity_Shipped from API, not assume all lines <= currentOrderline are fully confirmed
      // Only mark lines as confirmed if they are actually fully scanned (Quantity_Shipped === Quantity_Ordered)
      orderDetails.forEach((item: OrderDetailItem) => {
        const quantityShipped = item.Quantity_Shipped || 0;
        
        // Update confirmedLines with actual API values
        dispatch(
          updateConfirmedLine({
            lineNumber: item.Line_Number,
            quantityShipped: quantityShipped, // Use actual Quantity_Shipped from API
            scanned: false, // Not scanned in this session (loaded from saved state)
          })
        );
      });
      
      // Find the next incomplete line to set as active
      const sortedLines = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number);
      const nextIncompleteLine = sortedLines.find((item: OrderDetailItem) => {
        // Skip lines that are already fully confirmed (from previous session)
        if (item.Line_Number <= currentOrderline) {
          // Only skip if it's actually fully scanned
          return item.Quantity_Shipped !== item.Quantity_Ordered;
        }
        // For lines > currentOrderline, check if they're incomplete
        return item.Quantity_Shipped !== item.Quantity_Ordered;
      });
      
      if (nextIncompleteLine) {
        setCurrentActiveLine(nextIncompleteLine.Line_Number);
      } else {
        // All items are complete, or find first incomplete line regardless of currentOrderline
        const firstIncomplete = sortedLines.find((item: OrderDetailItem) => 
          item.Quantity_Shipped !== item.Quantity_Ordered
        );
        setCurrentActiveLine(firstIncomplete ? firstIncomplete.Line_Number : null);
      }
    } else if (mode === 'restart' || !mode) {
      // In restart mode or new order, start from the first line
      if (orderDetails.length > 0) {
        const firstLine = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number)[0];
        setCurrentActiveLine(firstLine.Line_Number);
      }
    }
  }, [mode, currentOrderline, orderDetails, dispatch]);

  // Update current active line when a line is completed
  useEffect(() => {
    if (!currentActiveLine || !orderDetails.length) return;

    const activeLineItem = orderDetails.find((item: OrderDetailItem) => item.Line_Number === currentActiveLine);
    if (!activeLineItem) return;

    const confirmed = confirmedLines[currentActiveLine];
    // If current active line is fully scanned, move to next line
    if (confirmed && confirmed.quantityShipped >= activeLineItem.Quantity_Ordered) {
      // Find next incomplete line (allow scanning all items, not just after currentOrderline)
      const sortedLines = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number);
      const nextIncompleteLine = sortedLines.find((item: OrderDetailItem) => {
        const lineConfirmed = confirmedLines[item.Line_Number];
        return !lineConfirmed || lineConfirmed.quantityShipped < item.Quantity_Ordered;
      });
      setCurrentActiveLine(nextIncompleteLine ? nextIncompleteLine.Line_Number : null);
    }
  }, [confirmedLines, currentActiveLine, orderDetails, mode, currentOrderline]);

  // Update refs whenever values change (for route change detection)
  useEffect(() => {
    confirmedLinesRef.current = confirmedLines;
  }, [confirmedLines]);
  
  useEffect(() => {
    orderDetailsRef.current = orderDetails;
  }, [orderDetails]);
  
  useEffect(() => {
    currentOrderNumberRef.current = currentOrderNumber;
  }, [currentOrderNumber]);
  
  useEffect(() => {
    currentOrderlineRef.current = currentOrderline;
  }, [currentOrderline]);
  
  useEffect(() => {
    isOrderCompletedRef.current = isOrderCompleted;
  }, [isOrderCompleted]);

  useEffect(() => {
    isReviewModeRef.current = isReviewMode;
  }, [isReviewMode]);

  // Update current time every second for real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear scan message after 3 seconds
  useEffect(() => {
    if (scanMessage.text) {
      const timer = setTimeout(() => {
        setScanMessage({ text: '', type: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scanMessage.text]);

  // Reset save flag when new items are scanned (after a previous save)
  useEffect(() => {
    const scannedCount = Object.keys(confirmedLines).filter(
      (lineNum) => confirmedLines[parseInt(lineNum)]?.scanned
    ).length;
    const hasItems = scannedCount > 0;
    
    // Reset save flag when new items are scanned (after a previous save)
    if (hasItems && hasSavedRef.current) {
      // Check if there are new scanned items since last save
      hasSavedRef.current = false;
    }
  }, [confirmedLines]);

  // Helper function to build orderDetailArray with Confirmed field
  const buildOrderDetailArray = useCallback((
    items: OrderDetailItem[],
    orderNumber: number,
    confirmedLinesData: typeof confirmedLines,
    status: 'pending' | 'completed'
  ) => {
    return items.map((item: OrderDetailItem) => {
      const confirmed = confirmedLinesData[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? item.Quantity_Shipped ?? 0;
      
      // Determine Confirmed value based on status
      let confirmedValue = 0;
      if (status === 'completed') {
        // If status is completed, all items are confirmed
        confirmedValue = 1;
      } else if (status === 'pending') {
        // If status is pending, check if Quantity_Ordered === Quantity_Shipped
        confirmedValue = item.Quantity_Ordered === quantityShipped ? 1 : 0;
      }
      
      return {
        Order_Number: orderNumber,
        Line_Number: item.Line_Number,
        Quantity_Ordered: item.Quantity_Ordered,
        Quantity_Shipped: quantityShipped,
        Confirmed: confirmedValue,
      };
    });
  }, []);

  // Function to save progress automatically
  const saveProgress = useCallback(async (silent: boolean = false, force: boolean = false) => {
    // Don't save if in review mode or order is already completed
    if (isReviewMode || isOrderCompleted) {
      return;
    }
    
    if (!currentOrderNumber || !orderDetails.length) {
      return;
    }
    
    // Allow force save even if already saved (for cancel button, page leave, etc.)
    if (!force && (isSaving || hasSavedRef.current)) {
      return;
    }

    try {
      setIsSaving(true);
      hasSavedRef.current = true;

      // Get all order items with their current quantity shipped (even if 0)
      // Include all items, not just fully scanned ones
      const orderDetailArray = buildOrderDetailArray(
        orderDetails,
        currentOrderNumber,
        confirmedLines,
        'pending'
      );

      // Get the highest line number that's been fully scanned, or use currentOrderline
      const fullyScannedItems = orderDetailArray.filter(
        (item) => item.Quantity_Shipped === item.Quantity_Ordered
      );
      const maxScannedLine = fullyScannedItems.length > 0
        ? Math.max(...fullyScannedItems.map((item) => item.Line_Number))
        : currentOrderline;

      // Call update API with status pending (always call, even if no items scanned)
      await dispatch(
        updateOrderConfirmationThunk({
          orderNumber: currentOrderNumber,
          status: 'pending',
          current_orderline: maxScannedLine,
          orderDetail: orderDetailArray,
        })
      ).unwrap();

      // Clear Redux data after successful save
      dispatch(clearOrderDetails());
      dispatch(clearScannedItems());
      dispatch(resetConfirmedLines());
      dispatch(setCurrentOrderNumber(null));
      dispatch(setIsScanning(false));

      if (!silent) {
        toast.success('Progress saved successfully');
      }
    } catch (error: any) {
      console.error('Failed to save progress:', error);
      hasSavedRef.current = false; // Reset so it can retry
      if (!silent) {
        toast.error(error || 'Failed to save progress');
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentOrderNumber, isSaving, orderDetails, confirmedLines, currentOrderline, dispatch, isOrderCompleted, isReviewMode, buildOrderDetailArray]);

  // Handle page leave warning (browser close/refresh)
  // Only save if order is NOT completed and NOT in review mode
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!isReviewMode && !isOrderCompleted && currentOrderNumber && orderDetails.length > 0) {
      // Try to save using sendBeacon (works even when page is closing)
      // Always save, even if no items scanned
      const orderDetailArray = buildOrderDetailArray(
        orderDetails,
        currentOrderNumber,
        confirmedLines,
        'pending'
      );

      const fullyScannedItems = orderDetailArray.filter(
        (item) => item.Quantity_Shipped === item.Quantity_Ordered
      );
      const maxScannedLine = fullyScannedItems.length > 0
        ? Math.max(...fullyScannedItems.map((item) => item.Line_Number))
        : currentOrderline;

      const data = JSON.stringify({
        status: 'pending',
        current_orderline: maxScannedLine,
        orderDetail: orderDetailArray,
      });

      // Use fetch with keepalive for reliable save on page close (works better than sendBeacon for PUT)
      // sendBeacon only supports GET/POST, so we use fetch with keepalive
      // Always save, even if no items scanned
      if (orderDetailArray.length > 0) {
        const token = localStorage.getItem('token');
        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/sales/order-confirmation/${currentOrderNumber}`;
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch(apiUrl, {
          method: 'PUT',
          body: data,
          headers,
          keepalive: true, // Ensures request completes even if page closes
          credentials: 'include', // Include cookies for auth
        }).then(() => {
          // Clear Redux data after successful save (if possible)
          try {
            dispatch(clearOrderDetails());
            dispatch(clearScannedItems());
            dispatch(resetConfirmedLines());
            dispatch(setCurrentOrderNumber(null));
            dispatch(setIsScanning(false));
          } catch (e) {
            console.log('Error during beforeunload:', e);
            // Ignore errors during beforeunload
          }
        }).catch((error) => {
          console.error('Failed to save progress on beforeunload:', error);
        });
      }

      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  }, [isReviewMode, isOrderCompleted, currentOrderNumber, orderDetails, confirmedLines, currentOrderline, dispatch, buildOrderDetailArray]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  // Initialize previous location on mount
  useEffect(() => {
    if (previousLocationRef.current === null) {
      previousLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Detect route changes - save when leaving the page (back button, direct navigation)
  // ONLY runs when route actually changes (location.pathname), NOT when scanning items
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocationRef.current;

    // Only process if route actually changed (leaving the detail page)
    if (
      previousPath !== null &&
      previousPath !== currentPath &&
      typeof previousPath === 'string' &&
      previousPath.includes('/sales/order-confirmation/') &&
      !currentPath.includes('/sales/order-confirmation/')
    ) {
      // Route changed - we're leaving the detail page (back button or direct navigation)
      // Get current state values from refs (latest values without triggering effect on state changes)
      const latestConfirmedLines = confirmedLinesRef.current;
      const latestOrderDetails = orderDetailsRef.current;
      const latestOrderNumber = currentOrderNumberRef.current;
      const latestOrderline = currentOrderlineRef.current;
      const latestIsOrderCompleted = isOrderCompletedRef.current;
      const latestIsReviewMode = isReviewModeRef.current;

      // If in review mode or order is completed, just clear data without saving
      if (latestIsReviewMode || latestIsOrderCompleted) {
        dispatch(clearOrderDetails());
        dispatch(clearScannedItems());
        dispatch(resetConfirmedLines());
        dispatch(setCurrentOrderNumber(null));
        dispatch(setIsScanning(false));
      } else if (latestOrderNumber !== null && latestOrderDetails.length > 0) {
        // Always save before leaving (even if no items scanned)
        const orderDetailArray = buildOrderDetailArray(
          latestOrderDetails,
          latestOrderNumber,
          latestConfirmedLines,
          'pending'
        );

        const fullyScannedItems = orderDetailArray.filter(
          (item) => item.Quantity_Shipped === item.Quantity_Ordered
        );
        const maxScannedLine = fullyScannedItems.length > 0
          ? Math.max(...fullyScannedItems.map((item) => item.Line_Number))
          : latestOrderline;

        if (!isSavingRef.current) {
          // Prevent duplicate saves if both route change and unmount try to save
          isSavingRef.current = true;
          
          // Use Redux dispatch (axios) for route change - more reliable than fetch with keepalive
          // Axios handles CORS properly and is more reliable during navigation
          dispatch(
            updateOrderConfirmationThunk({
              orderNumber: latestOrderNumber,
              status: 'pending',
              current_orderline: maxScannedLine,
              orderDetail: orderDetailArray,
            })
          ).then(() => {
            // Clear Redux data after successful save
            dispatch(clearOrderDetails());
            dispatch(clearScannedItems());
            dispatch(resetConfirmedLines());
            dispatch(setCurrentOrderNumber(null));
            dispatch(setIsScanning(false));
            isSavingRef.current = false;
          }).catch((error) => {
            console.error('Failed to save progress on route change:', error);
            // Even if save fails, clear data to prevent stale state
            dispatch(clearOrderDetails());
            dispatch(clearScannedItems());
            dispatch(resetConfirmedLines());
            dispatch(setCurrentOrderNumber(null));
            dispatch(setIsScanning(false));
            isSavingRef.current = false;
          });
        } else {
          // Clear data if already saving (unmount cleanup is handling it)
          dispatch(clearOrderDetails());
          dispatch(clearScannedItems());
          dispatch(resetConfirmedLines());
          dispatch(setCurrentOrderNumber(null));
          dispatch(setIsScanning(false));
        }
      } else {
        // Clear data if no order number or details
        dispatch(clearOrderDetails());
        dispatch(clearScannedItems());
        dispatch(resetConfirmedLines());
        dispatch(setCurrentOrderNumber(null));
        dispatch(setIsScanning(false));
      }
    }

    // Update ref only when pathname actually changes
    if (previousPath !== currentPath) {
      previousLocationRef.current = currentPath;
    }
  }, [location.pathname, dispatch]);

  // Component unmount cleanup - save when leaving the page (sidebar navigation, direct navigation)
  // This handles cases where component unmounts before route change detection runs
  useEffect(() => {
    return () => {
      // Get current state values from refs (latest values at unmount time)
      const latestConfirmedLines = confirmedLinesRef.current;
      const latestOrderDetails = orderDetailsRef.current;
      const latestOrderNumber = currentOrderNumberRef.current;
      const latestOrderline = currentOrderlineRef.current;
      const latestIsOrderCompleted = isOrderCompletedRef.current;
      const latestIsReviewMode = isReviewModeRef.current;

      // If in review mode or order is completed, just clear data without saving
      if (latestIsReviewMode || latestIsOrderCompleted) {
        dispatch(clearOrderDetails());
        dispatch(clearScannedItems());
        dispatch(resetConfirmedLines());
        dispatch(setCurrentOrderNumber(null));
        dispatch(setIsScanning(false));
        return;
      }

      // Always save before unmounting (even if no items scanned)
      if (latestOrderNumber !== null && latestOrderDetails.length > 0) {
        // Get all order items with their current quantity shipped (even if 0)
        const orderDetailArray = buildOrderDetailArray(
          latestOrderDetails,
          latestOrderNumber,
          latestConfirmedLines,
          'pending'
        );

        const fullyScannedItems = orderDetailArray.filter(
          (item) => item.Quantity_Shipped === item.Quantity_Ordered
        );
        const maxScannedLine = fullyScannedItems.length > 0
          ? Math.max(...fullyScannedItems.map((item) => item.Line_Number))
          : latestOrderline;

        if (!isSavingRef.current) {
          // Prevent duplicate saves if both route change and unmount try to save
          isSavingRef.current = true;
          
          // Use Redux dispatch (axios) for unmount - more reliable than fetch with keepalive
          // Axios handles CORS properly and is more reliable
          // Note: This will complete even if component unmounts because Redux actions are async
          dispatch(
            updateOrderConfirmationThunk({
              orderNumber: latestOrderNumber,
              status: 'pending',
              current_orderline: maxScannedLine,
              orderDetail: orderDetailArray,
            })
          ).then(() => {
            // Clear Redux data after successful save
            dispatch(clearOrderDetails());
            dispatch(clearScannedItems());
            dispatch(resetConfirmedLines());
            dispatch(setCurrentOrderNumber(null));
            dispatch(setIsScanning(false));
            isSavingRef.current = false;
          }).catch((error) => {
            console.error('Failed to save progress on unmount:', error);
            // Even if save fails, clear data to prevent stale state
            dispatch(clearOrderDetails());
            dispatch(clearScannedItems());
            dispatch(resetConfirmedLines());
            dispatch(setCurrentOrderNumber(null));
            dispatch(setIsScanning(false));
            isSavingRef.current = false;
          });
        } else {
          // Clear data if already saving (route change is handling it)
          dispatch(clearOrderDetails());
          dispatch(clearScannedItems());
          dispatch(resetConfirmedLines());
          dispatch(setCurrentOrderNumber(null));
          dispatch(setIsScanning(false));
        }
      } else {
        // Clear data if no order number or details
        dispatch(clearOrderDetails());
        dispatch(clearScannedItems());
        dispatch(resetConfirmedLines());
        dispatch(setCurrentOrderNumber(null));
        dispatch(setIsScanning(false));
      }
    };
  }, [dispatch]);

  // Handle navigation - automatically save and navigate
  // Force save on cancel button click to ensure it always happens
  const handleNavigate = useCallback(async (path: string) => {
    // In review mode, just clear data and navigate (no saving)
    if (isReviewMode) {
      dispatch(clearOrderDetails());
      dispatch(clearScannedItems());
      dispatch(resetConfirmedLines());
      dispatch(setCurrentOrderNumber(null));
      dispatch(setIsScanning(false));
      navigate(path);
      return;
    }
    
    // Always save if order is NOT completed (even if no items scanned)
    // After completion, just clear data and navigate
    if (!isOrderCompleted) {
      await saveProgress(false, true); // Force save to override hasSavedRef
      // Data is cleared inside saveProgress after successful save
    } else {
      // Clear data without saving (order completed)
      dispatch(clearOrderDetails());
      dispatch(clearScannedItems());
      dispatch(resetConfirmedLines());
      dispatch(setCurrentOrderNumber(null));
      dispatch(setIsScanning(false));
    }
    navigate(path);
  }, [saveProgress, navigate, isOrderCompleted, isReviewMode, dispatch]);

  // Process scanned UPC code
  const processScannedUPC = useCallback(
    async (upcCode: string) => {
      if (!currentOrderNumber || !orderDetails.length) {
        setScanMessage({ text: 'No order selected', type: 'error' });
        return;
      }

      // Clean and normalize UPC code (trim whitespace, convert to string)
      const cleanedUPC = String(upcCode).trim();

      // Find matching line item by UPC
      let matchingLine: OrderDetailItem | undefined = undefined;
      
      for (const item of orderDetails) {
        if (!item.inventory?.UPCList || item.inventory.UPCList.length === 0) {
          continue;
        }
        
        for (const upc of item.inventory.UPCList) {
          const itemUPC = String(upc.UPC_Number || '').trim();
          
          if (itemUPC === cleanedUPC) {
            matchingLine = item;
            break;
          }
        }
        
        if (matchingLine) break;
      }

      if (!matchingLine) {
        // Product not found in order - search for it in inventory
        if (!orderHeader?.customer?.C_Number) {
          setScanMessage({ text: 'Customer information not available', type: 'error' });
          return;
        }
        
        setSearchingProduct(true);
        setScannedUPCForSearch(cleanedUPC);
        
        try {
          const response: any = await getInventoryItemsForOrderConfirmation(cleanedUPC, orderHeader.customer.C_Number);
          // API returns: { success: true, data: { finalProductList: [...] } }
          // Since API function returns response.data, we get: { success: true, data: { finalProductList: [...] } }
          const items = response?.data?.finalProductList || response?.finalProductList || (Array.isArray(response?.data) ? response.data : []);
          const productList = Array.isArray(items) ? items : [];
          
          if (productList.length > 0) {
            // Found product - show modal to add it
            setFoundProduct(productList[0]); // Use first matching item
            setAddProductQuantity('1');
      addProductQuantityRef.current = '1'; // Reset quantity to 1
            addProductQuantityRef.current = '1';
            setAddProductModalOpen(true);
            setScanMessage({ text: `Product found. Do you want to add it to the order?`, type: 'success' });
          } else {
            setScanMessage({ text: `Product with UPC ${cleanedUPC} not found in inventory`, type: 'error' });
          }
        } catch (error: any) {
          console.error('Error searching for product:', error);
          setScanMessage({ text: `Error searching for product: ${error.message || 'Unknown error'}`, type: 'error' });
        } finally {
          setSearchingProduct(false);
        }
        return;
      }

      // Check if there's an active line for existing products
      if (!currentActiveLine) {
        setScanMessage({ text: 'No active line to scan. All items may be completed.', type: 'error' });
        return;
      }

      // Only prevent scanning in review mode
      if (isReviewMode) {
        setScanMessage({ text: 'Cannot scan items in review mode', type: 'error' });
        return;
      }

      // Allow scanning any line that matches the UPC (no restriction to current active line)
      // Manual entry still enforces line-by-line through the edit handler

      // Update confirmed line
      const currentConfirmed = confirmedLines[matchingLine.Line_Number] || {
        quantityShipped: 0,
        scanned: false,
      };

      // Check if already fully scanned
      if (currentConfirmed.quantityShipped >= matchingLine.Quantity_Ordered) {
        setScanMessage({ text: `Line ${matchingLine.Line_Number} is already fully scanned. Moving to next line...`, type: 'error' });
        
        // Find and set next incomplete line immediately
        const sortedLines = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number);
        const nextIncompleteLine = sortedLines.find((item: OrderDetailItem) => {
          const lineConfirmed = confirmedLines[item.Line_Number];
          return !lineConfirmed || lineConfirmed.quantityShipped < item.Quantity_Ordered;
        });
        
        if (nextIncompleteLine) {
          setCurrentActiveLine(nextIncompleteLine.Line_Number);
        } else {
          setCurrentActiveLine(null);
        }
        return;
      }

      const newQuantityShipped = Math.min(
        currentConfirmed.quantityShipped + 1,
        matchingLine.Quantity_Ordered
      );

      dispatch(
        updateConfirmedLine({
          lineNumber: matchingLine.Line_Number,
          quantityShipped: newQuantityShipped,
          scanned: true,
        })
      );

      dispatch(
        addScannedItem({
          upc: cleanedUPC,
          lineNumber: matchingLine.Line_Number,
          timestamp: Date.now(),
        })
      );

      // Create updated confirmedLines object with the new value
      const updatedConfirmedLines = {
        ...confirmedLines,
        [matchingLine.Line_Number]: {
          quantityShipped: newQuantityShipped,
          scanned: true,
        },
      };

      const remaining = matchingLine.Quantity_Ordered - newQuantityShipped;
      
      // Update active line to the scanned line if it's not complete (so user can continue scanning this line)
      if (remaining > 0 && matchingLine.Line_Number !== currentActiveLine) {
        setCurrentActiveLine(matchingLine.Line_Number);
      }
      
      if (remaining > 0) {
        setScanMessage({ text: `Scanned successfully - Line ${matchingLine.Line_Number}: ${remaining} remaining`, type: 'success' });
      } else {
        // Line is now complete - check if all items are scanned
        const allScanned = orderDetails.every((item: OrderDetailItem) => {
          // Use updated confirmedLines instead of the closure value
          const lineConfirmed = updatedConfirmedLines[item.Line_Number];
          if (!lineConfirmed) return false;
          return lineConfirmed.quantityShipped === item.Quantity_Ordered;
        });
        
        // If all items are scanned, don't open no UPC modal - let completion modal open instead
        if (allScanned) {
          setCurrentActiveLine(null);
          setScanMessage({ text: `Line ${matchingLine.Line_Number} completed! All items scanned.`, type: 'success' });
        } else {
          // Find next incomplete line
          const sortedLines = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number);
          
          const nextIncompleteLine = sortedLines.find((item: OrderDetailItem) => {
            // Use updated confirmedLines instead of the closure value
            const lineConfirmed = updatedConfirmedLines[item.Line_Number];
            return !lineConfirmed || lineConfirmed.quantityShipped < item.Quantity_Ordered;
          });
          
          if (nextIncompleteLine) {
            // Check if next line has no UPC - be very explicit about the check
            const inventory = nextIncompleteLine.inventory;
            const upcList = inventory?.UPCList;
            // Check if UPCList is missing, null, undefined, or empty array
            const hasNoUPC = !inventory || !upcList || (Array.isArray(upcList) && upcList.length === 0);
            
            if (hasNoUPC) {
              // Show modal for manual entry
              setNoUPCLineNumber(nextIncompleteLine.Line_Number);
              setNoUPCModalOpen(true);
              setCurrentActiveLine(null); // Don't set as active line since it needs manual entry
              setScanMessage({ text: `Line ${matchingLine.Line_Number} completed! Line ${nextIncompleteLine.Line_Number} requires manual entry.`, type: 'success' });
            } else {
              setCurrentActiveLine(nextIncompleteLine.Line_Number);
              setScanMessage({ text: `Line ${matchingLine.Line_Number} completed! Now scanning Line ${nextIncompleteLine.Line_Number}`, type: 'success' });
            }
          } else {
            setCurrentActiveLine(null);
            setScanMessage({ text: `Line ${matchingLine.Line_Number} completed! All items scanned.`, type: 'success' });
          }
        }
      }
    },
    [currentOrderNumber, orderDetails, confirmedLines, dispatch, mode, currentOrderline, currentActiveLine]
  );

  // Handle keyboard input for QR scanner
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isScanning) return;
      
      // Don't capture keyboard events if user is editing manually
      if (editingLineNumber !== null) return;

      // Don't capture keyboard events if user is typing in an input field (like bundles TextField)
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // Handle Tab or Esc to open current line's text input
      if (e.key === 'Tab' || e.key === 'Escape') {
        if (currentActiveLine && !isReviewMode) {
          const activeLineItem = orderDetails.find((item: OrderDetailItem) => item.Line_Number === currentActiveLine);
          if (activeLineItem) {
            // Open edit mode (only disabled in review mode)
            e.preventDefault();
            e.stopPropagation();
            const confirmed = confirmedLines[activeLineItem.Line_Number];
            const quantityShipped = confirmed?.quantityShipped ?? activeLineItem.Quantity_Shipped ?? 0;
            setEditingLineNumber(activeLineItem.Line_Number);
            setManualQuantity(quantityShipped.toString());
            return;
          }
        }
        
        // If no active line or can't edit, handle Esc and Tab differently
        if (e.key === 'Escape') {
          // If there's no active line to edit, cancel scanning
          e.preventDefault();
          e.stopPropagation();
          setIsCapturingUPC(false);
          setUpcBuffer('');
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }
          toast('Barcode scanning cancelled', { icon: '⚠️' });
          return;
        }
        // For Tab, if we can't edit current line, allow default behavior (don't prevent)
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Handle numeric input (UPC codes)
      if (/^[0-9]$/.test(e.key)) {
        // If not capturing yet, start capturing and include this first character
        if (!isCapturingUPC) {
          setIsCapturingUPC(true);
          setUpcBuffer(e.key); // Start with the first character
          
          // Set timeout to process if scanner sends quickly
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          const timeout = setTimeout(async () => {
            if (upcBuffer.length >= 8 || (upcBuffer + e.key).length >= 8) {
              const finalBuffer = upcBuffer || e.key;
              if (finalBuffer.length >= 8) {
                await processScannedUPC(finalBuffer);
                setIsCapturingUPC(false);
                setUpcBuffer('');
                processingTimeoutRef.current = null;
              }
            }
          }, 500); // Increased timeout for barcode scanners
          
          processingTimeoutRef.current = timeout;
          return;
        }
        
        // Continue capturing
        const newBuffer = upcBuffer + e.key;
        setUpcBuffer(newBuffer);

        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }

        // Auto-process when buffer reaches typical UPC length (12 digits)
        const timeout = setTimeout(async () => {
          if (newBuffer.length >= 8) {
            await processScannedUPC(newBuffer);
            setIsCapturingUPC(false);
            setUpcBuffer('');
            processingTimeoutRef.current = null;
          }
        }, 300);

        processingTimeoutRef.current = timeout;
      } else if (e.key === 'Enter') {
        // Enter key processes the buffer if there is one
        if (isCapturingUPC && upcBuffer.length >= 8) {
          (async () => {
            await processScannedUPC(upcBuffer);
            setIsCapturingUPC(false);
            setUpcBuffer('');
            if (processingTimeoutRef.current) {
              clearTimeout(processingTimeoutRef.current);
              processingTimeoutRef.current = null;
            }
          })();
        } else if (isCapturingUPC && upcBuffer.length > 0 && upcBuffer.length < 8) {
          // Only show error if there's an incomplete buffer
          toast.error(`Invalid UPC code length: ${upcBuffer.length} (minimum 8)`);
          setIsCapturingUPC(false);
          setUpcBuffer('');
        } else if (!isCapturingUPC && currentActiveLine && !isReviewMode) {
          // If nothing is open and there's an active line, open text input (only if not in review mode)
          e.preventDefault();
          e.stopPropagation();
          const activeLineItem = orderDetails.find((item: OrderDetailItem) => item.Line_Number === currentActiveLine);
          if (activeLineItem) {
            const confirmed = confirmedLines[activeLineItem.Line_Number];
            const quantityShipped = confirmed?.quantityShipped ?? activeLineItem.Quantity_Shipped ?? 0;
            setEditingLineNumber(activeLineItem.Line_Number);
            setManualQuantity(quantityShipped.toString());
          }
        }
      }
    },
    [isScanning, isCapturingUPC, upcBuffer, processScannedUPC, editingLineNumber, currentActiveLine, orderDetails, confirmedLines, mode, currentOrderline]
  );

  // Setup keyboard listener for scanning
  useEffect(() => {
    if (isScanning) {
      window.addEventListener('keydown', handleKeyPress as any);
      return () => {
        window.removeEventListener('keydown', handleKeyPress as any);
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
      };
    }
  }, [isScanning, handleKeyPress]);


  // Handle manual quantity submission (works for both UPC and non-UPC products)
  const handleManualQuantitySubmit = useCallback((lineNumber: number, quantityOrdered: number) => {
    if (!manualQuantity || manualQuantity === '') {
      setScanMessage({ text: 'Please enter a quantity', type: 'error' });
      return;
    }

    const enteredQuantity = Number(manualQuantity);
    if (enteredQuantity < 0 || enteredQuantity > quantityOrdered) {
      setScanMessage({ text: `Quantity must be between 0 and ${quantityOrdered}`, type: 'error' });
      return;
    }

    // Only prevent editing in review mode
    if (isReviewMode) {
      setScanMessage({ text: 'Cannot edit items in review mode', type: 'error' });
      setEditingLineNumber(null);
      setManualQuantity('');
      return;
    }

    // Update confirmed line (same as scanning)
    const newQuantityShipped = Math.min(enteredQuantity, quantityOrdered);

    dispatch(
      updateConfirmedLine({
        lineNumber: lineNumber,
        quantityShipped: newQuantityShipped,
        scanned: true, // Mark as scanned even though manually entered
      })
    );

    dispatch(
      addScannedItem({
        upc: 'MANUAL',
        lineNumber: lineNumber,
        timestamp: Date.now(),
      })
    );

    const remaining = quantityOrdered - newQuantityShipped;
    if (remaining > 0) {
      setScanMessage({ text: `Quantity updated - Line ${lineNumber}: ${remaining} remaining`, type: 'success' });
    } else {
      setScanMessage({ text: `Line ${lineNumber} completed!`, type: 'success' });
      
      // Create updated confirmedLines with the new quantity
      const updatedConfirmedLines = {
        ...confirmedLines,
        [lineNumber]: {
          quantityShipped: newQuantityShipped,
          scanned: true,
        },
      };
      
      // Check if all items are now scanned
      const allScanned = orderDetails.every((item: OrderDetailItem) => {
        const confirmed = updatedConfirmedLines[item.Line_Number];
        if (!confirmed) return false;
        return confirmed.quantityShipped === item.Quantity_Ordered;
      });
      
      // If all items are scanned, don't open no UPC modal - let completion modal open instead
      if (allScanned) {
        setCurrentActiveLine(null);
      } else {
        // Find next incomplete line
        const sortedLines = [...orderDetails].sort((a, b) => a.Line_Number - b.Line_Number);
        const nextIncompleteLine = sortedLines.find((item: OrderDetailItem) => {
          const lineConfirmed = updatedConfirmedLines[item.Line_Number];
          return !lineConfirmed || lineConfirmed.quantityShipped < item.Quantity_Ordered;
        });
        
        if (nextIncompleteLine) {
          // Check if next line has no UPC - be very explicit about the check
          const inventory = nextIncompleteLine.inventory;
          const upcList = inventory?.UPCList;
          // Check if UPCList is missing, null, undefined, or empty array
          const hasNoUPC = !inventory || !upcList || (Array.isArray(upcList) && upcList.length === 0);
          
          if (hasNoUPC) {
            // Show modal for manual entry
            setNoUPCLineNumber(nextIncompleteLine.Line_Number);
            setNoUPCModalOpen(true);
            setCurrentActiveLine(null); // Don't set as active line since it needs manual entry
          } else {
            setCurrentActiveLine(nextIncompleteLine.Line_Number);
          }
        } else {
          setCurrentActiveLine(null);
        }
      }
    }

    setEditingLineNumber(null);
    setManualQuantity('');
  }, [manualQuantity, mode, currentOrderline, orderDetails, confirmedLines, dispatch]);

  // Check if all products are scanned
  const areAllProductsScanned = useCallback((): boolean => {
    if (!orderDetails.length) return false;

    return orderDetails.every((item: OrderDetailItem) => {
      const confirmed = confirmedLines[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? item.Quantity_Shipped ?? 0;
      
      // Check if quantity shipped equals quantity ordered (fully scanned)
      return quantityShipped === item.Quantity_Ordered;
    });
  }, [orderDetails, confirmedLines]);

  // Get incomplete items (not scanned or shipped quantity != ordered quantity)
  const getIncompleteItems = useCallback((): OrderDetailItem[] => {
    if (!orderDetails.length) return [];

    return orderDetails.filter((item: OrderDetailItem) => {
      const confirmed = confirmedLines[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? item.Quantity_Shipped ?? 0;
      
      // Check if quantity shipped does not equal quantity ordered (incomplete)
      return quantityShipped !== item.Quantity_Ordered;
    });
  }, [orderDetails, confirmedLines]);

  // Calculate total scanned items price
  const calculateScannedItemsPrice = useCallback((): number => {
    if (!orderDetails.length) return 0;

    return orderDetails.reduce((total, item: OrderDetailItem) => {
      const confirmed = confirmedLines[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? 0;
      
      // Calculate price per item (same as Price column calculation)
      const pricePerItem = Number(item.Price) || 0;
      
      // Multiply by quantity shipped
      return total + (pricePerItem * quantityShipped);
    }, 0);
  }, [orderDetails, confirmedLines]);

  // Calculate total quantity ordered
  const calculateTotalQuantityOrdered = useCallback((): number => {
    if (!orderDetails.length) return 0;
    return orderDetails.reduce((total, item: OrderDetailItem) => {
      return total + (Number(item.Quantity_Ordered) || 0);
    }, 0);
  }, [orderDetails]);

  // Calculate total quantity scanned
  const calculateTotalQuantityScanned = useCallback((): number => {
    if (!orderDetails.length) return 0;
    return orderDetails.reduce((total, item: OrderDetailItem) => {
      const confirmed = confirmedLines[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? 0;
      return total + quantityShipped;
    }, 0);
  }, [orderDetails, confirmedLines]);

  // Filter order details based on active tab
  const getFilteredOrderDetails = useCallback((): OrderDetailItem[] => {
    if (!orderDetails.length) return [];

    if (activeTab === 'all') {
      return orderDetails;
    }

    return orderDetails.filter((item: OrderDetailItem) => {
      const confirmed = confirmedLines[item.Line_Number];
      const quantityShipped = confirmed?.quantityShipped ?? item.Quantity_Shipped ?? 0;
      
      // Item is confirmed ONLY if Quantity_Shipped equals Quantity_Ordered (fully scanned)
      // Don't use currentOrderline as a shortcut - check actual scanned quantity
      const isFullyScanned = quantityShipped === item.Quantity_Ordered;
      const isConfirmed = isFullyScanned;

      if (activeTab === 'pending') {
        return !isConfirmed;
      } else if (activeTab === 'confirmed') {
        return isConfirmed;
      }

      return true;
    });
  }, [orderDetails, confirmedLines, activeTab, mode, currentOrderline]);

  // Search inventory manually (for Add More Item modal)
  const handleSearchInventory = useCallback(async (searchTerm: string) => {
    if (!orderHeader?.customer?.C_Number) {
      toast.error('Customer information not available');
      return;
    }

    if (!searchTerm || searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    setSearchingInventory(true);
    try {
      const response: any = await getInventoryItemsForOrderConfirmation(searchTerm.trim(), orderHeader.customer.C_Number);
      // API returns: { success: true, data: { finalProductList: [...] } }
      // Since API function returns response.data, we get: { success: true, data: { finalProductList: [...] } }
      const items = response?.data?.finalProductList || response?.finalProductList || (Array.isArray(response?.data) ? response.data : []);
      setSearchResults(Array.isArray(items) ? items : []);
      // Clear any previously selected product when new search results come in
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Error searching inventory:', error);
      toast.error('Failed to search inventory');
      setSearchResults([]);
    } finally {
      setSearchingInventory(false);
    }
  }, [orderHeader]);

  // Debounced search for manual add item modal
  useEffect(() => {
    if (!manualAddItemModalOpen) return;
    
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        handleSearchInventory(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, manualAddItemModalOpen, handleSearchInventory]);

  // Helper function to calculate cart payload with prepaidTaxRate (matching Order.tsx logic)
  // Calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
  const calculateCartPayload = useCallback((product: any, quantity: number = 1) => {
    // Convert all values to numbers to prevent string operations
    const basePrice = Number(product.price || product.Price || 0);
    const prepaidTaxRate = Number(product.prepaidTaxRate || 0);
    const taxRate = Number(product.Tax_Rate || product.taxRate || 0);
    const qty = Number(quantity) || 0;
    
    // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
    const basePriceWithTax = basePrice + taxRate;
    
    // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
    const priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
    const price = basePrice;
    
    // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
    const prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
    // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
    const totalPrepaidTax = prepaidTaxPerUnit * qty;
    
    // Calculate total price with tax: Price_With_Tax * qty
    const totalPriceWithTax = priceWithTax * qty;
    
    return {
      Price: Number(Number(price).toFixed(2)),
      Price_With_Tax: Number(Number(priceWithTax).toFixed(2)),
      Qty: Number(qty),
      Tax_Rate: Number(Number(taxRate).toFixed(2)),
      TotalPrice: Number(Number(price * qty).toFixed(2)),
      TotalPriceWithTax: Number(Number(totalPriceWithTax).toFixed(2)),
      prepaidTaxRate: Number(Number(prepaidTaxRate).toFixed(4)),
      TotalprepaidTaxRate: roundPrepaidTax(totalPrepaidTax)
    };
  }, []);

  // Handle adding selected product to order (from manual search)
  const handleAddSelectedProductToOrder = useCallback(async () => {
    if (!selectedProduct || !currentOrderNumber || !orderHeader?.customer?.C_Number) {
      toast.error('Missing required information to add product');
      return;
    }

    setAddingSelectedProduct(true);
    try {
      // Get the next line number (max line number + 1)
      const maxLineNumber = orderDetails.length > 0
        ? Math.max(...orderDetails.map((item: OrderDetailItem) => item.Line_Number))
        : 0;
      const nextLineNumber = maxLineNumber + 1;

      // Get quantity from input (default to 1 if invalid)
      // IMPORTANT: Use ref to get the latest value, avoiding closure issues
      const qtyValue = selectedProductQuantityRef.current?.trim() || selectedProductQuantity?.trim() || '1';
      const quantity = Number(qtyValue);
      
      console.log('🔍 DEBUG - handleAddSelectedProductToOrder:');
      console.log('  - selectedProductQuantity state:', selectedProductQuantity);
      console.log('  - selectedProductQuantityRef.current:', selectedProductQuantityRef.current);
      console.log('  - qtyValue after trim:', qtyValue);
      console.log('  - parsed quantity:', quantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity greater than 0');
        return;
      }

      // Calculate payload using the same logic as Order.tsx
      const cartPayload = calculateCartPayload(selectedProduct, quantity);
      
      // Calculate prepaid tax amount: (price + tax_rate) * prepaidTaxRate
      const basePrice = Number(selectedProduct.price || selectedProduct.Price || 0);
      const taxRate = Number(selectedProduct.Tax_Rate || selectedProduct.taxRate || 0);
      const prepaidTaxRateValue = Number(selectedProduct.prepaidTaxRate || 0);
      const prepaidTaxAmount = (basePrice + taxRate) * prepaidTaxRateValue;
      
      // Prepare payload according to the API structure
      const payload = {
        orderNumber: currentOrderNumber.toString(),
        orderPlayload: [
          {
            Customer_Number: orderHeader.customer.C_Number,
            Item_Number: selectedProduct.Item_Number || selectedProduct.id || 0,
            Price: cartPayload.Price,
            Price_With_Tax: cartPayload.Price_With_Tax,
            Qty: quantity, // Use the quantity directly to ensure it's correct
            Tax_Rate: cartPayload.Tax_Rate,
            TotalPrice: cartPayload.TotalPrice,
            TotalPriceWithTax: cartPayload.TotalPriceWithTax,
            prepaidTaxRate: roundPrepaidTax(prepaidTaxAmount), // Use utility function for proper rounding
            discountPrice: cartPayload.Price, // Use base price as discount price (no discount applied)
            id: selectedProduct.id || selectedProduct.Item_Number || 0,
            Line_Number: nextLineNumber,
          },
        ],
      };

      console.log('📦 FINAL PAYLOAD:', JSON.stringify(payload, null, 2));
      console.log('  - Qty in payload:', payload.orderPlayload[0].Qty);

      await placeOrderForCustomer(orderHeader.customer.C_Number, payload);

      // Preserve existing scanned items before refreshing
      const preservedConfirmedLines = { ...confirmedLines };

      // Refresh order details to show the new item
      await dispatch(fetchOrderConfirmationDetails(currentOrderNumber)).unwrap();

      // Restore preserved scanned items after refresh
      // This ensures previously scanned items don't get reset to 0
      Object.keys(preservedConfirmedLines).forEach((lineNumberStr) => {
        const lineNumber = parseInt(lineNumberStr, 10);
        const preserved = preservedConfirmedLines[lineNumber];
        if (preserved) {
          dispatch(
            updateConfirmedLine({
              lineNumber: lineNumber,
              quantityShipped: preserved.quantityShipped,
              scanned: preserved.scanned,
            })
          );
        }
      });

      // Close modal and reset state
      setManualAddItemModalOpen(false);
      setSelectedProduct(null);
      setSelectedProductQuantity('1');
      selectedProductQuantityRef.current = '1';
      setSearchQuery('');
      setSearchResults([]);
      
      toast.success('Product added to order successfully');
    } catch (error: any) {
      console.error('Error adding product to order:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add product to order');
    } finally {
      setAddingSelectedProduct(false);
    }
  }, [selectedProduct, selectedProductQuantity, currentOrderNumber, orderHeader, orderDetails, confirmedLines, dispatch, calculateCartPayload]);

  // Handle adding product to order
  const handleAddProductToOrder = useCallback(async () => {
    if (!foundProduct || !currentOrderNumber || !orderHeader?.customer?.C_Number) {
      toast.error('Missing required information to add product');
      return;
    }

    setAddingProduct(true);
    try {
      // Get the next line number (max line number + 1)
      const maxLineNumber = orderDetails.length > 0
        ? Math.max(...orderDetails.map((item: OrderDetailItem) => item.Line_Number))
        : 0;
      const nextLineNumber = maxLineNumber + 1;

      // Get quantity from input (default to 1 if invalid)
      // IMPORTANT: Use ref to get the latest value, avoiding closure issues
      const qtyValue = addProductQuantityRef.current?.trim() || addProductQuantity?.trim() || '1';
      const quantity = Number(qtyValue);
      
      console.log('🔍 DEBUG - handleAddProductToOrder:');
      console.log('  - addProductQuantity state:', addProductQuantity);
      console.log('  - addProductQuantityRef.current:', addProductQuantityRef.current);
      console.log('  - qtyValue after trim:', qtyValue);
      console.log('  - parsed quantity:', quantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity greater than 0');
        return;
      }

      console.log('Adding product (scanned) - Quantity from state:', addProductQuantity, 'Parsed quantity:', quantity);

      // Calculate payload using the same logic as Order.tsx
      const cartPayload = calculateCartPayload(foundProduct, quantity);
      
      // Calculate prepaid tax amount: (price + tax_rate) * prepaidTaxRate
      const basePrice = Number(foundProduct.price || foundProduct.Price || 0);
      const taxRate = Number(foundProduct.Tax_Rate || foundProduct.taxRate || 0);
      const prepaidTaxRateValue = Number(foundProduct.prepaidTaxRate || 0);
      const prepaidTaxAmount = (basePrice + taxRate) * prepaidTaxRateValue;
      
      // Prepare payload according to the API structure
      const payload = {
        orderNumber: currentOrderNumber.toString(),
        orderPlayload: [
          {
            Customer_Number: orderHeader.customer.C_Number,
            Item_Number: foundProduct.Item_Number || foundProduct.id || 0,
            Price: cartPayload.Price,
            Price_With_Tax: cartPayload.Price_With_Tax,
            Qty: quantity, // Use the quantity directly to ensure it's correct
            Tax_Rate: cartPayload.Tax_Rate,
            TotalPrice: cartPayload.TotalPrice,
            TotalPriceWithTax: cartPayload.TotalPriceWithTax,
            prepaidTaxRate: roundPrepaidTax(prepaidTaxAmount), // Use utility function for proper rounding
            discountPrice: cartPayload.Price, // Use base price as discount price (no discount applied)
            id: foundProduct.id || foundProduct.Item_Number || 0,
            Line_Number: nextLineNumber,
          },
        ],
      };

      await placeOrderForCustomer(orderHeader.customer.C_Number, payload);

      // Preserve existing scanned items before refreshing
      const preservedConfirmedLines = { ...confirmedLines };

      // Refresh order details to show the new item
      await dispatch(fetchOrderConfirmationDetails(currentOrderNumber)).unwrap();

      // Restore preserved scanned items after refresh
      // This ensures previously scanned items don't get reset to 0
      Object.keys(preservedConfirmedLines).forEach((lineNumberStr) => {
        const lineNumber = parseInt(lineNumberStr, 10);
        const preserved = preservedConfirmedLines[lineNumber];
        if (preserved) {
          dispatch(
            updateConfirmedLine({
              lineNumber: lineNumber,
              quantityShipped: preserved.quantityShipped,
              scanned: preserved.scanned,
            })
          );
        }
      });

      // Close modal and reset state
      setAddProductModalOpen(false);
      setFoundProduct(null);
      setScannedUPCForSearch('');
      setAddProductQuantity('1');
      addProductQuantityRef.current = '1';
      
      toast.success('Product added to order successfully');
      setScanMessage({ text: `Product added to order at line ${nextLineNumber}`, type: 'success' });
    } catch (error: any) {
      console.error('Error adding product to order:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add product to order');
    } finally {
      setAddingProduct(false);
    }
  }, [foundProduct, addProductQuantity, currentOrderNumber, orderHeader, orderDetails, confirmedLines, dispatch, calculateCartPayload]);

  // Fetch and calculate sales category summary
  const fetchSalesCategorySummary = useCallback(async () => {
    if (!orderDetails.length) {
      toast.error('No order details available');
      return;
    }

    setLoadingSalesCategorySummary(true);
    try {
      // Fetch sales category list
      const response = await getSalesCategoryList() as any;
      const categories = response?.data?.data || [];

      // Create a map of Sales_Category to Category_Desc
      const categoryMap = new Map<number, string>();
      categories.forEach((cat: any) => {
        categoryMap.set(cat.Sales_Category, cat.Category_Desc);
      });

      // Group items by Sales_Category and calculate totals
      const categorySummary = new Map<number, {
        salesCategory: number;
        categoryDesc: string;
        totalOrderedQty: number;
        totalShippedQty: number;
        totalOrderedPrice: number;
        totalShippedPrice: number;
      }>();

      orderDetails.forEach((item: OrderDetailItem) => {
        const salesCategory = item.Sales_Category;
        const categoryDesc = categoryMap.get(salesCategory) || `Category ${salesCategory}`;
        const confirmed = confirmedLines[item.Line_Number];
        const quantityShipped = confirmed?.quantityShipped ?? item.Quantity_Shipped ?? 0;
        const quantityOrdered = item.Quantity_Ordered;
        const price = Number(item.Price) || 0;

        if (!categorySummary.has(salesCategory)) {
          categorySummary.set(salesCategory, {
            salesCategory,
            categoryDesc,
            totalOrderedQty: 0,
            totalShippedQty: 0,
            totalOrderedPrice: 0,
            totalShippedPrice: 0,
          });
        }

        const summary = categorySummary.get(salesCategory)!;
        summary.totalOrderedQty += quantityOrdered;
        summary.totalShippedQty += quantityShipped;
        summary.totalOrderedPrice += price * quantityOrdered;
        summary.totalShippedPrice += price * quantityShipped;
      });

      // Convert map to array and sort by Sales_Category
      const summaryArray = Array.from(categorySummary.values()).sort(
        (a, b) => a.salesCategory - b.salesCategory
      );

      setSalesCategorySummaryData(summaryArray);
      setSalesCategorySummaryModalOpen(true);
    } catch (error: any) {
      console.error('Error fetching sales category summary:', error);
      toast.error('Failed to load sales category summary');
    } finally {
      setLoadingSalesCategorySummary(false);
    }
  }, [orderDetails, confirmedLines]);

  // Handle F12 key to open Sales Category Summary modal
  useEffect(() => {
    const handleF12KeyPress = (e: KeyboardEvent) => {
      // Only handle F12 key
      if (e.key === 'F12') {
        // Don't trigger if user is typing in an input field
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' || 
           activeElement.tagName === 'TEXTAREA' ||
           activeElement.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }

        // Prevent browser's default F12 behavior (developer tools)
        e.preventDefault();
        e.stopPropagation();

        // Open sales category summary modal if order details are available
        if (orderDetails.length > 0 && !loadingSalesCategorySummary) {
          fetchSalesCategorySummary();
        }
      }
    };

    window.addEventListener('keydown', handleF12KeyPress);
    return () => {
      window.removeEventListener('keydown', handleF12KeyPress);
    };
  }, [orderDetails.length, loadingSalesCategorySummary, fetchSalesCategorySummary]);

  // Auto-open completion modal when all items are scanned (but not in review mode)
  useEffect(() => {
    if (!orderDetails.length || isOrderCompleted || completionModalOpen || modalManuallyClosed || isReviewMode) return;
    
    if (areAllProductsScanned()) {
      setCompletionModalOpen(true);
    }
  }, [confirmedLines, orderDetails, mode, currentOrderline, isOrderCompleted, completionModalOpen, modalManuallyClosed, areAllProductsScanned, isReviewMode]);

  // Helper function to get page size CSS based on label size
  // const getPageSizeCSS = (size: LabelSize): string => {
  //   switch (size) {
  //     case '4x3':
  //       return 'size: 4in 3in landscape;';
  //     case '4x6':
  //       return 'size: 6in 4in landscape;';
  //     case '3x6':
  //       return 'size: 6in 3in landscape;';
  //     case '3x2':
  //       return 'size: 3in 2in landscape;';
  //     case '4x4':
  //       return 'size: 4in 4in;';
  //     case '2x2':
  //       return 'size: 2in 2in;';
  //     case '2x3':
  //       return 'size: 3in 2in landscape;';
  //     case 'A4':
  //       return 'size: A4 portrait;';
  //     default:
  //       return 'size: 6in 4in landscape;';
  //   }
  // };

  // Helper functions removed - using bundle label structure from labelGenerator.ts instead

  // Print barcode labels with customer name in top left and barcodes in middle
  // const printBarcodeLabels = useCallback((barcodes: string[], customerName: string, size: LabelSize = '4x6') => {
  //   if (!barcodes || barcodes.length === 0) {
  //     toast.error('No barcodes available to print');
  //     return;
  //   }

  //   // Create print window
  //   const printWindow = window.open('', '_blank');
  //   if (!printWindow) {
  //     toast.error('Please allow popups to print labels');
  //     return;
  //   }

  //   // Get dimensions and font sizes for the selected size
  //   const pageSizeCSS = getPageSizeCSS(size);
  //   const bodyDims = getBodyDimensions(size);
  //   const fontSizes = getFontSizes(size);

  //   // Generate barcode images
  //   const barcodeImages = barcodes.map(barcode => generateBarcode(barcode));

  //   let html = `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <meta charset="UTF-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title></title>
  //       <style>
  //         * {
  //           box-sizing: border-box;
  //           margin: 0;
  //           padding: 0;
  //         }
  //         @media print {
  //           @page {
  //             ${pageSizeCSS}
  //             margin: 0 !important;
  //             padding: 0 !important;
  //           }
  //           @page :first {
  //             margin: 0 !important;
  //           }
  //           @page :left {
  //             margin: 0 !important;
  //           }
  //           @page :right {
  //             margin: 0 !important;
  //           }
  //           body {
  //             margin: 0 !important;
  //             padding: 0 !important;
  //             width: 100%;
  //             height: 100%;
  //           }
  //           .labels-container {
  //             display: flex;
  //             justify-content: center;
  //             align-items: center;
  //             width: 100% !important;
  //             height: 100% !important;
  //             min-width: 100% !important;
  //             min-height: 100% !important;
  //             padding: 0;
  //             margin: 0;
  //             page-break-after: always !important;
  //             page-break-inside: avoid !important;
  //             break-after: page !important;
  //             break-inside: avoid !important;
  //             overflow: hidden;
  //             position: relative;
  //             orphans: 1 !important;
  //             widows: 1 !important;
  //           }
  //           .labels-container:first-child {
  //             page-break-before: auto !important;
  //             break-before: auto !important;
  //           }
  //           .labels-container + .labels-container {
  //             page-break-before: always !important;
  //             break-before: page !important;
  //           }
  //           .labels-container:last-child {
  //             page-break-after: auto !important;
  //             break-after: auto !important;
  //           }
  //           .label {
  //             -webkit-print-color-adjust: exact;
  //             print-color-adjust: exact;
  //             width: 100% !important;
  //             height: 100% !important;
  //             max-width: 100% !important;
  //             max-height: 100% !important;
  //             min-width: 100% !important;
  //             min-height: 100% !important;
  //             transform: none !important;
  //             box-sizing: border-box !important;
  //             flex-shrink: 0 !important;
  //             page-break-inside: avoid;
  //             break-inside: avoid;
  //             padding: 1em !important;
  //             display: flex;
  //             flex-direction: column;
  //             position: relative;
  //           }
  //           .customer-name {
  //             position: absolute;
  //             top: 0.5em;
  //             left: 0.5em;
  //             font-size: ${fontSizes.customerName};
  //             font-weight: 500;
  //             color: #000000;
  //             max-width: 40%;
  //             word-break: break-word;
  //           }
  //           .barcode-section {
  //             display: flex;
  //             flex-direction: column;
  //             align-items: center;
  //             justify-content: center;
  //             flex: 1;
  //             width: 100%;
  //           }
  //           .barcode-section img {
  //             max-width: 80%;
  //             height: auto;
  //             max-height: 50%;
  //             margin-bottom: 0.5em;
  //           }
  //           .barcode-text {
  //             font-size: ${fontSizes.orderNumber};
  //             font-weight: 500;
  //             color: #000000;
  //             text-align: center;
  //             word-break: break-all;
  //           }
  //           header, footer {
  //             display: none !important;
  //           }
  //           @page {
  //             marks: none;
  //           }
  //         }
  //         body {
  //           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  //           margin: 0;
  //           padding: 0;
  //           background: #ffffff;
  //           width: ${bodyDims.width};
  //           height: ${bodyDims.height};
  //         }
  //         .labels-container {
  //           display: flex;
  //           justify-content: center;
  //           align-items: center;
  //           width: ${bodyDims.width};
  //           height: ${bodyDims.height};
  //           min-width: ${bodyDims.width};
  //           min-height: ${bodyDims.height};
  //           padding: 0;
  //           margin: 0;
  //           page-break-after: always;
  //           page-break-inside: avoid;
  //           break-after: page;
  //           break-inside: avoid;
  //         }
  //         .label {
  //           width: ${bodyDims.width};
  //           height: ${bodyDims.height};
  //           padding: 1em;
  //           display: flex;
  //           flex-direction: column;
  //           justify-content: center;
  //           background: #ffffff;
  //           break-inside: avoid;
  //           box-sizing: border-box;
  //           flex-shrink: 0;
  //           position: relative;
  //         }
  //         .customer-name {
  //           position: absolute;
  //           top: 0.5em;
  //           left: 0.5em;
  //           font-size: ${fontSizes.customerName};
  //           font-weight: 500;
  //           color: #000000;
  //           max-width: 40%;
  //           word-break: break-word;
  //         }
  //         .barcode-section {
  //           display: flex;
  //           flex-direction: column;
  //           align-items: center;
  //           justify-content: center;
  //           flex: 1;
  //           width: 100%;
  //         }
  //         .barcode-section img {
  //           max-width: 80%;
  //           height: auto;
  //           max-height: 50%;
  //           margin-bottom: 0.5em;
  //         }
  //         .barcode-text {
  //           font-size: ${fontSizes.orderNumber};
  //           font-weight: 500;
  //           color: #000000;
  //           text-align: center;
  //           word-break: break-all;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //   `;

  //   // Generate one label per barcode
  //   barcodes.forEach((barcode, index) => {
  //     const barcodeImage = barcodeImages[index];
  //     html += '<div class="labels-container">';
  //     html += `
  //       <div class="label">
  //         <div class="customer-name">${customerName}</div>
  //         <div class="barcode-section">
  //           <img src="${barcodeImage}" alt="Barcode ${barcode}" />
  //           <div class="barcode-text">${barcode}</div>
  //         </div>
  //       </div>
  //     `;
  //     html += '</div>';
  //   });

  //   html += `
  //       <script>
  //         window.onbeforeprint = function() {};
  //         window.onafterprint = function() {};
  //       </script>
  //     </body>
  //     </html>
  //   `;

  //   printWindow.document.write(html);
  //   printWindow.document.close();

  //   // Wait for content to load, then print
  //   setTimeout(() => {
  //     printWindow.print();
  //     setTimeout(() => {
  //       printWindow.close();
  //     }, 1000);
  //   }, 250);
  // }, []);

  // Print labels with size selection
  const printLabels = useCallback((bundlesCount: number, barcodes: string[], size: LabelSize = '4x6') => {
    if (!orderHeader || !currentOrderNumber) return;

    const date = orderHeader.Order_Date ? dayjs(orderHeader.Order_Date).format('MM-DD-YYYY') : '';
    const orderNumber = orderHeader.Order_Number;
    const customerNumber = orderHeader.customer?.C_Number || 'N/A';
    const customerName = orderHeader.customer?.C_Name || 'N/A';
    const route = orderHeader.customer?.customerRoute?.Route_Number ?? 'N/A';
    const stop = orderHeader.customer?.customerRoute?.Stop_Number ?? 'N/A';

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    // Generate labels HTML with barcodes
    const labels = [];
    for (let i = 1; i <= bundlesCount; i++) {
      const barcode = barcodes && barcodes.length >= i ? barcodes[i - 1] : null;
      const barcodeImage = barcode ? generateBarcode(barcode) : null;
      labels.push({
        number: i,
        total: bundlesCount,
        date,
        orderNumber,
        customerNumber,
        customerName,
        route,
        stop,
        barcodeImage,
      });
    }

    // Get page size and dimensions based on label size (matching labelGenerator.ts exactly)
    const getPageSizeAndDimensions = () => {
      switch (size) {
        case '4x3':
          return {
            pageSize: 'size: 4in 3in landscape;',
            bodyWidth: '4in',
            bodyHeight: '3in',
            bodyPadding: '0.1in',
            containerPadding: '0.08in',
            headerMarginBottom: '0.06in',
            routeStopPadding: '0.03in 0.1in',
            routeStopFontSize: '16pt',
            barcodeMargin: '0.06in 0',
            barcodeMaxWidth: '85%',
            barcodeMaxHeight: '0.5in',
            customerPadding: '0.05in',
            customerMarginBottom: '0.05in',
            customerFontSize: '9pt',
            customerNameFontSize: '11pt',
            customerNameMarginBottom: '0.03in',
            addressFontSize: '8pt',
            addressMarginBottom: '0.01in',
            custNumberFontSize: '8pt',
            custNumberMarginTop: '0.03in',
            bottomPaddingTop: '0.05in',
            infoFontSize: '8pt',
            infoMarginBottom: '0.02in',
            deliveryDateFontSize: '9pt',
            deliveryDateMarginBottom: '0.02in',
            boxIndicatorFontSize: '14pt',
            boxIndicatorMarginTop: '0.05in',
          };
        case '4x6':
          return {
            pageSize: 'size: 6in 4in landscape;',
            bodyWidth: '6in',
            bodyHeight: '4in',
            bodyPadding: '0.12in',
            containerPadding: '0.1in',
            headerMarginBottom: '0.08in',
            routeStopPadding: '0.04in 0.12in',
            routeStopFontSize: '20pt',
            barcodeMargin: '0.08in 0',
            barcodeMaxWidth: '88%',
            barcodeMaxHeight: '0.55in',
            customerPadding: '0.06in',
            customerMarginBottom: '0.06in',
            customerFontSize: '10pt',
            customerNameFontSize: '13pt',
            customerNameMarginBottom: '0.04in',
            addressFontSize: '9pt',
            addressMarginBottom: '0.02in',
            custNumberFontSize: '9pt',
            custNumberMarginTop: '0.04in',
            bottomPaddingTop: '0.06in',
            infoFontSize: '9pt',
            infoMarginBottom: '0.03in',
            deliveryDateFontSize: '10pt',
            deliveryDateMarginBottom: '0.03in',
            boxIndicatorFontSize: '16pt',
            boxIndicatorMarginTop: '0.06in',
          };
        case '3x6':
          return {
            pageSize: 'size: 6in 3in landscape;',
            bodyWidth: '6in',
            bodyHeight: '3in',
            bodyPadding: '0.1in',
            containerPadding: '0.08in',
            headerMarginBottom: '0.1in',
            routeStopPadding: '0.04in 0.12in',
            routeStopFontSize: '18pt',
            barcodeMargin: '0.1in 0',
            barcodeMaxWidth: '90%',
            barcodeMaxHeight: '0.6in',
            customerPadding: '0.05in',
            customerMarginBottom: '0.05in',
            customerFontSize: '9pt',
            customerNameFontSize: '12pt',
            customerNameMarginBottom: '0.03in',
            addressFontSize: '9pt',
            addressMarginBottom: '0.01in',
            custNumberFontSize: '9pt',
            custNumberMarginTop: '0.03in',
            bottomPaddingTop: '0.05in',
            infoFontSize: '9pt',
            infoMarginBottom: '0.02in',
            deliveryDateFontSize: '10pt',
            deliveryDateMarginBottom: '0.02in',
            boxIndicatorFontSize: '15pt',
            boxIndicatorMarginTop: '0.05in',
          };
        case '3x2':
          return {
            pageSize: 'size: 3in 2in landscape;',
            bodyWidth: '3in',
            bodyHeight: '2in',
            bodyPadding: '0.06in',
            containerPadding: '0.05in',
            headerMarginBottom: '0.04in',
            routeStopPadding: '0.02in 0.08in',
            routeStopFontSize: '11pt',
            barcodeMargin: '0.03in 0',
            barcodeMaxWidth: '80%',
            barcodeMaxHeight: '0.35in',
            customerPadding: '0.03in',
            customerMarginBottom: '0.03in',
            customerFontSize: '7pt',
            customerNameFontSize: '9pt',
            customerNameMarginBottom: '0.02in',
            addressFontSize: '7pt',
            addressMarginBottom: '0.01in',
            custNumberFontSize: '7pt',
            custNumberMarginTop: '0.02in',
            bottomPaddingTop: '0.03in',
            infoFontSize: '7pt',
            infoMarginBottom: '0.01in',
            deliveryDateFontSize: '7pt',
            deliveryDateMarginBottom: '0.01in',
            boxIndicatorFontSize: '14pt',
            boxIndicatorMarginTop: '0.03in',
          };
        case '4x4':
          return {
            pageSize: 'size: 4in 4in landscape;',
            bodyWidth: '4in',
            bodyHeight: '4in',
            bodyPadding: '0.12in',
            containerPadding: '0.1in',
            headerMarginBottom: '0.08in',
            routeStopPadding: '0.04in 0.12in',
            routeStopFontSize: '20pt',
            barcodeMargin: '0.08in 0',
            barcodeMaxWidth: '88%',
            barcodeMaxHeight: '0.55in',
            customerPadding: '0.06in',
            customerMarginBottom: '0.06in',
            customerFontSize: '10pt',
            customerNameFontSize: '13pt',
            customerNameMarginBottom: '0.04in',
            addressFontSize: '9pt',
            addressMarginBottom: '0.02in',
            custNumberFontSize: '9pt',
            custNumberMarginTop: '0.04in',
            bottomPaddingTop: '0.06in',
            infoFontSize: '9pt',
            infoMarginBottom: '0.03in',
            deliveryDateFontSize: '10pt',
            deliveryDateMarginBottom: '0.03in',
            boxIndicatorFontSize: '16pt',
            boxIndicatorMarginTop: '0.06in',
          };
        case '2x2':
          return {
            pageSize: 'size: 2in 2in landscape;',
            bodyWidth: '2in',
            bodyHeight: '2in',
            bodyPadding: '0.05in',
            containerPadding: '0.04in',
            headerMarginBottom: '0.03in',
            routeStopPadding: '0.02in 0.06in',
            routeStopFontSize: '10pt',
            barcodeMargin: '0.02in 0',
            barcodeMaxWidth: '75%',
            barcodeMaxHeight: '0.3in',
            customerPadding: '0.02in',
            customerMarginBottom: '0.02in',
            customerFontSize: '6pt',
            customerNameFontSize: '8pt',
            customerNameMarginBottom: '0.01in',
            addressFontSize: '6pt',
            addressMarginBottom: '0.005in',
            custNumberFontSize: '6pt',
            custNumberMarginTop: '0.01in',
            bottomPaddingTop: '0.02in',
            infoFontSize: '6pt',
            infoMarginBottom: '0.01in',
            deliveryDateFontSize: '7pt',
            deliveryDateMarginBottom: '0.01in',
            boxIndicatorFontSize: '12pt',
            boxIndicatorMarginTop: '0.02in',
          };
        case '2x3':
          return {
            pageSize: 'size: 3in 2in landscape;',
            bodyWidth: '3in',
            bodyHeight: '2in',
            bodyPadding: '0.06in',
            containerPadding: '0.05in',
            headerMarginBottom: '0.05in',
            routeStopPadding: '0.025in 0.08in',
            routeStopFontSize: '10pt',
            barcodeMargin: '0.05in 0',
            barcodeMaxWidth: '85%',
            barcodeMaxHeight: '0.4in',
            customerPadding: '0.04in',
            customerMarginBottom: '0.05in',
            customerFontSize: '7pt',
            customerNameFontSize: '9pt',
            customerNameMarginBottom: '0.025in',
            addressFontSize: '7pt',
            addressMarginBottom: '0.015in',
            custNumberFontSize: '7pt',
            custNumberMarginTop: '0.025in',
            bottomPaddingTop: '0.05in',
            infoFontSize: '7pt',
            infoMarginBottom: '0.02in',
            deliveryDateFontSize: '8pt',
            deliveryDateMarginBottom: '0.02in',
            boxIndicatorFontSize: '13pt',
            boxIndicatorMarginTop: '0.05in',
          };
        default:
          return {
            pageSize: 'size: 6in 4in landscape;',
            bodyWidth: '6in',
            bodyHeight: '4in',
            bodyPadding: '0.12in',
            containerPadding: '0.1in',
            headerMarginBottom: '0.08in',
            routeStopPadding: '0.04in 0.12in',
            routeStopFontSize: '20pt',
            barcodeMargin: '0.08in 0',
            barcodeMaxWidth: '88%',
            barcodeMaxHeight: '0.55in',
            customerPadding: '0.06in',
            customerMarginBottom: '0.06in',
            customerFontSize: '10pt',
            customerNameFontSize: '13pt',
            customerNameMarginBottom: '0.04in',
            addressFontSize: '9pt',
            addressMarginBottom: '0.02in',
            custNumberFontSize: '9pt',
            custNumberMarginTop: '0.04in',
            bottomPaddingTop: '0.06in',
            infoFontSize: '9pt',
            infoMarginBottom: '0.03in',
            deliveryDateFontSize: '10pt',
            deliveryDateMarginBottom: '0.03in',
            boxIndicatorFontSize: '16pt',
            boxIndicatorMarginTop: '0.06in',
          };
      }
    };

    const dims = getPageSizeAndDimensions();
    const customerAddress = orderHeader.customer?.C_Address;
    const city = orderHeader.customer?.C_City;
    const state = orderHeader.customer?.C_State;
    const accountNumber = orderNumber.toString();
    const deliveryDate = date;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            ${dims.pageSize}
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .label-page {
            width: ${dims.bodyWidth};
            height: ${dims.bodyHeight};
            padding: ${dims.bodyPadding};
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .label-container {
            width: 100%;
            height: 100%;
            border: 2px solid black;
            padding: ${dims.containerPadding};
            display: flex;
            flex-direction: column;
          }
          .header-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: ${dims.headerMarginBottom};
          }
          .route-box, .stop-box {
            border: 2px solid black;
            padding: ${dims.routeStopPadding};
            font-size: ${dims.routeStopFontSize};
            font-weight: bold;
          }
          .barcode-section {
            text-align: center;
            margin: ${dims.barcodeMargin};
          }
          .barcode-section img {
            max-width: ${dims.barcodeMaxWidth};
            height: auto;
            max-height: ${dims.barcodeMaxHeight};
          }
          .customer-section {
            border: 2px solid black;
            padding: ${dims.customerPadding};
            margin-bottom: ${dims.customerMarginBottom};
            font-size: ${dims.customerFontSize};
          }
          .customer-name {
            font-size: ${dims.customerNameFontSize};
            font-weight: bold;
            margin-bottom: ${dims.customerNameMarginBottom};
          }
          .address-line {
            font-size: ${dims.addressFontSize};
            margin-bottom: ${dims.addressMarginBottom};
            line-height: 1.2;
          }
          .cust-number {
            text-align: right;
            font-size: ${dims.custNumberFontSize};
            margin-top: ${dims.custNumberMarginTop};
          }
          .bottom-section {
            margin-top: auto;
            padding-top: ${dims.bottomPaddingTop};
          }
          .info-row {
            font-size: ${dims.infoFontSize};
            margin-bottom: ${dims.infoMarginBottom};
          }
          .delivery-date {
            font-size: ${dims.deliveryDateFontSize};
            font-weight: bold;
            margin-bottom: ${dims.deliveryDateMarginBottom};
          }
          .item-count {
            font-size: ${dims.infoFontSize};
            margin-bottom: 0.05in;
          }
          .box-indicator {
            text-align: center;
            font-size: ${dims.boxIndicatorFontSize};
            font-weight: bold;
            margin-top: ${dims.boxIndicatorMarginTop};
          }
          @media print {
            @page {
              ${dims.pageSize}
              margin: 0 !important;
              padding: 0 !important;
            }
            @page :first {
              margin: 0 !important;
            }
            @page :left {
              margin: 0 !important;
            }
            @page :right {
              margin: 0 !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            .label-page {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: ${dims.bodyWidth} !important;
              height: ${dims.bodyHeight} !important;
              padding: ${dims.bodyPadding} !important;
            }
            .label-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            header, footer {
              display: none !important;
            }
            @page {
              marks: none;
            }
          }
        </style>
      </head>
      <body>
    `;

    // Generate one label per bundle (using bundle label structure from labelGenerator.ts)
    for (let i = 1; i <= bundlesCount; i++) {
      const label = labels[i - 1];
      const xOfY = `${i} of ${bundlesCount}`;
      
      // Wrap each label in a page-break container (like printAllLabels does)
      html += `<div class="label-page" style="page-break-after: always; page-break-inside: avoid;">`;
      html += `
        <div class="label-container">
          <div class="header-section">
            <div class="route-box">ROUTE: ${label.route}</div>
            <div class="stop-box">STOP: ${label.stop}</div>
          </div>
          ${label.barcodeImage ? `
          <div class="barcode-section">
            <img src="${label.barcodeImage}" alt="Barcode" />
          </div>
          ` : ''}
          <div class="customer-section">
            <div class="customer-name">${label.customerName}</div>
            ${customerAddress ? `<div class="address-line">${customerAddress}</div>` : ''}
            ${city || state ? `
              <div class="address-line">
                ${city || ''}${city && state ? ', ' : ''}${state || ''}
              </div>
            ` : ''}
            ${customerNumber !== 'N/A' ? `<div class="cust-number">Cust #${customerNumber}</div>` : ''}
          </div>
          <div class="bottom-section">
            <div class="info-row">${accountNumber}</div>
            ${deliveryDate ? `<div class="delivery-date">Delivery Date: ${deliveryDate}</div>` : ''}
          </div>
          <div class="box-indicator">
            ${xOfY}
          </div>
        </div>
      `;
      html += '</div>';
    }

    html += `
        <script>
          // Try to remove headers and footers (browser-dependent)
          window.onbeforeprint = function() {
            // This runs before print dialog opens
          };
          window.onafterprint = function() {
            // This runs after print
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Don't close immediately - let user cancel print dialog if needed
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 250);
  }, [orderHeader, currentOrderNumber]);

  // Handle complete order with print - opens size selection modal first
  const handleCompleteOrderWithPrint = async () => {
    if (!currentOrderNumber) return;

    // Validate bundles value
    if (!bundlesValue || bundlesValue.trim() === '') {
      toast.error('Please enter bundles count');
      return;
    }

    const bundlesNumber = parseInt(bundlesValue.trim(), 10);
    if (isNaN(bundlesNumber) || bundlesNumber <= 0) {
      toast.error('Please enter a valid bundles count');
      return;
    }

    // Store bundles count, close completion modal, and open size selection modal
    setPendingBundlesCount(bundlesNumber);
    setCompletionModalOpen(false);
    setBundleSizeModalOpen(true);
  };

  // Handle confirm print labels (shows confirmation modal)
  const handleConfirmPrintLabels = () => {
    if (pendingBundlesCount === null) return;
    
    setBundlePrintConfirmationData({
      bundlesCount: pendingBundlesCount,
      size: selectedBundleSize,
      isReviewMode: isReviewMode,
    });
    setBundleSizeModalOpen(false);
    setBundlePrintConfirmationModalOpen(true);
  };

  // Handle actual print execution (from confirmation modal)
  const handleExecutePrintLabels = async () => {
    if (!bundlePrintConfirmationData) return;

    const { bundlesCount, size, isReviewMode: isReview } = bundlePrintConfirmationData;

    if (!isReview) {
      // Normal mode: complete order and print
      if (!currentOrderNumber) return;

      // Build order detail array from all order lines
      const orderDetailArray = buildOrderDetailArray(
        orderDetails,
        currentOrderNumber,
        confirmedLines,
        'completed'
      );

      const currentOrderline = Math.max(...orderDetails.map((item: OrderDetailItem) => item.Line_Number), 0);

      // Prepare payload with bundles
      const payload: any = {
        orderNumber: currentOrderNumber,
        status: 'completed',
        current_orderline: currentOrderline,
        orderDetail: orderDetailArray,
        Bundles: bundlesCount,
      };

      try {
        const response = await dispatch(
          updateOrderConfirmationThunk(payload)
        ).unwrap();

        // Mark order as completed to prevent automatic save
        setIsOrderCompleted(true);
        hasSavedRef.current = true;
        
        // Extract barcodes from API response
        const barcodes = response?.data?.barcodes || response?.barcodes || [];
        
        if (barcodes.length > 0) {
          // Print labels with barcodes
          printLabels(bundlesCount, barcodes, size);
        } else {
          toast.error('No barcodes received from server');
        }
        
        // Close modals
        setCompletionModalOpen(false);
        setBundlesModalOpen(false);
        setBundlePrintConfirmationModalOpen(false);
        setBundlesValue('');
        setPendingBundlesCount(null);
        setBundlePrintConfirmationData(null);
        
        // Clear Redux data after successful completion
        dispatch(clearOrderDetails());
        dispatch(clearScannedItems());
        dispatch(resetConfirmedLines());
        dispatch(setCurrentOrderNumber(null));
        dispatch(setIsScanning(false));
        
        toast.success('Order confirmed and labels printed successfully');
        navigate('/sales/order-confirmation');
      } catch (error: any) {
        toast.error(error || 'Failed to confirm order');
      }
    } else {
      // Review mode: fetch order details to get barcodes
      if (!currentOrderNumber) {
        toast.error('No order number available');
        return;
      }

      try {
        // Fetch order details which contains barcodes
        const detailsResponse = await dispatch(
          fetchOrderConfirmationDetails(currentOrderNumber)
        ).unwrap();

        // Extract barcodes from response
        const barcodes = detailsResponse?.barcodes || [];

        if (barcodes.length > 0) {
          // Print labels with barcodes
          printLabels(bundlesCount, barcodes, size);
          setBundlePrintConfirmationModalOpen(false);
          setPendingBundlesCount(null);
          setBundlePrintConfirmationData(null);
          toast.success('Labels printed successfully');
        } else {
          toast.error('No barcodes found for this order');
        }
      } catch (error: any) {
        toast.error(error || 'Failed to fetch order details');
      }
    }
  };

  // Handle complete order confirmation
  const handleCompleteOrder = async () => {
    if (!currentOrderNumber) return;

    // Build order detail array from all order lines
    // Include all lines even if not fully scanned - use scanned quantity or 0
    const orderDetailArray = buildOrderDetailArray(
      orderDetails,
      currentOrderNumber,
      confirmedLines,
      'completed'
    );

    const currentOrderline = Math.max(...orderDetails.map((item: OrderDetailItem) => item.Line_Number), 0);

    // Prepare payload with bundles (only for completed status)
    const payload: any = {
      orderNumber: currentOrderNumber,
      status: 'completed',
      current_orderline: currentOrderline,
      orderDetail: orderDetailArray,
    };

    // Add bundles only if provided and status is completed (convert to integer)
    if (bundlesValue && bundlesValue.trim() !== '') {
      const bundlesNumber = parseInt(bundlesValue.trim(), 10);
      if (!isNaN(bundlesNumber)) {
        payload.Bundles = bundlesNumber;
      }
    }

    try {
      await dispatch(
        updateOrderConfirmationThunk(payload)
      ).unwrap();

      // Mark order as completed to prevent automatic save
      setIsOrderCompleted(true);
      hasSavedRef.current = true; // Prevent any pending saves
      
      // Close modals
      setCompletionModalOpen(false);
      setBundlesModalOpen(false);
      setBundlesValue('');
      
      // Clear Redux data after successful completion
      dispatch(clearOrderDetails());
      dispatch(clearScannedItems());
      dispatch(resetConfirmedLines());
      dispatch(setCurrentOrderNumber(null));
      dispatch(setIsScanning(false));
      
      toast.success('Order confirmed successfully');
      navigate('/sales/order-confirmation');
    } catch (error: any) {
      toast.error(error || 'Failed to confirm order');
    }
  };

  // Table columns for order details
  const detailColumns: TableColumn<OrderDetailItem>[] = [
    {
        id: 'Line_Number',
        label: 'Line',
        align: 'center',
        render: (row) => (
          <Typography fontSize={11} fontWeight={400}>
            {row.Line_Number}
          </Typography>
        ),
      },
    {
        id: 'Item_Number',
        label: 'Item #',
        render: (row) => (
          <Typography fontSize={11} fontWeight={400}>
            {row.Item_Number}
          </Typography>
        ),
      },
    {
      id: 'products',
      label: 'Products',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <img
            src={row.isDistributorImageShow && row.distributorImage ? row.distributorImage : row.masterImage}
            onError={(e) => {
              e.currentTarget.src = image;
            }}
            alt={row.inventory.Description}
            style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '4px' }}
          />
          <Box>
            <Typography fontSize={11} fontWeight={400}>
              {row.inventory.Description}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'Pack',
      label: 'Pack',
      align: 'center',
      render: (row) => (
        <Typography fontSize={11} fontWeight={400}>
          {Number(row.Pack).toFixed(0)}
        </Typography>
      ),
    },
    {
      id: 'Price',
      label: 'Price',
      render: (row) => {
        const totalPrice = Number(row.Price) || 0;
        return (
          <Typography fontSize={11} fontWeight={400}>
            ${totalPrice.toFixed(2)}
          </Typography>
        );
      },
      align: 'right',
    },  
    {
      id: 'Quantity_Ordered',
      label: 'Ordered',
      align: 'center',
      render: (row) => (
        <Typography fontSize={11} fontWeight={400}>
          {Number(row.Quantity_Ordered).toFixed(0)}
        </Typography>
      ),
    },
    {
      id: 'Quantity_Shipped',
      label: 'Shipped',
      align: 'center',
      render: (row) => {
        const confirmed = confirmedLines[row.Line_Number];
        const quantityShipped = confirmed?.quantityShipped ?? row.Quantity_Shipped ?? 0;
        const isActiveLine = row.Line_Number === currentActiveLine;
        const isCompleted = quantityShipped === row.Quantity_Ordered;
        const isEditing = editingLineNumber === row.Line_Number;

        // If product is being edited, show input field (works for both UPC and non-UPC products) - disabled in review mode
        if (isEditing && !isReviewMode) {
          return (
            <Box display="flex" alignItems="center" justifyContent="center">
              <TextField
                value={manualQuantity}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove non-numeric characters
                  value = value.replace(/[^0-9]/g, '');
                  // Always allow empty string for editing
                  if (value === '') {
                    setManualQuantity('');
                    return;
                  }
                  // Check if value is within valid range
                  const numValue = Number(value);
                  if (numValue >= 0 && numValue <= row.Quantity_Ordered) {
                    setManualQuantity(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (manualQuantity !== '' && Number(manualQuantity) >= 0 && Number(manualQuantity) <= row.Quantity_Ordered) {
                      handleManualQuantitySubmit(row.Line_Number, row.Quantity_Ordered);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingLineNumber(null);
                    setManualQuantity('');
                  }
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { 
                    textAlign: 'center',
                    padding: '4px 6px',
                    fontSize: '11px',
                    width: '55px'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '26px',
                    '& input': {
                      padding: '4px 6px',
                      fontSize: '11px',
                    }
                  }
                }}
                autoFocus
                onFocus={(e) => {
                  e.target.select();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </Box>
          );
        }

        // Normal display - clickable to edit (disabled in review mode)
        return (
          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <Typography
              fontSize={11}
              fontWeight={400}
              color={
                isReviewMode
                  ? 'text.disabled'
                  : isCompleted
                  ? 'success.main'
                  : isActiveLine
                  ? 'primary.main'
                  : 'warning.main'
              }
              align="center"
              onClick={() => {
                if (!isReviewMode && !isEditing) {
                  setEditingLineNumber(row.Line_Number);
                  setManualQuantity(quantityShipped.toString());
                }
              }}
              sx={{
                cursor: !isReviewMode && !isEditing ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: !isReviewMode && !isEditing ? 'underline' : 'none',
                }
              }}
            >
              {Number(quantityShipped).toFixed(0)}
            </Typography>
            {confirmed?.scanned && <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />}
          </Box>
        );
      },
    }
  ];

  // Get row style based on status
  const getRowStyle = (row: OrderDetailItem) => {
    const confirmed = confirmedLines[row.Line_Number];
    const quantityShipped = confirmed?.quantityShipped ?? row.Quantity_Shipped ?? 0;
    const isActiveLine = row.Line_Number === currentActiveLine;
    const isCompleted = quantityShipped === row.Quantity_Ordered;

    if (isCompleted) {
      // Darker green for completed items
      return {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0',
      };
    }
    if (isActiveLine) {
      // Pending color for current/active line
      return {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.25)' : '#fef08a',
      };
    }
    // Darker yellow for pending items
    return {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.25)' : '#fef08a',
    };
  };

  // Calculate runtime from startTime and endTime (digital clock format HH:MM:SS)
  const calculateRuntime = (startTime: string | null | undefined, endTime: string | null | undefined): string => {
    if (!startTime) return '00:00:00';
    
    const start = dayjs(startTime);
    const end = endTime ? dayjs(endTime) : currentTime; // Use current time if endTime is null (for real-time updates)
    
    const diffInSeconds = Math.max(0, end.diff(start, 'second'));
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    
    // Format as digital clock: HH:MM:SS
    const formatNumber = (num: number) => String(num).padStart(2, '0');
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
  };

  if (detailsLoading) {
    return (
      <Box sx={{ padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography fontSize={14} fontWeight={500}>Loading order details...</Typography>
      </Box>
    );
  }

  // Calculate runtime for header display
  const currentOrder = orderList.find((item) => item.Order_Number === orderHeader?.Order_Number);
  const orderConfirmed = currentOrder?.isOrderConfirmed as { 
    status?: string;
    startTime?: string | null; 
    endTime?: string | null;
    'sales.firstName'?: string;
    'sales.lastName'?: string;
  } | null | undefined;
  const startTime = orderConfirmed?.startTime || (pageOpenTime ? pageOpenTime.toISOString() : null);
  const runtime = startTime
    ? calculateRuntime(
        startTime,
        orderConfirmed?.endTime
      )
    : null;
  
  // Get sales person name
  const salesFirstName = orderConfirmed?.['sales.firstName'] || '';
  const salesLastName = orderConfirmed?.['sales.lastName'] || '';
  const salesPersonName = salesFirstName && salesLastName 
    ? `${salesFirstName} ${salesLastName}`.trim()
    : null;
  
  // Determine if order is pending or confirmed
  const orderStatus = orderConfirmed?.status || currentOrder?.status || '';
  const isPending = orderStatus === 'pending';
  const confirmationText = isPending ? 'Order confirming by:' : 'Order confirmed by:';

  return (
    <Box sx={{ padding: '12px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Modern Header with Order Info and Action Buttons */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          {/* Header Row with Title and Buttons */}
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <KeyboardBackspaceOutlined
                onClick={() => handleNavigate('/sales/order-confirmation')}
                sx={{ 
                  cursor: 'pointer', 
                  width: 20, 
                  height: 20,
                  color: 'text.secondary',
                  '&:hover': { 
                    color: 'primary.main',
                    transform: 'translateX(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}
              />
              <Typography variant="h5" fontWeight={500} sx={{ fontSize: 16, color: 'text.primary' }}>
                Order Confirmation
              </Typography>
            </Box>
            
            {/* Action Buttons */}
            <Box 
              display="flex" 
              gap={0.75} 
              alignItems="center"
              flexWrap="wrap"
              sx={{ 
                '@media (max-width: 768px)': {
                  width: '100%',
                  justifyContent: 'flex-end',
                  mt: 0.5
                }
              }}
            >
              {runtime && (
                <Typography 
                  variant="h5" 
                  fontWeight={500} 
                  sx={{ 
                    fontSize: 18, 
                    color: 'primary.main',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    marginRight: '10px',
                  }}
                >
                  {runtime}
                </Typography>
              )}
              {isReviewMode ? (
                (() => {
                  // Get erpConfirmStatus from orderList
                  const currentOrder = orderList.find((item) => item.Order_Number === currentOrderNumber);
                  const erpConfirmStatus = (currentOrder as any)?.erpConfirmStatus;
                  const isERPConfirmed = erpConfirmStatus === 'Confirmed from ERP';
                  
                  // Hide Print Bundles button if order is confirmed from ERP
                  if (isERPConfirmed) {
                    return null;
                  }
                  
                  return (
                    <CustomButton
                      appearance="filled"
                      onClick={() => {
                        const bundles = getBundlesFromOrderList();
                        if (bundles > 0) {
                          setPendingBundlesCount(bundles);
                          setSelectedBundleSize('4x6'); // Default to 4x6 for review mode
                          setBundleSizeModalOpen(true);
                        } else {
                          toast.error('No bundles found for this order');
                        }
                      }}
                      sx={{ 
                        minWidth: 120,
                        fontSize: 11,
                        fontWeight: 400,
                        px: 1.5,
                        py: 0.5,
                        mt: 0,
                        height: '28px',
                        borderRadius: '6px',
                        textTransform: 'none',
                      }}
                      fullWidth={false}
                    >
                      Print Bundles
                    </CustomButton>
                  );
                })()
              ) : (
                <>
                  <CustomButton
                    appearance="outlined"
                    buttonType="cancel"
                    onClick={() => handleNavigate('/sales/order-confirmation')}
                    sx={{ 
                      minWidth: 70,
                      fontSize: 11,
                      fontWeight: 400,
                      px: 1.5,
                      py: 0.5,
                      height: '28px',
                      mt: 0,
                      borderRadius: '6px',
                      textTransform: 'none',
                    }}
                    fullWidth={false}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Cancel'}
                  </CustomButton>
                  <CustomButton
                    appearance="filled"
                    onClick={() => {
                      // Always show completion modal - it will display incomplete items if any
                      setModalManuallyClosed(false);
                      setCompletionModalOpen(true);
                    }}
                    loading={updateLoading}
                    disabled={updateLoading}
                    sx={{ 
                      minWidth: 100,
                      fontSize: 11,
                      fontWeight: 400,
                      px: 1.5,
                      py: 0.5,
                      mt: 0,
                      height: '28px',
                      borderRadius: '6px',
                      textTransform: 'none',
                    }}
                    fullWidth={false}
                  >
                    Complete
                  </CustomButton>
                </>
              )}
            </Box>
          </Box>
          
          {/* Order Info Section */}
          {orderHeader && (
            <Box display="flex" flexDirection="column" gap={1}>
              {/* Combined Order & Customer Info */}
              <Box 
                display="flex" 
                flexWrap="wrap" 
                gap={1} 
                alignItems="center"
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                }}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography fontSize={10} fontWeight={400} color="text.secondary">
                    Order #
                  </Typography>
                  <Typography fontSize={11} fontWeight={500} color="primary.main">
                    {orderHeader.Order_Number}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    width: '1px', 
                    height: '14px', 
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                  }} 
                />
                
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography fontSize={10} fontWeight={400} color="text.secondary">
                    Date:
                  </Typography>
                  <Typography fontSize={11} fontWeight={500} color="text.primary">
                    {orderHeader.Order_Date ? dayjs(orderHeader.Order_Date).format('MM-DD-YYYY') : ''}
                  </Typography>
                </Box>

                {(() => {
                  const currentOrder = orderList.find((item) => item.Order_Number === orderHeader.Order_Number);
                  const hasSalesRep = currentOrder?.salesRep;
                  
                  return hasSalesRep ? (
                    <>
                      <Box 
                        sx={{ 
                          width: '1px', 
                          height: '14px', 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                        }} 
                      />
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography fontSize={10} fontWeight={400} color="text.secondary">
                          Sales Rep:
                        </Typography>
                        <Typography fontSize={11} fontWeight={500} color="text.primary">
                          {currentOrder.salesRep}
                        </Typography>
                      </Box>
                    </>
                  ) : null;
                })()}

                {/* Customer Details - Inline */}
                {orderHeader.customer && (
                  <>
                    <Box 
                      sx={{ 
                        width: '1px', 
                        height: '14px', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                      }} 
                    />
                    
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography fontSize={10} fontWeight={400} color="text.secondary">
                        C#:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500} color="text.primary">
                        {orderHeader.customer.C_Number || 'N/A'}
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        width: '1px', 
                        height: '14px', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                      }} 
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography fontSize={10} fontWeight={400} color="text.secondary">
                        Customer:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500} color="text.primary">
                        {orderHeader.customer.C_Name || 'N/A'}
                      </Typography>
                    </Box>
                    
                   
                    
                    <Box 
                      sx={{ 
                        width: '1px', 
                        height: '14px', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                      }} 
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography fontSize={10} fontWeight={400} color="text.secondary">
                        Address:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500} color="text.primary" sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const address = orderHeader.customer.C_Address || '';
                          const city = orderHeader.customer.C_City || '';
                          const state = orderHeader.customer.C_State || '';
                          const parts = [address, city, state].filter(Boolean);
                          return parts.length > 0 ? parts.join(', ') : 'N/A';
                        })()}
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        width: '1px', 
                        height: '14px', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                      }} 
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography fontSize={10} fontWeight={400} color="text.secondary">
                        Phone:
                      </Typography>
                      <Typography fontSize={11} fontWeight={500} color="text.primary">
                        {orderHeader.customer.C_Phone || 'N/A'}
                      </Typography>
                    </Box>
                    {orderHeader.customer.customerRoute && (
                      <>
                        <Box 
                          sx={{ 
                            width: '1px', 
                            height: '14px', 
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                          }} 
                        />
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography fontSize={10} fontWeight={400} color="text.secondary">
                            Route/Stop:
                          </Typography>
                          <Typography fontSize={11} fontWeight={500} color="text.primary">
                            {orderHeader.customer.customerRoute.Route_Number !== undefined && 
                             orderHeader.customer.customerRoute.Stop_Number !== undefined
                              ? `${orderHeader.customer.customerRoute.Route_Number}/${orderHeader.customer.customerRoute.Stop_Number}`
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </>
                    )}
                    
                    {/* Order Confirming/Confirmed By */}
                    {salesPersonName && (
                      <>
                        <Box 
                          sx={{ 
                            width: '1px', 
                            height: '14px', 
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                          }} 
                        />
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography fontSize={10} fontWeight={400} color="text.secondary">
                            {confirmationText}
                          </Typography>
                          <Typography fontSize={11} fontWeight={500} color="text.primary">
                            {salesPersonName}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </Box>

              {/* Stats Grid */}
              <Box 
                display="grid" 
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }}
                gap={1}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '6px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.25}>
                    Total Items
                  </Typography>
                  <Typography fontSize={14} fontWeight={500} color={theme.palette.mode === 'dark' ? '#a78bfa' : '#7c3aed'}>
                    {orderDetails.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: '6px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#bae6fd'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.25}>
                    Qty Ordered
                  </Typography>
                  <Typography fontSize={14} fontWeight={500} color={theme.palette.mode === 'dark' ? '#60a5fa' : '#0284c7'}>
                    {calculateTotalQuantityOrdered()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: '6px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.25}>
                    Qty Scanned
                  </Typography>
                  <Typography fontSize={14} fontWeight={500} color={theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a'}>
                    {calculateTotalQuantityScanned()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: '6px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#fef3c7',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.3)' : '#fde68a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.25}>
                    Total Price
                  </Typography>
                  <Typography fontSize={14} fontWeight={500} color={theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'}>
                    ${Number(orderHeader.Total_Price).toFixed(2)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: '6px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.25}>
                    Scanned Price
                  </Typography>
                  <Typography fontSize={14} fontWeight={500} color={theme.palette.mode === 'dark' ? '#34d399' : '#059669'}>
                    ${calculateScannedItemsPrice().toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Modern Scan Status Message */}
      {scanMessage.text && (
        <Paper
          elevation={0}
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: '8px',
            background: scanMessage.type === 'success' 
              ? (theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
              : (theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'),
            color: 'white',
            boxShadow: scanMessage.type === 'success'
              ? (theme.palette.mode === 'dark' 
                ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.25)')
              : (theme.palette.mode === 'dark'
                ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                : '0 4px 14px rgba(239, 68, 68, 0.25)'),
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: {
                opacity: 0,
                transform: 'translateY(-10px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Typography
            fontSize={12}
            fontWeight={500}
            sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            {scanMessage.type === 'success' && <CheckCircle sx={{ fontSize: 16 }} />}
            {scanMessage.text}
          </Typography>
        </Paper>
      )}

      {/* Tabs and Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            minHeight: 'auto',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 500,
              minHeight: 36,
              px: 2,
              py: 1,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
            },
          }}
        >
          <Tab label="All Items" value="all" />
          <Tab label="Pending Items" value="pending" />
          <Tab label="Confirmed Items" value="confirmed" />
        </Tabs>
        
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          {!isReviewMode && (
            <CustomButton
              appearance="filled"
              onClick={() => {
                setManualAddItemModalOpen(true);
                setSearchQuery('');
                setSearchResults([]);
                setSelectedProduct(null);
                setSelectedProductQuantity('1');
      selectedProductQuantityRef.current = '1';
              }}
              sx={{
                minWidth: 140,
                fontSize: 11,
                fontWeight: 400,
                px: 1.5,
                py: 0.5,
                mt: 0,
                height: '36px',
                borderRadius: '6px',
                textTransform: 'none',
              }}
              fullWidth={false}
            >
              Add More Item
            </CustomButton>
          )}
          <CustomButton
            appearance="outlined"
            onClick={fetchSalesCategorySummary}
            disabled={loadingSalesCategorySummary || !orderDetails.length}
            loading={loadingSalesCategorySummary}
            sx={{
              minWidth: 180,
              fontSize: 11,
              fontWeight: 400,
              px: 1.5,
              py: 0.5,
              mt: 0,
              height: '36px',
              borderRadius: '6px',
              textTransform: 'none',
            }}
            fullWidth={false}
          >
            Sales Category Summary
          </CustomButton>
        </Box>
      </Box>

      {/* Modern Order Details Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, 
          mb: 2, 
          borderRadius: '12px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <CommonTable
          data={getFilteredOrderDetails()}
          columns={detailColumns}
          containerHeight="calc(100vh - 450px)"
          loading={detailsLoading}
          filterComponent={null}
          currentPage={1}
          totalPages={1}
          totalItems={getFilteredOrderDetails().length}
          pageSize={getFilteredOrderDetails().length || 10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          isPagination={false}
          getRowStyle={getRowStyle}
          cellStyle={{ padding: '8px 10px' }}
        />
      </Paper>

      {/* Modern Keyboard Guidance - Hidden in review mode */}
      {!isReviewMode && (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, 
          mb: 2, 
          borderRadius: '8px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
        }}
      >
        {/* <Box display="flex" alignItems="center" gap={0.75} mb={1}>
          <Box
            sx={{
              width: 3,
              height: 16,
              borderRadius: '2px',
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
            }}
          />
          <Typography fontSize={12} fontWeight={500} color="text.primary">
            Keyboard Shortcuts
          </Typography>
        </Box> */}
        <Box 
          display="flex" 
          flexWrap="wrap"
          alignItems="center"
          gap={1}
        >
         
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
              }}
            />
            <Typography fontSize={11} fontWeight={400} color="text.secondary">
              Press <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Enter</Box> or <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Tab</Box> or <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Esc</Box> to open current line input
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
              }}
            />
            <Typography fontSize={11} fontWeight={400} color="text.secondary">
              Press <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Enter</Box> to submit
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
              }}
            />
            <Typography fontSize={11} fontWeight={400} color="text.secondary">
              Press <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Esc</Box> to cancel
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
              }}
            />
            <Typography fontSize={11} fontWeight={400} color="text.secondary">
              In modals: <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Enter</Box> to complete, <Box component="span" sx={{ fontWeight: 500, color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea' }}>Esc</Box> to close
            </Typography>
          </Box>
          
          <Box 
                      sx={{ 
                        width: '1px', 
                        height: '14px', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1' 
                      }} 
                    />
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#667eea',
              }}
            />
            <Typography fontSize={11} fontWeight={400} color="text.secondary">
              Click on quantity to edit manually
            </Typography>
          </Box>
        </Box>
      </Paper>
      )}

      {/* Completion Confirmation Modal */}
      <Dialog
        open={completionModalOpen}
        onClose={() => {
          setCompletionModalOpen(false);
          setModalManuallyClosed(true);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            position: 'relative',
          },
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setCompletionModalOpen(false);
            setModalManuallyClosed(true);
            setBundlesValue('');
          } else if (e.key === 'Enter' && !updateLoading) {
            // Only trigger if not focused on an input field (bundles input has its own handler)
            const activeElement = document.activeElement;
            if (
              activeElement &&
              (activeElement.tagName === 'INPUT' || 
               activeElement.tagName === 'TEXTAREA' ||
               activeElement.getAttribute('contenteditable') === 'true')
            ) {
              // Let the input field handle Enter (bundles input will call handleCompleteOrder)
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            handleCompleteOrder();
          }
        }}
      >
        <DialogTitle sx={{ pb: 3, fontSize: 16, fontWeight: 500, position: 'relative', pr: 8 }}>
          Complete Order
          {/* Bundles input in top corner */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: '150px',
            }}
          >
            <TextField
              label="Bundles"
              value={bundlesValue}
              onChange={(e) => {
                let value = e.target.value;
                // Remove non-numeric characters
                value = value.replace(/[^0-9]/g, '');
                // Limit to 5 digits
                if (value.length <= 5) {
                  setBundlesValue(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !updateLoading) {
                  e.preventDefault();
                  handleCompleteOrder();
                }
              }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 5,
              }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '14px',
                  height: '40px',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '14px',
                },
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {(() => {
            const incompleteItems = getIncompleteItems();
            const hasIncompleteItems = incompleteItems.length > 0;

            if (hasIncompleteItems) {
              return (
                <>
                  <Typography 
                    variant="body1" 
                    color="warning.main" 
                    fontSize={14} 
                    fontWeight={500}
                    sx={{ mb: 1.5 }}
                  >
                    Are you sure you want to complete? You will have to leave these items:
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                      mb: 2,
                    }}
                  >
                    <List dense sx={{ py: 0 }}>
                      {incompleteItems.map((item, index) => {
                        const confirmed = confirmedLines[item.Line_Number];
                        const quantityShipped = confirmed?.quantityShipped ?? 0;
                        const remaining = item.Quantity_Ordered - quantityShipped;
                        
                        return (
                          <React.Fragment key={item.Line_Number}>
                            <ListItem
                              sx={{
                                py: 1,
                                px: 2,
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                                      Line {item.Line_Number}: {item.inventory.Description}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.5 }}>
                                    Ordered: {item.Quantity_Ordered} | Shipped: {quantityShipped} | Remaining: {remaining}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < incompleteItems.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Box>
                </>
              );
            } else {
              return (
                <Typography variant="body1" color="text.secondary" fontSize={14} sx={{ mb: 2 }}>
                  All items have been scanned. Do you want to complete the order?
                </Typography>
              );
            }
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2, flexWrap: 'wrap' }}>
          <CustomButton
            onClick={() => {
              setCompletionModalOpen(false);
              setModalManuallyClosed(true);
              setBundlesValue('');
            }}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            disabled={updateLoading}
          >
            Review
          </CustomButton>
          <CustomButton
            onClick={handleCompleteOrder}
            appearance="filled"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            size="small"
            loading={updateLoading}
            disabled={updateLoading}
          >
            Complete
          </CustomButton>
          <CustomButton
            onClick={handleCompleteOrderWithPrint}
            appearance="filled"
            fullWidth={false}
            sx={{ minWidth: 140 }}
            size="small"
            loading={updateLoading}
            disabled={updateLoading || !bundlesValue || bundlesValue.trim() === ''}
          >
            Complete with Print
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Bundle Size Selection Modal - Using CommonModal like OrderChecker */}
      <CommonModal
        open={bundleSizeModalOpen}
        onClose={() => {
          if (!updateLoading) {
            setBundleSizeModalOpen(false);
            setPendingBundlesCount(null);
          }
        }}
        title="Print Bundles"
        size="md"
        isCloseIcon={false}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel>Label Size</InputLabel>
            <Select
              value={selectedBundleSize}
              onChange={(e) => setSelectedBundleSize(e.target.value as LabelSize)}
              label="Label Size"
            >
              <MenuItem value="4x3">4x3</MenuItem>
              <MenuItem value="4x6">4x6</MenuItem>
              <MenuItem value="3x6">3x6</MenuItem>
              <MenuItem value="3x2">3x2</MenuItem>
              <MenuItem value="4x4">4x4</MenuItem>
              <MenuItem value="2x2">2x2</MenuItem>
              <MenuItem value="2x3">2x3</MenuItem>
              <MenuItem value="A4">A4</MenuItem>
            </Select>
          </FormControl>
          
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                setBundleSizeModalOpen(false);
                setPendingBundlesCount(null);
              }}
              fullWidth={false}
              disabled={updateLoading}
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              buttonType="primary"
              onClick={handleConfirmPrintLabels}
              fullWidth={false}
              loading={updateLoading}
              disabled={updateLoading || pendingBundlesCount === null}
              sx={{ mt: 0 }}
            >
              {isReviewMode ? 'Print Labels' : 'Print Labels'}
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Bundle Print Confirmation Modal - Like OrderChecker */}
      <CommonModal
        open={bundlePrintConfirmationModalOpen}
        onClose={() => {
          if (!updateLoading) {
            setBundlePrintConfirmationModalOpen(false);
            setBundlePrintConfirmationData(null);
          }
        }}
        title={bundlePrintConfirmationData?.isReviewMode ? 'Confirm Print Labels' : 'Confirm Print & Complete'}
        size="sm"
        isCloseIcon={false}
      >
        <Box>
          <Typography variant="body2" fontSize={12} color="text.primary" mb={1.5}>
            {bundlePrintConfirmationData
              ? `Are you sure you want to print ${bundlePrintConfirmationData.bundlesCount} bundle${bundlePrintConfirmationData.bundlesCount !== 1 ? 's' : ''} with size ${bundlePrintConfirmationData.size}?${bundlePrintConfirmationData.isReviewMode ? '' : ' This will complete the order.'}`
              : 'Are you sure you want to proceed?'}
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={1} mt={1.5}>
            <CustomButton
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                if (!updateLoading) {
                  setBundlePrintConfirmationModalOpen(false);
                  setBundlePrintConfirmationData(null);
                }
              }}
              size="small"
              fullWidth={false}
              disabled={updateLoading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              buttonType="primary"
              onClick={handleExecutePrintLabels}
              size="small"
              fullWidth={false}
              loading={updateLoading}
              disabled={updateLoading}
            >
              Confirm
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* No UPC Modal */}
      <Dialog
        open={noUPCModalOpen}
        onClose={() => {
          setNoUPCModalOpen(false);
          setNoUPCLineNumber(null);
        }}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={false}
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: 16, fontWeight: 500 }}>
          No UPC Number
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" color="text.secondary" fontSize={14}>
            There is no UPC number for this product. Please check the product and enter manually.
          </Typography>
          {noUPCLineNumber && (
            <Box mt={1}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                Line Number: {noUPCLineNumber}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => {
              if (noUPCLineNumber) {
                const lineItem = orderDetails.find((item: OrderDetailItem) => item.Line_Number === noUPCLineNumber);
                if (lineItem) {
                  const confirmed = confirmedLines[noUPCLineNumber];
                  const quantityShipped = confirmed?.quantityShipped ?? lineItem.Quantity_Shipped ?? 0;
                  setEditingLineNumber(noUPCLineNumber);
                  setManualQuantity(quantityShipped.toString());
                }
              }
              setNoUPCModalOpen(false);
              setNoUPCLineNumber(null);
            }}
            appearance="filled"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            size="small"
          >
            Enter Manually
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Bundles Modal (for partial completion) */}
      <Dialog
        open={bundlesModalOpen}
        onClose={() => {
          setBundlesModalOpen(false);
          setBundlesValue('');
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setBundlesModalOpen(false);
            setBundlesValue('');
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: 16, fontWeight: 500 }}>
          Complete Order
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" color="text.secondary" fontSize={14} sx={{ mb: 2 }}>
            Enter bundles to complete the order.
          </Typography>
          <TextField
            label="Bundles"
            value={bundlesValue}
            onChange={(e) => {
              let value = e.target.value;
              // Remove non-numeric characters
              value = value.replace(/[^0-9]/g, '');
              // Limit to 5 digits
              if (value.length <= 5) {
                setBundlesValue(value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !updateLoading) {
                e.preventDefault();
                handleCompleteOrder();
              }
            }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 5,
            }}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => {
              setBundlesModalOpen(false);
              setBundlesValue('');
            }}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            disabled={updateLoading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleCompleteOrder}
            appearance="filled"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            size="small"
            loading={updateLoading}
            disabled={updateLoading}
          >
            Complete
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Sales Category Summary Modal */}
      <CommonModal
        open={salesCategorySummaryModalOpen}
        onClose={() => {
          if (!loadingSalesCategorySummary) {
            setSalesCategorySummaryModalOpen(false);
          }
        }}
        title="Sales Category Summary"
        size="xl"
        isCloseIcon={true}
      >
        <Box>
          {salesCategorySummaryData.length > 0 ? (
            <CommonTable
              data={salesCategorySummaryData}
              columns={[
                {
                  id: 'categoryDesc',
                  label: 'Sales Category',
                  render: (row) => (
                    <Typography fontSize={12} fontWeight={500}>
                      {row.categoryDesc}
                    </Typography>
                  ),
                },
                {
                  id: 'totalOrderedQty',
                  label: 'Ordered Qty',
                  align: 'center',
                  render: (row) => (
                    <Typography fontSize={12} fontWeight={400}>
                      {row.totalOrderedQty.toFixed(0)}
                    </Typography>
                  ),
                },
                {
                  id: 'totalShippedQty',
                  label: 'Shipped Qty',
                  align: 'center',
                  render: (row) => (
                    <Typography fontSize={12} fontWeight={400}>
                      {row.totalShippedQty.toFixed(0)}
                    </Typography>
                  ),
                },
                {
                  id: 'totalOrderedPrice',
                  label: 'Ordered Price',
                  align: 'right',
                  render: (row) => (
                    <Typography fontSize={12} fontWeight={400}>
                      ${row.totalOrderedPrice.toFixed(2)}
                    </Typography>
                  ),
                },
                {
                  id: 'totalShippedPrice',
                  label: 'Shipped Price',
                  align: 'right',
                  render: (row) => (
                    <Typography fontSize={12} fontWeight={400}>
                      ${row.totalShippedPrice.toFixed(2)}
                    </Typography>
                  ),
                },
              ]}
              containerHeight="400px"
              loading={loadingSalesCategorySummary}
              filterComponent={null}
              currentPage={1}
              totalPages={1}
              totalItems={salesCategorySummaryData.length}
              pageSize={salesCategorySummaryData.length || 10}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              isPagination={false}
              cellStyle={{ padding: '10px 12px' }}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography fontSize={14} color="text.secondary">
                No data available
              </Typography>
            </Box>
          )}
        </Box>
      </CommonModal>

      {/* Add Product Modal */}
      <Dialog
        open={addProductModalOpen}
        onClose={() => {
          if (!addingProduct && !searchingProduct) {
            setAddProductModalOpen(false);
            setFoundProduct(null);
            setScannedUPCForSearch('');
            setAddProductQuantity('1');
      addProductQuantityRef.current = '1';
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !addingProduct && !searchingProduct) {
            setAddProductModalOpen(false);
            setFoundProduct(null);
            setScannedUPCForSearch('');
          } else if (e.key === 'Enter' && !addingProduct && !searchingProduct && foundProduct) {
            e.preventDefault();
            handleAddProductToOrder();
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontSize: 16, fontWeight: 500 }}>
          Add Product to Order
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {searchingProduct ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography fontSize={14} color="text.secondary">
                Searching for product...
              </Typography>
            </Box>
          ) : foundProduct ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body1" color="text.secondary" fontSize={14} sx={{ mb: 1 }}>
                Product found! Do you want to add this item to the order?
              </Typography>
              
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                }}
              >
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {foundProduct.Description && (
                    <Box>
                      <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                        Description
                      </Typography>
                      <Typography fontSize={13} fontWeight={500} color="text.primary">
                        {foundProduct.Description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" gap={2} flexWrap="wrap">
                    {foundProduct.Item_Number && (
                      <Box>
                        <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                          Item Number
                        </Typography>
                        <Typography fontSize={13} fontWeight={500} color="text.primary">
                          {foundProduct.Item_Number}
                        </Typography>
                      </Box>
                    )}
                    
                    {(foundProduct.Price !== undefined || foundProduct.price !== undefined) && (
                      <Box>
                        <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                          Price
                        </Typography>
                        <Typography fontSize={13} fontWeight={500} color="text.primary">
                          ${(foundProduct.Price || foundProduct.price || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    {scannedUPCForSearch && (
                      <Box>
                        <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                          UPC
                        </Typography>
                        <Typography fontSize={13} fontWeight={500} color="text.primary">
                          {scannedUPCForSearch}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {(foundProduct.Pack !== undefined || foundProduct.pack !== undefined) && (
                    <Box>
                      <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                        Pack
                      </Typography>
                      <Typography fontSize={13} fontWeight={500} color="text.primary">
                        {foundProduct.Pack || foundProduct.pack || 'N/A'}
                      </Typography>
                    </Box>
                  )}
                  
                  {(foundProduct.CaseCount !== undefined || foundProduct.caseCount !== undefined) && (
                    <Box>
                      <Typography fontSize={11} fontWeight={400} color="text.secondary" mb={0.5}>
                        Case Count
                      </Typography>
                      <Typography fontSize={13} fontWeight={500} color="text.primary">
                        {foundProduct.CaseCount || foundProduct.caseCount || 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* Quantity Input */}
              <Box>
                <TextField
                  label="Quantity"
                  type="text"
                  value={addProductQuantity}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remove non-numeric characters
                    value = value.replace(/[^0-9]/g, '');
                    console.log('📝 Quantity input changed (scanned):', value);
                    // Always update the state, even if empty (user can clear and retype)
                    setAddProductQuantity(value);
                    addProductQuantityRef.current = value; // Update ref immediately
                    console.log('✅ State and ref updated to:', value);
                  }}
                  onBlur={(e) => {
                    // Validate on blur - if empty or invalid, set to 1
                    const value = e.target.value.trim();
                    if (value === '' || Number(value) < 1) {
                      setAddProductQuantity('1');
      addProductQuantityRef.current = '1';
                    } else if (Number(value) > 9999) {
                      setAddProductQuantity('9999');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !addingProduct && !searchingProduct && foundProduct) {
                      e.preventDefault();
                      handleAddProductToOrder();
                    }
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    min: 1,
                    max: 9999,
                  }}
                  fullWidth
                  size="small"
                  autoFocus
                  sx={{ mt: 2 }}
                />
              </Box>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography fontSize={14} color="text.secondary">
                No product information available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => {
              setAddProductModalOpen(false);
              setFoundProduct(null);
              setScannedUPCForSearch('');
              setAddProductQuantity('1');
      addProductQuantityRef.current = '1';
            }}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            disabled={addingProduct || searchingProduct}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleAddProductToOrder}
            appearance="filled"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            size="small"
            loading={addingProduct}
            disabled={addingProduct || searchingProduct || !foundProduct || !addProductQuantity || Number(addProductQuantity) <= 0}
          >
            Add to Order
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Manual Add Item Modal */}
      <CommonModal
        open={manualAddItemModalOpen}
        onClose={() => {
          if (!addingSelectedProduct && !searchingInventory) {
            setManualAddItemModalOpen(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedProduct(null);
            setSelectedProductQuantity('1');
      selectedProductQuantityRef.current = '1';
          }
        }}
        title="Add More Item"
        size="xl"
        isCloseIcon={true}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Search Section */}
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              fullWidth
              label="Search by Item Number, Description, or UPC"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() === '') {
                  setSearchResults([]);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() !== '') {
                  e.preventDefault();
                  handleSearchInventory(searchQuery);
                }
              }}
              InputProps={{
                endAdornment: (
                  <CustomButton
                    appearance="filled"
                    onClick={() => handleSearchInventory(searchQuery)}
                    disabled={searchingInventory || !searchQuery.trim()}
                    loading={searchingInventory}
                    sx={{
                      minWidth: 100,
                      fontSize: 11,
                      fontWeight: 400,
                      px: 1.5,
                      py: 0.5,
                      // height: '36px',
                      borderRadius: '6px',
                      textTransform: 'none',
                      mt: 0,
                    }}
                    fullWidth={false}
                  >
                    Search
                  </CustomButton>
                ),
              }}
              size="small"
              autoFocus
            />
          </Box>

          {/* Search Results Table */}
          {searchResults.length > 0 ? (
            <Box>
              <Typography variant="body2" fontSize={12} color="text.secondary" mb={1}>
                {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found. Select one to add to order.
              </Typography>
              <CommonTable
                data={searchResults}
                columns={[
                  {
                    id: 'Item_Number',
                    label: 'Item #',
                    render: (row) => (
                      <Typography fontSize={12} fontWeight={500}>
                        {row.Item_Number || row.id || 'N/A'}
                      </Typography>
                    ),
                  },
                  {
                    id: 'Description',
                    label: 'Description',
                    render: (row) => (
                      <Typography fontSize={12} fontWeight={400}>
                        {row.Description || row.description || 'N/A'}
                      </Typography>
                    ),
                  },
                  {
                    id: 'Price',
                    label: 'Price',
                    align: 'right',
                    render: (row) => (
                      <Typography fontSize={12} fontWeight={400}>
                        ${(row.Price || row.price || 0).toFixed(2)}
                      </Typography>
                    ),
                  },
                  {
                    id: 'Pack',
                    label: 'Pack',
                    align: 'center',
                    render: (row) => (
                      <Typography fontSize={12} fontWeight={400}>
                        {row.Pack || row.pack || 'N/A'}
                      </Typography>
                    ),
                  },
                  {
                    id: 'CaseCount',
                    label: 'Case Count',
                    align: 'center',
                    render: (row) => (
                      <Typography fontSize={12} fontWeight={400}>
                        {row.CaseCount || row.caseCount || 'N/A'}
                      </Typography>
                    ),
                  },
                  {
                    id: 'select',
                    label: 'Action',
                    align: 'center',
                    render: (row) => {
                      // Strict comparison using Item_Number as primary identifier
                      const rowItemNumber = row.Item_Number || row.id;
                      const selectedItemNumber = selectedProduct?.Item_Number || selectedProduct?.id;
                      const isSelected = selectedProduct !== null && selectedItemNumber !== undefined && rowItemNumber !== undefined && 
                                        String(selectedItemNumber) === String(rowItemNumber);
                      
                      return (
                        <CustomButton
                          appearance={isSelected ? "filled" : "outlined"}
                          onClick={() => setSelectedProduct(row)}
                          size="small"
                          sx={{
                            minWidth: 100,
                            fontSize: 11,
                            fontWeight: 400,
                            px: 1.5,
                            py: 0.5,
                            height: '28px',
                            borderRadius: '6px',
                            textTransform: 'none',
                            mt: 0,
                          }}
                          fullWidth={false}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </CustomButton>
                      );
                    },
                  },
                ]}
                containerHeight="400px"
                loading={searchingInventory}
                filterComponent={null}
                currentPage={1}
                totalPages={1}
                totalItems={searchResults.length}
                pageSize={searchResults.length || 10}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                isPagination={false}
                cellStyle={{ padding: '10px 12px' }}
                getRowStyle={(row) => {
                  // Strict comparison using Item_Number as primary identifier
                  const rowItemNumber = row.Item_Number || row.id;
                  const selectedItemNumber = selectedProduct?.Item_Number || selectedProduct?.id;
                  const isSelected = selectedProduct !== null && selectedItemNumber !== undefined && rowItemNumber !== undefined && 
                                    String(selectedItemNumber) === String(rowItemNumber);
                  
                  if (isSelected) {
                    return {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                    };
                  }
                  return {};
                }}
              />
            </Box>
          ) : searchQuery.trim() !== '' && !searchingInventory ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography fontSize={14} color="text.secondary">
                No products found. Try a different search term.
              </Typography>
            </Box>
          ) : searchQuery.trim() === '' ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography fontSize={14} color="text.secondary">
                Enter a search term to find products (Item Number, Description, or UPC)
              </Typography>
            </Box>
          ) : null}

          {/* Quantity Input - Only show when product is selected */}
          {selectedProduct && (
            <Box>
              <TextField
                label="Quantity"
                type="text"
                value={selectedProductQuantity}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove non-numeric characters
                  value = value.replace(/[^0-9]/g, '');
                  // Always update the state, even if empty (user can clear and retype)
                  setSelectedProductQuantity(value);
                  selectedProductQuantityRef.current = value; // Update ref immediately
                }}
                onBlur={(e) => {
                  // Validate on blur - if empty or invalid, set to 1
                  const value = e.target.value.trim();
                  if (value === '' || Number(value) < 1) {
                    setSelectedProductQuantity('1');
      selectedProductQuantityRef.current = '1';
                  } else if (Number(value) > 9999) {
                    setSelectedProductQuantity('9999');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addingSelectedProduct && !searchingInventory && selectedProduct) {
                    e.preventDefault();
                    handleAddSelectedProductToOrder();
                  }
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  min: 1,
                  max: 9999,
                }}
                fullWidth
                size="small"
                autoFocus
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                setManualAddItemModalOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setSelectedProduct(null);
                setSelectedProductQuantity('1');
      selectedProductQuantityRef.current = '1';
              }}
              fullWidth={false}
              disabled={addingSelectedProduct || searchingInventory}
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              buttonType="primary"
              onClick={handleAddSelectedProductToOrder}
              fullWidth={false}
              loading={addingSelectedProduct}
              disabled={addingSelectedProduct || searchingInventory || !selectedProduct || !selectedProductQuantity || Number(selectedProductQuantity) <= 0}
              sx={{ mt: 0 }}
            >
              Add to Order
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default OrderConfirmationDetail;

