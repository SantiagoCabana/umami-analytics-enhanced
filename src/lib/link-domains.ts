import { DOMAIN_REGEX } from './constants';

export const LINK_SLUG_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,99}$/;

export function normalizeLinkDomain(value?: string | null) {
  const domain = value?.trim().toLowerCase().replace(/\.$/, '');

  return domain && !/[/:?#\s]/.test(domain) && DOMAIN_REGEX.test(domain) ? domain : null;
}

export function normalizeAssignedLinkDomains(domains: string[]) {
  const normalized = domains.map(normalizeLinkDomain);

  if (normalized.some(domain => !domain)) {
    return null;
  }

  return Array.from(new Set(normalized));
}

export function getRequestLinkDomain(request: Pick<Request, 'headers'>) {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host'))
    ?.split(',')[0]
    ?.trim();

  if (!host) {
    return null;
  }

  try {
    return normalizeLinkDomain(new URL(`http://${host}`).hostname);
  } catch {
    return null;
  }
}

export function getBaseDomain(value = process.env.BASE_DOMAIN) {
  return normalizeLinkDomain(value);
}

export function isValidLinkUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidLinkSlug(slug: string) {
  return LINK_SLUG_REGEX.test(slug);
}

export function getLinkCacheKey(domain: string, slug: string) {
  return `link:${domain}:${slug}`;
}

export function getLinkCacheKeys(slug: string, domains: string[]) {
  return [`link:${slug}`, ...domains.map(domain => getLinkCacheKey(domain, slug))];
}
