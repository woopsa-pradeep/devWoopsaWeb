import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Switch,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
// import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CustomButton from "../../../component/atoms/CustomButton";
import DeleteConfirmationModal from "../../../component/atoms/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";
import { getTradeShowList, deactivateTradeShow } from "../../../redux/apis/distrubutor/tradeShowApis";
import { useAppDispatch } from "../../../redux/store";
import { clearCurrentTradeShow } from "../../../redux/slices/tradeShowSlice";
import { clearTradeshowDraft } from "./CreateTradeshow";
import dayjs from "dayjs";
import toast from "react-hot-toast";

interface TradeShow {
  id: string | number;
  name: string;
  tradeShowDate: string;
  deliveryStartDate: string;
  deliveryEndDate: string;
  deliveryWeeks: number;
  status: "active" | "past" | string;
}

const TradeshowManagement: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [tradeshows, setTradeshows] = useState<TradeShow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [deactivatingId, setDeactivatingId] = useState<string | number | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [tradeShowToDeactivate, setTradeShowToDeactivate] = useState<TradeShow | null>(null);

  const fetchTradeshows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getTradeShowList({
        page,
        limit: rowsPerPage,
      });
      // API response shape:
      // { success, message, data: { data: [...], total, page, limit, totalPages } }
      const apiData = res?.data ?? {};
      const apiList = apiData?.data ?? [];
      const list: TradeShow[] = apiList.map((item: any) => ({
        id: item.id ?? item.tradeShowId ?? item.name,
        name: item.name ?? "-",
        tradeShowDate: item.tradeShowDate ?? "",
        deliveryStartDate: item.deliveryStartDate ?? "",
        deliveryEndDate: item.deliveryEndDate ?? "",
        deliveryWeeks: item.deliveryWeeks ?? 0,
        status: (item.status ?? (item.isActive ? "active" : "inactive")) as TradeShow["status"],
      }));
      setTradeshows(list);
      setTotalCount(apiData?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch trade shows", err);
      setError("Failed to load tradeshows");
      setTradeshows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeshows();
  }, [page, rowsPerPage]);

  // Clear draft and Redux when opening TradeShow Management (sidebar tab or direct nav)
  useEffect(() => {
    clearTradeshowDraft();
    dispatch(clearCurrentTradeShow());
  }, [dispatch]);

  const handleCreateTradeshow = () => {
    clearTradeshowDraft();
    dispatch(clearCurrentTradeShow());
    navigate("/admin/tradeshow-management/create");
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const openDeactivateModal = (row: TradeShow) => {
    if (row.status !== "active") return;
    setTradeShowToDeactivate(row);
    setDeactivateModalOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!tradeShowToDeactivate) return;
    setDeactivatingId(tradeShowToDeactivate.id);
    try {
      await deactivateTradeShow(tradeShowToDeactivate.id);
      toast.success("Trade show deactivated.");
      setDeactivateModalOpen(false);
      setTradeShowToDeactivate(null);
      await fetchTradeshows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate trade show.");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 0.5, md: 1.5 },
        pt: { xs: 0.5, md: 1 },
        maxWidth: "1200px",
        mx: "auto",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Typography
          variant="subtitle1"
          fontWeight={500}
          sx={{ fontSize: 16 }}
        >
          Tradeshow Management
        </Typography>
        <CustomButton
          onClick={handleCreateTradeshow}
          fullWidth={false}
          sx={{ fontSize: 11, px: 1.25, py: 0.25, mt: 0, minHeight: 26 }}
        >
          Create Tradeshow
        </CustomButton>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 1.5 },
          borderRadius: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          height: "calc(100vh - 220px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flex={1}
            height="calc(100vh - 260px)"   
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" fontSize={12}>
            {error}
          </Typography>
        ) : tradeshows.length === 0 && !loading ? (
          <Typography fontSize={12} color="text.secondary">
            No tradeshows found.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  "& th, & td": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontSize: 12,
                    paddingY: 0.75,
                    paddingX: 1,
                  },
                  "& th": {
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Trade Show Date</TableCell>
                    <TableCell>Delivery Start</TableCell>
                    <TableCell>Delivery End</TableCell>
                    <TableCell>Delivery Weeks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradeshows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.tradeShowDate ? dayjs(row.tradeShowDate).format("MM/DD/YYYY") : "—"}</TableCell>
                      <TableCell>{row.deliveryStartDate ? dayjs(row.deliveryStartDate).format("MM/DD/YYYY") : "—"}</TableCell>
                      <TableCell>{row.deliveryEndDate ? dayjs(row.deliveryEndDate).format("MM/DD/YYYY") : "—"}</TableCell>
                      <TableCell>{row.deliveryWeeks ?? "—"}</TableCell>
                      <TableCell>
                        {String(row.status).toLowerCase() === "active" ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Switch
                              size="small"
                              checked
                              disabled={deactivatingId === row.id}
                              onChange={() => openDeactivateModal(row)}
                              color="primary"
                            />
                            <Typography component="span" fontSize={12} color="text.secondary">
                              Active
                            </Typography>
                          </Box>
                        ) : (
                          row.status ?? "—"
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/tradeshow-management/${row.id}/summary`)}
                          aria-label="View summary"
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                        {row.status !== "expire" && <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/tradeshow-management/${row.id}/edit`)}
                          aria-label="Edit tradeshow"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={totalCount}
              page={page - 1}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{
                flexShrink: 0,
                position: "sticky",
                bottom: 0,
                left: 0,
                right: 0,
                borderTop: 1,
                borderColor: "divider",
                backgroundColor: theme.palette.background.paper,
                fontSize: 12,
                zIndex: 1,
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  { fontSize: 12 },
              }}
            />
          </Box>
        )}
      </Paper>

      <DeleteConfirmationModal
        open={deactivateModalOpen}
        onClose={() => {
          setDeactivateModalOpen(false);
          setTradeShowToDeactivate(null);
        }}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Trade Show"
        message={`Are you sure you want to deactivate "${tradeShowToDeactivate?.name ?? "this trade show"}"?`}
        buttonText="Deactivate"
      />
    </Box>
  );
};

export default TradeshowManagement;

