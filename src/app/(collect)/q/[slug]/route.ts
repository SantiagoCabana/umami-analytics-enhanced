export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/send/route';
import { getLinkCacheKey, getRequestLinkDomain } from '@/lib/link-domains';
import redis from '@/lib/redis';
import { notFound } from '@/lib/response';
import {
  findLinkByDefaultDomain,
  findLinkByDomain,
  findShortDomainByHostname,
} from '@/queries/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hostname = getRequestLinkDomain(request);
  const domain = hostname ? await findShortDomainByHostname(hostname) : null;

  if (domain && slug === '_umami-domain-verification') {
    return NextResponse.json({ hostname: domain.hostname });
  }

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

  return NextResponse.redirect(link.url);
}
