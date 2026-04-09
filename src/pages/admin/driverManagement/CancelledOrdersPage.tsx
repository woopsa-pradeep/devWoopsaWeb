import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CommonTable, { TableColumn } from "../../../component/atoms/Table/CommonTable";
import CommonModal from "../../../component/atoms/CommonModal";
import { getCancelledStops, postCancelStop } from "../../../redux/apis/distrubutor/driverManagementApis";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";

/** Matches GET `/distrubutor/cancelled-stops` → `data.stops[]` */
type CancelledStopVehicle = {
  id?: number;
  description?: string;
  truckType?: string;
  licenseRegistrationNumber?: string;
  vinNumber?: string;
};

type CancelledStopDriver = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  driverLicenseNo?: string;
};

type CancelledStopRoute = {
  id?: number;
  routeNumber?: string;
  day?: string;
  routeStatus?: string;
  vehicle?: CancelledStopVehicle;
  driver?: CancelledStopDriver;
};

type CancelledStopCustomer = {
  C_Name?: string;
  C_Number?: number;
  C_Address?: string;
  C_City?: string;
  C_State?: string;
  C_Zip?: string;
  C_Phone?: string;
};

type CancelledStop = {
  id: number;
  day?: string;
  routeName?: string;
  notes?: string | null;
  orderNumber: number;
  stopSequence?: number;
  routeId?: number;
  totalKilometers?: string;
  status?: string;
  cancelledReason?: string | null;
  C_Number?: number;
  latitude?: string;
  longitude?: string;
  isLastStop?: boolean;
  routeStarted?: boolean;
  createdAt?: string;
  route?: CancelledStopRoute;
  customer?: CancelledStopCustomer;
};

type ApiListPayload = {
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  stops?: CancelledStop[];
};

function parseListResponse(res: { data?: unknown }): {
  stops: CancelledStop[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const root = res.data as { data?: ApiListPayload } | undefined;
  const d = root?.data;
  if (!d) {
    return { stops: [], totalCount: 0, page: 1, limit: 10, totalPages: 1 };
  }
  return {
    stops: Array.isArray(d.stops) ? d.stops : [],
    totalCount: d.totalCount ?? 0,
    page: d.page ?? 1,
    limit: d.limit ?? 10,
    totalPages: d.totalPages ?? 1,
  };
}

type CancelledOrderTableRow = {
  rowKey: string;
  stop: CancelledStop;
};

function toTableRow(stop: CancelledStop, idx: number): CancelledOrderTableRow {
  const rowKey = `${stop.id}-${stop.orderNumber ?? idx}`;
  return { rowKey, stop };
}

/** Detail modal only — compact; does not alter CommonTable */
const detailTextSx = { fontSize: 11, fontWeight: 500, lineHeight: 1.35 } as const;
const detailLabelSx = { ...detailTextSx, color: "text.secondary", minWidth: 96, flexShrink: 0 } as const;

function DetailLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75, py: 0.15, alignItems: "flex-start" }}>
      <Typography component="span" sx={detailLabelSx}>
        {label}
      </Typography>
      <Typography component="span" sx={detailTextSx}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 500,
        color: "text.secondary",
        letterSpacing: 0.45,
        mt: 0.85,
        mb: 0.35,
      }}
    >
      {children}
    </Typography>
  );
}

