import { beforeEach, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/send/route';
import { getLinkDomainVerificationHostname } from '@/lib/link-domain-verification';
import redis from '@/lib/redis';
import {
  findLinkByDefaultDomain,
  findLinkByDomain,
  findShortDomainByHostname,
  getLinkVariablesByNames,
} from '@/queries/prisma';
import { GET } from './route';

vi.mock('@/app/api/send/route', () => ({
  POST: vi.fn(),
}));

vi.mock('@/lib/link-domain-verification', () => ({
  getLinkDomainVerificationHostname: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  default: {
    enabled: false,
    client: { fetch: vi.fn() },
  },
}));

vi.mock('@/queries/prisma', () => ({
  findLinkByDefaultDomain: vi.fn(),
  findLinkByDomain: vi.fn(),
  findShortDomainByHostname: vi.fn(),
  getLinkVariablesByNames: vi.fn(),
}));

const findLinkByDefaultDomainMock = vi.mocked(findLinkByDefaultDomain);
const findLinkByDomainMock = vi.mocked(findLinkByDomain);
const findShortDomainByHostnameMock = vi.mocked(findShortDomainByHostname);
const getLinkVariablesByNamesMock = vi.mocked(getLinkVariablesByNames);
const postMock = vi.mocked(POST);
const getLinkDomainVerificationHostnameMock = vi.mocked(getLinkDomainVerificationHostname);

const params = { params: Promise.resolve({ slug: 'abcdefgh' }) };
const verificationParams = { params: Promise.resolve({ slug: '_umami-domain-verification' }) };
const request = (hostname = 'app.example.com') =>
  new Request(`https://${hostname}/q/abcdefgh`, { headers: { host: hostname } });
const link = { id: 'link-1', url: 'https://destination.example.com' } as any;
const variable = (name: string) => `\${${name}}`;

beforeEach(() => {
  findLinkByDefaultDomainMock.mockReset();
  findLinkByDomainMock.mockReset();
  findShortDomainByHostnameMock.mockReset();
  getLinkVariablesByNamesMock.mockReset();
  getLinkVariablesByNamesMock.mockResolvedValue([]);
  postMock.mockReset();
  getLinkDomainVerificationHostnameMock.mockReset();
  redis.enabled = false;
});

test('redirects a link from an assigned custom domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue({
    id: 'domain-1',
    hostname: 'go.example.com',
  } as any);
  findLinkByDomainMock.mockResolvedValue(link);

  const response = await GET(request('go.example.com'), params);

  expect(findLinkByDomainMock).toHaveBeenCalledWith('abcdefgh', 'domain-1');
  expect(findLinkByDefaultDomainMock).not.toHaveBeenCalled();
  expect(response.headers.get('location')).toBe('https://destination.example.com/');
});

test('resolves destination variables on each redirect', async () => {
  findShortDomainByHostnameMock.mockResolvedValue(null);
  findLinkByDefaultDomainMock.mockResolvedValue({
    ...link,
    url: `https://destination.example.com/?token=${variable('TOKEN')}`,
  });
  getLinkVariablesByNamesMock.mockResolvedValue([{ name: 'token', value: 'a&b c' }] as any);

  const response = await GET(request(), params);

  expect(getLinkVariablesByNamesMock).toHaveBeenCalledWith(['token']);
  expect(response.headers.get('location')).toBe('https://destination.example.com/?token=a%26b%20c');
});

test('keeps undefined destination variables literal', async () => {
  findShortDomainByHostnameMock.mockResolvedValue(null);
  findLinkByDefaultDomainMock.mockResolvedValue({
    ...link,
    url: `https://destination.example.com/?token=${variable('missing')}`,
  });

  const response = await GET(request(), params);

  expect(response.headers.get('location')).toBe(
    `https://destination.example.com/?token=${variable('missing')}`,
  );
});

test('returns the signed domain verification document before the domain is registered', async () => {
  getLinkDomainVerificationHostnameMock.mockReturnValue('go.example.com');

  const response = await GET(
    new Request('https://go.example.com/q/_umami-domain-verification?challenge=challenge-1', {
      headers: { host: 'go.example.com' },
    }),
    verificationParams,
  );

  await expect(response.json()).resolves.toEqual({
    hostname: 'go.example.com',
    challenge: 'challenge-1',
  });
  expect(findShortDomainByHostnameMock).not.toHaveBeenCalled();
  expect(findLinkByDomainMock).not.toHaveBeenCalled();
  expect(postMock).not.toHaveBeenCalled();
});

test('rejects an invalid domain verification challenge', async () => {
  getLinkDomainVerificationHostnameMock.mockReturnValue(null);

  const response = await GET(
    new Request('https://go.example.com/q/_umami-domain-verification', {
      headers: { host: 'go.example.com' },
    }),
    verificationParams,
  );

  expect(response.status).toBe(404);
});

test('redirects a link without custom domains from the default domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue(null);
  findLinkByDefaultDomainMock.mockResolvedValue(link);

  const response = await GET(request(), params);

  expect(findLinkByDefaultDomainMock).toHaveBeenCalledWith('abcdefgh');
  expect(findLinkByDomainMock).not.toHaveBeenCalled();
  expect(response.headers.get('location')).toBe('https://destination.example.com/');
});

test('does not redirect a link disabled on the default domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue(null);
  findLinkByDefaultDomainMock.mockResolvedValue(null);

  const response = await GET(request(), params);

  expect(findLinkByDefaultDomainMock).toHaveBeenCalledWith('abcdefgh');
  expect(response.status).toBe(404);
  expect(postMock).not.toHaveBeenCalled();
});

test('does not redirect a link with no enabled domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue(null);
  findLinkByDefaultDomainMock.mockResolvedValue(null);

  const response = await GET(request(), params);

  expect(response.status).toBe(404);
  expect(postMock).not.toHaveBeenCalled();
});
