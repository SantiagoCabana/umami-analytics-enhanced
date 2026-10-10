import { Text } from '@umami/react-zen';
import { formatDistanceStrict, formatDistanceToNow } from 'date-fns';
import { useLocale, useTimezone } from '@/components/hooks';
import { isInvalidDate } from '@/lib/date';

export function DateDistance({
  date,
  addSuffix = true,
  strict = false,
}: {
  date: Date;
  addSuffix?: boolean;
  strict?: boolean;
}) {
  const { formatTimezoneDate } = useTimezone();
  const { dateLocale } = useLocale();

  if (isInvalidDate(date)) {
    return null;
  }

  return (
    <Text title={formatTimezoneDate(date?.toISOString(), 'PPPpp')}>
      {strict
        ? formatDistanceStrict(date, new Date(), { locale: dateLocale })
        : formatDistanceToNow(date, { addSuffix, locale: dateLocale })}
    </Text>
  );
}
