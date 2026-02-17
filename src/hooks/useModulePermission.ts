import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export interface ModulePermission {
  canAdd: boolean;
  canEdit: boolean;
  canView: boolean;
}

/**
 * Returns add/edit/view permission for a module.
 * For distributor (admin): always returns all true.
 * For sales: reads from auth.module (permission list from API).
 */
export const useModulePermission = (moduleName: string): ModulePermission => {
  const { role, module } = useSelector((state: RootState) => state.auth);

  if (role === 'distributor') {
    return { canAdd: true, canEdit: true, canView: true };
  }

  if (role === 'sales' && Array.isArray(module)) {
    const mod = module.find((m: any) => m.module === moduleName);
    if (mod) {
      return {
        canAdd: !!mod.add,
        canEdit: !!mod.edit,
        canView: !!mod.view,
      };
    }
  }

  return { canAdd: false, canEdit: false, canView: false };
};
