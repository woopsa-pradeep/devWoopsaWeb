import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Collapse,
  useTheme,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close,
  Refresh,
  Add,
  Remove,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import CustomButton from '../../../component/atoms/CustomButton';
import CommonModal from '../../../component/atoms/CommonModal';
import TextInput from '../../../component/atoms/TextInput';
// SVG Icons
import BoxIcon from '../../../assets/Box order - Blue.svg';
import ToteIcon from '../../../assets/Tote.svg';
import DrinkIcon from '../../../assets/Drink.svg';
import PickerIcon from '../../../assets/Picker.svg';
import TimeIcon from '../../../assets/Time.svg';
import PrintIcon from '../../../assets/Print.svg';
import CameraIcon from '../../../assets/Cemara.svg';
import BoxEditWhite from '../../../assets/boxeditwhite.svg';
import BoxEditBlue from '../../../assets/boxeditblue.svg';
import EditBlue from '../../../assets/editblue.svg';
import MoveIcon from '../../../assets/move.svg';
import {
  getOrder,
  getCompleteCheckerOrder,
  getBoxItem,
  getOrderItems,
  moveItemsToBox,
  updateItemQty,
  readyForDelivery,
  capturePhotos,
  createContainerAndMoveItems,
  getOrderPhotos,
  deleteBoxPhoto,
  type Order,
  type BoxItem,
  type OrderItemWithContainer,
  type OrderPhotosResponse,
} from '../../../redux/apis/sales/orderCheckerApis';
import { printAllLabels, printLabels as generateLabels, type LabelSize } from '../../../utils/labelGenerator';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