function StopDetailContent({ stop }: { stop: CancelledStop }) {
  const r = stop.route;
  const v = r?.vehicle;
  const d = r?.driver;
  const c = stop.customer;

  return (
    <Box sx={{ "& p": { m: 0 }, pr: 0.25 }}>
      {/* <Typography sx={{ fontSize: 13, fontWeight: 500, color: "primary.main", mb: 0.65, lineHeight: 1.25 }}>
        Order {stop.orderNumber}
      </Typography> */}
      <SectionTitle>Stop</SectionTitle>
      <DetailLine label="Stop" value={stop.stopSequence} />
      <DetailLine label="Order #" value={stop.orderNumber} />
      <DetailLine label="Day" value={stop.day} />
      <DetailLine label="Route" value={stop.routeName ?? r?.routeNumber} />
      <DetailLine label="Status" value={stop.status} />
      <DetailLine label="Distance (km)" value={stop.totalKilometers} />
      <DetailLine label="Notes" value={stop.notes || "—"} />

      <Divider sx={{ my: 0.65 }} />

      <SectionTitle>Vehicle</SectionTitle>
      <DetailLine label="Description" value={v?.description} />
      <DetailLine label="Type" value={v?.truckType} />
      <DetailLine label="License" value={v?.licenseRegistrationNumber} />
      <DetailLine label="VIN" value={v?.vinNumber} />

      <Divider sx={{ my: 0.65 }} />

      <SectionTitle>Driver</SectionTitle>
      <DetailLine
        label="Name"
        value={d ? [d.firstName, d.lastName].filter(Boolean).join(" ") : undefined}
      />
      <DetailLine label="Phone" value={d?.phoneNumber} />
      <DetailLine label="Email" value={d?.email} />
      <DetailLine label="License" value={d?.driverLicenseNo} />

      <Divider sx={{ my: 1 }} />

      <SectionTitle>Customer</SectionTitle>
      <DetailLine label="Name" value={c?.C_Name} />
      <DetailLine label="Acct #" value={c?.C_Number} />
      <DetailLine label="Address" value={c?.C_Address} />
      <DetailLine
        label="City / ST / Zip"
        value={[c?.C_City, c?.C_State, c?.C_Zip].filter(Boolean).join(", ") || undefined}
      />
      <DetailLine label="Phone" value={c?.C_Phone} />

      <Divider sx={{ my: 0.65 }} />

      <SectionTitle>Location</SectionTitle>
      <DetailLine label="Latitude" value={stop.latitude} />
      <DetailLine label="Longitude" value={stop.longitude} />
    </Box>
  );
}

