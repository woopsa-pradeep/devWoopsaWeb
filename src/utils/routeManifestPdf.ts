import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import rabbitLogo from "../assets/Rabbit.svg";

type ManifestStop = {
  stopSequence: number;
  customerName?: string | null;
  customerAddress?: string | null;
  invoiceNumber?: number | string | null;
  orderNumber?: number | string | null;
  phone?: string | null;
  note?: string | null;
};

type DriverManifest = {
  driverName: string;
  driverPhone?: string | null;
  vehicleLabel?: string | null;
  vehicleVin?: string | null;
  vehicleDescription?: string | null;
  dayLabel?: string | null;
  totalStops?: number;
  totalMiles?: number | string | null;
  totalDurationInMinutes?: number | null;
  estimatedTimeNote?: boolean;
  stops: ManifestStop[];
};

export type RouteManifestPayload = {
  title?: string;
  warehouse?: {
    start?: string | null;
    end?: string | null;
  };
  drivers: DriverManifest[];
};

function autoTableFn() {
  return (autoTable as any).default || (autoTable as any).autoTable || autoTable;
}

function text(v: unknown): string {
  if (v == null) return "-";
  const s = String(v).trim();
  return s || "-";
}

function formatDateMdY(value?: string | Date | null): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return text(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

async function loadRabbitLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(rabbitLogo);
    if (!res.ok) return null;
    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 42;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(svgUrl);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function openPdfInNewTab(doc: jsPDF, fileName: string) {
  const blobUrl = doc.output("bloburl");
  const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    doc.save(fileName);
  }
}

export async function openRouteManifestPdf(payload: RouteManifestPayload) {
  if (!payload.drivers.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const autoTable = autoTableFn();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 24;
  const right = pageW - 24;
  const usableW = right - left;
  const logoDataUrl = await loadRabbitLogoDataUrl();

  payload.drivers.forEach((d, idx) => {
    if (idx > 0) doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(text(payload.title ?? "Route Manifest"), left, 32);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated: ${formatDateMdY(new Date())}`, right, 32, { align: "right" });

    doc.setDrawColor(220, 224, 230);
    doc.line(left, 40, right, 40);

    const warehouseTop = 48;
    const warehouseTitleY = 61;
    const warehouseContentStartY = 76;
    const warehouseLineHeight = 10;
    const warehouseMaxW = usableW - 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const warehouseStartLines = doc.splitTextToSize(
      `Start: ${text(payload.warehouse?.start)}`,
      warehouseMaxW
    );
    const warehouseEndLines = doc.splitTextToSize(
      `End: ${text(payload.warehouse?.end)}`,
      warehouseMaxW
    );
    let warehouseContentEndY = warehouseContentStartY + warehouseStartLines.length * warehouseLineHeight;
    if (warehouseEndLines.length) {
      warehouseContentEndY += 2 + warehouseEndLines.length * warehouseLineHeight;
    }
    const warehouseHeight = warehouseContentEndY - warehouseTop + 8;

    doc.setFillColor(247, 249, 252);
    doc.roundedRect(left, warehouseTop, usableW, warehouseHeight, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Warehouse Details", left + 8, warehouseTitleY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    let warehouseY = warehouseContentStartY;
    doc.text(warehouseStartLines, left + 8, warehouseY);
    warehouseY += warehouseStartLines.length * warehouseLineHeight;
    if (warehouseEndLines.length) {
      warehouseY += 2;
      doc.text(warehouseEndLines, left + 8, warehouseY);
      warehouseY += warehouseEndLines.length * warehouseLineHeight;
    }

    const driverTop = warehouseTop + warehouseHeight + 6;

    doc.setFillColor(247, 249, 252);
    doc.roundedRect(left, driverTop, usableW, 54, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Driver Details", left + 8, driverTop + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Driver: ${text(d.driverName)}`, left + 8, driverTop + 26);
    doc.text(`Phone: ${text(d.driverPhone)}`, left + 200, driverTop + 26);
    doc.text(`Vehicle: ${text(d.vehicleLabel)}`, left + 340, driverTop + 26);
    doc.text(`Date: ${formatDateMdY(d.dayLabel ?? null)}`, left + 8, driverTop + 40);
    doc.text(`Stops: ${text(d.stops.length)}`, left + 200, driverTop + 40);
    const hasMetrics = d.totalMiles != null && d.totalDurationInMinutes != null;
    if (hasMetrics) {
      const h = Math.floor(Number(d.totalDurationInMinutes) / 60);
      const m = Math.round(Number(d.totalDurationInMinutes) % 60);
      const durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;
      doc.text(`Miles: ${text(d.totalMiles)}`, left + 340, driverTop + 40);
      doc.text(`Time: ${durationText}`, left + 450, driverTop + 40);
      if (d.estimatedTimeNote) {
        doc.setFont("helvetica", "italic");
        doc.text("Note: this time is estimated", left + 555, driverTop + 40);
        doc.setFont("helvetica", "normal");
      }
    }
    if (d.vehicleDescription) {
      doc.text(`Vehicle detail: ${text(d.vehicleDescription)}`, left + 8, driverTop + 52);
    }

    const driverSectionBottomY = driverTop + 62;
    doc.line(left, driverSectionBottomY, right, driverSectionBottomY);

    const rows = d.stops
      .slice()
      .sort((a, b) => Number(a.stopSequence) - Number(b.stopSequence))
      .map((s) => [
        text(s.stopSequence),
        `${text(s.customerName)}\n${text(s.customerAddress)}\nPhone: ${text(s.phone)}\nInvoice: ${text(s.invoiceNumber)}   Order: ${text(s.orderNumber)}`,
        s.note && String(s.note).trim() ? String(s.note).trim() : "",
      ]);

    autoTable(doc, {
      startY: driverSectionBottomY + 8,
      head: [["STOP", "DELIVERY", "NOTE", "RECIPIENT"]],
      body: rows,
      margin: { left, right: 24, bottom: 26 },
      tableWidth: usableW,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: [30, 136, 229], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 36, halign: "center" },
        1: { cellWidth: 400 },
        2: { cellWidth: 300, halign: "center" },
        3: { cellWidth: 57, halign: "center" },
      },
    });

    const footerY = pageH - 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const footerText = "Report Generated by Woopsa";
    doc.text(footerText, left, footerY);
    if (logoDataUrl) {
      const tw = doc.getTextWidth(footerText);
      doc.addImage(logoDataUrl, "PNG", left + tw + 3, footerY - 8, 10, 10);
    }
  });

  openPdfInNewTab(doc, `route-manifest-${new Date().toISOString().slice(0, 10)}.pdf`);
}
