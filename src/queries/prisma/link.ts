import type { Prisma } from '@/generated/prisma/client';
import { invalidateLinkCache } from '@/lib/link-cache';
import prisma from '@/lib/prisma';
import { sanitizeSortFilters } from '@/lib/sort';
import type { PageResult, QueryFilters } from '@/lib/types';

const LINK_SORT_FIELDS = ['name', 'slug', 'url', 'createdAt', 'updatedAt'] as const;
const linkInclude = {
  domains: {
    include: {
      domain: true,
    },
  },
} satisfies Prisma.LinkInclude;

export type LinkWithDomains = Prisma.LinkGetPayload<{ include: typeof linkInclude }>;
export type LinkInput = Omit<Prisma.LinkUncheckedCreateInput, 'domains'> & { domains?: string[] };
export type LinkUpdateInput = {
  name?: string;
  url?: string;
  slug?: string;
  isDefaultDomainEnabled?: boolean;
  domains?: string[];
};

export async function findLink(criteria: Prisma.LinkFindUniqueArgs) {
  return prisma.client.link.findUnique({ ...criteria, include: linkInclude });
}

export async function findLinkByDomain(slug: string, domainId: string) {
  return prisma.client.link.findFirst({
    where: {
      slug,
      deletedAt: null,
      domains: {
        some: { domainId },
      },
    },
    include: linkInclude,
  });
}

export async function findLinkByDefaultDomain(slug: string) {
  return prisma.client.link.findFirst({
    where: {
      slug,
      deletedAt: null,
      isDefaultDomainEnabled: true,
    },
    include: linkInclude,
  });
}

export async function getLink(linkId: string) {
  return findLink({
    where: {
      id: linkId,
    },
  });
}

export async function getLinks(
  criteria: Prisma.LinkFindManyArgs,
  filters: QueryFilters = {},
): Promise<PageResult<LinkWithDomains[]>> {
  const sortFilters = sanitizeSortFilters(filters, LINK_SORT_FIELDS);
  const { search } = sortFilters;
  const { getSearchParameters, pagedQuery } = prisma;

  const where: Prisma.LinkWhereInput = {
    ...criteria.where,
    ...getSearchParameters(search, [
      { name: 'contains' },
      { url: 'contains' },
      { slug: 'contains' },
    ]),
  };

  return pagedQuery('link', { ...criteria, where, include: linkInclude }, sortFilters);
}

export async function getUserLinks(userId: string, filters?: QueryFilters) {
  return getLinks(
    {
      where: {
        userId,
        deletedAt: null,
      },
    },
    filters,
  );
}

export async function getTeamLinks(teamId: string, filters?: QueryFilters) {
  return getLinks(
    {
      where: {
        teamId,
      },
    },
    filters,
  );
}

export async function createLink({ domains = [], ...data }: LinkInput) {
  return prisma.client.link.create({
    data: {
      ...data,
      domains: {
        create: domains.map(domainId => ({ domainId })),
      },
    },
    include: linkInclude,
  });
}

export async function updateLink(linkId: string, { domains, ...data }: LinkUpdateInput) {
  const transaction = prisma.transaction as <T>(input: (tx: any) => Promise<T>) => Promise<T>;
  const { previous, link } = await transaction(async tx => {
    const previous = await tx.link.findUnique({ where: { id: linkId }, include: linkInclude });
    const link = await tx.link.update({
      where: { id: linkId },
      data: {
        ...data,
        ...(domains === undefined
          ? {}
          : {
              domains: {
                deleteMany: {},
                create: domains.map(domainId => ({ domainId })),
              },
            }),
      },
      include: linkInclude,
    });

    return { previous, link };
  });

  if (previous) {
    await invalidateLinkCache(
      previous.slug,
      previous.domains.map(({ domain }) => domain.hostname),
    );
  }
  await invalidateLinkCache(
    link.slug,
    link.domains.map(({ domain }) => domain.hostname),
  );

  return link;
}

export async function deleteLink(linkId: string) {
  const transaction = prisma.transaction as <T>(input: (tx: any) => Promise<T>) => Promise<T>;
  const link = await transaction(async tx => {
    const link = await tx.link.findUnique({ where: { id: linkId }, include: linkInclude });

    await tx.linkDomain.deleteMany({ where: { linkId } });
    await tx.link.delete({ where: { id: linkId } });

    return link;
  });

  if (link) {
    await invalidateLinkCache(
      link.slug,
      link.domains.map(({ domain }) => domain.hostname),
    );
  }

  return link;
}
