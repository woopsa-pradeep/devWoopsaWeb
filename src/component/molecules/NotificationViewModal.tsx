import React from 'react';
import { Box, Typography, Grid, Chip, Avatar } from '@mui/material';
import dayjs from 'dayjs';

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

interface NotificationViewModalProps {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
}

const NotificationViewModal: React.FC<NotificationViewModalProps> = ({
  notification,
  open,
  onClose,
}) => {
  if (!notification) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 3,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Notification Details
          </Typography>
          <Chip
            label={notification.isActive ? 'Active' : 'Inactive'}
            color={notification.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Grid container spacing={3}>
          {/* Title */}
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Title
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {notification.title}
              </Typography>
            </Box>
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {notification.description}
              </Typography>
            </Box>
          </Grid>

          {/* Date and Time */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Date
              </Typography>
              <Typography variant="body2">
                {dayjs(notification.date).format('YYYY/MM/DD')}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Time
              </Typography>
              <Typography variant="body2">
                {notification.time}
              </Typography>
            </Box>
          </Grid>

          {/* Users */}
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={2}>
                Target Users ({notification.userId?.length || 0})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {notification.users?.map((user) => (
                  <Chip
                    key={user.C_Number}
                    avatar={
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {(user.C_Name || user.C_CoName).charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={user.C_Name || user.C_CoName}
                    variant="outlined"
                    size="small"
                  />
                )) || notification.userId?.map((userId) => (
                  <Chip
                    key={userId}
                    avatar={
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        U
                      </Avatar>
                    }
                    label={`User ${userId}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default NotificationViewModal; 