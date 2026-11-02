'use client';
import { Column, Row } from '@umami/react-zen';
import { LinksDataTable } from '@/app/(main)/links/LinksDataTable';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useMessages, useNavigation, useTeamQuery } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { LinkAddButton } from './LinkAddButton';
import { LinkVariablesButton } from './LinkVariablesButton';

export function LinksPage() {
  const { user } = useLoginQuery();
  const { t, labels } = useMessages();
  const { teamId } = useNavigation();
  const { data: team, isError } = useTeamQuery(teamId);

  const showActions = teamId
    ? !isError &&
      team?.id === teamId &&
      !!team.members?.some(
        (member: { userId: string; role: string }) =>
          member.userId === user.id && member.role !== ROLES.teamViewOnly,
      )
    : user.role !== ROLES.viewOnly;

  return (
    <PageBody>
      <Column gap="3" margin="2">
        <PageHeader title={t(labels.links)}>
          <Row alignItems="center" gap="3">
            <LinkVariablesButton />
            {showActions && <LinkAddButton teamId={teamId} />}
          </Row>
        </PageHeader>
        <Panel>
          <LinksDataTable showActions={showActions} />
        </Panel>
      </Column>
    </PageBody>
  );
}
