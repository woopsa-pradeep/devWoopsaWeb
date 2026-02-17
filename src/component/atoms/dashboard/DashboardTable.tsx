import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  useTheme,
  alpha,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import LoadingSpinner from "../loader/LoadingSpinner";
import Pagination from "../Pagination";

export interface TableColumn<T = any> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  minWidth?: number;
  maxWidth?: number;
  render?: (row: T, rowIdx: number) => React.ReactNode;
  sortable?: boolean;
}

export interface DashboardTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
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
  stickyHeader?: boolean;
  stickyLastColumn?: boolean;
  loading?: boolean;
  containerHeight?: string | number;
  emptyStateComponent?: React.ReactNode;
  padding?: number | string;
  isPagination?: boolean;
  sortField?: string | null;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

function DashboardTable<T>({
  data,
  columns,
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
  stickyHeader = true,
  stickyLastColumn = false,
  loading = false,
  containerHeight = "auto",
  emptyStateComponent = "No data",
  padding = 0,
  isPagination = true,
  sortField = null,
  sortDirection = "asc",
  onSort,
}: DashboardTableProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const headerBg = isDark
    ? alpha(theme.palette.primary.main, 0.85)
    : theme.palette.primary.main;
  const headerColor = "#fff";
  const rowHover = isDark
    ? alpha(theme.palette.action.hover, 0.08)
    : alpha(theme.palette.primary.main, 0.04);
  const isColumnSticky = (columnIndex: number) =>
    stickyLastColumn && columnIndex === columns.length - 1;

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        ...(padding ? { p: padding } : {}),
      }}
    >
      <TableContainer
        sx={{
          height: containerHeight,
          overflow: "auto",
          "& .MuiTableCell-root": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          // "&::-webkit-scrollbar": { width: 8, height: 8 },
          // "&::-webkit-scrollbar-track": {
          //   background: alpha(theme.palette.divider, 0.1),
          //   borderRadius: 4,
          // },
          // "&::-webkit-scrollbar-thumb": {
          //   background: alpha(theme.palette.primary.main, 0.3),
          //   borderRadius: 4,
          //   "&:hover": { background: alpha(theme.palette.primary.main, 0.5) },
          // },
        }}
      >
        <Table stickyHeader={stickyHeader} size="small">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.id}
                  align={column.align ?? "left"}
                  onClick={() => column.sortable && onSort?.(column.id)}
                  sx={{
                    backgroundColor: headerBg,
                    color: headerColor,
                    fontWeight: 500,
                    fontSize: 11,
                    py: 1,
                    px: 1.25,
                    borderBottom: "none",
                    whiteSpace: "nowrap",
                    cursor: column.sortable ? "pointer" : "default",
                    userSelect: "none",
                    ...(isColumnSticky(index)
                      ? {
                          position: "sticky",
                          right: 0,
                          zIndex: 3,
                          backgroundColor: headerBg,
                          boxShadow: isDark ? "-4px 0 8px rgba(0,0,0,0.2)" : "-2px 0 6px rgba(0,0,0,0.06)",
                        }
                      : {}),
                  }}
                >
                  <Box display="flex" alignItems="center" gap={0.25} sx={{ justifyContent: column.align === "right" ? "flex-end" : column.align === "center" ? "center" : "flex-start", color: "#fff" }}>
                    <span>{column.label}</span>
                    {column.sortable && onSort && (
                      <Box display="flex" flexDirection="column" sx={{ ml: 0.25, color: "#fff" }}>
                        <ArrowUpward sx={{ fontSize: 12, opacity: sortField === column.id && sortDirection === "asc" ? 1 : 0.4, color: "inherit" }} />
                        <ArrowDownward sx={{ fontSize: 12, mt: -0.75, opacity: sortField === column.id && sortDirection === "desc" ? 1 : 0.4, color: "inherit" }} />
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
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{
                    border: "none",
                    py: 4,
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  <LoadingSpinner message="Loading..." fullScreen={false} />
                </TableCell>
              </TableRow>
            ) : data?.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: rowHover,
                    },
                    "&:last-child td": { borderBottom: "none" },
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={column.id}
                      align={column.align ?? "left"}
                      sx={{
                        fontSize: 12,
                        py: 0.75,
                        px: 1.25,
                        borderBottom: "none",
                        color: theme.palette.text.primary,
                        ...(isColumnSticky(colIndex)
                          ? {
                              position: "sticky",
                              right: 0,
                              zIndex: 2,
                              backgroundColor: theme.palette.background.paper,
                              boxShadow: isDark ? "-4px 0 8px rgba(0,0,0,0.15)" : "-2px 0 6px rgba(0,0,0,0.04)",
                            }
                          : {}),
                      }}
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : (row as Record<string, unknown>)[column.id] as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{
                    py: 3,
                    color: theme.palette.text.secondary,
                    fontSize: 12,
                    borderBottom: "none",
                  }}
                >
                  {emptyStateComponent}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {isPagination && (showPageNumbers || showPageSizeSelector || showTotalItems) && (
        <Box>
          <Pagination
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
          />
        </Box>
      )}
    </Box>
  );
}

export default DashboardTable;
