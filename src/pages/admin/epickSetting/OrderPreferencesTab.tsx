import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import SelectInput from '../../../component/atoms/SelectInput';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import {
  getEpickUsers,
  updateUserOrderPreferences,
} from '../../../redux/apis/distrubutor/epickApis';

interface EpickUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  order_type: string;
  shortby: string;
  item_sort_by?: string;
  userNumber: string;
  isActive: boolean;
  status: boolean;
}

const OrderPreferencesTab: React.FC = () => {
  const [users, setUsers] = useState<EpickUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EpickUser | null>(null);
  
  // Form state
  const [orderType, setOrderType] = useState<string>('');
  const [shortby, setShortby] = useState<string>('');
  const [itemSortBy, setItemSortBy] = useState<string>('line_number');
  const [formErrors, setFormErrors] = useState<{ orderType?: string; shortby?: string; general?: string }>({});

  // Fetch epick users
  const fetchEpickUsers = async () => {
    setLoading(true);
    try {
      const response: any = await getEpickUsers();
      console.log('Epick Users API Response:', response);
      
      let usersData = [];
      if (response?.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else if (response?.data && Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch epick users:', error);
      showErrorToast('Failed to fetch epick users');
    } finally {
      setLoading(false);
    }
  };

  // Handle open edit modal
  const handleOpenEditModal = (user: EpickUser) => {
    setSelectedUser(user);
    // Normalize the values from API (handle case insensitive)
    const normalizedOrderType = user.order_type ? user.order_type.toLowerCase() : '';
    const normalizedShortby = user.shortby ? user.shortby.toLowerCase() : '';
    setOrderType(normalizedOrderType === 'order_number' ? 'order_number' : normalizedOrderType === 'qty_number' ? 'qty_number' : '');
    setShortby(normalizedShortby === 'asc' ? 'asc' : normalizedShortby === 'des' ? 'des' : '');
    const validItemSortBy = user.item_sort_by && ['section_location', 'alphabetically', 'item_number', 'short_number', 'line_number'].includes(user.item_sort_by)
      ? user.item_sort_by
      : 'line_number';
    setItemSortBy(validItemSortBy);
    setFormErrors({});
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    setOrderType('');
    setShortby('');
    setItemSortBy('line_number');
    setFormErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { orderType?: string; shortby?: string; general?: string } = {};
    
    // Check if both are unchecked
    if (!orderType && !shortby) {
      errors.general = 'At least one preference (order_type or shortby) must be provided';
    }
    
    // If order_type is "order_number", shortby is required
    if (orderType === 'order_number' && !shortby) {
      errors.shortby = 'Shortby is required when order type is order_number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order type checkbox change
  const handleOrderTypeChange = (value: string) => {
    if (orderType === value) {
      // If clicking the same checkbox, uncheck it
      setOrderType('');
    } else {
      // Select the new value
      setOrderType(value);
    }
    // Clear shortby error when order type changes
    if (formErrors.shortby) {
      setFormErrors({ ...formErrors, shortby: undefined });
    }
  };

  // Handle shortby checkbox change
  const handleShortbyChange = (value: string) => {
    if (shortby === value) {
      // If clicking the same checkbox, uncheck it
      setShortby('');
    } else {
      // Select the new value
      setShortby(value);
    }
    // Clear shortby error when value is set
    if (formErrors.shortby) {
      setFormErrors({ ...formErrors, shortby: undefined });
    }
  };

  // Handle update preferences
  const handleUpdatePreferences = async () => {
    if (!selectedUser) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setProcessingUserId(selectedUser.id);
    try {
      // Build request body - only include fields that have values
      const requestBody: { order_type?: string; shortby?: string; item_sort_by?: string } = {};
      
      if (orderType) {
        requestBody.order_type = orderType;
      }
      
      if (shortby) {
        requestBody.shortby = shortby;
      }
      
      if (itemSortBy) {
        requestBody.item_sort_by = itemSortBy;
      }
      
      await updateUserOrderPreferences(selectedUser.id, requestBody);
      showSuccessToast('User order preferences updated successfully!');
      await fetchEpickUsers();
      handleCloseEditModal();
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      showErrorToast('Failed to update user preferences');
    } finally {
      setProcessingUserId(null);
    }
  };

  // Format order type display
  const formatOrderType = (orderType: string): string => {
    if (!orderType) return 'N/A';
    return orderType === 'order_number' ? 'Order Number' : 'Quantity Number';
  };

  // Format shortby display
  const formatShortby = (shortby: string): string => {
    if (!shortby) return 'N/A';
    const normalized = shortby.toLowerCase();
    return normalized === 'asc' ? 'Asc' : normalized === 'des' ? 'Des' : shortby;
  };

  // Format item sort by display
  // const formatItemSortBy = (itemSortBy: string | undefined): string => {
  //   if (!itemSortBy) return 'N/A';
  //   const mapping: { [key: string]: string } = {
  //     'section_location': 'Section Location',
  //     'alphabetically': 'Alphabetically',
  //     'item_number': 'Item Number',
  //     'short_number': 'Short Number',
  //     'line_number': 'Line Number',
  //   };
  //   return mapping[itemSortBy] || itemSortBy;
  // };

  // Table columns
  const columns: TableColumn<EpickUser>[] = [
    {
      id: 'userNumber',
      label: 'User Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userNumber}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 200,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.firstName} {row.lastName}
        </Typography>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.email}
        </Typography>
      ),
    },
    {
      id: 'order_type',
      label: 'Order Type',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatOrderType(row.order_type)}
        </Typography>
      ),
    },
    {
      id: 'shortby',
      label: 'Sort By',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatShortby(row.shortby)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400} 
          color={row.isActive && row.status ? 'success.main' : 'text.secondary'}
        >
          {row.isActive && row.status ? 'Active' : 'Inactive'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center">
          <Tooltip title="Edit Preferences">
            <IconButton
              size="small"
              onClick={() => handleOpenEditModal(row)}
              disabled={processingUserId === row.id}
              color="primary"
              sx={{ padding: '4px' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];


  // Fetch users on mount
  useEffect(() => {
    fetchEpickUsers();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      <CommonTable
        data={users}
        columns={columns}
        currentPage={1}
        totalPages={1}
        totalItems={users.length}
        pageSize={users.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        loading={loading}
        isPagination={false}
        stickyLastColumn={true}
        containerHeight="calc(100vh - 300px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No users found</Typography>
          </Box>
        }
      />

      {/* Edit Preferences Modal */}
      <CommonModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        size="sm"
        title="Edit Order Preferences"
      >
        <Box>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 0.5 }}>
                User: {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {selectedUser.email} (User #{selectedUser.userNumber})
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* General Error Message */}
            {formErrors.general && (
              <Box sx={{ mb: -1 }}>
                <Typography fontSize={12} color="error">
                  {formErrors.general}
                </Typography>
              </Box>
            )}

            {/* Order Type */}
            <Box>
              <Typography fontSize={14} fontWeight={600} mb={1.5} sx={{ opacity: '70%' }}>
                Order Type
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={orderType === 'order_number'}
                      onChange={() => {
                        handleOrderTypeChange('order_number');
                        // Clear general error when any checkbox is selected
                        if (formErrors.general) {
                          setFormErrors({ ...formErrors, general: undefined });
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Order Number"
                  sx={{ margin: 0 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={orderType === 'qty_number'}
                      onChange={() => {
                        handleOrderTypeChange('qty_number');
                        // Clear general error when any checkbox is selected
                        if (formErrors.general) {
                          setFormErrors({ ...formErrors, general: undefined });
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Quantity Number"
                  sx={{ margin: 0 }}
                />
              </Box>
              {formErrors.orderType && (
                <Typography fontSize={12} color="error" sx={{ mt: 0.5 }}>
                  {formErrors.orderType}
                </Typography>
              )}
            </Box>

            {/* Sort By */}
            <Box>
              <Typography fontSize={14} fontWeight={600} mb={1.5} sx={{ opacity: '70%' }}>
                Sort By
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shortby === 'asc'}
                      onChange={() => {
                        handleShortbyChange('asc');
                        // Clear general error when any checkbox is selected
                        if (formErrors.general) {
                          setFormErrors({ ...formErrors, general: undefined });
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Ascending"
                  sx={{ margin: 0 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shortby === 'des'}
                      onChange={() => {
                        handleShortbyChange('des');
                        // Clear general error when any checkbox is selected
                        if (formErrors.general) {
                          setFormErrors({ ...formErrors, general: undefined });
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Descending"
                  sx={{ margin: 0 }}
                />
              </Box>
              {formErrors.shortby && (
                <Typography fontSize={12} color="error" sx={{ mt: 0.5 }}>
                  {formErrors.shortby}
                </Typography>
              )}
              {orderType === 'order_number' && !shortby && !formErrors.general && (
                <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
                  * Sort By is required when Order Type is "Order Number"
                </Typography>
              )}
            </Box>

            {/* Item Sort By */}
            <Box>
              <Typography fontSize={14} fontWeight={600} mb={1.5} sx={{ opacity: '70%' }}>
                Item Sort By
              </Typography>
              <SelectInput
                label="Item Sort By"
                options={[
                  { label: 'Section Location', value: 'section_location' },
                  { label: 'Alphabetically', value: 'alphabetically' },
                  { label: 'Item Number', value: 'item_number' },
                  { label: 'Short Number', value: 'short_number' },
                  { label: 'Line Number', value: 'line_number' },
                ]}
                value={itemSortBy}
                onChange={(e) => setItemSortBy(e.target.value as string)}
                marginBottom="0"
              />
            </Box>
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={handleCloseEditModal}
              disabled={processingUserId !== null}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleUpdatePreferences}
              loading={processingUserId !== null}
              sx={{ minWidth: 100 }}
            >
              Update
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default OrderPreferencesTab;

