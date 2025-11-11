import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Grid,
  Chip,
  Divider 
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import CustomButton from '../../../component/atoms/CustomButton';
import { SalesPerson } from './types';
import toast from 'react-hot-toast';

const ViewSalesPerson = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);

  // Get user data from location state
  const userData = location.state?.userData;

  console.log(userData,'the loaction data');

  useEffect(() => {
    const fetchSalesPerson = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Get user data from location state
        if (userData) {
          setSalesPerson(userData);
        } else {
          toast.error('No user data available');
          navigate('/admin/permissions');
        }
      } catch (error) {
        console.error('Error fetching sales person:', error);
        toast.error('Failed to fetch sales person data');
        navigate('/admin/permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesPerson();
  }, [id, navigate, userData]);

  const handleBack = () => {
    navigate('/admin/permissions');
  };

  const handleEdit = () => {
    navigate(`/admin/permissions/edit/${id}`, {
      state: {
        userData: salesPerson
      }
    });
  };

  // Helper function to format salesRepNumber
  const formatSalesRepNumber = (salesRepNumber: string | undefined): string => {
    if (!salesRepNumber) return 'N/A';
    
    try {
      // Handle PostgreSQL array format like {"5","2"} or JSON array like ["5","2"]
      // First, try to parse as JSON
      const parsed = JSON.parse(salesRepNumber);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
    } catch {
      // If JSON parsing fails, try to extract from PostgreSQL array format {"5","2"}
      // Remove curly braces and quotes, then split by comma
      const cleaned = salesRepNumber.replace(/[{}"]/g, '');
      if (cleaned.includes(',')) {
        return cleaned.split(',').map(item => item.trim()).join(', ');
      }
    }
    
    // If it's already a simple string, return as is
    return salesRepNumber;
  };

  // Helper function to get all Sales Rep Names
  const getSalesRepNames = (): string => {
    if (!salesPerson?.salesRep || !Array.isArray(salesPerson.salesRep) || salesPerson.salesRep.length === 0) {
      return 'N/A';
    }
    return salesPerson.salesRep.map(rep => rep.S_Desc).join(', ');
  };

  if (loading) {
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
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

  if (!salesPerson) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="50vh"
      >
        <Typography>User not found</Typography>
      </Box>
    );
  }

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
        <Box display="flex" alignItems="center" gap={2}>
            
           <ArrowBackIcon onClick={handleBack} style={{ cursor: 'pointer' }}/>
          <Typography fontSize={18} fontWeight={400} color="text.primary">
            User Details
          </Typography>
        </Box>
        <CustomButton
          onClick={handleEdit}
          fullWidth={false}
          sx={{ mt: 0 }}
        >
          Edit
        </CustomButton>
      </Box>

      <Paper sx={{ boxShadow: "none", borderRadius: "0px", p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={12}>
            <Typography fontSize={16} fontWeight={600} mb={2} color="text.primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Email
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {salesPerson.email}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Full Name
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {salesPerson.firstName} {salesPerson.lastName}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Role
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {salesPerson.role}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Status
            </Typography>
            <Chip
              label={salesPerson.status ? 'Active' : 'Inactive'}
              color={salesPerson.status ? 'success' : 'error'}
              size="small"
              sx={{ 
                backgroundColor: salesPerson.status ? 'rgba(10, 255, 112, 0.1)' : 'rgba(255, 102, 102, 0.1)',
                color: salesPerson.status ? 'rgb(8, 194, 33)' : 'rgb(255, 102, 102)',
                fontWeight: 500,
              }}
            />
          </Grid>

          {/* System Information */}
          <Grid size={12}>
            <Typography fontSize={16} fontWeight={600} mb={2} color="text.primary" mt={2}>
              System Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              User Number
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {salesPerson.userNumber}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Sales Rep Number
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {formatSalesRepNumber(salesPerson.salesRepNumber)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Sales Rep Name
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {getSalesRepNames()}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Is Active
            </Typography>
            <Chip
              label={salesPerson.isActive ? 'Yes' : 'No'}
              color={salesPerson.isActive ? 'success' : 'error'}
              size="small"
              sx={{ 
                backgroundColor: salesPerson.isActive ? 'rgba(10, 255, 112, 0.1)' : 'rgba(255, 102, 102, 0.1)',
                color: salesPerson.isActive ? 'rgb(8, 194, 33)' : 'rgb(255, 102, 102)',
                fontWeight: 500,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Created At
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {new Date(salesPerson.createdAt).toISOString().slice(0,10).replace(/-/g, '/')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={1}>
              Last Updated
            </Typography>
            <Typography fontSize={14} color="text.primary">
              {new Date(salesPerson.updatedAt).toISOString().slice(0,10).replace(/-/g, '/')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ViewSalesPerson; 