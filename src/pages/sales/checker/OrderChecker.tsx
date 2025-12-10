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
  getBoxItem,
  getOrderItems,
  moveItemsToBox,
  updateItemQty,
  readyForDelivery,
  capturePhotos,
  printLabels,
  createContainerAndMoveItems,
  type Order,
  type BoxItem,
  type OrderItemWithContainer,
} from '../../../redux/apis/sales/orderCheckerApis';

const OrderChecker = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
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
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  // const [selectedContainer, setSelectedContainer] = useState<{ id: number; type: 'box' | 'tote' | 'drink' } | null>(null);
  const [orderImages, setOrderImages] = useState<string[]>([]);

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
    return orderImages.length >= totalContainers && orderImages.length <= totalContainers * 2;
  }, [selectedOrder, allContainers, orderImages]);

  // Get all items from all containers (items already have boxId and boxType)
  const getAllItemsFromOrder = useMemo(() => {
    return allOrderItems.map((item) => ({
      ...item,
      containerId: item.boxId,
      containerType: item.boxType,
    }));
  }, [allOrderItems]);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);


  // Auto-select first order when orders are loaded
  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      const firstOrder = orders[0];
      handleOrderSelect(firstOrder);
    }
  }, [orders]);

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
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response: any = await getOrder();
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
          sourceBoxId: selectedBoxId!,
          destinationBoxId: destId,
          itemNumber: editItemForm.item.itemNumber,
          qty: editItemForm.item.qty, // Use original quantity for move
        });
        toast.success('Item moved successfully');
      } else {
        if (editItemForm.qty <= 0) {
          toast.error('Quantity must be greater than 0');
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
      }
      setEditItemModalOpen(false);
      setConfirmationModalOpen(false);
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
      if (editItemForm.qty <= 0) {
        toast.error('Quantity must be greater than 0');
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
      const payload: any = {
        orderNumber: selectedOrder.orderNumber,
        size: printLabelsForm.size,
      };
      if (printLabelsForm.boxIds.length > 0) {
        payload.boxIds = printLabelsForm.boxIds;
      }
      const response: any = await printLabels(payload);
      const pdfUrls = response?.data?.data?.pdfUrls || [];
      if (pdfUrls.length > 0) {
        pdfUrls.forEach((url: string) => {
          window.open(url, '_blank');
        });
        toast.success('Labels generated successfully');
      }
      setPrintLabelsModalOpen(false);
      setConfirmationModalOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to print labels');
    } finally {
      setPrintLabelsLoading(false);
    }
  };

  const handlePrintIndividualContainer = async (containerId: number, containerType: 'box' | 'tote' | 'drink') => {
    if (!selectedOrder) return;
    try {
      setPrintLabelsLoading(true);
      const payload: any = {
        orderNumber: selectedOrder.orderNumber,
        size: '4x6', // Default size for individual prints
        boxIds: [containerId], // Pass the specific container ID
      };
      const response: any = await printLabels(payload);
      const pdfUrls = response?.data?.data?.pdfUrls || [];
      if (pdfUrls.length > 0) {
        pdfUrls.forEach((url: string) => {
          window.open(url, '_blank');
        });
        const containerName = containerType === 'box' ? `Box ${containerId}` :
          containerType === 'tote' ? `Tote ${containerId}` :
            `Drink ${containerId}`;
        toast.success(`Label generated for ${containerName}`);
      }
      setConfirmationModalOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to print label');
    } finally {
      setPrintLabelsLoading(false);
    }
  };

  const handleConfirmPrintIndividualContainer = (containerId: number, containerType: 'box' | 'tote' | 'drink') => {
    if (!selectedOrder) return;
    const containerName = containerType === 'box' ? `Box ${containerId}` :
      containerType === 'tote' ? `Tote ${containerId}` :
        `Drink ${containerId}`;
    setConfirmationData({
      title: 'Confirm Print Label',
      message: `Are you sure you want to print label for ${containerName}?`,
      onConfirm: () => handlePrintIndividualContainer(containerId, containerType),
    });
    setConfirmationModalOpen(true);
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
      await fetchOrders();
      
      // Update selected order and select the newly created container
      if (selectedOrder) {
        const response: any = await getOrder();
        const updatedOrders = response?.data?.data || [];
        const updatedOrder = updatedOrders.find((o: Order) => o.orderNumber === selectedOrder.orderNumber);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
          // Select the newly created container
          setSelectedBoxId(newContainerId);
          setSelectedContainerType(containerType);
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
        const maxImages = totalContainers * 2;
        if (orderImages.length < maxImages) {
          setOrderImages([...orderImages, imageData]);
          setCapturedImages([...orderImages, imageData]);
          toast.success('Photo captured');
        } else {
          toast.error(`Maximum ${maxImages} photos allowed (2x total containers)`);
        }
      }
    }
  };

  const removeCapturedImage = (index: number) => {
    const newImages = orderImages.filter((_, i) => i !== index);
    setOrderImages(newImages);
    setCapturedImages(newImages);
  };

  const handleOpenCamera = () => {
    setCameraModalOpen(true);
    setCapturedImages(orderImages);
    setCameraNotes('');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraModalOpen(false);
    setCapturedImages(orderImages);
    setCameraNotes('');
  };

  // Save photos locally without uploading (upload happens on Ready For Delivery)
  const handleSavePhotos = () => {
    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    const totalContainers = allContainers.length;
    if (capturedImages.length > totalContainers * 2) {
      toast.error(`Maximum ${totalContainers * 2} photos allowed (2x total containers)`);
      return;
    }

    // Save photos locally to orderImages state
    setOrderImages(capturedImages);
    toast.success('Photos saved locally');
    handleCloseCamera();
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
    return `${hours} h ${minutes} m`;
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
        <Typography variant="h6" fontWeight={500} fontSize={{ xs: 16, sm: 18 }} color="text.primary">
          E-Checker
        </Typography>
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
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                        overflow: 'hidden',
                        boxShadow: isSelected ? 4 : 2,
                        bgcolor: isSelected 
                          ? (isDark ? 'rgba(60, 119, 149, 0.1)' : 'rgba(60, 119, 149, 0.05)')
                          : 'background.paper',
                        '&:hover': {
                          boxShadow: 4,
                          borderColor: 'primary.main',
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
                              <Typography variant="body2" fontWeight={500} fontSize={12} color="text.primary">
                                Order #{order.orderNumber}
                              </Typography>
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

                            {isSelected && (
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
                               Bundle Creation
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
                {selectedOrder && !selectedOrder.invoiced && (
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
                                          fontWeight={700} 
                                          color="primary.main"
                                          sx={{
                                            letterSpacing: 0.5,
                                          }}
                                        >
                                          QTY: {item.qty}
                                        </Typography>
                                      </Box>
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
        title="Bundle Creation"
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

              {/* Order Level Photo Section - Right Side */}
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
                            cursor: 'pointer',
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: isDark ? 'rgba(60, 119, 149, 0.1)' : 'rgba(60, 119, 149, 0.05)',
                            },
                          }}
                          onClick={handleOpenCamera}
                        >
                          <Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 18, height: 18, mb: 0.5, opacity: 0.6 }} />
                          <Typography variant="caption" fontSize={9} color="text.secondary">
                            Tap to capture
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

                {/* <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <CustomButton
                    buttonType="primary"
                    onClick={handleOpenCamera}
                    icon={<Box component="img" src={CameraIcon} alt="Camera" sx={{ width: 16, height: 16 }} />}
                    iconPosition="left"
                    size="small"
                    fullWidth
                    disabled={orderImages.length >= allContainers.length * 2}
                  >
                    {orderImages.length === 0 ? 'Open Camera' : 'Add More Photos'}
                  </CustomButton>
                </Box> */}
              </Box>
            </Box>

            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={1.5} mt={2}>
              <CustomButton
                buttonType="primary"
                onClick={() => setPrintLabelsModalOpen(true)}
                icon={<Box component="img" src={PrintIcon} alt="Print" sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 1 }} />}
                iconPosition="left"
                size="small"
                fullWidth={isMobile}
                sx={{ mt: 0, width: { xs: '100%', lg: 'auto' } }}
              >
                Print All Labels
              </CustomButton>
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
                <Typography variant="subtitle2" fontWeight={500} fontSize={14}>
                  Captured Photos
                </Typography>
                <Typography variant="caption" fontSize={11} color="text.secondary">
                  {capturedImages.length} / {allContainers.length * 2} photos
                </Typography>
              </Box>
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                minHeight: 0,
              }}>
                {capturedImages.length > 0 ? (
                  <Grid container spacing={1}>
                    {capturedImages.map((image, index) => (
                      <Grid size={{ xs: 6, sm: 4 }} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={image}
                            alt={`Captured ${index + 1}`}
                            sx={{ 
                              width: '100%', 
                              height: { xs: 100, sm: 120 },
                              objectFit: 'contain', 
                              borderRadius: 1, 
                              bgcolor: 'divider', 
                              p: 0.5,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
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
                        </Box>
                      </Grid>
                    ))}
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
                Photos will be uploaded when you click "Ready For Delivery"
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
                  disabled={capturedImages.length === 0 || (selectedOrder ? capturedImages.length > allContainers.length * 2 : false)}
                  size="small"
                  fullWidth={false}
                >
                  Save Photos
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
              <MenuItem value="A4">A4</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" fontSize={10} color="text.secondary">
            Leave box IDs empty to print all boxes in the order
          </Typography>
          <TextField
            label="Box IDs (comma-separated, optional)"
            value={printLabelsForm.boxIds.join(', ')}
            onChange={(e) => {
              const boxIds = e.target.value
                .split(',')
                .map((id) => parseInt(id.trim()))
                .filter((id) => !isNaN(id));
              setPrintLabelsForm({ ...printLabelsForm, boxIds });
            }}
            fullWidth
            placeholder="e.g., 1, 2, 3"
          />
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
    </Box>
  );
};

export default OrderChecker;
