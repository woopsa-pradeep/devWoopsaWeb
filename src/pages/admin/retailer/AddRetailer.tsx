import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextInput from '../../../component/atoms/TextInput';
import SelectInput from '../../../component/atoms/SelectInput';
import CheckboxInput from '../../../component/atoms/CheckboxInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { retailerSchema, RetailerFormData } from './retailer.schema';
import { createCustomer, listOfCustomersCreate } from '../../../redux/apis/distrubutor/retailerApis';
import toast from 'react-hot-toast';

const AddRetailer: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [salesRepOptions, setSalesRepOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [classOfTradeOptions, setClassOfTradeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [invoiceFormatOptions, setInvoiceFormatOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [deliveryIdOptions, setDeliveryIdOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [ediFormatOptions, setEdiFormatOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [termCodeOptions, setTermCodeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [customerStatusOptions, setCustomerStatusOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [posAccordionExpanded, setPosAccordionExpanded] = useState(false);
  const [categoryAccordionExpanded, setCategoryAccordionExpanded] = useState(false);
  const [salesCategories, setSalesCategories] = useState<Array<{ Sales_Category: number; Category_Desc: string }>>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Monday to Sunday dropdown options (0-6, where 0=Monday, 6=Sunday)
  const orderDayOptions = [
    { label: 'Monday', value: '0' },
    { label: 'Tuesday', value: '1' },
    { label: 'Wednesday', value: '2' },
    { label: 'Thursday', value: '3' },
    { label: 'Friday', value: '4' },
    { label: 'Saturday', value: '5' },
    { label: 'Sunday', value: '6' },
  ];

  // Sales Tax Select options
  const salesTaxSelectOptions = [
    { label: 'S', value: 'S' },
    { label: 'A', value: 'A' },
    { label: 'N', value: 'N' },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    trigger,
    watch,
  } = useForm<RetailerFormData>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      C_Name: '',
      C_CoName: '',
      C_Address: '',
      Address_Type: 0,
      C_City: '',
      C_State: '',
      C_Country: '',
      C_Contact1: '',
      C_Contact2: '',
      C_Zip: '',
      C_Phone: '',
      C_Email: '',
      Jurisdiction_State: 0,
      Jurisdiction_County: 0,
      Jurisdiction_City: 0,
      C_Fax: ' ',
      C_SalesTaxNumber: '',
      C_CigtLicenseNumber: '',
      C_Salesman: 1,
      C_FEIN: ' ',
      C_OperationHours1: 0,
      C_OperationHours2: 0,
      C_Inactive: 0,
      C_StatusCode: 0,
      Delivery_Charge: 0,
      Delivery_Amount: 0,
      C_CaseDiscount: 0,
      C_OtherLicenseNumber: '',
      C_OtherLicenseNumber2: '',
      C_OtherLicenseNumber3: '',
      C_OrderDay: 0,
      C_RetailRounding: '0123456789',
      C_ClassOfTrade: '000',
      C_InvoiceFormat: 0,
      C_PricingAccount: 0,
      Delivery_ID: 0,
      C_SpecialTaxCode: 'E',
      C_Memo: '',
      PriceLevel_Default: 0,
      EDI_Format: 0,
      NetCost_Flag: false,
      TermCode: 0,
      C_SalesTaxSelect: 'N',
      C_OrderDaySequence: 1,
      Credit_Limit: 0,
      C_DateCreatedUser: 0,
      C_DateModifedUser: 0,
      Service_Charge: 0,
      Other_Amount: 0,
      C_PhoneMobile: ' ',
      POS_CashC: 1,
      POS_CheckC: 1,
      POS_CreditC: 1,
      POS_DebitC: 1,
      POS_OtherC: 1,
      POS_HouseC: 1,
      MSA_AcceptPromo: 0,
      C_Alias: ' ',
      emailInvoice: 0,
      emailInvoiceEDI: 0,
      emailReport: 0,
      emailStatement: 0,
      emailPromo: 0,
      Category_Allow01: 1,
      Category_Allow02: 1,
      Category_Allow03: 1,
      Category_Allow04: 1,
      Category_Allow05: 1,
      Category_Allow06: 1,
      Category_Allow07: 1,
      Category_Allow08: 1,
      Category_Allow09: 1,
      Category_Allow10: 1,
      Category_Allow11: 1,
      Category_Allow12: 1,
    },
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await listOfCustomersCreate() as any;
      const data = response?.data || {};
      
      // Set Sales Rep options
      if (data.salesRep) {
        setSalesRepOptions(data.salesRep.map((item: any) => ({
          label: item.S_Number + ' - ' + item.S_Desc || '',
          value: String(item.S_Number || ''),
        })));
      }
      
      // Set Class of Trade options
      if (data.classOfTrade) {
        setClassOfTradeOptions(data.classOfTrade.map((item: any) => ({
          label: item.Trade_Desc || '',
          value: item.Trade_Code || '',
        })));
      }
      
      // Set Invoice Format options (from documentAdditionalFormat)
      if (data.documentAdditionalFormat) {
        setInvoiceFormatOptions(data.documentAdditionalFormat.map((item: any) => ({
          label: item.Document_Description || '',
          value: String(item.Document_FormatID || ''),
        })));
      }
      
      // Set Delivery ID options (from deliveryType)
      if (data.deliveryType) {
        setDeliveryIdOptions(data.deliveryType.map((item: any) => ({
          label: item.Delivery_Description || '',
          value: String(item.Delivery_ID || ''),
        })));
      }
      
      // Set EDI Format options (from ediFormatUser)
      if (data.ediFormatUser) {
        setEdiFormatOptions(data.ediFormatUser.map((item: any) => ({
          label: item.EDI_DescriptionUser || '',
          value: String(item.EDI_Format || ''),
        })));
      }
      
      // Set Term Code options
      if (data.terms) {
        setTermCodeOptions(data.terms.map((item: any) => ({
          label: item.Terms || '',
          value: String(item.TermsCode || ''),
        })));
      }
      
      // Set Customer Status options
      if (data.customerStatus) {
        setCustomerStatusOptions(data.customerStatus.map((item: any) => ({
          label: `${item.C_Status} - ${item.C_StatusDescription}` || '',
          value: String(item.C_StatusCode ?? 0),
        })));
      }
      
      // Set Sales Category array
      if (data.salesCategory) {
        const categoryArray: Array<{ Sales_Category: number; Category_Desc: string }> = [];
        data.salesCategory.forEach((item: any) => {
          if (item.Sales_Category && item.Category_Desc) {
            categoryArray.push({
              Sales_Category: item.Sales_Category,
              Category_Desc: item.Category_Desc,
            });
          }
        });
        setSalesCategories(categoryArray);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown options');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const onSubmit = async (data: RetailerFormData) => {
    setSubmitting(true);
    try {
      const response = await createCustomer(data) as any;
      if (response?.success) {
        toast.success(response?.message || 'Retailer created successfully!');
        navigate('/admin/retailers');
      } else {
        toast.error(response?.message || 'Failed to create retailer');
      }
    } catch (error: any) {
      console.error('Error creating retailer:', error);
      toast.error(error?.response?.data?.message || 'Failed to create retailer');
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
      const isValid = await trigger(['C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip']);
      if (!isValid) {
        return;
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
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Basic Information */}
                {activeStep === 0 && (
                  <Box>
                    {/* Customer Information */}
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
                        Customer Information
                      </Typography>
                      <Controller
                          name="C_Inactive"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Inactive"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Name')}
                          label="Store Name *"
                          error={!!errors.C_Name}
                          helperText={errors.C_Name?.message}
                          placeholder="Enter Store Name"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_CoName')}
                          label="C/o Name"
                          error={!!errors.C_CoName}
                          helperText={errors.C_CoName?.message}
                          placeholder="Enter C/o Name"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Alias')}
                          label="Alias"
                          error={!!errors.C_Alias}
                          helperText={errors.C_Alias?.message}
                          placeholder="Enter Alias"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Email')}
                          label="Primary Email"
                          type="email"
                          error={!!errors.C_Email}
                          helperText={errors.C_Email?.message}
                          placeholder="Enter Email"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Address')}
                          label="Address *"
                          error={!!errors.C_Address}
                          helperText={errors.C_Address?.message}
                          placeholder="Enter Address"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_City')}
                          label="City *"
                          error={!!errors.C_City}
                          helperText={errors.C_City?.message}
                          placeholder="Enter City"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_State"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              label="State *"
                              error={!!errors.C_State}
                              helperText={errors.C_State?.message}
                              placeholder="Enter State (e.g., NY)"
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
                          name="C_Zip"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              label="Zip Code *"
                              error={!!errors.C_Zip}
                              helperText={errors.C_Zip?.message}
                              placeholder="Enter Zip Code (e.g., 2134-566)"
                              inputProps={{ maxLength: 10 }}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9-]/g, '').slice(0, 10);
                                field.onChange(value);
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_Phone"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              label="Phone Number"
                              error={!!errors.C_Phone}
                              helperText={errors.C_Phone?.message}
                              placeholder="Enter Phone Number (e.g., +185697564)"
                              inputProps={{ maxLength: 12 }}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^+0-9]/g, '');
                                // If + exists, ensure it's at the start and remove any other +
                                if (value.includes('+')) {
                                  const numbers = value.replace(/\+/g, '');
                                  value = '+' + numbers;
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
                          name="C_PhoneMobile"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              label="Mobile Phone Number"
                              error={!!errors.C_PhoneMobile}
                              helperText={errors.C_PhoneMobile?.message}
                              placeholder="Enter Mobile Phone Number (e.g., +185697564)"
                              inputProps={{ maxLength: 12 }}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^+0-9]/g, '');
                                // If + exists, ensure it's at the start and remove any other +
                                if (value.includes('+')) {
                                  const numbers = value.replace(/\+/g, '');
                                  value = '+' + numbers;
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
                          name="C_Fax"
                          control={control}
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              label="Fax Number"
                              error={!!errors.C_Fax}
                              helperText={errors.C_Fax?.message}
                              placeholder="Enter Fax Number (e.g., +185697564)"
                              inputProps={{ maxLength: 12 }}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^+0-9]/g, '');
                                // If + exists, ensure it's at the start and remove any other +
                                if (value.includes('+')) {
                                  const numbers = value.replace(/\+/g, '');
                                  value = '+' + numbers;
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
                        <TextInput
                          {...register('C_Contact1')}
                          label="First Name"
                          error={!!errors.C_Contact1}
                          helperText={errors.C_Contact1?.message}
                          placeholder="Enter First Name"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Contact2')}
                          label="Last Name"
                          error={!!errors.C_Contact2}
                          helperText={errors.C_Contact2?.message}
                          placeholder="Enter Last Name"
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Sales Information */}
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
                        Store Information
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_Salesman"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value ? String(field.value) : ''}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="Salesman"
                              options={salesRepOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.C_Salesman}
                              helperText={errors.C_Salesman?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_ClassOfTrade"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value || ''}
                              onChange={(e: any) => field.onChange(e.target.value)}
                              label="Class of Trade"
                              options={classOfTradeOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.C_ClassOfTrade}
                              helperText={errors.C_ClassOfTrade?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_OrderDay"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value !== null && field.value !== undefined ? String(field.value) : '0'}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="Order Day"
                              options={orderDayOptions}
                              error={!!errors.C_OrderDay}
                              helperText={errors.C_OrderDay?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OrderDaySequence', { valueAsNumber: true })}
                          label="Order Day Sequence"
                          type="number"
                          inputProps={{ max: 9999, min: 0 }}
                          error={!!errors.C_OrderDaySequence}
                          helperText={errors.C_OrderDaySequence?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OperationHours1', { valueAsNumber: true })}
                          label="Operation Hours 1"
                          type="number"
                          error={!!errors.C_OperationHours1}
                          helperText={errors.C_OperationHours1?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OperationHours2', { valueAsNumber: true })}
                          label="Operation Hours 2"
                          type="number"
                          error={!!errors.C_OperationHours2}
                          helperText={errors.C_OperationHours2?.message}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Pricing & Delivery */}
                    <Box sx={{
                      mb: 2,
                      pb: 0,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        transform: 'translateX(4px)',
                      },
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Pricing & Delivery
                      </Typography>
                      <Controller
                          name="C_CaseDiscount"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Case Discount"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                    </Box>

                    <Grid container spacing={1.5}>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_PricingAccount', { valueAsNumber: true })}
                          label="Pricing Account"
                          type="number"
                          error={!!errors.C_PricingAccount}
                          helperText={errors.C_PricingAccount?.message}
                        />
                      </Grid> */}
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('PriceLevel_Default', { valueAsNumber: true })}
                          label="Price Level Default"
                          type="number"
                          error={!!errors.PriceLevel_Default}
                          helperText={errors.PriceLevel_Default?.message}
                        />
                      </Grid> */}
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_CaseDiscount"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Case Discount"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Delivery_ID"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value ? String(field.value) : ''}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="Delivery ID"
                              options={deliveryIdOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.Delivery_ID}
                              helperText={errors.Delivery_ID?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Delivery_Charge"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Delivery Charge"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      {!!watch('Delivery_Charge') && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextInput
                            {...register('Delivery_Amount', { valueAsNumber: true })}
                            label="Delivery Amount"
                            type="number"
                            inputProps={{ step: 'any' }}
                            error={!!errors.Delivery_Amount}
                            helperText={errors.Delivery_Amount?.message}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Credit_Limit', { valueAsNumber: true })}
                          label="Credit Limit"
                          type="number"
                          inputProps={{ step: 'any', max: 9999999999, min: 0 }}
                          error={!!errors.Credit_Limit}
                          helperText={errors.Credit_Limit?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="Service_Charge"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Service Charge"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      {!!watch('Service_Charge') && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextInput
                            {...register('Other_Amount', { valueAsNumber: true })}
                            label="Other Amount"
                            type="number"
                            inputProps={{ step: 'any' }}
                            error={!!errors.Other_Amount}
                            helperText={errors.Other_Amount?.message}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_FEIN')}
                          label="FEIN"
                          error={!!errors.C_FEIN}
                          helperText={errors.C_FEIN?.message}
                          placeholder="Enter FEIN"
                          inputProps={{ maxLength: 11 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_SalesTaxNumber')}
                          label="Sales Tax Number"
                          error={!!errors.C_SalesTaxNumber}
                          helperText={errors.C_SalesTaxNumber?.message}
                          placeholder="Enter Sales Tax Number"
                          inputProps={{ maxLength: 20 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_CigtLicenseNumber')}
                          label="Cigarette License Number"
                          error={!!errors.C_CigtLicenseNumber}
                          helperText={errors.C_CigtLicenseNumber?.message}
                          placeholder="Enter Cigarette License Number"
                          inputProps={{ maxLength: 20 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OtherLicenseNumber')}
                          label="Other License Number"
                          error={!!errors.C_OtherLicenseNumber}
                          helperText={errors.C_OtherLicenseNumber?.message}
                          placeholder="Enter Other License Number"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OtherLicenseNumber2')}
                          label="Other License Number 2"
                          error={!!errors.C_OtherLicenseNumber2}
                          helperText={errors.C_OtherLicenseNumber2?.message}
                          placeholder="Enter Other License Number 2"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_OtherLicenseNumber3')}
                          label="Other License Number 3"
                          error={!!errors.C_OtherLicenseNumber3}
                          helperText={errors.C_OtherLicenseNumber3?.message}
                          placeholder="Enter Other License Number 3"
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_SpecialTaxCode')}
                          label="Special Tax Code"
                          error={!!errors.C_SpecialTaxCode}
                          helperText={errors.C_SpecialTaxCode?.message}
                          placeholder="Enter Special Tax Code"
                        />
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_SalesTaxSelect"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value || ''}
                              onChange={(e: any) => field.onChange(e.target.value)}
                              label="Sales Tax Select"
                              options={salesTaxSelectOptions}
                              error={!!errors.C_SalesTaxSelect}
                              helperText={errors.C_SalesTaxSelect?.message}
                            />
                          )}
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_RetailRounding')}
                          label="Retail Rounding"
                          error={!!errors.C_RetailRounding}
                          helperText={errors.C_RetailRounding?.message}
                          placeholder="Enter Retail Rounding"
                        />
                      </Grid> */}
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
                    {/* Tax & License Information */}

                    {/* Jurisdiction Information */}
                    {/* <Box sx={{
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
                        Jurisdiction Information
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Jurisdiction_State', { valueAsNumber: true })}
                          label="Jurisdiction State"
                          type="number"
                          error={!!errors.Jurisdiction_State}
                          helperText={errors.Jurisdiction_State?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Jurisdiction_County', { valueAsNumber: true })}
                          label="Jurisdiction County"
                          type="number"
                          error={!!errors.Jurisdiction_County}
                          helperText={errors.Jurisdiction_County?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('Jurisdiction_City', { valueAsNumber: true })}
                          label="Jurisdiction City"
                          type="number"
                          error={!!errors.Jurisdiction_City}
                          helperText={errors.Jurisdiction_City?.message}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} /> */}

                    {/* Order & Invoice Settings */}
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
                        Order & Invoice Settings
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_InvoiceFormat"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value ? String(field.value) : ''}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="Invoice Format"
                              options={invoiceFormatOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.C_InvoiceFormat}
                              helperText={errors.C_InvoiceFormat?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="TermCode"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value ? String(field.value) : ''}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="Term Code"
                              options={termCodeOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.TermCode}
                              helperText={errors.TermCode?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="EDI_Format"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              {...field}
                              value={field.value ? String(field.value) : ''}
                              onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                              label="EDI Format"
                              options={ediFormatOptions}
                              disabled={loadingDropdowns}
                              error={!!errors.EDI_Format}
                              helperText={errors.EDI_Format?.message}
                            />
                          )}
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="NetCost_Flag"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Net Cost Flag"
                              checked={field.value}
                              onChange={(value, checked) => field.onChange(checked)}
                            />
                          )}
                        />
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="C_StatusCode"
                          control={control}
                          render={({ field }) => {
                            // Convert field value to string, default to '0'
                            const fieldValue = field.value !== null && field.value !== undefined ? String(field.value) : '0';
                            // Ensure the value exists in options, otherwise default to '0'
                            const validValue = customerStatusOptions.length > 0 && customerStatusOptions.some(opt => opt.value === fieldValue)
                              ? fieldValue
                              : '0';
                            return (
                              <SelectInput
                                {...field}
                                value={validValue}
                                onChange={(e: any) => field.onChange(Number(e.target.value) || 0)}
                                label="Status Code"
                                options={customerStatusOptions}
                                disabled={loadingDropdowns}
                                error={!!errors.C_StatusCode}
                                helperText={errors.C_StatusCode?.message}
                              />
                            );
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('C_Memo')}
                          label="Notes"
                          error={!!errors.C_Memo}
                          helperText={errors.C_Memo?.message}
                          placeholder="Enter Notes"
                          multiline
                          rows={3}
                          inputProps={{ maxLength: 200 }}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* POS Settings */}
                    <Accordion 
                      expanded={posAccordionExpanded} 
                      onChange={(event, isExpanded) => setPosAccordionExpanded(isExpanded)}
                      sx={{
                        mb: 2,
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:before': {
                          display: 'none',
                        },
                        '&.Mui-expanded': {
                          margin: '0 0 16px 0',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: 1.5,
                          py: 1,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.info.main, 0.05),
                          },
                          '&.Mui-expanded': {
                            minHeight: 48,
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                          POS Mode Settings
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 1.5, pb: 2 }}>
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_CashC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="Cash"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_CheckC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="Check"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_CreditC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="Credit"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_DebitC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="Debit"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_OtherC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="Other"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                              name="POS_HouseC"
                              control={control}
                              render={({ field }) => (
                                <CheckboxInput
                                  singleLabel="House"
                                  checked={!!field.value}
                                  onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Divider sx={{ my: 2 }} />

                    {/* Email Settings */}
                    <Box sx={{
                      mb: 2,
                      pb: 1.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        transform: 'translateX(4px)',
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                        Email Settings
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="emailInvoice"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Invoice"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="emailInvoiceEDI"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Invoice EDI"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="emailReport"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Report"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="emailStatement"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Statement"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="emailPromo"
                          control={control}
                          render={({ field }) => (
                            <CheckboxInput
                              singleLabel="Promo"
                              checked={!!field.value}
                              onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                            />
                          )}
                        />
                      </Grid>
                      {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextInput
                          {...register('MSA_AcceptPromo', { valueAsNumber: true })}
                          label="MSA Accept Promo"
                          type="number"
                          error={!!errors.MSA_AcceptPromo}
                          helperText={errors.MSA_AcceptPromo?.message}
                        />
                      </Grid> */}
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Category Allowances */}
                    <Accordion 
                      expanded={categoryAccordionExpanded} 
                      onChange={(event, isExpanded) => setCategoryAccordionExpanded(isExpanded)}
                      sx={{
                        mb: 2,
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:before': {
                          display: 'none',
                        },
                        '&.Mui-expanded': {
                          margin: '0 0 16px 0',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: 1.5,
                          py: 1,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.warning.main, 0.05),
                          },
                          '&.Mui-expanded': {
                            minHeight: 48,
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '1rem' }}>
                          Sales Category Allow
                        </Typography>
                      </AccordionSummary>
                       <AccordionDetails sx={{ px: 1.5, pb: 2 }}>
                         <Grid container spacing={1.5}>
                           {salesCategories.map((category) => {
                             const fieldName = `Category_Allow${String(category.Sales_Category).padStart(2, '0')}` as keyof RetailerFormData;
                             const categoryLabel = category.Category_Desc || `Category Allow ${category.Sales_Category}`;
                             return (
                               <Grid key={category.Sales_Category} size={{ xs: 12, sm: 6, md: 4 }}>
                                 <Controller
                                   name={fieldName as any}
                                   control={control}
                                   render={({ field }) => (
                                     <CheckboxInput
                                       singleLabel={categoryLabel}
                                       checked={!!field.value}
                                       onChange={(value, checked) => field.onChange(checked ? 1 : 0)}
                                     />
                                   )}
                                 />
                               </Grid>
                             );
                           })}
                         </Grid>
                       </AccordionDetails>
                    </Accordion>

                    <Divider sx={{ my: 2 }} />

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
                          onClick={() => navigate('/admin/retailers')}
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
                          {submitting ? 'Creating...' : 'Create Retailer'}
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

export default AddRetailer;

