import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomButton from '../atoms/CustomButton';
import SwitchInput from '../atoms/SwitchInput';

export interface FieldUpdate {
  id: string;
  field: string;
  value: string;
  matchValue?: string; // optional current-value filter
}

interface InventoryListOptions {
  salesCategory: Array<{ label: string; value: string }>;
  priceClass: Array<{ label: string; value: string }>;
  priceSubclass: Array<{ label: string; value: string }>;
  otherTaxes: Array<{ label: string; value: string }>;
  inventoryItemGroup: Array<{ label: string; value: string }>;
  vendor: Array<{ label: string; value: string }>;
  inventoryBrand: Array<{ label: string; value: string }>;
  msaCategory: Array<{ label: string; value: string }>;
  nacsCategory: Array<{ label: string; value: string }>;
  projectIdentifier: Array<{ label: string; value: string }>;
}

// Column display name mapping
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  'ShortOrderForm': 'Web Allow',
  'Price1': 'Price 1',
  'Price2': 'Price 2',
  'Price3': 'Price 3',
  'Price4': 'Price 4',
  'Price5': 'Price 5',
  'Price6': 'Price 6',
  'Retail1': 'Retail 1',
  'Retail2': 'Retail 2',
  'Retail3': 'Retail 3',
  'RetailPct1': 'Retail % 1',
  'RetailPct2': 'Retail % 2',
  'RetailPct3': 'Retail % 3',
  'BaseCost': 'Base Cost',
  'UnitOunces': 'Ounces/ml',
  'Cig_Sticks': 'Sticks',
  'Primary_Vendor': 'Vendor',
  'I_Inactive': 'Inactive',
  'I_Discontinued': 'Discontinued',
  'UOM': 'Size',
  'Unit_Upcharge': 'Unit Upcharge',
  'Unit_Price': 'Unit Price',
  'Invoice_Cost': 'MFG Cost',
  'NetCost': 'Net Cost',
  'Item_GroupID': 'Item Group ID',
  'Sales_Category': 'Sales Category',
  'Price_Class': 'Price Class',
  'Price_Subclass': 'Price Subclass',
  'OTP_Number': 'OTP Number',
  'CaseCount': 'Case Count',
  'PriceBook_Include': 'Price Book Include',
  'Track_ExpirationDate': 'Track Expiration Date',
  'Brand_ID': 'Brand ID',
  'PriceCostModifiedDate': 'Price Cost Modified Date',
  'PriceCostModifiedUser': 'Price Cost Modified User',
  'Date_LastChange': 'Date Last Change',
  'Date_LastChangeUser': 'Date Last Change User',
  'MSA_Category_Code': 'MSA Category Code',
  'Project_Identifier': 'Project Identifier',
};

