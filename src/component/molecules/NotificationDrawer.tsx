import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Chip,
  Drawer,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../redux/store';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../redux/slices/notificationSlice';
import { deleteNotification, deleteAllNotification } from '../../redux/apis/retailer/notificationsApis';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-hot-toast';

dayjs.extend(relativeTime);

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notification);
  
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Unread, 2: Read

  useEffect(() => {
    if (open) {
      dispatch(fetchNotifications());
    }
  }, [open, dispatch]);

  const handleMarkAsRead = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await dispatch(markNotificationAsRead(notification.id));
        toast.success('Marked as read');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to mark as read');
      }
    }
  };

  const handleDelete = async (notification: any) => {
    try {
      await deleteNotification(notification.id);
      await dispatch(fetchNotifications());
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    }
    setMenuAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead());
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotification();
      await dispatch(fetchNotifications());
      toast.success('All notifications deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete all notifications');
    }
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).fromNow();
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const getInitials = (title: string) => {
    const words = title.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return 'N';
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 1: // Unread
        return notifications.filter(n => !n.isRead);
      case 2: // Read
        return notifications.filter(n => n.isRead);
      default: // All
        return notifications;
    }
  };

  return (
    <>
      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450, md: 500 },
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(60, 119, 149, 0.3)',
                }}
              >
                <NotificationIcon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={500} color="text.primary" fontSize="1.1rem">
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                  {notifications.length} total • {unreadCount} unread
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                width: 32,
                height: 32,
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                minHeight: 40,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 500,
                },
              },
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: '1px',
              },
            }}
          >
            <Tab label={`All (${notifications.length})`} />
            <Tab label={`Unread (${unreadCount})`} />
            <Tab label={`Read (${notifications.length - unreadCount})`} />
          </Tabs>
        </Box>

        {/* Notifications List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
              px={3}
              textAlign="center"
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(60, 119, 149, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll see notifications here when you receive them
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {getFilteredNotifications().map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(60, 119, 149, 0.04)',
                      '&:hover': {
                        backgroundColor: notification.isRead 
                          ? 'rgba(0,0,0,0.02)' 
                          : 'rgba(60, 119, 149, 0.08)',
                      },
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: '0 1px 1px 0',
                        }}
                      />
                    )}
                    
                    <ListItemIcon sx={{ minWidth: 44, ml: notification.isRead ? 0 : 0.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: notification.isRead 
                            ? 'rgba(0,0,0,0.06)' 
                            : theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: notification.isRead ? 'text.primary' : 'white',
                          boxShadow: notification.isRead 
                            ? 'none' 
                            : '0 2px 8px rgba(60, 119, 149, 0.3)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {getInitials(notification.title)}
                      </Box>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography
                              variant="body2"
                              fontWeight={notification.isRead ? 400 : 500}
                              color="text.primary"
                              sx={{ 
                                lineHeight: 1.2,
                                fontSize: '0.875rem',
                              }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.isRead && (
                              <Chip
                                label="New"
                                size="small"
                                color="primary"
                                sx={{ 
                                  height: 16, 
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  backgroundColor: theme.palette.primary.main,
                                  color: 'white',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.4,
                              mb: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.8rem',
                            }}
                          >
                            {notification.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              variant="caption" 
                              color="text.disabled"
                              sx={{ 
                                fontSize: '0.7rem',
                                fontWeight: 400,
                              }}
                            >
                              {formatTime(notification.createdAt)}
                            </Typography>
                            <Box
                              sx={{
                                width: 1.5,
                                height: 1.5,
                                borderRadius: '50%',
                                backgroundColor: 'text.disabled',
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              color="text.disabled"
                              sx={{ 
                                fontSize: '0.7rem',
                                fontWeight: 400,
                              }}
                            >
                              {formatDate(notification.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotification(notification);
                        setMenuAnchorEl(e.currentTarget);
                      }}
                      sx={{ 
                        color: 'text.secondary',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < getFilteredNotifications().length - 1 && (
                    <Divider sx={{ mx: 2, opacity: 0.3 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Bottom Action Buttons */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              position: 'sticky',
              bottom: 0,
            }}
          >
            <Box display="flex" gap={1.5}>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleMarkAllAsRead}
                  startIcon={<ReadIcon />}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    py: 1,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(60, 119, 149, 0.04)',
                      borderColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Mark All as Read
                </Button>
              )}
              <Button
                variant="outlined"
                fullWidth
                color="error"
                onClick={handleDeleteAll}
                startIcon={<DeleteIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.04)',
                  },
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        )}

        {/* Menu for individual notification actions */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{
            sx: {
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: 2,
              minWidth: 150,
            }
          }}
        >
          {selectedNotification && !selectedNotification.isRead && (
            <MenuItem 
              onClick={() => {
                handleMarkAsRead(selectedNotification);
                setMenuAnchorEl(null);
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <ReadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as Read" />
            </MenuItem>
          )}
          <MenuItem 
            onClick={() => selectedNotification && handleDelete(selectedNotification)}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        </Menu>
      </Drawer>
    </>
  );
};

export default NotificationDrawer; 