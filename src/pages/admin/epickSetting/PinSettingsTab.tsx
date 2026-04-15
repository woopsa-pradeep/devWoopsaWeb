import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SwitchInput from '../../../component/atoms/SwitchInput';
// import TextInput from '../../../component/atoms/TextInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import { 
  getAllEpickSettings, 
  createEpickSetting, 
  updateEpickSetting 
} from '../../../redux/apis/distrubutor/epickApis';

// Zod schema for EpickSetting validation
const epickSettingSchema = z.object({
  pin: z.string().min(1, 'PIN is required'),
  allowSingleScan: z.boolean(),
  capOrderQtyByInventory: z.boolean(),
  autoApproveOverrideRequests: z.boolean().optional(),
});

type EpickSettingFormData = z.infer<typeof epickSettingSchema> & { id?: number };

interface EpickSettingData {
  id?: number;
  pin: string;
  allowSingleScan: boolean;
  capOrderQtyByInventory?: boolean;
  autoApproveOverrideRequests?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PinSettingsTab: React.FC = () => {
  const [epickSettings, setEpickSettings] = useState<EpickSettingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // React Hook Form setup
  const form = useForm<EpickSettingFormData>({
    resolver: zodResolver(epickSettingSchema),
    defaultValues: {
      pin: '',
      allowSingleScan: false,
      capOrderQtyByInventory: false,
      id: 0,
      autoApproveOverrideRequests: false,
    },
  });

  // Fetch EpickSettings data
  const fetchEpickSettings = async () => {
    setLoading(true);
    try {
      const response: any = await getAllEpickSettings({});
      console.log('EpickSettings API Response:', response);
      
      // Handle different response structures
      let settingsData = null;
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        settingsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        settingsData = response.data;
      } else if (response?.data && !Array.isArray(response.data)) {
        // If response.data is a single object, not an array
        settingsData = [response.data];
      }
      
      console.log('Processed settingsData:', settingsData);
      
      if (settingsData && settingsData.length > 0) {
        // Take only the first index of data
        setEpickSettings(settingsData[0]);
        console.log('Set epickSettings:', settingsData[0]);
      } else {
        // If no data exists, set null
        setEpickSettings(null);
        console.log('No epick settings found, set to null');
      }
    } catch (error) {
      console.error('Failed to fetch EpickSettings data:', error);
      showErrorToast('Failed to fetch EpickSettings data');
    } finally {
      setLoading(false);
    }
  };

  // Effect to populate form when settings data is loaded
  useEffect(() => {
    if (epickSettings?.id) {
      form.reset({
        id: epickSettings.id,
        pin: epickSettings.pin,
        allowSingleScan: epickSettings.allowSingleScan,
        capOrderQtyByInventory: epickSettings.capOrderQtyByInventory ?? false,
        autoApproveOverrideRequests: (epickSettings as any)?.autoApproveOverrideRequests ?? false,
      });
    }
  }, [epickSettings]);

  // Fetch settings on mount
  useEffect(() => {
    fetchEpickSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (data: EpickSettingFormData) => {
    console.log('handleSubmit called with data:', data);
    setSaving(true);
    try {
      // Remove id from data for API call
      const formData = data;
      console.log('formData:', formData);
      console.log('epickSettings:', epickSettings);
      
      if (epickSettings?.id && epickSettings.id !== 0) {
        // Update existing settings - use the epickSettings ID
        await updateEpickSetting(epickSettings.id.toString(), {
          pin: formData.pin,
          allowSingleScan: formData.allowSingleScan,
          capOrderQtyByInventory: formData.capOrderQtyByInventory,
          autoApproveOverrideRequests: formData.autoApproveOverrideRequests,
        });
        showSuccessToast('Epick settings updated successfully!');
      } else {
        // Create new settings
        await createEpickSetting({
          pin: formData.pin,
          allowSingleScan: formData.allowSingleScan,
          capOrderQtyByInventory: formData.capOrderQtyByInventory,
          autoApproveOverrideRequests: formData.autoApproveOverrideRequests,        
        });
        showSuccessToast('Epick settings created successfully!');
      }
      
      // Refresh data after successful operation
      await fetchEpickSettings();
    } catch (error) {
      console.error('Failed to save EpickSettings:', error);
      showErrorToast('Failed to save EpickSettings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Epick settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Hidden ID field */}
          <input type="hidden" {...form.register('id')} />
          
          {/* <TextInput
            label="PIN"
            {...form.register('pin')}
            error={!!form.formState.errors.pin}
            helperText={form.formState.errors.pin?.message}
            placeholder="Enter PIN for Epick settings"
          /> */}
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 14 }}>Allow Single Scan</Typography>
            <SwitchInput
              checked={form.watch('allowSingleScan')}
              onChange={(checked) => form.setValue('allowSingleScan', checked)}
              sx={{ mb: 0 }}
              isShowLabel={false}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 14 }}>Cap Order Qty By Inventory</Typography>
            <SwitchInput
              checked={form.watch('capOrderQtyByInventory')}
              onChange={(checked) => form.setValue('capOrderQtyByInventory', checked)}
              sx={{ mb: 0 }}
              isShowLabel={false}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
         <Typography  sx={{ fontSize: 14}}>Auto Approve Override Requests</Typography>
          <SwitchInput
         checked={form.watch('autoApproveOverrideRequests')}
         onChange={(checked) =>
          form.setValue('autoApproveOverrideRequests', checked)
           }
           sx={{ mb: 0 }}
          isShowLabel={false}
         />
         </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 0 }}>
            <CustomButton
              type="submit"
              loading={saving}
              fullWidth={false}
              sx={{ minWidth: 120 }}
            >
              {saving ? 'Saving...' : (epickSettings?.id ? 'Update' : 'Save')}
            </CustomButton>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default PinSettingsTab;