// Helper function to format column names
const formatColumnName = (column: string): string => {
  // First check if there's a custom display name
  if (COLUMN_DISPLAY_NAMES[column]) {
    return COLUMN_DISPLAY_NAMES[column];
  }
  // Otherwise, replace underscores with spaces and capitalize first letter of each word
  return column
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Checkbox/toggle fields
const TOGGLE_FIELDS = ['ShortOrderForm', 'PriceBook_Include', 'Breakable', 'I_Inactive', 'I_Discontinued', 'EBT', 'Track_ExpirationDate', 'eCommerce'];

// Dropdown fields with their option keys
const DROPDOWN_FIELDS: Record<string, keyof InventoryListOptions> = {
  'Sales_Category': 'salesCategory',
  'Price_Class': 'priceClass',
  'Price_Subclass': 'priceSubclass',
  'OTP_Number': 'otherTaxes',
  'Item_GroupID': 'inventoryItemGroup',
  'Primary_Vendor': 'vendor',
  'Manufacturer': 'vendor',
  'Brand_ID': 'inventoryBrand',
  'MSA_Category_Code': 'msaCategory',
  'NACS': 'nacsCategory',
  'Project_Identifier': 'projectIdentifier',
};

interface BulkUpdateFieldsProps {
  availableFields: string[];
  fieldUpdates: FieldUpdate[];
  onFieldUpdatesChange: (updates: FieldUpdate[]) => void;
  onUpdate: () => void;
  updating: boolean;
  getFieldType: (fieldName: string) => string;
  getFieldValue?: (fieldName: string) => any; // Optional function to get current field value from data
  salesCategoryOptions?: Array<{ label: string; value: string }>;
  priceClassOptions?: Array<{ label: string; value: string }>;
  inventoryOptions?: InventoryListOptions;
  selectedGroup?: string;
  onGroupChange?: (group: string) => void;
  groupOptions?: Array<{ value: string; label: string }>;
}

const BulkUpdateFields: React.FC<BulkUpdateFieldsProps> = ({
  availableFields,
  fieldUpdates,
  onFieldUpdatesChange,
  onUpdate,
  updating,
  getFieldType,
  getFieldValue,
  salesCategoryOptions = [],
  priceClassOptions = [],
  inventoryOptions,
  selectedGroup = 'all',
  onGroupChange,
  groupOptions = [],
}) => {
  const theme = useTheme();
  const handleAddField = () => {
    const newField: FieldUpdate = {
      id: Date.now().toString(),
      field: '',
      value: '',
      matchValue: '',
    };
    onFieldUpdatesChange([...fieldUpdates, newField]);
  };

  const handleRemoveField = (id: string) => {
    onFieldUpdatesChange(fieldUpdates.filter(f => f.id !== id));
  };

  // Check if field should use toggle (0/1 values)
  const isToggleField = (fieldName: string): boolean => {
    return TOGGLE_FIELDS.includes(fieldName);
  };

  // Check if field should use dropdown
  const isDropdownField = (fieldName: string): boolean => {
    return fieldName in DROPDOWN_FIELDS;
  };

  // Get dropdown options for a field
  const getDropdownOptions = (fieldName: string): Array<{ label: string; value: string }> => {
    const optionKey = DROPDOWN_FIELDS[fieldName];
    if (optionKey && inventoryOptions) {
      return inventoryOptions[optionKey] || [];
    }
    // Fallback for backwards compatibility
    if (fieldName === 'Sales_Category') return salesCategoryOptions;
    if (fieldName === 'Price_Class') return priceClassOptions;
    return [];
  };

  const handleFieldChange = (id: string, field: string, value: string) => {
    onFieldUpdatesChange(fieldUpdates.map(f => {
      if (f.id === id) {
        const updated = { ...f, [field]: value };
        // If field changed to a toggle field, initialize value
        if (field === 'field' && isToggleField(value)) {
          // Try to get current value from data, otherwise default to '0'
          if (getFieldValue) {
            const currentValue = getFieldValue(value);
            updated.value = currentValue === true || currentValue === 1 ? '1' : '0';
          } else {
            updated.value = '0';
          }
        }
        // If field changed to a dropdown field, initialize value
        else if (field === 'field' && isDropdownField(value)) {
          // Try to get current value from data
          if (getFieldValue) {
            const currentValue = getFieldValue(value);
            // Convert to string for dropdown - match with option values
            if (currentValue !== undefined && currentValue !== null) {
              // Find matching option value
              const options = getDropdownOptions(value);
              const matchingOption = options.find(opt => 
                Number(opt.value) === Number(currentValue) || opt.value === String(currentValue)
              );
              updated.value = matchingOption ? matchingOption.value : String(currentValue);
            } else {
              updated.value = '';
            }
          } else {
            updated.value = '';
          }
        }
        // If field changed from toggle/dropdown to regular field, clear value
        else if (field === 'field' && (isToggleField(f.field) || isDropdownField(f.field))) {
          updated.value = '';
        }
        return updated;
      }
      return f;
    }));
  };

  const handleClearAll = () => {
    onFieldUpdatesChange([]);
  };

  const handleToggleChange = (id: string, checked: boolean) => {
    handleFieldChange(id, 'value', checked ? '1' : '0');
  };

  const isFormValid = fieldUpdates.length > 0 && 
    fieldUpdates.every(fu => {
      if (!fu.field) return false;
      // Toggle fields always have a value (0 or 1), so just check if field is selected
      if (isToggleField(fu.field)) return true;
      // Other fields need a value
      return fu.value !== '';
    });

  return (
    <Paper 
      sx={{ 
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 2px 12px rgba(0,0,0,0.08)',
        borderRadius: '12px', 
        mb: 2, 
        p: 2.5,
        height: 'calc(100vh - 240px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header: Title | Dropdown | Add Button */}
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{ minWidth: 'fit-content' }}>
          <Typography fontSize={15} fontWeight={600} color="text.primary">
            Bulk Update
          </Typography>
          <Typography fontSize={11} color="text.secondary" mt={0.3}>
            {fieldUpdates.length} field{fieldUpdates.length !== 1 ? 's' : ''} selected
          </Typography>
        </Box>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel sx={{ fontSize: '12px' }}>Field Group</InputLabel>
          <Select
            value={selectedGroup}
            onChange={(e) => onGroupChange?.(e.target.value)}
            label="Field Group"
            sx={{ 
              fontSize: '12px',
              borderRadius: '8px',
            }}
          >
            {groupOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: '12px' }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <CustomButton
          onClick={handleAddField}
          icon={<AddIcon sx={{ fontSize: 16 }} />}
          iconPosition="left"
          appearance="filled"
          size="small"
          fullWidth={false}
          sx={{ mt: 0, borderRadius: '8px', px: 2, minWidth: 'auto' }}
        >
          Add
        </CustomButton>
      </Box>

      {fieldUpdates.length === 0 ? (
        <Box
          onClick={handleAddField}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px dashed ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300]}`,
            borderRadius: '10px',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.02)' 
              : 'rgba(0,0,0,0.01)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.04)' 
                : 'rgba(0,0,0,0.02)',
              '& .add-icon-box': {
                bgcolor: theme.palette.primary.main + '15',
                '& .MuiSvgIcon-root': {
                  color: theme.palette.primary.main,
                }
              }
            },
          }}
        >
          <Box 
            className="add-icon-box"
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '12px', 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              transition: 'all 0.2s ease',
            }}
          >
            <AddIcon sx={{ fontSize: 24, color: 'text.disabled', transition: 'color 0.2s ease' }} />
          </Box>
          <Typography fontSize={13} fontWeight={500} color="text.secondary" mb={0.5}>
            No fields selected
          </Typography>
          <Typography fontSize={11} color="text.disabled">
            Add fields to update multiple items at once
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {fieldUpdates.map((fieldUpdate, index) => (
            <Box 
              key={fieldUpdate.id} 
              sx={{
                p: 1.5,
                borderRadius: '10px',
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.03)' 
                  : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <Typography fontSize={11} fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Field {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveField(fieldUpdate.id)}
                  sx={{
                    p: 0.4,
                    ml: 'auto',
                    opacity: 0.6,
                    transition: 'all 0.15s ease',
                    '&:hover': { 
                      opacity: 1,
                      bgcolor: theme.palette.error.main + '20',
                      color: 'error.main'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Grid container spacing={1} alignItems="flex-start">
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '12px' }}>Field</InputLabel>
                    <Select
                      value={fieldUpdate.field}
                      onChange={(e) => handleFieldChange(fieldUpdate.id, 'field', e.target.value)}
                      label="Field"
                      sx={{ 
                        fontSize: '12px',
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.divider,
                        }
                      }}
                    >
                      {availableFields
                        .filter(field => !fieldUpdates.some(fu => fu.field === field && fu.id !== fieldUpdate.id))
                        .map((field) => (
                          <MenuItem key={field} value={field} sx={{ fontSize: '12px' }}>
                            {formatColumnName(field)}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={fieldUpdate.field ? `Filter by ${formatColumnName(fieldUpdate.field)} (optional)` : 'Filter field (optional)'}
                    value={fieldUpdate.matchValue || ''}
                    onChange={(e) => handleFieldChange(fieldUpdate.id, 'matchValue', e.target.value)}
                    type={getFieldType(fieldUpdate.field)}
                    placeholder={fieldUpdate.field ? `Filter by ${formatColumnName(fieldUpdate.field)} value` : 'Select field first'}
                    disabled={!fieldUpdate.field}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '12px' },
                      '& .MuiInputLabel-root': { fontSize: '12px' },
                      '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {fieldUpdate.field && isToggleField(fieldUpdate.field) ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        height: '40px',
                        px: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '8px',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Typography fontSize={12} color="text.secondary">
                        Enable
                      </Typography>
                      <SwitchInput
                        checked={fieldUpdate.value === '1' || fieldUpdate.value === 'true'}
                        onChange={(checked) => handleToggleChange(fieldUpdate.id, checked)}
                        sx={{ mb: 0 }}
                        isShowLabel={false}
                      />
                    </Box>
                  ) : fieldUpdate.field && isDropdownField(fieldUpdate.field) ? (
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '12px' }}>Value</InputLabel>
                      <Select
                        value={fieldUpdate.value || ''}
                        onChange={(e) => handleFieldChange(fieldUpdate.id, 'value', e.target.value)}
                        label="Value"
                        sx={{ 
                          fontSize: '12px',
                          borderRadius: '8px',
                        }}
                      >
                        {getDropdownOptions(fieldUpdate.field).map((option) => (
                          <MenuItem key={option.value} value={option.value} sx={{ fontSize: '12px' }}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label="Value"
                      value={fieldUpdate.value}
                      onChange={(e) => handleFieldChange(fieldUpdate.id, 'value', e.target.value)}
                      type={getFieldType(fieldUpdate.field)}
                      placeholder={fieldUpdate.field ? `Enter value` : 'Select field first'}
                      disabled={!fieldUpdate.field}
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '12px' },
                        '& .MuiInputLabel-root': { fontSize: '12px' },
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </Box>
          ))}
          <Box 
            display="flex" 
            gap={1} 
            mt="auto"
            sx={{ 
              pt: 2, 
              flexShrink: 0,
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              zIndex: 10,
            }}
          >
            <CustomButton
              onClick={handleClearAll}
              appearance="outlined"
              disabled={updating}
              fullWidth
              size="small"
              sx={{ mt: 0, borderRadius: '8px' }}
            >
              Clear
            </CustomButton>
            <CustomButton
              onClick={onUpdate}
              loading={updating}
              disabled={!isFormValid}
              fullWidth
              size="small"
              sx={{ mt: 0, borderRadius: '8px' }}
            >
              Update
            </CustomButton>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default BulkUpdateFields;

