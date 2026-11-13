import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { UpdateNotice } from './UpdateNotice';

vi.mock('@/store/version', () => ({
  checkVersion: vi.fn(),
  useVersion: () => ({ latest: '3.5.0', checked: false, hasUpdate: true }),
}));

afterEach(() => vi.unstubAllEnvs());

test('renders the update notice above the app and can dismiss it', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const { container, user } = render(<UpdateNotice user={{ isAdmin: true }} config={{}} />);
  const alert = screen.getByRole('alert');
  expect(container).not.toContainElement(alert);
  expect(alert.parentElement?.parentElement).toHaveClass('fixed');
  expect(alert.parentElement?.parentElement).toHaveStyle({ left: '0px' });
  expect(screen.getByText(/3\.5\.0/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
