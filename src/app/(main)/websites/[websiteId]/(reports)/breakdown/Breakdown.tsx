import { Column, DataColumn, Text } from '@umami/react-zen';
import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Pager } from '@/components/common/Pager';
import { useBreakdownQuery, useFields, useFormat, useMessages } from '@/components/hooks';
import { formatShortTime } from '@/lib/format';

export interface BreakdownProps {
  websiteId: string;
  startDate: Date;
  endDate: Date;
  selectedFields: string[];
}

export function Breakdown({ websiteId, selectedFields = [], startDate, endDate }: BreakdownProps) {
  const [page, setPage] = useState(1);
  const { t, labels } = useMessages();
  const { formatValue } = useFormat();
  const { fields } = useFields();
  const { data, error, isLoading } = useBreakdownQuery(
    {
      websiteId,
      startDate,
      endDate,
      fields: selectedFields,
    },
    { enabled: !!selectedFields.length },
  );
  const pageSize = 50;
  const currentPage = Math.min(page, Math.max(1, Math.ceil((data?.length || 0) / pageSize)));
  const visibleRows = data?.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <LoadingPanel data={data} isLoading={isLoading} error={error}>
      <Column gap="3" minWidth="0">
        <DataTable data={visibleRows} style={{ minWidth: selectedFields.length * 240 + 620 }}>
          {selectedFields.map(field => {
            return (
              <DataColumn
                key={field}
                id={field}
                label={fields.find(f => f.name === field)?.label}
                width="minmax(240px, 1fr)"
              >
                {row => {
                  const value = formatValue(row[field], field);
                  return (
                    <Text truncate title={value}>
                      {value}
                    </Text>
                  );
                }}
              </DataColumn>
            );
          })}
          <DataColumn id="visitors" label={t(labels.visitors)} align="end" width="100px">
            {row => row?.visitors?.toLocaleString()}
          </DataColumn>
          <DataColumn id="visits" label={t(labels.visits)} align="end" width="100px">
            {row => row?.visits?.toLocaleString()}
          </DataColumn>
          <DataColumn id="views" label={t(labels.views)} align="end" width="100px">
            {row => row?.views?.toLocaleString()}
          </DataColumn>
          <DataColumn id="bounceRate" label={t(labels.bounceRate)} align="end" width="160px">
            {row => {
              const n = (Math.min(row?.visits, row?.bounces) / row?.visits) * 100;
              return `${Math.round(+n)}%`;
            }}
          </DataColumn>
          <DataColumn id="visitDuration" label={t(labels.visitDuration)} align="end" width="160px">
            {row => {
              const n = row?.totaltime / row?.visits;
              return `${+n < 0 ? '-' : ''}${formatShortTime(Math.abs(~~n), ['m', 's'], ' ')}`;
            }}
          </DataColumn>
        </DataTable>
        {data && data.length > pageSize && (
          <Pager
            page={currentPage}
            pageSize={pageSize}
            count={data.length}
            onPageChange={setPage}
          />
        )}
      </Column>
    </LoadingPanel>
  );
}
