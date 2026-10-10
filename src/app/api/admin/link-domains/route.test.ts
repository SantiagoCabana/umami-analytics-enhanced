import { beforeEach, expect, test, vi } from 'vitest';
import { parseRequest } from '@/lib/request';
import { canManageLinkDomains } from '@/permissions';
import { createShortDomain, verifyShortDomain } from '@/queries/prisma';
import { POST } from './route';

vi.mock('@/lib/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('@/permissions', () => ({
  canManageLinkDomains: vi.fn(),
}));

vi.mock('@/queries/prisma', () => ({
  createShortDomain: vi.fn(),
  getShortDomains: vi.fn(),
  verifyShortDomain: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);
const canManageLinkDomainsMock = vi.mocked(canManageLinkDomains);
const createShortDomainMock = vi.mocked(createShortDomain);
const verifyShortDomainMock = vi.mocked(verifyShortDomain);

beforeEach(() => {
  parseRequestMock.mockReset();
  canManageLinkDomainsMock.mockReset();
  createShortDomainMock.mockReset();
  verifyShortDomainMock.mockReset();
  parseRequestMock.mockResolvedValue({ auth: { user: { id: 'admin-1' } }, error: undefined });
  canManageLinkDomainsMock.mockResolvedValue(true);
});

test('POST rejects an invalid hostname with an actionable message', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { hostname: 'https://link.practis.pe', rootRedirectUrl: 'https://practis.pe' },
    error: undefined,
  });

  const response = await POST(
    new Request('http://localhost/api/admin/link-domains', { method: 'POST' }),
  );

  await expect(response.json()).resolves.toEqual({
    error: {
      message: 'Enter a valid hostname without a protocol, path, or port.',
      code: 'bad-request',
      status: 400,
    },
  });
  expect(response.status).toBe(400);
  expect(canManageLinkDomainsMock).not.toHaveBeenCalled();
  expect(createShortDomainMock).not.toHaveBeenCalled();
});

test('POST rejects an invalid root redirect URL with an actionable message', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { hostname: 'link.practis.pe', rootRedirectUrl: 'practis.pe' },
    error: undefined,
  });

  const response = await POST(
    new Request('http://localhost/api/admin/link-domains', { method: 'POST' }),
  );

  await expect(response.json()).resolves.toEqual({
    error: {
      message: 'Enter a valid root redirect URL starting with http:// or https://.',
      code: 'bad-request',
      status: 400,
    },
  });
  expect(response.status).toBe(400);
  expect(createShortDomainMock).not.toHaveBeenCalled();
});

test('POST normalizes and creates a valid domain', async () => {
  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'admin-1' } },
    body: { hostname: ' Link.Practis.pe. ', rootRedirectUrl: 'https://practis.pe' },
    error: undefined,
  });
  createShortDomainMock.mockResolvedValue({ id: 'domain-1' } as any);
  verifyShortDomainMock.mockResolvedValue({ id: 'domain-1', verifiedAt: null } as any);

  const response = await POST(
    new Request('http://localhost/api/admin/link-domains', { method: 'POST' }),
  );

  expect(createShortDomainMock).toHaveBeenCalledWith({
    hostname: 'link.practis.pe',
    rootRedirectUrl: 'https://practis.pe',
  });
  expect(verifyShortDomainMock).toHaveBeenCalledWith('domain-1');
  expect(response.status).toBe(200);
});
