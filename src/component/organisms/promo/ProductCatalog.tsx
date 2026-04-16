import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useTheme, Menu, MenuItem, ListItemIcon, ListItemText, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CommonTable, { TableColumn } from '../../atoms/Table/CommonTable';
import {
    Add as AddIcon,
} from '@mui/icons-material';
import SwitchInput from '../../atoms/SwitchInput';
import CommonModal from '../../atoms/CommonModal';
import CustomButton from '../../atoms/CustomButton';
import TextInput from '../../atoms/TextInput';
import FileUploadInput from '../../atoms/FileUploadInput';
import toast from 'react-hot-toast';
import { getProductCatalog, addProductCatalog, updateProductCatalog } from '../../../redux/apis/distrubutor/productCatalogApis';
// import DeleteIcon from '@mui/icons-material/Delete';
import ViewIcon from '@mui/icons-material/Visibility';
// import EditIcon from '@mui/icons-materi';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Zod schema for product catalog
const productCatalogSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  attachment: z.instanceof(File).optional(),
  link: z.string().optional(),
}).refine((data) => {
  // Either attachment or link must be provided
  return data.attachment || (data.link && data.link.trim().length > 0);
}, {
  message: 'Either attachment or link must be provided',
  path: ['attachment'], // This will show the error on the attachment field
}).refine((data) => {
  // If link is provided, it must be a valid URL
  if (data.link && data.link.trim().length > 0) {
    try {
      new URL(data.link);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Please enter a valid URL',
  path: ['link'],
});

type ProductCatalogForm = z.infer<typeof productCatalogSchema>;

// Product data interface
interface ProductData {
  id: number;
  name: string;
  description: string;
  C_Number: number;
  status: boolean;
  attachment: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductCatalogPermProps {
    canAdd?: boolean;
    canEdit?: boolean;
}

const ProductCatalog: React.FC<ProductCatalogPermProps> = ({ canAdd = true, canEdit: _canEdit = true }) => {
  const theme = useTheme();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [statusChangeData, setStatusChangeData] = useState<{
    productId: number;
    newStatus: boolean;
    productName: string;
  } | null>(null);
  const [deleteData, setDeleteData] = useState<{
    productId: number;
    productName: string;
  } | null>(null);
  
  // Actions menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActionProduct, setSelectedActionProduct] = useState<ProductData | null>(null);
  
  // Data state
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Form state for attachment type selection
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('file');
  
  // Loading state for form submission
  const [submitting, setSubmitting] = useState(false);
  
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCatalogForm>({
    resolver: zodResolver(productCatalogSchema),
    defaultValues: {
      name: '',
      description: '',
      attachment: undefined,
      link: '',
    },
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch product catalog data
  const fetchProductCatalog = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setLoading(true);
      const response: any = await getProductCatalog({ page, limit });
      
      // Update data and pagination info from server response
      setProductData(response.data?.catalogs || []);
      setTotalCount(response.data?.totalCount || 0);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching product catalog:', error);
      toast.error('Failed to fetch product catalog');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProductCatalog(1, 10);
  }, []);

  // Handle status change
  const handleStatusChange = (productId: number, newStatus: boolean, productName: string) => {
    setStatusChangeData({
      productId,
      newStatus,
      productName,
    });
    setIsStatusModalOpen(true);
  };

  // Handle status update confirmation
  const handleStatusUpdateConfirm = async () => {
    if (!statusChangeData) return;

    try {
      const response: any = await updateProductCatalog(statusChangeData.productId.toString(), {
        status: statusChangeData.newStatus,
      });

      if (response.success) {
        toast.success(`Status updated successfully!`);
        fetchProductCatalog(); // Refresh the data
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

  // Handle status update cancel
  const handleStatusUpdateCancel = () => {
    setIsStatusModalOpen(false);
    setStatusChangeData(null);
  };

  // Handle delete
  const handleDelete = (productId: number, productName: string) => {
    setDeleteData({
      productId,
      productName,
    });
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteData) return;

    try {
      // TODO: Implement actual delete API call
      // For now, just remove from local state
      setProductData(prev => prev.filter(product => product.id !== deleteData.productId));
      toast.success('Product deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeleteData(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteData(null);
  };

  // Actions menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: ProductData) => {
    setAnchorEl(event.currentTarget);
    setSelectedActionProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActionProduct(null);
  };

  const handleMenuAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedActionProduct) return;

    handleMenuClose();

    switch (action) {
      case 'view':
        handleOpenViewModal(selectedActionProduct);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        toast.success('Edit functionality coming soon');
        break;
      case 'delete':
        handleDelete(selectedActionProduct.id, selectedActionProduct.name);
        break;
    }
  };

  // Handle attachment click
  const handleAttachmentClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Form submission handler
  const onSubmit = async (data: ProductCatalogForm) => {
    try {
      setSubmitting(true);
      
      // Prepare the data based on attachment type
      const submitData = {
        name: data.name,
        description: data.description,
        ...(attachmentType === 'file' ? { attachment: data.attachment } : { link: data.link }),
      };

      const response: any = await addProductCatalog(submitData);
      
      if (response.success) {
        toast.success('Product catalog created successfully!');
        setIsModalOpen(false);
        reset();
        setAttachmentType('file');
        fetchProductCatalog(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to create product catalog');
      }
    } catch (error) {
      console.error('Error creating product catalog:', error);
      toast.error('Failed to create product catalog');
    } finally {
      setSubmitting(false);
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setAttachmentType('file'); // Reset attachment type
    setSubmitting(false); // Reset submitting state
  };

  // View modal handlers
  const handleOpenViewModal = (product: ProductData) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProduct(null);
  };

  // Table columns configuration
  const columns: TableColumn<ProductData>[] = [
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
           />
         </Box>
       ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      align: 'center',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'attachment',
      label: 'Attachment/Link',
      align: 'center',
      minWidth: 120,
      render: (row) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={() => handleAttachmentClick(row.link || row.attachment)}
            sx={{
              color: theme.palette.primary.main,
              // '&:hover': {
              //   backgroundColor: theme.palette.primary.light,
              //   color: theme.palette.primary.contrastText,
              // },
            }}
            title={row.link ? "View Link" : "View Attachment"}
          >
            <AttachFileIcon />
          </IconButton>
        </Box>
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
            size="small"
            onClick={(event) => handleMenuOpen(event, row)}
            sx={{
              color: theme.palette.primary.main,
              // '&:hover': {
              //   backgroundColor: theme.palette.primary.light,
              //   color: theme.palette.primary.contrastText,
              // },
            }}
            title="More Actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProductCatalog(page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    fetchProductCatalog(1, newPageSize);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box display="flex" px={2} justifyContent="space-between" alignItems="center" >
        <Typography fontSize={16} color="text.primary">Product Catalog</Typography>
     
        {canAdd && (
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
        )}
      </Box>

      

      <CommonTable
        data={productData}
        columns={columns}
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
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

             {/* Add Product Catalog Modal */}
       <CommonModal
         open={isModalOpen}
         onClose={handleCloseModal}
         title="Add Product Catalog"
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
                   label="Product Name"
                   error={!!errors.name}
                   helperText={errors.name?.message}
                   placeholder="Enter product name"
                 />
               )}
             />

                          {/* Description Field */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Description *"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Enter product description"
                    multiline
                    rows={3}
                  />
                )}
              />

              {/* Attachment Type Selection */}
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', mb: 1 }}>
                  Attachment Type *
                </FormLabel>
                <RadioGroup
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as 'file' | 'link')}
                  row
                >
                  <FormControlLabel value="file" control={<Radio size="small" />} label="Upload PDF" />
                  <FormControlLabel value="link" control={<Radio size="small" />} label="Provide Link" />
                </RadioGroup>
              </FormControl>

              {/* Conditional Fields based on selection */}
              {attachmentType === 'file' ? (
                <Controller
                  name="attachment"
                  control={control}
                  render={({ field }) => (
                    <FileUploadInput
                      label="Attachment (PDF only) *"
                      onChange={(file) => field.onChange(file)}
                      error={!!errors.attachment}
                      helperText={errors.attachment?.message || "Only PDF files are allowed"}
                      accept=".pdf"
                    />
                  )}
                />
              ) : (
                <Controller
                  name="link"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label="Link *"
                      error={!!errors.link}
                      helperText={errors.link?.message || "Enter a valid URL"}
                      placeholder="https://example.com"
                    />
                  )}
                />
              )}

             {/* Action Buttons */}
             <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
               <CustomButton
                 appearance="outlined"
                 onClick={handleCloseModal}
                 type="button"
                 disabled={submitting}
               >
                 Cancel
               </CustomButton>
               <CustomButton
                 appearance="filled"
                 type="submit"
                 loading={submitting}
                 disabled={submitting}
               >
                 Create
               </CustomButton>
             </Box>
           </Box>
         </form>
       </CommonModal>

       {/* View Product Catalog Modal */}
       <CommonModal
         open={isViewModalOpen}
         onClose={handleCloseViewModal}
         title="Product Catalog Details"
         size="md"
       >
         {selectedProduct && (
           <Box sx={{ p: 2 }}>
             <Box sx={{ mb: 3 }}>
               <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
                 {selectedProduct.name}
               </Typography>
               
                               <Box sx={{ mb: 2 }}>
                  <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                    Description:
                  </Typography>
                  <Typography fontSize={14} fontWeight={400} color="text.secondary">
                    {selectedProduct.description}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                    Status:
                  </Typography>
                  <Typography fontSize={14} fontWeight={400} color="text.secondary">
                    {selectedProduct.status ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>

               <Box sx={{ mb: 2 }}>
                 <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                   Created At:
                 </Typography>
                 <Typography fontSize={14} fontWeight={400} color="text.secondary">
                   {new Date(selectedProduct.createdAt).toLocaleString()}
                 </Typography>
               </Box>

               {selectedProduct.link ? (
                 <Box sx={{ mb: 2 }}>
                   <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                     Link:
                   </Typography>
                   <Typography 
                     fontSize={14} 
                     fontWeight={400} 
                     color="text.secondary" 
                     sx={{ 
                       color: theme.palette.primary.main,
                       cursor: 'pointer',
                       textDecoration: 'underline',
                       '&:hover': { textDecoration: 'none' }
                     }}
                     onClick={() => handleAttachmentClick(selectedProduct.link!)}
                   >
                     {selectedProduct.link}
                   </Typography>
                 </Box>
               ) : (
                 <Box sx={{ mb: 2 }}>
                   <Typography fontSize={14} fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                     Attachment:
                   </Typography>
                   <Box display="flex" alignItems="center" gap={1}>
                     <AttachFileIcon sx={{ color: theme.palette.primary.main }} />
                     <Typography 
                       fontSize={14} 
                       fontWeight={400} 
                       color="text.secondary" 
                       sx={{ 
                         color: theme.palette.primary.main,
                         cursor: 'pointer',
                         textDecoration: 'underline',
                         '&:hover': { textDecoration: 'none' }
                       }}
                       onClick={() => handleAttachmentClick(selectedProduct.attachment)}
                     >
                       View Attachment
                     </Typography>
                   </Box>
                 </Box>
               )}
             </Box>

                           {/* Action Buttons */}
              <Box display="flex" justifyContent="flex-end">
                <CustomButton
                  appearance="outlined"
                  onClick={handleCloseViewModal}
                  size="small"
                  fullWidth={false}
                  sx={{ mt:0 }}
                >
                  Close
                </CustomButton>
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
            <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ mb: 3 }}>
              Are you sure you want to change the status of{' '}
              <strong>{statusChangeData?.productName}</strong> to{' '}
              <strong>{statusChangeData?.newStatus ? 'Active' : 'Inactive'}</strong>?
            </Typography>

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

        {/* Delete Confirmation Modal */}
        <CommonModal
          open={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          title="Confirm Deletion"
          size="sm"
        >
          <Box sx={{ p: 2 }}>
            <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ mb: 3 }}>
              Are you sure you want to delete the product catalog{' '}
              <strong>{deleteData?.productName}</strong>? This action cannot be undone.
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
                buttonType='delete'
                size="small"
                fullWidth={false}
                sx={{ mt:0 }}
                >
                Delete
              </CustomButton>
            </Box>
          </Box>
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
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Preview" />
          </MenuItem>
          {/* <MenuItem onClick={() => handleMenuAction('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem> */}
        </Menu>
      </Box>
    );
  };

export default ProductCatalog;