import { beforeEach, expect, test, vi } from 'vitest';
import { parseRequest } from '@/lib/request';
import { canManageLinkVariables } from '@/permissions';
import { createLinkVariable, getLinkVariables } from '@/queries/prisma';
import { GET, POST } from './route';

vi.mock('@/lib/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('@/permissions', () => ({
  canManageLinkVariables: vi.fn(),
}));

vi.mock('@/queries/prisma', () => ({
  createLinkVariable: vi.fn(),
  getLinkVariables: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);
const canManageLinkVariablesMock = vi.mocked(canManageLinkVariables);
const createLinkVariableMock = vi.mocked(createLinkVariable);
const getLinkVariablesMock = vi.mocked(getLinkVariables);

beforeEach(() => {
  parseRequestMock.mockReset();
  canManageLinkVariablesMock.mockReset();
  createLinkVariableMock.mockReset();
  getLinkVariablesMock.mockReset();
  parseRequestMock.mockResolvedValue({ auth: { user: { id: 'admin-1' } }, error: undefined });
  canManageLinkVariablesMock.mockResolvedValue(true);
});

test('GET returns global link variables to administrators', async () => {
  getLinkVariablesMock.mockResolvedValue([
    { id: 'variable-1', name: 'token', value: 'abc' },
  ] as any);

  const response = await GET(new Request('http://localhost/api/admin/link-variables'));

  await expect(response.json()).resolves.toEqual([
    { id: 'variable-1', name: 'token', value: 'abc' },
  ]);
});

test('GET returns a JSON server error when loading variables fails', async () => {
  getLinkVariablesMock.mockRejectedValue(new Error('Database unavailable'));

  const response = await GET(new Request('http://localhost/api/admin/link-variables'));

  await expect(response.json()).resolves.toMatchObject({
    error: { message: 'Server error', code: 'server-error', status: 500 },
  });
});

test('POST normalizes a variable name to lowercase', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { name: ' WhatsApp_Token ', value: 'abc' },
    error: undefined,
  });
  createLinkVariableMock.mockResolvedValue({
    id: 'variable-1',
    name: 'whatsapp_token',
    value: 'abc',
  } as any);

  const response = await POST(
    new Request('http://localhost/api/admin/link-variables', { method: 'POST' }),
  );

  expect(createLinkVariableMock).toHaveBeenCalledWith({ name: 'whatsapp_token', value: 'abc' });
  expect(response.status).toBe(200);
});

test('POST rejects an invalid variable name before writing', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { name: 'whatsapp-token', value: 'abc' },
    error: undefined,
  });

  const response = await POST(
    new Request('http://localhost/api/admin/link-variables', { method: 'POST' }),
  );

  expect(response.status).toBe(400);
  expect(createLinkVariableMock).not.toHaveBeenCalled();
});

test('POST explains duplicate variable names', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { name: 'token', value: 'abc' },
    error: undefined,
  });
  createLinkVariableMock.mockRejectedValue(new Error('Unique constraint failed'));

  const response = await POST(
    new Request('http://localhost/api/admin/link-variables', { method: 'POST' }),
  );

  await expect(response.json()).resolves.toMatchObject({
    error: { message: 'That variable already exists.' },
  });
});
