import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import TextInput from '../../../component/atoms/TextInput';
import SelectInput from '../../../component/atoms/SelectInput';
import MultiSelectInput from '../../../component/atoms/MultiSelectInput';
import SwitchInput from '../../../component/atoms/SwitchInput';
import SearchableDropdown from '../../../component/atoms/SearchableDropdown';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import {
  getEpickUsers,
  createEpickUser,
  updateEpickUser,
} from '../../../redux/apis/distrubutor/epickApis';
import { getSalesCategoryList, getUserList } from '../../../redux/apis/distrubutor/listApis';

interface EpickUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userNumber: string;
  category: number[];
  order_type: string;
  shortby: string;
  item_sort_by?: string;
  status: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  Sales_Category: number;
  Category_Desc: string;
}

// Zod schema for create form
const createEpickUserSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(3, 'Password must be at least 3 characters'),
  userNumber: z.string().optional(),
  category: z.array(z.number()).min(1, 'At least one category is required'),
  order_type: z.enum(['order_number', 'qty_number']).optional(),
  shortby: z.enum(['Asc', 'Des']).optional(),
  item_sort_by: z.enum(['sales_location', 'alphabetically', 'item_number', 'short_number', 'line_number']).optional(),
  status: z.boolean().optional(),
});

// Zod schema for update form
const updateEpickUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  userNumber: z.string().optional(),
  category: z.array(z.number()).optional(),
  order_type: z.enum(['order_number', 'qty_number']).optional(),
  shortby: z.enum(['Asc', 'Des']).optional(),
  item_sort_by: z.enum(['sales_location', 'alphabetically', 'item_number', 'short_number', 'line_number']).optional(),
  status: z.boolean().optional(),
});

type CreateEpickUserFormData = z.infer<typeof createEpickUserSchema>;
type UpdateEpickUserFormData = z.infer<typeof updateEpickUserSchema>;

