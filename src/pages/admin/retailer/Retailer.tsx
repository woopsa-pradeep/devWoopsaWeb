import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Paper, Grid, Chip, ToggleButton, ToggleButtonGroup, Pagination, FormControl, Select, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
import { customerList } from '../../../redux/apis/distrubutor/retailerApis';
import { customerForReport } from '../../../redux/apis/distrubutor/reportsApis';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useDebounce } from '../../../hooks/useDebounce';
import RetailerViewModal from '../../../component/molecules/RetailerViewModal';
import CustomerLimitModal from '../../../component/molecules/CustomerLimitModal';
import { setCustomerLimit } from '../../../redux/apis/distrubutor/settingApis';
import { CustomerLimitFormData } from './customerLimitSchema';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../component/atoms/CustomButton';
import Tooltip from '@mui/material/Tooltip';

function ActionMenu({ row, onView, onSetLimit, onEdit }: { row: any; onView: (row: any) => void; onSetLimit: (row: any) => void; onEdit: (row: any) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    onView(row);
    handleClose();
  };

  const handleSetLimit = () => {
    onSetLimit(row);
    handleClose();
  };

  const handleEdit = () => {
    onEdit(row);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleView} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><VisibilityIcon fontSize="small"/> View</MenuItem>
        <MenuItem onClick={handleEdit} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><EditIcon fontSize="small" sx={{ color: 'primary.main' }}/> Edit</MenuItem>
        {row?.isRegisterCustomer && <MenuItem onClick={handleSetLimit} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><SettingsIcon fontSize="small"/> Set Limit</MenuItem>}
      </Menu>
    </>
  );
}

