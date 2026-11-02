import { beforeEach, expect, test, vi } from 'vitest';
import { ROLES } from '@/lib/constants';
import { render, screen } from '@/test/render';
import { LinksPage } from './LinksPage';

const state = vi.hoisted(() => ({
  teamId: 'team-1',
  role: 'user',
  team: null as any,
  isError: false,
}));

vi.mock('@/components/hooks', async () => ({
  useMessages: (await import('@/components/hooks/useMessages')).useMessages,
  useLoginQuery: () => ({ user: { id: 'user-1', role: state.role } }),
  useNavigation: () => ({ teamId: state.teamId }),
  useTeamQuery: () => ({ data: state.team, isError: state.isError }),
}));
vi.mock('./LinkVariablesButton', () => ({ LinkVariablesButton: () => null }));
vi.mock('./LinkAddButton', () => ({ LinkAddButton: () => <button>Add link</button> }));
vi.mock('./LinksDataTable', () => ({
  LinksDataTable: ({ showActions }: { showActions: boolean }) => (
    <div>{showActions ? 'Edit and delete available' : 'No actions'}</div>
  ),
}));

beforeEach(() => {
  state.teamId = 'team-1';
  state.role = ROLES.user;
  state.team = { id: 'team-1', members: [{ userId: 'user-1', role: ROLES.teamMember }] };
  state.isError = false;
});

test.each(['/links', '/links?search=campaign', '/links?page=2', '/links?search=campaign&page=2'])(
  'keeps actions at %s',
  route => {
    render(<LinksPage />, { route });
    expect(screen.getByRole('button', { name: 'Add link' })).toBeInTheDocument();
    expect(screen.getByText('Edit and delete available')).toBeInTheDocument();
  },
);

test('hides team actions for view-only members', () => {
  state.team.members[0].role = ROLES.teamViewOnly;
  render(<LinksPage />);
  expect(screen.queryByRole('button', { name: 'Add link' })).not.toBeInTheDocument();
});

test.each(['other-team', 'missing', 'error'])(
  'does not use unconfirmed membership: %s',
  condition => {
    if (condition === 'other-team') state.team.id = 'previous-team';
    if (condition === 'missing') state.team = undefined;
    if (condition === 'error') state.isError = true;
    render(<LinksPage />);
    expect(screen.queryByRole('button', { name: 'Add link' })).not.toBeInTheDocument();
  },
);

test('hides personal actions for view-only accounts', () => {
  state.teamId = '';
  state.role = ROLES.viewOnly;
  render(<LinksPage />);
  expect(screen.queryByRole('button', { name: 'Add link' })).not.toBeInTheDocument();
});
