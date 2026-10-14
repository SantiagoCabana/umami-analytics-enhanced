import { expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { AdminNav } from './AdminNav';

vi.mock('@/components/hooks', () => ({
  useMessages: () => ({
    t: (value: string) => value,
    labels: {
      back: 'Back',
      domains: 'Domains',
      manage: 'Manage',
      security: 'Security',
      teams: 'Teams',
      users: 'Users',
      websites: 'Websites',
    },
  }),
  useNavigation: () => ({
    pathname: '/admin/users',
    renderUrl: (path: string) => path,
  }),
}));

test('renders the administration menu with labels when expanded', () => {
  render(<AdminNav />);

  expect(screen.getByText('Manage')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Domains' })).toBeInTheDocument();
});

test('renders icon-only administration navigation when collapsed', async () => {
  render(<AdminNav isCollapsed />);

  expect(screen.queryByText('Manage')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
});
