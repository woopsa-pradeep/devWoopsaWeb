import dayjs from 'dayjs';

/**
 * Format a date string from the API (e.g. 2025-12-01T00:00:00.000Z) as MM/DD/YYYY
 * without timezone conversion, so the displayed date matches the API date exactly.
 * Backend sends UTC midnight; using new Date().toLocaleDateString() or dayjs().format()
 * would shift the date in local timezones (e.g. one day back in US). This uses only
 * the date part (YYYY-MM-DD) and reformats it, so 12/24/2015 from API shows as 12/24/2015.
 */
export function formatApiDate(apiDateStr: string | null | undefined): string {
  if (apiDateStr == null || apiDateStr === '') return '';
  const s = String(apiDateStr).trim();
  const datePart = s.includes('T') ? s.split('T')[0]! : s.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return apiDateStr;
  const d = dayjs(datePart, 'YYYY-MM-DD', true);
  return d.isValid() ? d.format('MM/DD/YYYY') : apiDateStr;
}

/** Calendar date from API as MM/DD/YYYY, or "—" when empty (same rules as `formatApiDate`). */
export function formatApiDateMMDDYYYYDisplay(apiDateStr: string | null | undefined): string {
  const r = formatApiDate(apiDateStr);
  return r === '' ? '—' : r;
}

/** Full ISO timestamps from API → MM/DD/YYYY h:mm A (local time, parsed from the same string the API returns). */
export function formatApiDateTimeMMDDYYYY(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const s = String(iso).trim();
  const d = dayjs(s);
  if (!d.isValid()) return s;
  return d.format('MM/DD/YYYY h:mm A');
}

/**
 * Plain `YYYY-MM-DD` uses calendar MM/DD/YYYY without timezone shift (via `formatApiDate`).
 * Values with a time component (ISO `T…`) use `MM/DD/YYYY h:mm A`.
 */
export function formatFullDetailsDateField(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return formatApiDateMMDDYYYYDisplay(s);
  }
  if (s.includes('T') || /^\d{4}-\d{2}-\d{2}\s+\d/.test(s)) {
    return formatApiDateTimeMMDDYYYY(s);
  }
  return formatApiDateMMDDYYYYDisplay(s);
}
