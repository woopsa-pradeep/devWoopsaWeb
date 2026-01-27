import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  useTheme,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import Pagination from '../Pagination';
import LoadingSpinner from '../loader/LoadingSpinner';

export interface TableColumn<T = any> {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  maxWidth?: number;
  render?: (row: T, rowIdx: number) => React.ReactNode;
  sortable?: boolean;
}

interface CommonTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  // Optional pagination customization
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalItems?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  // Sticky column props
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  stickyFirstTwoColumns?: boolean;
  stickyFirstThreeColumns?: boolean;
  stickyLastTwoColumns?: boolean;
  stickyLastThreeColumns?: boolean;
  // Other props
  loading?: boolean;
  filterComponent?: React.ReactNode;
  containerHeight?: string | number;
  containerStyle?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  rowStyle?: React.CSSProperties;
  getRowStyle?: (row: T, rowIndex: number) => React.CSSProperties;
  cellStyle?: React.CSSProperties;
  onRowClick?: (row: T) => void;
  rowClassName?: string;
  cellClassName?: string;
  headerClassName?: string;
  stickyHeader?: boolean;
  emptyStateComponent?: React.ReactNode;
  padding?: number | string;
  isPagination?: boolean;
  // Sorting props
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const CommonTable = <T,>({
  data,
  columns,
  // Pagination props
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  // Optional pagination customization
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showTotalItems = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  // Sticky column props
  stickyFirstColumn = false,
  stickyLastColumn = false,
  stickyFirstTwoColumns = false,
  stickyFirstThreeColumns = false,
  stickyLastTwoColumns = false,
  stickyLastThreeColumns = false,
  // Other props
  loading = false,
  filterComponent,
  containerHeight = 'auto',
  containerStyle,
  tableStyle,
  headerStyle,
  rowStyle,
  getRowStyle,
  cellStyle,
  onRowClick,
  rowClassName,
  cellClassName,
  headerClassName,
  stickyHeader = true,
  emptyStateComponent,
  padding = 2,
  isPagination = true,
  // Sorting props
  sortField = null,
  sortDirection = 'asc',
  onSort,
}: CommonTableProps<T>) => {
  const theme = useTheme();

  // Function to determine if a column should be sticky
  const isColumnSticky = (columnIndex: number): boolean => {
    if (stickyFirstColumn && columnIndex === 0) return true;
    if (stickyLastColumn && columnIndex === columns.length - 1) return true;
    if (stickyFirstTwoColumns && (columnIndex === 0 || columnIndex === 1)) return true;
    if (stickyFirstThreeColumns && (columnIndex === 0 || columnIndex === 1 || columnIndex === 2)) return true;
    if (stickyLastTwoColumns && (columnIndex === columns.length - 1 || columnIndex === columns.length - 2)) return true;
    if (stickyLastThreeColumns && (columnIndex === columns.length - 1 || columnIndex === columns.length - 2 || columnIndex === columns.length - 3)) return true;
    return false;
  };

  // Function to get sticky positioning styles
  const getStickyStyles = (columnIndex: number, isHeader: boolean = false) => {
    if (!isColumnSticky(columnIndex)) return {};
    
    let left = 'auto';
    let right = 'auto';
    const zIndex = isHeader ? 3 : 2;

    if (stickyFirstColumn && columnIndex === 0) {
      left = '0px';
    } else if (stickyLastColumn && columnIndex === columns.length - 1) {
      right = '-1px';
    } else if (stickyFirstTwoColumns) {
      if (columnIndex === 0) {
        left = '0px';
      } else if (columnIndex === 1) {
        const firstColumnWidth = columns[0]?.minWidth || 80;
        left = `${firstColumnWidth}px`;
      }
    } else if (stickyFirstThreeColumns) {
      if (columnIndex === 0) {
        left = '0px';
      } else if (columnIndex === 1) {
        const firstColumnWidth = columns[0]?.minWidth || 80;
        left = `${firstColumnWidth}px`;
      } else if (columnIndex === 2) {
        const firstColumnWidth = columns[0]?.minWidth || 80;
        const secondColumnWidth = columns[1]?.minWidth || 80;
        left = `${firstColumnWidth + secondColumnWidth}px`;
      }
    } else if (stickyLastTwoColumns) {
      if (columnIndex === columns.length - 1) {
        right = '-1px';
      } else if (columnIndex === columns.length - 2) {
        const lastColumnWidth = columns[columns.length - 1]?.minWidth || 80;
        right = `${lastColumnWidth}px`;
      }
    } else if (stickyLastThreeColumns) {
      if (columnIndex === columns.length - 1) {
        right = '-1px';
      } else if (columnIndex === columns.length - 2) {
        const lastColumnWidth = columns[columns.length - 1]?.minWidth || 80;
        right = `${lastColumnWidth}px`;
      } else if (columnIndex === columns.length - 3) {
        const lastColumnWidth = columns[columns.length - 1]?.minWidth || 80;
        const secondLastColumnWidth = columns[columns.length - 2]?.minWidth || 80;
        right = `${lastColumnWidth + secondLastColumnWidth}px`;
      }
    }

    return {
      position: 'sticky' as const,
      left,
      right,
      zIndex,
      backgroundColor: isHeader ? theme.palette.primary.main : theme.palette.background.paper,
    };
  };

  return (
    <Box bgcolor={theme.palette.common.white} p={padding} borderRadius={2}>
      {filterComponent}
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          height: containerHeight,
          overflow: 'auto',
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          borderRadius: "0px",
          boxShadow: 'none',
          ...containerStyle,
        }}
      >
        <Table stickyHeader={stickyHeader} sx={tableStyle}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth ? `${column.maxWidth}px !important` : 'auto',
                    ...getStickyStyles(index, true),
                    ...headerStyle,
                    py: 1.5,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  className={headerClassName}
                  onClick={() => column.sortable && onSort && onSort(column.id)}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                      justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start',
                    }}
                  >
                    <span>{column.label}</span>
                    {column.sortable && (
                      <Box display="flex" flexDirection="column" sx={{ ml: 0.5 }}>
                        <ArrowUpward
                          sx={{
                            fontSize: 14,
                            opacity: sortField === column.id && sortDirection === 'asc' ? 1 : 0.3,
                            color: sortField === column.id && sortDirection === 'asc' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          }}
                        />
                        <ArrowDownward
                          sx={{
                            fontSize: 14,
                            mt: -1,
                            opacity: sortField === column.id && sortDirection === 'desc' ? 1 : 0.3,
                            color: sortField === column.id && sortDirection === 'desc' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ border: 'none', padding: '40px 0' }}>
                  <LoadingSpinner 
                    message="Loading data..." 
                    fullScreen={false}
                  />
                </TableCell>
              </TableRow>
            ) : data?.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow
                  hover
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    ...rowStyle,
                    ...(getRowStyle ? getRowStyle(row, rowIndex) : {}),
                  }}
                  className={rowClassName}
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sx={{
                        ...cellStyle,
                        padding: "10px",
                        ...getStickyStyles(columnIndex, false),
                      }}
                      className={cellClassName}
                    >
                      {column.render ? column.render(row, rowIndex) : (row as any)[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  {emptyStateComponent || 'No data available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Component */}
      {isPagination && <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showPageSizeSelector={showPageSizeSelector}
        showTotalItems={showTotalItems}
        showPageNumbers={showPageNumbers}
        maxPageNumbers={maxPageNumbers}
        disabled={loading}
        loading={loading}
      />}
    </Box>
  );
};

export default CommonTable;