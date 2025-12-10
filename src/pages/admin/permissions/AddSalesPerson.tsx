import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesPersonForm from './SalesPersonForm';
import { SalesPersonFormData } from './salesPersonSchema';
import { createUser, createRolePermissions } from '../../../redux/apis/distrubutor/permissionsApis';
import toast from 'react-hot-toast';

const AddSalesPerson = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const generatePath = (role: string, module: string) => {
    return `/${role}/${module}`
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/&/g, 'and');
  };

  const handleSubmit = async (data: SalesPersonFormData) => {
    setLoading(true);
    try {
      const response: any = await createUser(data);
      const userId = response?.data?.data?.id || response?.data?.id;
      
      toast.success('User created successfully!');
      
      // If user is checker, automatically create roles and permissions
      if (data.role === 'checker' && userId) {
        try {
          // const userName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'New User';
          const orderCheckerPath = generatePath('checker', 'Order Checker');
          
          const permissionsPayload = {
            userId: Number(userId),
            permissions: [
              {
                module: 'Order Checker',
                add: true,
                view: true,
                edit: true,
                path: orderCheckerPath,
              },
            ],
          };
          
          await createRolePermissions(permissionsPayload);
          toast.success('Roles and permissions configured for checker user!');
        } catch (permError: any) {
          console.error('Error creating permissions:', permError);
          // Don't fail the whole operation if permissions creation fails
          toast.error('User created but failed to set permissions. Please set them manually.');
        }
      }
      
      navigate('/admin/permissions');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error?.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SalesPersonForm
      mode="add"
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
};

export default AddSalesPerson; 