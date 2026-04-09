import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import { Dayjs } from "dayjs";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextInput from "../atoms/TextInput";
import CustomDatePicker from "../atoms/CustomDatePicker";
import SwitchInput from "../atoms/SwitchInput";
import { MultiSearchableDropdown } from "../atoms/SearchableDropdown";
import CustomButton from "../atoms/CustomButton";
import { getRegisterCustomerList } from "../../redux/apis/distrubutor/listApis";



interface NotificationFormProps {
  initialData?: NotificationFormSchema;
  onSubmit: (data: NotificationFormSchema) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface Customer {
  customerName: {
    C_Number: number;
    C_Name: string;
    C_CoName: string;
  }
}

const notificationFormSchema = z.object({
  _id: z.string().optional(),
  userId: z.array(z.number()).min(1, "At least one user is required"),
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().min(1, "Description is required"),
  date: z.custom<Dayjs | null>().refine(date => date !== null, "Date is required").nullable(),
  time: z.string().min(1, "Time is required"),
  isActive: z.boolean()
});

type NotificationFormSchema = z.infer<typeof notificationFormSchema>;

const NotificationForm: React.FC<NotificationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [users, setUsers] = useState<Customer[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Customer[]>([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<NotificationFormSchema>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: initialData || {
      userId: [],
      title: "",
      description: "",
      date: null,
      time: "",
      isActive: true,
    }
  });

  // Fetch users only on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update filtered users when users or search query changes
  useEffect(() => {
    filterUsers(searchQuery);
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getRegisterCustomerList();
      const data = (response as any)?.data?.data || [];
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserChange = (selectedOptions: {label: string, value: string}[]) => {
    // Check if "select all" option is selected
    const hasSelectAll = selectedOptions.some(option => option.value === 'select-all');
    
    if (hasSelectAll) {
      // If "Select All" is selected, select all filtered users
      const usersToSelect = filteredUsers.length > 0 ? filteredUsers : users;
      const allUserIds = usersToSelect.map(user => user.customerName.C_Number);
      setValue('userId', allUserIds);
    } else {
      // Filter out "select all" option and set regular user selection
      const filteredOptions = selectedOptions.filter(option => option.value !== 'select-all');
      const userIds: number[] = filteredOptions.map(option => Number(option.value));
      setValue('userId', userIds);
    }
  };

  const handleSearchChange = (searchValue: string) => {
    setSearchQuery(searchValue);
  };

  // Filter users based on search query
  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return users;
    }
    
    const filtered = users.filter(user => {
      const name = user.customerName.C_Name || user.customerName.C_CoName || '';
      const id = user.customerName.C_Number.toString();
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) || 
             id.includes(searchTerm);
    });
    
    setFilteredUsers(filtered);
    return filtered;
  };


  const removeUser = (userId: number) => {
    const currentUsers = watch('userId');
    setValue('userId', currentUsers.filter(id => id !== userId));
  };

  const handleFormSubmit: SubmitHandler<NotificationFormSchema> = (data) => {
    // Transform the data to match your desired payload format
    const transformedData = {
      ...data,
      date: data.date?.format('YYYY-MM-DD'),
      time: data.time,
      isActive: data.isActive,
    };
    
    onSubmit(transformedData as any);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container rowSpacing={0.5} columnSpacing={3}>
        {/* Title */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Notification Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                placeholder="Enter notification title"
              />
            )}
          />
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6}} sx={{display: 'flex', alignItems: 'center'}}>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <SwitchInput
                label="Active Status"
                checked={field.value}
                onChange={field.onChange}
                isShowLabel={false}
              />
            )}
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12}}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Notification Description"
                error={!!errors.description}
                helperText={errors.description?.message}
                placeholder="Enter notification description"
                multiline
                rows={3}
              />
            )}
          />
        </Grid>

        {/* Date */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="Notification Date"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.date as boolean}
                helperText={errors.date?.message}
              />
            )}
          />
        </Grid>

        {/* Time */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <Box sx={{ mb: 2.2 }}>
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  mb={"5px"}
                  sx={{ opacity: "70%" }}
                >
                  Notification Time
                </Typography>
                <TextInput
                  {...field}
                  type="time"
                  error={!!errors.time}
                  helperText={errors.time?.message}
                  placeholder="Select time"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: "12px",
                    },
                  }}
                />
              </Box>
            )}
          />
        </Grid>

        {/* User Selection */}
        <Grid size={{ xs: 12}}>
          <Controller
            name="userId"
            control={control}
            render={({ field }) => {
              const dropdownValue = Array.isArray(field.value) ? field.value.map(userId => {
                const user = users?.find(u => u.customerName.C_Number === userId);
                return {
                  label: user ? `${user.customerName.C_Name || user.customerName.C_CoName} (ID: ${user.customerName.C_Number})` : `User ${userId}`,        
                  value: String(userId),
                };
              }) : [];
              
              // Use filtered users for options
              const currentUsers = filteredUsers.length > 0 ? filteredUsers : users;
              const userOptions = currentUsers?.map((u) => ({
                label: `${u.customerName.C_Name || u.customerName.C_CoName} (ID: ${u.customerName.C_Number})`,
                value: String(u.customerName.C_Number),
              })) || [];

              // Add select all option with dynamic label
              const selectAllLabel = searchQuery.trim() 
                ? `Select All Filtered Users (${currentUsers.length})`
                : `Select All Users (${users.length})`;
              
              const selectAllOption = {
                label: selectAllLabel,
                value: "select-all",
              };

              const allOptions = [selectAllOption, ...userOptions];

               return (
                 <MultiSearchableDropdown
                   label="Select Users"
                   options={allOptions}
                   value={dropdownValue}
                   onChange={handleUserChange}
                   onSearchChange={handleSearchChange}
                   loading={loadingUsers}
                   placeholder="Search by name or ID and select users"
                   noOptionsText="No users found"
                   error={!!errors.userId}
                   helperText={errors.userId?.message}
                 />
               );
            }}
          />
        </Grid>

        {/* Selected Users Display */}
        {watch('userId').length > 0 && (
          <Grid size={{ xs: 12}}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'background.paper',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} color="grey.700">
                  Selected Users ({watch('userId').length})
                </Typography>
              </Box>
              
              {/* Users List */}
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {watch('userId').map((userId, index) => {
                  const user = users.find(u => u.customerName.C_Number === userId);
                  return (
                    <Box
                      key={userId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderBottom: index < watch('userId').length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="caption" color="white" fontWeight={600}>
                            {index + 1}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user?.customerName.C_Name || user?.customerName.C_CoName || 'User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {userId}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeUser(userId)}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'error.dark',
                          },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </Box>
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={3}>
        <CustomButton
          type="submit"
          appearance="filled"
          loading={loading}
          fullWidth={false}
        >
          {initialData ? "Update Notification" : "Create Notification"}
        </CustomButton>
        <CustomButton
          type="button"
          appearance="outlined"
          onClick={onCancel}
          fullWidth={false}
        >
          Cancel
        </CustomButton>
      </Box>
    </Box>
  );
};

export default NotificationForm; 