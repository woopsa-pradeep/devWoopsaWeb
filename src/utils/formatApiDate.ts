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
