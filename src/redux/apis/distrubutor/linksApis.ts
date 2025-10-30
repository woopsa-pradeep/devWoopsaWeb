import axiosInstance from "../../../config/axios";

export const getLinks = async () => {
    const response = await axiosInstance.get('/distrubutor/links');
    return response.data;
};

export const createLink = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('url', data.url);
    formData.append('logo', data.logo);
    formData.append('description', data.description);
    const response = await axiosInstance.post('/distrubutor/links', formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return response.data;
};

export const updateLink = async (id: string, data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('url', data.url);
    formData.append('logo', data.logo);
    formData.append('description', data.description);
    formData.append('showInWeb', data.showInWeb);
    formData.append('status', data.status);
    const response = await axiosInstance.put(`/distrubutor/links/${id}`, formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return response.data;
};

export const deleteLink = async (id: string) => {
    const response = await axiosInstance.delete(`/distrubutor/links/${id}`);
    return response.data;
};

