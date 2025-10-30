import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import CustomButton from '../../../component/atoms/CustomButton';
import SwitchInput from '../../../component/atoms/SwitchInput';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import toast from 'react-hot-toast';
import { createRolePermissions, updateRolePermissions, getUserRolePermissions } from '../../../redux/apis/distrubutor/permissionsApis';
import { ArrowBack } from '@mui/icons-material';

const RolesPermissionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  
  // Get user data from location state
  const userData = location.state?.userData;
    

  // Default permissions template
  const getDefaultPermissions = (id: string, name: string) => [
    {
      salesId: id,
      name: name,
      module: 'Account Receivable',
      add: false,
      view: false,
      edit: false,
    },
    // {
    //   salesId: id,
    //   name: name,
    //   module: 'Vendors',
    //   add: false,
    //   view: false,
    //   edit: false,
    // },
  ];

  useEffect(() => {
    if (!id) return;
    
    const fetchRolesPermissions = async () => {
      try {
        setLoading(true);
        
        if (id === 'new') {
          setIsNew(true);
          
          const defaultPermissions = getDefaultPermissions('new', userData?.firstName + ' ' + userData?.lastName || 'New User');
          const withPath = defaultPermissions.map((row: any) => ({
            ...row,
            path: generatePath('sales', row.module),
          }));
          setRows(withPath);
        } else {
          if (userData) {
          }

          const response: any = await getUserRolePermissions(id);
          const permissionsData = response?.data?.data;
          
          const defaultPermissions = getDefaultPermissions(id, userData?.firstName + ' ' + userData?.lastName || 'User');
          
          if (Array.isArray(permissionsData)) {
            // Merge existing permissions with default permissions
            const mergedPermissions = defaultPermissions.map(defaultModule => {
              const existingModule = permissionsData.find(p => p.module === defaultModule.module);
              if (existingModule) {
                return {
                  ...defaultModule,
                  id: existingModule.id,
                  add: !!existingModule.add,
                  view: !!existingModule.view,
                  edit: !!existingModule.edit,
                };
              }
              return defaultModule;
            });

            const withPath = mergedPermissions.map((row: any) => ({
              ...row,
              path: generatePath(userData?.role || 'sales', row.module),
            }));
            setRows(withPath);
            setIsNew(false);
          } else {
            // Use default permissions if no existing permissions
            setIsNew(true);
            const withPath = defaultPermissions.map((row: any) => ({
              ...row,
              path: generatePath(userData?.role || 'sales', row.module),
            }));
            setRows(withPath);
          }
        }
      } catch (error: any) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load permissions data');
      } finally {
        setLoading(false);
      }
    };

    fetchRolesPermissions();
  }, [id, userData]);

  function generatePath(role: string, module: string) {
    return `/${role}/${module}`
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/&/g, 'and');
  }

  const handleToggle = (rowIdx: number, field: string, value: boolean) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIdx
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    let payload;
    try {
      // Include all rows in payload regardless of permissions
      if (isNew) {
        payload = {
          userId: Number(id),
          permissions: rows.map((row) => ({
            module: row.module,
            add: !!row.add,
            view: !!row.view,
            edit: !!row.edit,
            path: row.path,
          })),
        };
        await createRolePermissions(payload);
        toast.success('Permissions added successfully!');
      } else {
        payload = {
          userId: Number(id),
          permissions: rows.map((row) => ({
            id: row.id,
            module: row.module,
            add: !!row.add,
            view: !!row.view,
            edit: !!row.edit,
            path: row.path,
          })),
        };
        await updateRolePermissions(payload);
        toast.success('Permissions updated successfully!');
      }
      // setPayload(payload);
      setSaving(false);
      navigate('/admin/permissions');
    } catch (error: any) {
      setSaving(false);
      toast.error(error?.message || 'Something went wrong!');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const columns: TableColumn[] = [
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary">{row.name}</Typography>
      ),
    },
    {
      id: 'module',
      label: 'Module Name',
      render: (row) => (
        <Typography fontSize={14} color="text.secondary">{row.module}</Typography>
      ),
    },
    {
      id: 'add',
      label: 'Add',
      render: (row: any, rowIdx: number) => (
        <SwitchInput
          checked={!!row.add}
          onChange={(checked) => handleToggle(rowIdx, 'add', checked)}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      ),
    },
    {
      id: 'view',
      label: 'View',
      render: (row: any, rowIdx: number) => (
        <SwitchInput
          checked={!!row.view}
          onChange={(checked) => handleToggle(rowIdx, 'view', checked)}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      ),
    },
    {
      id: 'edit',
      label: 'Edit',
      render: (row: any, rowIdx: number) => (
        <SwitchInput
          checked={!!row.edit}
          onChange={(checked) => handleToggle(rowIdx, 'edit', checked)}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ArrowBack onClick={() => navigate('/admin/permissions')} sx={{ fontSize: 24 }} />
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          Roles & Permissions
        </Typography>
      </Box>
      <Paper sx={{ boxShadow: 'none', borderRadius: '0px', p: 2 }}>
        <CommonTable
          columns={columns}
          data={rows}
          loading={loading}
          currentPage={1}
          totalPages={1}
          totalItems={rows.length}
          pageSize={10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <CustomButton buttonType="cancel" appearance="outlined" onClick={() => navigate('/admin/permissions')} fullWidth={false} sx={{ minWidth: 120 }}>
            Cancel
          </CustomButton>
          <CustomButton type="button" onClick={handleSubmit} loading={saving} fullWidth={false} sx={{ minWidth: 120 }}>
            {isNew ? 'Add Permissions' : 'Update Permissions'}
          </CustomButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default RolesPermissionsPage;