import { beforeEach, expect, test, vi } from 'vitest';
import { ROLES } from '@/lib/constants';
import { parseRequest } from '@/lib/request';
import {
  createLinkVariable,
  deleteLinkVariable,
  getLinkVariable,
  getLinkVariables,
  updateLinkVariable,
} from '@/queries/prisma';
import { DELETE, POST as updateVariable } from './[variableId]/route';
import { GET, POST } from './route';

vi.mock('@/lib/request', () => ({ parseRequest: vi.fn() }));
vi.mock('@/permissions', async () => ({
  canManageLinkVariables: (await import('@/permissions/user')).canManageLinkVariables,
}));
vi.mock('@/queries/prisma', () => ({
  createLinkVariable: vi.fn(),
  deleteLinkVariable: vi.fn(),
  getLinkVariable: vi.fn(),
  getLinkVariables: vi.fn(),
  updateLinkVariable: vi.fn(),
}));

const variable = {
  id: 'b3a42ca9-19b6-4e12-a450-52fedfcabc53',
  name: 'campaign',
  value: 'Summer',
  createdAt: null,
  updatedAt: null,
};
const request = new Request('http://localhost/api/admin/link-variables');
const context = { params: Promise.resolve({ variableId: variable.id }) };

function setRequest(role: string, name = variable.name) {
  vi.mocked(parseRequest).mockResolvedValue({
    auth: { user: { id: 'user-1', username: 'user', role, isAdmin: role === ROLES.admin } },
    body: { name, value: 'Updated campaign' },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  setRequest(ROLES.user);
  vi.mocked(getLinkVariable).mockResolvedValue(variable);
  vi.mocked(getLinkVariables).mockResolvedValue([variable]);
  vi.mocked(createLinkVariable).mockResolvedValue(variable);
  vi.mocked(updateLinkVariable).mockResolvedValue(variable);
});

test.each([ROLES.admin, ROLES.user])('%s can list, create and delete variables', async role => {
  setRequest(role);

  const response = await GET(request);

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([variable]);
  expect((await POST(request)).status).toBe(200);
  expect((await DELETE(request, context)).status).toBe(200);
  expect(createLinkVariable).toHaveBeenCalledWith({
    name: variable.name,
    value: 'Updated campaign',
  });
  expect(deleteLinkVariable).toHaveBeenCalledWith(variable.id);
});

test('GET returns a JSON server error when loading variables fails', async () => {
  vi.mocked(getLinkVariables).mockRejectedValue(new Error('Database unavailable'));

  const response = await GET(request);

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toMatchObject({
    error: { message: 'Server error', code: 'server-error', status: 500 },
  });
});

test('POST normalizes a variable name to lowercase', async () => {
  setRequest(ROLES.user, ' WhatsApp_Token ');

  expect((await POST(request)).status).toBe(200);
  expect(createLinkVariable).toHaveBeenCalledWith({
    name: 'whatsapp_token',
    value: 'Updated campaign',
  });
});

test('POST rejects an invalid variable name before writing', async () => {
  setRequest(ROLES.user, 'whatsapp-token');

  expect((await POST(request)).status).toBe(400);
  expect(createLinkVariable).not.toHaveBeenCalled();
});

test('POST explains duplicate variable names', async () => {
  vi.mocked(createLinkVariable).mockRejectedValue(new Error('Unique constraint failed'));

  const response = await POST(request);

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: { message: 'That variable already exists.' },
  });
});

test.each([ROLES.viewOnly, ROLES.teamViewOnly, 'unknown'])(
  '%s cannot read or modify variables through the API',
  async role => {
    setRequest(role);

    expect((await GET(request)).status).toBe(401);
    expect((await POST(request)).status).toBe(401);
    expect((await updateVariable(request, context)).status).toBe(401);
    expect((await DELETE(request, context)).status).toBe(401);
    expect(getLinkVariables).not.toHaveBeenCalled();
    expect(getLinkVariable).not.toHaveBeenCalled();
    expect(createLinkVariable).not.toHaveBeenCalled();
    expect(updateLinkVariable).not.toHaveBeenCalled();
    expect(deleteLinkVariable).not.toHaveBeenCalled();
  },
);

test('share-only authentication cannot read variables', async () => {
  vi.mocked(parseRequest).mockResolvedValue({ auth: { shareToken: { linkId: 'link-1' } } });

  expect((await GET(request)).status).toBe(401);
  expect(getLinkVariables).not.toHaveBeenCalled();
});

test('users can change the value without writing the name', async () => {
  setRequest(ROLES.user, ' Campaign ');

  expect((await updateVariable(request, context)).status).toBe(200);
  expect(updateLinkVariable).toHaveBeenCalledWith(variable.id, { value: 'Updated campaign' });
});

test('users cannot rename a variable by submitting a forged request', async () => {
  setRequest(ROLES.user, 'renamed_campaign');

  expect((await updateVariable(request, context)).status).toBe(401);
  expect(updateLinkVariable).not.toHaveBeenCalled();
});

test('administrators can rename variables', async () => {
  setRequest(ROLES.admin, 'renamed_campaign');

  expect((await updateVariable(request, context)).status).toBe(200);
  expect(updateLinkVariable).toHaveBeenCalledWith(variable.id, {
    name: 'renamed_campaign',
    value: 'Updated campaign',
  });
});

test('updating a nonexistent variable returns not found', async () => {
  vi.mocked(getLinkVariable).mockResolvedValue(null);

  expect((await updateVariable(request, context)).status).toBe(404);
  expect(updateLinkVariable).not.toHaveBeenCalled();
});
