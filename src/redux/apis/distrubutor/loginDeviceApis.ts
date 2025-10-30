import axiosInstance from '../../../config/axios';

export const fetchLoginDevices = (params: any) =>
    axiosInstance.get(`/distrubutor/loginDevice`, { params });

export const updateLoginDevice = (id: string, data: { isAllow?: boolean; sessionActive?: boolean }) =>
    axiosInstance.put(`/distrubutor/loginDevice/${id}`, data);

// Fetch retailer sign up requests
export const fetchRetailerSignUpRequests = async (params: any) => {
    return axiosInstance.get('/distrubutor/retailerSignUp', { params });
  };
  
  // Update retailer sign up request
  export const updateRetailerSignUpRequest = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/updateRetailerSignUp/${id}`, data);
  }; 