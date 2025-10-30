import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, ViewList as ViewListIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
import CustomButton from '../../../component/atoms/CustomButton';
import CommonModal from '../../../component/atoms/CommonModal';
import { useDebounce } from '../../../hooks/useDebounce';
import { SalesPerson } from './types';
import SwitchInput from '../../../component/atoms/SwitchInput';
import { getUserList, updateUser, setUserLimits } from '../../../redux/apis/distrubutor/permissionsApis';
import toast from 'react-hot-toast';

const Permissions = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesPerson[]>([]);
  const [originalData, setOriginalData] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // User limit modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SalesPerson | null>(null);
  const [userLimitValue, setUserLimitValue] = useState<number>(0);
  const [limitLoading, setLimitLoading] = useState(false);
  
  const debouncedSearch = useDebounce(search, 500);

  // Helper function to create user data object
  const createUserData = (row: SalesPerson) => {
    return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    role: row.role,
    userNumber: row.userNumber,
    salesRepNumber: row.salesRepNumber,
    status: row.status,
    userLimit: row.userLimit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
};

  const fetchUserList = async () => {
    const res: any = await getUserList();
    const users = res?.data?.data;
    const userList = users?.userListWithSalesRep || [];
    setData(userList);
    setOriginalData(userList);
    setTotalItems(users?.totalCount || userList.length);
    setTotalPages(Math.ceil((users?.totalCount || userList.length) / pageSize));
  };

  // Fetch user list on mount
  useEffect(() => {
    setLoading(true);
    getUserList()
      .then((res: any) => {
        const users = res?.data?.data;
        const userList = users?.userListWithSalesRep || [];
        setData(userList);
        setOriginalData(userList);
        setTotalItems(users?.totalCount || userList.length);
        setTotalPages(Math.ceil((users?.totalCount || userList.length) / pageSize));
      })
      .catch(() => {
        toast.error('Failed to load user list');
      })
      .finally(() => setLoading(false));
  }, [pageSize]);

  // Handler for roles & permissions icon
  const handleRolesPermissions = (row: SalesPerson) => {
    navigate(`/admin/permissions/roles/${row.id}`, {
      state: {
        userData: createUserData(row)
      }
    });
  };

  const handleStatusChange = async (row: SalesPerson) => {
    try {
      const response: any = await updateUser(row.id, { ...row, status: !row.status });
      if (response.status === 200) {
        toast.success(response?.data?.message || 'Status updated successfully');
        fetchUserList();
      } else {
        toast.error(response?.data?.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  // Handle edit user limit
  const handleEditLimit = (user: SalesPerson) => {
    setSelectedUser(user);
    setUserLimitValue(user.setUserDiscountLimit || 0);
    setLimitModalOpen(true);
  };

  // Handle save user limit
  const handleSaveLimit = async () => {
    if (!selectedUser) return;
    
    setLimitLoading(true);
    try {
      const response: any = await setUserLimits({
        id: selectedUser.id,
        setUserDiscountLimit: userLimitValue
      });
      
      if (response.status === 200) {
        toast.success('User limit updated successfully');
        setLimitModalOpen(false);
        fetchUserList(); // Refresh the list to show updated data
      } else {
        toast.error(response?.data?.message || 'Failed to update user limit');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user limit');
    } finally {
      setLimitLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (!originalData.length) return;
    
    const filteredData = originalData.filter(item =>
      item.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.role?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.userNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.salesRepNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    
    setData(filteredData);
    setTotalItems(filteredData.length);
    setTotalPages(Math.ceil(filteredData.length / pageSize));
    setCurrentPage(1);
  }, [debouncedSearch, originalData, pageSize]);

  const columns: TableColumn<SalesPerson>[] = [
    // {
    //   id: 'id',
    //   label: 'Sales ID',
    //   render: (row) => (
    //     <Typography color="text.secondary" fontSize={14}>{row.id}</Typography>
    //   ),
    // },
    {
      id: 'firstName',
      label: 'Name',
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>{row.firstName} {row.lastName}</Typography>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>{row.email}</Typography>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>{row.role}</Typography>
      ),
    },
    // {
    //   id: 'userNumber',
    //   label: 'User Number',
    //   render: (row) => (
    //     <Typography color="text.secondary" fontSize={14}>{row.userNumber}</Typography>
    //   ),
    // },
    {
      id: 'salesRepNumber',
      label: 'Sales Rep Number',
      render: (row) => (
        <Typography color="text.secondary" fontSize={14}>{row.salesRep?.S_Desc}</Typography>
      ),
    },
    {
      id: 'setUserDiscountLimit',
      label: 'User Limit',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography color="text.secondary" fontSize={14}>
            {row.setUserDiscountLimit ? `$${row.setUserDiscountLimit}` : 'No limit'}
          </Typography>
          <Tooltip title={row.setUserDiscountLimit ? "Edit Limit" : "Add Limit"}>
            <IconButton
              size="small"
              onClick={() => handleEditLimit(row)}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      id: 'rolesPermissions',
      label: 'Roles & Permissions',
      render: (row) => (
        <IconButton onClick={() => handleRolesPermissions(row)} color="primary">
          <ViewListIcon />
        </IconButton>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <SwitchInput
          checked={row.status}
          onChange={() => {
            handleStatusChange(row);
          }}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/permissions/view/${row.id}`, {
                state: {
                  userData: createUserData(row)
                }
              })}
              sx={{ color: 'primary.main' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/permissions/edit/${row.id}`, {
                state: {
                  userData: createUserData(row)
                }
              })}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        flexWrap="wrap"
        gap={2}
      >
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          User Management
        </Typography>
        <CustomButton
          onClick={() => navigate('/admin/permissions/add')}
          icon={<AddIcon sx={{ fontSize: "20px" }} />}
          iconPosition="left"
          fullWidth={false}
          size="small"
          sx={{ mt:0 }}
        >
          Add User
        </CustomButton>
      </Box>

      <Paper sx={{ boxShadow: "none", borderRadius: "0px" }}>
        {/* Search Bar */}
        <Box px={2} pt={2}>
          <TextInput
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: "14px", mb: 0 }}
            fullWidth={false}
          />
        </Box>

        {/* Table */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : (
          <CommonTable
            data={data}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            containerHeight="calc(100vh - 362px)"
          />
        )}
      </Paper>

      {/* User Limit Modal */}
      <CommonModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        title={selectedUser?.userLimit ? "Edit User Limit" : "Add User Limit"}
        size="sm"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            {selectedUser?.userLimit ? 'Update' : 'Set'} discount limit for {selectedUser?.firstName} {selectedUser?.lastName}
          </Typography>
          
          <TextInput
            label="User Discount Limit ($)"
            type="number"
            value={userLimitValue}
            onChange={(e) => setUserLimitValue(Number(e.target.value) || 0)}
            fullWidth
            inputProps={{ 
              min: 0,
              step: 0.01
            }}
            sx={{ mb: 3 }}
          />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <CustomButton
              appearance="outlined"
              onClick={() => setLimitModalOpen(false)}
              disabled={limitLoading}
              size="small"
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              onClick={handleSaveLimit}
              loading={limitLoading}
              size="small"
            >
              Save
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default Permissions;