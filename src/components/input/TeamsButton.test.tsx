import { beforeEach, expect, test, vi } from 'vitest';
import { getTestRouter } from '@/test/navigation';
import { render, screen } from '@/test/render';
import { TeamsButton } from './TeamsButton';

const removeItem = vi.fn();
const teamId = '3ba48f46-d24c-44d0-9276-79539c5f58a1';

vi.mock('@/components/hooks', () => ({
  useLoginQuery: () => ({
    user: {
      username: 'admin',
      teams: [{ id: teamId, name: 'Team one' }],
    },
  }),
  useMessages: () => ({
    t: (value: string) => value,
    labels: {
      myAccount: 'My account',
      teams: 'Teams',
    },
  }),
  useMobile: () => ({ isPhone: false }),
  useNavigation: () => ({
    pathname: window.location.pathname,
    teamId: window.location.pathname.match(/\/teams\/([a-f0-9-]+)/)?.[1],
    router: getTestRouter(),
  }),
}));

vi.mock('@/lib/storage', () => ({
  removeItem: (...args: unknown[]) => removeItem(...args),
}));

beforeEach(() => {
  removeItem.mockReset();
  getTestRouter().push.mockReset();
});

test('opens the matching collection when switching to a team', async () => {
  const { user } = render(<TeamsButton />, {
    route: '/links/03ce6a01-1f8a-417c-b841-a112600464bf?date=2026-10-14',
  });

  const button = screen.getByRole('button', { name: /admin/i });
  button.focus();
  await user.keyboard('{Enter}');
  await user.keyboard('{ArrowDown}{Enter}');

  expect(getTestRouter().push).toHaveBeenCalledWith(`/teams/${teamId}/links`);
});

test('returns to the matching personal collection without a resource id', async () => {
  const { user } = render(<TeamsButton />, {
    route: `/teams/${teamId}/pixels/03ce6a01-1f8a-417c-b841-a112600464bf/edit`,
  });

  const button = screen.getByRole('button', { name: /Team one/i });
  button.focus();
  await user.keyboard('{Enter}');
  await user.keyboard('{Home}{Enter}');

  expect(removeItem).toHaveBeenCalledWith('umami.last-team');
  expect(getTestRouter().push).toHaveBeenCalledWith('/pixels');
});
