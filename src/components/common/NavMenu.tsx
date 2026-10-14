import { Column, Heading, Row, Text, Tooltip, TooltipTrigger } from '@umami/react-zen';
import { IconLabel } from '@/components/common/IconLabel';
import Link from '@/components/common/Link';

interface NavMenuData {
  id: string;
  label: string;
  icon?: any;
  path: string;
}

interface NavMenuItems {
  label?: string;
  items: NavMenuData[];
}

export interface NavMenuProps {
  items: NavMenuItems[];
  title?: string;
  selectedKey?: string;
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function NavMenu({
  items = [],
  title,
  selectedKey,
  isCollapsed,
  onItemClick,
  ...props
}: NavMenuProps) {
  const renderItems = (items: NavMenuData[]) => {
    return items?.map(({ id, label, icon, path }) => {
      const isSelected = selectedKey === id;

      const content = (
        <Row
          padding
          alignItems="center"
          justifyContent={isCollapsed ? 'center' : undefined}
          borderRadius
          hover={{ backgroundColor: 'surface-sunken' }}
          backgroundColor={isSelected ? 'surface-sunken' : undefined}
          minHeight="9"
        >
          <IconLabel
            icon={icon}
            label={isCollapsed ? '' : label}
            weight={isSelected ? 'bold' : 'normal'}
          />
        </Row>
      );

      return (
        <Link
          key={id}
          href={path}
          role="button"
          aria-label={isCollapsed ? label : undefined}
          onClick={onItemClick}
        >
          {isCollapsed ? (
            <TooltipTrigger delay={0}>
              {content}
              <Tooltip placement="right">{label}</Tooltip>
            </TooltipTrigger>
          ) : (
            content
          )}
        </Link>
      );
    });
  };

  return (
    <Column gap justifyContent="space-between" position="sticky">
      {title && (
        <Row padding>
          <Heading size="lg">{title}</Heading>
        </Row>
      )}
      <Column gap="3" {...props}>
        {items?.map(({ label, items }, index) => {
          if (label) {
            return (
              <Column key={`${label}${index}`} gap="1" minHeight={isCollapsed ? undefined : '40px'}>
                {!isCollapsed && (
                  <Row paddingX="3" marginTop="2">
                    <Text weight="bold">{label}</Text>
                  </Row>
                )}
                {renderItems(items)}
              </Column>
            );
          }
          return null;
        })}
      </Column>
    </Column>
  );
}
