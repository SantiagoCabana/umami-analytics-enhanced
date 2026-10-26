'use client';
import { Column, Icon } from '@umami/react-zen';
import { LinkVariablesManager } from '@/app/(main)/links/LinkVariablesButton';
import { LinkButton } from '@/components/common/LinkButton';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useMessages, useNavigation } from '@/components/hooks';
import { ArrowLeft } from '@/components/icons';
import { canAccessLinkVariables } from '@/lib/link-variables';

export function LinkVariablesPage() {
  const { user } = useLoginQuery();
  const { t, labels, messages } = useMessages();
  const { renderUrl } = useNavigation();

  if (!canAccessLinkVariables(user)) {
    return null;
  }

  return (
    <PageBody maxWidth="1320px">
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.variables)} description={t(messages.linkVariableHelp)}>
          <LinkButton href={renderUrl('/links', false)} variant="quiet">
            <Icon>
              <ArrowLeft />
            </Icon>
            {t(labels.back)}
          </LinkButton>
        </PageHeader>
        <Panel>
          <LinkVariablesManager />
        </Panel>
      </Column>
    </PageBody>
  );
}
