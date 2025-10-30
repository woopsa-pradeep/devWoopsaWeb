import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalItems?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  disabled?: boolean;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showTotalItems = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  disabled = false,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPageNumbers = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfMax = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - halfMax);
    const end = Math.min(totalPages, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    const pages = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled && !loading) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    onPageSizeChange(newPageSize);
  };

  const getStartItem = () => (currentPage - 1) * pageSize + 1;
  const getEndItem = () => Math.min(currentPage * pageSize, totalItems);

  const buttonStyle = {
    minWidth: 32,
    height: 32,
    borderRadius: '16px',
    border: `1px solid ${theme.palette.divider}`,
    // color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.main,
      // color: theme.palette.primary.main,
    },
    '&:disabled': {
      // backgroundColor: theme.palette.action.disabled,
      // color: theme.palette.action.disabled,
      borderColor: theme.palette.divider,
    },
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    // color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
      color: 'white',
      // color: theme.palette.primary.contrastText,
    },
  };

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 2, sm: 1 },
        pt: 1.5,
        pb: 0.5,
        // backgroundColor: theme.palette.background,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderRadius: '0 0 8px 8px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 2 },
          order: { xs: 2, sm: 1 },
        }}
      >
        {showPageSizeSelector && (
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={disabled || loading}
            size="small"
            sx={{
              minWidth: 60,
              height: 32,
              fontSize: '12px',
              '& .MuiSelect-select': {
                py: 0.5,
                pl: 1,
                }
            }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option} sx={{ fontSize: '12px' }}>
                {option}
              </MenuItem>
            ))}
          </Select>
        )}

        {showTotalItems && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '12px',
            }}
          >
            Showing <span style={{fontWeight: 400, color: theme.palette.primary.main}}>{getStartItem()}-{getEndItem()}</span> of <span style={{fontWeight: 400, color: theme.palette.primary.main }}>{totalItems}</span> items
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          order: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', sm: 'flex-end' },
        }}
      >
        <Tooltip title="First page">
          <IconButton
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || disabled || loading}
            sx={buttonStyle}
            size="small"
          >
            <FirstPage fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Previous page">
          <IconButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled || loading}
            sx={buttonStyle}
            size="small"
          >
            <NavigateBefore fontSize="small" />
          </IconButton>
        </Tooltip>

        {showPageNumbers && !isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <Typography key={`ellipsis-${index}`} color="text.secondary" sx={{ px: 1, fontSize: '12px' }}>
                  ...
                </Typography>
              ) : (
                <Tooltip key={page} title={`Page ${page}`}>
                  <IconButton
                    onClick={() => handlePageChange(page as number)}
                    disabled={disabled || loading}
                    sx={page === currentPage ? activeButtonStyle : buttonStyle}
                    size="small"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: page === currentPage ? 600 : 400,
                        fontSize: '12px',
                      }}
                    >
                      {page}
                    </Typography>
                  </IconButton>
                </Tooltip>
              )
            ))}
          </Box>
        )}

        {showPageNumbers && isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 16,
              backgroundColor: theme.palette.action.hover,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              Page {currentPage} of {totalPages}
            </Typography>
          </Box>
        )}

        <Tooltip title="Next page">
          <IconButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled || loading}
            sx={buttonStyle}
            size="small"
          >
            <NavigateNext fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Last page">
          <IconButton
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || disabled || loading}
            sx={buttonStyle}
            size="small"
          >
            <LastPage fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Pagination;