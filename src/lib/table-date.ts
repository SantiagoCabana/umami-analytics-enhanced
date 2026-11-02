type DateFormatter = (value: string, pattern: string) => string;

export function formatTableDate(
  value: string | null | undefined,
  format: DateFormatter,
  todayLabel?: string,
  now = new Date(),
) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';

  if (todayLabel && format(value, 'yyyy-MM-dd') === format(now.toISOString(), 'yyyy-MM-dd')) {
    return `${todayLabel} - ${format(value, 'HH:mm')}`;
  }

  return format(value, 'dd-MM-yyyy');
}
