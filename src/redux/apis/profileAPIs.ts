// apis/retailer/profile.ts
import axiosInstance from "../../config/axios"; // adjust path as needed

export const getRetailerProfile = async () => {
  try {
    const response = await axiosInstance.get("/retailer/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const createRetailerDocuments = async (params: {
  customerNumber: number;
  attachments?: string[];
  salesTaxDoc?: string | null;
  CigTaxDoc?: string | null;
  licenseAttachments?: string[];
  feinDocument?: string | null;
}) => {
  try {
    const response = await axiosInstance.post('/retailer/retailer-documents', params);
    return response.data;
  } catch (error) {
    console.error("Error creating retailer documents:", error);
    throw error;
  }
};

export const updateRetailerDocuments = async (id: number, params: {
  customerNumber: number;
  attachments?: string[];
  salesTaxDoc?: string | null;
  CigTaxDoc?: string | null;
  licenseAttachments?: string[];
  feinDocument?: string | null;
}) => {
  try {
    const response = await axiosInstance.put(`/retailer/retailer-documents/${id}`, params);
    return response.data;
  } catch (error) {
    console.error("Error updating retailer documents:", error);
    throw error;
  }
};

export const uploadImages = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosInstance.post('/retailer/uploadImages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};