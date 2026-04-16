import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CustomButton from '../../../component/atoms/CustomButton';
import SwitchInput from '../../../component/atoms/SwitchInput';
import toast from 'react-hot-toast';
import { createRolePermissions, updateRolePermissions, getUserRolePermissions } from '../../../redux/apis/distrubutor/permissionsApis';
import { ArrowBack, ExpandMore } from '@mui/icons-material';

const MODULE_GROUPS: Record<string, string[]> = {
  'Promo & marketing': ['Active Promos', 'Stories', 'Product Catalog', 'WebView', 'Links', 'Email Marketing'],
  'Product': ['Future Pricing', 'Bulk Update', 'Bulk Image', 'Print Label'],
  'Epick': ['Settings', 'Ongoing Orders', 'Order Preferences', 'Reports', 'Create User', 'Checker Users', 'Pending Requests'],
};

const RolesPermissionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  
  // Get user data from location state
  const userData = location.state?.userData;
    

  // Default permissions template
  const getDefaultPermissions = (id: string, name: string, role?: string, isNewUser?: boolean) => {
    const mk = (module: string, overrides: Partial<{ add: boolean; view: boolean; edit: boolean }> = {}) => ({
      salesId: id,
      name,
      module,
      add: false,
      view: false,
      edit: false,
      ...overrides,
    });

    const withSubs = (parent: string, overrides: Partial<{ add: boolean; view: boolean; edit: boolean }> = {}) => [
      mk(parent, overrides),
      ...(MODULE_GROUPS[parent] || []).map(sub => mk(`${parent} - ${sub}`)),
    ];

    const checkerAll = role === 'checker' && isNewUser ? { add: true, view: true, edit: true } : {};
    const salesAll = role === 'sales' && isNewUser ? { add: true, view: true, edit: true } : {};

    const allModules = [
      mk('Account Receivable'),
      mk('Return Orders'),
      mk('Orders'),
      mk('Ordered Items'),
      mk('Order History'),
      mk('Order Confirmation'),
      mk('Order Checker', checkerAll),
      mk('Calendar'),
      ...withSubs('Promo & marketing'),
      mk('Retailers'),
      mk('Dashboard', salesAll),
      ...withSubs('Product'),
      mk('Vendor'),
      ...withSubs('Epick'),
      mk('Track Login Device'),
    ];

    // If role is checker, only return Order Checker module
    if (role === 'checker') {
      return allModules.filter(module => module.module === 'Order Checker');
    }

    return allModules;
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchRolesPermissions = async () => {
      try {
        setLoading(true);
        
        if (id === 'new') {
          setIsNew(true);
          
          const userRole = userData?.role || 'sales';
          const defaultPermissions = getDefaultPermissions('new', userData?.firstName + ' ' + userData?.lastName || 'New User', userRole, true);
          const withPath = defaultPermissions.map((row: any) => ({
            ...row,
            path: generatePath(userRole, row.module),
          }));
          setRows(withPath);
        } else {
          if (userData) {
          }

          const response: any = await getUserRolePermissions(id);
          const raw = response?.data;
          const permissionsData = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : undefined);
          const userRole = userData?.role || 'sales';
          
          const defaultPermissions = getDefaultPermissions(id, userData?.firstName + ' ' + userData?.lastName || 'User', userRole, false);
          
          if (Array.isArray(permissionsData)) {
            // Merge existing permissions with default permissions (default list is source of truth)
            let mergedPermissions = defaultPermissions.map(defaultModule => {
              const existingModule = permissionsData.find((p: any) => p.module === defaultModule.module);
              if (existingModule) {
                return {
                  ...defaultModule,
                  id: existingModule.id,
                  add: !!existingModule.add,
                  view: !!existingModule.view,
                  edit: !!existingModule.edit,
                };
              }
              return defaultModule;
            });

            // If role is checker, filter to only show Order Checker module
            if (userRole === 'checker') {
              mergedPermissions = mergedPermissions.filter(module => module.module === 'Order Checker');
            } else {
              // Ensure all default modules are shown on edit (e.g. Product, Vendor, Epick, Track Login Device)
              const mergedModuleNames = new Set(mergedPermissions.map((m: any) => m.module));
              const missingDefaults = defaultPermissions.filter((d: any) => !mergedModuleNames.has(d.module));
              if (missingDefaults.length > 0) {
                mergedPermissions = [...mergedPermissions, ...missingDefaults];
              }
            }

            const withPath = mergedPermissions.map((row: any) => ({
              ...row,
              path: generatePath(userRole, row.module),
            }));
            setRows(withPath);
            setIsNew(false);
          } else {
            // Use default permissions if no existing permissions
            setIsNew(true);
            const withPath = defaultPermissions.map((row: any) => ({
              ...row,
              path: generatePath(userRole, row.module),
            }));
            setRows(withPath);
          }
        }
      } catch (error: any) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load permissions data');
      } finally {
        setLoading(false);
      }
    };

    fetchRolesPermissions();
  }, [id, userData]);

  function generatePath(role: string, module: string) {
    return `/${role}/${module}`
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/&/g, 'and');
  }

  const handleToggle = (rowIdx: number, field: string, value: boolean) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };

      row[field] = value;

      // If add or edit is enabled, automatically enable view
      if ((field === 'add' || field === 'edit') && value === true) {
        row.view = true;
      }

      // If trying to disable view but add or edit is enabled, keep view as true
      if (field === 'view' && value === false && (row.add || row.edit)) {
        row.view = true;
      }

      next[rowIdx] = row;

      // If this is a parent module and view is being turned OFF, reset all sub-modules to false
      const parentModule = row.module;
      if (MODULE_GROUPS[parentModule] && field === 'view' && value === false && !row.add && !row.edit) {
        MODULE_GROUPS[parentModule].forEach(sub => {
          const subIdx = next.findIndex(r => r.module === `${parentModule} - ${sub}`);
          if (subIdx >= 0) {
            next[subIdx] = { ...next[subIdx], add: false, view: false, edit: false };
          }
        });
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    let payload;
    try {
      // Include all rows in payload regardless of permissions
      if (isNew) {
        payload = {
          userId: Number(id),
          permissions: rows.map((row) => ({
            module: row.module,
            add: !!row.add,
            view: !!row.view,
            edit: !!row.edit,
            path: row.path,
          })),
        };
        await createRolePermissions(payload);
        toast.success('Permissions added successfully!');
      } else {
        payload = {
          userId: Number(id),
          permissions: rows.map((row) => ({
            id: row.id,
            module: row.module,
            add: !!row.add,
            view: !!row.view,
            edit: !!row.edit,
            path: row.path,
          })),
        };
        await updateRolePermissions(payload);
        toast.success('Permissions updated successfully!');
      }
      // setPayload(payload);
      setSaving(false);
      navigate('/admin/permissions');
    } catch (error: any) {
      setSaving(false);
      toast.error(error?.message || 'Something went wrong!');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const rowIndexOf = (moduleName: string) => rows.findIndex(r => r.module === moduleName);

  const renderToggles = (row: any, idx: number, disabled?: boolean) => (
    <>
      <Box sx={{ flex: '0 0 16.66%' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <SwitchInput
          checked={!!row.add}
          onChange={(checked) => handleToggle(idx, 'add', checked)}
          disabled={disabled}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      </Box>
      <Box sx={{ flex: '0 0 16.66%' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <SwitchInput
          checked={!!row.view}
          onChange={(checked) => handleToggle(idx, 'view', checked)}
          disabled={disabled || !!row.add || !!row.edit}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      </Box>
      <Box sx={{ flex: '0 0 16.66%' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <SwitchInput
          checked={!!row.edit}
          onChange={(checked) => handleToggle(idx, 'edit', checked)}
          disabled={disabled}
          sx={{ mb: 0 }}
          isShowLabel={false}
        />
      </Box>
    </>
  );

  const subParents = Object.keys(MODULE_GROUPS);

  const renderBody = () => {
    const consumed = new Set<string>();
    const blocks: React.ReactNode[] = [];

    rows.forEach((row, idx) => {
      if (consumed.has(row.module)) return;
      if (row.module.includes(' - ')) return;
      consumed.add(row.module);

      if (subParents.includes(row.module)) {
        const subs = (MODULE_GROUPS[row.module] || [])
          .map(sub => {
            const moduleName = `${row.module} - ${sub}`;
            const subIdx = rowIndexOf(moduleName);
            return subIdx >= 0 ? { row: rows[subIdx], idx: subIdx, label: sub } : null;
          })
          .filter((x): x is { row: any; idx: number; label: string } => !!x);

        subs.forEach(s => consumed.add(s.row.module));

        const parentViewOn = !!row.view;

        blocks.push(
          <Accordion
            key={row.module}
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              mb: 1.5,
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                px: 2,
                bgcolor: 'background.default',
                minHeight: 52,
                '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ flex: '0 0 25%' }}>
                  <Typography fontSize={14} fontWeight={500} color="text.primary">{row.name}</Typography>
                </Box>
                <Box sx={{ flex: '0 0 25%' }}>
                  <Typography fontSize={14} fontWeight={600} color="text.primary">{row.module}</Typography>
                </Box>
                {renderToggles(row, idx)}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {!parentViewOn && (
                <Box sx={{ px: 3, py: 1.5, bgcolor: 'warning.50', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography fontSize={12} color="text.secondary" fontStyle="italic">
                    Enable &quot;View&quot; on {row.module} to manage sub-permissions
                  </Typography>
                </Box>
              )}
              {subs.map((s, sIdx) => (
                <Box
                  key={s.row.module}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: parentViewOn ? 'background.paper' : 'action.disabledBackground',
                    opacity: parentViewOn ? 1 : 0.5,
                    transition: 'all 0.2s',
                    ...(sIdx === subs.length - 1 ? {} : {}),
                  }}
                >
                  <Box sx={{ flex: '0 0 25%' }} />
                  <Box sx={{ flex: '0 0 25%', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: parentViewOn ? 'primary.main' : 'text.disabled',
                      flexShrink: 0,
                    }} />
                    <Typography fontSize={13} color={parentViewOn ? 'text.secondary' : 'text.disabled'}>
                      {s.label}
                    </Typography>
                  </Box>
                  {renderToggles(s.row, s.idx, !parentViewOn)}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        );
      } else {
        blocks.push(
          <Box
            key={row.module}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flex: '0 0 25%' }}>
              <Typography fontSize={14} color="text.secondary">{row.name}</Typography>
            </Box>
            <Box sx={{ flex: '0 0 25%' }}>
              <Typography fontSize={14} color="text.secondary">{row.module}</Typography>
            </Box>
            {renderToggles(row, idx)}
          </Box>
        );
      }
    });

    return blocks;
  };

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ArrowBack onClick={() => navigate('/admin/permissions')} sx={{ cursor: 'pointer', fontSize: 24 }} />
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          Roles & Permissions
        </Typography>
      </Box>
      <Paper sx={{ boxShadow: 'none', borderRadius: '8px', p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            bgcolor: 'background.default',
            borderBottom: '2px solid',
            borderColor: 'divider',
            borderRadius: '8px 8px 0 0',
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: '0 0 25%' }}><Typography fontSize={13} fontWeight={600}>Name</Typography></Box>
          <Box sx={{ flex: '0 0 25%' }}><Typography fontSize={13} fontWeight={600}>Module Name</Typography></Box>
          <Box sx={{ flex: '0 0 16.66%' }}><Typography fontSize={13} fontWeight={600}>Add</Typography></Box>
          <Box sx={{ flex: '0 0 16.66%' }}><Typography fontSize={13} fontWeight={600}>View</Typography></Box>
          <Box sx={{ flex: '0 0 16.66%' }}><Typography fontSize={13} fontWeight={600}>Edit</Typography></Box>
        </Box>
        <Box>{renderBody()}</Box>
        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <CustomButton buttonType="cancel" appearance="outlined" onClick={() => navigate('/admin/permissions')} fullWidth={false} sx={{ minWidth: 120 }}>
            Cancel
          </CustomButton>
          <CustomButton type="button" onClick={handleSubmit} loading={saving} fullWidth={false} sx={{ minWidth: 120 }}>
            {isNew ? 'Add Permissions' : 'Update Permissions'}
          </CustomButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default RolesPermissionsPage;