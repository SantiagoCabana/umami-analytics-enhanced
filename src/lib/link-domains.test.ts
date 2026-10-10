import { describe, expect, test } from 'vitest';
import {
  getBaseDomain,
  getLinkCacheKeys,
  getRequestLinkDomain,
  isValidLinkSlug,
  isValidLinkUrl,
  normalizeAssignedLinkDomains,
  normalizeLinkDomain,
} from './link-domains';

describe('link domains', () => {
  test('normalizes configured hostnames without accepting URLs or ports', () => {
    expect(normalizeLinkDomain(' Link.Practis.pe. ')).toBe('link.practis.pe');
    expect(normalizeLinkDomain('https://link.practis.pe')).toBeNull();
    expect(normalizeLinkDomain('link.practis.pe:3000')).toBeNull();
  });

  test('normalizes assigned domains and removes duplicates', () => {
    expect(normalizeAssignedLinkDomains(['LINK.PRACTIS.PE', 'link.practis.pe'])).toEqual([
      'link.practis.pe',
    ]);
    expect(normalizeAssignedLinkDomains(['unknown.example.com'])).toEqual(['unknown.example.com']);
    expect(normalizeAssignedLinkDomains(['https://link.practis.pe'])).toBeNull();
  });

  test('reads the hostname from a proxied request without its port', () => {
    const request = new Request('http://internal/q/abcdefgh', {
      headers: { 'x-forwarded-host': 'LINK.PRACTIS.PE:3000, internal' },
    });

    expect(getRequestLinkDomain(request)).toBe('link.practis.pe');
  });

  test('normalizes the primary domain from BASE_DOMAIN', () => {
    expect(getBaseDomain('URL.Practis.pe.')).toBe('url.practis.pe');
    expect(getBaseDomain('localhost')).toBe('localhost');
    expect(getBaseDomain('https://url.practis.pe')).toBeNull();
  });

  test('validates public link values and cache keys', () => {
    expect(isValidLinkSlug('abcdefgh')).toBe(true);
    expect(isValidLinkSlug('invalid/slug')).toBe(false);
    expect(isValidLinkUrl('https://example.com/path')).toBe(true);
    expect(isValidLinkUrl('javascript:alert(1)')).toBe(false);
    expect(getLinkCacheKeys('abcdefgh', ['link.practis.pe'])).toEqual([
      'link:abcdefgh',
      'link:link.practis.pe:abcdefgh',
    ]);
  });
});
