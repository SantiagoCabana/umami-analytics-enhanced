import { Column, Row, Tooltip, TooltipTrigger } from '@umami/react-zen';
import { IconLabel } from '@/components/common/IconLabel';
import Link from '@/components/common/Link';
import { NavMenu } from '@/components/common/NavMenu';
import { useMessages, useNavigation } from '@/components/hooks';
import { ArrowLeft, Globe, ShieldCheck, User, Users } from '@/components/icons';

export function AdminNav({
  isCollapsed,
  onItemClick,
}: {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}) {
  const { t, labels } = useMessages();
  const { pathname, renderUrl } = useNavigation();

  const items = [
    {
      label: t(labels.manage),
      items: [
        {
          id: 'users',
          label: t(labels.users),
          path: '/admin/users',
          icon: <User />,
        },
        {
          id: 'websites',
          label: t(labels.websites),
          path: '/admin/websites',
          icon: <Globe />,
        },
        {
          id: 'teams',
          label: t(labels.teams),
          path: '/admin/teams',
          icon: <Users />,
        },
        {
          id: 'security',
          label: t(labels.security),
          path: '/admin/security',
          icon: <ShieldCheck />,
        },
        {
          id: 'domains',
          label: t(labels.domains),
          path: '/admin/domains',
          icon: <Globe />,
        },
      ],
    },
  ];

  const selectedKey = items
    .flatMap(e => e.items)
    ?.find(({ path }) => path && pathname.startsWith(path))?.id;

  return (
    <Column gap="2">
      <Link
        href={renderUrl('/websites', false)}
        role="button"
        aria-label={isCollapsed ? t(labels.back) : undefined}
        onClick={onItemClick}
      >
        {(() => {
          const content = (
            <Row
              tabIndex={0}
              alignItems="center"
              justifyContent={isCollapsed ? 'center' : undefined}
              hover={{ backgroundColor: 'surface-sunken' }}
              borderRadius
              minHeight="9"
            >
              <IconLabel icon={<ArrowLeft />} label={isCollapsed ? '' : t(labels.back)} padding />
            </Row>
          );

          return isCollapsed ? (
            <TooltipTrigger delay={0}>
              {content}
              <Tooltip placement="right">{t(labels.back)}</Tooltip>
            </TooltipTrigger>
          ) : (
            content
          );
        })()}
      </Link>
      <NavMenu
        items={items}
        selectedKey={selectedKey}
        isCollapsed={isCollapsed}
        onItemClick={onItemClick}
      />
    </Column>
  );
}
