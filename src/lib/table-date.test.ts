import { formatInTimeZone } from 'date-fns-tz';
import { expect, test } from 'vitest';
import { formatTableDate } from './table-date';

const now = new Date('2026-11-03T00:30:00Z');
const formatter = (zone: string) => (date: string, pattern: string) =>
  formatInTimeZone(date, zone, pattern);

test.each(['Hoy', 'Today'])('uses the translated today label %s and local time', label => {
  expect(formatTableDate('2026-11-02T23:42:00Z', formatter('America/Lima'), label, now)).toBe(
    `${label} - 18:42`,
  );
});

test('compares calendar days in the configured timezone', () => {
  expect(formatTableDate('2026-11-02T23:42:00Z', formatter('UTC'), 'Today', now)).toBe(
    '02-11-2026',
  );
});

test('creation always shows only the date', () => {
  expect(formatTableDate(now.toISOString(), formatter('UTC'), undefined, now)).toBe('03-11-2026');
});

test.each([null, undefined, '', 'invalid'])('handles missing or invalid date %s', value => {
  expect(formatTableDate(value, formatter('UTC'), 'Today', now)).toBe('—');
});

test.each(['2025-11-03T00:30:00Z', '2026-12-03T00:30:00Z'])(
  'shows other dates without hours: %s',
  value => {
    expect(formatTableDate(value, formatter('UTC'), 'Today', now)).toBe(
      formatInTimeZone(value, 'UTC', 'dd-MM-yyyy'),
    );
  },
);
