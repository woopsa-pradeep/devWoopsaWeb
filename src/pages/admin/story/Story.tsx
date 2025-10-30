import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextInput from '../../../component/atoms/TextInput';
import FileUploadInput from '../../../component/atoms/FileUploadInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { createStory, updateStory } from '../../../redux/apis/distrubutor/storyApis';
import { toast } from 'react-hot-toast';

// Zod schema matching the backend Joi validation
const createStorySchema = z.object({
  mediaType: z.enum(['image', 'video'], {
    required_error: 'Media type is required.',
    invalid_type_error: 'Media type must be either "image" or "video".',
  }),
  media: z.string().trim().min(1, 'Media is required.'),
  caption: z.string().trim().optional(),
});

type CreateStoryFormData = z.infer<typeof createStorySchema>;

interface StoryProps {
  open: boolean;
  onClose: () => void;
  storyId?: number; // Add storyId prop for editing/deleting
}

const Story: React.FC<StoryProps> = ({ open, onClose, storyId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      mediaType: 'image',
      media: '',
      caption: '',
    },
  });

  const handleFileUpload = (file: File) => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    // Determine media type based on file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];

    if (imageExtensions.includes(fileExtension || '')) {
      setMediaType('image');
      setValue('mediaType', 'image');
    } else if (videoExtensions.includes(fileExtension || '')) {
      setMediaType('video');
      setValue('mediaType', 'video');
    } else {
      setError('Please upload a valid image');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setSelectedFile(file);
    setValue('media', file.name);
    setError(null);
  };

  const onSubmit = async (data: CreateStoryFormData) => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Here you would typically upload the file to your backend
      // For now, we'll just simulate the API call
     const sendObject = {
      mediaType: data.mediaType,
      media: selectedFile,
      caption: data.caption || ''
     }
     try{
         await createStory(sendObject);
        toast.success('Story created successfully');
     }catch(err:any){
        toast.error(err.response.data.message || 'Failed to create story');
     }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success - close modal and reset form
      onClose();
      reset();
      setSelectedFile(null);
      setMediaType(null);
      
      // You can add success toast here
      // console.log('Story created successfully:', data);
      
    } catch (err) {
      setError('Failed to create story. Please try again.');
      console.error('Error creating story:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
      setSelectedFile(null);
      setMediaType(null);
      setFilePreview(null);
      setError(null);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!storyId) return;
    
    setIsDeleting(true);
    try {
      await updateStory(storyId.toString(), { isActive: false });
      toast.success('Story deleted successfully');
      setDeleteConfirmOpen(false);
      onClose(); // Close the modal after successful deletion
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast.error(error.response?.data?.message || 'Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" fontWeight={600}>
          Add Story
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Caption Field */}
            <Box>
              <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                Caption
              </Typography>
              <Controller
                name="caption"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    placeholder="Enter your story caption (optional)"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.caption}
                    helperText={errors.caption?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Box>

            {/* File Upload Field */}
            <Box>
              <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                Media File *
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Upload an image (max 5MB)
              </Typography>
              
                             <Controller
                 name="media"
                 control={control}
                 render={({  }) => (
                   <FileUploadInput
                     label="Media File"
                     onChange={(file) => handleFileUpload(file as File)}
                     error={!!errors.media}
                     helperText={errors.media?.message || "Upload an image"}
                     accept="image/*,video/*"
                   />
                 )}
               />

               {/* File Preview */}
               {filePreview && (
                 <Box sx={{ mt: 2 }}>
                   <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                     Preview
                   </Typography>
                   <Box
                     sx={{
                       border: '1px solid',
                       borderColor: 'divider',
                       borderRadius: 1,
                       overflow: 'hidden',
                       maxHeight: 300,
                       display: 'flex',
                       justifyContent: 'center',
                       alignItems: 'center',
                       bgcolor: 'background.default'
                     }}
                   >
                     {mediaType === 'image' ? (
                       <img
                         src={filePreview}
                         alt="Preview"
                         style={{
                           maxWidth: '80%',
                           maxHeight: '200px',
                           objectFit: 'contain'
                         }}
                       />
                     ) : mediaType === 'video' ? (
                       <video
                         src={filePreview}
                         controls
                         style={{
                           maxWidth: '80%',
                           maxHeight: '200px'
                         }}
                       />
                     ) : null}
                   </Box>
                   <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                     <Typography variant="body2" color="text.secondary">
                       Selected: {selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                     </Typography>
                     <Typography variant="caption" color="primary.main">
                       Type: {mediaType}
                     </Typography>
                   </Box>
                 </Box>
               )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {/* Delete Button - Only show if storyId exists (editing mode) */}
          {storyId && (
            <Button
              onClick={handleDeleteClick}
              disabled={isSubmitting || isDeleting}
              variant="outlined"
              color="error"
              sx={{ borderRadius: 2, mr: 'auto' }}
            >
              Delete
            </Button>
          )}
          
            <CustomButton
              onClick={handleClose}
              disabled={isSubmitting || isDeleting}
              buttonType="primary"
              appearance="outlined"
              sx={{ borderRadius: 2 }}
              fullWidth={false}
              
            >
              Cancel
          </CustomButton>
          <CustomButton
            type="submit"
            buttonType="primary"
            appearance="filled"
            loading={isSubmitting}
            disabled={!selectedFile}
            fullWidth={false}
          >
            {isSubmitting ? 'Creating...' : 'Create Story'}
          </CustomButton>
                 </DialogActions>
       </form>

       {/* Delete Confirmation Dialog */}
       <Dialog
         open={deleteConfirmOpen}
         onClose={handleDeleteCancel}
         maxWidth="xs"
         fullWidth
         PaperProps={{
           sx: {
             borderRadius: 2,
           }
         }}
       >
         <DialogTitle sx={{ pb: 1 }}>
           <Typography variant="h6" fontWeight={600} color="error">
             Delete Story
           </Typography>
         </DialogTitle>
         
         <DialogContent sx={{ pt: 0 }}>
           <Typography sx={{ mb: 2 }}>
             Are you sure you want to delete this story? This action cannot be undone.
           </Typography>
         </DialogContent>
         
         <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
           <Button
             onClick={handleDeleteCancel}
             disabled={isDeleting}
             variant="outlined"
             sx={{ borderRadius: 2 }}
           >
             Cancel
           </Button>
           <Button
             onClick={handleDeleteConfirm}
             disabled={isDeleting}
             variant="contained"
             color="error"
             sx={{ borderRadius: 2 }}
             startIcon={isDeleting ? <CircularProgress size={16} /> : null}
           >
             {isDeleting ? 'Deleting...' : 'Delete'}
           </Button>
         </DialogActions>
       </Dialog>
     </Dialog>
   );
 };

export default Story;
