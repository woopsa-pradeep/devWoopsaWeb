import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Paper,
  Card,
  CardContent,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';

import { RootState } from '../../../redux/store';
import { setActiveStep } from '../../../redux/slices/navigationSlice';
import { getRetailerRequestById } from '../../../redux/apis/distrubutor/retailerApis';
import { toast } from 'react-hot-toast';

const ViewRetailerRequest: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const { selectedRequest, loading } = useSelector((state: RootState) => state.retailerRequest);

  useEffect(() => {
    if (id && !selectedRequest) {
      loadRetailerRequest();
    }
  }, [id, selectedRequest]);

  const loadRetailerRequest = async () => {
    try {
      const response = await getRetailerRequestById(id!, {});
      const data = (response as any)?.data;
      if (data) {
        // Dispatch to Redux store
        dispatch({ type: 'retailerRequest/setSelectedRequest', payload: data });
      }
    } catch (error) {
      toast.error('Failed to load retailer request data');
      console.error('Error loading data:', error);
    }
  };

  const handleBackNavigation = () => {
    dispatch(setActiveStep('retailer-requests'));
    navigate('/admin/retailer-requests');
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MMM DD, YYYY') : 'Invalid Date';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      UNDER_REVIEW: 'info',
    } as const;
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography variant="body2" fontWeight={400}>Loading...</Typography>
      </Box>
    );
  }

  if (!selectedRequest) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography variant="body2" fontWeight={400}>No retailer request data found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      {/* Header */}
      <Box 
        sx={{
          px: 2,
          py: 1.5,
          mb: 2
        }}
      >
        <Box display="flex" alignItems="start">
          <IconButton 
            onClick={handleBackNavigation} 
            size="small"
            sx={{ 
              color: 'primary.main', 
              mr: 1.5,
              backgroundColor: '#f8f9fa',
              '&:hover': { backgroundColor: '#e9ecef' }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 400, 
                color: 'text.primary',
                fontSize: '1.125rem'
              }}
            >
              Retailer Request Details
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              ID: {selectedRequest.id || 'N/A'} • {formatDate(selectedRequest.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip 
              label={selectedRequest.status?.replace('_', ' ')} 
              color={getStatusColor(selectedRequest.status) as any}
              size="small"
              variant="outlined"
              sx={{ 
                fontWeight: 500,
                fontSize: '0.75rem',
                height: '24px'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, pb: 3 }}>
        <Grid container spacing={2}>
          {/* Business Information */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Business Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Business Name
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.business_name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem',wordBreak: 'break-word' }}>
                      DBA Name
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.dba_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem', wordBreak: 'break-word' }}>
                      Business Type
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.business_type?.replace('_', ' ')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem', wordBreak: 'break-word' }}>
                      Federal EIN
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.federal_ein || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem', wordBreak: 'break-word' }}>
                      Ownership Type
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.ownership_type || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Contact Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem', wordBreak: 'break-word' }}>
                      Primary Contact
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.primary_contact}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Phone
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem', wordBreak: 'break-word' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word', color: 'primary.main' }}>
                      {selectedRequest.email ? (
                        <Link
                          href={`mailto:${selectedRequest.email}`}
                          style={{ color: 'primary.main', textDecoration: 'none', wordBreak: 'break-word' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {selectedRequest.email}
                        </Link>
                      ) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Website
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word', color: 'primary.main' }}>
                      {selectedRequest.website ? (
                        <Link
                          href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`}
                          style={{ color: 'primary.main', textDecoration: 'none', wordBreak: 'break-word' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {selectedRequest.website}
                        </Link>
                      ) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Physical Address */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Physical Address
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Street Address
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.physical_street || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      City
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.physical_city || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      State
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.physical_state || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      ZIP Code
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.physical_zip || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      County
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.physical_county || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Mailing Address */}
          {!selectedRequest.mailing_same_as_physical && (
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                    Mailing Address
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                        Street Address
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                        {selectedRequest.mailing_street || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                        City
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                        {selectedRequest.mailing_city || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                        State
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                        {selectedRequest.mailing_state || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                        ZIP Code
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                        {selectedRequest.mailing_zip || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Licenses & Documents */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Licenses & Documents
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Sales Tax ID
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.sales_tax_id || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      State Tobacco License
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.state_tobacco_license || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Federal Tobacco Permit
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word'  }}>
                      {selectedRequest.federal_tobacco_permit || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Information */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Financial Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Credit Limit Requested
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                      <Chip 
                        label={selectedRequest.credit_limit_requested ? 'Yes' : 'No'} 
                        color={selectedRequest.credit_limit_requested ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500, height: '20px', fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Grid>
                  {selectedRequest.credit_limit_requested && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                          Bank Name
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                          {selectedRequest.bank_name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                          Bank Account Last 4
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                          {selectedRequest.bank_account_last4 || 'N/A'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Delivery & Shipping */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Delivery & Shipping
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Preferred Delivery Time
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.preferred_delivery_time || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Special Instructions
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.special_delivery_instructions || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance & Signature */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  Compliance & Signature
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Compliance Certification
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                      <Chip 
                        label={selectedRequest.compliance_certification ? 'Certified' : 'Not Certified'} 
                        color={selectedRequest.compliance_certification ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500, height: '20px', fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Authorized Signature
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {selectedRequest.authorized_signature || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Signature Date
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word'  }}>
                      {selectedRequest.signature_date ? formatDate(selectedRequest.signature_date) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                  System Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Created Date
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {formatDate(selectedRequest.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.8rem', wordBreak: 'break-word'  }}>
                      {formatDate(selectedRequest.updatedAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Owners - Full Width */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 2, fontSize: '0.875rem' }}>
                  Business Owners ({selectedRequest.owners?.length || 0})
                </Typography>
                {selectedRequest?.owners && selectedRequest?.owners?.length > 0 ? (
                  <Grid container spacing={2}>
                    {selectedRequest?.owners?.map((owner: any, index: any) => (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 1.5, 
                            border: index === 0 ? '1px solid' : '1px solid',
                            borderColor: index === 0 ? 'primary.main' : '#e9ecef',
                            borderRadius: 1,
                          }}
                        >
                          <Box display="flex" alignItems="center" mb={1}>
                            <Chip 
                              label={index === 0 ? 'Primary Owner' : `Owner ${index + 1}`}
                              // color={index === 0 ? 'primary' : 'default'}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 500, height: '20px', fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Full Name
                              </Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.fullName}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Title
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.title || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Ownership %
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.ownership || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Date of Birth
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.dateOfBirth ? formatDate(owner.dateOfBirth) : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Phone
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.phone || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Email
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {owner.email || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Home Address
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word'   }}>
                                {owner.homeAddress || 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontWeight={400} sx={{ fontSize: '0.8rem' }}>
                    No owners information available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Business References - Full Width */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 2, fontSize: '0.875rem' }}>
                  Business References ({selectedRequest.references?.length || 0})
                </Typography>
                {selectedRequest.references && selectedRequest.references.length > 0 ? (
                  <Grid container spacing={2}>
                    {selectedRequest.references.map((reference, index) => (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 1.5, 
                            border: '1px solid',
                            borderColor: '#e9ecef',
                            borderRadius: 1,
                            backgroundColor: 'background.paper'
                          }}
                        >
                          <Box display="flex" alignItems="center" mb={1}>
                            <Chip 
                              label={`Reference ${index + 1}`}
                              variant="outlined"
                              // color="primary"
                              size="small"
                              sx={{ fontWeight: 500, height: '20px', fontSize: '0.7rem', color: 'primary.main', borderColor: 'primary.main' }}
                            />
                          </Box>
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Company
                              </Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {reference.company}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Contact Person
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {reference.contact || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Phone
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                                {reference.phone || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                                Email
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.75rem', wordBreak: 'break-word' }}>  
                                {reference.email || 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontWeight={400} sx={{ fontSize: '0.8rem' }}>
                    No references information available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ViewRetailerRequest;
