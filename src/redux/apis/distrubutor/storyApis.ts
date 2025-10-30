import axiosInstance from "../../../config/axios";

export const createStory = async (data: any) => {
    const formData = new FormData();
    formData.append('mediaType', data.mediaType);
    formData.append('media', data.media);
    formData.append('caption', data.caption);
    const response = await axiosInstance.post('/distrubutor/stories', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getStory = async () => {
    const response = await axiosInstance.get('/distrubutor/stories');
    return response.data;
};

export const getStoryById = async (id: string) => {
    const response = await axiosInstance.get(`/distrubutor/stories/${id}`);
    return response.data;
};

export const updateStory = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/distrubutor/stories/${id}`, data);
    return response.data;
};