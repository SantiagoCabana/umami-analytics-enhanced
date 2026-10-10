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
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { useApi, useMessages, useModified, useShortDomainsQuery } from '@/components/hooks';
import { Activity, Edit, Globe, Plus, Trash } from '@/components/icons';
import { isValidLinkUrl, normalizeLinkDomain } from '@/lib/link-domains';

export type ShortDomain = {
  id: string;
  hostname: string;
  rootRedirectUrl: string | null;
  _count: { links: number };
};

export function ShortDomainManager({
  showForm = true,
  showList = true,
  initialEditing,
  onEdit,
  onClose,
}: {
  showForm?: boolean;
  showList?: boolean;
  initialEditing?: ShortDomain;
  onEdit?: (domain: ShortDomain) => void;
  onClose?: () => void;
}) {
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { post, put, del, useMutation } = useApi();
  const { touch } = useModified();
  const { data, isLoading, error } = useShortDomainsQuery();
  const [editing, setEditing] = useState<ShortDomain | null>(initialEditing || null);
  const [addedDomains, setAddedDomains] = useState<ShortDomain[]>([]);
  const [updatedDomains, setUpdatedDomains] = useState<Record<string, ShortDomain>>({});
  const [removedDomainIds, setRemovedDomainIds] = useState<string[]>([]);
  const [domainStatus, setDomainStatus] = useState<Record<string, boolean>>({});
  const automaticallyChecked = useRef(new Set<string>());

  const updateDomain = (domain: ShortDomain) => {
    setUpdatedDomains(state => ({ ...state, [domain.id]: domain }));
  };

  const saveMutation = useMutation({
    mutationFn: ({
      domainId,
      ...values
    }: {
      domainId?: string;
      hostname: string;
      rootRedirectUrl: string;
    }) => post(domainId ? `/admin/link-domains/${domainId}` : '/admin/link-domains', values),
    onSuccess: (domain: ShortDomain) => {
      updateDomain(domain);
      setAddedDomains(domains =>
        domains.some(item => item.id === domain.id) ? domains : [...domains, domain],
      );
      touch('short-domains');
      touch('config');
      setEditing(null);
      onClose?.();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (domainId: string) => del(`/admin/link-domains/${domainId}`),
    onSuccess: (_: unknown, domainId: string) => {
      setRemovedDomainIds(ids => [...ids, domainId]);
      touch('short-domains');
      touch('config');
    },
  });
  const verifyMutation = useMutation({
    mutationFn: (domainId: string) => put(`/admin/link-domains/${domainId}`),
    onSuccess: ({ active }: { active: boolean }, domainId: string) => {
      setDomainStatus(status => ({ ...status, [domainId]: active }));
    },
  });
  const fetchedDomains = (data || []) as ShortDomain[];
  const domains = [
    ...fetchedDomains,
    ...addedDomains.filter(domain => !fetchedDomains.some(item => item.id === domain.id)),
  ]
    .filter(domain => !removedDomainIds.includes(domain.id))
    .map(domain => updatedDomains[domain.id] || domain);

  useEffect(() => {
    if (isLoading || error) {
      return;
    }

    const pendingDomains = domains.filter(domain => !automaticallyChecked.current.has(domain.id));

    if (pendingDomains.length === 0) {
      return;
    }

    pendingDomains.forEach(domain => {
      automaticallyChecked.current.add(domain.id);
    });
    void (async () => {
      for (const domain of pendingDomains) {
        try {
          await verifyMutation.mutateAsync(domain.id);
        } catch {
          setDomainStatus(status => ({ ...status, [domain.id]: false }));
        }
      }
    })();
  }, [domains, error, isLoading, verifyMutation]);

  useEffect(() => {
    setEditing(initialEditing || null);
  }, [initialEditing]);

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
      {showForm && (
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
              <Button
                variant="quiet"
                onPress={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setEditing(null);
                  }
                }}
              >
                {t(labels.cancel)}
              </Button>
            )}
            {onClose && !editing && <Button onPress={onClose}>{t(labels.close)}</Button>}
            <FormSubmitButton isLoading={saveMutation.isPending} requireValid>
              <Icon>{editing ? <Edit /> : <Plus />}</Icon>
              {editing ? t(labels.save) : t(labels.add)}
            </FormSubmitButton>
          </Row>
        </Form>
      )}

      {showList && (
        <Column gap="3">
          <Row justifyContent="space-between" alignItems="center">
            <Heading size="lg">{t(labels.manageDomains)}</Heading>
          </Row>
          {isLoading ? (
            <p className="text-sm text-muted">{t(labels.loading)}</p>
          ) : error ? (
            <p className="text-sm text-error">{getErrorMessage(error)}</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted">{t(messages.noShortDomains)}</p>
          ) : (
            <Column gap="2" overflowY="auto" maxHeight="min(360px, 35dvh)">
              {domains.map(domain => {
                const active = domainStatus[domain.id] ?? false;
                const isChecking =
                  verifyMutation.isPending && verifyMutation.variables === domain.id;

                return (
                  <Column key={domain.id} padding="3" border borderRadius backgroundColor="surface">
                    <Row alignItems="center" gap="3">
                      <Icon>
                        <Globe />
                      </Icon>
                      <Column gap="0" style={{ flex: 1, minWidth: 0 }}>
                        <strong>{domain.hostname}</strong>
                        <span className="text-sm text-muted">
                          {domain.rootRedirectUrl || t(messages.rootRedirectNotSet)}
                        </span>
                      </Column>
                      <Column alignItems="flex-end">
                        <Badge variant={active ? 'good' : 'danger'}>
                          {active ? t(labels.active) : t(labels.inactive)}
                        </Badge>
                      </Column>
                      <LoadingButton
                        variant="quiet"
                        aria-label={t(labels.verify)}
                        isDisabled={verifyMutation.isPending}
                        isLoading={isChecking}
                        onPress={() => verifyMutation.mutateAsync(domain.id)}
                      >
                        {!isChecking && (
                          <Icon>
                            <Activity />
                          </Icon>
                        )}
                      </LoadingButton>
                      <Button
                        variant="quiet"
                        aria-label={t(labels.edit)}
                        isDisabled={saveMutation.isPending || verifyMutation.isPending}
                        onPress={() => (onEdit ? onEdit(domain) : setEditing(domain))}
                      >
                        <Icon>
                          <Edit />
                        </Icon>
                      </Button>
                      <Button
                        variant="quiet"
                        aria-label={t(labels.delete)}
                        isDisabled={
                          domain._count.links > 0 ||
                          deleteMutation.isPending ||
                          verifyMutation.isPending
                        }
                        onPress={() => deleteMutation.mutateAsync(domain.id)}
                      >
                        <Icon>
                          <Trash />
                        </Icon>
                      </Button>
                    </Row>
                    {verifyMutation.variables === domain.id && verifyMutation.error && (
                      <span className="text-sm text-error">
                        {getErrorMessage(verifyMutation.error)}
                      </span>
                    )}
                  </Column>
                );
              })}
            </Column>
          )}
        </Column>
      )}
    </Column>
  );
}
