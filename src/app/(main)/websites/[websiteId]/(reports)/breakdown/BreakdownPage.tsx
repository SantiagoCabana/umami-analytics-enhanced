'use client';
import { Column } from '@umami/react-zen';
import { useState } from 'react';
import { FieldSelectForm } from '@/app/(main)/websites/[websiteId]/(reports)/breakdown/FieldSelectForm';
import { WebsiteControls } from '@/app/(main)/websites/[websiteId]/WebsiteControls';
import { Panel } from '@/components/common/Panel';
import { useBreakdownQuery, useDateRange, useMessages, useTimezone } from '@/components/hooks';
import { ListCheck } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { DownloadButton } from '@/components/input/DownloadButton';
import { Breakdown } from './Breakdown';

export function BreakdownPage({ websiteId }: { websiteId: string }) {
  const { timezone } = useTimezone();
  const {
    dateRange: { startDate, endDate },
  } = useDateRange({ timezone });
  const [fields, setFields] = useState(['path']);
  const { data } = useBreakdownQuery(
    { websiteId, startDate, endDate, fields },
    { enabled: !!fields.length },
  );
  return (
    <Column gap>
      <WebsiteControls
        websiteId={websiteId}
        extraActions={<FieldsButton value={fields} onChange={setFields} />}
      />
      <Panel
        height="900px"
        overflow="auto"
        allowFullscreen
        toolbar={<DownloadButton filename="breakdown" data={data} />}
      >
        <Breakdown
          key={`${websiteId}:${startDate.getTime()}:${endDate.getTime()}:${fields.join(',')}`}
          websiteId={websiteId}
          startDate={startDate}
          endDate={endDate}
          selectedFields={fields}
        />
      </Panel>
    </Column>
  );
}

const FieldsButton = ({ value, onChange }) => {
  const { t, labels } = useMessages();

  return (
    <DialogButton
      icon={<ListCheck />}
      label={t(labels.fields)}
      width="400px"
      minHeight="300px"
      variant="outline"
    >
      {({ close }) => {
        return <FieldSelectForm selectedFields={value} onChange={onChange} onClose={close} />;
      }}
    </DialogButton>
  );
};