const CancelledOrdersPage: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [stops, setStops] = useState<CancelledStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [detailStop, setDetailStop] = useState<CancelledStop | null>(null);
  const [confirmRedeliverRow, setConfirmRedeliverRow] = useState<CancelledOrderTableRow | null>(null);

  const tableData = useMemo(() => stops.map((s, i) => toTableRow(s, i)), [stops]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCancelledStops({ page, limit: pageSize });
      const parsed = parseListResponse(res);
      setStops(parsed.stops);
      setTotalItems(parsed.totalCount);
      setTotalPages(Math.max(1, parsed.totalPages));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      showErrorToast(err?.response?.data?.message || err?.message || "Failed to load cancelled orders.");
      setStops([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRedeliver = async (row: CancelledOrderTableRow): Promise<boolean> => {
    const stopId = row.stop.id;
    const orderNumber = row.stop.orderNumber;
    if (stopId == null) {
      showErrorToast("Missing stop id for this order.");
      return false;
    }
    if (orderNumber == null) {
      showErrorToast("Missing order number.");
      return false;
    }
    const key = `${stopId}-${orderNumber}`;
    setSubmittingKey(key);
    try {
      await postCancelStop(stopId, { allowReDeliver: true, orderNumber });
      showSuccessToast("Re-delivery requested.");
      await load();
      return true;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      showErrorToast(err?.response?.data?.message || err?.message || "Re-delivery failed.");
      return false;
    } finally {
      setSubmittingKey(null);
    }
  };

  const handleConfirmRedeliver = async () => {
    if (!confirmRedeliverRow) return;
    const ok = await onRedeliver(confirmRedeliverRow);
    if (ok) setConfirmRedeliverRow(null);
  };

  const columns: TableColumn<CancelledOrderTableRow>[] = [
    {
      id: "stopSequence",
      label: "Stop",
      minWidth: 56,
      render: (row) => (row.stop.stopSequence != null ? String(row.stop.stopSequence) : "—"),
    },
    {
      id: "orderNumber",
      label: "Order #",
      minWidth: 88,
      render: (row) => String(row.stop.orderNumber ?? "—"),
    },
    {
      id: "routeName",
      label: "Route",
      minWidth: 140,
      render: (row) => row.stop.routeName ?? row.stop.route?.routeNumber ?? "—",
    },
    {
      id: "day",
      label: "Day",
      minWidth: 100,
      render: (row) => row.stop.day ?? "—",
    },
    {
      id: "customer",
      label: "Customer",
      minWidth: 160,
      render: (row) => row.stop.customer?.C_Name ?? "—",
    },
    {
      id: "status",
      label: "Status",
      minWidth: 88,
      render: (row) => row.stop.status ?? "—",
    },
    {
      id: "stopId",
      label: "Stop ID",
      minWidth: 72,
      render: (row) => String(row.stop.id),
    },
    {
      id: "actions",
      label: "Action",
      align: "right",
      minWidth: 120,
      render: (row) => {
        const key = `${row.stop.id}-${row.stop.orderNumber}`;
        const busy = submittingKey === key;
        const redeliverDisabled = busy || row.stop.id == null || row.stop.orderNumber == null;
        return (
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.25 }}>
            <Tooltip title="View order details" enterDelay={400}>
              <IconButton
                size="small"
                aria-label="View order details"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailStop(row.stop);
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Request re-delivery for this stop" enterDelay={400}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Re-deliver"
                  color="primary"
                  disabled={redeliverDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmRedeliverRow(row);
                  }}
                >
                  {busy ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <LocalShippingOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Paper sx={{ borderRadius: 2, boxShadow: "none", overflow: "hidden" }}>
        <CommonTable<CancelledOrderTableRow>
          data={tableData}
          columns={columns}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          loading={loading}
          isPagination
          showPageSizeSelector
          showTotalItems
          showPageNumbers
          containerHeight={isMobile ? "420px" : "calc(100vh - 280px)"}
          padding={"0px 16px 16px"}
          emptyStateComponent={<Typography color="text.secondary">No cancelled orders.</Typography>}
        />
      </Paper>

      <CommonModal
        open={detailStop != null}
        onClose={() => setDetailStop(null)}
        size="md"
        dense
        maxWidth={520}
        title={`Order ${detailStop?.orderNumber}`}
      >
        {detailStop && <StopDetailContent stop={detailStop} />}
      </CommonModal>

      <CommonModal
        open={confirmRedeliverRow != null}
        onClose={() => setConfirmRedeliverRow(null)}
        size="sm"
        dense
        title="Confirm re-delivery"
      >
        {confirmRedeliverRow && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13, fontWeight: 500 }}>
              Request re-delivery for order{" "}
              <Box component="span" sx={{ color: "text.primary", fontWeight: 500 }}>
                #{confirmRedeliverRow.stop.orderNumber}
              </Box>{" "}
              (stop ID{" "}
              <Box component="span" sx={{ color: "text.primary", fontWeight: 500 }}>
                {confirmRedeliverRow.stop.id}
              </Box>
              )? This will submit a re-delivery with &quot;allow re-deliver&quot; enabled.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" size="small" onClick={() => setConfirmRedeliverRow(null)} sx={{ textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => void handleConfirmRedeliver()}
                disabled={
                  submittingKey === `${confirmRedeliverRow.stop.id}-${confirmRedeliverRow.stop.orderNumber}`
                }
                sx={{ textTransform: "none", minWidth: 100, color: "white" }}
              >
                {submittingKey === `${confirmRedeliverRow.stop.id}-${confirmRedeliverRow.stop.orderNumber}` ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </Box>
          </Box>
        )}
      </CommonModal>
    </Box>
  );
};

export default CancelledOrdersPage;
