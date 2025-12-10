import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import { showErrorToast } from '../../../utils/toastUtils';
import {
  getCheckerUsers,
} from '../../../redux/apis/distrubutor/epickApis';

interface CheckerUser {
  email: string;
  firstName: string;
  lastName: string;
  userNumber: string;
}

const CheckerUsersTab: React.FC = () => {
  const [checkerUsers, setCheckerUsers] = useState<CheckerUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch checker users
  const fetchCheckerUsers = async () => {
    setLoading(true);
    try {
      const response: any = await getCheckerUsers();
      console.log('Checker Users API Response:', response);
      
      let usersData = [];
      if (response?.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      }
      
      setCheckerUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch checker users:', error);
      showErrorToast('Failed to fetch checker users');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns: TableColumn<CheckerUser>[] = [
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
      minWidth: 250,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.email}
        </Typography>
      ),
    },
  ];

  // Fetch checker users on mount
  useEffect(() => {
    fetchCheckerUsers();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      <CommonTable
        data={checkerUsers}
        columns={columns}
        currentPage={1}
        totalPages={1}
        totalItems={checkerUsers.length}
        pageSize={checkerUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        loading={loading}
        isPagination={false}
        containerHeight="calc(100vh - 300px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No checker users found</Typography>
          </Box>
        }
      />
    </Box>
  );
};

export default CheckerUsersTab;

