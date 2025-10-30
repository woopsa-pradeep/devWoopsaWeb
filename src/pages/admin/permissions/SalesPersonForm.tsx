import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import TextInput from '../../../component/atoms/TextInput';
// import SelectInput from '../../../component/atoms/SelectInput';
import SearchableDropdown from '../../../component/atoms/SearchableDropdown';
import SwitchInput from '../../../component/atoms/SwitchInput';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import { getUserList, getSalesRepList } from '../../../redux/apis/distrubutor/listApis';
import { 
  salesPersonSchema, 
  SalesPersonFormData, 
  roleOptions
} from './salesPersonSchema';
import { ArrowBack } from '@mui/icons-material';

interface SalesPersonFormProps {
  mode: 'add' | 'edit';
  initialData?: SalesPersonFormData;
  onSubmit: (data: SalesPersonFormData) => void;
  loading?: boolean;
}

const SalesPersonForm: React.FC<SalesPersonFormProps> = ({
  mode,
  initialData,
  onSubmit,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [userNumberOptions, setUserNumberOptions] = useState<any[]>([]);
  const [salesRepNumberOptions, setSalesRepNumberOptions] = useState<any[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SalesPersonFormData>({
    resolver: zodResolver(salesPersonSchema),
    defaultValues: initialData || {
      email: '',
      firstName: '',
      lastName: '',
      role: '',
      userNumber: '',
      salesRepNumber: '',
      status: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Handle initial data for searchable dropdowns
  useEffect(() => {
    if (initialData && userNumberOptions.length > 0) {
      const userOption = userNumberOptions.find(opt => opt.value === initialData.userNumber);
      if (userOption) {
        setValue('userNumber', userOption.value);
      }
    }
  }, [initialData, userNumberOptions, setValue]);

  useEffect(() => {
    if (initialData && salesRepNumberOptions.length > 0) {
      const salesRepOption = salesRepNumberOptions.find(opt => opt.value === initialData.salesRepNumber);
      if (salesRepOption) {
        setValue('salesRepNumber', salesRepOption.value);
      }
    }
  }, [initialData, salesRepNumberOptions, setValue]);

  useEffect(() => {
    if (initialData && roleOptions.length > 0) {
      const roleOption = roleOptions.find(opt => opt.value === initialData.role);
      if (roleOption) {
        setValue('role', roleOption.value);
      }
    }
  }, [initialData, setValue]);

  // Clear salesRepNumber when role changes to 'epick'
  const handleRoleChange = (selectedOption: any) => {
    setValue('role', selectedOption?.value || '');
    if (selectedOption?.value === 'epick') {
      setValue('salesRepNumber', '');
    }
  };

  useEffect(() => {
    Promise.all([getUserList(), getSalesRepList()])
      .then(([userRes, salesRepRes]: any) => {
        const userList = userRes?.data?.data || [];
        const salesRepList = salesRepRes?.data?.data || [];
        setUserNumberOptions(userList?.map((u: any) => {
          return { label: u?.UserName , value: String(u?.UserNumber) }
        }) || []);
        setSalesRepNumberOptions(salesRepList?.map((s: any) => {
          return { label: s?.S_Desc , value:String(s?.S_Number) }
        }) || []);
      })
      .catch(() => {
        toast.error('Failed to load dropdown data');
      })
  }, []);

  const handleFormSubmit = async (data: SalesPersonFormData) => {
    try {
      // If role is 'epick', remove salesRepNumber from payload
      const payload = { ...data };
      if (data.role === 'epick') {
        delete payload.salesRepNumber;
      }
      await onSubmit(payload);
    } catch (error: any) {
      // Error handling is done in parent components
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/admin/permissions');
  };

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >     
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ArrowBack onClick={() => navigate('/admin/permissions')} sx={{ fontSize: 24 }} />
          <Typography fontSize={18} fontWeight={400} color="text.primary">
            {mode === 'add' ? 'Add New User' : 'Edit User'}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ boxShadow: "none", borderRadius: "0px", p: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <Grid container spacing={3}>
            {/* Email */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* First Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="First Name"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* Last Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Last Name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* Role */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableDropdown
                label="Role"
                options={roleOptions}
                value={roleOptions.find(opt => opt.value === watch('role')) || null}
                onChange={handleRoleChange}
                error={!!errors.role}
                helperText={errors.role?.message}
                placeholder="Search role..."
              />
            </Grid>

            {/* User Number */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableDropdown
                label="User Number"
                options={userNumberOptions}
                value={userNumberOptions.find(opt => opt.value === watch('userNumber')) || null}
                onChange={(selectedOption) => {
                  setValue('userNumber', selectedOption?.value || '');
                }}
                error={!!errors.userNumber}
                helperText={errors.userNumber?.message}
                placeholder="Search user number..."
              />
            </Grid>

            {/* Sales Rep Number - Only show when role is not 'epick' */}
            {watch('role') !== 'epick' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableDropdown
                  label="Sales Rep Number"
                  options={salesRepNumberOptions}
                  value={salesRepNumberOptions.find(opt => opt.value === watch('salesRepNumber')) || null}
                  onChange={(selectedOption) => {
                    setValue('salesRepNumber', selectedOption?.value || '');
                  }}
                  error={!!errors.salesRepNumber}
                  helperText={errors.salesRepNumber?.message}
                  placeholder="Search sales rep number..."
                />
              </Grid>
            )}

            {/* Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <SwitchInput
                    label="Status"
                    checked={field.value}
                    onChange={field.onChange}
                    sx={{ mb: 0 }}
                    isShowLabel={false}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box display="flex" gap={2} mt={4} flexWrap="wrap">
            <CustomButton
              type="submit"
              loading={loading}
              fullWidth={false}
              sx={{ minWidth: 120 }}
            >
              {mode === 'add' ? 'Create User' : 'Update User'}
            </CustomButton>
            <CustomButton
              type="button"
              buttonType="cancel"
              appearance="outlined"
              onClick={handleCancel}
              fullWidth={false}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </CustomButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesPersonForm;