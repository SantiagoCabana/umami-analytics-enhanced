import { beforeEach, expect, test, vi } from 'vitest';
import { parseRequest } from '@/lib/request';
import { canManageLinkDomains } from '@/permissions';
import { deleteShortDomain, updateShortDomain, verifyShortDomain } from '@/queries/prisma';
import { DELETE, POST, PUT } from './route';

vi.mock('@/lib/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('@/permissions', () => ({
  canManageLinkDomains: vi.fn(),
}));

vi.mock('@/queries/prisma', () => ({
  deleteShortDomain: vi.fn(),
  updateShortDomain: vi.fn(),
  verifyShortDomain: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);
const canManageLinkDomainsMock = vi.mocked(canManageLinkDomains);
const deleteShortDomainMock = vi.mocked(deleteShortDomain);
const updateShortDomainMock = vi.mocked(updateShortDomain);
const verifyShortDomainMock = vi.mocked(verifyShortDomain);
const params = { params: Promise.resolve({ domainId: 'domain-1' }) };

beforeEach(() => {
  parseRequestMock.mockReset();
  canManageLinkDomainsMock.mockReset();
  deleteShortDomainMock.mockReset();
  updateShortDomainMock.mockReset();
  verifyShortDomainMock.mockReset();
  parseRequestMock.mockResolvedValue({ auth: { user: { id: 'admin-1' } }, error: undefined });
  canManageLinkDomainsMock.mockResolvedValue(true);
});

test('POST rejects invalid domain updates with an actionable message', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { hostname: 'link.practis.pe', rootRedirectUrl: 'javascript:alert(1)' },
    error: undefined,
  });

  const response = await POST(
    new Request('http://localhost/api/admin/link-domains/domain-1', { method: 'POST' }),
    params,
  );

  await expect(response.json()).resolves.toEqual({
    error: {
      message: 'Enter a valid root redirect URL starting with http:// or https://.',
      code: 'bad-request',
      status: 400,
    },
  });
  expect(response.status).toBe(400);
  expect(updateShortDomainMock).not.toHaveBeenCalled();
});

test('POST normalizes and updates a valid domain', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { hostname: 'LINK.PRACTIS.PE', rootRedirectUrl: 'https://practis.pe' },
    error: undefined,
  });
  updateShortDomainMock.mockResolvedValue({ id: 'domain-1' } as any);
  verifyShortDomainMock.mockResolvedValue({ id: 'domain-1', verifiedAt: null } as any);

  const response = await POST(
    new Request('http://localhost/api/admin/link-domains/domain-1', { method: 'POST' }),
    params,
  );

  expect(updateShortDomainMock).toHaveBeenCalledWith('domain-1', {
    hostname: 'link.practis.pe',
    rootRedirectUrl: 'https://practis.pe',
  });
  expect(verifyShortDomainMock).toHaveBeenCalledWith('domain-1');
  expect(response.status).toBe(200);
});

test('PUT verifies an existing domain', async () => {
  verifyShortDomainMock.mockResolvedValue({ id: 'domain-1', verifiedAt: new Date() } as any);

  const response = await PUT(
    new Request('http://localhost/api/admin/link-domains/domain-1', { method: 'PUT' }),
    params,
  );

  expect(verifyShortDomainMock).toHaveBeenCalledWith('domain-1');
  expect(response.status).toBe(200);
});

test('PUT returns not found when the domain does not exist', async () => {
  verifyShortDomainMock.mockResolvedValue(null);

  const response = await PUT(
    new Request('http://localhost/api/admin/link-domains/domain-1', { method: 'PUT' }),
    params,
  );

  expect(response.status).toBe(404);
});

test('DELETE explains when a domain is still assigned to links', async () => {
  deleteShortDomainMock.mockResolvedValue({ status: 'in-use' });

  const response = await DELETE(
    new Request('http://localhost/api/admin/link-domains/domain-1', { method: 'DELETE' }),
    params,
  );

  await expect(response.json()).resolves.toEqual({
    error: {
      message: 'Remove this domain from its links before deleting it.',
      code: 'bad-request',
      status: 400,
    },
  });
  expect(response.status).toBe(400);
});
