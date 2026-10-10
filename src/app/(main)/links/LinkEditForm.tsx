import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Grid,
  Icon,
  Label,
  Loading,
  Row,
  TextField,
} from '@umami/react-zen';
import { useEffect, useState } from 'react';
import { MultiSelect, MultiSelectItem } from '@/components/common/MultiSelect';
import { useApi, useConfig, useLinkQuery, useMessages } from '@/components/hooks';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';
import { RefreshCw } from '@/components/icons';
import { getRandomChars } from '@/lib/generate';
import { isValidLinkDestinationUrl } from '@/lib/link-variables';
import { setConfig } from '@/store/app';

const generateId = () => getRandomChars(9);
const DEFAULT_DOMAIN = '__default__';

export function LinkEditForm({
  linkId,
  teamId,
  onSave,
  onClose,
}: {
  linkId?: string;
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    linkId ? `/links/${linkId}` : '/links',
    {
      id: linkId,
      teamId,
    },
  );
  const config = useConfig();
  const { get } = useApi();
  const cloudMode = config?.cloudMode;
  const baseDomain = config?.baseDomain;
  const linkDomains = config?.linkDomains || [];
  const defaultDomain = baseDomain || globalThis?.location?.hostname || t(labels.defaultDomain);
  const defaultDomainLabel = `https://${defaultDomain}`;
  const hostUrl = baseDomain ? `${defaultDomainLabel}/q` : `${globalThis?.location?.origin}/q`;
  const { data, isLoading } = useLinkQuery(linkId);
  const linkData = data && {
    ...data,
    domains: [
      ...(data.isDefaultDomainEnabled ? [DEFAULT_DOMAIN] : []),
      ...(data.domains?.map(({ domain }) => domain.hostname) || []),
    ],
  };
  const [defaultSlug] = useState(generateId());

  useEffect(() => {
    get('/config')
      .then(setConfig)
      .catch(() => {});
  }, [get]);

  const handleSubmit = async ({ domains = [], ...data }: any) => {
    await mutateAsync(
      {
        ...data,
        domains: domains.filter((domain: string) => domain !== DEFAULT_DOMAIN),
        isDefaultDomainEnabled: domains.includes(DEFAULT_DOMAIN),
      },
      {
        onSuccess: async () => {
          toast(t(messages.saved));
          touch('links');
          touch(`link:${linkId}`);
          onSave?.();
          onClose?.();
        },
      },
    );
  };

  const checkUrl = (url: string) => {
    if (!isValidLinkDestinationUrl(url)) {
      return t(labels.invalidUrl);
    }
    return true;
  };

  if (linkId && isLoading) {
    return <Loading placement="absolute" />;
  }

  return (
    <Form
      onSubmit={handleSubmit}
      error={getErrorMessage(error)}
      defaultValues={{ slug: defaultSlug, domains: [DEFAULT_DOMAIN], ...linkData }}
    >
      {({ setValue, watch }) => {
        const slug = watch('slug');
        const domains = watch('domains') || [];
        const isDefaultDomainEnabled = domains.includes(DEFAULT_DOMAIN);
        const customDomains = domains.filter((domain: string) => domain !== DEFAULT_DOMAIN);

        return (
          <>
            <Grid columns={{ base: '1fr', md: '1fr 1fr' }} gap>
              <FormField
                label={t(labels.name)}
                name="name"
                rules={{ required: t(labels.required) }}
              >
                <TextField autoComplete="off" autoFocus />
              </FormField>

              <FormField
                label={t(labels.destinationUrl)}
                name="url"
                rules={{ required: t(labels.required), validate: checkUrl }}
              >
                <TextField placeholder="https://example.com" autoComplete="off" />
              </FormField>
            </Grid>
            <p className="text-sm text-muted">{t(messages.linkVariableHelp)}</p>

            {cloudMode ? (
              <FormField
                name="slug"
                rules={{
                  required: t(labels.required),
                }}
                style={{ display: 'none' }}
              >
                <input type="hidden" />
              </FormField>
            ) : (
              <Grid columns={{ base: '1fr', md: '1fr 1fr' }} alignItems="end" gap>
                <FormField label={t(labels.domain)} name="domains">
                  <MultiSelect
                    value={domains}
                    onChange={values => setValue('domains', values, { shouldDirty: true })}
                    placeholder={t(labels.select)}
                    renderValue={values =>
                      values
                        .map(domain =>
                          domain === DEFAULT_DOMAIN ? defaultDomainLabel : `https://${domain}`,
                        )
                        .join(', ')
                    }
                  >
                    <MultiSelectItem value={DEFAULT_DOMAIN}>{defaultDomainLabel}</MultiSelectItem>
                    {linkDomains.map(domain => (
                      <MultiSelectItem key={domain} value={domain}>
                        {`https://${domain}`}
                      </MultiSelectItem>
                    ))}
                  </MultiSelect>
                </FormField>
                <Column style={{ position: 'relative' }}>
                  <FormField
                    name="slug"
                    label={t(labels.slug)}
                    rules={{
                      required: t(labels.required),
                    }}
                  >
                    <TextField autoComplete="off" style={{ paddingInlineEnd: '2.5rem' }} />
                  </FormField>
                  <Button
                    variant="quiet"
                    style={{ position: 'absolute', insetInlineEnd: 0, bottom: 0 }}
                    onPress={() => setValue('slug', generateId(), { shouldDirty: true })}
                  >
                    <Icon>
                      <RefreshCw />
                    </Icon>
                  </Button>
                </Column>
              </Grid>
            )}

            <Column gap="1">
              <Label>{t(labels.link)}</Label>
              {[
                ...(isDefaultDomainEnabled ? [hostUrl] : []),
                ...customDomains.map((domain: string) => `https://${domain}/q`),
              ].map(baseUrl => (
                <Row key={baseUrl} alignItems="center" gap>
                  <TextField
                    value={`${baseUrl}/${slug}`}
                    autoComplete="off"
                    isReadOnly
                    allowCopy
                    style={{ width: '100%' }}
                  />
                </Row>
              ))}
              {!isDefaultDomainEnabled && customDomains.length === 0 && (
                <p className="text-sm text-muted">{t(labels.linkDisabled)}</p>
              )}
            </Column>

            <Row justifyContent="flex-end" paddingTop="3" gap="3">
              {onClose && (
                <Button isDisabled={isPending} onPress={onClose}>
                  {t(labels.cancel)}
                </Button>
              )}
              <FormSubmitButton>{t(labels.save)}</FormSubmitButton>
            </Row>
          </>
        );
      }}
    </Form>
  );
}
