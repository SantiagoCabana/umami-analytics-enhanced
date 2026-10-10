import { expect, test } from 'vitest';
import { isPublicLinkDomainAddress } from './link-domain-verification';

test('allows only public unicast addresses for domain verification', () => {
  expect(isPublicLinkDomainAddress('1.1.1.1')).toBe(true);
  expect(isPublicLinkDomainAddress('2606:4700:4700::1111')).toBe(true);
  expect(isPublicLinkDomainAddress('127.0.0.1')).toBe(false);
  expect(isPublicLinkDomainAddress('10.0.0.1')).toBe(false);
  expect(isPublicLinkDomainAddress('169.254.169.254')).toBe(false);
  expect(isPublicLinkDomainAddress('::1')).toBe(false);
  expect(isPublicLinkDomainAddress('not-an-address')).toBe(false);
});
