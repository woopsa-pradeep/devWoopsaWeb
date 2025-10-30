import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useTheme, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import SwitchInput from '../../../component/atoms/SwitchInput';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import TextInput from '../../../component/atoms/TextInput';
import FileUploadInput from '../../../component/atoms/FileUploadInput';
import toast from 'react-hot-toast';
import { getLinks, createLink, updateLink, deleteLink } from '../../../redux/apis/distrubutor/linksApis';
import {
  Add as AddIcon,
} from '@mui/icons-material';
// Zod schema for link form
const linkSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  url: z.string().trim().min(1, 'URL is required').url('Please enter a valid URL'),
  logo: z.instanceof(File).optional(),
  showInWeb: z.boolean().optional(),
  status: z.boolean().optional(),
});

type LinkForm = z.infer<typeof linkSchema>;

// Link data interface
interface LinkData {
  id: number;
  name: string;
  logo: string;
  url: string;
  status: boolean;
  showInWeb?: boolean;
  createdAt: string;
  updatedAt: string;
}



const Links: React.FC = () => {
  const theme = useTheme();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isShowInWebModalOpen, setIsShowInWebModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkData | null>(null);
  const [statusChangeData, setStatusChangeData] = useState<{
    linkId: number;
    newStatus: boolean;
    linkName: string;
  } | null>(null);
  const [showInWebChangeData, setShowInWebChangeData] = useState<{
    linkId: number;
    newShowInWeb: boolean;
    linkName: string;
  } | null>(null);
  const [deleteData, setDeleteData] = useState<{
    linkId: number;
    linkName: string;
  } | null>(null);
  
  // Actions menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActionLink, setSelectedActionLink] = useState<LinkData | null>(null);
  
  // Data state
  const [linksData, setLinksData] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      name: '',
      url: '',
      logo: undefined,
      showInWeb: true,
      status: true,
    },
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate pagination values
  const totalItems = linksData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = linksData.slice(startIndex, endIndex);

  // Fetch links data
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response: any = await getLinks();
      setLinksData(response.data?.links || []);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast.error('Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLinks();
  }, []);

  // Handle status change
  const handleStatusChange = (linkId: number, newStatus: boolean, linkName: string) => {
    setStatusChangeData({
      linkId,
      newStatus,
      linkName,
    });
    setIsStatusModalOpen(true);
  };

  // Handle showInWeb change
  const handleShowInWebChange = (linkId: number, newShowInWeb: boolean, linkName: string) => {
    setShowInWebChangeData({
      linkId,
      newShowInWeb,
      linkName,
    });
    setIsShowInWebModalOpen(true);
  };

  // Handle status update confirmation
  const handleStatusUpdateConfirm = async () => {
    if (!statusChangeData) return;

    try {
      // Find the current link to get its current values
      const currentLink = linksData.find(link => link.id === statusChangeData.linkId);
      if (!currentLink) return;

      const response: any = await updateLink(statusChangeData.linkId.toString(), {
        name: currentLink.name,
        url: currentLink.url,
        status: statusChangeData.newStatus,
        showInWeb: currentLink.showInWeb,
      });

      if (response.success) {
        toast.success('Status updated successfully!');
        fetchLinks(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsStatusModalOpen(false);
      setStatusChangeData(null);
    }
  };

  // Handle showInWeb update confirmation
  const handleShowInWebUpdateConfirm = async () => {
    if (!showInWebChangeData) return;

    try {
      // Find the current link to get its current values
      const currentLink = linksData.find(link => link.id === showInWebChangeData.linkId);
      if (!currentLink) return;

      const response: any = await updateLink(showInWebChangeData.linkId.toString(), {
        name: currentLink.name,
        url: currentLink.url,
        status: currentLink.status,
        showInWeb: showInWebChangeData.newShowInWeb,
      });

      if (response.success) {
        toast.success('Show In Web updated successfully!');
        fetchLinks(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to update show in web');
      }
    } catch (error) {
      console.error('Error updating show in web:', error);
      toast.error('Failed to update show in web');
    } finally {
      setIsShowInWebModalOpen(false);
      setShowInWebChangeData(null);
    }
  };

  // Handle status update cancel
  const handleStatusUpdateCancel = () => {
    setIsStatusModalOpen(false);
    setStatusChangeData(null);
  };

  // Handle showInWeb update cancel
  const handleShowInWebUpdateCancel = () => {
    setIsShowInWebModalOpen(false);
    setShowInWebChangeData(null);
  };

  // Handle delete
  const handleDelete = (linkId: number, linkName: string) => {
    setDeleteData({
      linkId,
      linkName,
    });
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteData) return;

    try {
      const response: any = await deleteLink(deleteData.linkId.toString());

      if (response.success) {
        toast.success('Link deleted successfully!');
        fetchLinks(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteData(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteData(null);
  };

  // Actions menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, link: LinkData) => {
    setAnchorEl(event.currentTarget);
    setSelectedActionLink(link);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActionLink(null);
  };

  const handleMenuAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedActionLink) return;

    handleMenuClose();

    switch (action) {
      case 'view':
        handleOpenViewModal(selectedActionLink);
        break;
      case 'edit':
        handleOpenEditModal(selectedActionLink);
        break;
      case 'delete':
        handleDelete(selectedActionLink.id, selectedActionLink.name);
        break;
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = (link: LinkData) => {
    setSelectedLink(link);
    setIsEditModalOpen(true);
    // Pre-fill the form with existing data
    reset({
      name: link.name,
      url: link.url,
      logo: undefined, // We'll handle this separately
      showInWeb: link.showInWeb ?? true,
      status: link.status,
    });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLink(null);
    reset();
  };

  // Form submission handler
  const onSubmit = async (data: LinkForm) => {
    try {
      if (selectedLink) {
        // Edit existing link
        const updateData: any = {
          name: data.name,
          url: data.url,
          showInWeb: data.showInWeb ?? selectedLink.showInWeb ?? true,
          status: data.status ?? selectedLink.status,
        };
        
        // Only include logo if a new one is selected
        if (data.logo) {
          updateData.logo = data.logo;
        }
        
        const response: any = await updateLink(selectedLink.id.toString(), updateData);
        
        if (response.success) {
          toast.success('Link updated successfully!');
          setIsEditModalOpen(false);
          setSelectedLink(null);
          reset();
          fetchLinks(); // Refresh the data
        } else {
          toast.error(response.message || 'Failed to update link');
        }
      } else {
        // Create new link - logo is required
        if (!data.logo) {
          toast.error('Logo is required for new links');
          return;
        }
        
        const createData = {
          ...data,
          showInWeb: data.showInWeb ?? true, // Default to true for new links
          status: data.status ?? true, // Default to true for new links
        };
        
        const response: any = await createLink(createData);
        
        if (response.success) {
          toast.success('Link created successfully!');
          setIsModalOpen(false);
          reset();
          fetchLinks(); // Refresh the data
        } else {
          toast.error(response.message || 'Failed to create link');
        }
      }
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error(selectedLink ? 'Failed to update link' : 'Failed to create link');
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  // View modal handlers
  const handleOpenViewModal = (link: LinkData) => {
    setSelectedLink(link);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLink(null);
  };

  // Table columns configuration
  const columns: TableColumn<LinkData>[] = [
    {
      id: 'name',
      label: 'Name',
      align: 'left',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'logo',
      label: 'Logo',
      align: 'center',
      minWidth: 100,
      render: (row) => (
        <Box display="flex" justifyContent="center">
          <img 
            src={row.logo} 
            alt={row.name} 
            style={{ width: 40, height: 40, borderRadius: '4px' }}
          />
        </Box>
      ),
    },
    {
      id: 'showInWeb',
      label: 'Show In Web',
      align: 'center',
      minWidth: 120,
      render: (row:any) => (
        <Box display="flex" justifyContent="center">
          <SwitchInput
            checked={row.showInWeb || false}
            onChange={(checked) => handleShowInWebChange(row.id, checked, row.name)}
            sx={{ mb: 0 }}
            isShowLabel={false}
          />
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 120,
      render: (row) => (
        <Box display="flex" justifyContent="center">
          <SwitchInput
            checked={row.status}
            onChange={(checked) => handleStatusChange(row.id, checked, row.name)}
            sx={{ mb: 0 }}
            isShowLabel={false}
          />
        </Box>
      ),
    },
    {
      id: 'url',
      label: 'URL',
      align: 'left',
      minWidth: 200,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {row.url}
        </Typography>
      ),
    },
         {
       id: 'actions',
       label: 'Actions',
       align: 'center',
       minWidth: 120,
       render: (row) => (
         <Box display="flex" justifyContent="center" gap={1}>
           <IconButton
             onClick={(event) => handleMenuOpen(event, row)}
             sx={{
               color: theme.palette.primary.main,
               // '&:hover': {
               //   backgroundColor: theme.palette.primary.light,
               //   color: theme.palette.primary.contrastText,
               // },
             }}
             title="More Options"
           >
             <MoreVertIcon />
           </IconButton>
         </Box>
       ),
     },
  ];

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };


  

  return (
    <Box sx={{ p: 1 }}>
      <Box display="flex" px={2} pt={2} justifyContent="space-between" alignItems="center" >
        <Typography fontSize={16} color="text.primary">Links</Typography>
     
        <CustomButton
          appearance="filled"
          onClick={handleOpenModal}
          icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
size="small"
      fullWidth={false}
      sx={{ mt: 0 }}
        >
          Add
        </CustomButton>
      </Box>

      <CommonTable
        data={currentData}
        columns={columns}
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Optional pagination customization
        pageSizeOptions={[5, 10, 25, 50]}
        showPageSizeSelector={true}
        showTotalItems={true}
        showPageNumbers={true}
        maxPageNumbers={5}
        // Other props
        loading={loading}
        filterComponent={null}
        containerHeight="calc(100vh - 280px)"
        stickyHeader={true}
      />

      {/* Add Link Modal */}
      <CommonModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Link"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ p: 2 }}>
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="Link Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="Enter link name"
                />
              )}
            />

            {/* URL Field */}
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="URL"
                  error={!!errors.url}
                  helperText={errors.url?.message}
                  placeholder="Enter URL (e.g., https://example.com)"
                />
              )}
            />

            {/* Logo Field */}
          
<Controller
                name="logo"
                control={control}
                render={({ field }) => (
                  <FileUploadInput
                    label="Logo (Image file)"
                    onChange={(file) => field.onChange(file)}
                    error={!!errors.logo}
                    helperText={errors.logo?.message || "Upload a logo image"}
                    accept=".png, .jpg, .jpeg"
                  />
                )}
              />

            {/* Show In Web Field */}
            <Controller
              name="showInWeb"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <SwitchInput
                    checked={field.value ?? true}
                    onChange={(checked: boolean) => field.onChange(checked)}
                    size="medium"
                  />
                  <Box>
                    <Typography variant="body2" color="text.primary">
                      Show In Web
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.value ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Status Field */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <SwitchInput
                    checked={field.value ?? true}
                    onChange={(checked: boolean) => field.onChange(checked)}
                    size="medium"
                  />
                  <Box>
                    <Typography variant="body2" color="text.primary">
                      Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.value ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Action Buttons */}
            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <CustomButton
                appearance="outlined"
                onClick={handleCloseModal}
                type="button"
                size="small"
                fullWidth={false}
                sx={{ mt:0 }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                appearance="filled"
                type="submit"
                size="small"
                fullWidth={false} 
                sx={{ mt:0 }}
                >
                Create
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

      {/* View Link Modal */}
      <CommonModal
        open={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Link Details"
        size="md"
      >
        {selectedLink && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <img 
                  src={selectedLink.logo} 
                  alt={selectedLink.name} 
                  style={{ width: 60, height: 60, borderRadius: '8px' }}
                />
                <Typography fontSize={16} fontWeight={500} color="text.primary">
                  {selectedLink.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                  URL:
                </Typography>
                <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  {selectedLink.url}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                  Status:
                </Typography>
                <Typography fontSize={14} fontWeight={400} color="text.secondary">
                  {selectedLink.status ? 'Active' : 'Inactive'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                  Show In Web:
                </Typography>
                <Typography fontSize={14} fontWeight={400} color="text.secondary">
                  {selectedLink.showInWeb ? 'Yes' : 'No'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                  Created At:
                </Typography>
                <Typography fontSize={14} fontWeight={400} color="text.secondary">
                  {new Date(selectedLink.createdAt).toLocaleString()}
                </Typography>
              </Box>

            </Box>

           
          </Box>
        )}
      </CommonModal>

             {/* Status Update Confirmation Modal */}
       <CommonModal
         open={isStatusModalOpen}
         onClose={handleStatusUpdateCancel}
         title="Confirm Status Change"
         size="sm"
       >
         <Box sx={{ p: 2 }}>
           {statusChangeData && (
             <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ mb: 3 }}>
               Are you sure you want to change the status of{' '}
               <strong>{statusChangeData.linkName}</strong> to{' '}
               <strong>{statusChangeData.newStatus ? 'Active' : 'Inactive'}</strong>?
             </Typography>
           )}

           {/* Action Buttons */}
           <Box display="flex" gap={2} justifyContent="flex-end">
             <CustomButton
               appearance="outlined"
               onClick={handleStatusUpdateCancel}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
             >
               Cancel
             </CustomButton>
             <CustomButton
               appearance="filled"
               onClick={handleStatusUpdateConfirm}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
             >
               Confirm
             </CustomButton>
           </Box>
         </Box>
       </CommonModal>

       {/* Show In Web Update Confirmation Modal */}
       <CommonModal
         open={isShowInWebModalOpen}
         onClose={handleShowInWebUpdateCancel}
         title="Confirm Show In Web Change"
         size="sm"
       >
         <Box sx={{ p: 2 }}>
           {showInWebChangeData && (
             <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ mb: 3 }}>
               Are you sure you want to change the show in web setting of{' '}
               <strong>{showInWebChangeData.linkName}</strong> to{' '}
               <strong>{showInWebChangeData.newShowInWeb ? 'Yes' : 'No'}</strong>?
             </Typography>
           )}

           {/* Action Buttons */}
           <Box display="flex" gap={2} justifyContent="flex-end">
             <CustomButton
               appearance="outlined"
               onClick={handleShowInWebUpdateCancel}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
             >
               Cancel
             </CustomButton>
             <CustomButton
               appearance="filled"
               onClick={handleShowInWebUpdateConfirm}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
             >
               Confirm
             </CustomButton>
           </Box>
         </Box>
       </CommonModal>

       {/* Delete Confirmation Modal */}
       <CommonModal
         open={isDeleteModalOpen}
         onClose={handleDeleteCancel}
         title="Confirm Delete"
         size="sm"
       >
         <Box sx={{ p: 2 }}>
           <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ mb: 3 }}>
             Are you sure you want to delete{' '}
             <strong>{deleteData?.linkName}</strong>? This action cannot be undone.
           </Typography>

           {/* Action Buttons */}
           <Box display="flex" gap={2} justifyContent="flex-end">
             <CustomButton
               appearance="outlined"
               onClick={handleDeleteCancel}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
             >
               Cancel
             </CustomButton>
             <CustomButton
               appearance="filled"
               onClick={handleDeleteConfirm}
               size="small"
               fullWidth={false}
               sx={{ mt:0 }}
               buttonType='delete'
             >
               Delete
             </CustomButton>
           </Box>
         </Box>
       </CommonModal>

       {/* Edit Link Modal */}
       <CommonModal
         open={isEditModalOpen}
         onClose={handleCloseEditModal}
         title="Edit Link"
         size="md"
       >
         <form onSubmit={handleSubmit(onSubmit)}>
           <Box sx={{ p: 2 }}>
             {/* Name Field */}
             <Controller
               name="name"
               control={control}
               render={({ field }) => (
                 <TextInput
                   {...field}
                   label="Link Name"
                   error={!!errors.name}
                   helperText={errors.name?.message}
                   placeholder="Enter link name"
                 />
               )}
             />

             {/* URL Field */}
             <Controller
               name="url"
               control={control}
               render={({ field }) => (
                 <TextInput
                   {...field}
                   label="URL"
                   error={!!errors.url}
                   helperText={errors.url?.message}
                   placeholder="Enter URL (e.g., https://example.com)"
                 />
               )}
             />

             {/* Logo Field */}
             <Controller
               name="logo"
               control={control}
               render={({ field }) => (
                 <Box>
                   {/* Show current logo if exists */}
                   {selectedLink?.logo && (
                     <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                         Current Logo:
                       </Typography>
                       <img 
                         src={selectedLink.logo} 
                         alt="Current logo" 
                         style={{ width: 60, height: 40, borderRadius: '4px' }}
                       />
                     </Box>
                   )}
                   
                   <FileUploadInput
                     label="New Logo (Optional) - Upload to replace current logo"
                     onChange={(file) => field.onChange(file)}
                     error={!!errors.logo}
                     helperText={errors.logo?.message || "Upload a new logo or leave empty to keep current"}
                     accept=".png, .jpg, .jpeg"
                   />
                 </Box>
               )}
             />

             {/* Show In Web Field */}
             <Controller
               name="showInWeb"
               control={control}
               render={({ field }) => (
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                   <SwitchInput
                     checked={field.value ?? true}
                     onChange={(checked: boolean) => field.onChange(checked)}
                     size="medium"
                   />
                   <Box>
                     <Typography variant="body2" color="text.primary">
                       Show In Web
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                       {field.value ? 'Yes' : 'No'}
                     </Typography>
                   </Box>
                 </Box>
               )}
             />

             {/* Status Field */}
             <Controller
               name="status"
               control={control}
               render={({ field }) => (
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                   <SwitchInput
                     checked={field.value ?? selectedLink?.status ?? true}
                     onChange={(checked: boolean) => field.onChange(checked)}
                     size="medium"
                   />
                   <Box>
                     <Typography variant="body2" color="text.primary">
                       Status
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                       {field.value ? 'Active' : 'Inactive'}
                     </Typography>
                   </Box>
                 </Box>
               )}
             />

             {/* Action Buttons */}
             <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
               <CustomButton
                 appearance="outlined"
                 onClick={handleCloseEditModal}
                 type="button"
                 size="small"
                 fullWidth={false}
                 sx={{ mt:0 }}
               >
                 Cancel
               </CustomButton>
               <CustomButton
                 appearance="filled"
                 type="submit"
                 size="small"
                 fullWidth={false}
                 sx={{ mt:0 }}
               >
                 Update
               </CustomButton>
             </Box>
           </Box>
         </form>
       </CommonModal>

       {/* Actions Menu */}
       <Menu
         anchorEl={anchorEl}
         open={Boolean(anchorEl)}
         onClose={handleMenuClose}
         PaperProps={{
           sx: {
             boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
             borderRadius: 2,
             minWidth: 150,
           }
         }}
       >
         <MenuItem onClick={() => handleMenuAction('view')}>
           <ListItemIcon>
             <VisibilityOutlined fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="View" />
         </MenuItem>
         <MenuItem onClick={() => handleMenuAction('edit')}>
           <ListItemIcon>
             <EditIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="Edit" />
         </MenuItem>
         <MenuItem onClick={() => handleMenuAction('delete')}>
           <ListItemIcon>
             <DeleteIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="Delete" />
         </MenuItem>
       </Menu>
     </Box>
   );
 };

export default Links;
