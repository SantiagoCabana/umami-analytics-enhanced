import { beforeEach, describe, expect, test, vi } from 'vitest';
import { deleteLink, updateLink } from './link';

const { findUniqueMock, updateMock, deleteMock, deleteDomainsMock, redisDelMock, redisState } =
  vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
    deleteDomainsMock: vi.fn(),
    redisDelMock: vi.fn(),
    redisState: { enabled: true },
  }));

vi.mock('@/lib/prisma', () => ({
  default: {
    transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        link: { findUnique: findUniqueMock, update: updateMock, delete: deleteMock },
        linkDomain: { deleteMany: deleteDomainsMock },
      }),
    client: {
      link: {
        findUnique: findUniqueMock,
        update: updateMock,
        delete: deleteMock,
      },
    },
  },
}));

vi.mock('@/lib/redis', () => ({
  default: {
    get enabled() {
      return redisState.enabled;
    },
    client: {
      del: redisDelMock,
    },
  },
}));

describe('link cache invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisState.enabled = true;
  });

  test('updateLink drops the cached link under the old and the new slug', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'l1',
      slug: 'old',
      domains: [{ domain: { hostname: 'old.example' } }],
    });
    updateMock.mockResolvedValue({
      id: 'l1',
      slug: 'new',
      domains: [{ domain: { hostname: 'new.example' } }],
      url: 'https://example.com',
    });

    await updateLink('l1', { slug: 'new' });

    expect(redisDelMock).toHaveBeenCalledWith('link:old');
    expect(redisDelMock).toHaveBeenCalledWith('link:new');
    expect(redisDelMock).toHaveBeenCalledWith('link:old.example:old');
    expect(redisDelMock).toHaveBeenCalledWith('link:new.example:new');
    expect(redisDelMock).toHaveBeenCalledTimes(4);
  });

  test('updateLink invalidates the unchanged slug', async () => {
    findUniqueMock.mockResolvedValue({ id: 'l1', slug: 'same', domains: [] });
    updateMock.mockResolvedValue({
      id: 'l1',
      slug: 'same',
      domains: [],
      url: 'https://example.com/2',
    });

    await updateLink('l1', { url: 'https://example.com/2' });

    expect(redisDelMock).toHaveBeenCalledTimes(2);
    expect(redisDelMock).toHaveBeenCalledWith('link:same');
  });

  test('deleteLink drops the cached link', async () => {
    findUniqueMock.mockResolvedValue({ id: 'l1', slug: 'gone', domains: [] });

    await deleteLink('l1');

    expect(redisDelMock).toHaveBeenCalledWith('link:gone');
  });

  test('nothing is touched in Redis when it is not enabled', async () => {
    redisState.enabled = false;
    findUniqueMock.mockResolvedValue({ id: 'l1', slug: 'x', domains: [] });
    updateMock.mockResolvedValue({ id: 'l1', slug: 'x', domains: [] });
    deleteMock.mockResolvedValue({ id: 'l1', slug: 'x' });

    await updateLink('l1', { url: 'https://example.com' });
    await deleteLink('l1');

    expect(redisDelMock).not.toHaveBeenCalled();
  });
});
