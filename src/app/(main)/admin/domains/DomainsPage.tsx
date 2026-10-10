'use client';
import { Button, Column, Icon, Text } from '@umami/react-zen';
import { useState } from 'react';
import { type ShortDomain, ShortDomainManager } from '@/app/(main)/links/ShortDomainManageButton';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';

export function DomainsPage() {
  const { t, labels } = useMessages();
  const [editedDomain, setEditedDomain] = useState<ShortDomain | null | 'new'>(null);
  const isDialogOpen = editedDomain !== null;
  const isEditing = editedDomain !== null && editedDomain !== 'new';

  const closeDialog = () => setEditedDomain(null);

  return (
    <Column gap="6" margin="2">
      <PageHeader title={t(labels.domains)}>
        <Button variant="primary" onPress={() => setEditedDomain('new')}>
          <Icon>
            <Plus />
          </Icon>
          <Text>{t(labels.add)}</Text>
        </Button>
      </PageHeader>
      <Panel>
        <ShortDomainManager showForm={false} onEdit={setEditedDomain} />
      </Panel>
      <DialogButton
        isOpen={isDialogOpen}
        label={t(labels.add)}
        title={isEditing ? t(labels.edit) : t(labels.add)}
        width="720px"
        onOpenChange={isOpen => !isOpen && closeDialog()}
      >
        {() => (
          <ShortDomainManager
            showList={false}
            initialEditing={isEditing ? editedDomain : undefined}
            onClose={closeDialog}
          />
        )}
      </DialogButton>
    </Column>
  );
}
