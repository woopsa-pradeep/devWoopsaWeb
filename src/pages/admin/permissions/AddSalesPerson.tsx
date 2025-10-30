import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesPersonForm from './SalesPersonForm';
import { SalesPersonFormData } from './salesPersonSchema';
import { createUser } from '../../../redux/apis/distrubutor/permissionsApis';
import toast from 'react-hot-toast';

const AddSalesPerson = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SalesPersonFormData) => {
    setLoading(true);
    try {
      await createUser(data);
      toast.success('User created successfully!');
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