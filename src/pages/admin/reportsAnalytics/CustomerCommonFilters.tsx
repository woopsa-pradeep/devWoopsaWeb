import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Grid,
} from '@mui/material';
import toast from 'react-hot-toast';
import { listOfCustomersCreate } from '../../../redux/apis/distrubutor/retailerApis';
import dayjs from 'dayjs';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';

interface CustomerOption {
  C_Number: number;
  C_Name: string;
  C_Inactive?: boolean;
}

interface LabeledOption {
  label: string;
  value: string;
}

interface SalesRepOption {
  S_Number: number;
  S_Desc: string;
}

interface RouteOption {
  Route_Number: number;
  Route_Desc?: string;
}

interface SalesCategoryOption {
  label: string;
  value: string;
}

export type ActiveFilter = 'all' | 'active' | 'inactive';

export interface CustomerFilterValues {
  activeFilter: ActiveFilter;
  selectedCustomers: number[];
  selectedSalesReps: number[];
  selectedRoutes: number[];
  selectedClassOfTrade: string[];
  selectedJurisdictionState: string[];
  selectedJurisdictionCounty: string[];
  selectedJurisdictionCity: string[];
  selectedSalesCategories: string[];
  startDate: string;
  endDate: string;
  costOption: string;
}

interface CustomerCommonFiltersProps {
  onFiltersChange?: (values: CustomerFilterValues) => void;
  hideSalesCategory?: boolean;
  hideCostSelect?: boolean;
  /** When provided (e.g. when restoring after "Back to Configuration"), form is initialized with these values. Cleared on refresh. */
  initialValues?: CustomerFilterValues | null;
}

const todayDefault = dayjs().format('YYYY-MM-DD');

