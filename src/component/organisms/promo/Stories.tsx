import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Grid,
    IconButton,
    useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import CustomButton from '../../atoms/CustomButton';
import CommonModal from '../../atoms/CommonModal';
import { toast } from 'react-hot-toast';
import { getStory } from '../../../redux/apis/distrubutor/storyApis';
import Story from '../../../pages/admin/story/Story';

interface StoryData {
    id: number;
    mediaUrl: string;
    mediaType: string;
    caption: string;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    views: Array<{
        id: number;
        viewerId: number;
        viewedAt: string;
    }>;
    viewers: Array<{
        C_Name: string;
        C_Number: number;
    }>;
    viewsCount: number;
}



const Stories: React.FC = () => {
    const theme = useTheme();
    const [stories, setStories] = useState<StoryData[]>([]);
    const [loading, setLoading] = useState(false);

    const [storyModalOpen, setStoryModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);

    // Fetch stories from API
    const fetchStories = async () => {
        setLoading(true);
        try {
            const response = await getStory();
            const apiResponse: any = response
            // Handle new API response structure - direct array of stories
            const data = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.data?.stories || []);
            setStories(data);
        } catch (error) {
            console.error('Error fetching stories:', error);
            toast.error('Failed to load stories');
            // Fallback to empty array if API fails
            setStories([]);
        } finally {
            setLoading(false);
        }
    };

    // Load stories on component mount
    useEffect(() => {
        fetchStories();
    }, []);

    const handleOpenStoryModal = () => {
        setStoryModalOpen(true);
    };

    const handleCloseStoryModal = () => {
        setStoryModalOpen(false);
        // Refresh stories after modal closes
        fetchStories();
    };

    const handlePreviewStory = (story: StoryData) => {
        setSelectedStory(story);
        setPreviewModalOpen(true);
    };

    const handleClosePreviewModal = () => {
        setPreviewModalOpen(false);
        setSelectedStory(null);
    };

    const handleDelete = (storyId: number) => {
        setStories(prev => prev.filter(story => story.id !== storyId));
        toast.success('Story deleted successfully!');
    };

    const getStatusColor = (isActive: boolean) => {
        return isActive ? theme.palette.success.main : theme.palette.grey[500];
    };

    const getStatusLabel = (isActive: boolean) => {
        return isActive ? 'Active' : 'Inactive';
    };

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('MMM DD, YYYY');
    };

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography>Loading stories...</Typography>
            </Box>
        );
    }

    // Show empty state
    if (stories.length === 0) {
        return (
            <Box>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography fontSize={16} color="text.primary">Promotional Stories</Typography> 
                    <CustomButton
                        appearance="filled"
                        onClick={handleOpenStoryModal}
                        icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
                        size="small"
                        fullWidth={false}
                        sx={{ mt: 0 }}
                    >
                        Add Story
                    </CustomButton>
                </Box>

                {/* Empty State */}
                <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    border: 2,
                    borderColor: 'divider',
                    borderStyle: 'dashed',
                    borderRadius: 2
                }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No stories yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Create your first promotional story to get started
                    </Typography>
                    <CustomButton
                        appearance="filled"
                        onClick={handleOpenStoryModal}
                        icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
                        fullWidth={false}
                        size="small"
                        sx={{ mt:0 }}
                    >
                        Create First Story
                    </CustomButton>
                </Box>

                {/* Story Modal */}
                <Story
                    open={storyModalOpen}
                    onClose={handleCloseStoryModal}
                />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}


            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography fontSize={16} color="text.primary">Promotional Stories</Typography>
                <CustomButton
                    sx={{ mt:0 }}
                    appearance="filled"
                    onClick={handleOpenStoryModal}
                    fullWidth={false}
                    icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
                    size="small"
                >
                    Add
                </CustomButton>
            </Box>


            {/* Stories Grid */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {stories.map((story) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={story.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
                                transition: 'box-shadow 0.2s',
                                '&:hover': {
                                    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                                },
                                minHeight: 320,
                            }}
                        >
                            {story.mediaUrl && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        overflow: 'hidden',
                                        borderTopLeftRadius: 8,
                                        borderTopRightRadius: 8,
                                        background: '#f7f7f7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <img
                                        src={story.mediaUrl}
                                        alt={story.caption}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8,
                                            maxHeight: 220,
                                        }}
                                    />
                                </Box>
                            )}

                            <CardContent
                                sx={{
                                    flexGrow: 1,
                                    p: { xs: 1.5, sm: 2 },
                                    pb: '8px !important',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 0.5,
                                        gap: 1,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 500,
                                            fontSize: { xs: 15, sm: 16 },
                                            flex: 1,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                        title={story.caption || 'No Caption'}
                                    >
                                        {story.caption || 'No Caption'}
                                    </Typography>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            backgroundColor: getStatusColor(story.isActive) + '18',
                                            color: getStatusColor(story.isActive),
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            ml: 1,
                                            minWidth: 60,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {getStatusLabel(story.isActive)}
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 0.5 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 0.25, fontSize: { xs: 12, sm: 13 } }}
                                    >
                                        <strong>Expires:</strong> {formatDate(story.expiresAt)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: 12, sm: 13 } }}
                                    >
                                        <strong>Total Views:</strong> {story.viewsCount || 0}
                                    </Typography>
                                </Box>
                            </CardContent>

                            <CardActions
                                sx={{
                                    justifyContent: 'space-between',
                                    px: { xs: 1, sm: 2 },
                                    pb: 1,
                                    pt: 0,
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(story.id)}
                                    sx={{
                                        color: theme.palette.error.main,
                                        p: 0.75,
                                    }}
                                    aria-label="Delete story"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <CustomButton
                                    size="small"
                                    appearance="outlined"
                                    fullWidth={false}
                                    icon={<ViewIcon fontSize='small' sx={{fontSize:16}}/>}
                                    onClick={() => handlePreviewStory(story)}
                                    sx={{ mt:0 }}
                                >
                                    Preview
                                </CustomButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Story Modal */}
            <Story
                open={storyModalOpen}
                onClose={handleCloseStoryModal}
            />

            {/* Preview Modal */}
            <CommonModal
                open={previewModalOpen}
                onClose={handleClosePreviewModal}
                title="Story Preview"
                size="md"
            >
                {selectedStory && (
                    <Box sx={{ p: 1 }}>
                        {/* Story Image/Media */}
                        {selectedStory.mediaUrl && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                {selectedStory.mediaType === 'image' ? (
                                    <img
                                        src={selectedStory.mediaUrl}
                                        alt={selectedStory.caption}
                                        style={{
                                            width: '100%',
                                            maxHeight: 350,
                                            objectFit: 'contain',
                                            borderRadius: 8
                                        }}
                                    />
                                ) : selectedStory.mediaType === 'video' ? (
                                    <video
                                        src={selectedStory.mediaUrl}
                                        controls
                                        style={{
                                            width: '100%',
                                            maxHeight: 350,
                                            borderRadius: 8
                                        }}
                                    />
                                ) : (
                                    <Box sx={{
                                        p: 3,
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        textAlign: 'center'
                                    }}>
                                        <Typography color="text.secondary">
                                            {selectedStory.mediaType} file
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Story Details */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                                {selectedStory.caption || 'No Caption'}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    backgroundColor: getStatusColor(selectedStory.isActive) + '20',
                                    color: getStatusColor(selectedStory.isActive),
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {getStatusLabel(selectedStory.isActive)}
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Type: {selectedStory.mediaType}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                                    <strong>Views:</strong> {selectedStory.viewsCount || 0}
                                </Typography>
                            </Box>


                        </Box>

                        {/* Viewers List */}
                        {selectedStory.viewers && selectedStory.viewers.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                    Viewers ({selectedStory.viewers.length})
                                </Typography>
                                <Box sx={{
                                    maxHeight: 150,
                                    overflowY: 'auto',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 1
                                }}>
                                    {selectedStory.viewers.map((viewer, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                p: 1,
                                                mb: 0.5,
                                                backgroundColor: 'background.default',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                                {viewer.C_Name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {viewer.C_Number}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* No Viewers Message */}
                        {(!selectedStory.viewers || selectedStory.viewers.length === 0) && (
                            <Box sx={{
                                mb: 2,
                                p: 2,
                                textAlign: 'center',
                                border: '1px dashed',
                                borderColor: 'divider',
                                borderRadius: 1,
                                backgroundColor: 'background.default'
                            }}>
                                <Typography variant="body2" color="text.secondary">
                                    No viewers yet
                                </Typography>
                            </Box>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                            <CustomButton
                                appearance="outlined"
                                onClick={handleClosePreviewModal}
                                size="small"
                            >
                                Close
                            </CustomButton>
                        </Box>
                    </Box>
                )}
            </CommonModal>
        </Box>
    );
};

export default Stories; 