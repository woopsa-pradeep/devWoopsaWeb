import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';

import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import { getProductCatalog } from '../../../redux/apis/retailer/productCatalogApis';



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

const ProductCatalog: React.FC = () => {
  const theme = useTheme();
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  
  // Data state
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  


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



  // Handle attachment click
  const handleAttachmentClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
        <Typography variant="body2" fontWeight={500}>
          {row.name}
        </Typography>
      ),
    },
    
    {
      id: 'createdAt',
      label: 'Created At',
      align: 'center',
      minWidth: 150,
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'attachment',
      label: 'Attachment/Link',
      align: 'center',
      minWidth: 120,
      render: (row) => {
        const hasAttachment = row.attachment && row.attachment.trim() !== '';
        const hasLink = row.link && row.link.trim() !== '';
        const url = hasAttachment ? row.attachment : (hasLink ? (row.link || '') : '');
        const title = hasAttachment ? 'View Attachment' : 'View Link';
        
        return (
          <Box display="flex" justifyContent="center">
            <IconButton
              onClick={() => handleAttachmentClick(url)}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                },
              }}
              title={title}
            >
              <AttachFileIcon />
            </IconButton>
          </Box>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      minWidth: 120,
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={1}>
          <IconButton
            onClick={() => handleOpenViewModal(row)}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
              },
            }}
            title="View Details"
          >
            <VisibilityOutlined />
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
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
       
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          Product Catalog
        </Typography>
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
               <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                 {selectedProduct.name}
               </Typography>
               
                               <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Description:
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {selectedProduct.description}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Status:
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {selectedProduct.status ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>

               <Box sx={{ mb: 2 }}>
                 <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                   Created At:
                 </Typography>
                 <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                   {new Date(selectedProduct.createdAt).toLocaleString()}
                 </Typography>
               </Box>

               {selectedProduct.link && selectedProduct.link.trim() !== '' ? (
                 <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                     Link:
                   </Typography>
                   <Box display="flex" alignItems="center" gap={1}>
                     <AttachFileIcon sx={{ color: theme.palette.primary.main }} />
                     <Typography 
                       variant="body2" 
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
                 </Box>
               ) : (
                 <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                     Attachment:
                   </Typography>
                   <Box display="flex" alignItems="center" gap={1}>
                     <AttachFileIcon sx={{ color: theme.palette.primary.main }} />
                     <Typography 
                       variant="body2" 
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

export default ProductCatalog;