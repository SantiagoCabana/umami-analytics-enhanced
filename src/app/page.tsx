import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { RootPageClient } from '@/app/RootPageClient';
import { getBaseDomain, getRequestLinkDomain } from '@/lib/link-domains';
import { findShortDomainByHostname } from '@/queries/prisma';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const hostname = getRequestLinkDomain({ headers: await headers() });
  const baseDomain = getBaseDomain();
  const domain =
    hostname && hostname !== baseDomain ? await findShortDomainByHostname(hostname) : null;

  if (domain) {
    if (!domain.rootRedirectUrl) {
      return notFound();
    }

    redirect(domain.rootRedirectUrl);
  }

  return <RootPageClient />;
}