const OrderChecker = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItemWithContainer[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [selectedContainerType, setSelectedContainerType] = useState<'box' | 'tote' | 'drink' | null>(null);
  const [showAllItems, setShowAllItems] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [boxItemsLoading, setBoxItemsLoading] = useState(false);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);

  // Modal states
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [bundleCreationModalOpen, setBundleCreationModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [printLabelsModalOpen, setPrintLabelsModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [addContainerModalOpen, setAddContainerModalOpen] = useState(false);
  const [individualPrintModalOpen, setIndividualPrintModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'summary' | 'detail' | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  // const [selectedContainer, setSelectedContainer] = useState<{ id: number; type: 'box' | 'tote' | 'drink' } | null>(null);
  const [orderImages, setOrderImages] = useState<string[]>([]);
  const [orderPhotosData, setOrderPhotosData] = useState<OrderPhotosResponse | null>(null);
  const [orderPhotosLoading, setOrderPhotosLoading] = useState(false);
  const [completedOrderImages, setCompletedOrderImages] = useState<string[]>([]);
  const [newCapturedImages, setNewCapturedImages] = useState<string[]>([]); // Only newly captured photos for completed tab

  // Form states
  const [editItemForm, setEditItemForm] = useState<{
    item: BoxItem | null;
    source: string;
    destination: string;
    qty: number;
    mode: 'move' | 'qty';
  }>({
    item: null,
    source: '',
    destination: '',
    qty: 0,
    mode: 'move',
  });
  const [printLabelsForm, setPrintLabelsForm] = useState({
    size: '4x6' as '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4',
    boxIds: [] as number[],
  });
  const [individualPrintData, setIndividualPrintData] = useState<{
    containerId: number;
    containerType: 'box' | 'tote' | 'drink';
    size: '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4';
  } | null>(null);
  const [cameraNotes, setCameraNotes] = useState('');

  // Webcam states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  // Loading states for modals
  const [editItemLoading, setEditItemLoading] = useState(false);
  const [printLabelsLoading, setPrintLabelsLoading] = useState(false);
  const [readyForDeliveryLoading, setReadyForDeliveryLoading] = useState(false);
  const [addContainerLoading, setAddContainerLoading] = useState(false);
  const [deletePhotoLoading, setDeletePhotoLoading] = useState(false);
  const [capturePhotosLoading, setCapturePhotosLoading] = useState(false);
  
  // Add container form state
  const [addContainerForm, setAddContainerForm] = useState<{
    containerType: 'box' | 'tote' | 'drink' | '';
    sourceContainer: string;
    items: Array<{ itemNumber: number; qty: number }>;
  }>({
    containerType: '',
    sourceContainer: '',
    items: [],
  });

  // Define getAllContainers function
  const getAllContainers = useCallback(() => {
    if (!selectedOrder) return [];
    const containers: Array<{ id: number; type: 'box' | 'tote' | 'drink'; name: string }> = [];
    selectedOrder.box.forEach((id) => containers.push({ id, type: 'box', name: `BOX ${id}` }));
    selectedOrder.tote.forEach((id) => containers.push({ id, type: 'tote', name: `TOTE ${id}` }));
    selectedOrder.drink.forEach((id) => containers.push({ id, type: 'drink', name: `DRINK ${id}` }));
    return containers;
  }, [selectedOrder]);

  // Memoize getAllContainers to prevent unnecessary recalculations
  const allContainers = useMemo(() => getAllContainers(), [getAllContainers]);

  // Check if order has required images (min = total containers, max = 2 * total containers)
  const checkOrderImagesValid = useMemo(() => {
    if (!selectedOrder || allContainers.length === 0) return false;
    const totalContainers = allContainers.length;
    
    // For completed tab, check completedOrderImages
    if (activeTab === 'completed') {
      const totalPhotos = completedOrderImages.length;
      return totalPhotos >= totalContainers && totalPhotos <= totalContainers * 2;
    }
    
    // For pending tab, check orderImages
    return orderImages.length >= totalContainers && orderImages.length <= totalContainers * 2;
  }, [selectedOrder, allContainers, orderImages, activeTab, completedOrderImages]);

  // Check if editing is allowed
  // In pending tab: allow all access even if invoiced (only hide qty edit icon)
  // In completed tab: disallow editing if invoiced
  const isEditingAllowed = useMemo(() => {
    if (!selectedOrder) return true;
    if (activeTab === 'pending') {
      // In pending tab, allow all access even if invoiced
      return true;
    }
    // In completed tab, disallow if invoiced
    return !selectedOrder.invoiced;
  }, [selectedOrder, activeTab]);

  // Check if qty edit icon should be hidden (only hide in pending tab when invoiced)
  const isQtyEditDisabled = useMemo(() => {
    if (!selectedOrder) return false;
    if (activeTab === 'pending' && selectedOrder.invoiced) {
      return true; // Hide qty edit icon in pending tab when invoiced
    }
    return false;
  }, [selectedOrder, activeTab]);

  // Get all items from all containers (items already have boxId and boxType)
  const getAllItemsFromOrder = useMemo(() => {
    return allOrderItems.map((item) => ({
      ...item,
      containerId: item.boxId,
      containerType: item.boxType,
    }));
  }, [allOrderItems]);

  // Fetch orders on mount and when tab changes
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);


  // Auto-select first order when orders are loaded or tab changes
  useEffect(() => {
    if (orders.length > 0) {
      // Reset selection when tab changes or selected order not in new list
      const currentOrderExists = selectedOrder && orders.find(o => o.orderNumber === selectedOrder.orderNumber);
      if (!currentOrderExists) {
        setSelectedOrder(null);
        setSelectedBoxId(null);
        setSelectedContainerType(null);
        setShowAllItems(true);
        setBoxItems([]);
        setAllOrderItems([]);
        setExpandedOrders(new Set());
        setOrderImages([]);
        // Auto-select first order
        const firstOrder = orders[0];
        setSelectedOrder(firstOrder);
        setExpandedOrders(new Set([firstOrder.orderNumber]));
        setSelectedBoxId(null);
        setSelectedContainerType(null);
        setShowAllItems(true);
        setBoxItems([]);
      }
    } else {
      // Reset when no orders
      setSelectedOrder(null);
      setSelectedBoxId(null);
      setSelectedContainerType(null);
      setShowAllItems(true);
      setBoxItems([]);
      setAllOrderItems([]);
      setExpandedOrders(new Set());
      setOrderImages([]);
    }
  }, [orders, selectedOrder]);

  // Fetch box items when box is selected (and showAllItems is false)
  useEffect(() => {
    if (selectedBoxId && !showAllItems) {
      fetchBoxItems(selectedBoxId);
    }
  }, [selectedBoxId, showAllItems]);

  // Fetch all order items when order is selected
  useEffect(() => {
    if (selectedOrder) {
      fetchOrderItems(selectedOrder.orderNumber);
      // Reset order images when order changes
      setOrderImages([]);
      // Fetch order photos if in completed tab
      if (activeTab === 'completed') {
        fetchOrderPhotos(selectedOrder.orderNumber);
      } else {
        setOrderPhotosData(null);
      }
    }
  }, [selectedOrder, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response: any = activeTab === 'pending' 
        ? await getOrder()
        : await getCompleteCheckerOrder();
      setOrders(response?.data?.data || []);
      return response;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch orders');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxItems = async (boxId: number) => {
    try {
      setBoxItemsLoading(true);
      const response: any = await getBoxItem(boxId);
      setBoxItems(response?.data?.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch box items');
    } finally {
      setBoxItemsLoading(false);
    }
  };

  const fetchOrderItems = async (orderNumber: number) => {
    try {
      setOrderItemsLoading(true);
      const response: any = await getOrderItems(orderNumber);
      setAllOrderItems(response?.data?.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch order items');
    } finally {
      setOrderItemsLoading(false);
    }
  };

  const fetchOrderPhotos = async (orderNumber: number) => {
    try {
      setOrderPhotosLoading(true);
      const response: any = await getOrderPhotos(orderNumber);
      const photosData = response?.data?.data || null;
      setOrderPhotosData(photosData);
      // Set completed order images from flat array
      if (photosData && photosData.photos) {
        setCompletedOrderImages(photosData.photos);
      } else {
        setCompletedOrderImages([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch order photos');
      setOrderPhotosData(null);
      setCompletedOrderImages([]);
    } finally {
      setOrderPhotosLoading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!selectedOrder) return;
    try {
      setDeletePhotoLoading(true);
      await deleteBoxPhoto(selectedOrder.orderNumber, { photoUrl });
      toast.success('Photo deleted successfully');
      // Refresh photos
      await fetchOrderPhotos(selectedOrder.orderNumber);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete photo');
    } finally {
      setDeletePhotoLoading(false);
    }
  };

  const handleUpdateCompletedPhotos = async (imageDataUrls: string[], notes?: string) => {
    if (!selectedOrder || imageDataUrls.length === 0) return;
    
    const totalContainers = allContainers.length;
    const currentTotalPhotos = completedOrderImages.length;
    const photosToAdd = imageDataUrls.length;
    const newTotalPhotos = currentTotalPhotos + photosToAdd;
    
    // Calculate max photos that can be added based on total containers
    const maxTotalPhotos = totalContainers * 2;
    const maxCanAdd = maxTotalPhotos - currentTotalPhotos; // Based on containers, not static
    
    if (photosToAdd < 1) {
      toast.error('At least 1 photo is required');
      return;
    }
    
    // Check: cannot add more than maximum allowed based on containers
    if (photosToAdd > maxCanAdd) {
      if (maxCanAdd === 0) {
        toast.error(`Maximum ${maxTotalPhotos} photos allowed (2 per container). You already have ${currentTotalPhotos} photos.`);
      } else {
        toast.error(`You can add maximum ${maxCanAdd} photo${maxCanAdd !== 1 ? 's' : ''} (${currentTotalPhotos} + ${maxCanAdd} = ${currentTotalPhotos + maxCanAdd} out of ${maxTotalPhotos} maximum)`);
      }
      return;
    }
    
    // Check: overall maximum (2 per container)
    if (newTotalPhotos > maxTotalPhotos) {
      const excess = newTotalPhotos - maxTotalPhotos;
      toast.error(`Maximum ${maxTotalPhotos} photos allowed (2 per container). You are adding ${excess} too many photo${excess !== 1 ? 's' : ''}.`);
      return;
    }
    
    try {
      setCapturePhotosLoading(true);
      const formData = new FormData();
      imageDataUrls.forEach((imageData, index) => {
        const blob = dataURLtoBlob(imageData);
        formData.append('images', blob, `photo-${Date.now()}-${index}.jpg`);
      });
      if (notes) {
        formData.append('notes', notes);
      }
      await capturePhotos(selectedOrder.orderNumber, formData);
      toast.success('Photos uploaded successfully');
      // Refresh photos
      await fetchOrderPhotos(selectedOrder.orderNumber);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update photos');
    } finally {
      setCapturePhotosLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    // Close all other orders, only expand the selected one
    setExpandedOrders(new Set([order.orderNumber]));

    // Don't auto-select container - show all items by default
    setSelectedBoxId(null);
    setSelectedContainerType(null);
    setShowAllItems(true);
    setBoxItems([]);
  };

  const handleContainerSelect = (containerId: number, type: 'box' | 'tote' | 'drink') => {
    setSelectedBoxId(containerId);
    setSelectedContainerType(type);
    setShowAllItems(false);
  };

  const handleEditItem = (item: BoxItem & { containerId?: number; containerType?: 'box' | 'tote' | 'drink' }, mode: 'move' | 'qty' = 'move') => {
    // Determine source container from item or selected container
    const containerId = item.containerId || selectedBoxId;
    const containerType = item.containerType || selectedContainerType;
    const sourceContainer = containerType === 'box'
      ? `Box-${containerId}`
      : containerType === 'tote'
        ? `Tote-${containerId}`
        : `Drink-${containerId}`;

    setEditItemForm({
      item,
      source: sourceContainer,
      destination: '',
      qty: item.qty,
      mode,
    });
    setEditItemModalOpen(true);
  };

  const handleSaveEditItem = async () => {
    if (!editItemForm.item || !selectedOrder) return;

    try {
      setEditItemLoading(true);
      if (editItemForm.mode === 'move') {
        // Parse source container from editItemForm.source
        const sourceMatch = editItemForm.source.match(/(Box|Tote|Drink)-(\d+)/i);
        if (!sourceMatch) {
          toast.error('Invalid source container format');
          setEditItemLoading(false);
          return;
        }
        const sourceBoxId = Number(sourceMatch[2]);
        
        // Parse destination
        const destMatch = editItemForm.destination.match(/(Box|Tote|Drink)-(\d+)/i);
        if (!destMatch) {
          toast.error('Invalid destination format. Please select a destination.');
          setEditItemLoading(false);
          return;
        }
        if (!editItemForm.destination) {
          toast.error('Please select a destination');
          setEditItemLoading(false);
          return;
        }
        const destId = Number(destMatch[2]);
        await moveItemsToBox({
          sourceBoxId: sourceBoxId,
          destinationBoxId: destId,
          itemNumber: editItemForm.item.itemNumber,
          qty: editItemForm.item.qty, // Use original quantity for move
        });
        toast.success('Item moved successfully');
        // Refresh all order items after move to update in real-time
        if (selectedOrder) {
          await fetchOrderItems(selectedOrder.orderNumber);
        }
      } else {
        if (editItemForm.qty < 0) {
          toast.error('Quantity cannot be negative');
          setEditItemLoading(false);
          return;
        }
        // Get boxId from item - it could be boxId, containerId, or from selectedBoxId
        const itemBoxId = (editItemForm.item as any).boxId || (editItemForm.item as any).containerId || selectedBoxId;
        if (!itemBoxId) {
          toast.error('Container ID is required');
          setEditItemLoading(false);
          return;
        }
        await updateItemQty({
          orderNumber: selectedOrder.orderNumber,
          itemNumber: editItemForm.item.itemNumber,
          boxId: itemBoxId,
          qty: editItemForm.qty,
        });
        toast.success('Quantity updated successfully');
        // Refresh all order items after qty update to update in real-time
        if (selectedOrder) {
          await fetchOrderItems(selectedOrder.orderNumber);
        }
      }
      setEditItemModalOpen(false);
      setConfirmationModalOpen(false);
      // Also refresh box items if a specific box is selected
      if (selectedBoxId) {
        fetchBoxItems(selectedBoxId);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update item');
    } finally {
      setEditItemLoading(false);
    }
  };

  const handleConfirmSaveEditItem = () => {
    if (!editItemForm.item || !selectedOrder) return;

    if (editItemForm.mode === 'move') {
      if (!editItemForm.destination) {
        toast.error('Please select a destination');
        return;
      }
      setConfirmationData({
        title: 'Confirm Move Item',
        message: `Are you sure you want to move this item to ${editItemForm.destination}?`,
        onConfirm: handleSaveEditItem,
      });
    } else {
      if (editItemForm.qty < 0) {
        toast.error('Quantity cannot be negative');
        return;
      }
      setConfirmationData({
        title: 'Confirm Update Quantity',
        message: `Are you sure you want to update quantity from ${editItemForm.item.qty} to ${editItemForm.qty}?`,
        onConfirm: handleSaveEditItem,
      });
    }
    setConfirmationModalOpen(true);
  };

  const handleReadyForDelivery = async () => {
    if (!selectedOrder) return;
    try {
      setReadyForDeliveryLoading(true);
      
      // First, upload photos if there are any captured images
      if (orderImages.length > 0) {
        const totalContainers = allContainers.length;
        if (orderImages.length < totalContainers) {
          toast.error(`Minimum ${totalContainers} photos required (one per container)`);
          setReadyForDeliveryLoading(false);
          return;
        }
        if (orderImages.length > totalContainers * 2) {
          toast.error(`Maximum ${totalContainers * 2} photos allowed (2x total containers)`);
          setReadyForDeliveryLoading(false);
          return;
        }

        try {
          const formData = new FormData();
          orderImages.forEach((imageData, index) => {
            const blob = dataURLtoBlob(imageData);
            formData.append('images', blob, `photo-${index + 1}.jpg`);
          });
          if (cameraNotes) {
            formData.append('notes', cameraNotes);
          }

          await capturePhotos(selectedOrder.orderNumber, formData);
          toast.success('Photos uploaded successfully');
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Failed to upload photos');
          setReadyForDeliveryLoading(false);
          return;
        }
      }

      // After photos are uploaded (or if no photos), call ready for delivery
      await readyForDelivery(selectedOrder.orderNumber);
      toast.success('Order marked as ready for delivery');
      
      // Close modals first
      setBundleCreationModalOpen(false);
      setConfirmationModalOpen(false);
      
      // Refresh orders and auto-select first order
      const response = await fetchOrders();
      if (response && response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const firstOrder = response.data.data[0];
        handleOrderSelect(firstOrder);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to mark order as ready');
    } finally {
      setReadyForDeliveryLoading(false);
    }
  };

  const handleConfirmReadyForDelivery = () => {
    if (!selectedOrder) return;
    setConfirmationData({
      title: 'Confirm Ready for Delivery',
      message: `Are you sure you want to mark Order #${selectedOrder.orderNumber} as ready for delivery?`,
      onConfirm: handleReadyForDelivery,
    });
    setConfirmationModalOpen(true);
  };

  const handlePrintLabels = async () => {
    if (!selectedOrder) return;
    try {
      setPrintLabelsLoading(true);
      
      // Determine which containers to print
      const allContainersList = getAllContainers();
      const containersToPrint = printLabelsForm.boxIds.length > 0
        ? allContainersList.filter(c => printLabelsForm.boxIds.includes(c.id))
        : allContainersList;

      if (containersToPrint.length === 0) {
        toast.error('No containers selected');
        setPrintLabelsLoading(false);
        return;
      }

      // Format delivery date
      const deliveryDate = selectedOrder.completedAt 
        ? dayjs(selectedOrder.completedAt).format('MM/DD/YYYY')
        : dayjs().format('MM/DD/YYYY');

      // Use order number as account number if not available
      const accountNumber = String(selectedOrder.orderNumber);

      // Print all labels in a single print window
      printAllLabels(
        selectedOrder,
        printLabelsForm.size as LabelSize,
        containersToPrint,
        allOrderItems,
        accountNumber,
        undefined, // customerAddress
        undefined, // city
        undefined, // state
        undefined, // zip
        undefined, // custNumber
        deliveryDate
      );

      toast.success('Labels generated successfully');
      setPrintLabelsModalOpen(false);
      setConfirmationModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to print labels');
    } finally {
      setPrintLabelsLoading(false);
    }
  };

  const handlePrintPackingList = async () => {
    if (!selectedOrder) return;
    try {
      setPrintLabelsLoading(true);
      
      // Get all containers
      const allContainersList = getAllContainers();

      if (allContainersList.length === 0) {
        toast.error('No containers available');
        setPrintLabelsLoading(false);
        return;
      }

      // Format delivery date
      const deliveryDate = selectedOrder.completedAt 
        ? dayjs(selectedOrder.completedAt).format('MM/DD/YYYY')
        : dayjs().format('MM/DD/YYYY');

      // Use order number as account number if not available
      const accountNumber = String(selectedOrder.orderNumber);

      // Print packing list with A4 size directly (allContainersList is already in the correct format)
      printAllLabels(
        selectedOrder,
        'A4',
        allContainersList,
        allOrderItems,
        accountNumber,
        undefined, // customerAddress
        undefined, // city
        undefined, // state
        undefined, // zip
        undefined, // custNumber
        deliveryDate
      );

      toast.success('Packing list generated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to print packing list');
    } finally {
      setPrintLabelsLoading(false);
    }
  };

  const handlePrintIndividualContainer = async (containerId: number, containerType: 'box' | 'tote' | 'drink', size: LabelSize = '4x6') => {
    if (!selectedOrder) return;
    try {
      setPrintLabelsLoading(true);
      
      // Format delivery date
      const deliveryDate = selectedOrder.completedAt 
        ? dayjs(selectedOrder.completedAt).format('MM/DD/YYYY')
        : dayjs().format('MM/DD/YYYY');

      // Use order number as account number if not available
      const accountNumber = String(selectedOrder.orderNumber);

      // Generate label for the specific container
      generateLabels(
        selectedOrder,
        size,
        [containerId],
        containerType,
        allOrderItems,
        accountNumber,
        undefined, // customerAddress
        undefined, // city
        undefined, // state
        undefined, // zip
        undefined, // custNumber
        deliveryDate
      );

      const containerName = containerType === 'box' ? `Box ${containerId}` :
        containerType === 'tote' ? `Tote ${containerId}` :
          `Drink ${containerId}`;
      toast.success(`Label generated for ${containerName}`);
      setIndividualPrintModalOpen(false);
      setConfirmationModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to print label');
    } finally {
      setPrintLabelsLoading(false);
    }
  };

  const handleConfirmPrintIndividualContainer = (containerId: number, containerType: 'box' | 'tote' | 'drink') => {
    if (!selectedOrder) return;
    setIndividualPrintData({
      containerId,
      containerType,
      size: '4x6', // Default size
    });
    setIndividualPrintModalOpen(true);
  };

  const handleConfirmPrintLabels = () => {
    if (!selectedOrder) return;
    const boxIdsText = printLabelsForm.boxIds.length > 0 
      ? ` for boxes: ${printLabelsForm.boxIds.join(', ')}`
      : ' for all boxes';
    setConfirmationData({
      title: 'Confirm Print Labels',
      message: `Are you sure you want to print labels (${printLabelsForm.size})${boxIdsText}?`,
      onConfirm: handlePrintLabels,
    });
    setConfirmationModalOpen(true);
  };

  const handleCreateContainer = async () => {
    if (!selectedOrder) return;
    
    if (!addContainerForm.containerType) {
      toast.error('Please select container type');
      return;
    }
    if (!addContainerForm.sourceContainer) {
      toast.error('Please select source container');
      return;
    }
    if (addContainerForm.items.length === 0) {
      toast.error('Please select at least one item to move');
      return;
    }

    try {
      setAddContainerLoading(true);
      // Parse source container
      const sourceMatch = addContainerForm.sourceContainer.match(/(Box|Tote|Drink)-(\d+)/i);
      if (!sourceMatch) {
        toast.error('Invalid source container format');
        setAddContainerLoading(false);
        return;
      }
      const sourceBoxId = Number(sourceMatch[2]);

      const response: any = await createContainerAndMoveItems({
        orderNumber: selectedOrder.orderNumber,
        containerType: addContainerForm.containerType as 'box' | 'tote' | 'drink',
        sourceBoxId,
        items: addContainerForm.items,
      });

      const newContainerId = response?.data?.data?.newContainerId;
      const containerType = addContainerForm.containerType as 'box' | 'tote' | 'drink';
      
      toast.success(`Successfully created ${containerType} ${newContainerId} and moved items`);
      setAddContainerModalOpen(false);
      setAddContainerForm({
        containerType: '',
        sourceContainer: '',
        items: [],
      });
      
      // Refresh orders to get updated container list
      const ordersResponse = await fetchOrders();
      
      // Update selected order and select the newly created container
      if (selectedOrder && ordersResponse?.data?.data) {
        const updatedOrders = ordersResponse.data.data;
        const updatedOrder = updatedOrders.find((o: Order) => o.orderNumber === selectedOrder.orderNumber);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
          // Refresh order items to show new container items
          await fetchOrderItems(updatedOrder.orderNumber);
          // Refresh order photos if in completed tab
          if (activeTab === 'completed') {
            await fetchOrderPhotos(updatedOrder.orderNumber);
          }
          // Select the newly created container
          setSelectedBoxId(newContainerId);
          setSelectedContainerType(containerType);
          setShowAllItems(false);
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create container');
    } finally {
      setAddContainerLoading(false);
    }
  };

  // Webcam functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error('Failed to access camera');
        console.error('Camera access error:', err);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && selectedOrder) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        const totalContainers = allContainers.length;
        const maxTotalPhotos = totalContainers * 2;
        
        if (activeTab === 'completed') {
          // For completed tab: check against existing photos + new captured photos
          const currentTotalPhotos = completedOrderImages.length;
          const maxCanAdd = maxTotalPhotos - currentTotalPhotos;
          const currentNewPhotos = newCapturedImages.length;
          
          if (currentNewPhotos >= maxCanAdd) {
            toast.error(`You can add maximum ${maxCanAdd} photo${maxCanAdd !== 1 ? 's' : ''} (${currentTotalPhotos} existing + ${maxCanAdd} new = ${maxTotalPhotos} maximum)`);
            return;
          }
          
          setNewCapturedImages([...newCapturedImages, imageData]);
          // Update capturedImages to show existing + new
          setCapturedImages([...completedOrderImages, ...newCapturedImages, imageData]);
          toast.success('Photo captured');
        } else {
          // For pending tab: use existing logic
          if (orderImages.length < maxTotalPhotos) {
            setOrderImages([...orderImages, imageData]);
            setCapturedImages([...orderImages, imageData]);
            toast.success('Photo captured');
          } else {
            toast.error(`Maximum ${maxTotalPhotos} photos allowed (2x total containers)`);
          }
        }
      }
    }
  };

  const removeCapturedImage = (index: number) => {
    if (activeTab === 'completed') {
      // For completed tab: only remove from new captured images
      const existingCount = completedOrderImages.length;
      if (index < existingCount) {
        // Trying to remove existing photo - not allowed in camera modal
        toast.error('Cannot remove existing photos. Delete them from the main view.');
        return;
      }
      // Remove from new captured images
      const newIndex = index - existingCount;
      const updatedNewImages = newCapturedImages.filter((_, i) => i !== newIndex);
      setNewCapturedImages(updatedNewImages);
      setCapturedImages([...completedOrderImages, ...updatedNewImages]);
    } else {
      // For pending tab: use existing logic
      const newImages = orderImages.filter((_, i) => i !== index);
      setOrderImages(newImages);
      setCapturedImages(newImages);
    }
  };

  const handleOpenCamera = () => {
    setCameraModalOpen(true);
    if (activeTab === 'completed') {
      // For completed tab: show existing photos + reset new captured photos
      setNewCapturedImages([]);
      setCapturedImages([...completedOrderImages]);
    } else {
      // For pending tab: use orderImages
      setCapturedImages([...orderImages]);
    }
    setCameraNotes('');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraModalOpen(false);
    if (activeTab === 'completed') {
      setNewCapturedImages([]);
      setCapturedImages([...completedOrderImages]);
    } else {
      setCapturedImages([...orderImages]);
    }
    setCameraNotes('');
  };

  // Save photos - for completed tab, upload immediately; for pending, save locally
  const handleSavePhotos = async () => {
    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    const totalContainers = allContainers.length;
    if (capturedImages.length > totalContainers * 2) {
      toast.error(`Maximum ${totalContainers * 2} photos allowed (2x total containers)`);
      return;
    }

    if (activeTab === 'completed') {
      // For completed tab, upload photos immediately
      // Use newCapturedImages (only newly captured photos)
      if (newCapturedImages.length > 0) {
        // Upload all photos at once
        await handleUpdateCompletedPhotos(newCapturedImages, cameraNotes);
      } else {
        toast.success('No new photos to upload');
      }
      handleCloseCamera();
    } else {
      // For pending tab, save photos locally (upload happens on Ready For Delivery)
      setOrderImages(capturedImages);
      toast.success('Photos saved locally');
      handleCloseCamera();
    }
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const formatTime = (startedAt: string, completedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours} h ${minutes} m ${seconds} s`;
  };

  const getContainerIcon = (type: 'box' | 'tote' | 'drink') => {
    switch (type) {
      case 'box':
        return <Box component="img" src={BoxIcon} alt="Box" sx={{ width: 20, height: 20 }} />;
      case 'tote':
        return <Box component="img" src={ToteIcon} alt="Tote" sx={{ width: 20, height: 20 }} />;
      case 'drink':
        return <Box component="img" src={DrinkIcon} alt="Drink" sx={{ width: 20, height: 20 }} />;
    }
  };

  const getContainerColor = (type: 'box' | 'tote' | 'drink') => {
    switch (type) {
      case 'box':
        return theme.palette.primary.main;
      case 'tote':
        return '#4caf50';
      case 'drink':
        return '#f44336';
    }
  };

  // Helper function to load image as data URL
  const loadImageAsDataUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error converting image to data URL:', error);
            resolve(null);
          }
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

  // Helper to load logo as data URL
  const loadLogoAsDataUrl = async (): Promise<string | null> => {
    try {
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error converting logo to data URL:', error);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        if (typeof rabbitLogo === 'string') {
          img.src = rabbitLogo;
        } else {
          img.src = rabbitLogo as string;
        }
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Helper function to add footer with logo and "Report Generated by Woopsa" to each page
  const addFooterToPage = (doc: jsPDF, logoDataUrl?: string, pageNum?: number, totalPages?: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = pageHeight - 8;
    const margin = 10;
    
    // Left side: "Report Generated by Woopsa" + logo
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Report Generated by Woopsa';
    doc.text(text, margin, footerY);
    
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const textWidth = doc.getTextWidth(text);
        const logoX = margin + textWidth + 1.5;
        const logoY = footerY - 3;
        
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch {
          try {
            doc.addImage(logoDataUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);
          } catch {
            try {
              doc.addImage(logoDataUrl, 'SVG', logoX, logoY, logoWidth, logoHeight);
            } catch {
              doc.addImage(logoDataUrl, logoX, logoY, logoWidth, logoHeight);
            }
          }
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Right side: Page number
    if (pageNum !== undefined && totalPages !== undefined) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const pageText = `Page ${pageNum} of ${totalPages}`;
      doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    }
  };

  // Generate Summary Report
  const generateSummaryReport = async () => {
    if (orders.length === 0) {
      toast.error('No completed orders available');
      return;
    }

    try {
      setReportLoading(true);
      
      // Load rabbit logo for footer
      const rabbitLogoDataUrl = await loadLogoAsDataUrl();

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = margin;

      // Header Section - Only on first page
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Completed Orders Summary Report', margin, yPosition);
      yPosition += 8;

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const date = dayjs(now).format('MM/DD/YYYY HH:mm');
      doc.text(`Generated on: ${date}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 10;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = orders.map((order) => {
        const route = order.route != null ? order.route.toString() : '-';
        const stop = order.stop != null ? order.stop.toString() : '-';
        const routeStop = route !== '-' && stop !== '-' ? `${route}/${stop}` : '-';
        
        return [
          order.orderNumber.toString(),
          order.customerName || '-',
          routeStop,
          order.pickerName || '-',
          formatTime(order.startedAt, order.completedAt),
          `${order.box.length + order.tote.length + order.drink.length}`,
          order.invoiced ? 'Yes' : 'No',
          dayjs(order.completedAt).format('MM/DD/YYYY HH:mm'),
        ];
      });

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      const tableWidth = pageWidth - (margin * 2);
      
      autoTableFn(doc, {
        head: [['Order #', 'Customer', 'Route/Stop', 'Picker', 'Time', 'Bundles', 'Invoice Printed', 'Completed At']],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        tableWidth: tableWidth,
        styles: { 
          fontSize: 8, 
          cellPadding: 2, 
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50]
        },
        headStyles: { 
          fillColor: [60, 60, 60], 
          textColor: [255, 255, 255], 
          fontStyle: 'normal', 
          lineWidth: 0.1,
          fontSize: 8
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Order #
          1: { cellWidth: tableWidth * 0.20, halign: 'left' }, // Customer
          2: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Route/Stop
          3: { cellWidth: tableWidth * 0.15, halign: 'left' }, // Picker
          4: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Time
          5: { cellWidth: tableWidth * 0.08, halign: 'center' }, // Bundles
          6: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Invoice Printed
          7: { cellWidth: tableWidth * 0.15, halign: 'left' }, // Completed At
        },
        didDrawPage: (data: any) => {
          addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
        },
      });

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      doc.save(`Completed_Orders_Summary_${dayjs().format('YYYY-MM-DD_HH-mm')}.pdf`);
      toast.success('Summary report generated successfully');
    } catch (error: any) {
      console.error('Error generating summary report:', error);
      toast.error(error?.message || 'Failed to generate summary report');
    } finally {
      setReportLoading(false);
      setReportModalOpen(false);
    }
  };

  // Generate Detail Report for ALL completed orders
  const generateDetailReport = async (includePhotos: boolean = false) => {
    if (orders.length === 0) {
      toast.error('No completed orders available');
      return;
    }

    try {
      setReportLoading(true);

      // Load rabbit logo for footer
      const rabbitLogoDataUrl = await loadLogoAsDataUrl();

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Header Section - Only on first page of document
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Completed Orders Detail Report', margin, yPosition);
      yPosition += 8;

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const date = dayjs(now).format('MM/DD/YYYY HH:mm');
      doc.text(`Generated on: ${date}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 10;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Process each order
      for (let orderIndex = 0; orderIndex < orders.length; orderIndex++) {
        const order = orders[orderIndex];

        // Check if we need a new page (only if not enough space for order header)
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Order Header Section: Three-column layout (Left: Order Info, Center: Time, Right: Customer & Picker)
        const orderLeftY = yPosition;
        const orderRightY = yPosition;
        const centerX = pageWidth / 2;

        // Left side: Order number and details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`Order #${order.orderNumber}`, margin, orderLeftY);
        let leftY = orderLeftY + 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const route = order.route != null ? order.route.toString() : '-';
        const stop = order.stop != null ? order.stop.toString() : '-';
        const routeStop = route !== '-' && stop !== '-' ? `${route}/${stop}` : '-';
        
        const orderLeftInfo = [
          `Total Bundles: ${order.box.length + order.tote.length + order.drink.length}`,
          `Boxes: ${order.box.length}`,
          `Totes: ${order.tote.length}`,
          `Drinks: ${order.drink.length}`,
          `Invoice Printed: ${order.invoiced ? 'Yes' : 'No'}`,
        ];

        orderLeftInfo.forEach((text) => {
          doc.text(text, margin, leftY);
          leftY += 4;
        });

        // Center: Time Taken
        const timeTaken = formatTime(order.startedAt, order.completedAt);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(timeTaken, centerX, orderLeftY + 8, { align: 'center' });

        // Right side: Customer and Picker details
        const customerName = order.customerName || 'N/A';
        const pickerName = order.pickerName || 'N/A';
        const completedAt = dayjs(order.completedAt).format('MM/DD/YYYY HH:mm');

        const orderRightX = pageWidth - margin;
        let rightY = orderRightY;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Customer:', orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(customerName, orderRightX, rightY, { align: 'right' });
        rightY += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Picker:', orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(pickerName, orderRightX, rightY, { align: 'right' });
        rightY += 4;
        if (routeStop !== '-') {
          doc.text(`Route/Stop: ${routeStop}`, orderRightX, rightY, { align: 'right' });
        } else {
          doc.text('Route/Stop: -', orderRightX, rightY, { align: 'right' });
        }
        rightY += 4;
        doc.text(`Completed: ${completedAt}`, orderRightX, rightY, { align: 'right' });

        yPosition = Math.max(leftY, rightY) + 8;

        // Fetch order items for this order
        let orderItems: OrderItemWithContainer[] = [];
        try {
          const itemsResponse: any = await getOrderItems(order.orderNumber);
          orderItems = itemsResponse?.data?.data || [];
        } catch (error) {
          console.error(`Error fetching items for order ${order.orderNumber}:`, error);
        }

        // Group items by container
        const containerItems: Record<string, OrderItemWithContainer[]> = {};
        orderItems.forEach((item) => {
          const containerKey = `${item.boxType}-${item.boxId}`;
          if (!containerItems[containerKey]) {
            containerItems[containerKey] = [];
          }
          containerItems[containerKey].push(item);
        });

        // Sort containers: boxes first, then totes, then drinks
        const sortedContainers = Object.keys(containerItems).sort((a, b) => {
          const [typeA, idA] = a.split('-');
          const [typeB, idB] = b.split('-');
          const typeOrder = { box: 1, tote: 2, drink: 3 };
          if (typeOrder[typeA as keyof typeof typeOrder] !== typeOrder[typeB as keyof typeof typeOrder]) {
            return typeOrder[typeA as keyof typeof typeOrder] - typeOrder[typeB as keyof typeof typeOrder];
          }
          return parseInt(idA) - parseInt(idB);
        });

        // Items by Container Section
        if (sortedContainers.length > 0) {
          sortedContainers.forEach((containerKey) => {
            const [containerType, containerId] = containerKey.split('-');
            const items = containerItems[containerKey];
            const containerName = `${containerType.toUpperCase()} ${containerId}`;

            // Check if we need a new page
            if (yPosition > pageHeight - 50) {
              doc.addPage();
              yPosition = margin;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(containerName, margin, yPosition);
            yPosition += 5;

            // Table for items in this container
            const tableData = items.map((item) => [
              item.itemNumber.toString(),
              item.description || '-',
              item.qty.toString(),
            ]);

            const tableWidth = pageWidth - (margin * 2);
            
            autoTableFn(doc, {
              head: [['Item #', 'Description', 'Qty']],
              body: tableData,
              startY: yPosition,
              margin: { left: margin, right: margin },
              tableWidth: tableWidth,
              styles: { 
                fontSize: 8, 
                cellPadding: 2, 
                lineWidth: 0.1,
                lineColor: [220, 220, 220],
                textColor: [50, 50, 50]
              },
              headStyles: { 
                fillColor: [60, 60, 60], 
                textColor: [255, 255, 255], 
                fontStyle: 'bold', 
                lineWidth: 0.1,
                fontSize: 8
              },
              alternateRowStyles: { fillColor: [250, 250, 250] },
              columnStyles: {
                0: { cellWidth: tableWidth * 0.15, halign: 'center' },
                1: { cellWidth: tableWidth * 0.70, halign: 'left' },
                2: { cellWidth: tableWidth * 0.15, halign: 'center' },
              },
              didDrawPage: (data: any) => {
                addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
              },
            });

            // Get the final Y position after the table
            const finalY = (doc as any).lastAutoTable.finalY || yPosition + items.length * 5;
            yPosition = finalY + 5;
          });
        } else {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text('Items by Container', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('No items found for this order', margin, yPosition);
          yPosition += 5;
        }

        // Photos Section (if included)
        if (includePhotos) {
          let photos: string[] = [];
          try {
            const photosResponse: any = await getOrderPhotos(order.orderNumber);
            const photosData = photosResponse?.data?.data;
            if (photosData && photosData.photos) {
              photos = photosData.photos;
            }
          } catch (error) {
            console.error(`Error fetching photos for order ${order.orderNumber}:`, error);
          }

          if (photos.length > 0) {
            // Check if we need a new page
            if (yPosition > pageHeight - 60) {
              doc.addPage();
              yPosition = margin;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text('Photos', margin, yPosition);
            yPosition += 6;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Photos: ${photos.length}`, margin, yPosition);
            yPosition += 8;

            // Display photos in a grid (3 per row, smaller size for better fit)
            const photoSize = 45; // mm (smaller size)
            const spacing = 5;
            const photosPerRow = 3;
            let currentRow = 0;
            let currentCol = 0;
            let startY = yPosition;

            for (let i = 0; i < photos.length; i++) {
              // Check if we need a new page
              if (startY + (currentRow + 1) * (photoSize + spacing) > pageHeight - margin - 10) {
                doc.addPage();
                startY = margin;
                currentRow = 0;
                currentCol = 0;
              }

              const photo = photos[i];
              const xPos = margin + currentCol * (photoSize + spacing);
              const yPos = startY + currentRow * (photoSize + spacing);

              try {
                const imageDataUrl = await loadImageAsDataUrl(photo);
                if (imageDataUrl) {
                  doc.addImage(imageDataUrl, 'JPEG', xPos, yPos, photoSize, photoSize);
                } else {
                  // Placeholder if image fails to load
                  doc.setFillColor(200, 200, 200);
                  doc.rect(xPos, yPos, photoSize, photoSize, 'F');
                  doc.setFontSize(8);
                  doc.text('Image', xPos + photoSize / 2 - 5, yPos + photoSize / 2);
                }
              } catch (error) {
                console.error('Error loading photo:', error);
                doc.setFillColor(200, 200, 200);
                doc.rect(xPos, yPos, photoSize, photoSize, 'F');
                doc.setFontSize(8);
                doc.text('Error', xPos + photoSize / 2 - 5, yPos + photoSize / 2);
              }

              currentCol++;
              if (currentCol >= photosPerRow) {
                currentCol = 0;
                currentRow++;
              }
            }
            yPosition = startY + (currentRow + 1) * (photoSize + spacing);
          } else {
            // Check if we need a new page
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = margin;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Photos', margin, yPosition);
            yPosition += 6;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('No photos available for this order', margin, yPosition);
            yPosition += 5;
          }
        }

        // Dark divider between orders (except last order)
        if (orderIndex < orders.length - 1) {
          // Check if we need a new page for divider
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(1);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        }
      }

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      const fileName = `All_Orders_Detail_${dayjs().format('YYYY-MM-DD_HH-mm')}.pdf`;
      doc.save(fileName);
      toast.success(`Detail report generated successfully for ${orders.length} order(s)`);
    } catch (error: any) {
      console.error('Error generating detail report:', error);
      toast.error(error?.message || 'Failed to generate detail report');
    } finally {
      setReportLoading(false);
      setReportModalOpen(false);
    }
  };

  return (
    <Box sx={{
      p: 1.5,
      bgcolor: 'background.default',
      height: { xs: 'auto', lg: 'calc(100vh - 150px)' },
      minHeight: { xs: '100vh', lg: 'calc(100vh - 150px)' },
      display: 'flex',
      flexDirection: 'column',
      overflow: { xs: 'visible', lg: 'hidden' },
      transition: 'all 0.2s ease',
    }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        gap={1.5} 
        mb={1.5} 
        sx={{ flexShrink: 0 }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setSelectedOrder(null);
            setSelectedBoxId(null);
            setSelectedContainerType(null);
            setShowAllItems(true);
            setBoxItems([]);
            setAllOrderItems([]);
            setExpandedOrders(new Set());
            setOrderImages([]);
            setOrderPhotosData(null);
          }}
          sx={{
            minHeight: 'auto',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: { xs: 14, sm: 16 },
              fontWeight: 500,
              minHeight: 40,
              px: { xs: 2, sm: 3 },
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 500,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Pending" value="pending" />
          <Tab label="Completed" value="completed" />
        </Tabs>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {activeTab === 'completed' && (
            <>
              <CustomButton
                buttonType="primary"
                onClick={() => {
                  setReportType('summary');
                  setReportModalOpen(true);
                }}
                size="small"
                fullWidth={isSmallMobile}
                sx={{ mt: 0, width: { xs: '100%', sm: 'auto' } }}
              >
                Summary Report
              </CustomButton>
              <CustomButton
                buttonType="primary"
                onClick={() => {
                  setReportType('detail');
                  setReportModalOpen(true);
                }}
                size="small"
                fullWidth={isSmallMobile}
                sx={{ mt: 0, width: { xs: '100%', sm: 'auto' } }}
              >
                Detail Report
              </CustomButton>
            </>
          )}
          <CustomButton
            buttonType="primary"
            onClick={fetchOrders}
            icon={<Refresh />}
            iconPosition="left"
            size="small"
            fullWidth={isSmallMobile}
            sx={{ mt: 0, width: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </CustomButton>
        </Box>
      </Box>

      <Grid container spacing={1.5} sx={{
        flex: 1,
        minHeight: 0,
        height: { xs: 'auto', lg: 'calc(100vh - 200px)' },
        overflow: 'hidden'
      }}>
        {/* Orders List - Left Column */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: { xs: 'auto', lg: '100%' },
          maxHeight: { xs: '400px', lg: 'none' },
          overflow: 'hidden'
        }}>
          <Paper
            sx={{
              p: 1.5,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              height: '100%',
              borderRadius: 2,
              transition: 'all 0.2s ease',
            }}
          >
            <Box sx={{ flexShrink: 0, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={500} fontSize={14} color="text.primary">
                Orders
              </Typography>
            </Box>
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              height: 'calc(100% - 40px)',
              minHeight: 0
            }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : orders.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" p={3}>
                  No orders available
                </Typography>
              ) : (
                <Box>
                  {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.orderNumber);
                    const isSelected = selectedOrder?.orderNumber === order.orderNumber;
                    return (
                    <Card
                      key={order.orderNumber}
                      sx={{
                        mb: 1,
                        mt: 0.5,
                        mx: 0.5,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : order.invoiced ? (isDark ? 'rgba(46, 125, 50, 0.5)' : 'rgba(46, 125, 50, 0.6)') : 'divider',
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                        overflow: 'hidden',
                        boxShadow: isSelected ? 4 : 2,
                        bgcolor: isSelected 
                          ? (isDark ? 'rgba(60, 119, 149, 0.1)' : 'rgba(60, 119, 149, 0.05)')
                          : order.invoiced
                            ? (isDark ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.15)')
                            : activeTab === 'completed'
                              ? (isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)')
                              : 'background.paper',
                        '&:hover': {
                          boxShadow: 4,
                          borderColor: order.invoiced ? (isDark ? 'rgba(46, 125, 50, 0.7)' : 'rgba(46, 125, 50, 0.8)') : 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleOrderSelect(order)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={0.75}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Box component="img" src={BoxIcon} alt="Box" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                            </Box>
                            <Box>
                              <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                <Typography variant="body2" fontWeight={500} fontSize={12} color="text.primary">
                                  Order #{order.orderNumber}
                                </Typography>
                                {order.invoiced && (
                                  <Box
                                    sx={{
                                      px: 0.75,
                                      py: 0.25,
                                      borderRadius: 1,
                                      bgcolor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)',
                                      border: '1px solid',
                                      borderColor: isDark ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.3)',
                                    }}
                                  >
                                    <Typography variant="caption" fontSize={9} fontWeight={500} color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      Invoice Printed
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography variant="caption" fontSize={10} color="text.secondary">
                                {order.box.length + order.tote.length + order.drink.length} bundles • Route {order.route} - Stop {order.stop}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton size="small" sx={{ p: 0.25, color: 'text.secondary' }}>
                            {isExpanded ? <ExpandLess fontSize="small" sx={{ fontSize: 16 }} /> : <ExpandMore fontSize="small" sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Box>

                        <Collapse in={isExpanded}>
                          <Box mt={1.5}>
                            {/* Store Section */}
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              p={1}
                              mb={1}
                              sx={{
                                bgcolor: isDark ? 'rgba(60, 119, 149, 0.15)' : 'rgba(60, 119, 149, 0.12)',
                                borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 0.75,
                                  bgcolor: isDark ? 'white' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Box component="img" src={BoxIcon} alt="Store" sx={{ width: 16, height: 16 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                                  Store
                                </Typography>
                                <Typography variant="body2" fontSize={11} fontWeight={500} color="text.primary">
                                  {order.customerName}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Picker and Time */}
                            <Grid container spacing={1} mb={1}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={0.5}
                                  p={0.75}
                                  sx={{
                                    // bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(240, 240, 240, 0.8)',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Box component="img" src={PickerIcon} alt="Picker" sx={{ width: 16, height: 16 }} />
                                  <Box>
                                    <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                                      Picker
                                    </Typography>
                                    <Typography variant="body2" fontSize={11} fontWeight={500} color="text.primary">
                                      {order.pickerName || '-'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={0.5}
                                  p={0.75}
                                  sx={{
                                    // bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(240, 240, 240, 0.8)',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Box component="img" src={TimeIcon} alt="Time" sx={{ width: 16, height: 16 }} />
                                  <Box>
                                    <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                                      Time
                                    </Typography>
                                    <Typography variant="body2" fontSize={11} fontWeight={500} color="text.primary">
                                      {formatTime(order.startedAt, order.completedAt)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Box, Tote, Drink Counts */}
                            <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                              {/* Box */}
                              <Box
                                sx={{
                                  flex: { xs: '1 1 calc(33.333% - 4px)', sm: 1 },
                                  minWidth: { xs: 'calc(33.333% - 4px)', sm: 'auto' },
                                  px: 0.75,
                                  // bgcolor: isDark ? 'rgba(60, 119, 149, 0.15)' : 'rgba(60, 119, 149, 0.12)',
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: { xs: 0.5, sm: 1 },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.75,
                                    bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',  
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Box component="img" src={BoxIcon} alt="Box" sx={{ width: 16, height: 16, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                                </Box>
                                <Box>
                                <Typography variant="caption" fontSize={10} fontWeight={500} color="primary.main">
                                  Box
                                </Typography>
                                <Typography variant="body2" fontSize={12} fontWeight={500} color="primary.main">
                                  {order.box.length}
                                </Typography>
                                </Box>
                              </Box>
                              {/* Tote */}
                              <Box
                                sx={{
                                  flex: { xs: '1 1 calc(33.333% - 4px)', sm: 1 },
                                  minWidth: { xs: 'calc(33.333% - 4px)', sm: 'auto' },
                                  px: 0.75,
                                  // bgcolor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.12)',
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: { xs: 0.5, sm: 1 },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.75,
                                    bgcolor: isDark ? 'rgba(76, 175, 80, 0.7)' : 'rgba(76, 175, 80, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Box component="img" src={ToteIcon} alt="Tote" sx={{ width: 16, height: 16, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                                </Box>
                                <Box>
                                <Typography variant="caption" fontSize={10} fontWeight={500} color="success.main">
                                  Tote
                                </Typography>
                                <Typography variant="body2" fontSize={12} fontWeight={500} color="success.main">
                                  {order.tote.length}
                                </Typography>
                                </Box>
                              </Box>
                              {/* Drink */}
                              <Box
                                sx={{
                                  flex: { xs: '1 1 calc(33.333% - 4px)', sm: 1 },
                                  minWidth: { xs: 'calc(33.333% - 4px)', sm: 'auto' },
                                  px: 0.75,
                                  // bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.12)',
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: { xs: 0.5, sm: 1 },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.75,
                                    bgcolor: isDark ? 'rgba(244, 67, 54, 0.7)' : 'rgba(244, 67, 54, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Box component="img" src={DrinkIcon} alt="Drink" sx={{ width: 16, height: 16, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                                </Box>
                                <Box>
                                <Typography variant="caption" fontSize={10} fontWeight={500} color="error.main">
                                  Drink
                                </Typography>
                                <Typography variant="body2" fontSize={12} fontWeight={500} color="error.main">
                                  {order.drink.length}
                                </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {isSelected && (isEditingAllowed || (activeTab === 'completed' && order.invoiced)) && (
                              <CustomButton
                                buttonType="primary"
                                fullWidth
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBundleCreationModalOpen(true);
                                }}
                                icon={<Box component="img" src={BoxIcon} alt="Box" sx={{ width: 16, height: 16 , filter: 'brightness(0) invert(1)', opacity: 1 }} />}
                                iconPosition="left"
                                sx={{ mt: 1 }}
                              >
                               {activeTab === 'completed' && order.invoiced ? 'Bundle Print' : 'Bundle Creation'}
                              </CustomButton>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Order Details - Combined Column */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: { xs: 'auto', lg: '100%' },
          overflow: 'hidden',
          mt: { xs: 1.5, lg: 0 }
        }}>
          <Paper
            sx={{
              p: 1.5,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              height: '100%',
              borderRadius: 2,
              transition: 'all 0.2s ease',
            }}
          >
            <Box sx={{ flexShrink: 0, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={500} fontSize={14} color="text.primary">
                Order Details
              </Typography>
            </Box>
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 1.5,
              minHeight: 0,
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}>
              {/* Container List - Left Side */}
              <Box sx={{
                flex: { xs: '0 0 auto', lg: '0 0 30%' },
                minWidth: { lg: 180 },
                maxWidth: { lg: 250 },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRight: { xs: 'none', lg: `1px solid ${theme.palette.divider}` },
                borderBottom: { xs: `1px solid ${theme.palette.divider}`, lg: 'none' },
                pr: { xs: 0, lg: 1.5 },
                pb: { xs: 1.5, lg: 0 },
                maxHeight: { xs: '300px', lg: 'none' }
              }}>
                <Box sx={{
                  flex: 1,
                  overflow: 'auto',
                  minHeight: 0
                }}>
                  {selectedOrder ? (
                    <List sx={{ p: 0 }}>
                      {allContainers.map((container) => {
                        const isSelected = selectedBoxId === container.id && selectedContainerType === container.type;
                        const containerColor = getContainerColor(container.type);
                        return (
                          <ListItemButton
                            key={`${container.type}-${container.id}`}
                            onClick={() => handleContainerSelect(container.id, container.type)}
                            sx={{
                              mb: 1,
                              py: 1,
                              px: 1.5,
                              borderRadius: 1.5,
                              bgcolor: isSelected
                                ? containerColor
                                : isDark 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : container.type === 'box'
                                    ? 'rgba(60, 119, 149, 0.08)'
                                    : container.type === 'tote'
                                      ? 'rgba(76, 175, 80, 0.08)'
                                      : 'rgba(244, 67, 54, 0.08)',
                              border: isSelected ? 'none' : '1px solid',
                              borderColor: isSelected ? 'transparent' : 'divider',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: isSelected 
                                  ? containerColor 
                                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  filter: isSelected ? 'brightness(0) invert(1)' : 'none',
                                }}
                              >
                                {getContainerIcon(container.type)}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={container.name}
                              primaryTypographyProps={{
                                fontWeight: isSelected ? 500 : 400,
                                fontSize: 13,
                                color: isSelected ? 'white' : 'text.primary',
                              }}
                            />
                            {isEditingAllowed && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  p: 0.5,
                                  bgcolor: isSelected ? containerColor : 'transparent',
                                  minWidth: 32,
                                  '&:hover': {
                                    bgcolor: isSelected ? containerColor : 'rgba(0,0,0,0.04)',
                                  }
                                }} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle edit container
                                }}
                              >
                                {isSelected ? (
                                  <Box component="img" src={BoxEditWhite} alt="Edit" sx={{ width: 16, height: 16 }} />
                                ) : (
                                  <Box component="img" src={BoxEditBlue} alt="Edit" sx={{ width: 16, height: 16 }} />
                                )}
                              </IconButton>
                            )}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" p={3}>
                      Select an order to view details
                    </Typography>
                  )}
                </Box>
                {selectedOrder && isEditingAllowed && (
                  <Box sx={{ flexShrink: 0, mt: 1 }}>
                    <CustomButton
                      buttonType="primary"
                      onClick={() => setAddContainerModalOpen(true)}
                      icon={<Add />}
                      iconPosition="left"
                      size="small"
                      fullWidth
                      sx={{ mt: 0 }}
                    >
                      Add Container
                    </CustomButton>
                  </Box>
                )}
              </Box>

              {/* Items in Container - Right Side */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {selectedOrder ? (
                  <>
                    <Box sx={{ flexShrink: 0, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        {showAllItems ? (
                          <>
                            <Typography variant="subtitle1" fontWeight={500} fontSize={16} color="text.primary">
                              All Items
                            </Typography>
                            <Typography variant="body2" fontSize={12} color="text.secondary" mt={0.5}>
                              Items from all containers ({getAllItemsFromOrder.length}):
                            </Typography>
                          </>
                        ) : selectedBoxId && selectedContainerType ? (
                          <>
                            <Typography variant="subtitle1" fontWeight={500} fontSize={16} color="text.primary">
                              {selectedContainerType.toUpperCase()} {selectedBoxId}
                            </Typography>
                            <Typography variant="body2" fontSize={12} color="text.secondary" mt={0.5}>
                              Items in this {selectedContainerType} ({boxItems.length}):
                            </Typography>
                          </>
                        ) : null}
                      </Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={showAllItems}
                            onChange={(e) => {
                              setShowAllItems(e.target.checked);
                              if (e.target.checked) {
                                setSelectedBoxId(null);
                                setSelectedContainerType(null);
                              }
                            }}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2" fontSize={12}>Show All Items</Typography>}
                      />
                    </Box>

                    <Box sx={{
                      flex: 1,
                      overflow: 'auto',
                      minHeight: 0
                    }}>
                      {(orderItemsLoading || (boxItemsLoading && !showAllItems)) ? (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      ) : showAllItems ? (
                        getAllItemsFromOrder.length === 0 ? (
                          <Typography color="text.secondary" textAlign="center" p={3}>
                            No items available
                          </Typography>
                        ) : (
                          <List>
                            {getAllItemsFromOrder.map((item, index) => (
                              <Card
                                key={`${item.containerId}-${item.itemNumber}-${index}`}
                                sx={{
                                  mb: 1,
                                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    borderColor: 'primary.main',
                                    boxShadow: 2,
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Box display="flex" gap={1.5} alignItems="center" justifyContent="space-between">
                                    {/* Left Side: Container - Item Number - Description */}
                                    <Box flex={1} minWidth={0}>
                                      <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                                        <Typography variant="caption" fontSize={10} color="text.secondary">
                                          {item.containerType === 'box' ? 'BOX' : item.containerType === 'tote' ? 'TOTE' : 'DRINK'} {item.containerId}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" gap={1} alignItems="center">
                                        <Typography 
                                          variant="body2"
                                          fontSize={13}
                                          fontWeight={500}
                                          color="primary.main"
                                        >
                                          {item.itemNumber}
                                        </Typography>
                                        <Box
                                          sx={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            bgcolor: 'text.secondary',
                                            opacity: 0.5,
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          fontSize={13}
                                          fontWeight={500}
                                          color="text.primary"
                                          sx={{
                                            wordBreak: 'break-word',
                                            lineHeight: 1.4,
                                          }}
                                        >
                                          {item.description}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    {/* Right Side: Qty - Edit - Move */}
                                    <Box display="flex" gap={1} alignItems="center" flexShrink={0}>
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          px: 1.25,
                                          py: 0.5,
                                          borderRadius: 2,
                                          bgcolor: isDark 
                                            ? 'rgba(60, 119, 149, 0.25)' 
                                            : 'rgba(60, 119, 149, 0.15)',
                                          border: '1.5px solid',
                                          borderColor: 'primary.main',
                                          minWidth: 50,
                                          position: 'relative',
                                          boxShadow: '0 2px 4px rgba(60, 119, 149, 0.2)',
                                        }}
                                      >
                                        <Typography 
                                          variant="caption" 
                                          fontSize={11} 
                                          fontWeight={500} 
                                          color="primary.main"
                                          sx={{
                                            letterSpacing: 0.5,
                                          }}
                                        >
                                          QTY: {item.qty}
                                        </Typography>
                                      </Box>
                                      {isEditingAllowed && (
                                        <>
                                          {!isQtyEditDisabled && (
                                            <IconButton
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditItem(item, 'qty');
                                              }}
                                              sx={{ 
                                                p: 0.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                  transform: 'scale(1.1)',
                                                  bgcolor: 'primary.light',
                                                },
                                              }}
                                              title="Edit Quantity"
                                            >
                                              <Box component="img" src={EditBlue} alt="Edit" sx={{ width: 16, height: 16 }} />
                                            </IconButton>
                                          )}
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditItem(item, 'move');
                                            }}
                                            sx={{ 
                                              p: 0.5,
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                transform: 'scale(1.1)',
                                                bgcolor: 'primary.light',
                                              },
                                            }}
                                            title="Move Item"
                                          >
                                            <Box component="img" src={MoveIcon} alt="Move" sx={{ width: 15, height: 15 }} />
                                          </IconButton>
                                        </>
                                      )}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </List>
                        )
                      ) : selectedBoxId && selectedContainerType ? (
                        boxItems.length === 0 ? (
                          <Typography color="text.secondary" textAlign="center" p={3}>
                            No items in this {selectedContainerType}
                          </Typography>
                        ) : (
                          <List>
                            {boxItems.map((item, index) => (
                              <Card
                                key={index}
                              sx={{
                                mb: 1,
                                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                  borderColor: 'primary.main',
                                  boxShadow: 2,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box display="flex" gap={1.5} alignItems="center" justifyContent="space-between">
                                  {/* Left Side: Item Number - Description */}
                                  <Box flex={1} minWidth={0}>
                                    <Box display="flex" gap={1} alignItems="center">
                                      <Typography 
                                        variant="body2"
                                        fontSize={13}
                                        fontWeight={500}
                                        color="primary.main"
                                      >
                                        {item.itemNumber}
                                      </Typography>
                                      <Box
                                        sx={{
                                          width: 4,
                                          height: 4,
                                          borderRadius: '50%',
                                          bgcolor: 'text.secondary',
                                          opacity: 0.5,
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        fontSize={13}
                                        fontWeight={500}
                                        color="text.primary"
                                        sx={{
                                          wordBreak: 'break-word',
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {item.description}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  {/* Right Side: Qty - Edit - Move */}
                                  <Box display="flex" gap={1} alignItems="center" flexShrink={0}>
                                    <Box
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 2,
                                        bgcolor: isDark 
                                          ? 'rgba(60, 119, 149, 0.25)' 
                                          : 'rgba(60, 119, 149, 0.15)',
                                        border: '1.5px solid',
                                        borderColor: 'primary.main',
                                        minWidth: 50,
                                        position: 'relative',
                                        boxShadow: '0 2px 4px rgba(60, 119, 149, 0.2)',
                                      }}
                                    >
                                      <Typography 
                                        variant="caption" 
                                        fontSize={11} 
                                        fontWeight={700} 
                                        color="primary.main"
                                        sx={{
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        QTY: {item.qty}
                                      </Typography>
                                    </Box>
                                    {isEditingAllowed && (
                                      <>
                                        {!isQtyEditDisabled && (
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditItem(item, 'qty');
                                            }}
                                            sx={{ 
                                              p: 0.5,
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                transform: 'scale(1.1)',
                                                bgcolor: 'primary.light',
                                              },
                                            }}
                                            title="Edit Quantity"
                                          >
                                            <Box component="img" src={EditBlue} alt="Edit" sx={{ width: 16, height: 16 }} />
                                          </IconButton>
                                        )}
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditItem(item, 'move');
                                          }}
                                          sx={{ 
                                            p: 0.5,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                              transform: 'scale(1.1)',
                                              bgcolor: 'primary.light',
                                            },
                                          }}
                                          title="Move Item"
                                        >
                                          <Box component="img" src={MoveIcon} alt="Move" sx={{ width: 15, height: 15 }} />
                                        </IconButton>
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                            ))}
                          </List>
                        )
                      ) : null}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" textAlign="center">
                      Select an order to view items
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Item Modal - Move Mode */}
      <CommonModal
        open={editItemModalOpen && editItemForm.mode === 'move'}
        onClose={() => {
          if (!editItemLoading) {
            setEditItemModalOpen(false);
            setEditItemForm({ item: null, source: '', destination: '', qty: 0, mode: 'move' });
          }
        }}
        title="Edit Item"
        size="md"
      >
        {editItemForm.item && (
          <Box>
            <Box display="flex" justifyContent="center" mb={1}>
              <Box
                component="img"
                src={editItemForm.item.masterImage || editItemForm.item.distributorImage || '/src/assets/Default-Product-Image.jpg'}
                alt={editItemForm.item.description}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: 0.75,
                  bgcolor: 'divider',
                  p: 0.5,
                }}
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/Default-Product-Image.jpg';
                }}
              />
            </Box>
            <Typography variant="body2" fontWeight={500} fontSize={12} mb={0.5} textAlign="center" sx={{ lineHeight: 1.4 }}>
              {editItemForm.item.description}
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              p={0.75}
              mb={0.75}
              sx={{
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.5,
                  bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box component="img" src={BoxIcon} alt="Item" sx={{ width: 12, height: 12, filter: 'brightness(0) invert(1)', opacity: 1 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                  Item Number
                </Typography>
                <Typography variant="body2" fontSize={11} fontWeight={500} color="text.primary">
                  {editItemForm.item.itemNumber}
                </Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              p={0.75}
              mb={1}
              sx={{
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.5,
                  bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box component="img" src={BoxIcon} alt="UPC" sx={{ width: 12, height: 12, filter: 'brightness(0) invert(1)', opacity: 1 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                  Primary UPC
                </Typography>
                <Typography variant="body2" fontSize={11} fontWeight={500} color="primary.main">
                  {editItemForm.item.upcList[0]?.UPC_Number || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <TextInput
              label="Source"
              value={editItemForm.source}
              disabled
              sx={{ mb: 1 }}
            />
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <InputLabel sx={{ fontSize: 12 }}>Destination</InputLabel>
              <Select
                value={editItemForm.destination}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, destination: e.target.value })
                }
                label="Destination"
                sx={{ fontSize: 12 }}
              >
                {allContainers
                  .filter((c) => !(c.id === selectedBoxId && c.type === selectedContainerType))
                  .map((container) => {
                    const containerTypeUpper = container.type.toUpperCase();
                    const value = containerTypeUpper === 'BOX' ? `Box-${container.id}` :
                      containerTypeUpper === 'TOTE' ? `Tote-${container.id}` :
                        `Drink-${container.id}`;
                    return (
                      <MenuItem key={`${container.type}-${container.id}`} value={value} sx={{ fontSize: 12 }}>
                        {container.name}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>

            <Box display="flex" justifyContent="flex-end" gap={1} mt={1.5}>
              <CustomButton
                buttonType="cancel"
                appearance="outlined"
                onClick={() => {
                  setEditItemModalOpen(false);
                  setEditItemForm({ item: null, source: '', destination: '', qty: 0, mode: 'move' });
                }}
                size="small"
                fullWidth={false}
                disabled={editItemLoading}
                sx={{ mt: 0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton buttonType="primary" onClick={handleConfirmSaveEditItem} size="small" fullWidth={false} loading={editItemLoading} disabled={editItemLoading} sx={{ mt: 0 }}>
                Save
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Edit Item Modal - Quantity Mode */}
      <CommonModal
        open={editItemModalOpen && editItemForm.mode === 'qty'}
        onClose={() => {
          if (!editItemLoading) {
            setEditItemModalOpen(false);
            setEditItemForm({ item: null, source: '', destination: '', qty: 0, mode: 'move' });
          }
        }}
        title="Edit Item"
        size="md"
      >
        {editItemForm.item && (
          <Box>
            <Box display="flex" justifyContent="center" mb={1}>
              <Box
                component="img"
                src={editItemForm.item.masterImage || editItemForm.item.distributorImage || '/src/assets/Default-Product-Image.jpg'}
                alt={editItemForm.item.description}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: 0.75,
                  bgcolor: 'divider',
                  p: 0.5,
                }}
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/Default-Product-Image.jpg';
                }}
              />
            </Box>
            <Typography variant="body2" fontWeight={500} fontSize={12} mb={0.5} textAlign="center" sx={{ lineHeight: 1.4 }}>
              {editItemForm.item.description}
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              p={0.75}
              mb={0.75}
              sx={{
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.5,
                  bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box component="img" src={BoxIcon} alt="Item" sx={{ width: 12, height: 12, filter: 'brightness(0) invert(1)', opacity: 1 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                  Item Number
                </Typography>
                <Typography variant="body2" fontSize={11} fontWeight={500} color="text.primary">
                  {editItemForm.item.itemNumber}
                </Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              p={0.75}
              mb={1}
              sx={{
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.5,
                  bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box component="img" src={BoxIcon} alt="UPC" sx={{ width: 12, height: 12, filter: 'brightness(0) invert(1)', opacity: 1 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontSize={10} color="text.secondary" display="block">
                  Primary UPC
                </Typography>
                <Typography variant="body2" fontSize={11} fontWeight={500} color="primary.main">
                  {editItemForm.item.upcList[0]?.UPC_Number || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Box mb={1.5}>
              <Typography variant="caption" fontSize={10} mb={0.75} color="text.secondary" display="block">
                Quantity
              </Typography>
              <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                <IconButton
                  onClick={() =>
                    setEditItemForm({
                      ...editItemForm,
                      qty: Math.max(0, editItemForm.qty - 1),
                    })
                  }
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Remove fontSize="small" sx={{ fontSize: 16 }} />
                </IconButton>
                <TextField
                  type="number"
                  value={editItemForm.qty}
                  onChange={(e) =>
                    setEditItemForm({
                      ...editItemForm,
                      qty: Math.max(0, Number(e.target.value)),
                    })
                  }
                  sx={{ width: 70, textAlign: 'center' }}
                  inputProps={{
                    style: { textAlign: 'center', fontSize: 12 },
                    min: 0
                  }}
                />
                <IconButton
                  onClick={() =>
                    setEditItemForm({
                      ...editItemForm,
                      qty: editItemForm.qty + 1,
                    })
                  }
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Add fontSize="small" sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" fontSize={10} color="success.main" mt={0.75} textAlign="center" display="block">
                Current Qty : {editItemForm.item.qty}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={1} mt={1.5}>
              <CustomButton
                buttonType="cancel"
                appearance="outlined"
                onClick={() => {
                  setEditItemModalOpen(false);
                  setEditItemForm({ item: null, source: '', destination: '', qty: 0, mode: 'move' });
                }}
                size="small"
                fullWidth={false}
                disabled={editItemLoading}
                sx={{ mt: 0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton buttonType="primary" onClick={handleConfirmSaveEditItem} size="small" fullWidth={false} loading={editItemLoading} disabled={editItemLoading} sx={{ mt: 0 }}>
                Save
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Bundle Creation Modal */}
      <CommonModal
        open={bundleCreationModalOpen}
        onClose={() => {
          setBundleCreationModalOpen(false);
        }}
        title={selectedOrder && activeTab === 'completed' && selectedOrder.invoiced ? "Bundle Print" : "Bundle Creation"}
        size="xl"
      >
        {selectedOrder && (
          <Box>
            {/* Top Section - Order Info Left, Container Counts Right */}
            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'flex-start' }} gap={{ xs: 1, lg: 0 }} mb={1.5}>
              {/* Order Info - Left */}
              <Box display="flex" alignItems="center" gap={0.75}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box component="img" src={BoxIcon} alt="Box" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={500} fontSize={14} color="text.primary">
                    Order #{selectedOrder.orderNumber}
                  </Typography>
                  <Typography variant="caption" fontSize={11} color="text.secondary">
                    {boxItems.length || selectedOrder.box.length + selectedOrder.tote.length + selectedOrder.drink.length} bundles • Route {selectedOrder.route} - Stop {selectedOrder.stop}
                  </Typography>
                </Box>
              </Box>

              {/* Container Counts - Right (Only Box, Tote, Drink) */}
              <Box display="flex" gap={0.5} alignItems="flex-start" sx={{ width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'space-between', lg: 'flex-start' } }}>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 60,
                  }}
                >
                  <Box component="img" src={BoxIcon} alt="Box" sx={{ width: 16, height: 16 }} />
                  <Box>
                    <Typography variant="caption" fontSize={10} fontWeight={500} color="primary.main" display="block">
                      Box
                    </Typography>
                    <Typography variant="body2" fontSize={12} fontWeight={500} color="primary.main">
                      {selectedOrder.box.length}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 60,
                  }}
                >
                  <Box component="img" src={ToteIcon} alt="Tote" sx={{ width: 16, height: 16 }} />
                  <Box>
                    <Typography variant="caption" fontSize={10} fontWeight={500} color="success.main" display="block">
                      Tote
                    </Typography>
                    <Typography variant="body2" fontSize={12} fontWeight={500} color="success.main">
                      {selectedOrder.tote.length}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 60,
                  }}
                >
                  <Box component="img" src={DrinkIcon} alt="Drink" sx={{ width: 16, height: 16 }} />
                  <Box>
                    <Typography variant="caption" fontSize={10} fontWeight={500} color="error.main" display="block">
                      Drink
                    </Typography>
                    <Typography variant="body2" fontSize={12} fontWeight={500} color="error.main">
                      {selectedOrder.drink.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Second Row - Store, Picker, Time */}
            <Grid container spacing={0.5} mb={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.75}
                  p={1.25}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: 60,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 0.5,
                      bgcolor: isDark ? 'rgba(60, 119, 149, 0.7)' : 'rgba(60, 119, 149, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Box component="img" src={BoxIcon} alt="Store" sx={{ width: 16, height: 16, filter: 'brightness(0) invert(1)', opacity: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" fontSize={11} color="text.secondary" display="block" mb={0.25}>
                      Store
                    </Typography>
                    <Typography variant="body2" fontSize={13} fontWeight={500} color="text.primary">
                      {selectedOrder.customerName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.75}
                  p={1.25}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: 60,
                  }}
                >
                  <Box component="img" src={PickerIcon} alt="Picker" sx={{ width: 20, height: 20 }} />
                  <Box>
                    <Typography variant="caption" fontSize={11} color="text.secondary" display="block" mb={0.25}>
                      Picker
                    </Typography>
                    <Typography variant="body2" fontSize={13} fontWeight={500} color="text.primary">
                      {selectedOrder.pickerName || '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.75}
                  p={1.25}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: 60,
                  }}
                >
                  <Box component="img" src={TimeIcon} alt="Time" sx={{ width: 20, height: 20 }} />
                  <Box>
                    <Typography variant="caption" fontSize={11} color="text.secondary" display="block" mb={0.25}>
                      Time
                    </Typography>
                    <Typography variant="body2" fontSize={13} fontWeight={500} color="text.primary">
                      {formatTime(selectedOrder.startedAt, selectedOrder.completedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={1.5} sx={{ 
              height: { xs: 'auto', lg: '500px' },
              minHeight: { xs: 'auto', lg: '500px' },
            }}>
              {/* Bundle List - Left Side */}
              <Box sx={{ 
                width: { xs: '100%', lg: 180 }, 
                flexShrink: 0,
                height: { xs: 'auto', lg: '100%' },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <Typography variant="subtitle2" fontWeight={500} fontSize={14} mb={1}>
                  Bundles
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <List sx={{ p: 0 }}>
                    {allContainers.map((container) => {
                      const containerKey = `${container.type}-${container.id}`;
                      return (
                        <Box
                          key={containerKey}
                          sx={{
                            mb: 0.75,
                            py: 1,
                            px: 1,
                            borderRadius: 0.75,
                            bgcolor: isDark
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'default',
                          }}
                        >
                          <Box sx={{ minWidth: 32, display: 'flex', alignItems: 'center', mr: 1 }}>
                            {getContainerIcon(container.type)}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: 13,
                              fontWeight: 400,
                              color: 'text.primary',
                              flex: 1,
                            }}
                          >
                            {container.type === 'box' ? 'Box' : container.type === 'tote' ? 'Tote' : 'Drink'} {container.id}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{
                              p: 0.5,
                              ml: 0.5,
                              color: 'text.secondary',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.04)',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmPrintIndividualContainer(container.id, container.type);
                            }}
                          >
                            <Box
                              component="img"
                              src={PrintIcon}
                              alt="Print"
                              sx={{
                                width: 14,
                                height: 14,
                              }}
                            />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              </Box>

              {/* Photo Section - Right Side */}
              <Box sx={{ 
                flex: 1,
                height: { xs: 'auto', lg: '100%' },
                p: 2, 
                borderRadius: 1.5, 
                border: '1px solid', 
                borderColor: 'divider',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {activeTab === 'completed' && orderPhotosData ? (
                  <>
                    <Typography variant="subtitle2" fontWeight={500} fontSize={14} mb={1}>
                      Order Photos
                    </Typography>
                    <Typography variant="caption" fontSize={11} color="text.secondary" mb={1.5} display="block">
                      Minimum {allContainers.length} photos required, Maximum {allContainers.length * 2} photos allowed
                    </Typography>
                    
                    {/* Photo Grid - Same as pending */}
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      {orderPhotosLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <Grid container spacing={1} mb={1.5}>
                          {Array.from({ length: allContainers.length * 2 }).map((_, index) => {
                            const photo = completedOrderImages[index];
                            return (
                              <Grid size={{ xs: 4 }} key={index}>
                                {photo ? (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: { xs: 100, sm: 120 },
                                      position: 'relative',
                                      borderRadius: 0.75,
                                      overflow: 'hidden',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={photo}
                                      alt={`Order Photo ${index + 1}`}
                                      sx={{
                                        width: '100%',
                                        height: { xs: 100, sm: 120 },
                                        objectFit: 'contain',
                                        bgcolor: 'divider',
                                        p: 0.5,
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.src = '/src/assets/Default-Product-Image.jpg';
                                      }}
                                    />
                                    {!selectedOrder?.invoiced && (
                                      <IconButton
                                        size="small"
                                        sx={{
                                          position: 'absolute',
                                          top: 4,
                                          right: 4,
                                          bgcolor: 'rgba(244, 67, 54, 0.9)',
                                          color: 'white',
                                          p: 0.25,
                                          width: 24,
                                          height: 24,
                                          '&:hover': {
                                            bgcolor: 'rgba(244, 67, 54, 1)',
                                          },
                                        }}
                                        onClick={() => handleDeletePhoto(photo)}
                                        disabled={deletePhotoLoading}
                                      >
                                        {deletePhotoLoading ? (
                                          <CircularProgress size={14} sx={{ color: 'white' }} />
                                        ) : (
                                          <Close fontSize="small" sx={{ fontSize: 14 }} />
                                        )}
                                      </IconButton>
                                    )}
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: { xs: 100, sm: 120 },
                                      border: '2px dashed',
                                      borderColor: 'divider',
                                      borderRadius: 0.75,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: !selectedOrder?.invoiced ? 'pointer' : 'default',
                                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                      opacity: !selectedOrder?.invoiced ? 1 : 0.5,
                                      '&:hover': !selectedOrder?.invoiced ? {
                                        borderColor: 'primary.main',
                                        bgcolor: isDark ? 'rgba(60, 119, 149, 0.1)' : 'rgba(60, 119, 149, 0.05)',
                                      } : {},
                                    }}
                                    onClick={!selectedOrder?.invoiced ? handleOpenCamera : undefined}
                                  >
                                    <Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 18, height: 18, mb: 0.5, opacity: 0.6 }} />
                                    <Typography variant="caption" fontSize={9} color="text.secondary">
                                      {!selectedOrder?.invoiced ? 'Tap to capture' : 'No photos'}
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Box>
                    
                    {/* Progress Bar */}
                    <Box mb={1} sx={{ flexShrink: 0 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(completedOrderImages.length / (allContainers.length * 2)) * 100}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Typography variant="caption" fontSize={10} color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                        {completedOrderImages.length} / {allContainers.length * 2} photos
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2" fontWeight={500} fontSize={14} mb={1}>
                      Order Photos
                    </Typography>
                    <Typography variant="caption" fontSize={11} color="text.secondary" mb={1.5} display="block">
                      Minimum {allContainers.length} photos required, Maximum {allContainers.length * 2} photos allowed
                    </Typography>
                    
                    {/* Photo Grid - 3 images per row */}
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      <Grid container spacing={1} mb={1.5}>
                        {Array.from({ length: allContainers.length * 2 }).map((_, index) => {
                          const photo = orderImages[index];
                          return (
                            <Grid size={{ xs: 4 }} key={index}>
                              {photo ? (
                            <Box
                              sx={{
                                width: '100%',
                                height: { xs: 100, sm: 120 },
                                position: 'relative',
                                borderRadius: 0.75,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Box
                                component="img"
                                src={photo}
                                alt={`Order Photo ${index + 1}`}
                                sx={{
                                  width: '100%',
                                  height: { xs: 100, sm: 120 },
                                  objectFit: 'contain',
                                  bgcolor: 'divider',
                                  p: 0.5,
                                }}
                              />
                              {isEditingAllowed && (
                                <IconButton
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    p: 0.25,
                                    width: 20,
                                    height: 20,
                                  }}
                                  onClick={() => removeCapturedImage(index)}
                                >
                                  <Close fontSize="small" sx={{ fontSize: 12 }} />
                                </IconButton>
                              )}
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: { xs: 100, sm: 120 },
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 0.75,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isEditingAllowed ? 'pointer' : 'default',
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                opacity: isEditingAllowed ? 1 : 0.5,
                                '&:hover': isEditingAllowed ? {
                                  borderColor: 'primary.main',
                                  bgcolor: isDark ? 'rgba(60, 119, 149, 0.1)' : 'rgba(60, 119, 149, 0.05)',
                                } : {},
                              }}
                              onClick={isEditingAllowed ? handleOpenCamera : undefined}
                            >
                              <Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 18, height: 18, mb: 0.5, opacity: 0.6 }} />
                              <Typography variant="caption" fontSize={9} color="text.secondary">
                                {isEditingAllowed ? 'Tap to capture' : 'No photos'}
                              </Typography>
                            </Box>
                              )}
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                      
                      {/* Progress Bar */}
                      <Box mb={1} sx={{ flexShrink: 0 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(orderImages.length / (allContainers.length * 2)) * 100}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Typography variant="caption" fontSize={10} color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                          {orderImages.length} / {allContainers.length * 2} photos
                        </Typography>
                      </Box>
                    </>
                  )}
              </Box>
            </Box>

            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={1.5} mt={2}>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ width: { xs: '100%', lg: 'auto' } }}>
                <CustomButton
                  buttonType="primary"
                  onClick={() => setPrintLabelsModalOpen(true)}
                  icon={<Box component="img" src={PrintIcon} alt="Print" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />}
                  iconPosition="left"
                  size="small"
                  fullWidth={isMobile}
                  sx={{ mt: 0, width: { xs: '100%', sm: 'auto' } }}
                >
                  Print All Labels
                </CustomButton>
                <CustomButton
                  buttonType="primary"
                  onClick={handlePrintPackingList}
                  icon={<Box component="img" src={PrintIcon} alt="Print" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />}
                  iconPosition="left"
                  size="small"
                  fullWidth={isMobile}
                  loading={printLabelsLoading}
                  disabled={printLabelsLoading}
                  sx={{ mt: 0, width: { xs: '100%', sm: 'auto' } }}
                >
                  Print Packing List
                </CustomButton>
              </Box>
              {isEditingAllowed && !(activeTab === 'completed') && (
                <CustomButton
                  buttonType="cancel"
                  appearance="outlined"
                  onClick={handleConfirmReadyForDelivery}
                  size="small"
                  fullWidth={isMobile}
                  disabled={!checkOrderImagesValid}
                  sx={{ mt: 0, width: { xs: '100%', lg: 'auto' } }}
                >
                  Ready For Delivery
                </CustomButton>
              )}
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Camera Modal */}
      <CommonModal
        open={cameraModalOpen}
        onClose={handleCloseCamera}
        title={selectedOrder ? `Capture Photos - Order #${selectedOrder.orderNumber}` : "Capture Photos"}
        size="xl"
      >
        <Box sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ flex: 1, display: 'flex', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
            {/* Left Side - Camera */}
            <Box sx={{ 
              flex: '1 1 50%', 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1.5,
              minWidth: 0,
            }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'black',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    maxHeight: '100%'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
              <Box display="flex" justifyContent="center" gap={1.5} sx={{ flexShrink: 0 }}>
                <CustomButton
                  buttonType="primary"
                  onClick={capturePhoto}
                  icon={<Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />}
                  iconPosition="left"
                  size="medium"
                  fullWidth={false}
                  sx={{ 
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  Capture Photo
                </CustomButton>
              </Box>
            </Box>

            {/* Right Side - Preview Images */}
            <Box sx={{ 
              flex: '1 1 50%', 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1.5,
              minWidth: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 1.5,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={500} fontSize={14}>
                    {activeTab === 'completed' ? 'Photos' : 'Captured Photos'}
                  </Typography>
                  {activeTab === 'completed' && selectedOrder && (
                    <Typography variant="caption" fontSize={10} color="text.secondary" display="block" mt={0.25}>
                      {(() => {
                        const totalContainers = allContainers.length;
                        const currentTotalPhotos = completedOrderImages.length;
                        const maxTotalPhotos = totalContainers * 2;
                        const minTotalPhotos = totalContainers;
                        const maxCanAdd = maxTotalPhotos - currentTotalPhotos;
                        const minNeeded = Math.max(0, minTotalPhotos - currentTotalPhotos);
                        return minNeeded > 0 
                          ? `Min ${minNeeded} required, Max ${maxCanAdd} can add`
                          : `Max ${maxCanAdd} can add`;
                      })()}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" fontSize={11} color="text.secondary">
                  {activeTab === 'completed' 
                    ? `${completedOrderImages.length} existing + ${newCapturedImages.length} new = ${capturedImages.length} / ${allContainers.length * 2}`
                    : `${capturedImages.length} / ${allContainers.length * 2} photos`}
                </Typography>
              </Box>
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                minHeight: 0,
              }}>
                {capturedImages.length > 0 ? (
                  <Grid container spacing={1}>
                    {capturedImages.map((image, index) => {
                      const isExistingPhoto = activeTab === 'completed' && index < completedOrderImages.length;
                      return (
                        <Grid size={{ xs: 6, sm: 4 }} key={index}>
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              component="img"
                              src={image}
                              alt={isExistingPhoto ? `Existing Photo ${index + 1}` : `New Photo ${index + 1}`}
                              sx={{ 
                                width: '100%', 
                                height: { xs: 100, sm: 120 },
                                objectFit: 'contain', 
                                borderRadius: 1, 
                                bgcolor: 'divider', 
                                p: 0.5,
                                border: '1px solid',
                                borderColor: isExistingPhoto ? 'success.main' : 'divider',
                                opacity: isExistingPhoto ? 0.8 : 1,
                              }}
                            />
                            {isExistingPhoto && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  left: 4,
                                  px: 0.5,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  bgcolor: 'success.main',
                                  color: 'white',
                                }}
                              >
                                <Typography variant="caption" fontSize={8} fontWeight={500}>
                                  Existing
                                </Typography>
                              </Box>
                            )}
                            {!isExistingPhoto && (
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  bgcolor: 'rgba(244, 67, 54, 0.9)',
                                  color: 'white',
                                  p: 0.5,
                                  width: 24,
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: 'rgba(244, 67, 54, 1)',
                                  },
                                }}
                                size="small"
                                onClick={() => removeCapturedImage(index)}
                              >
                                <Close fontSize="small" sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}>
                    <Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 48, height: 48, mb: 1, opacity: 0.3 }} />
                    <Typography variant="body2" fontSize={12} textAlign="center">
                      No photos captured yet
                    </Typography>
                    <Typography variant="caption" fontSize={10} textAlign="center" mt={0.5}>
                      Click "Capture Photo" to start
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Bottom Section - Notes and Actions */}
          <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Notes (Optional)"
              multiline
              rows={2}
              value={cameraNotes}
              onChange={(e) => setCameraNotes(e.target.value)}
              fullWidth
              size="small"
            />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" fontSize={11} color="text.secondary">
                {activeTab === 'completed' 
                  ? 'Photos will be uploaded immediately' 
                  : 'Photos will be uploaded when you click "Ready For Delivery"'}
              </Typography>
              <Box display="flex" gap={1.5}>
                <CustomButton
                  buttonType="cancel"
                  appearance="outlined"
                  onClick={handleCloseCamera}
                  size="small"
                  fullWidth={false}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  buttonType="primary"
                  onClick={handleSavePhotos}
                  disabled={
                    capturePhotosLoading ||
                    (activeTab === 'completed'
                      ? newCapturedImages.length === 0
                      : capturedImages.length === 0) || 
                    (activeTab === 'completed' && selectedOrder
                      ? (() => {
                          const totalContainers = allContainers.length;
                          const currentTotalPhotos = completedOrderImages.length;
                          const maxTotalPhotos = totalContainers * 2;
                          const maxCanAdd = maxTotalPhotos - currentTotalPhotos; // Based on containers
                          // Disable if no new photos, trying to add more than allowed, or at maximum
                          // Validation is based on container limit only
                          return newCapturedImages.length === 0 || newCapturedImages.length > maxCanAdd || maxCanAdd === 0;
                        })()
                      : selectedOrder 
                        ? capturedImages.length > allContainers.length * 2 
                        : false)
                  }
                  loading={capturePhotosLoading}
                  size="small"
                  fullWidth={false}
                >
                  {activeTab === 'completed' ? 'Upload Photos' : 'Save Photos'}
                </CustomButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </CommonModal>

      {/* Print Labels Modal */}
      <CommonModal
        open={printLabelsModalOpen}
        onClose={() => {
          if (!printLabelsLoading) {
            setPrintLabelsModalOpen(false);
            setPrintLabelsForm({ size: '4x6', boxIds: [] });
          }
        }}
        title="Print Labels"
        size="md"
        isCloseIcon={false}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel>Label Size</InputLabel>
            <Select
              value={printLabelsForm.size}
              onChange={(e) =>
                setPrintLabelsForm({
                  ...printLabelsForm,
                  size: e.target.value as any,
                })
              }
              label="Label Size"
            >
              <MenuItem value="4x3">4x3</MenuItem>
              <MenuItem value="4x6">4x6</MenuItem>
              <MenuItem value="3x6">3x6</MenuItem>
              <MenuItem value="3x2">3x2</MenuItem>
              <MenuItem value="4x4">4x4</MenuItem>
              <MenuItem value="2x2">2x2</MenuItem>
              <MenuItem value="2x3">2x3</MenuItem>
            </Select>
          </FormControl>
         
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                setPrintLabelsModalOpen(false);
                setPrintLabelsForm({ size: '4x6', boxIds: [] });
              }}
              fullWidth={false}
              disabled={printLabelsLoading}
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton buttonType="primary" onClick={handleConfirmPrintLabels} fullWidth={false} loading={printLabelsLoading} disabled={printLabelsLoading} sx={{ mt: 0 }}>
              Print Labels
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Add Container Modal */}
      <CommonModal
        open={addContainerModalOpen}
        onClose={() => {
          if (!addContainerLoading) {
            setAddContainerModalOpen(false);
            setAddContainerForm({
              containerType: '',
              sourceContainer: '',
              items: [],
            });
          }
        }}
        title="Add Container"
        size="lg"
      >
        {selectedOrder && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Container Type</InputLabel>
              <Select
                value={addContainerForm.containerType}
                onChange={(e) =>
                  setAddContainerForm({
                    ...addContainerForm,
                    containerType: e.target.value as 'box' | 'tote' | 'drink',
                    items: [], // Reset items when container type changes
                  })
                }
                label="Container Type"
              >
                <MenuItem value="box">Box</MenuItem>
                <MenuItem value="tote">Tote</MenuItem>
                <MenuItem value="drink">Drink</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Source Container</InputLabel>
              <Select
                value={addContainerForm.sourceContainer}
                onChange={async (e) => {
                  const value = e.target.value;
                  setAddContainerForm({
                    ...addContainerForm,
                    sourceContainer: value,
                    items: [], // Reset items when source changes
                  });
                  // Fetch items from source container
                  const match = value.match(/(Box|Tote|Drink)-(\d+)/i);
                  if (match) {
                    const containerId = Number(match[2]);
                    await fetchBoxItems(containerId);
                  }
                }}
                label="Source Container"
              >
                {allContainers.map((container) => {
                  const containerTypeUpper = container.type.toUpperCase();
                  const value = containerTypeUpper === 'BOX' ? `Box-${container.id}` :
                    containerTypeUpper === 'TOTE' ? `Tote-${container.id}` :
                      `Drink-${container.id}`;
                  return (
                    <MenuItem key={`${container.type}-${container.id}`} value={value}>
                      {container.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {addContainerForm.sourceContainer && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={500} fontSize={12} mb={1}>
                  Select Items to Move
                </Typography>
                {boxItemsLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : boxItems.length > 0 ? (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {boxItems.map((item) => {
                    const selectedItem = addContainerForm.items.find(i => i.itemNumber === item.itemNumber);
                    const selectedQty = selectedItem?.qty || 0;
                    return (
                      <Card key={item.itemNumber} sx={{ mb: 1, p: 1 }}>
                        <Box display="flex" gap={1} alignItems="center">
                          <Box
                            component="img"
                            src={item.masterImage || item.distributorImage || '/src/assets/Default-Product-Image.jpg'}
                            alt={item.description}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'contain',
                              borderRadius: 0.75,
                              bgcolor: 'divider',
                              p: 0.5,
                            }}
                            onError={(e) => {
                              e.currentTarget.src = '/src/assets/Default-Product-Image.jpg';
                            }}
                          />
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontSize={12} fontWeight={400}>
                              {item.description}
                            </Typography>
                            <Typography variant="caption" fontSize={11} color="text.secondary">
                              Available: {item.qty}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (selectedQty > 0) {
                                  const newItems = addContainerForm.items.map(i =>
                                    i.itemNumber === item.itemNumber
                                      ? { ...i, qty: i.qty - 1 }
                                      : i
                                  ).filter(i => i.qty > 0);
                                  setAddContainerForm({
                                    ...addContainerForm,
                                    items: newItems,
                                  });
                                }
                              }}
                              disabled={selectedQty === 0}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                width: 28,
                                height: 28,
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&:disabled': { bgcolor: 'action.disabledBackground' },
                              }}
                            >
                              <Remove fontSize="small" sx={{ fontSize: 14 }} />
                            </IconButton>
                            <TextField
                              type="number"
                              value={selectedQty}
                              onChange={(e) => {
                                const qty = Math.max(0, Math.min(item.qty, Number(e.target.value)));
                                if (qty === 0) {
                                  const newItems = addContainerForm.items.filter(i => i.itemNumber !== item.itemNumber);
                                  setAddContainerForm({
                                    ...addContainerForm,
                                    items: newItems,
                                  });
                                } else {
                                  const existingItem = addContainerForm.items.find(i => i.itemNumber === item.itemNumber);
                                  const newItems = existingItem
                                    ? addContainerForm.items.map(i =>
                                        i.itemNumber === item.itemNumber ? { ...i, qty } : i
                                      )
                                    : [...addContainerForm.items, { itemNumber: item.itemNumber, qty }];
                                  setAddContainerForm({
                                    ...addContainerForm,
                                    items: newItems,
                                  });
                                }
                              }}
                              sx={{ width: 60, textAlign: 'center' }}
                              inputProps={{
                                style: { textAlign: 'center', fontSize: 12 },
                                min: 0,
                                max: item.qty,
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (selectedQty < item.qty) {
                                  const existingItem = addContainerForm.items.find(i => i.itemNumber === item.itemNumber);
                                  const newItems = existingItem
                                    ? addContainerForm.items.map(i =>
                                        i.itemNumber === item.itemNumber ? { ...i, qty: i.qty + 1 } : i
                                      )
                                    : [...addContainerForm.items, { itemNumber: item.itemNumber, qty: 1 }];
                                  setAddContainerForm({
                                    ...addContainerForm,
                                    items: newItems,
                                  });
                                }
                              }}
                              disabled={selectedQty >= item.qty}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                width: 28,
                                height: 28,
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&:disabled': { bgcolor: 'action.disabledBackground' },
                              }}
                            >
                              <Add fontSize="small" sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
                ) : (
                  <Typography variant="body2" fontSize={12} color="text.secondary" textAlign="center" p={2}>
                    No items available in source container
                  </Typography>
                )}
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <CustomButton
                buttonType="cancel"
                appearance="outlined"
                onClick={() => {
                  setAddContainerModalOpen(false);
                  setAddContainerForm({
                    containerType: '',
                    sourceContainer: '',
                    items: [],
                  });
                }}
                disabled={addContainerLoading}
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                buttonType="primary"
                onClick={handleCreateContainer}
                loading={addContainerLoading}
                disabled={addContainerLoading || !addContainerForm.containerType || !addContainerForm.sourceContainer || addContainerForm.items.length === 0}
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Create Container
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Individual Container Print Modal */}
      <CommonModal
        open={individualPrintModalOpen}
        onClose={() => {
          if (!printLabelsLoading) {
            setIndividualPrintModalOpen(false);
            setIndividualPrintData(null);
          }
        }}
        title={individualPrintData ? `Print Label - ${individualPrintData.containerType === 'box' ? 'Box' : individualPrintData.containerType === 'tote' ? 'Tote' : 'Drink'} ${individualPrintData.containerId}` : 'Print Label'}
        size="sm"
      >
        {individualPrintData && (
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Label Size</InputLabel>
              <Select
                value={individualPrintData.size}
                onChange={(e) =>
                  setIndividualPrintData({
                    ...individualPrintData,
                    size: e.target.value as '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4',
                  })
                }
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
            <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
              <CustomButton
                buttonType="cancel"
                appearance="outlined"
                onClick={() => {
                  setIndividualPrintModalOpen(false);
                  setIndividualPrintData(null);
                }}
                fullWidth={false}
                disabled={printLabelsLoading}
                sx={{ mt: 0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                buttonType="primary"
                onClick={() => {
                  if (individualPrintData) {
                    handlePrintIndividualContainer(
                      individualPrintData.containerId,
                      individualPrintData.containerType,
                      individualPrintData.size as LabelSize
                    );
                  }
                }}
                fullWidth={false}
                loading={printLabelsLoading}
                disabled={printLabelsLoading}
                sx={{ mt: 0 }}
              >
                Print Label
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Confirmation Modal */}
      <CommonModal
        open={confirmationModalOpen}
        onClose={() => {
          if (!editItemLoading && !printLabelsLoading && !readyForDeliveryLoading) {
            setConfirmationModalOpen(false);
            setConfirmationData(null);
          }
        }}
        title={confirmationData?.title || 'Confirm Action'}
        size="sm"
        isCloseIcon={false}
      >
        <Box>
          <Typography variant="body2" fontSize={12} color="text.primary" mb={1.5}>
            {confirmationData?.message || 'Are you sure you want to proceed?'}
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={1} mt={1.5}>
            <CustomButton
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                if (!editItemLoading && !printLabelsLoading && !readyForDeliveryLoading) {
                  setConfirmationModalOpen(false);
                  setConfirmationData(null);
                }
              }}
              size="small"
              fullWidth={false}
              disabled={editItemLoading || printLabelsLoading || readyForDeliveryLoading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              buttonType="primary"
              onClick={() => {
                if (confirmationData?.onConfirm) {
                  confirmationData.onConfirm();
                }
              }}
              size="small"
              fullWidth={false}
              loading={editItemLoading || printLabelsLoading || readyForDeliveryLoading}
              disabled={editItemLoading || printLabelsLoading || readyForDeliveryLoading}
            >
              Confirm
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Report Options Modal */}
      <CommonModal
        open={reportModalOpen}
        onClose={() => {
          if (!reportLoading) {
            setReportModalOpen(false);
            setReportType(null);
          }
        }}
        title={reportType === 'summary' ? 'Generate Summary Report' : 'Generate Detail Report'}
        size="sm"
      >
        <Box>
          {reportType === 'summary' ? (
            <>
              <Typography variant="body2" fontSize={12} color="text.primary" mb={2}>
                This will generate a summary report of all completed orders with order details, picker information, and invoice status.
              </Typography>
              <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                <CustomButton
                  buttonType="cancel"
                  appearance="outlined"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportType(null);
                  }}
                  size="small"
                  fullWidth={false}
                  disabled={reportLoading}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  buttonType="primary"
                  onClick={generateSummaryReport}
                  size="small"
                  fullWidth={false}
                  loading={reportLoading}
                  disabled={reportLoading}
                >
                  Generate Report
                </CustomButton>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" fontSize={12} color="text.primary" mb={2}>
                This will generate a detail report for all completed orders ({orders.length} order{orders.length !== 1 ? 's' : ''}) with box-wise items and invoice status.
              </Typography>
              <Box display="flex" flexDirection={{ md: 'column', lg: 'row' }} justifyContent={{ md: 'center', lg: 'flex-start' }} gap={1.5} my={2}>
                <CustomButton
                  buttonType="primary"
                  onClick={() => generateDetailReport(false)}
                  size="small"
                  fullWidth={false}
                  loading={reportLoading}
                  disabled={reportLoading}
                >
                  Generate Report (Without Photos)
                </CustomButton>
                <CustomButton
                  buttonType="primary"
                  onClick={() => generateDetailReport(true)}
                  size="small"
                  fullWidth={false}
                  loading={reportLoading}
                  disabled={reportLoading}
                >
                  Generate Report (With Photos)
                </CustomButton>
              </Box>
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <CustomButton
                  buttonType="cancel"
                  appearance="outlined"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportType(null);
                  }}
                  size="small"
                  fullWidth={false}
                  disabled={reportLoading}
                >
                  Cancel
                </CustomButton>
              </Box>
            </>
          )}
        </Box>
      </CommonModal>
    </Box>
  );
};

export default OrderChecker;
