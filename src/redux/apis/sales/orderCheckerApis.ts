import axiosInstance from "../../../config/axios";

// Types
export interface Order {
  orderNumber: number;
  route: number;
  stop: number;
  customerName: string;
  time: string;
  box: number[];
  tote: number[];
  drink: number[];
  startedAt: string;
  completedAt: string;
  invoiced: boolean;
  pickerName: string;
}

export interface BoxItem {
  orderNumber: number;
  itemNumber: number;
  qty: number;
  isSubsitute: boolean;
  description: string;
  location: string;
  section: string;
  pack: number;
  caseCount: number;
  uom: string;
  inventoryOnHand: number;
  masterImage: string;
  isDistributorImageShow: boolean;
  distributorImage: string | null;
  upcList: Array<{ UPC_Number: string }>;
}

export interface ContainerItems {
  boxId: number;
  boxType: 'box' | 'tote' | 'drink';
  items: BoxItem[];
}

export interface OrderItemsResponse {
  [key: string]: ContainerItems;
}

// API returns a flat array of items with boxId and boxType
export interface OrderItemWithContainer extends BoxItem {
  boxId: number;
  boxType: 'box' | 'tote' | 'drink';
}

export interface MoveItemsRequest {
  sourceBoxId: number;
  destinationBoxId: number;
  itemNumber: number;
  qty: number;
}

export interface UpdateItemQtyRequest {
  orderNumber: number;
  itemNumber: number;
  boxId: number;
  qty: number;
}

export interface CreateContainerRequest {
  orderNumber: number;
  containerType: "box" | "tote" | "drink";
  sourceBoxId: number;
  items: Array<{
    itemNumber: number;
    qty: number;
  }>;
}

export interface PrintLabelsRequest {
  orderNumber: number;
  size: "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "A4";
  boxIds?: number[];
}

// Photo-related types
export interface OrderPhotosResponse {
  success: boolean;
  orderNumber: number;
  photos: string[];
  totalPhotos: number;
}

export interface DeleteBoxPhotoRequest {
  photoUrl: string;
}

// API Functions

// 1. Get Order - Get Pending Orders
export const getOrder = async (): Promise<{ data: Order[] }> => {
  return axiosInstance.get('/checker/getOrder');
};

// 1a. Get Completed Orders
export const getCompleteCheckerOrder = async (): Promise<{ data: Order[] }> => {
  return axiosInstance.get('/checker/getCompleteCheckerOrder');
};

// 2. Get Box Item - Get Items in a Box
export const getBoxItem = async (boxId: number): Promise<{ data: BoxItem[] }> => {
  return axiosInstance.get(`/checker/getBoxItem/${boxId}`);
};

// 2a. Get Order Items - Get All Items for an Order (returns flat array)
export const getOrderItems = async (orderNumber: number): Promise<{ data: OrderItemWithContainer[] }> => {
  return axiosInstance.get(`/checker/getOrderItems/${orderNumber}`);
};

// 3. Move Items to Box
export const moveItemsToBox = async (data: MoveItemsRequest) => {
  return axiosInstance.post('/checker/moveItemsToBox', data);
};

// 4. Update Item Quantity
export const updateItemQty = async (data: UpdateItemQtyRequest) => {
  return axiosInstance.post('/checker/updateItemQty', data);
};

// 5. Create Container and Move Items
export const createContainerAndMoveItems = async (data: CreateContainerRequest) => {
  return axiosInstance.post('/checker/createContainerAndMoveItems', data);
};

// 6. Ready for Delivery
export const readyForDelivery = async (orderNumber: number) => {
  return axiosInstance.post(`/checker/readyForDelivery/${orderNumber}`);
};

// 7. Capture Photos (Order Level - distributes across containers)
export const capturePhotos = async (orderNumber: number, formData: FormData) => {
  return axiosInstance.post(`/checker/capturePhotos/${orderNumber}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 8. Print Labels
export const printLabels = async (data: PrintLabelsRequest) => {
  return axiosInstance.post('/checker/printLabels', data);
};

// 9. Test Labels
export const testLabels = async (size?: string) => {
  const url = size ? `/checker/testLabels?size=${size}` : '/checker/testLabels';
  return axiosInstance.get(url);
};

// 10. Get Order Photos
export const getOrderPhotos = async (orderNumber: number): Promise<{ data: OrderPhotosResponse }> => {
  return axiosInstance.get(`/checker/getOrderPhotos/${orderNumber}`);
};

// 11. Update Box Photos
export const updateBoxPhotos = async (orderNumber: number, formData: FormData) => {
  return axiosInstance.post(`/checker/updateBoxPhotos/${orderNumber}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 12. Delete Box Photo
export const deleteBoxPhoto = async (orderNumber: number, data: DeleteBoxPhotoRequest) => {
  return axiosInstance.post(`/checker/deleteBoxPhoto/${orderNumber}`, data);
};

