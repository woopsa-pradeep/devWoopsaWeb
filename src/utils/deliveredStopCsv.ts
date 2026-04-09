import type { StopFullDetailsPayload, StopFullDetailsPOD, StopFullDetailsStop, StopFullDetailsCustomer } from "../redux/apis/distrubutor/routeViewApis";
import {
  formatApiDateTimeMMDDYYYY,
  formatFullDetailsDateField,
} from "./formatApiDate";

function cell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function headersForMaxPhotos(maxPhotos: number): string[] {
  const photoCols = Array.from({ length: maxPhotos }, (_, i) => `delivery_photo_${i + 1}_url`);
  return [
    "route_name",
    "service_day",
    "stop_sequence",
    "order_number",
    "customer_number",
    "delivery_status",
    "route_started",
    "last_stop",
    "distance_km",
    "invoice_amount",
    "invoice_url",
    "stop_notes",
    "arrived_at",
    "delivered_at",
    "gps_stop_lat",
    "gps_stop_lng",
    "approach_lat",
    "approach_lng",
    "depart_lat",
    "depart_lng",
    "reschedule_active",
    "reschedule_date",
    "reschedule_time",
    "reschedule_reason",
    "reschedule_notes",
    "customer_name",
    "customer_address",
    "customer_zip",
    "customer_phone",
    "customer_email",
    "pod_amount",
    "payment_terms",
    "payment_terms_complete",
    "post_delivery_complete",
    "bundles_scanned",
    "bundles_expected",
    "all_bundles_scanned",
    "paid_by_check",
    "check_number",
    "signed_by",
    "captured_at",
    "pod_invoice_amount",
    "pod_invoice_message",
    "pod_driver_notes",
    "barcode_box_count",
    "barcode_scan_count",
    "signature_url",
    "check_front_url",
    "check_additional_url",
    ...photoCols,
  ];
}

function rowCells(
  stop: StopFullDetailsStop,
  customer: StopFullDetailsCustomer,
  pod: StopFullDetailsPOD | null,
  maxPhotos: number
): string[] {
  const photos = pod?.photos && Array.isArray(pod.photos) ? pod.photos : [];
  const photoCells = Array.from({ length: maxPhotos }, (_, i) => cell(photos[i] ?? ""));

  return [
    cell(stop.routeName),
    cell(stop.day),
    cell(stop.stopSequence),
    cell(stop.orderNumber),
    cell(stop.C_Number),
    cell(stop.status),
    cell(stop.routeStarted),
    cell(stop.isLastStop),
    cell(stop.totalKilometers),
    cell(stop.invoiceAmount),
    cell(stop.invoiceUrl),
    cell(stop.notes),
    cell(formatApiDateTimeMMDDYYYY(stop.arrivedAt)),
    cell(formatApiDateTimeMMDDYYYY(stop.deliveredAt)),
    cell(stop.latitude),
    cell(stop.longitude),
    cell(stop.startLatitude),
    cell(stop.startLongitude),
    cell(stop.endLatitude),
    cell(stop.endLongitude),
    cell(stop.reSchedule),
    cell(formatFullDetailsDateField(stop.reScheduleDate)),
    cell(stop.reScheduleTime),
    cell(stop.reScheduleReason),
    cell(stop.reScheduleNotes),
    cell(customer.C_Name),
    cell(customer.address),
    cell(customer.zip),
    cell(customer.phone),
    cell(customer.email),
    cell(pod?.amount),
    cell(pod?.paymentTerms),
    cell(pod?.paymentTermComplete),
    cell(pod?.postDeliveryCompleted),
    cell(pod?.scannedBundles),
    cell(pod?.expectedBundles),
    cell(pod?.allBundlesScanned),
    cell(pod?.paymentInCheck),
    cell(pod?.checkNumber),
    cell(pod?.signBy),
    cell(formatApiDateTimeMMDDYYYY(pod?.podAt ?? null)),
    cell(pod?.invoiceAmount),
    cell(pod?.invoiceMessage),
    cell(pod?.notes),
    cell(pod != null && Array.isArray(pod.boxBarCode) ? pod.boxBarCode.length : ""),
    cell(pod != null && Array.isArray(pod.scanBarCode) ? pod.scanBarCode.length : ""),
    cell(pod?.customerSignature),
    cell(pod?.checkImage),
    cell(pod?.checkImage1),
    ...photoCells,
  ];
}

/** Flat CSV: one row per POD; no section titles — only column keys + data. Attachment columns are direct URLs. */
export function downloadDeliveredStopCsv(data: StopFullDetailsPayload): void {
  const { stop, customer, deliveryPODs } = data;
  const pods: Array<StopFullDetailsPOD | null> =
    Array.isArray(deliveryPODs) && deliveryPODs.length > 0 ? deliveryPODs : [null];

  const maxPhotos = Math.max(0, ...pods.map((p) => (p?.photos?.length ? p.photos.length : 0)));

  const lines: string[] = [headersForMaxPhotos(maxPhotos).join(",")];

  for (const pod of pods) {
    lines.push(rowCells(stop, customer, pod, maxPhotos).join(","));
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeRoute = String(stop.routeName ?? "route").replace(/[^\w.-]+/g, "_");
  a.href = url;
  a.download = `Delivery-${safeRoute}-order-${stop.orderNumber}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** One CSV for the whole route: same columns as single-stop export; one row per POD across all stops. */
export function downloadRouteFullStopsCsv(stops: StopFullDetailsPayload[]): void {
  if (!stops.length) return;

  const rows: Array<{ stop: StopFullDetailsStop; customer: StopFullDetailsCustomer; pod: StopFullDetailsPOD | null }> = [];
  for (const data of stops) {
    const pods: Array<StopFullDetailsPOD | null> =
      Array.isArray(data.deliveryPODs) && data.deliveryPODs.length > 0 ? data.deliveryPODs : [null];
    for (const pod of pods) {
      rows.push({ stop: data.stop, customer: data.customer, pod });
    }
  }

  const maxPhotos = Math.max(0, ...rows.map((r) => (r.pod?.photos?.length ? r.pod.photos.length : 0)));

  const lines: string[] = [headersForMaxPhotos(maxPhotos).join(",")];
  for (const r of rows) {
    lines.push(rowCells(r.stop, r.customer, r.pod, maxPhotos).join(","));
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const first = stops[0].stop;
  const safeRoute = String(first.routeName ?? "route").replace(/[^\w.-]+/g, "_");
  a.href = url;
  a.download = `Delivery-${safeRoute}-route-all-stops.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
