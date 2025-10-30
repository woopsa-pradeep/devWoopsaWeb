import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CommonTable, { TableColumn } from '../../component/atoms/Table/CommonTable';

interface ExampleData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const PaginationExample: React.FC = () => {
  const [data, setData] = useState<ExampleData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Mock data generation
  const generateMockData = (page: number, size: number) => {
    const startIndex = (page - 1) * size;
    const mockData: ExampleData[] = [];
    
    for (let i = 0; i < size; i++) {
      const id = startIndex + i + 1;
      mockData.push({
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`,
        role: ['Admin', 'User', 'Manager', 'Editor'][id % 4],
        status: ['active', 'inactive', 'pending'][id % 3] as 'active' | 'inactive' | 'pending',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
    }
    
    return mockData;
  };

  const columns: TableColumn<ExampleData>[] = [
    {
      id: 'id',
      label: 'ID',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography variant="body2" fontWeight={500} color="primary.main">
          #{row.id}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
      render: (row) => (
        <Typography variant="body2" fontWeight={500}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.email}
        </Typography>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
            fontSize: '0.75rem',
            fontWeight: 500,
            display: 'inline-block',
          }}
        >
          {row.role}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        const statusColors = {
          active: { bg: '#e8f5e8', color: '#2e7d32' },
          inactive: { bg: '#ffebee', color: '#c62828' },
          pending: { bg: '#fff3e0', color: '#ef6c00' },
        };
        
        return (
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: statusColors[row.status].bg,
              color: statusColors[row.status].color,
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Box>
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.createdAt}
        </Typography>
      ),
    },
  ];

  // Fetch data with pagination
  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      const mockTotalItems = 247; // Total number of items
      const newData = generateMockData(page, size);
      
      setData(newData);
      setTotalItems(mockTotalItems);
      setTotalPages(Math.ceil(mockTotalItems / size));
      setLoading(false);
    }, 300);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Fetch data when page or pageSize changes
  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Modern Pagination Example
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This example demonstrates the new modern pagination system with responsive design, 
        page size selection, and intuitive navigation controls.
      </Typography>

      <Paper sx={{ overflow: 'hidden' }}>
        <CommonTable
          data={data}
          columns={columns}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          // Optional pagination customization
          pageSizeOptions={[5, 10, 25, 50]}
          showPageSizeSelector={true}
          showTotalItems={true}
          showPageNumbers={true}
          maxPageNumbers={7}
          // Other props
          loading={loading}
          containerHeight="auto"
          stickyHeader={true}
          onRowClick={(row) => {
            alert(`Clicked on ${row.name}`);
          }}
        />
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Features Demonstrated:
        </Typography>
        <ul>
          <li>Modern, responsive pagination UI</li>
          <li>Page size selector (5, 10, 25, 50 items per page)</li>
          <li>Total items counter</li>
          <li>First/Last page navigation</li>
          <li>Previous/Next page buttons</li>
          <li>Page number navigation with smart truncation</li>
          <li>Mobile-friendly design</li>
          <li>Loading states</li>
          <li>Clickable table rows</li>
        </ul>
      </Box>
    </Box>
  );
};

export default PaginationExample; 