const Retailer = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedLimitRetailer, setSelectedLimitRetailer] = useState<any>(null);
  const [savingLimit, setSavingLimit] = useState(false);

  // Detailed view state
  const [viewMode, setViewMode] = useState<'table' | 'detailed'>('detailed');
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedCurrentPage, setDetailedCurrentPage] = useState(1);
  const [detailedPageSize, setDetailedPageSize] = useState(10);
  const [detailedTotalItems, setDetailedTotalItems] = useState(0);
  const [detailedTotalPages, setDetailedTotalPages] = useState(0);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: { [section: string]: boolean } }>({});
  const [firstOpenedCard, setFirstOpenedCard] = useState<string | null>(null);

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize
      };
      const res = await customerList(params) as any;
      setRetailers(res?.data?.customerList || []);
      setTotalItems(res?.data?.totalCount || 0);
      setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching retailers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'table') {
      fetchRetailers();
    }
  }, [currentPage, pageSize, debouncedSearch, viewMode]);

  // Store all fetched data and filtered data
  const [allFetchedData, setAllFetchedData] = useState<any[]>([]);
  const [allFilteredData, setAllFilteredData] = useState<any[]>([]);
  const [documentsMap, setDocumentsMap] = useState<{ [key: number]: any }>({});
  const [fetchedCustomers, setFetchedCustomers] = useState<Set<number>>(new Set());

  // Fetch all data (API doesn't support pagination)
  useEffect(() => {
    if (viewMode === 'detailed') {
      let ignore = false;
      const fetchAllDetailedRetailers = async () => {
        setDetailedLoading(true);
        try {
          // API returns all data, no pagination support
          const res = await customerForReport() as any;
          let list = [];
          
          // Handle different response formats
          if (Array.isArray(res?.data?.data)) {
            list = res.data.data;
          } else if (res?.data && !Array.isArray(res.data)) {
            list = [res.data];
          } else if (Array.isArray(res?.data)) {
            list = res.data;
          }
          
          if (!ignore) {
            setAllFetchedData(list);
          }
        } catch (error) {
          console.error('Error fetching detailed retailers:', error);
          toast.error('Failed to load detailed retailers');
          if (!ignore) {
            setAllFetchedData([]);
          }
        } finally {
          if (!ignore) setDetailedLoading(false);
        }
      };
      fetchAllDetailedRetailers();
      return () => { ignore = true; };
    }
  }, [viewMode]);

  // Fetch documents when searching by customer number
  useEffect(() => {
    if (viewMode === 'detailed' && debouncedSearch) {
      const searchNumber = debouncedSearch.trim();
      // Check if search is a customer number (numeric) - allow partial matches too
      const isCustomerNumber = /^\d+$/.test(searchNumber);
      
      if (isCustomerNumber && searchNumber.length > 0) {
        let ignore = false;
        const fetchDocumentsForCustomer = async () => {
          try {
            console.log('Fetching documents for customer number:', searchNumber);
            const params = {
              search: searchNumber,
              page: 1,
              limit: 100, // Get enough to find the customer
            };
            console.log('Calling customerList API with params:', params);
            const apiResponse = await customerList(params) as any;
            console.log('customerList API response:', apiResponse);
            const customersWithDocs = apiResponse?.data?.customerList || [];
            console.log('Customers with docs:', customersWithDocs);
            
            if (!ignore && customersWithDocs.length > 0) {
              // Find the EXACT customer number match (not partial matches)
              const exactMatchCustomer = customersWithDocs.find((c: any) => 
                c.C_Number?.toString() === searchNumber
              );
              
              if (exactMatchCustomer) {
                // Only store documents for the exact matching customer
                if (exactMatchCustomer.retailerDocuments) {
                  setDocumentsMap(prev => ({ 
                    ...prev, 
                    [exactMatchCustomer.C_Number]: exactMatchCustomer.retailerDocuments 
                  }));
                }
                
                const cardId = `card-${exactMatchCustomer.C_Number}`;
                
                // Set the accordion to expand
                setExpandedCards(prev => ({ ...prev, [cardId]: true }));
                setFirstOpenedCard(cardId);
                
                // Find the customer in allFetchedData to determine which page it's on
                // Use a small delay to ensure allFetchedData is available
                setTimeout(() => {
                  const customerIndex = allFetchedData.findIndex((item: any) => 
                    item.C_Number?.toString() === searchNumber
                  );
                  
                  if (customerIndex >= 0) {
                    // Navigate to the page containing this customer
                    const pageNumber = Math.floor(customerIndex / detailedPageSize) + 1;
                    setDetailedCurrentPage(pageNumber);
                  }
                }, 100);
              }
            }
          } catch (error) {
            console.error('Error fetching documents:', error);
          }
        };
        fetchDocumentsForCustomer();
        return () => { ignore = true; };
      } else {
        // Clear documents map when search is not a customer number
        setDocumentsMap({});
      }
    }
  }, [debouncedSearch, viewMode]);

  // Filter and paginate data client-side
  useEffect(() => {
    if (viewMode === 'detailed') {
      let filtered = [...allFetchedData];
      
      // Apply search filter (Customer Number, Customer Name, Route Number)
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const searchNumber = debouncedSearch.trim();
        filtered = filtered.filter((item: any) => {
          // Search in customer number
          if (item.C_Number?.toString().includes(searchNumber)) return true;
          
          // Search in customer name
          if (item.C_Name?.toLowerCase().includes(searchLower)) return true;
          
          // Search in route numbers
          if (item.Routes && Array.isArray(item.Routes)) {
            const hasMatchingRoute = item.Routes.some((route: any) => 
              route.Route_Number?.toString().includes(searchNumber)
            );
            if (hasMatchingRoute) return true;
          }
          
          // Also search in other fields
          if (item.C_Email?.toLowerCase().includes(searchLower)) return true;
          if (item.C_Phone?.includes(searchNumber)) return true;
          if (item.C_PhoneMobile?.includes(searchNumber)) return true;
          
          return false;
        });
      }
      
      // Merge documents from documentsMap into filtered data
      filtered = filtered.map((item: any) => {
        if (documentsMap[item.C_Number]) {
          return {
            ...item,
            retailerDocuments: documentsMap[item.C_Number]
          };
        }
        return item;
      });
      
      setAllFilteredData(filtered);
      setDetailedTotalItems(filtered.length);
      setDetailedTotalPages(Math.ceil(filtered.length / detailedPageSize));
      
      // Reset to first page when search changes (unless it's a customer number search handled by document fetch)
      const isCustomerNumber = debouncedSearch && /^\d+$/.test(debouncedSearch.trim());
      if (debouncedSearch && !isCustomerNumber) {
        setDetailedCurrentPage(1);
      }
    }
  }, [allFetchedData, debouncedSearch, viewMode, detailedPageSize, documentsMap]);

  // Paginate the filtered data when page or page size changes
  useEffect(() => {
    if (viewMode === 'detailed' && allFilteredData.length > 0) {
      const startIndex = (detailedCurrentPage - 1) * detailedPageSize;
      const endIndex = startIndex + detailedPageSize;
      const paginatedList = allFilteredData.slice(startIndex, endIndex);
      setDetailedData(paginatedList);
      setDetailedTotalPages(Math.ceil(allFilteredData.length / detailedPageSize));
    } else if (viewMode === 'detailed' && allFilteredData.length === 0) {
      setDetailedData([]);
    }
  }, [detailedCurrentPage, detailedPageSize, allFilteredData, viewMode]);

  // Auto-expand accordion when searched customer appears on current page
  useEffect(() => {
    if (viewMode === 'detailed' && debouncedSearch && detailedData.length > 0) {
      const searchNumber = debouncedSearch.trim();
      const isCustomerNumber = /^\d+$/.test(searchNumber);
      
      if (isCustomerNumber) {
        // Check if the searched customer is in the current page data
        const foundCustomer = detailedData.find((item: any) => 
          item.C_Number?.toString() === searchNumber
        );
        
        if (foundCustomer) {
          const cardId = `card-${foundCustomer.C_Number}`;
          // Expand the accordion
          setExpandedCards(prev => ({ ...prev, [cardId]: true }));
          if (firstOpenedCard === null) {
            setFirstOpenedCard(cardId);
          }
        }
      }
    }
  }, [detailedData, debouncedSearch, viewMode, firstOpenedCard]);

  // Fetch documents when a customer accordion is opened
  useEffect(() => {
    if (viewMode === 'detailed') {
      // Find newly expanded cards that don't have documents yet
      Object.keys(expandedCards).forEach((cardId) => {
        if (expandedCards[cardId]) {
          // Extract customer number from cardId (format: "card-1000")
          const customerNumber = cardId.replace('card-', '');
          const customerNum = parseInt(customerNumber);
          
          // Check if we already have documents or have already fetched for this customer
          if (customerNum && !documentsMap[customerNum] && !fetchedCustomers.has(customerNum)) {
            // Check if this customer is in the current page data
            const customer = detailedData.find((item: any) => 
              item.C_Number?.toString() === customerNumber
            );
            
            if (customer) {
              // Mark as fetching to prevent duplicate calls
              setFetchedCustomers(prev => new Set(prev).add(customerNum));
              
              const ignore = false;
              const fetchDocumentsForOpenedCustomer = async () => {
                try {
                  console.log('Fetching documents for opened customer:', customerNumber);
                  const params = {
                    search: customerNumber,
                    page: 1,
                    limit: 100,
                  };
                  const apiResponse = await customerList(params) as any;
                  const customersWithDocs = apiResponse?.data?.customerList || [];
                  
                  if (!ignore && customersWithDocs.length > 0) {
                    // Find the EXACT customer number match (not partial matches)
                    const exactMatchCustomer = customersWithDocs.find((cust: any) => 
                      cust.C_Number?.toString() === customerNumber
                    );
                    
                    // Only store documents for the exact matching customer
                    if (exactMatchCustomer && exactMatchCustomer.retailerDocuments) {
                      setDocumentsMap(prev => ({ 
                        ...prev, 
                        [exactMatchCustomer.C_Number]: exactMatchCustomer.retailerDocuments 
                      }));
                    }
                  }
                } catch (error) {
                  console.error('Error fetching documents for opened customer:', error);
                  // Remove from fetched set on error so we can retry
                  setFetchedCustomers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(customerNum);
                    return newSet;
                  });
                }
              };
              fetchDocumentsForOpenedCustomer();
            }
          }
        }
      });
    }
  }, [expandedCards, viewMode, detailedData, documentsMap]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const onViewRetailer = (retailer: any) => {
    setSelectedRetailer(retailer);
    setViewModalOpen(true);
  };

  const onSetLimitRetailer = (retailer: any) => {
    setSelectedLimitRetailer(retailer);
    setLimitModalOpen(true);
  };

  const onEditRetailer = (retailer: any) => {
    navigate(`/admin/retailer/edit/${retailer.C_Number}`);
  };

  const handleLimitSubmit = async (data: CustomerLimitFormData) => {
    if (!selectedLimitRetailer) return;
    
    setSavingLimit(true);
    try {
      await setCustomerLimit(selectedLimitRetailer.C_Number, data);
      toast.success('Customer limit updated successfully!');
      await fetchRetailers(); // Fetch updated data after successful limit update
      setLimitModalOpen(false);
      setSelectedLimitRetailer(null);
    } catch (error) {
      console.error('Failed to update customer limit:', error);
      toast.error('Failed to update customer limit');
    } finally {
      setSavingLimit(false);
    }
  };

  // Shop SVG Icon Component
  const ShopIcon = ({ size = 100 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M9 22V12H15V22" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  // Render detailed view card
  const renderDetailedCard = (item: any, index: number) => {
    const cardId = `card-${item.C_Number}`;
    
    // Default: only first card open, but allow multiple to be open
    const isFirstCard = index === 0;
    const shouldBeExpandedByDefault = isFirstCard && firstOpenedCard === null;
    const isCardExpanded = expandedCards[cardId] !== undefined 
      ? expandedCards[cardId] 
      : shouldBeExpandedByDefault;
    
    // Set first opened card on mount
    if (isFirstCard && firstOpenedCard === null) {
      setFirstOpenedCard(cardId);
      setExpandedCards(prev => ({ ...prev, [cardId]: true }));
    }
    
    // Initialize expanded sections for this card if not exists
    if (!expandedSections[cardId]) {
      setExpandedSections(prev => ({
        ...prev,
        [cardId]: {
          profile: true,
          contact: true,
          business: true,
          financial: true,
          routes: true,
          documents: true,
          additional: true,
        }
      }));
    }
    
    const sectionExpanded = expandedSections[cardId] || {};
    
    return (
      <Accordion
        key={item.C_Number || index}
        expanded={isCardExpanded}
        onChange={(_, expanded) => {
          setExpandedCards(prev => ({ ...prev, [cardId]: expanded }));
          if (expanded && firstOpenedCard === null) {
            setFirstOpenedCard(cardId);
          }
        }}
        sx={{ 
          mb: 1.5, 
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:before': { display: 'none' },
          transition: 'all 0.3s ease-in-out',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50',
            px: 1.5,
            py: 1,
            minHeight: 56,
            '&.Mui-expanded': { minHeight: 56 },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Box display="flex" alignItems="center" gap={{ xs: 1, md: 2 }} width="100%" sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <Box
              sx={{
                width: { xs: 60, md: 100 },
                height: { xs: 60, md: 100 },
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShopIcon size={80} />
            </Box>
            <Box flex={1} minWidth={0} sx={{ maxWidth: '100%', overflow: 'hidden' }}>
              <Typography 
                fontSize={{ xs: 12, md: 14 }} 
                fontWeight={500} 
                color="primary.main" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, md: 1 },
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {item.C_Name || 'N/A'}
              </Typography>
              <Box display="flex" gap={{ xs: 0.5, md: 1 }} mt={0.5} flexWrap="wrap" sx={{ maxWidth: '100%' }}>
                <Chip label={`#${item.C_Number}`} size="small" sx={{ height: 20, fontSize: 10 }} />
                <Chip 
                  label={!item.C_Inactive ? 'Active' : 'Inactive'} 
                  size="small" 
                  color={!item.C_Inactive ? 'success' : 'error'}
                  sx={{ height: 20, fontSize: 9 }} 
                />
                {item.salesRep?.S_Desc && (
                  <Chip 
                    label={item.salesRep.S_Desc} 
                    size="small" 
                    sx={{ height: 20, fontSize: 9 }} 
                  />
                )}
                {item.classOfTrade?.Trade_Desc && (
                  <Chip 
                    label={item.classOfTrade.Trade_Desc} 
                    size="small" 
                    sx={{ height: 20, fontSize: 9 }} 
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={{ xs: 0.25, md: 0.5 }} flexShrink={0}>
              <Tooltip title="View Details">
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRetailer(item);
                  }}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    p: { xs: 0.5, md: 1 }
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: { xs: 16, md: 18 } }} color="primary" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Retailer">
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRetailer(item);
                  }}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    p: { xs: 0.5, md: 1 }
                  }}
                >
                  <EditIcon sx={{ fontSize: { xs: 16, md: 18 } }} color="primary" />
                </IconButton>
              </Tooltip>
              {item?.isRegisterCustomer && (
                <Tooltip title="Set Limit">
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetLimitRetailer(item);
                    }}
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider',
                      p: { xs: 0.5, md: 1 }
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: { xs: 16, md: 18 } }} color="secondary" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 0.5, md: 1 }, maxWidth: '100%', overflow: 'hidden' }}>
          <Grid container spacing={{ xs: 1, md: 1.5 }} sx={{ maxWidth: '100%', margin: 0 }}>
            {/* Customer Profile Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex', maxWidth: '100%' }}>
              <Accordion
                expanded={sectionExpanded.profile !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], profile: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  maxWidth: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                    maxWidth: '100%',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Customer Profile
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Customer ID:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Number || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Company Name:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_CoName || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Sales Rep:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.salesRep?.S_Desc || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Class of Trade:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.classOfTrade?.Trade_Desc || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Contact Details Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.contact !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], contact: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Contact Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Address:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Address || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">City:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_City || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">State:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_State || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Zip:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Zip || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Phone:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Phone || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Mobile:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_PhoneMobile || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Email:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Email || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Fax:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Fax || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Country:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_Country || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Business Details Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.business !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], business: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Business Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Sales Tax Number:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_SalesTaxNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig License Number:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_CigtLicenseNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">FEIN:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_FEIN || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Credit Limit:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(item.Credit_Limit || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Terms:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.terms?.Terms || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Balance:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(item.LastBalance || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Invoice:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.LastInvoiceNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Invoice Amount:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(item.LastInvoiceAmount || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Pricing Account:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_PricingAccount || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number 2:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber2 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Other License Number 3:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OtherLicenseNumber3 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Order Day:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OrderDay || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Order Day Sequence:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OrderDaySequence || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail Rounding:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_RetailRounding || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Operation Hours 1:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OperationHours1 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Operation Hours 2:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.C_OperationHours2 || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Delivery ID:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.Delivery_ID || 'N/A'}</Typography>
                    </Box>
                    {item.C_Memo && (
                      <Box>
                        <Typography fontSize={11} color="text.secondary" mb={0.5}>Memo:</Typography>
                        <Typography fontSize={11} fontWeight={400} sx={{ whiteSpace: 'pre-wrap' }}>{item.C_Memo}</Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Financial Details Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.financial !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], financial: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Financial Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Invoice Date:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.LastInvoiceDate ? new Date(item.LastInvoiceDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Payment Date:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.LastPaymentDate ? new Date(item.LastPaymentDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Last Payment Amount:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(item.LastPaymentAmount || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Delivery Amount:</Typography>
                      <Typography fontSize={11} fontWeight={500}>${Number(item.Delivery_Amount || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Tax Rate:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.taxRate?.TaxDescription || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Tax Rate City:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.taxRateCity?.TaxDescription || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Tax Rate County:</Typography>
                      <Typography fontSize={11} fontWeight={500}>{item.taxRateCounty?.TaxDescription || 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exp Date Sales Tax:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_SalesTax ? new Date(item.ExpDate_SalesTax).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exp Date Cig Tax:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_CigtTax ? new Date(item.ExpDate_CigtTax).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exp Date Other Tax:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax ? new Date(item.ExpDate_OtherTax).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exp Date Other Tax 2:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax2 ? new Date(item.ExpDate_OtherTax2).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exp Date Other Tax 3:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.ExpDate_OtherTax3 ? new Date(item.ExpDate_OtherTax3).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Routes Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.routes !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], routes: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Routes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {item.Routes && item.Routes.length > 0 ? (
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {item.Routes.map((route: any, idx: number) => (
                        <Chip 
                          key={idx}
                          label={`Route ${route.Route_Number}`}
                          size="small"
                          sx={{ height: 20, fontSize: 9 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography fontSize={11} color="text.secondary">No routes assigned</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Documents Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.documents !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], documents: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Documents
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {item.retailerDocuments ? (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {item.retailerDocuments.feinDocument && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary" mb={0.5}>FEIN Document:</Typography>
                          <Typography 
                            component="a"
                            href={item.retailerDocuments.feinDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize={11}
                            fontWeight={500}
                            color="primary.main"
                            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            View FEIN Document
                          </Typography>
                        </Box>
                      )}
                      {item.retailerDocuments.salesTaxDoc && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary" mb={0.5}>Sales Tax Document:</Typography>
                          <Typography 
                            component="a"
                            href={item.retailerDocuments.salesTaxDoc}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize={11}
                            fontWeight={500}
                            color="primary.main"
                            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            View Sales Tax Document
                          </Typography>
                        </Box>
                      )}
                      {item.retailerDocuments.CigTaxDoc && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary" mb={0.5}>Cig Tax Document:</Typography>
                          <Typography 
                            component="a"
                            href={item.retailerDocuments.CigTaxDoc}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize={11}
                            fontWeight={500}
                            color="primary.main"
                            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            View Cig Tax Document
                          </Typography>
                        </Box>
                      )}
                      {item.retailerDocuments.attachments && item.retailerDocuments.attachments.length > 0 && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary" mb={0.5}>Attachments:</Typography>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {item.retailerDocuments.attachments.map((url: string, idx: number) => (
                              <Typography 
                                key={idx}
                                component="a"
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                fontSize={11}
                                fontWeight={500}
                                color="primary.main"
                                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                Attachment {idx + 1}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}
                      {item.retailerDocuments.licenseAttachments && item.retailerDocuments.licenseAttachments.length > 0 && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary" mb={0.5}>License Attachments:</Typography>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {item.retailerDocuments.licenseAttachments.map((url: string, idx: number) => (
                              <Typography 
                                key={idx}
                                component="a"
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                fontSize={11}
                                fontWeight={500}
                                color="primary.main"
                                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                License Attachment {idx + 1}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}
                      {!item.retailerDocuments.feinDocument && 
                       !item.retailerDocuments.salesTaxDoc && 
                       !item.retailerDocuments.CigTaxDoc && 
                       (!item.retailerDocuments.attachments || item.retailerDocuments.attachments.length === 0) &&
                       (!item.retailerDocuments.licenseAttachments || item.retailerDocuments.licenseAttachments.length === 0) && (
                        <Typography fontSize={11} color="text.secondary">No documents available</Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography fontSize={11} color="text.secondary">No documents available</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Additional Information Section */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.additional !== false}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], additional: expanded }
                  }));
                }}
                defaultExpanded
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiAccordionDetails-root': {
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Additional Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Date Created:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        {item.C_DateCreated ? new Date(item.C_DateCreated).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Inactive:</Typography>
                      <Chip 
                        label={item.C_Inactive ? 'Yes' : 'No'} 
                        size="small" 
                        color={item.C_Inactive ? 'error' : 'success'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Is Register Customer:</Typography>
                      <Chip 
                        label={item.isRegisterCustomer ? 'Yes' : 'No'} 
                        size="small" 
                        color={item.isRegisterCustomer ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    {item.customerLimit && (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Max Order Limit:</Typography>
                          <Typography fontSize={11} fontWeight={500}>
                            {item.customerLimit.maxOrderLimit !== null ? `$${Number(item.customerLimit.maxOrderLimit).toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Min Order Amount:</Typography>
                          <Typography fontSize={11} fontWeight={500}>
                            {item.customerLimit.minOrderAmount !== null ? `$${Number(item.customerLimit.minOrderAmount).toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                      </>
                    )}
                    {item.orderStats && (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Web Orders:</Typography>
                          <Typography fontSize={11} fontWeight={500}>{item.orderStats.Web || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">Mobile Orders:</Typography>
                          <Typography fontSize={11} fontWeight={500}>{item.orderStats.Mobile || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontSize={11} color="text.secondary">ERP Orders:</Typography>
                          <Typography fontSize={11} fontWeight={500}>{item.orderStats.ERP || 0}</Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const columns: TableColumn<any>[] = [
    { id: 'C_Number', label: 'Customer ID', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Number || "-"}</Typography> },
    { id: 'C_Name', label: 'Customer Name', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Name || "-"}</Typography> },
    { id: 'C_PhoneMobile', label: 'Phone number', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_PhoneMobile || "-"}</Typography> },
    { id: 'C_Email', label: 'Email address', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Email || "-"}</Typography> },
    {
      id: 'C_Inactive',
      label: 'Status',
      render: (row) => (
        <Box
          sx={{
            color: !row.C_Inactive ? 'rgb(8, 194, 33)' : 'rgb(255, 102, 102)',
            bgcolor: !row.C_Inactive ? 'rgba(10, 255, 112, 0.1)' : 'rgba(255, 102, 102, 0.1)',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 400,
            display: 'inline-block',
          }}
        >
          {!row.C_Inactive ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
    {
      id: 'web_order',
      label: 'Web Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.Web ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.Web ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.Web || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'mobile_order',
      label: 'Mobile Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.Mobile ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.Mobile ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.Mobile || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'ERP Order',
      label: 'ERP Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.ERP ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.ERP ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.ERP || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => <ActionMenu row={row} onView={onViewRetailer} onSetLimit={onSetLimitRetailer} onEdit={onEditRetailer} />,
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, pt: { xs: 1, md: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between" 
        mb={2} 
        mt={0}
        gap={{ xs: 2, md: 0 }}
        sx={{ width: '100%' }}
      >
        <Typography 
          fontSize={{ xs: 16, md: 18 }} 
          fontWeight={400} 
          color="text.primary"
          sx={{ mb: { xs: 1, md: 0 } }}
        >
          Retailers
        </Typography>
        <Box 
          display="flex" 
          gap={{ xs: 1, md: 2 }} 
          alignItems="center"
          flexWrap="wrap"
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1, md: 1.5 },
              }
            }}
          >
            <ToggleButton value="table">
              <ViewListIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Table</Box>
            </ToggleButton>
            <ToggleButton value="detailed">
              <ViewModuleIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Detailed</Box>
            </ToggleButton>
          </ToggleButtonGroup>
          <CustomButton 
            fullWidth={false}
            onClick={() => navigate('/admin/retailer/add')}
            icon={<AddIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            iconPosition="left"
            sx={{ 
              mt: 0,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              px: { xs: 1, md: 1.5 },
              '& .MuiButton-startIcon': {
                mr: { xs: 0.5, md: 1 }
              }
            }} 
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Retailer</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          </CustomButton>
        </Box>
      </Box>
      <Paper
        sx={{ mb: 2, boxShadow: 'none', borderRadius: '0px', maxWidth: '100%', overflow: 'hidden' }}
      >
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between" 
        p={{ xs: 1, md: 2 }}
        sx={{ maxWidth: '100%', overflow: 'hidden' }}
      >
        <Box display="flex" alignItems="center" gap={2} sx={{ width: '100%' }}>
          <TextInput
            placeholder="Search Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', md: 220 } }}
          />
        </Box>
      </Box>
      {viewMode === 'table' ? (
        <CommonTable
          data={retailers}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
          containerHeight="calc(100vh - 393px)"
        />
      ) : (
        <Box 
          sx={{ 
            maxWidth: '100%', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 280px)',
            '@media (max-width: 1024px)': {
              height: 'calc(100vh - 240px)',
            },
            '@media (max-width: 600px)': {
              height: 'calc(100vh - 200px)',
            },
          }}
        >
          <Box 
            px={{ xs: 1, md: 2 }} 
            pb={{ xs: 1, md: 2 }} 
            sx={{ 
              maxWidth: '100%', 
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#555',
              },
            }}
          >
            {detailedLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
              </Box>
            ) : detailedData.length > 0 ? (
              <>
                {detailedData.map((item, index) => renderDetailedCard(item, index))}
              </>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="text.secondary">No retailers found</Typography>
              </Box>
            )}
          </Box>
          {!detailedLoading && detailedData.length > 0 && (
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                py: { xs: 1, md: 1.5 },
                px: { xs: 1, md: 2 },
                zIndex: 10,
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 -2px 8px rgba(0,0,0,0.5)' : '0 -2px 8px rgba(0,0,0,0.1)',
                maxWidth: '100%',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Box 
                display="flex" 
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={{ xs: 1, sm: 0 }}
                sx={{ maxWidth: '100%' }}
              >
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ maxWidth: '100%' }}>
                  <FormControl size="small" sx={{ minWidth: { xs: 60, md: 70 } }}>
                    <Select
                      value={detailedPageSize}
                      onChange={(e) => {
                        setDetailedPageSize(Number(e.target.value));
                        setDetailedCurrentPage(1);
                      }}
                      sx={{ 
                        bgcolor: 'background.paper',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: '28px', md: '32px' },
                        '& .MuiSelect-select': {
                          py: 0.5,
                          color: 'text.primary',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                      }}
                      displayEmpty
                    >
                      <MenuItem value={10} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>10</MenuItem>
                      <MenuItem value={25} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>25</MenuItem>
                      <MenuItem value={50} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>50</MenuItem>
                      <MenuItem value={100} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>100</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography fontSize={{ xs: 10, md: 12 }} color="text.secondary" sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                    Showing {((detailedCurrentPage - 1) * detailedPageSize) + 1}-{Math.min(detailedCurrentPage * detailedPageSize, detailedTotalItems)} of {detailedTotalItems} items
                  </Typography>
                </Box>
                <Pagination
                  count={detailedTotalPages}
                  page={detailedCurrentPage}
                  onChange={(_, page) => setDetailedCurrentPage(page)}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      bgcolor: 'background.paper',
                      fontSize: { xs: '0.7rem', md: '0.875rem' },
                      minWidth: { xs: '28px', md: '32px' },
                      height: { xs: '28px', md: '32px' },
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                    '& .Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderColor: 'primary.main',
                    },
                    '& .MuiPaginationItem-root:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'grey.100',
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      )}
      </Paper>
      
      <RetailerViewModal
        retailer={selectedRetailer}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
      
      <CustomerLimitModal
        open={limitModalOpen}
        onClose={() => {
          setLimitModalOpen(false);
          setSelectedLimitRetailer(null);
        }}
        customerId={selectedLimitRetailer?.C_Number || ''}
        customerName={selectedLimitRetailer?.C_Name || ''}
        initialData={{
          maxOrderLimit: selectedLimitRetailer?.customerLimit?.maxOrderLimit,
          minOrderAmount: selectedLimitRetailer?.customerLimit?.minOrderAmount,
        }}
        onSubmit={handleLimitSubmit}
        loading={savingLimit}
      />
    </Box>
  );
};

export default Retailer;