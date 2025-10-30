import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  useTheme,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  Divider,
  Link,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { getSupportTicketList, updateSupportTicket } from '../../../redux/apis/distrubutor/supportTicketApis';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';

interface SupportTicket {
  id: number;
  subject: string;
  contactNumber: string;
  description: string;
  attachment: string | null;
  completeNote: string | null;
  C_Number: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    C_Name: string;
    C_Number: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-ticket-tabpanel-${index}`}
      aria-labelledby={`support-ticket-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `support-ticket-tab-${index}`,
    'aria-controls': `support-ticket-tabpanel-${index}`,
  };
}

const SupportTickets: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Status dropdown state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Completion note modal state
  const [completionNoteModalOpen, setCompletionNoteModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const tabLabels = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Archived'];
  const statusValues = ['open', 'inProgress', 'onHold', 'resolved', 'archived'];

  const fetchTickets = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await getSupportTicketList(status);
      
      if (response && response.data) {
        setTickets(response.data.data || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(response.data.page || 1);
      } else {
        setTickets([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
      setError('Failed to load support tickets');
      setTickets([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch tickets for the default tab (open)
    fetchTickets('open');
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const status = statusValues[newValue];
    fetchTickets(status);
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>, ticketId: number) => {
    setStatusMenuAnchor(event.currentTarget);
    setSelectedTicketId(ticketId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedTicketId(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;
    
    // If status is being changed to resolved, show completion note modal
    if (newStatus.toLowerCase() === 'resolved') {
      setPendingStatusChange(newStatus);
      setCompletionNoteModalOpen(true);
      // Don't close the menu yet, just hide it
      setStatusMenuAnchor(null);
      return;
    }
    
    try {
      // Call API to update ticket status
      await updateSupportTicket(selectedTicketId.toString(), { status: newStatus });
      
      // Refresh the current tab data
      const currentStatus = statusValues[tabValue];
      await fetchTickets(currentStatus);
      
      handleStatusMenuClose();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      handleStatusMenuClose();
    }
  };

  const handleCompletionNoteSubmit = async () => {
    if (!selectedTicketId || !pendingStatusChange) return;
    try {
      // Call API to update ticket status with completion note
      await updateSupportTicket(selectedTicketId.toString(), { 
        status: pendingStatusChange,
        completeNote: completionNote 
      });
      
      // Refresh the current tab data
      const currentStatus = statusValues[tabValue];
      await fetchTickets(currentStatus);
      
      // Reset modal state and close menu
      setCompletionNoteModalOpen(false);
      setCompletionNote('');
      setPendingStatusChange(null);
      setSelectedTicketId(null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setCompletionNoteModalOpen(false);
      setCompletionNote('');
      setPendingStatusChange(null);
      setSelectedTicketId(null);
    }
  };

  const handleCompletionNoteCancel = () => {
    setCompletionNoteModalOpen(false);
    setCompletionNote('');
    setPendingStatusChange(null);
    setSelectedTicketId(null);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedTicket(null);
  };

  // Define table columns
  const columns: TableColumn<SupportTicket>[] = [
    {
      id: 'id',
      label: 'Id',
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.id}
        </Typography>
      )
    },
    {
      id: 'subject',
      label: 'Subject',
      align: 'left',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.subject}
        </Typography>
      )
    },
    {
      id: 'contactNumber',
      label: 'Contact',
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.contactNumber}
        </Typography>
      )
    },
    {
      id: 'customer',
      label: 'Customer Name',
      align: 'left',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.customer?.C_Name || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => {
        const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
            case 'open':
              return theme.palette.warning.main;
            case 'inprogress':
              return theme.palette.info.main;
            case 'onhold':
              return theme.palette.error.main;
            case 'resolved':
              return theme.palette.success.main;
            case 'archived':
              return theme.palette.grey[500];
            default:
              return theme.palette.grey[500];
          }
        };

        const getStatusLabel = (status: string) => {
          switch (status.toLowerCase()) {
            case 'open':
              return 'Open';
            case 'inprogress':
              return 'In Progress';
            case 'onhold':
              return 'On Hold';
            case 'resolved':
              return 'Resolved';
            case 'archived':
              return 'Archived';
            default:
              return status;
          }
        };

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: `${getStatusColor(row.status)}20`,
                color: getStatusColor(row.status),
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                border: `1px solid ${getStatusColor(row.status)}40`,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: `${getStatusColor(row.status)}30`,
                },
              }}
              onClick={(e) => handleStatusClick(e, row.id)}
            >
              {getStatusLabel(row.status)}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => handleStatusClick(e, row.id)}
              sx={{
                p: 0.5,
                color: getStatusColor(row.status),
                '&:hover': {
                  backgroundColor: `${getStatusColor(row.status)}10`,
                },
              }}
            >
              <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>
        );
      }
    },
    {
      id: 'createdAt',
      label: 'Created',
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString()}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <IconButton
          size="small"
          onClick={() => handleViewTicket(row)}
          sx={{
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
            },
          }}
        >
          <VisibilityIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      <Typography fontSize={16} fontWeight={400} color="text.primary">
        Support Tickets
      </Typography>
      
      {/* Status Change Dropdown Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: {
            minWidth: 150,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          },
        }}
      >
        {tabLabels.map((label, index) => {
          const statusValue = statusValues[index];
          const currentTicket = tickets.find(ticket => ticket.id === selectedTicketId);
          
          // Don't show the current status in the dropdown
          if (currentTicket && currentTicket.status.toLowerCase() === statusValue.toLowerCase()) {
            return null;
          }
          
          return (
            <MenuItem
              key={statusValue}
              onClick={() => handleStatusChange(statusValue)}
              sx={{
                py: 1,
                px: 2,
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                },
              }}
            >
              {label}
            </MenuItem>
          );
        })}
      </Menu>
      
        <Box >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="support ticket tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mt: 2, minHeight: "35px !important" }}
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={index}
                label={label}
                {...a11yProps(index)}
                sx={{
                  backgroundColor: tabValue === index ? "primary.main" : "transparent",
                  color: tabValue === index ? "white" : "text.secondary",
                  borderRadius: "10px 10px 0 0",
                  textTransform: "none",
                  fontWeight: 400,
                  "&.Mui-selected": {
                    color: "white",
                  },
                  mr: 1,
                  minHeight: "35px !important",
                }}
              />
            ))}
          </Tabs>
        </Box>
      <Paper elevation={2} sx={{ boxShadow: 'none' }}>
        
                 {tabLabels.map((label, index) => (
           <TabPanel key={index} value={tabValue} index={index}>
             <Box>
             
               <CommonTable
                 data={tickets}
                 columns={columns}
                 currentPage={currentPage}
                 totalPages={totalPages}
                 totalItems={totalCount}
                 pageSize={pageSize}
                 onPageChange={setCurrentPage}
                 onPageSizeChange={setPageSize}
                 pageSizeOptions={[5, 10, 25, 50]}
                 showPageSizeSelector={true}
                 showTotalItems={true}
                 showPageNumbers={true}
                 maxPageNumbers={5}
                 stickyHeader={true}
                 containerHeight="500px"
                 loading={loading}
                 emptyStateComponent={
                   <Typography 
                     variant="body2" 
                     color="text.secondary"
                     sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}
                   >
                     {error || `No ${tabLabels[tabValue].toLowerCase()} tickets found.`}
                   </Typography>
                 }
               />
             </Box>
           </TabPanel>
         ))}
      </Paper>

      {/* View Ticket Details Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          color: theme.palette.primary.main,
          fontWeight: 500,
          fontSize: 18,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Ticket Details
          <IconButton
            onClick={handleCloseViewModal}
            size="small"
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3, px: 4}}>
          {selectedTicket && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={1}>
                {/* Basic Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Ticket ID</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Subject</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.subject}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Description</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.description}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Customer Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Customer Name</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.customer?.C_Name || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Customer ID</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.customer?.C_Number || selectedTicket.C_Number}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Contact Number</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.contactNumber}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Status and Dates */}
                <Grid size={{ xs: 12 }}>
                  <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                    Status & Timeline
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Status</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {selectedTicket.status}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                            <Typography fontSize={14} fontWeight={500} color="text.secondary">Created At</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </Typography>

                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontSize={14} fontWeight={500} color="text.secondary">Last Updated</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">
                        {new Date(selectedTicket.updatedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Attachment */}
                {selectedTicket.attachment && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 0.5 }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                        Attachment
                      </Typography>
                      <Link
                        href={selectedTicket.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        View Attachment
                      </Link>
                    </Grid>
                  </>
                )}

                {/* Complete Note */}
                {selectedTicket.completeNote && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 0.5 }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography fontSize={16} fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                        Complete Note
                      </Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">{selectedTicket.completeNote}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Completion Note Modal */}
      <Dialog
        open={completionNoteModalOpen}
        onClose={handleCompletionNoteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          color: theme.palette.primary.main,
          fontWeight: 500,
          fontSize: 18,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Add Completion Note
          <IconButton
            onClick={handleCompletionNoteCancel}
            size="small"
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, px: 4 }}>
          <Typography fontSize={14} fontWeight={400} color="text.secondary" sx={{ my: 2 }}>
            Please provide a completion note for this resolved ticket:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Enter completion note..."
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <CustomButton
            appearance="outlined"
            onClick={handleCompletionNoteCancel}
            size="small"
            fullWidth={false}
            sx={{ mt:0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            appearance="filled"
            onClick={() => {
              handleCompletionNoteSubmit();
            }}
            disabled={!completionNote.trim()}
            size="small"
            fullWidth={false}
            sx={{ mt:0 }}
          >
            Submit
          </CustomButton>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SupportTickets;
