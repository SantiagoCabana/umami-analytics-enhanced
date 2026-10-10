import { beforeEach, expect, test, vi } from 'vitest';
import { parseRequest } from '@/lib/request';
import { canManageLinkVariables } from '@/permissions';
import { deleteLinkVariable, updateLinkVariable } from '@/queries/prisma';
import { DELETE, POST } from './route';

vi.mock('@/lib/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('@/permissions', () => ({
  canManageLinkVariables: vi.fn(),
}));

vi.mock('@/queries/prisma', () => ({
  deleteLinkVariable: vi.fn(),
  updateLinkVariable: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);
const canManageLinkVariablesMock = vi.mocked(canManageLinkVariables);
const deleteLinkVariableMock = vi.mocked(deleteLinkVariable);
const updateLinkVariableMock = vi.mocked(updateLinkVariable);
const params = { params: Promise.resolve({ variableId: 'variable-1' }) };

beforeEach(() => {
  parseRequestMock.mockReset();
  canManageLinkVariablesMock.mockReset();
  deleteLinkVariableMock.mockReset();
  updateLinkVariableMock.mockReset();
  parseRequestMock.mockResolvedValue({ auth: { user: { id: 'admin-1' } }, error: undefined });
  canManageLinkVariablesMock.mockResolvedValue(true);
});

test('POST normalizes a variable name before updating', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { name: 'Token', value: 'next' },
    error: undefined,
  });
  updateLinkVariableMock.mockResolvedValue({
    id: 'variable-1',
    name: 'token',
    value: 'next',
  } as any);

  const response = await POST(
    new Request('http://localhost/api/admin/link-variables/variable-1', { method: 'POST' }),
    params,
  );

  expect(updateLinkVariableMock).toHaveBeenCalledWith('variable-1', {
    name: 'token',
    value: 'next',
  });
  expect(response.status).toBe(200);
});

test('DELETE returns not found for a missing variable', async () => {
  deleteLinkVariableMock.mockRejectedValue(new Error('Record not found'));

  const response = await DELETE(
    new Request('http://localhost/api/admin/link-variables/variable-1', { method: 'DELETE' }),
    params,
  );

  expect(response.status).toBe(404);
});
