import { Row } from '@umami/react-zen';
import { IconLabel } from '@/components/common/IconLabel';
import { LinkButton } from '@/components/common/LinkButton';
import { PageHeader } from '@/components/common/PageHeader';
import { useLink, useMessages, useNavigation, useSlug } from '@/components/hooks';
import { Edit, ExternalLink, Link } from '@/components/icons';

export function LinkHeader({ showActions = true }: { showActions?: boolean }) {
  const link = useLink();

  return (
    <PageHeader title={link.name} description={link.url} icon={<Link />}>
      {showActions && link.id && (
        <LinkHeaderActions
          linkId={link.id}
          slug={link.slug}
          domain={link.domains[0]?.domain.hostname}
          isDefaultDomainEnabled={link.isDefaultDomainEnabled}
        />
      )}
    </PageHeader>
  );
}

function LinkHeaderActions({
  linkId,
  slug,
  domain,
  isDefaultDomainEnabled,
}: {
  linkId: string;
  slug: string;
  domain?: string;
  isDefaultDomainEnabled: boolean;
}) {
  const { t, labels } = useMessages();
  const { renderUrl } = useNavigation();
  const { getSlugUrl } = useSlug('link');

  return (
    <Row alignItems="center" gap="3">
      <LinkButton href={renderUrl(`/links/${linkId}/edit`, false)}>
        <IconLabel icon={<Edit />} label={t(labels.edit)} />
      </LinkButton>
      {(domain || isDefaultDomainEnabled) && (
        <LinkButton
          href={domain ? `https://${domain}/q/${slug}` : getSlugUrl(slug)}
          target="_blank"
          prefetch={false}
          asAnchor
        >
          <IconLabel icon={<ExternalLink />} label={t(labels.view)} />
        </LinkButton>
      )}
    </Row>
  );
}
