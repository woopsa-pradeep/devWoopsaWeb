import axiosInstance from "../../../config/axios";

export const updateWarehouseSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateWarehouseSetting', data);
};

export const getWarehouseSetting = async () => {
    return axiosInstance.get('/distrubutor/warehouseSetting');
};


export const getHomeSetting = async () => {
    return axiosInstance.get('/distrubutor/homeSetting');
};

export const updateHomeSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateHomeSetting', data);
};

export const getProfile = async () => {
    return axiosInstance.get('/distrubutor/profile');
};
export const updateProfile = async (data: any) => {
  return axiosInstance.put("/distrubutor/distributorUpdate", data);
};


// New API functions for different settings tabs
export const updateSalesRepSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateSalesRepSetting', data);
};

export const updateItemGlobalSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateItemGlobalSetting', data);
};

export const updateRetailerSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateRetailerSetting', data);
};

export const updateWarehouseProfileSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateWarehouseProfileSetting', data);
};

export const uploadProfileImage = async (data: any) => {
    const formData = new FormData();
    formData.append('image', data);
    const response:any= await axiosInstance.post('/distrubutor/uploadWarehouseImage', formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return response?.data?.data;
};
export const setCustomerLimit = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/setCustomerLimit/${id}`, data);
};

export const createContactUs = async (data: any) => {
    return axiosInstance.post('/distrubutor/contact-us', data);
};

export const getAllContactUs = async () => {
    return axiosInstance.get('/distrubutor/contact-us');
};

export const updateContactUs = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/contact-us/${id}`, data);
};

export const deleteContactUs = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/contact-us/${id}`);
};

export const createEmailManagement = async (data: any) => {
    return axiosInstance.post('/distrubutor/email-configs', data);
};

export const getEmailManagement = async () => {
    const response:any = await axiosInstance.get('/distrubutor/email-configs');
    return response?.data?.data;
};

export const updateEmailManagement = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/email-configs/${id}`, data);
};


export const testEmailManagement = async (data: any) => {
    return axiosInstance.post('/distrubutor/email-configs/test', data);
};

export const createErpUser = async (data: any) => {
    return axiosInstance.post('/distrubutor/createErpUser', data);
};

export const updateErpUser = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/updateErpUser/${id}`, data);
};

export const getErpUsers = async () => {
    return axiosInstance.get('/distrubutor/erp-users');
};

export const getErpUser = async (id: string) => {
    return axiosInstance.get(`/distrubutor/erpuser/${id}`);
};

// inventory
export const getSalesCategories = async () => {
  return axiosInstance.get("/list/listOfSalesCategories");
};

export const updateSalesCategory = async (id: number | string, data: any) => {
  return axiosInstance.put(`/sales/updateSalesCategory/${id}`, data);
};

export const getItemGroups = async () => {
  const res: any = await axiosInstance.get(
    "/distrubutor/getInventoryItemGroups"
  );
  return res.data.data;
};

export const createItemGroup = async (data: {
  Item_GroupID: string;
  Item_GroupDescription: string;
}) => {
  return axiosInstance.post("/distrubutor/inventory-item-groups", data);
};

export const updateItemGroup = async (
  id: number | string,
  data: { Item_GroupDescription: string }
) => {
  return axiosInstance.put(`/distrubutor/inventory-item-groups/${id}`, data);
};

export const getBrands = async () => {
  const res: any = await axiosInstance.get("/distrubutor/getinventory-brands");
  return res.data.data;
};

export const createBrand = async (data: {
  Brand_Family: string;
  Brand_ReceivedStamped: boolean;
  Brand_PM_Status: string;
}) => {
  return axiosInstance.post("/distrubutor/inventory-brands", data);
};

export const updateBrand = async (
  id: number,
  data: {
    Brand_Family: string;
    Brand_ReceivedStamped: boolean;
    Brand_PM_Status: string;
  }
) => {
  return axiosInstance.put(`/distrubutor/inventory-brands/${id}`, data);
};

export const getPriceClasses = async () => {
  const res: any = await axiosInstance.get("/distrubutor/getPriceClass");
  return res.data.data.map((item: any) => ({
    ...item,
    Price_Class_ID: item.Price_Class,
  }));
};

// Update Price Class Category Groups
export const getSalesCategoryGroupsForPriceClass = async () => {
  const res = await axiosInstance.get<{
    success: boolean;
    data: {
      salesCategory: {
        Sales_Category: number;
        Category_Desc: string;
      }[];
    };
  }>("/list/listOfUpdatePriceClass");

  return res.data.data.salesCategory;
};

export const updatePriceClass = async (
  id: number | string,
  data: {
    Class_Desc?: string;
    Rebate_Amount?: number;
    SelectionVisible?: boolean;
    Allow_Price_Change?: boolean;
    Allow_Price_Change_Remote?: boolean;
    Sales_Category_Group?: string;
    Product_ExpDays?: number;
  }
) => {
  return axiosInstance.put(`/distrubutor/updatePriceClass/${id}`, data);
};

// Picklist Template APIs
export const getPicklistTemplate = async () => {
    const response: any = await axiosInstance.get('/distrubutor/picklists');
    return response?.data;
};

export const savePicklistTemplate = async (data: any) => {
    const response: any = await axiosInstance.post('/distrubutor/picklists', data);
    return response?.data;
};

export const updatePicklistTemplate = async (id: string, data: any) => {
    const response: any = await axiosInstance.put(`/distrubutor/picklists/${id}`, data);
    return response?.data;
};

// Mark picklist as printed (single order)
export const makePickListPrinted = async (orderNumber: string) => {
    const response: any = await axiosInstance.put(`/distrubutor/makePickListPrinted/${orderNumber}`);
    return response?.data;
};

// Mark bulk picklists as printed
export const makeBulkPickListPrinted = async (orderNumbers: (string | number)[]) => {
    const payload = { orderNumbers: orderNumbers.map((n) => Number(n)) };
    const response: any = await axiosInstance.put('/distrubutor/makeBulkPickListPrinted', payload);
    return response?.data;
};