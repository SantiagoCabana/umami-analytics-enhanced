import type { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

const shortDomainInclude = {
  _count: {
    select: {
      links: true,
    },
  },
} satisfies Prisma.ShortDomainInclude;

export async function findShortDomainByHostname(hostname: string) {
  return prisma.client.shortDomain.findUnique({
    where: { hostname },
    include: shortDomainInclude,
  });
}

export async function findShortDomain(shortDomainId: string) {
  return prisma.client.shortDomain.findUnique({
    where: { id: shortDomainId },
    include: shortDomainInclude,
  });
}

export async function getShortDomains() {
  return prisma.client.shortDomain.findMany({
    include: shortDomainInclude,
    orderBy: { hostname: 'asc' },
  });
}

export async function getShortDomainHostnames() {
  const domains = await prisma.client.shortDomain.findMany({
    select: { hostname: true },
    orderBy: { hostname: 'asc' },
  });

  return domains.map(({ hostname }) => hostname);
}

export async function getShortDomainIds(hostnames: string[]) {
  if (hostnames.length === 0) {
    return [];
  }

  const domains = await prisma.client.shortDomain.findMany({
    where: { hostname: { in: hostnames } },
    select: { id: true, hostname: true },
  });

  if (domains.length !== hostnames.length) {
    return null;
  }

  const ids = new Map(domains.map(domain => [domain.hostname, domain.id]));

  return hostnames.map(hostname => ids.get(hostname) as string);
}

export async function createShortDomain(data: { hostname: string; rootRedirectUrl: string }) {
  return prisma.client.shortDomain.create({
    data: {
      id: uuid(),
      ...data,
    },
    include: shortDomainInclude,
  });
}

export async function updateShortDomain(
  shortDomainId: string,
  data: { hostname: string; rootRedirectUrl: string },
) {
  return prisma.client.shortDomain.update({
    where: { id: shortDomainId },
    data,
    include: shortDomainInclude,
  });
}

export async function deleteShortDomain(shortDomainId: string) {
  const domain = await prisma.client.shortDomain.findUnique({
    where: { id: shortDomainId },
    select: { id: true },
  });

  if (!domain) {
    return { status: 'not-found' as const };
  }

  const linkCount = await prisma.client.linkDomain.count({ where: { domainId: shortDomainId } });

  if (linkCount > 0) {
    return { status: 'in-use' as const };
  }

  const deleted = await prisma.client.shortDomain.delete({ where: { id: shortDomainId } });

  return { status: 'deleted' as const, domain: deleted };
}
