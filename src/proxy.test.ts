import { NextRequest } from 'next/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { findShortDomainByHostname } from '@/queries/prisma';
import proxy from './proxy';

vi.mock('@/queries/prisma', () => ({
  findShortDomainByHostname: vi.fn(),
}));

const findShortDomainByHostnameMock = vi.mocked(findShortDomainByHostname);

const request = (pathname: string, hostname: string) =>
  new NextRequest(`https://${hostname}${pathname}`, { headers: { host: hostname } });

beforeEach(() => {
  process.env.BASE_DOMAIN = 'url.practis.pe';
  findShortDomainByHostnameMock.mockReset();
});

test('blocks application routes on a registered short domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue({ id: 'domain-1' } as any);

  const response = await proxy(request('/admin/domains', 'link.practis.pe'));

  expect(response.status).toBe(404);
});

test('allows public tracker, replay, pixel, collector, and link routes on a registered short domain', async () => {
  findShortDomainByHostnameMock.mockResolvedValue({ id: 'domain-1' } as any);

  await expect(proxy(request('/script.js', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(proxy(request('/recorder.js', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(proxy(request('/api/send', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(proxy(request('/api/batch', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(proxy(request('/api/record', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(
    proxy(request('/api/websites/website-1/recorder', 'link.practis.pe')),
  ).resolves.not.toMatchObject({ status: 404 });
  await expect(proxy(request('/p/abcdefgh', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
  await expect(proxy(request('/q/abcdefgh', 'link.practis.pe'))).resolves.not.toMatchObject({
    status: 404,
  });
});

test('does not restrict the primary application domain', async () => {
  const response = await proxy(request('/admin/domains', 'url.practis.pe'));

  expect(response.status).not.toBe(404);
  expect(findShortDomainByHostnameMock).not.toHaveBeenCalled();
});
