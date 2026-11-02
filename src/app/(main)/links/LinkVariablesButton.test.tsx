import { beforeEach, expect, test, vi } from 'vitest';
import { LinkVariablesPage } from '@/app/(main)/links/variables/LinkVariablesPage';
import { ROLES } from '@/lib/constants';
import { render, screen } from '@/test/render';
import { LinkVariablesButton, LinkVariablesManager } from './LinkVariablesButton';

const state = vi.hoisted(() => ({ role: 'user', query: vi.fn() }));

vi.mock('@/components/hooks', async () => {
  const { useMessages } = await import('@/components/hooks/useMessages');
  const { useLocale } = await import('@/components/hooks/useLocale');
  const { useNavigation } = await import('@/components/hooks/useNavigation');
  const { useMutation } = await import('@tanstack/react-query');

  return {
    useMessages,
    useLocale,
    useNavigation,
    useTimezone: () => ({ formatTimezoneDate: (date: string) => `formatted ${date}` }),
    useLoginQuery: () => ({ user: { role: state.role, isAdmin: state.role === ROLES.admin } }),
    useLinkVariablesQuery: () => state.query(),
    useModified: () => ({ touch: vi.fn() }),
    useApi: () => ({ post: vi.fn(), del: vi.fn(), useMutation }),
  };
});

beforeEach(() => {
  state.role = ROLES.user;
  state.query.mockReset().mockReturnValue({
    data: [
      {
        id: 'variable-1',
        name: 'campaign',
        value: 'Summer',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: null,
      },
    ],
    isLoading: false,
    error: null,
  });
});

test('shows creation and missing update dates', () => {
  render(<LinkVariablesManager />);

  expect(screen.getByText('Created: formatted 2026-10-01T00:00:00.000Z')).toBeInTheDocument();
  expect(screen.getByText('Updated: —')).toBeInTheDocument();
});

test('offers the accessible variable sort control and changes the displayed order', async () => {
  state.query.mockReturnValue({
    data: [
      { id: '2', name: 'zulu', value: 'two', createdAt: null, updatedAt: 'invalid' },
      { id: '1', name: 'alpha', value: 'one', createdAt: null, updatedAt: null },
    ],
    isLoading: false,
    error: null,
  });
  const { user } = render(<LinkVariablesManager />);

  const sort = screen.getByRole('combobox', { name: 'Sort variables' });
  expect(
    screen.getByText('alpha').compareDocumentPosition(screen.getByText('zulu')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.getAllByText('Updated: —')).toHaveLength(2);
  await user.click(sort);
  await user.click(await screen.findByRole('option', { name: 'Name: Z–A' }));
  expect(
    screen.getByText('zulu').compareDocumentPosition(screen.getByText('alpha')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test.each(['', '/teams/3ba48f46-d24c-44d0-9276-79539c5f58a1'])(
  'keeps the active scope %s on both Variables and Back links',
  prefix => {
    const { unmount } = render(<LinkVariablesButton />, { route: `${prefix}/links?search=demo` });
    expect(screen.getByRole('button', { name: 'Variables' })).toHaveAttribute(
      'href',
      `${prefix}/links/variables`,
    );
    unmount();

    render(<LinkVariablesPage />, { route: `${prefix}/links/variables` });
    expect(screen.getByRole('button', { name: 'Back' })).toHaveAttribute('href', `${prefix}/links`);
  },
);

test('view-only accounts see neither the entry nor the manager and fetch no variables', () => {
  state.role = ROLES.viewOnly;
  render(
    <>
      <LinkVariablesButton />
      <LinkVariablesPage />
    </>,
  );

  expect(screen.queryByRole('button', { name: 'Variables' })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  expect(state.query).not.toHaveBeenCalled();
});

test.each([ROLES.admin, ROLES.user])('%s can create, but only admins can rename', async role => {
  state.role = role;
  const { user } = render(<LinkVariablesManager />);

  expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('readonly');
  await user.click(screen.getByRole('button', { name: 'Edit' }));

  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('campaign');
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveProperty(
    'readOnly',
    role !== ROLES.admin,
  );
  expect(screen.getByRole('textbox', { name: 'Value' })).not.toHaveAttribute('readonly');
  expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
});
