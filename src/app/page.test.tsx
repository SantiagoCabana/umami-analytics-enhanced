import { beforeEach, expect, test, vi } from 'vitest';
import RootPage from './page';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/app/RootPageClient', () => ({
  RootPageClient: () => <div>Umami</div>,
}));

vi.mock('@/queries/prisma', () => ({
  findShortDomainByHostname: vi.fn(),
}));

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { findShortDomainByHostname } from '@/queries/prisma';

const headersMock = vi.mocked(headers);
const redirectMock = vi.mocked(redirect);
const findShortDomainByHostnameMock = vi.mocked(findShortDomainByHostname);

beforeEach(() => {
  headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000' }) as any);
  redirectMock.mockReset();
  findShortDomainByHostnameMock.mockReset();
  vi.stubEnv('BASE_DOMAIN', 'localhost');
});

test('renders the app when the primary link host is registered as a short domain', async () => {
  await RootPage();

  expect(findShortDomainByHostnameMock).not.toHaveBeenCalled();
  expect(redirectMock).not.toHaveBeenCalled();
});

test('redirects the root of an additional registered short domain', async () => {
  headersMock.mockResolvedValue(new Headers({ host: 'go.example.com' }) as any);
  findShortDomainByHostnameMock.mockResolvedValue({
    rootRedirectUrl: 'https://example.com',
  } as any);

  await RootPage();

  expect(findShortDomainByHostnameMock).toHaveBeenCalledWith('go.example.com');
  expect(redirectMock).toHaveBeenCalledWith('https://example.com');
});
