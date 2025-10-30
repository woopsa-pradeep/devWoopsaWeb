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