const CustomerCommonFilters: React.FC<CustomerCommonFiltersProps> = ({
  onFiltersChange,
  hideSalesCategory,
  hideCostSelect,
  initialValues,
}) => {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(initialValues?.activeFilter ?? 'all');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>(initialValues?.selectedCustomers ?? []);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);

  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>(initialValues?.selectedSalesReps ?? []);
  const [salesRepOptions, setSalesRepOptions] = useState<SalesRepOption[]>([]);

  const [selectedRoutes, setSelectedRoutes] = useState<number[]>(initialValues?.selectedRoutes ?? []);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);

  const [selectedClassOfTrade, setSelectedClassOfTrade] = useState<string[]>(initialValues?.selectedClassOfTrade ?? []);
  const [classOfTradeOptions, setClassOfTradeOptions] = useState<LabeledOption[]>([]);

  const [selectedJurisdictionState, setSelectedJurisdictionState] = useState<string[]>(initialValues?.selectedJurisdictionState ?? []);
  const [jurisdictionStateOptions, setJurisdictionStateOptions] = useState<LabeledOption[]>([]);

  const [selectedJurisdictionCounty, setSelectedJurisdictionCounty] = useState<string[]>(initialValues?.selectedJurisdictionCounty ?? []);
  const [jurisdictionCountyOptions, setJurisdictionCountyOptions] = useState<LabeledOption[]>([]);

  const [selectedJurisdictionCity, setSelectedJurisdictionCity] = useState<string[]>(initialValues?.selectedJurisdictionCity ?? []);
  const [jurisdictionCityOptions, setJurisdictionCityOptions] = useState<LabeledOption[]>([]);

  const [selectedSalesCategories, setSelectedSalesCategories] = useState<string[]>(initialValues?.selectedSalesCategories ?? []);
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<SalesCategoryOption[]>([]);

  const [startDate, setStartDate] = useState<string>(initialValues?.startDate ?? todayDefault);
  const [endDate, setEndDate] = useState<string>(initialValues?.endDate ?? todayDefault);

  const [costOption, setCostOption] = useState<string>(initialValues?.costOption ?? '0');

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await listOfCustomersCreate() as any;
        const data = response?.data || {};

        if (Array.isArray(data.customer)) {
          setCustomerOptions(
            data.customer.map((item: any) => ({
              C_Number: item.C_Number,
              C_Name: item.C_Name,
              C_Inactive: item.C_Inactive,
            })),
          );
        }

        if (Array.isArray(data.salesRep)) {
          setSalesRepOptions(
            data.salesRep.map((item: any) => ({
              S_Number: item.S_Number,
              S_Desc: item.S_Desc || '',
            })),
          );
        }

        if (Array.isArray(data.routes)) {
          setRouteOptions(
            data.routes.map((item: any) => ({
              Route_Number: item.Route_Number,
              Route_Desc: item.Route_Desc,
            })),
          );
        }

        if (Array.isArray(data.classOfTrade)) {
          setClassOfTradeOptions(
            data.classOfTrade.map((item: any) => ({
              label: item.Trade_Desc || '',
              value: item.Trade_Code || '',
            })),
          );
        }

        if (Array.isArray(data.taxRate)) {
          setJurisdictionStateOptions(
            data.taxRate.map((item: any) => ({
              label: item.TaxDescription || '',
              value: String(item.Jurisdiction_State ?? 0),
            })),
          );
        }

        if (Array.isArray(data.taxRateCounty)) {
          setJurisdictionCountyOptions(
            data.taxRateCounty.map((item: any) => ({
              label: item.TaxDescription || '',
              value: String(item.Jurisdiction_County ?? 0),
            })),
          );
        }

        if (Array.isArray(data.taxRateCity)) {
          setJurisdictionCityOptions(
            data.taxRateCity.map((item: any) => ({
              label: item.TaxDescription || '',
              value: String(item.Jurisdiction_City ?? 0),
            })),
          );
        }

        if (Array.isArray(data.salesCategory)) {
          setSalesCategoryOptions(
            data.salesCategory.map((item: any) => ({
              label: item.Category_Desc || '',
              value: String(item.Sales_Category ?? ''),
            })),
          );
        }
      } catch (error) {
        console.error('Error fetching customer filters:', error);
        toast.error('Failed to load filter options');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    void fetchDropdownData();
  }, []);

  const disabled = loadingDropdowns;

  const filteredCustomerOptions = useMemo(() => {
    if (activeFilter === 'all') return customerOptions;
    if (activeFilter === 'active') {
      return customerOptions.filter((c) => !c.C_Inactive);
    }
    return customerOptions.filter((c) => c.C_Inactive === true);
  }, [customerOptions, activeFilter]);

  useEffect(() => {
    setSelectedCustomers((prev) =>
      prev.filter((num) => filteredCustomerOptions.some((c) => c.C_Number === num)),
    );
  }, [activeFilter, filteredCustomerOptions]);

  useEffect(() => {
    if (!onFiltersChange) return;

    onFiltersChange({
      activeFilter,
      selectedCustomers,
      selectedSalesReps,
      selectedRoutes,
      selectedClassOfTrade,
      selectedJurisdictionState,
      selectedJurisdictionCounty,
      selectedJurisdictionCity,
      selectedSalesCategories,
      startDate,
      endDate,
      costOption,
    });
  }, [
    onFiltersChange,
    activeFilter,
    selectedCustomers,
    selectedSalesReps,
    selectedRoutes,
    selectedClassOfTrade,
    selectedJurisdictionState,
    selectedJurisdictionCounty,
    selectedJurisdictionCity,
    selectedSalesCategories,
    startDate,
    endDate,
    costOption,
  ]);

  const labelSx = {
    mb: 0.4,
    fontWeight: 500,
    fontSize: '0.68rem',
    display: 'block',
    color: 'text.secondary',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  return (
    <Grid container spacing={2}>
      {/* Column 1: Date and Cost (2 or 3 items) */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 0 }}>
              <CustomDatePicker
                label="Start Date"
                value={startDate ? dayjs(startDate) : null}
                onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : todayDefault)}
                disabled={disabled}
                maxDate={endDate ? dayjs(endDate) : undefined}
                sx={{ mb: 0 }}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 0 }}>
              <CustomDatePicker
                label="End Date"
                value={endDate ? dayjs(endDate) : null}
                onChange={(date) => setEndDate(date ? date.format('YYYY-MM-DD') : todayDefault)}
                disabled={disabled}
                minDate={startDate ? dayjs(startDate) : undefined}
                sx={{ mb: 0 }}
              />
            </Box>
          </Grid>
          {!hideCostSelect && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ mb: 0 }}>
                <Typography variant="caption" sx={labelSx}>
                  Cost
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={costOption}
                    onChange={(e) => setCostOption(e.target.value as string)}
                    disabled={disabled}
                    sx={{
                      fontSize: '0.75rem',
                      '& .MuiSelect-select': { minHeight: 'auto' },
                      '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                      '& .MuiSelect-icon': { color: 'primary.main' },
                    }}
                  >
                    <MenuItem value="0" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Avg Cost</MenuItem>
                    <MenuItem value="1" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Base Cost</MenuItem>
                    <MenuItem value="3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Net Cost</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>
      {/* Column 2: Status, Customer, and other filters (9) — 3 filters per row on md, 2 on sm, 1 on xs */}
      <Grid size={{ xs: 12, md: 9 }}>
        <Grid container spacing={2}>
          {/* Status (first) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ mb: 0 }}>
              <Typography variant="caption" sx={labelSx}>
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
                  disabled={disabled}
                  sx={{
                    fontSize: '0.75rem',
                    '& .MuiSelect-select': { minHeight: 'auto' },
                    '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                    '& .MuiSelect-icon': { color: 'primary.main' },
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>All Customers</MenuItem>
                  <MenuItem value="active" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Active Customers</MenuItem>
                  <MenuItem value="inactive" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Inactive Customers</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
          {/* Customer (second) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Customer
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedCustomers.map(String)}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedCustomers(values.map(Number));
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Customers
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const customer = customerOptions.find((c) => c.C_Number === Number(value));
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {customer ? `${customer.C_Number} - ${customer.C_Name}` : value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {filteredCustomerOptions.map((customer) => (
              <MenuItem
                key={customer.C_Number}
                value={String(customer.C_Number)}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedCustomers.includes(customer.C_Number)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {customer.C_Number} - {customer.C_Name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Sales Rep */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Sales Rep
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedSalesReps.map(String)}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedSalesReps(values.map(Number));
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Sales Reps
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const salesRep = salesRepOptions.find(sr => sr.S_Number === Number(value));
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {salesRep?.S_Desc || value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {salesRepOptions.map((salesRep) => (
              <MenuItem
                key={salesRep.S_Number}
                value={String(salesRep.S_Number)}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedSalesReps.includes(salesRep.S_Number)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {salesRep.S_Desc || salesRep.S_Number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Route */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Route
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedRoutes.map(String)}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedRoutes(values.map(Number));
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Routes
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const route = Array.isArray(routeOptions)
                      ? routeOptions.find(r => r.Route_Number === Number(value))
                      : undefined;
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {route?.Route_Desc || `Route ${value}`}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {Array.isArray(routeOptions) &&
              routeOptions.map((route) => (
                <MenuItem
                  key={route.Route_Number}
                  value={String(route.Route_Number)}
                  sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                >
                  <Checkbox
                    checked={selectedRoutes.includes(route.Route_Number)}
                    size="small"
                    sx={{
                      py: 0,
                      '& .MuiSvgIcon-root': { fontSize: '1rem' },
                    }}
                  />
                  {route.Route_Desc || `Route ${route.Route_Number}`}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Class of Trade */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Class of Trade
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedClassOfTrade}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedClassOfTrade(values);
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Class of Trade
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const classOfTrade = classOfTradeOptions.find(ct => ct.value === value);
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {classOfTrade?.label || value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {classOfTradeOptions.map((classOfTrade) => (
              <MenuItem
                key={classOfTrade.value}
                value={classOfTrade.value}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedClassOfTrade.includes(classOfTrade.value)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {classOfTrade.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Jurisdiction State */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Jurisdiction State
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedJurisdictionState}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedJurisdictionState(values);
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Jurisdiction States
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const jurisdiction = jurisdictionStateOptions.find(j => j.value === value);
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {jurisdiction?.label || value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {jurisdictionStateOptions.map((jurisdiction) => (
              <MenuItem
                key={jurisdiction.value}
                value={jurisdiction.value}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedJurisdictionState.includes(jurisdiction.value)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {jurisdiction.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Jurisdiction County */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Jurisdiction County
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedJurisdictionCounty}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedJurisdictionCounty(values);
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Jurisdiction Counties
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const jurisdiction = jurisdictionCountyOptions.find(j => j.value === value);
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {jurisdiction?.label || value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {jurisdictionCountyOptions.map((jurisdiction) => (
              <MenuItem
                key={jurisdiction.value}
                value={jurisdiction.value}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedJurisdictionCounty.includes(jurisdiction.value)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {jurisdiction.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Jurisdiction City */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{ mb: 0 }}>
        <Typography variant="caption" sx={labelSx}>
          Jurisdiction City
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedJurisdictionCity}
            onChange={(e) => {
              const values = e.target.value as string[];
              setSelectedJurisdictionCity(values);
            }}
            disabled={disabled}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    All Jurisdiction Cities
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const jurisdiction = jurisdictionCityOptions.find(j => j.value === value);
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {jurisdiction?.label || value}
                        {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                minHeight: 'auto',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {jurisdictionCityOptions.map((jurisdiction) => (
              <MenuItem
                key={jurisdiction.value}
                value={jurisdiction.value}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selectedJurisdictionCity.includes(jurisdiction.value)}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {jurisdiction.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
      </Grid>

      {/* Sales Category */}
      {!hideSalesCategory && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ mb: 0 }}>
          <Typography variant="caption" sx={labelSx}>
            Sales Category
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              multiple
              value={selectedSalesCategories}
              onChange={(e) => {
                const values = e.target.value as string[];
                setSelectedSalesCategories(values);
              }}
              disabled={disabled}
              displayEmpty
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      All Sales Categories
                    </Typography>
                  );
                }
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.slice(0, 2).map((value) => {
                      const category = salesCategoryOptions.find(s => s.value === value);
                      return (
                        <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                          {category?.label || value}
                          {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                        </Typography>
                      );
                    })}
                  </Box>
                );
              }}
              sx={{
                fontSize: '0.75rem',
                '& .MuiSelect-select': {
                  minHeight: 'auto',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '1px',
                },
                '& .MuiSelect-icon': {
                  color: 'primary.main',
                },
              }}
            >
              {salesCategoryOptions.map((category) => (
                <MenuItem
                  key={category.value}
                  value={category.value}
                  sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                >
                  <Checkbox
                    checked={selectedSalesCategories.includes(category.value)}
                    size="small"
                    sx={{
                      py: 0,
                      '& .MuiSvgIcon-root': { fontSize: '1rem' },
                    }}
                  />
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Box>
        </Grid>
      )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CustomerCommonFilters;

