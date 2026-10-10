'use client';
import { Column } from '@umami/react-zen';
import { LinkVariablesManager } from '@/app/(main)/links/LinkVariablesButton';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useMessages } from '@/components/hooks';

export function LinkVariablesPage() {
  const { user } = useLoginQuery();
  const { t, labels, messages } = useMessages();

  if (!user.isAdmin) {
    return null;
  }

  return (
    <PageBody maxWidth="1320px">
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.variables)} description={t(messages.linkVariableHelp)} />
        <Panel>
          <LinkVariablesManager />
        </Panel>
      </Column>
    </PageBody>
  );
}