const CreateEpickUserTab: React.FC = () => {
  const [users, setUsers] = useState<EpickUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userNumberOptions, setUserNumberOptions] = useState<{ label: string; value: string }[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EpickUser | null>(null);
  const [selectedUserForView, setSelectedUserForView] = useState<EpickUser | null>(null);
  const [processing, setProcessing] = useState(false);

  // Create form
  const createForm = useForm<CreateEpickUserFormData>({
    resolver: zodResolver(createEpickUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      userNumber: '',
      category: [],
      order_type: 'order_number',
      shortby: 'Des',
      item_sort_by: 'line_number',
      status: true,
    },
  });

  // Update form
  const updateForm = useForm<UpdateEpickUserFormData>({
    resolver: zodResolver(updateEpickUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      userNumber: '',
      category: [],
      order_type: 'order_number',
      shortby: 'Des',
      item_sort_by: 'line_number',
      status: true,
    },
  });

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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response: any = await getSalesCategoryList();
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showErrorToast('Failed to fetch categories');
    }
  };

  // Fetch user list for user number dropdown
  const fetchUserList = async () => {
    try {
      const response: any = await getUserList();
      const userList = response?.data?.data || response?.data || [];
      setUserNumberOptions(userList
        .filter((u: any) => u && u.UserNumber != null)
        .map((u: any) => ({
          label: `${u?.UserName || 'User'} (${u?.UserNumber || ''})`,
          value: String(u?.UserNumber || ''),
        })));
    } catch (error) {
      console.error('Failed to fetch user list:', error);
      showErrorToast('Failed to fetch user list');
    }
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    createForm.reset({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      userNumber: '',
      category: [],
      order_type: 'order_number',
      shortby: 'Des',
      item_sort_by: 'line_number',
      status: true,
    });
    setCreateModalOpen(true);
  };

  // Handle close create modal
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    createForm.reset();
  };

  // Handle open edit modal
  const handleOpenEditModal = (user: EpickUser) => {
    setSelectedUser(user);
    const orderType = (user.order_type === 'order_number' || user.order_type === 'qty_number' 
      ? user.order_type 
      : 'order_number') as 'order_number' | 'qty_number';
    const shortbyValue = (user.shortby === 'Asc' || user.shortby === 'Des' 
      ? user.shortby 
      : 'Des') as 'Asc' | 'Des';
    const itemSortBy = (user.item_sort_by && ['sales_location', 'alphabetically', 'item_number', 'short_number', 'line_number'].includes(user.item_sort_by)
      ? user.item_sort_by
      : 'line_number') as 'sales_location' | 'alphabetically' | 'item_number' | 'short_number' | 'line_number';
    updateForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userNumber: user.userNumber || '',
      category: user.category || [],
      order_type: orderType,
      shortby: shortbyValue,
      item_sort_by: itemSortBy,
      status: user.status ?? true,
    });
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    updateForm.reset();
  };

  // Handle open view modal
  const handleOpenViewModal = (user: EpickUser) => {
    setSelectedUserForView(user);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedUserForView(null);
  };

  // Handle create user
  const handleCreateUser = async (data: CreateEpickUserFormData) => {
    setProcessing(true);
    try {
      const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        userNumber: data.userNumber || undefined,
        category: data.category,
        order_type: data.order_type || 'order_number',
        shortby: data.shortby || 'Des',
        item_sort_by: data.item_sort_by || 'line_number',
        status: data.status ?? true,
        isActive: true,
      };
      
      await createEpickUser(payload);
      showSuccessToast('Epick user created successfully!');
      await fetchEpickUsers();
      handleCloseCreateModal();
    } catch (error: any) {
      console.error('Failed to create epick user:', error);
      showErrorToast(error?.response?.data?.message || 'Failed to create epick user');
    } finally {
      setProcessing(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async (data: UpdateEpickUserFormData) => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      const payload: any = {};
      if (data.email) payload.email = data.email;
      if (data.firstName) payload.firstName = data.firstName;
      if (data.lastName) payload.lastName = data.lastName;
      if (data.userNumber !== undefined) payload.userNumber = data.userNumber;
      if (data.category !== undefined) payload.category = data.category;
      if (data.order_type !== undefined) payload.order_type = data.order_type;
      if (data.shortby !== undefined) payload.shortby = data.shortby;
      if (data.item_sort_by !== undefined) payload.item_sort_by = data.item_sort_by;
      if (data.status !== undefined) payload.status = data.status;
      
      await updateEpickUser(selectedUser.id, payload);
      showSuccessToast('Epick user updated successfully!');
      await fetchEpickUsers();
      handleCloseEditModal();
    } catch (error: any) {
      console.error('Failed to update epick user:', error);
      showErrorToast(error?.response?.data?.message || 'Failed to update epick user');
    } finally {
      setProcessing(false);
    }
  };

  // Handle status toggle in table
  const handleStatusToggle = async (user: EpickUser, newStatus: boolean) => {
    try {
      await updateEpickUser(user.id, { status: newStatus });
      showSuccessToast(`User status updated to ${newStatus ? 'active' : 'inactive'}`);
      await fetchEpickUsers();
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      showErrorToast(error?.response?.data?.message || 'Failed to update user status');
    }
  };

  // Format category display
  const formatCategories = (categoryIds: number[]): string => {
    if (!categoryIds || categoryIds.length === 0) return 'N/A';
    const categoryNames = categoryIds.map(id => {
      const category = categories.find(c => c.Sales_Category === id);
      return category ? category.Category_Desc : id.toString();
    });
    return categoryNames.join(', ');
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
  const formatItemSortBy = (itemSortBy: string | undefined): string => {
    if (!itemSortBy) return 'N/A';
    const mapping: { [key: string]: string } = {
      'sales_location': 'Sales Location',
      'alphabetically': 'Alphabetically',
      'item_number': 'Item Number',
      'short_number': 'Short Number',
      'line_number': 'Line Number',
    };
    return mapping[itemSortBy] || itemSortBy;
  };

  // Category options for multi-select
  const categoryOptions = categories
    .filter(cat => cat && cat.Sales_Category != null && cat.Category_Desc != null)
    .map(cat => ({
      label: `${cat.Category_Desc} (${cat.Sales_Category})`,
      value: cat.Sales_Category.toString(),
    }));

  // Table columns
  const columns: TableColumn<EpickUser>[] = [
    {
      id: 'userNumber',
      label: 'User Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userNumber || 'N/A'}
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
      id: 'category',
      label: 'Categories',
      minWidth: 200,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCategories(row.category || [])}
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
        <SwitchInput
          checked={row.status ?? false}
          onChange={(checked) => handleStatusToggle(row, checked)}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleOpenViewModal(row)}
              color="info"
              sx={{ padding: '4px' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => handleOpenEditModal(row)}
              disabled={processing}
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

  // Fetch data on mount
  useEffect(() => {
    fetchEpickUsers();
    fetchCategories();
    fetchUserList();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      {/* Header with Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Typography sx={{ fontWeight: 500, fontSize: 16, color: "text.primary" }}>
          Epick Users
        </Typography>
        <CustomButton
          appearance="filled"
          buttonType="primary"
          onClick={handleOpenCreateModal}
          icon={<AddIcon />}
          fullWidth={false}
          sx={{ minWidth: 100, mt: 0 }}
        >
          Create User
        </CustomButton>
      </Box>

      {/* Users Table */}
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
        containerHeight="calc(100vh - 350px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No epick users found</Typography>
          </Box>
        }
      />

      {/* Create User Modal */}
      <CommonModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        size="md"
        title="Create Epick User"
      >
        <form onSubmit={createForm.handleSubmit(handleCreateUser)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextInput
              label="Email"
              type="email"
              {...createForm.register('email')}
              error={!!createForm.formState.errors.email}
              helperText={createForm.formState.errors.email?.message}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextInput
                label="First Name"
                {...createForm.register('firstName')}
                error={!!createForm.formState.errors.firstName}
                helperText={createForm.formState.errors.firstName?.message}
                sx={{ flex: 1, mb: 0 }}
              />
              <TextInput
                label="Last Name"
                {...createForm.register('lastName')}
                error={!!createForm.formState.errors.lastName}
                helperText={createForm.formState.errors.lastName?.message}
                sx={{ flex: 1, mb: 0 }}
              />
            </Box>

            <TextInput
              label="Password"
              type="password"
              {...createForm.register('password')}
              error={!!createForm.formState.errors.password}
              helperText={createForm.formState.errors.password?.message}
            />

            <Controller
              name="userNumber"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <SearchableDropdown
                  label="User Number"
                  options={userNumberOptions}
                  value={userNumberOptions.find(opt => opt.value === field.value) || null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Search user number..."
                />
              )}
            />

            <Controller
              name="category"
              control={createForm.control}
              render={({ field, fieldState }) => {
                const categoryValues = Array.isArray(field.value) ? field.value : [];
                return (
                  <MultiSelectInput
                    label="Category"
                    options={categoryOptions}
                    value={categoryValues.map((v: number) => v.toString())}
                    onChange={(values: string[]) => {
                      field.onChange(values.map((v: string) => parseInt(v, 10)));
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="order_type"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Box sx={{ flex: 1 }}>
                    <SelectInput
                      label="Order Type"
                      options={[
                        { label: 'Order Number', value: 'order_number' },
                        { label: 'Quantity Number', value: 'qty_number' },
                      ]}
                      value={field.value || 'order_number'}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      marginBottom="0"
                    />
                  </Box>
                )}
              />
              <Controller
                name="shortby"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Box sx={{ flex: 1 }}>
                    <SelectInput
                      label="Sort By"
                      options={[
                        { label: 'Ascending', value: 'Asc' },
                        { label: 'Descending', value: 'Des' },
                      ]}
                      value={field.value || 'Des'}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      marginBottom="0"
                    />
                  </Box>
                )}
              />
            </Box>

            <Controller
              name="item_sort_by"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <SelectInput
                  label="Item Sort By"
                  options={[
                    { label: 'Sales Location', value: 'sales_location' },
                    { label: 'Alphabetically', value: 'alphabetically' },
                    { label: 'Item Number', value: 'item_number' },
                    { label: 'Short Number', value: 'short_number' },
                    { label: 'Line Number', value: 'line_number' },
                  ]}
                  value={field.value || 'line_number'}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 14 }}>Status</Typography>
              <Controller
                name="status"
                control={createForm.control}
                render={({ field }) => (
                  <SwitchInput
                    checked={field.value ?? true}
                    onChange={field.onChange}
                    sx={{ mb: 0 }}
                    isShowLabel={false}
                  />
                )}
              />
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <CustomButton
                appearance="outlined"
                buttonType="cancel"
                onClick={handleCloseCreateModal}
                disabled={processing}
                sx={{ minWidth: 100 }}
                fullWidth={false}
              >
                Cancel
              </CustomButton>
              <CustomButton
                appearance="filled"
                buttonType="primary"
                type="submit"
                loading={processing}
                sx={{ minWidth: 100 }}
                fullWidth={false}
              >
                Create
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

      {/* Edit User Modal */}
      <CommonModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        size="md"
        title="Edit Epick User"
      >
        <form onSubmit={updateForm.handleSubmit(handleUpdateUser)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedUser && (
              <Box sx={{ mb: 1 }}>
                <Typography fontSize={12} color="text.secondary">
                  User ID: {selectedUser.id}
                </Typography>
              </Box>
            )}

            <TextInput
              label="Email"
              type="email"
              {...updateForm.register('email')}
              error={!!updateForm.formState.errors.email}
              helperText={updateForm.formState.errors.email?.message}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextInput
                label="First Name"
                {...updateForm.register('firstName')}
                error={!!updateForm.formState.errors.firstName}
                helperText={updateForm.formState.errors.firstName?.message}
                sx={{ flex: 1, mb: 0 }}
              />
              <TextInput
                label="Last Name"
                {...updateForm.register('lastName')}
                error={!!updateForm.formState.errors.lastName}
                helperText={updateForm.formState.errors.lastName?.message}
                sx={{ flex: 1, mb: 0 }}
              />
            </Box>

            <Controller
              name="userNumber"
              control={updateForm.control}
              render={({ field, fieldState }) => (
                <SearchableDropdown
                  label="User Number"
                  options={userNumberOptions}
                  value={userNumberOptions.find(opt => opt.value === field.value) || null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Search user number..."
                />
              )}
            />

            <Controller
              name="category"
              control={updateForm.control}
              render={({ field, fieldState }) => {
                const categoryValues = Array.isArray(field.value) ? field.value : [];
                return (
                  <MultiSelectInput
                    label="Category"
                    options={categoryOptions}
                    value={categoryValues.map((v: number) => v.toString())}
                    onChange={(values: string[]) => {
                      field.onChange(values.map((v: string) => parseInt(v, 10)));
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="order_type"
                control={updateForm.control}
                render={({ field, fieldState }) => (
                  <Box sx={{ flex: 1 }}>
                    <SelectInput
                      label="Order Type"
                      options={[
                        { label: 'Order Number', value: 'order_number' },
                        { label: 'Quantity Number', value: 'qty_number' },
                      ]}
                      value={field.value || 'order_number'}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      marginBottom="0"
                    />
                  </Box>
                )}
              />
              <Controller
                name="shortby"
                control={updateForm.control}
                render={({ field, fieldState }) => (
                  <Box sx={{ flex: 1 }}>
                    <SelectInput
                      label="Sort By"
                      options={[
                        { label: 'Ascending', value: 'Asc' },
                        { label: 'Descending', value: 'Des' },
                      ]}
                      value={field.value || 'Des'}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      marginBottom="0"
                    />
                  </Box>
                )}
              />
            </Box>

            <Controller
              name="item_sort_by"
              control={updateForm.control}
              render={({ field, fieldState }) => (
                <SelectInput
                  label="Item Sort By"
                  options={[
                    { label: 'Sales Location', value: 'sales_location' },
                    { label: 'Alphabetically', value: 'alphabetically' },
                    { label: 'Item Number', value: 'item_number' },
                    { label: 'Short Number', value: 'short_number' },
                    { label: 'Line Number', value: 'line_number' },
                  ]}
                  value={field.value || 'line_number'}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 14 }}>Status</Typography>
              <Controller
                name="status"
                control={updateForm.control}
                render={({ field }) => (
                  <SwitchInput
                    checked={field.value ?? true}
                    onChange={field.onChange}
                    sx={{ mb: 0 }}
                    isShowLabel={false}
                  />
                )}
              />
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <CustomButton
                appearance="outlined"
                buttonType="cancel"
                onClick={handleCloseEditModal}
                disabled={processing}
                sx={{ minWidth: 100 }}
                fullWidth={false}
              >
                Cancel
              </CustomButton>
              <CustomButton
                appearance="filled"
                buttonType="primary"
                type="submit"
                loading={processing}
                sx={{ minWidth: 100 }}
                fullWidth={false}
              >
                Update
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

      {/* View User Details Modal */}
      <CommonModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        size="md"
        title="Epick User Details"
      >
        {selectedUserForView && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  User ID
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {selectedUserForView.id}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  User Number
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {selectedUserForView.userNumber || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  First Name
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {selectedUserForView.firstName}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Last Name
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {selectedUserForView.lastName}
                </Typography>
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Email
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {selectedUserForView.email}
                </Typography>
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Categories
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {formatCategories(selectedUserForView.category || [])}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Order Type
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {formatOrderType(selectedUserForView.order_type)}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Sort By
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {formatShortby(selectedUserForView.shortby)}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Item Sort By
                </Typography>
                <Typography fontSize={14} fontWeight={400}>
                  {formatItemSortBy(selectedUserForView.item_sort_by)}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Status
                </Typography>
                <Typography 
                  fontSize={14} 
                  fontWeight={400}
                  color={selectedUserForView.status ? 'success.main' : 'text.secondary'}
                >
                  {selectedUserForView.status ? 'Active' : 'Inactive'}
                </Typography>
              </Box>

              <Box>
                <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                  Is Active
                </Typography>
                <Typography 
                  fontSize={14} 
                  fontWeight={400}
                  color={selectedUserForView.isActive ? 'success.main' : 'text.secondary'}
                >
                  {selectedUserForView.isActive ? 'Yes' : 'No'}
                </Typography>
              </Box>

              {selectedUserForView.createdAt && (
                <Box>
                  <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                    Created At
                  </Typography>
                  <Typography fontSize={14} fontWeight={400}>
                    {new Date(selectedUserForView.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {selectedUserForView.updatedAt && (
                <Box>
                  <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
                    Updated At
                  </Typography>
                  <Typography fontSize={14} fontWeight={400}>
                    {new Date(selectedUserForView.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
              <CustomButton
                appearance="outlined"
                buttonType="cancel"
                onClick={handleCloseViewModal}
                sx={{ minWidth: 100 }}
                fullWidth={false}
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

export default CreateEpickUserTab;

