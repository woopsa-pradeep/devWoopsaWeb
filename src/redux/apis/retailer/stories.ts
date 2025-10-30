import axiosInstance from "../../../config/axios";

export const getStories = async () => {
    const response = await axiosInstance.get('/retailer/story');
    return response.data;
}


export const updateStory = async (id: string) => {
    const response = await axiosInstance.put(`/retailer/story/${id}`);
    return response.data;
}

