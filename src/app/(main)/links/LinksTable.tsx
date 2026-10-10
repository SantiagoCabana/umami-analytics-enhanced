import { DataColumn, DataTable, type DataTableProps, Row, Text } from '@umami/react-zen';
import { useMemo } from 'react';
import { WebsiteSparkline } from '@/app/(main)/websites/WebsiteSparkline';
import { DateDistance } from '@/components/common/DateDistance';
import { ExternalLink } from '@/components/common/ExternalLink';
import Link from '@/components/common/Link';
import { SortableLabel } from '@/components/common/SortableLabel';
import {
  useLinkListChartsQuery,
  useMessages,
  useNavigation,
  useSlug,
  useTimezone,
} from '@/components/hooks';
import { LinkDeleteButton } from './LinkDeleteButton';
import { LinkEditButton } from './LinkEditButton';

export interface LinksTableProps extends DataTableProps {
  showActions?: boolean;
}

export function LinksTable({
  showActions,
  data = [],
  ...props
}: LinksTableProps & { data?: any[] }) {
  const { t, labels } = useMessages();
  const { formatTimezoneDate } = useTimezone();
  const { websiteId, renderUrl } = useNavigation();
  const { getSlugUrl } = useSlug('link');
  const linkIds = useMemo(() => data.map(row => row.id), [data]);
  const chartsQuery = useLinkListChartsQuery(linkIds);
  const charts = chartsQuery.data?.data || {};
  const isChartLoading = chartsQuery.isLoading && !chartsQuery.data;

  return (
    <DataTable {...props} data={data}>
      <DataColumn
        id="name"
        label={<SortableLabel label={t(labels.name)} sortKey="name" />}
        width="1.5fr"
        className="items-center"
      >
        {({ id, name }: any) => {
          return <Link href={renderUrl(`/links/${id}`)}>{name}</Link>;
        }}
      </DataColumn>
      <DataColumn
        id="slug"
        label={<SortableLabel label={t(labels.link)} sortKey="slug" />}
        width="1.1fr"
        style={{ minWidth: 0 }}
        className="items-center"
      >
        {({ slug, domains, isDefaultDomainEnabled }: any) => {
          const url = domains?.[0]?.domain?.hostname
            ? `https://${domains[0].domain.hostname}/q/${slug}`
            : isDefaultDomainEnabled
              ? getSlugUrl(slug)
              : null;

          return url ? (
            <ExternalLink href={url}>{url}</ExternalLink>
          ) : (
            <span>{t(labels.unassigned)}</span>
          );
        }}
      </DataColumn>
      <DataColumn
        id="url"
        label={<SortableLabel label={t(labels.destinationUrl)} sortKey="url" />}
        width="1.1fr"
        style={{ minWidth: 0 }}
        className="items-center"
      >
        {({ url }: any) => {
          return <ExternalLink href={url}>{url}</ExternalLink>;
        }}
      </DataColumn>
      <DataColumn
        id="chart"
        label={<span style={{ whiteSpace: 'normal' }}>{`${t(labels.visitors)} (7d)`}</span>}
        width="140px"
        style={{ minWidth: 0 }}
        className="items-center"
      >
        {(row: any) => {
          const chart = charts[row.id];

          return (
            <WebsiteSparkline
              values={chart?.values}
              total={chart?.total}
              isLoading={isChartLoading}
            />
          );
        }}
      </DataColumn>
      <DataColumn
        id="created"
        label={
          <SortableLabel label={t(labels.created)} sortKey="createdAt" defaultDirection="desc" />
        }
        width="150px"
        className="items-center"
      >
        {(row: any) => (
          <Text title={formatTimezoneDate(row.createdAt, 'PPPpp')}>
            {formatTimezoneDate(row.createdAt, 'dd-MM-yyyy')}
          </Text>
        )}
      </DataColumn>
      <DataColumn
        id="updated"
        label={
          <SortableLabel label={t(labels.updated)} sortKey="updatedAt" defaultDirection="desc" />
        }
        width="150px"
        className="items-center"
      >
        {(row: any) =>
          row.updatedAt ? <DateDistance date={new Date(row.updatedAt)} strict /> : <span>-</span>
        }
      </DataColumn>
      {showActions && (
        <DataColumn id="action" align="end" width="72px" className="items-center">
          {({ id, name }: any) => {
            return (
              <Row gap="2">
                <LinkEditButton linkId={id} />
                <LinkDeleteButton linkId={id} websiteId={websiteId} name={name} />
              </Row>
            );
          }}
        </DataColumn>
      )}
    </DataTable>
  );
}
