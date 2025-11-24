import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon, 
  Edit as EditIcon, 
  // Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import CommonModal from '../../../component/atoms/CommonModal';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';
import NotificationForm from '../../../component/molecules/NotificationForm';
import NotificationViewModal from '../../../component/molecules/NotificationViewModal';
import { 
  createNotificationScheduler, 
  updateNotificationScheduler, 
  getNotificationScheduler, 
  getNotificationSchedulerById,
  deleteNotificationScheduler 
} from '../../../redux/apis/distrubutor/notificationsApis';
// import SwitchInput from '../../../component/atoms/SwitchInput';
import DeleteModal from '../../../component/atoms/DeleteModal';
import { toast } from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  description: string;
  userId: number[];
  date: string;
  time: string;
  isActive?: boolean;
  users?: Array<{
    C_Number: number;
    C_Name: string;
    C_CoName: string;
  }>;
}

const Notifications = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActionNotification, setSelectedActionNotification] = useState<Notification | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, pageSize]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotificationScheduler({
        page: currentPage,
        limit: pageSize
      });
      const data = (response as any)?.data?.data || {};
      setNotifications(data?.notifications || []);
      setTotalItems(data?.pagination?.total || 0);
      setTotalPages(Math.ceil((data?.pagination?.total || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

//   const handleStatusChange = async (notification: Notification) => {
//     try {
//       const form = new FormData();
//       form.append('isActive', (!notification.isActive).toString());
      
//       await updateNotificationScheduler(notification.id.toString(), form);
//       fetchNotifications();
      
//       toast.success('Status updated successfully');
//     } catch (error) {
//       console.error('Error updating status:', error);
//       toast.error('Failed to update status');
//     }
//   };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleAddNotification = () => {
    setSelectedNotification(null);
    setModalOpen(true);
  };

  const handleEditNotification = async (notification: Notification) => {
    try {
      const response = await getNotificationSchedulerById(notification.id.toString());
      const detailedNotification = (response as any)?.data?.data;
      setSelectedNotification(detailedNotification);
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching notification details:', error);
      toast.error('Failed to load notification details');
    }
  };

  const handleViewNotification = async (notification: Notification) => {
    try {
      const response = await getNotificationSchedulerById(notification.id.toString());
      const detailedNotification = (response as any)?.data?.data;
      setSelectedNotification(detailedNotification);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching notification details:', error);
      toast.error('Failed to load notification details');
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    setSelectedActionNotification(notification);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedActionNotification) return;
    
    setDeleteLoading(true);
    try {
      await deleteNotificationScheduler(selectedActionNotification.id.toString());
      await fetchNotifications(); // Refresh the list after delete
      toast.success('Notification deleted successfully');
      setDeleteModalOpen(false);
      setSelectedActionNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedActionNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActionNotification(null);
  };

  const handleMenuAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedActionNotification) return;
    
    handleMenuClose();
    
    switch (action) {
      case 'view':
        handleViewNotification(selectedActionNotification);
        break;
      case 'edit':
        handleEditNotification(selectedActionNotification);
        break;
      case 'delete':
        handleDeleteNotification(selectedActionNotification);
        break;
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    
    try {
      const payload = {
        userId: formData.userId,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        isActive: formData.isActive,
      };

      if (selectedNotification) {
        await updateNotificationScheduler(selectedNotification.id.toString(), payload);
        toast.success('Notification updated successfully');
      } else {
        await createNotificationScheduler(payload);
        toast.success('Notification created successfully');
      }
      
      fetchNotifications(); // Refresh the list
      setModalOpen(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error(selectedNotification ? 'Failed to update notification' : 'Failed to create notification');
    } finally {
      setFormLoading(false);
    }
  };

  const columns: TableColumn<Notification>[] = [
    {
      id: 'title',
      label: 'Title',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {row.title || "-"}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: 180,
          lineHeight: 1.2
        }}>
          {row.description || "-"}
        </Typography>
      ),
    },
    {
      id: 'userId',
      label: 'Users',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {row.userId?.length || "-"}
        </Typography>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {dayjs(row.date).format('YYYY/MM/DD') || "-"}
        </Typography>
      ),
    },
    {
      id: 'time',
      label: 'Time',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {row.time || "-"}
        </Typography>
      ),
    },
    // {
    //   id: 'isActive',
    //   label: 'Status',
    //   render: (row) => (
    //     <SwitchInput
    //       checked={row.isActive}
    //       onChange={() => handleStatusChange(row)}
    //       isShowLabel={false}
    //       sx={{mb: 0}}
    //     />
    //   ),
    // },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Paper sx={{ p: { xs: "8px 16px", md: "8px 16px" }, boxShadow: 'none', borderRadius: '0px' }}>
        {/* Header */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', md: 'row' }}
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', md: 'center' }} 
          gap={1.5}
          mt={1}
          px={2}
        >
          <Typography fontSize={18} fontWeight={400} color="text.primary">
            Notification Management
          </Typography>
          <CustomButton
            appearance="filled"
            onClick={handleAddNotification}
            icon={<AddIcon />}
            fullWidth={isMobile}
            sx={{ 
              minWidth: isMobile ? '100%' : 'auto',
              mt: 0
            }}
          >
            Add Notification
          </CustomButton>
        </Box>

        {/* Table */}
        <CommonTable
          data={notifications}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
          containerHeight="calc(100vh - 320px)"
        />

        {/* Add/Edit Modal */}
        <CommonModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedNotification(null);
          }}
          size="xl"
          title={selectedNotification ? "Edit Notification" : "Add Notification"}
        >
          <NotificationForm
            initialData={selectedNotification ? {
              _id: selectedNotification.id.toString(),
              userId: selectedNotification.userId || [],
              title: selectedNotification.title,
              description: selectedNotification.description,
              date: dayjs(selectedNotification.date),
              time: selectedNotification.time,
              isActive: selectedNotification.isActive ?? true,
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setModalOpen(false);
              setSelectedNotification(null);
            }}
            loading={formLoading}
          />
        </CommonModal>

        {/* View Modal */}
        <NotificationViewModal
          notification={selectedNotification}
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedNotification(null);
          }}
        />

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
            <ListItemText primary="View" />
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          {/* <MenuItem onClick={() => handleMenuAction('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem> */}
        </Menu>

        {/* Delete Modal */}
        <DeleteModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedActionNotification(null);
          }}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this notification? This action will permanently remove the notification and cannot be undone."
          itemName={selectedActionNotification?.title}
          loading={deleteLoading}
        />
      </Paper>
    </Box>
  );
};

export default Notifications;