export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/send/route';
import { getLinkDomainVerificationHostname } from '@/lib/link-domain-verification';
import { getLinkCacheKey, getRequestLinkDomain } from '@/lib/link-domains';
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

  const cacheKey = domain ? getLinkCacheKey(domain.hostname, slug) : `link:${slug}`;
  const queryLink = () =>
    domain ? findLinkByDomain(slug, domain.id) : findLinkByDefaultDomain(slug);

  let link;

  if (redis.enabled) {
    link = await redis.client.fetch(cacheKey, queryLink, 86400);

    if (!link) {
      return notFound();
    }
  } else {
    link = await queryLink();

    if (!link) {
      return notFound();
    }
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
