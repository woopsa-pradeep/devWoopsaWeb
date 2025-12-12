import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useMediaQuery,
  Grow,
} from '@mui/material';
import TextInput from '../../../component/atoms/TextInput';
import SelectInput from '../../../component/atoms/SelectInput';
import CheckboxInput from '../../../component/atoms/CheckboxInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { vendorSchema, VendorFormData } from './vendor.schema';
import { createVendor, listOfVendorsCreate, getVendorById, updateVendor } from '../../../redux/apis/distrubutor/VendorsApis';
import toast from 'react-hot-toast';

const AddVendor: React.FC = () => {
  const { vendorId } = useParams<{ vendorId?: string }>();
  const isEditMode = !!vendorId;
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [termsOptions, setTermsOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [termsData, setTermsData] = useState<Array<{ TermsCode: number; Terms: string; DaysUntilDue: number; TermsType: number }>>([]);
  const [selectedTermsCode, setSelectedTermsCode] = useState<string>('');
  const [documentFormatOptions, setDocumentFormatOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [jurisdictionStateOptions, setJurisdictionStateOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [vendorGroupOptions, setVendorGroupOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [buyerIDOptions, setBuyerIDOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    trigger,
    setValue,
    watch,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      V_Description: '',
      V_Addr1: '',
      V_Addr2: '',
      V_City: '',
      V_State: '',
      V_Zip: '',
      V_Country: '',
      AddressType: 0,
      V_Phone: '',
      V_Fax: '',
      V_Broker: '',
      V_Broker_Rep: '',
      V_Broker_Phone: '',
      V_Broker_Fax: '',
      V_MinOrder_Weight: 0,
      V_MinOrder_Dollars: 0,
      V_MinOrder_Cases: 0,
      V_Terms: '',
      V_AccountNumber: '',
      V_EFT: '',
      V_Comment: '',
      V_Backorders: 1,
      V_BackorderAmount: 0,
      V_BillTo_Name: '',
      V_BillTo_Addr1: '',
      V_BillTo_Addr2: '',
      V_BillTo_City: '',
      V_BillTo_State: '',
      V_BillTo_Zip: '',
      V_BillTo: 0,
      V_PurchasesMTD: 0,
      V_PurchasesYTD: 0,
      V_Order_Interval: 0,
      V_Lead_Time: 0,
      V_Email: '',
      Pad_Pct: 0.0000,
      Vendor_Group: 0,
      FTP_Host: '',
      FTP_User: '',
      FTP_Password: '',
      FTP_Directory: '',
      QB_Name: '',
      V_Order_IntervalDays: 0,
      V_Lead_TimeDays: 0,
      V_PO_OutputFormat: 0,
      V_PO_OutputFolder: '',
      Jurisdiction_State: '',
      Jurisdiction_County: '',
      Jurisdiction_City: '',
      V_TID: '',
      V_FEIN: '',
      V_Status: '',
      Taxes_Prepaid: 0,
      PrepaidTax_Calculation_Select: '00',
      MSA_Status: 'N/A',
      First_Importer: 0,
      TaxPaid_State: '',
      Foreign_Manufacturer: 0,
      V_PO_InputFormat: 0,
      V_PO_InputFolder: '',
      QB_TaxVendor: '',
      OTP_TaxReverseOnEntry: 0,
      Buyer_ID: '',
      V_PO_InputOption: 0,
      FTP_Protocol: 0,
      FTP_Mode: 0,
      FTP_FileExt: "",
      V_FullCase: 'A',
      V_Inactive: 0,
      V_EmailSend: 0,
      V_PO_ReportFormat: '',
      V_PrimarySupplier: 1,
      V_PurchaseSchedule: 0,
      TermsCode: '',
      V_ReturnStatus: 'N',
      V_BackorderStatus: 'N',
      Product_ExpDays: 0,
      ExpDate_License: new Date().toISOString().split('T')[0],
      V_MinOrder_Pallets: 0,
    },
  });

  useEffect(() => {
    fetchVendorCreateLists();
    if (isEditMode && vendorId) {
      fetchVendorData();
    }
  }, [isEditMode, vendorId]);

  const fetchVendorData = async () => {
    try {
      setLoadingLists(true);
      const response: any = await getVendorById(vendorId!);
      const vendorData = response?.data || response;
      
      if (vendorData) {
        setOriginalData(vendorData);
        
        // Convert numeric fields to strings where schema expects strings
        const stringFields = [
          'Jurisdiction_State', 'Jurisdiction_County', 'Jurisdiction_City',
          'QB_TaxVendor', 'Buyer_ID', 'V_PO_ReportFormat', 'TermsCode'
        ];
        
        // Pre-fill form with existing data
        Object.keys(vendorData).forEach((key) => {
          if (vendorData[key] !== null && vendorData[key] !== undefined) {
            // Special handling for PrepaidTax_Calculation_Select (convert 0 to '00')
            if (key === 'PrepaidTax_Calculation_Select') {
              const value = vendorData[key];
              setValue(key as any, value === 0 || value === '0' ? '00' : String(value));
            }
            // Convert to string if field expects string
            else if (stringFields.includes(key)) {
              setValue(key as any, String(vendorData[key]));
            } else {
              setValue(key as any, vendorData[key]);
            }
          }
        });

        // Set selected terms code if available
        if (vendorData.TermsCode) {
          setSelectedTermsCode(String(vendorData.TermsCode));
        }
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor data');
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchVendorCreateLists = async () => {
    setLoadingLists(true);
    try {
      const response = await listOfVendorsCreate() as any;
      const data = response?.data || {};
      
      // Extract terms list
      const terms = data.terms || [];
      setTermsData(terms);
      setTermsOptions(terms.map((term: any) => ({
        label: term.Terms || '',
        value: String(term.TermsCode || ''),
      })));
      
      // Extract document format list
      const formats = data.documentFormats || [];
      setDocumentFormatOptions(formats.map((format: any) => ({
        label: format.Document_Description || '',
        value: String(format.Document_FormatID || ''),
      })));
      
      // Extract jurisdiction state list
      const jurisdictionStates = data.jurisdictionState || [];
      setJurisdictionStateOptions(jurisdictionStates.map((state: any) => ({
        label: state.TaxDescription || '',
        value: String(state.Jurisdiction_State || ''),
      })));
      
      // Extract vendor group list
      const vendorGroups = data.vendorGroup || [];
      setVendorGroupOptions(vendorGroups.map((vendor: any) => ({
        label: vendor.V_Description || '',
        value: vendor.Primary_Vendor !== undefined && vendor.Primary_Vendor !== null ? String(vendor.Primary_Vendor) : '0',
      })));
      
      // Extract buyer ID list
      const buyerIDs = data.buyerID || [];
      setBuyerIDOptions(buyerIDs.map((buyer: any) => ({
        label: buyer.UserID || '',
        value: String(buyer.UserNumber || ''),
      })));
    } catch (error) {
      console.error('Error fetching vendor create lists:', error);
      toast.error('Failed to load vendor create lists');
    } finally {
      setLoadingLists(false);
    }
  };

  const onSubmit = async (data: VendorFormData) => {
    setSubmitting(true);
    try {
      if (isEditMode && vendorId && originalData) {
        // Only send changed fields
        const changedFields: any = {};
        Object.keys(data).forEach((key) => {
          const currentValue = data[key as keyof VendorFormData];
          const originalValue = originalData[key];
          
          // Deep comparison for objects/arrays
          if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
            changedFields[key] = currentValue;
          }
        });
        
        const response = await updateVendor(vendorId, changedFields) as any;
        if (response?.success) {
          toast.success(response?.message || 'Vendor updated successfully!');
          navigate('/admin/vendors');
        } else {
          toast.error(response?.message || 'Failed to update vendor');
        }
      } else {
        const response = await createVendor(data) as any;
        if (response?.success) {
          toast.success(response?.message || 'Vendor created successfully!');
          navigate('/admin/vendors');
        } else {
          toast.error(response?.message || 'Failed to create vendor');
        }
      }
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error(error?.response?.data?.message || error?.response?.message || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} vendor`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setActiveStep(0);
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate required fields for Step 1
      const isValid = await trigger(['V_Description', 'V_Addr1', 'V_City', 'V_State', 'V_Zip']);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const steps = [
    {
      label: 'Step 1',
    },
    {
      label: 'Step 2',
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 1.5 }, minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 2, maxWidth: '1400px', mx: 'auto' }}>
        {/* Back Button */}
        <Fade in={true} timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            {activeStep > 0 && (
              <CustomButton
                type="button"
                buttonType="cancel"
                appearance="outlined"
                onClick={handleBack}
                sx={{ minWidth: 120 }}
                fullWidth={false}
              >
                Back
              </CustomButton>
            )}
            {activeStep === 0 && <Box />}
          </Box>
        </Fade>

        {/* Stepper */}
        <Grow in={true} timeout={800}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 3,
              mb: 2,
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconComponent={(props) => {
                      const { active, completed, className } = props;
                      const isFirstOrSecond = index === 0 || index === 1;
                      return (
                        <Box
                          className={className}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: active || completed ? 'primary.main' : 'grey.400',
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${active || completed ? 'primary.main' : 'grey.400'}`,
                            boxShadow: active ? "0 0 0 4px rgba(25,118,210,0.12)" : undefined,
                            transition: "all 0.3s ease",
                          }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: isFirstOrSecond ? "#fff" : (active || completed ? "primary.main" : "grey.400"),
                              transition: "all 0.3s ease"
                            }}
                          />
                        </Box>
                      );
                    }}
                    StepIconProps={{
                      sx: {
                        '&.Mui-completed': {
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                          transition: 'all 0.3s ease',
                        },
                        '&.Mui-active': {
                          color: 'primary.main',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' },
                          },
                        },
                      },
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      }
                    }}>
                      <Typography variant="body2" sx={{
                        fontWeight: activeStep === index ? 500 : 400,
                        fontSize: '0.875rem',
                        color: activeStep === index ? 'primary.main' : 'text.secondary',
                        transition: 'all 0.3s ease',
                      }}>
                        {step.label}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grow>
      </Box>

      {/* Form Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Fade in={true} timeout={1000}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
              <form onSubmit={handleSubmit(onSubmit, (errors) => {
                console.error('Form validation errors:', errors);
                toast.error('Please fix the form errors before submitting');
              })}>
                {/* Hidden fields - included in payload with default values */}
                <input type="hidden" {...register('V_Comment')} />
                <input type="hidden" {...register('V_Status')} />
                <input type="hidden" {...register('V_BackorderAmount', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_BillTo_Name')} />
                <input type="hidden" {...register('V_BillTo_Addr1')} />
                <input type="hidden" {...register('V_BillTo_Addr2')} />
                <input type="hidden" {...register('V_BillTo_City')} />
                <input type="hidden" {...register('V_BillTo_State')} />
                <input type="hidden" {...register('V_BillTo', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PurchasesMTD', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PurchasesYTD', { valueAsNumber: true })} />
                <input type="hidden" {...register('Pad_Pct', { valueAsNumber: true })} />
                <input type="hidden" {...register('FTP_Host')} />
                <input type="hidden" {...register('FTP_User')} />
                <input type="hidden" {...register('FTP_Password')} />
                <input type="hidden" {...register('FTP_Directory')} />
                <input type="hidden" {...register('QB_Name')} />
                <input type="hidden" {...register('V_PO_OutputFormat', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PO_OutputFolder')} />
                <input type="hidden" {...register('V_PO_InputFormat', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PO_InputFolder')} />
                <input type="hidden" {...register('QB_TaxVendor')} />
                <input type="hidden" {...register('FTP_Protocol', { valueAsNumber: true })} />
                <input type="hidden" {...register('FTP_Mode', { valueAsNumber: true })} />
                <input type="hidden" {...register('FTP_FileExt')} />
                <input type="hidden" {...register('V_EmailSend', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PrimarySupplier', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_PurchaseSchedule', { valueAsNumber: true })} />
                <input type="hidden" {...register('V_BackorderStatus')} />
                <input type="hidden" {...register('Product_ExpDays', { valueAsNumber: true })} />
                <input type="hidden" {...register('ExpDate_License')} />

                {/* Step 1: Basic Information */}
                {activeStep === 0 && (
                  <Box>
                    {/* Header */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Vendor Information
                      </Typography>
                      
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Inactive"
                      control={control}
                      render={({ field }) => (
                        <CheckboxInput
                          singleLabel="Inactive"
                          checked={!!field.value}
                          onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </Grid>
                    </Box>

                    <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Description')}
                      label="Company Name *"
                      error={!!errors.V_Description}
                      helperText={errors.V_Description?.message}
                      placeholder="Enter Company Name"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Email')}
                      label="Email"
                      type="email"
                      error={!!errors.V_Email}
                      helperText={errors.V_Email?.message}
                      placeholder="Enter Email"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Phone"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Phone Number"
                          error={!!errors.V_Phone}
                          helperText={errors.V_Phone?.message}
                          placeholder="Enter Phone (e.g., +185697564)"
                          inputProps={{
                            maxLength: 12,
                          }}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^+0-9]/g, '');
                            // Ensure + is only at the start
                            if (value.includes('+') && value.indexOf('+') !== 0) {
                              value = value.replace(/\+/g, '');
                              value = '+' + value;
                            }
                            // Limit to 12 characters
                            value = value.slice(0, 12);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Fax"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Fax Number"
                          error={!!errors.V_Fax}
                          helperText={errors.V_Fax?.message}
                          placeholder="Enter Fax (e.g., +185697564)"
                          inputProps={{
                            maxLength: 12,
                          }}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^+0-9]/g, '');
                            // Ensure + is only at the start
                            if (value.includes('+') && value.indexOf('+') !== 0) {
                              value = value.replace(/\+/g, '');
                              value = '+' + value;
                            }
                            // Limit to 12 characters
                            value = value.slice(0, 12);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Terms"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          name={field.name}
                          value={selectedTermsCode || ''}
                          onChange={(e: any) => {
                            const termsCode = e.target.value;
                            setSelectedTermsCode(termsCode);
                            
                            // Find the selected term and set V_Terms to TermsType, TermsCode, and TermsType automatically
                            const selectedTerm = termsData.find((term: any) => String(term.TermsCode) === termsCode);
                            if (selectedTerm) {
                              setValue('V_Terms', selectedTerm.Terms);
                              setValue('TermsCode', String(selectedTerm.TermsCode));
                            }
                          }}
                          onBlur={field.onBlur}
                          label="Payment Terms"
                          options={termsOptions}
                          disabled={loadingLists}
                          error={!!errors.V_Terms}
                          helperText={errors.V_Terms?.message}
                        />
                      )}
                    />
                  </Grid>
                  {/* TermsCode field is hidden - automatically set when Payment Terms is selected */}
                  <input type="hidden" {...register('TermsCode')} />
                  
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_FEIN')}
                      label="FEIN"
                      error={!!errors.V_FEIN}
                      helperText={errors.V_FEIN?.message}
                      placeholder="Enter Tax ID"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Addr1')}
                      label="Address Line 1 *"
                      error={!!errors.V_Addr1}
                      helperText={errors.V_Addr1?.message}
                      placeholder="Enter Address Line 1"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Addr2')}
                      label="Address Line 2"
                      error={!!errors.V_Addr2}
                      helperText={errors.V_Addr2?.message}
                      placeholder="Enter Address Line 2"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_City')}
                      label="City *"
                      error={!!errors.V_City}
                      helperText={errors.V_City?.message}
                      placeholder="Enter City"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_State"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="State *"
                          error={!!errors.V_State}
                          helperText={errors.V_State?.message}
                          placeholder="Enter State (e.g., TN)"
                          inputProps={{
                            maxLength: 2,
                            style: { textTransform: 'uppercase' }
                          }}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Zip"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Zip Code *"
                          error={!!errors.V_Zip}
                          helperText={errors.V_Zip?.message}
                          placeholder="Enter Zip Code (e.g., 2134-566)"
                          inputProps={{
                            maxLength: 10,
                          }}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9-]/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Country')}
                      label="Country"
                      error={!!errors.V_Country}
                      helperText={errors.V_Country?.message}
                      placeholder="Enter Country"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_TID')}
                      label="Tax ID"
                      error={!!errors.V_TID}
                      helperText={errors.V_TID?.message}
                      placeholder="Enter TID"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_AccountNumber')}
                      label="Account Number"
                      error={!!errors.V_AccountNumber}
                      helperText={errors.V_AccountNumber?.message}
                      placeholder="Enter Account Number"
                    />
                  </Grid>
                    </Grid>

                
                    <Divider sx={{ my: 2 }} />

                    {/* Broker Information */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Broker Information
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Broker')}
                      label="Broker"
                      error={!!errors.V_Broker}
                      helperText={errors.V_Broker?.message}
                      placeholder="Enter Broker"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Broker_Rep')}
                      label="Broker Rep"
                      error={!!errors.V_Broker_Rep}
                      helperText={errors.V_Broker_Rep?.message}
                      placeholder="Enter Broker Rep"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Broker_Phone"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Broker Phone Number"
                          error={!!errors.V_Broker_Phone}
                          helperText={errors.V_Broker_Phone?.message}
                          placeholder="Enter Broker Phone (e.g., +185697564)"
                          inputProps={{
                            maxLength: 12,
                          }}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^+0-9]/g, '');
                            // Ensure + is only at the start
                            if (value.includes('+') && value.indexOf('+') !== 0) {
                              value = value.replace(/\+/g, '');
                              value = '+' + value;
                            }
                            // Limit to 12 characters
                            value = value.slice(0, 12);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Broker_Fax"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Broker Fax Number"
                          error={!!errors.V_Broker_Fax}
                          helperText={errors.V_Broker_Fax?.message}
                          placeholder="Enter Broker Fax (e.g., +185697564)"
                          inputProps={{
                            maxLength: 12,
                          }}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^+0-9]/g, '');
                            // Ensure + is only at the start
                            if (value.includes('+') && value.indexOf('+') !== 0) {
                              value = value.replace(/\+/g, '');
                              value = '+' + value;
                            }
                            // Limit to 12 characters
                            value = value.slice(0, 12);
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Order Information */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Order Information
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_MinOrder_Weight"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Minimum Order Weight"
                          type="number"
                          inputProps={{ step: 'any', max: 999999 }}
                          error={!!errors.V_MinOrder_Weight}
                          helperText={errors.V_MinOrder_Weight?.message}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Limit to 6 digits (excluding decimal point)
                            const numericValue = value.replace(/\./g, '');
                            if (numericValue.length <= 6) {
                              field.onChange(value === '' ? 0 : Number(value));
                            }
                          }}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_MinOrder_Dollars"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Minimum Order Dollars"
                          type="number"
                          inputProps={{ step: 'any', max: 999999 }}
                          error={!!errors.V_MinOrder_Dollars}
                          helperText={errors.V_MinOrder_Dollars?.message}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Limit to 6 digits (excluding decimal point)
                            const numericValue = value.replace(/\./g, '');
                            if (numericValue.length <= 6) {
                              field.onChange(value === '' ? 0 : Number(value));
                            }
                          }}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_MinOrder_Cases"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Minimum Order Cases"
                          type="number"
                          inputProps={{ step: 'any', max: 9999 }}
                          error={!!errors.V_MinOrder_Cases}
                          helperText={errors.V_MinOrder_Cases?.message}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Limit to 4 digits (excluding decimal point)
                            const numericValue = value.replace(/\./g, '');
                            if (numericValue.length <= 4) {
                              field.onChange(value === '' ? 0 : Number(value));
                            }
                          }}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_MinOrder_Pallets"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          label="Minimum Order Pallets"
                          type="number"
                          inputProps={{ step: 'any', max: 999 }}
                          error={!!errors.V_MinOrder_Pallets}
                          helperText={errors.V_MinOrder_Pallets?.message}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Limit to 3 digits (excluding decimal point)
                            const numericValue = value.replace(/\./g, '');
                            if (numericValue.length <= 3) {
                              field.onChange(value === '' ? 0 : Number(value));
                            }
                          }}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Order_Interval', { valueAsNumber: true })}
                      label="Order Interval"
                      type="number"
                      inputProps={{ step: 'any' }}
                      error={!!errors.V_Order_Interval}
                      helperText={errors.V_Order_Interval?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Order_IntervalDays', { valueAsNumber: true })}
                      label="Order Interval Days"
                      type="number"
                      inputProps={{ step: 'any' }}
                      error={!!errors.V_Order_IntervalDays}
                      helperText={errors.V_Order_IntervalDays?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Lead_Time', { valueAsNumber: true })}
                      label="Lead Time"
                      type="number"
                      inputProps={{ step: 'any' }}
                      error={!!errors.V_Lead_Time}
                      helperText={errors.V_Lead_Time?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_Lead_TimeDays', { valueAsNumber: true })}
                      label="Lead Time Days"
                      type="number"
                      inputProps={{ step: 'any' }}
                      error={!!errors.V_Lead_TimeDays}
                      helperText={errors.V_Lead_TimeDays?.message}
                    />
                  </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Additional Information */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Additional Information
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                  {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_EFT"
                      control={control}
                      render={({ field }) => (
                        <CheckboxInput
                          singleLabel="EFT"
                          checked={!!field.value}
                          onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </Grid> */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_Backorders"
                      control={control}
                      render={({ field }) => (
                        <CheckboxInput
                          singleLabel="Backorders"
                          checked={!!field.value}
                          onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                    {/* Navigation Buttons for Step 1 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <CustomButton
                        type="button"
                        buttonType="primary"
                        appearance="filled"
                        onClick={handleNext}
                        sx={{ minWidth: 120 }}
                        fullWidth={false}
                      >
                        Next
                      </CustomButton>
                    </Box>
                  </Box>
                )}

                {/* Step 2: Advanced Settings */}
                {activeStep === 1 && (
                  <Box>
                {/* Tax Information */}
                <Box sx={{
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  p: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.05),
                    transform: 'translateX(4px)',
                  }
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                    Tax Information
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="Taxes_Prepaid"
                      control={control}
                      render={({ field }) => (
                        <CheckboxInput
                          singleLabel="Taxes Prepaid"
                          checked={!!field.value}
                          onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </Grid>
                  
                  {watch('Taxes_Prepaid') === 1 && (
                    <>

<Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="Jurisdiction_State"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          label="Jurisdiction State"
                          options={jurisdictionStateOptions}
                          disabled={loadingLists}
                          error={!!errors.Jurisdiction_State}
                          helperText={errors.Jurisdiction_State?.message}
                        />
                      )}
                    />
                  </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="PrepaidTax_Calculation_Select"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              name={field.name}
                              value={field.value ?? '00'}
                              onChange={(e: any) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              label="Prepaid Tax Calculation Select"
                              options={[
                                { label: 'N/A', value: '00' },
                                { label: 'Calculate (Cigarettes)', value: '01' },
                                { label: 'Calculate (OTP)', value: '02' },
                                { label: 'Calculate (Cigarette and OTP)', value: '99' },
                                { label: 'Tax Paid Inventory Only (Cigarettes)', value: '101' },
                                { label: 'Tax Paid Inventory Only (OTP)', value: '102' },
                                { label: 'Tax Paid Inventory Only (Cigarette and OTP)', value: '199' },
                              ]}
                              error={!!errors.PrepaidTax_Calculation_Select}
                              helperText={errors.PrepaidTax_Calculation_Select?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('TaxPaid_State')}
                          label="Tax Paid State"
                          error={!!errors.TaxPaid_State}
                          helperText={errors.TaxPaid_State?.message}
                          placeholder="Enter Tax Paid State"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="OTP_TaxReverseOnEntry"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Prepaid Tax PO Reverse On Entry"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* QuickBooks & MSA Information */}
                <Box sx={{
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  p: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                    transform: 'translateX(4px)',
                  }
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                    QuickBooks & MSA Information
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="MSA_Status"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          name={field.name}
                          value={field.value ?? 'N/A'}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          label="MSA Status"
                          options={[
                            { label: 'N/A: Not Applicable', value: 'N/A' },
                            { label: 'PM: Participating Manufacturer', value: 'PM' },
                            { label: 'NPM: Non Participating Manufacturer', value: 'NPM' },
                            { label: 'SPM: Subsequent Participating Manufacture', value: 'SPM' },
                            { label: 'D: Licensed Distributor', value: 'D' },
                          ]}
                          error={!!errors.MSA_Status}
                          helperText={errors.MSA_Status?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="First_Importer"
                      control={control}
                      render={({ field }) => {
                        const fieldValue = field.value !== undefined && field.value !== null ? String(field.value) : '0';
                        return (
                          <SelectInput
                            name={field.name}
                            value={fieldValue}
                            onChange={(e: any) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            label="First Importer"
                            options={vendorGroupOptions}
                            disabled={loadingLists}
                            error={!!errors.First_Importer}
                            helperText={errors.First_Importer?.message}
                          />
                        );
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="Foreign_Manufacturer"
                      control={control}
                      render={({ field }) => (
                        <CheckboxInput
                          singleLabel="Foreign Manufacturer"
                          checked={!!field.value}
                          onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="Buyer_ID"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          {...field}
                          value={field.value !== null && field.value !== undefined ? String(field.value) : ''}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          label="Buyer ID"
                          options={buyerIDOptions}
                          disabled={loadingLists}
                          error={!!errors.Buyer_ID}
                          helperText={errors.Buyer_ID?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="Vendor_Group"
                      control={control}
                      render={({ field }) => {
                        const fieldValue = field.value !== undefined && field.value !== null ? String(field.value) : '0';
                        return (
                          <SelectInput
                            name={field.name}
                            value={fieldValue}
                            onChange={(e: any) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            label="Vendor Group"
                            options={vendorGroupOptions}
                            disabled={loadingLists}
                            error={!!errors.Vendor_Group}
                            helperText={errors.Vendor_Group?.message}
                          />
                        );
                      }}
                    />
                  </Grid>
                  {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextInput
                      {...register('V_PO_InputOption', { valueAsNumber: true })}
                      label="PO Input Option"
                      type="number"
                      inputProps={{ step: 'any' }}
                      error={!!errors.V_PO_InputOption}
                      helperText={errors.V_PO_InputOption?.message}
                    />
                  </Grid> */}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Status Flags */}
                <Box sx={{
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  p: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.05),
                    transform: 'translateX(4px)',
                  }
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                    Status Flags
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_FullCase"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          name={field.name}
                          value={field.value ?? 'A'}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          label="Full Case"
                          options={[
                            { label: 'S', value: 'S' },
                            { label: 'A', value: 'A' },
                            { label: 'N', value: 'N' },
                          ]}
                          error={!!errors.V_FullCase}
                          helperText={errors.V_FullCase?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_PO_ReportFormat"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          {...field}
                          value={field.value !== null && field.value !== undefined ? String(field.value) : ''}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          label="PO Report Format"
                          options={documentFormatOptions}
                          disabled={loadingLists}
                          error={!!errors.V_PO_ReportFormat}
                          helperText={errors.V_PO_ReportFormat?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="V_ReturnStatus"
                      control={control}
                      render={({ field }) => (
                        <SelectInput
                          {...field}
                          value={field.value ?? 'N'}
                          onChange={(e: any) => field.onChange(e.target.value)}
                          label="Return Status"
                          options={[
                            { label: 'N', value: 'N' },
                            { label: 'S', value: 'S' },
                            { label: 'A', value: 'A' },
                          ]}
                          error={!!errors.V_ReturnStatus}
                          helperText={errors.V_ReturnStatus?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                    {/* Navigation Buttons for Step 2 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <CustomButton
                        type="button"
                        buttonType="cancel"
                        appearance="outlined"
                        onClick={handleBack}
                        sx={{ minWidth: 120 }}
                        fullWidth={false}
                      >
                        Back
                      </CustomButton>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <CustomButton
                          type="button"
                          buttonType="cancel"
                          appearance="outlined"
                          onClick={() => navigate('/admin/vendors')}
                          sx={{ minWidth: 120 }}
                          fullWidth={false}
                        >
                          Cancel
                        </CustomButton>
                        <CustomButton
                          type="button"
                          buttonType="cancel"
                          appearance="outlined"
                          onClick={handleReset}
                          sx={{ minWidth: 120 }}
                          fullWidth={false}
                        >
                          Reset
                        </CustomButton>
                        <CustomButton
                          type="submit"
                          buttonType="primary"
                          appearance="filled"
                          disabled={submitting}
                          icon={submitting ? <CircularProgress size={20} /> : null}
                          sx={{ minWidth: 120 }}
                          fullWidth={false}
                        >
                          {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Vendor' : 'Create Vendor')}
                        </CustomButton>
                      </Box>
                    </Box>
                  </Box>
                )}
              </form>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </Box>
  );
};

export default AddVendor;

