/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import logo from '../assets/Woopsa White.svg';
// import { useDispatch } from 'react-redux';

import TextInput from '../component/atoms/TextInput';
import SelectInput from '../component/atoms/SelectInput';
import CustomButton from '../component/atoms/CustomButton';
import CheckboxInput from '../component/atoms/CheckboxInput';
import SwitchInput from '../component/atoms/SwitchInput';
import FileUploadInput from '../component/atoms/FileUploadInput';
import Footer from '../component/atoms/Footer';
import becomeRetailerImage from '../assets/becomeretailer.jpg';
import '../pages/LandingPage.css';
import { 
    createRetailerRequest,
    getContactUsData
    } from '../redux/apis/landingPageApis';
import { toast } from 'react-hot-toast';
// import { setActiveStep } from '../redux/slices/navigationSlice';          
import { createRetailerRequestSchema, CreateRetailerRequestType } from './admin/retailerRequest/retailerRequestSchema';

const ContactUsRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // const dispatch = useDispatch();

  // Responsive navigation state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // State management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [activeStep, setLocalActiveStep] = useState(0);
  const [contactData, setContactData] = useState<any>(null);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Form setup
  const schema =createRetailerRequestSchema;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: '',
      dba_name: '',
      business_type: 'SOLE_PROP',
      federal_ein: '',
      ownership_type: '',
      primary_contact: '',
      phone: '',
      email: '',
      website: '',
      physical_street: '',
      physical_city: '',
      physical_state: '',
      physical_zip: '',
      physical_county: '',
      mailing_same_as_physical: false,
      mailing_street: '',
      mailing_city: '',
      mailing_state: '',
      mailing_zip: '',
      sales_tax_id: '',
      state_tobacco_license: '',
      federal_tobacco_permit: '',
      resale_certificate_url: '',
      state_tobacco_license_url: '',
      business_license_url: '',
      owner_government_id_url: '',
      owners: [
        {
          fullName: '',
          title: '',
          ownership: '',
          dateOfBirth: '',
          email: '',
          homeAddress: '',
          phone: '',
        }
      ],
      credit_limit_requested: false,
             bank_name: '',
       bank_account_last4: '',
       references: [],
       preferred_delivery_time: '',
       special_delivery_instructions: '',
       compliance_certification: false,
       authorized_signature: '',
       signature_date: new Date().toISOString().split('T')[0],
    },
  });

  // Field arrays for dynamic fields
  const { fields: ownerFields, append: appendOwner, remove: removeOwnerOriginal } = useFieldArray({
    control: control,
    name: 'owners',
  });

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control: control,
    name: 'references',
  });

  // Custom remove owner function that prevents removing the first owner
  const handleRemoveOwner = (index: number) => {
    if (index === 0) {
      toast.error('The first owner cannot be removed');
      return;
    }
    removeOwnerOriginal(index);
  };

  // Watch values for conditional rendering
  const watchedValues = watch();
  
  // Load existing data for edit mode and fetch contact data
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await getContactUsData();
        console.log('response-->', response);
        if (response) {
          setContactData(response);
        }
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    };

    fetchContactData();
    
    if (isEditMode && id) {
      loadExistingData();
    }
  }, [id, isEditMode]);

  // Function to validate current step
  const validateCurrentStep = async (stepIndex: number): Promise<boolean> => {
    try {
      // Get the field names for the current step
      const stepFields = getStepFields(stepIndex);
      
      // Trigger validation for only the current step fields
      const isValid = await trigger(stepFields as any);
      
      // Additional custom validation for specific steps
      if (stepIndex === 0 && isValid) { // Basic Information & Contact step
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (watchedValues.email && !emailRegex.test(watchedValues.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        
        // Validate phone format (basic validation)
        if (watchedValues.phone && watchedValues.phone.length < 10) {
          toast.error('Phone number must be at least 10 digits');
          return false;
        }
        
        // Validate business type
        const allowedBusinessTypes = ['SOLE_PROP', 'PARTNERSHIP', 'LLC', 'CORP', 'OTHER'];
        if (watchedValues.business_type && !allowedBusinessTypes.includes(watchedValues.business_type)) {
          toast.error('Please select a valid business type');
          return false;
        }
        
        // Validate website URL format if provided
        if (watchedValues.website && watchedValues.website.trim()) {
          try {
            new URL(watchedValues.website);
          } catch {
            toast.error('Please enter a valid website URL');
            return false;
          }
          
          // Check if URL has proper protocol
          if (!watchedValues.website.startsWith('http://') && !watchedValues.website.startsWith('https://')) {
            toast.error('Website URL must start with http:// or https://');
            return false;
          }
        }
        
       
      }
      
             if (stepIndex === 1 && isValid) { // Addresses step
         // Validate physical address state length
         if (watchedValues.physical_state && watchedValues.physical_state.length !== 2) {
           toast.error('Physical state must be exactly 2 characters');
           return false;
         }
         
         // Validate ZIP code format
         const zipRegex = /^\d{5}(-\d{4})?$/;
         if (watchedValues.physical_zip && !zipRegex.test(watchedValues.physical_zip)) {
           toast.error('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
           return false;
         }
         
         // Only validate mailing address fields if mailing address is different from physical
         if (!watchedValues.mailing_same_as_physical) {
           if (!watchedValues.mailing_street?.trim()) {
             toast.error('Mailing street address is required when mailing address is different from physical address');
             return false;
           }
           if (!watchedValues.mailing_city?.trim()) {
             toast.error('Mailing city is required when mailing address is different from physical address');
             return false;
           }
           if (!watchedValues.mailing_zip?.trim()) {
             toast.error('Mailing ZIP code is required when mailing address is different from physical address');
             return false;
           }
           
           // Validate mailing address state length only if mailing address is different AND state has a value
           if (watchedValues.mailing_state && watchedValues.mailing_state.trim()) {
             if (watchedValues.mailing_state.length !== 2) {
               toast.error('Mailing state must be exactly 2 characters');
               return false;
             }
           }
           
           // Validate mailing ZIP code format only if mailing address is different
           if (watchedValues.mailing_zip && !zipRegex.test(watchedValues.mailing_zip)) {
             toast.error('Please enter a valid mailing ZIP code (e.g., 12345 or 12345-6789)');
             return false;
           }
         }
         // If mailing_same_as_physical is true, skip all mailing address validation
       }
      
      if (stepIndex === 2 && isValid) { // Licenses & Owners step
        // Check if at least one owner is added
        if (ownerFields.length === 0) {
          toast.error('At least one business owner is required');
          return false;
        }
        
        // Check if all owners have required fields filled
        for (let i = 0; i < ownerFields.length; i++) {
          const owner = watchedValues.owners[i];
          if (!owner?.fullName?.trim()) {
            toast.error(`Owner ${i + 1} must have a full name`);
            return false;
          }
          
          // Validate ownership percentage if provided
          if (owner?.ownership !== undefined && owner?.ownership !== null) {
            const ownership = Number(owner.ownership);
            if (isNaN(ownership) || ownership < 0 || ownership > 100) {
              toast.error(`Owner ${i + 1} ownership percentage must be between 0 and 100`);
              return false;
            }
          }
          
          // Validate date of birth format if provided
          if (owner?.dateOfBirth && owner.dateOfBirth.trim()) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(owner.dateOfBirth)) {
              toast.error(`Owner ${i + 1} date of birth must be in format YYYY-MM-DD`);
              return false;
            }
            
            // Check if date is valid
            const date = new Date(owner.dateOfBirth);
            if (isNaN(date.getTime())) {
              toast.error(`Owner ${i + 1} date of birth must be a valid date`);
              return false;
            }
          }
          
          // Validate owner email format if provided
          if (owner?.email && owner.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(owner.email)) {
              toast.error(`Owner ${i + 1} email must be a valid email address`);
              return false;
            }
          }
          
          // Validate owner phone format if provided
          if (owner?.phone && owner.phone.trim()) {
            if (owner.phone.length < 10) {
              toast.error(`Owner ${i + 1} phone number must be at least 10 digits`);
              return false;
            }
          }
        }
        
        // Validate owners array structure
        if (!Array.isArray(watchedValues.owners) || watchedValues.owners.length === 0) {
          toast.error('At least one business owner is required');
          return false;
        }
      }
      
      if (stepIndex === 3 && isValid) { // Financial & Additional Info step
        // Check if at least one reference is added
        if (referenceFields.length === 0) {
          toast.error('At least one business reference is required');
          return false;
        }
        
        // Check if all references have required fields filled
        for (let i = 0; i < referenceFields.length; i++) {
          const reference = watchedValues.references[i];
          if (!reference?.company?.trim()) {
            toast.error(`Reference ${i + 1} must have a company name`);
            return false;
          }
          
          // Validate reference email format if provided
          if (reference?.email && reference.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(reference.email)) {
              toast.error(`Reference ${i + 1} email must be a valid email address`);
              return false;
            }
          }
          
          // Validate reference phone format if provided
          if (reference?.phone && reference.phone.trim()) {
            if (reference.phone.length < 10) {
              toast.error(`Reference ${i + 1} phone number must be at least 10 digits`);
              return false;
            }
          }
        }
        
        // Validate references array structure
        if (!Array.isArray(watchedValues.references) || watchedValues.references.length === 0) {
          toast.error('At least one business reference is required');
          return false;
        }
        
        // Check bank fields if credit limit is requested
        if (watchedValues.credit_limit_requested) {
          if (!watchedValues.bank_name?.trim()) {
            toast.error('Bank name is required when requesting credit limit');
            return false;
          }
          if (!watchedValues.bank_account_last4?.trim()) {
            toast.error('Bank account last 4 digits are required when requesting credit limit');
            return false;
          }
          if (watchedValues.bank_account_last4 && watchedValues.bank_account_last4.length !== 4) {
            toast.error('Bank account last 4 digits must be exactly 4 characters');
            return false;
          }
        }
        
        // Check if preferred delivery time is provided
        if (!watchedValues.preferred_delivery_time?.trim()) {
          toast.error('Preferred delivery time must be provided');
          return false;
        }
        
        // Validate signature date format
        if (watchedValues.signature_date && watchedValues.signature_date.trim()) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(watchedValues.signature_date)) {
            toast.error('Signature date must be in format YYYY-MM-DD');
            return false;
          }
          
          // Check if date is valid
          const date = new Date(watchedValues.signature_date);
          if (isNaN(date.getTime())) {
            toast.error('Signature date must be a valid date');
            return false;
          }
        }
      }
      
      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  // Function to get field names for each step
  const getStepFields = (stepIndex: number): (keyof CreateRetailerRequestType)[] => {
    switch (stepIndex) {
      case 0: // Basic Information & Contact
        return ['business_name', 'business_type', 'primary_contact', 'phone', 'email'];
             case 1: // Addresses
         const addressFields: (keyof CreateRetailerRequestType)[] = ['physical_street', 'physical_city', 'physical_state', 'physical_zip', 'mailing_same_as_physical'];
         // Only add mailing address fields if mailing address is different from physical
         if (!watchedValues.mailing_same_as_physical) {
           addressFields.push('mailing_street', 'mailing_city', 'mailing_state', 'mailing_zip');
         }
         return addressFields;
      case 2: // Licenses & Owners
        return ['sales_tax_id', 'resale_certificate_url', 'owners'];
      case 3: // Financial & Additional Info
        const fields: (keyof CreateRetailerRequestType)[] = ['compliance_certification', 'authorized_signature', 'signature_date', 'references', 'preferred_delivery_time', 'special_delivery_instructions', 'credit_limit_requested'];
        // Add bank fields if credit limit is requested
        if (watchedValues.credit_limit_requested) {
          fields.push('bank_name', 'bank_account_last4');
        }
        return fields;
      default:
        return [];
    }
  };

  // Load existing data for edit mode
  const loadExistingData = async () => {
    try {
      setInitialLoading(true);
     
    } catch (error) {
      toast.error('Failed to load retailer request data');
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

    // console.log('errors-->', errors); 
  // Handle form submission
  const onSubmit = async (data: any) => {

    // console.log('data', data);
    
    // Additional validation: ensure at least one owner exists
    if (!data.owners || data.owners.length === 0) {
      toast.error('At least one owner is required');
      return;
    }
    
    // Additional validation: ensure compliance certification is checked
    if (!data.compliance_certification) {
      toast.error('You must certify compliance with tobacco laws to submit this request');
      return;
    }
    
    // Final validation before submission
    const isFormValid = await trigger() as any;
    if (!isFormValid) {
      toast.error('Please fix all validation errors before submitting the form');
      return;
    }
    
    try {
      setLoading(true);
        await createRetailerRequest(data);
        toast.success('Retailer request created successfully');
        navigate('/');
    } catch (error) {
      toast.error('Failed to create request');
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

     // Handle mailing address toggle
   const handleMailingToggle = (checked: boolean) => {
     setValue('mailing_same_as_physical', checked);
     
     if (checked) {
       // Copy physical address to mailing address
       setValue('mailing_street', watchedValues.physical_street);
       setValue('mailing_city', watchedValues.physical_city);
       setValue('mailing_state', watchedValues.physical_state);
       setValue('mailing_zip', watchedValues.physical_zip);
     } else {
       // Clear mailing address fields when toggle is off
       setValue('mailing_street', '');
       setValue('mailing_city', '');
       setValue('mailing_state', '');
       setValue('mailing_zip', '');
     }
     
     // Trigger validation for the current step to update error states
     setTimeout(() => {
       if (checked) {
         // If mailing same as physical, clear validation errors and skip validation
         // Clear any existing errors by setting the fields to valid values
         setValue('mailing_street', watchedValues.physical_street || '');
         setValue('mailing_city', watchedValues.physical_city || '');
         setValue('mailing_state', watchedValues.physical_state || '');
         setValue('mailing_zip', watchedValues.physical_zip || '');
         // Don't trigger validation for mailing fields when they're the same
       } else {
         // If mailing different from physical, validate mailing fields
         trigger(['mailing_street', 'mailing_city', 'mailing_state', 'mailing_zip']);
       }
     }, 100);
   };

  // Add new owner
  const handleAddOwner = () => {
    appendOwner({
      fullName: '',
      title: '',
      ownership: '',
      dateOfBirth: '',
      email: '',
      homeAddress: '',
      phone: '',
    });
  };

  // Add new reference
  const handleAddReference = () => {
    appendReference({
      company: '',
      contact: '',
      phone: '',
      email: '',
    });
  };

  // Enhanced stepper navigation with validation
  const handleNext = async () => {
    const isValid = await validateCurrentStep(activeStep);
    if (isValid) {
      setLocalActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      toast.error('Please fix the errors before proceeding to the next step');
    }
  };

  const handleBack = () => {
    setLocalActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = async (step: number) => {
    // If trying to go to a later step, validate current step first
    if (step > activeStep) {
      const isValid = await validateCurrentStep(activeStep);
      if (!isValid) {
        toast.error('Please fix the errors before proceeding to the next step');
        return;
      }
    }
    setLocalActiveStep(step);
  };

  // Handle back navigation using Redux
  const handleBackNavigation = () => {
    navigate('/');
  };



  // Stepper steps configuration
  const steps = [
    {
      label: '1. Basic Information & Contact',
      content: (
        <Box sx={{ py: 2 }}>
          {/* Basic Information Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Basic Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('business_name')}
                label="Business Name *"
                error={!!errors.business_name}
                helperText={errors.business_name?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('dba_name')}
                label="DBA Name (Optional)"
                error={!!errors.dba_name}
                helperText={errors.dba_name?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="business_type"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    label="Business Type *"
                    options={[
                      { label: 'Sole Proprietorship', value: 'SOLE_PROP' },
                      { label: 'Partnership', value: 'PARTNERSHIP' },
                      { label: 'LLC', value: 'LLC' },
                      { label: 'Corporation', value: 'CORP' },
                      { label: 'Other', value: 'OTHER' },
                    ]}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    error={!!errors.business_type}
                    helperText={errors.business_type?.message?.toString() || ''}
                  />
                )}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('federal_ein')}
                label="Federal EIN (Optional)"
                error={!!errors.federal_ein}
                helperText={errors.federal_ein?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('ownership_type')}
                label="Ownership Type (Optional)"
                error={!!errors.ownership_type}
                helperText={errors.ownership_type?.message?.toString() || ''}
              />
            </Grid>
          </Grid>

          {/* Contact Information Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('primary_contact')}
                label="Primary Contact *"
                error={!!errors.primary_contact}
                helperText={errors.primary_contact?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('phone')}
                label="Phone *"
                error={!!errors.phone}
                helperText={errors.phone?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('email')}
                label="Email *"
                error={!!errors.email}
                helperText={errors.email?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('website')}
                label="Website (Optional)"
                error={!!errors.website}
                helperText={errors.website?.message?.toString() || ''}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: '2. Addresses',
      content: (
        <Box sx={{ py: 2 }}>
          {/* Physical Address Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Physical Address
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12 }}>
              <TextInput
                {...register('physical_street')}
                label="Street Address *"
                error={!!errors.physical_street}
                helperText={errors.physical_street?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
              <TextInput
                {...register('physical_city')}
                label="City *"
                error={!!errors.physical_city}
                helperText={errors.physical_city?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
              <TextInput
                {...register('physical_state')}
                label="State (2-letter code) *"
                error={!!errors.physical_state}
                helperText={errors.physical_state?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
              <TextInput
                {...register('physical_zip')}
                label="ZIP Code *"
                error={!!errors.physical_zip}
                helperText={errors.physical_zip?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('physical_county')}
                label="County (Optional)"
                error={!!errors.physical_county}
                helperText={errors.physical_county?.message?.toString() || ''}
              />
            </Grid>
          </Grid>

          {/* Mailing Address Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Mailing Address
          </Typography>
          <Box mb={2}>
            <Controller
              name="mailing_same_as_physical"
              control={control}
              render={({ field }) => (
                <SwitchInput
                  label="Mailing address same as physical address (toggle to copy physical address)"
                  checked={field.value}
                  onChange={(checked) => {
                    field.onChange(checked);
                    handleMailingToggle(checked);
                  }}
                />
              )}
            />
          
          </Box>
          
          {!watchedValues.mailing_same_as_physical && (
            <>
             
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextInput
                    {...register('mailing_street')}
                    label="Mailing Street Address *"
                    error={!!errors.mailing_street}
                    helperText={errors.mailing_street?.message?.toString() || 'Required when mailing address differs from physical address'}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextInput
                    {...register('mailing_city')}
                    label="Mailing City *"
                    error={!!errors.mailing_city}
                    helperText={errors.mailing_city?.message?.toString() || 'Required when mailing address differs from physical address'}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextInput
                    {...register('mailing_state')}
                    label="Mailing State (2-letter code) *"
                    error={!!errors.mailing_state}
                    helperText={errors.mailing_state?.message?.toString() || 'Required when mailing address differs from physical address'}
                    required
                    inputProps={{ maxLength: 2 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextInput
                    {...register('mailing_zip')}
                    label="Mailing ZIP Code *"
                    error={!!errors.mailing_zip}
                    helperText={errors.mailing_zip?.message?.toString() || 'Required when mailing address differs from physical address'}
                    required
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      ),
    },
    {
      label: '3. Licenses & Owners',
      content: (
        <Box sx={{ py: 2 }}>
          {/* Licenses Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Licenses & Documents
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('sales_tax_id')}
                label="Sales Tax ID *"
                error={!!errors.sales_tax_id}
                helperText={errors.sales_tax_id?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('state_tobacco_license')}
                label="State Tobacco License (Optional)"
                error={!!errors.state_tobacco_license}
                helperText={errors.state_tobacco_license?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('federal_tobacco_permit')}
                label="Federal Tobacco Permit (Optional)"
                error={!!errors.federal_tobacco_permit}
                helperText={errors.federal_tobacco_permit?.message?.toString() || ''}
              />
            </Grid>
          </Grid>
          
          <Typography variant="body2" sx={{ mt: 3, mb: 2, fontWeight: 500, color: 'text.secondary' }}>
            Document Uploads
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="resale_certificate_url"
                control={control}
                render={({ field }) => (
                  <FileUploadInput
                    id="resale-certificate-upload"
                    label="Resale Certificate *"
                    onChange={(file) => {
                      field.onChange(file);
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={field.value}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="state_tobacco_license_url"
                control={control}
                render={({ field }) => (
                  <FileUploadInput
                    id="state-tobacco-license-upload"
                    label="State Tobacco License"
                    onChange={(file) => {
                      field.onChange(file);
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={field.value}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="business_license_url"
                control={control}
                render={({ field }) => (
                  <FileUploadInput
                    id="business-license-upload"
                    label="Business License"
                    onChange={(file) => {
                      field.onChange(file);
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={field.value}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="owner_government_id_url"
                control={control}
                render={({ field }) => (
                  <FileUploadInput
                    id="owner-government-id-upload"
                    label="Owner Government ID"
                    onChange={(file) => {
                      field.onChange(file);
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={field.value}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Owners Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Business Owners ({ownerFields.length})
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            A primary owner is required. You can add additional owners if needed. The primary owner cannot be removed.
          </Typography>
          {ownerFields?.map((field : any, index : number) => (
            <Paper key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: index === 0 ? 'primary.main' : 'divider', borderWidth: index === 0 ? 2 : 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: index === 0 ? 'primary.main' : 'text.primary' }}>
                  {index === 0 ? 'Primary Owner (Required)' : `Additional Owner ${index + 1}`}
                </Typography>
                {index > 0 && (
                  <IconButton
                    onClick={() => handleRemoveOwner(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                )}
              </Box>
              
              <Grid container spacing={2}>
                                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.fullName`)}
                     label="Full Name *"
                     error={!!(errors.owners as any)?.[index]?.fullName}
                     helperText={(errors.owners as any)?.[index]?.fullName?.message?.toString() || ''}
                   />
                 </Grid>
                                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.title`)}
                     label="Title (Optional)"
                     error={!!(errors.owners as any)?.[index]?.title}
                     helperText={(errors.owners as any)?.[index]?.title?.message?.toString() || ''}
                   />
                 </Grid>
                                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.ownership`)}
                     label="Ownership % (Optional)"
                     type="text"
                     error={!!(errors.owners as any)?.[index]?.ownership}
                     helperText={(errors.owners as any)?.[index]?.ownership?.message?.toString() || ''}
                   />
                 </Grid>
                                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.dateOfBirth`)}
                     label="Date of Birth (Optional)"
                     type="date"
                     error={!!(errors.owners as any)?.[index]?.dateOfBirth}
                     helperText={(errors.owners as any)?.[index]?.dateOfBirth?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.email`)}
                     label="Email (Optional)"
                     error={!!(errors.owners as any)?.[index]?.email}
                     helperText={(errors.owners as any)?.[index]?.email?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`owners.${index}.phone`)}
                     label="Phone (Optional)"
                     error={!!(errors.owners as any)?.[index]?.phone}
                     helperText={(errors.owners as any)?.[index]?.phone?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12 }}>
                   <TextInput
                     {...register(`owners.${index}.homeAddress`)}
                     label="Home Address (Optional)"
                     error={!!(errors.owners as any)?.[index]?.homeAddress}
                     helperText={(errors.owners as any)?.[index]?.homeAddress?.message?.toString() || ''}
                   />
                 </Grid>
              </Grid>
            </Paper>
          ))}
          
          <CustomButton
            onClick={handleAddOwner}
            buttonType="primary"
            appearance="outlined"
            icon={<AddIcon />}
            iconPosition="left"
            fullWidth={false}
            sx={{ mt: 1 }}
          >
            Add Additional Owner (Optional)
          </CustomButton>
        </Box>
      ),
    },
    {
      label: '4. Financial & Additional Info',
      content: (
        <Box sx={{ py: 2 }}>
                     {/* Financial Information Section */}
           <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
             Financial Information
           </Typography>
           <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
             Bank information is required if you request a credit limit.
           </Typography>
           <Grid container spacing={2} sx={{ mb: 4 }}>
             <Grid size={{ xs: 12, md: 6 }}>
               <Controller
                 name="credit_limit_requested"
                 control={control}
                 render={({ field }) => (
                   <CheckboxInput
                     singleLabel="Request credit limit"
                     checked={field.value}
                     onChange={(value, checked) => field.onChange(checked)}
                   />
                 )}
               />
             </Grid>
              {watchedValues.credit_limit_requested && (
               <>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register('bank_name')}
                     label="Bank Name *"
                     error={!!errors.bank_name}
                     helperText={errors.bank_name?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register('bank_account_last4')}
                     label="Bank Account Last 4 Digits *"
                     error={!!errors.bank_account_last4}
                     helperText={errors.bank_account_last4?.message?.toString() || ''}
                   />
                 </Grid>
               </>
             )}
           </Grid>

          {/* References Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Business References
          </Typography>
          {referenceFields?.map((field : any, index : number) => (
            <Paper key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  Reference {index + 1}
                </Typography>
                <IconButton
                  onClick={() => removeReference(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`references.${index}.company`)}
                     label="Company *"
                     error={!!(errors.references as any)?.[index]?.company}
                     helperText={(errors.references as any)?.[index]?.company?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`references.${index}.contact`)}
                     label="Contact Person (Optional)"
                     error={!!(errors.references as any)?.[index]?.contact}
                     helperText={(errors.references as any)?.[index]?.contact?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`references.${index}.phone`)}
                     label="Phone (Optional)"
                     error={!!(errors.references as any)?.[index]?.phone}
                     helperText={(errors.references as any)?.[index]?.phone?.message?.toString() || ''}
                   />
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextInput
                     {...register(`references.${index}.email`)}
                     label="Email (Optional)"
                     error={!!(errors.references as any)?.[index]?.email}
                     helperText={(errors.references as any)?.[index]?.email?.message?.toString() || ''}
                   />
                 </Grid>
              </Grid>
            </Paper>
          ))}
          
          <CustomButton
            onClick={handleAddReference}
            buttonType="primary"
            appearance="outlined"
            icon={<AddIcon />}
            iconPosition="left"
            fullWidth={false}
            sx={{ mt: 1, mb: 4 }}
          >
            Add Reference
          </CustomButton>

          {/* Delivery & Shipping Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Delivery & Shipping
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('preferred_delivery_time')}
                label="Preferred Delivery Time *"
                placeholder="e.g., 9:00 AM - 5:00 PM"
                error={!!errors.preferred_delivery_time}
                helperText={errors.preferred_delivery_time?.message?.toString() || ''}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="special_delivery_instructions"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Special Delivery Instructions (Optional)"
                    error={!!errors.special_delivery_instructions}
                    helperText={errors.special_delivery_instructions?.message?.toString() || ''}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Compliance Certification & Signature Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            Compliance Certification & Signature
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            You must certify compliance to submit this request. The submit button will be disabled until you check this box.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="compliance_certification"
                control={control}
                render={({ field }) => (
                  <CheckboxInput
                    singleLabel="I certify that information is accurate and I will comply with all federal, state, and local tobacco laws, including age restrictions and tax obligations."
                    checked={field.value}
                    onChange={(value, checked) => field.onChange(checked)}
                    errorText={errors.compliance_certification?.message?.toString() || ''}
                  />
                )}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('authorized_signature')}
                label="Authorized Signature (type full name) *"
                error={!!errors.authorized_signature}
                helperText={errors.authorized_signature?.message?.toString() || ''}
              />
            </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
              <TextInput
                {...register('signature_date')}
                label="Date *"
                type="date"
                error={!!errors.signature_date}
                helperText={errors.signature_date?.message?.toString() || ''}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
  ];

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box bgcolor={'#fff'}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img 
              src={contactData?.logo || logo} 
              alt={contactData?.D_Name || "WOOPSA"} 
              style={{ height: '35px', cursor: 'pointer' }} 
              onClick={() => navigate("/")}
              onError={(e) => {
                e.currentTarget.src = logo;
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a 
                href="/products" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/products');
                }}
              >
                All Products
              </a>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="medium"
                fullWidth={false}
                sx={{mt: 0}}
              >
                Login
              </CustomButton>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Login
              </CustomButton>
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ color: 'primary.main' }}
              >
                <MenuIcon />
              </IconButton>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '280px',
              backgroundColor: '#f8f9fa',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <img
                src={contactData?.logo || logo}
                alt={contactData?.D_Name || "WOOPSA"}
                style={{ height: '30px' }}
                onError={(e) => {
                  e.currentTarget.src = logo;
                }}
              />
              <IconButton onClick={() => setMobileDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <List sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="Home" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/products');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="All Products" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </nav>

      {/* Full Width Image */}
      <Box sx={{ 
        width: '100%', 
        mt: '70px',
        position: 'relative',
        height: '200px',
        overflow: 'hidden'
      }}>
        <img 
          src={becomeRetailerImage} 
          alt="Become a Retailer" 
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover', 
            display: 'block'
          }}
        />
        {/* Overlay Heading */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 2
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600,
              // textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            Become a Retailer Partner
          </Typography>
        </Box>
      </Box>

      {/* Full Width Stepper */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        pt: '40px',
        mx: 'auto',
        maxWidth: '1400px',
        width: '100%',
        // width: '100%'   
      }}>
        <Stepper 
          activeStep={activeStep} 
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ 
            p: { xs: 1, md: 1.5 },
            width: '100%',
            '& .MuiStep-root': {
              flex: 1,
              '& .MuiStepLabel-root': {
                '& .MuiStepLabel-label': {
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'text.secondary',
                  textAlign: 'center',
                  '&.Mui-active': {
                    color: 'primary.main',
                    fontWeight: 600,
                  },
                  '&.Mui-completed': {
                    color: 'success.main',
                    fontWeight: 600,
                  },
                },
                '& .MuiStepLabel-iconContainer': {
                  display: 'none',
                }
              },
              '& .MuiStepConnector-root': {
                '& .MuiStepConnector-line': {
                  borderColor: 'divider',
                  borderTopWidth: 2,
                },
                '&.Mui-active .MuiStepConnector-line': {
                  borderColor: 'primary.main',
                  borderTopWidth: 3,
                },
                '&.Mui-completed .MuiStepConnector-line': {
                  borderColor: 'success.main',
                  borderTopWidth: 3,
                },
              }
            }
          }}
        >
          {steps?.map((step : any, index : number) => (
            <Step key={step.label}>
              <StepLabel 
                onClick={() => handleStep(index)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    '& .MuiStepLabel-label': {
                      color: 'primary.main',
                    }
                  }
                }}
              >
                {step.label}
              </StepLabel>
              {isMobile && (
                <StepContent>
                  {step.content}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <CustomButton
                      disabled={index === 0}
                      onClick={handleBack}
                      buttonType="cancel"
                      fullWidth={false}
                      sx={{ minWidth: '80px' }}
                    >
                      Back
                    </CustomButton>
                    <CustomButton
                      onClick={handleNext}
                      buttonType="primary"
                      fullWidth={false}
                      sx={{ minWidth: '80px' }}
                    >
                      {index === steps.length - 1 ? 'Finish' : 'Next'}
                    </CustomButton>
                  </Box>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form Content Container */}
      <Box sx={{ maxWidth: '1300px', mx: 'auto' }}>
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 'none' }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit) as any}>
            {/* Desktop Content */}
            {!isMobile && (
              <Box sx={{ minHeight: '400px' }}>
                {steps?.[activeStep]?.content}
              </Box>
            )}

            {/* Navigation Buttons */}
            {!isMobile && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <CustomButton
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  buttonType="cancel"
                  fullWidth={false}
                >
                  Back
                </CustomButton>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep === steps?.length - 1 ? (
                    <CustomButton
                      type="submit"
                      loading={loading}
                      fullWidth={false}
                      disabled={!watchedValues.compliance_certification}
                    >
                      {isEditMode ? 'Update Request' : 'Create Request'}
                    </CustomButton>
                  ) : (
                    <CustomButton
                      onClick={handleNext}
                      buttonType="primary"
                      fullWidth={false}
                    >
                      Next
                    </CustomButton>
                  )}
                </Box>
              </Box>
            )}

            {/* Mobile Submit Button */}
            {isMobile && activeStep === steps?.length - 1 && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <CustomButton
                  onClick={handleBackNavigation}
                  buttonType="cancel"
                  fullWidth={false}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  loading={loading}
                  fullWidth={false}
                  disabled={!watchedValues.compliance_certification}
                >
                  {isEditMode ? 'Update Request' : 'Create Request'}
                </CustomButton>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      
      {/* Footer */}
      <Footer contactData={contactData} />
    </Box>
  );
};

export default ContactUsRequestForm;