import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import SalesPersonForm from './SalesPersonForm';
import { SalesPersonFormData } from './salesPersonSchema';
import { updateUser } from '../../../redux/apis/distrubutor/permissionsApis';
import toast from 'react-hot-toast';

const EditSalesPerson = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<SalesPersonFormData | null>(null);

  // Get user data from location state
  const userData = location.state?.userData;

  // Helper function to parse salesRepNumber string to array
  const parseSalesRepNumber = (salesRepNumber: string | string[] | undefined, salesRep?: any[]): string[] => {
    // If it's already an array, return it
    if (Array.isArray(salesRepNumber)) {
      return salesRepNumber.map(num => String(num));
    }
    
    // If salesRep array is available, use it to extract S_Number values
    if (salesRep && Array.isArray(salesRep) && salesRep.length > 0) {
      return salesRep.map(rep => String(rep.S_Number));
    }
    
    // If it's a string, try to parse it
    if (typeof salesRepNumber === 'string' && salesRepNumber) {
      try {
        // Try to parse as JSON array like ["5","2"]
        const parsed = JSON.parse(salesRepNumber);
        if (Array.isArray(parsed)) {
          return parsed.map(num => String(num));
        }
      } catch {
        // If JSON parsing fails, try to extract from PostgreSQL array format {"5","2"}
        // Remove curly braces and quotes, then split by comma
        const cleaned = salesRepNumber.replace(/[{}"]/g, '');
        if (cleaned.includes(',')) {
          return cleaned.split(',').map(item => item.trim()).filter(Boolean);
        }
        // If it's a single value string, return as array
        if (cleaned) {
          return [cleaned];
        }
      }
    }
    
    return [];
  };

  useEffect(() => {
    if (userData) {
      // Transform userData to match SalesPersonFormData format
      const formData: SalesPersonFormData = {
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || '',
        userNumber: userData.userNumber || '',
        salesRepNumber: parseSalesRepNumber(userData.salesRepNumber, userData.salesRep),
        status: userData.status || true,
      };
      setInitialData(formData);
    } else {
      toast.error('No user data available for editing');
      navigate('/admin/permissions');
    }
  }, [userData, navigate]);

  const handleSubmit = async (data: SalesPersonFormData) => {
    if (!id) {
      toast.error('User ID is required');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the update payload
      const updatePayload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        userNumber: data.userNumber,
        salesRepNumber: data.salesRepNumber,
        status: data.status,
      };

      const response: any = await updateUser(id, updatePayload);
      
      if (response.status === 200) {
        toast.success(response?.data?.message || 'User updated successfully!');
        navigate('/admin/permissions');
      } else {
        toast.error(response?.data?.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="50vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <div>Loading user data...</div>
      </Box>
    );
  }

  return (
    <SalesPersonForm
      mode="edit"
      initialData={initialData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
};

export default EditSalesPerson; 