export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/send/route';
import { getLinkDomainVerificationHostname } from '@/lib/link-domain-verification';
import { getBaseDomain, getLinkCacheKey, getRequestLinkDomain } from '@/lib/link-domains';
import {
  getLinkVariableNames,
  isValidLinkDestinationUrl,
  resolveLinkVariables,
} from '@/lib/link-variables';
import redis from '@/lib/redis';
import { notFound } from '@/lib/response';
import {
  findLinkByDefaultDomain,
  findLinkByDomain,
  findShortDomainByHostname,
  getLinkVariablesByNames,
} from '@/queries/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hostname = getRequestLinkDomain(request);

  if (slug === '_umami-domain-verification') {
    const verifiedHostname = getLinkDomainVerificationHostname(request);

    return verifiedHostname
      ? NextResponse.json({
          hostname: verifiedHostname,
          challenge: new URL(request.url).searchParams.get('challenge'),
        })
      : notFound();
  }

  const domain = hostname ? await findShortDomainByHostname(hostname) : null;
  const baseDomain = getBaseDomain();

  if (baseDomain && hostname && hostname !== baseDomain && !domain) {
    return notFound();
  }

  // Links enabled on the default domain are published on every registered
  // additional host as well. Domain-specific assignments remain available for
  // legacy links that are intentionally disabled on the default domain.
  const getDefaultLink = () => findLinkByDefaultDomain(slug);
  const defaultCacheKey = `link:${slug}`;
  let link = redis.enabled
    ? await redis.client.fetch(defaultCacheKey, getDefaultLink, 86400)
    : await getDefaultLink();

  if (!link && domain) {
    const getDomainLink = () => findLinkByDomain(slug, domain.id);
    const domainCacheKey = getLinkCacheKey(domain.hostname, slug);

    link = redis.enabled
      ? await redis.client.fetch(domainCacheKey, getDomainLink, 86400)
      : await getDomainLink();
  }

  if (!link) {
    return notFound();
  }

  const payload = {
    type: 'event',
    payload: {
      link: link.id,
      url: request.url,
      referrer: request.headers.get('referer') || undefined,
    },
  };

  const req = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(payload),
  });

  await POST(req);

  const variables = await getLinkVariablesByNames(getLinkVariableNames(link.url));
  const destination = resolveLinkVariables(
    link.url,
    Object.fromEntries(variables.map(variable => [variable.name, variable.value])),
  );

  return isValidLinkDestinationUrl(destination) ? NextResponse.redirect(destination) : notFound();
}
