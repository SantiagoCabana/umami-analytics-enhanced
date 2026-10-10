import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Grid,
  Heading,
  Icon,
  LoadingButton,
  Row,
  TextField,
} from '@umami/react-zen';
import { useState } from 'react';
import { useApi, useMessages, useModified, useShortDomainsQuery } from '@/components/hooks';
import { Check, Edit, Globe, Plus, RefreshCw, Trash } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { isValidLinkUrl, normalizeLinkDomain } from '@/lib/link-domains';

type ShortDomain = {
  id: string;
  hostname: string;
  rootRedirectUrl: string | null;
  verifiedAt: string | null;
  _count: { links: number };
};

export function ShortDomainManageButton() {
  const { t, labels } = useMessages();

  return (
    <DialogButton icon={<Globe />} label={t(labels.domains)} variant="outline" width="880px">
      {({ close }) => <ShortDomainManager onClose={close} />}
    </DialogButton>
  );
}

function ShortDomainManager({ onClose }: { onClose: () => void }) {
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { post, put, del, useMutation } = useApi();
  const { touch } = useModified();
  const { data, isLoading, error } = useShortDomainsQuery();
  const [editing, setEditing] = useState<ShortDomain | null>(null);

  const saveMutation = useMutation({
    mutationFn: ({
      domainId,
      ...values
    }: {
      domainId?: string;
      hostname: string;
      rootRedirectUrl: string;
    }) => post(domainId ? `/admin/link-domains/${domainId}` : '/admin/link-domains', values),
    onSuccess: () => {
      touch('short-domains');
      touch('config');
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (domainId: string) => del(`/admin/link-domains/${domainId}`),
    onSuccess: () => {
      touch('short-domains');
      touch('config');
    },
  });
  const verifyMutation = useMutation({
    mutationFn: (domainId: string) => put(`/admin/link-domains/${domainId}`),
    onSuccess: () => {
      touch('short-domains');
      touch('config');
    },
  });
  const domains = (data || []) as ShortDomain[];

  const handleSubmit = async (values: { hostname: string; rootRedirectUrl: string }) => {
    await saveMutation.mutateAsync({ domainId: editing?.id, ...values });
  };

  const checkHostname = (hostname: string) => {
    return !!normalizeLinkDomain(hostname) || t(messages.invalidDomain);
  };

  const checkRootRedirectUrl = (url: string) => {
    return isValidLinkUrl(url) || t(labels.invalidUrl);
  };

  return (
    <Column gap="4">
      <p className="text-sm text-muted">{t(messages.domainManagerDescription)}</p>

      <Form
        key={editing?.id || 'new'}
        defaultValues={{
          hostname: editing?.hostname || '',
          rootRedirectUrl: editing?.rootRedirectUrl || '',
        }}
        error={getErrorMessage(saveMutation.error)}
        mode="onChange"
        onSubmit={handleSubmit}
      >
        <Grid columns={{ base: '1fr', md: '1fr 1fr' }} gap="3">
          <FormField
            label={t(labels.domain)}
            name="hostname"
            rules={{ required: t(labels.required), validate: checkHostname }}
          >
            <TextField placeholder="links.example.com" autoComplete="off" />
          </FormField>
          <FormField
            label={t(labels.rootRedirectUrl)}
            name="rootRedirectUrl"
            rules={{ required: t(labels.required), validate: checkRootRedirectUrl }}
          >
            <TextField placeholder="https://example.com" autoComplete="off" />
          </FormField>
        </Grid>
        <Row justifyContent="flex-end" gap="2">
          {editing && (
            <Button variant="quiet" onPress={() => setEditing(null)}>
              {t(labels.cancel)}
            </Button>
          )}
          <FormSubmitButton isLoading={saveMutation.isPending} requireValid>
            <Icon>{editing ? <Edit /> : <Plus />}</Icon>
            {editing ? t(labels.save) : t(labels.add)}
          </FormSubmitButton>
        </Row>
      </Form>

      <Column gap="3">
        <Row justifyContent="space-between" alignItems="center">
          <Heading size="lg">{t(labels.manageDomains)}</Heading>
          {!isLoading && !error && <span className="text-sm text-muted">{domains.length}</span>}
        </Row>
        {isLoading ? (
          <p className="text-sm text-muted">{t(labels.loading)}</p>
        ) : error ? (
          <p className="text-sm text-error">{getErrorMessage(error)}</p>
        ) : domains.length === 0 ? (
          <p className="text-sm text-muted">{t(messages.noShortDomains)}</p>
        ) : (
          <Column gap="2" overflowY="auto" maxHeight="min(360px, 35dvh)">
            {domains.map(domain => (
              <Row
                key={domain.id}
                alignItems="center"
                gap="3"
                padding="3"
                border
                borderRadius
                backgroundColor="surface"
              >
                <Icon>
                  <Globe />
                </Icon>
                <Column gap="0" style={{ flex: 1, minWidth: 0 }}>
                  <strong>{domain.hostname}</strong>
                  <span className="text-sm text-muted">
                    {domain.rootRedirectUrl || t(messages.rootRedirectNotSet)}
                  </span>
                </Column>
                <Column gap="0" alignItems="flex-end">
                  <span className="text-sm text-muted">{domain._count.links}</span>
                  <span className="text-sm text-muted">
                    {domain.verifiedAt ? t(labels.verified) : t(labels.unverified)}
                  </span>
                </Column>
                <LoadingButton
                  variant="quiet"
                  aria-label={domain.verifiedAt ? t(labels.verified) : t(labels.verify)}
                  isDisabled={verifyMutation.isPending}
                  isLoading={verifyMutation.isPending && verifyMutation.variables === domain.id}
                  onPress={() => verifyMutation.mutateAsync(domain.id)}
                >
                  <Icon>{domain.verifiedAt ? <Check /> : <RefreshCw />}</Icon>
                </LoadingButton>
                <Button
                  variant="quiet"
                  aria-label={t(labels.edit)}
                  isDisabled={saveMutation.isPending || verifyMutation.isPending}
                  onPress={() => setEditing(domain)}
                >
                  <Icon>
                    <Edit />
                  </Icon>
                </Button>
                <Button
                  variant="quiet"
                  aria-label={t(labels.delete)}
                  isDisabled={
                    domain._count.links > 0 || deleteMutation.isPending || verifyMutation.isPending
                  }
                  onPress={() => deleteMutation.mutateAsync(domain.id)}
                >
                  <Icon>
                    <Trash />
                  </Icon>
                </Button>
              </Row>
            ))}
          </Column>
        )}
      </Column>

      <Row justifyContent="flex-end">
        <Button onPress={onClose}>{t(labels.close)}</Button>
      </Row>
    </Column>
  );
}
