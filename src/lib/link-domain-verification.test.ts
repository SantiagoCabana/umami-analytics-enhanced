import { expect, test, vi } from 'vitest';
import { createToken } from '@/lib/jwt';
import {
  getLinkDomainVerificationHostname,
  isPublicLinkDomainAddress,
} from './link-domain-verification';

vi.mock('@/lib/crypto', () => ({
  secret: () => 'test-secret',
}));

test('allows only public unicast addresses for domain verification', () => {
  expect(isPublicLinkDomainAddress('1.1.1.1')).toBe(true);
  expect(isPublicLinkDomainAddress('2606:4700:4700::1111')).toBe(true);
  expect(isPublicLinkDomainAddress('127.0.0.1')).toBe(false);
  expect(isPublicLinkDomainAddress('10.0.0.1')).toBe(false);
  expect(isPublicLinkDomainAddress('169.254.169.254')).toBe(false);
  expect(isPublicLinkDomainAddress('::1')).toBe(false);
  expect(isPublicLinkDomainAddress('not-an-address')).toBe(false);
});

test('accepts only an unexpired verification challenge for the request hostname', () => {
  const challenge = createToken(
    { type: 'link-domain-verification', hostname: 'go.example.com' },
    'test-secret',
    { expiresIn: '5m' },
  );
  const request = new Request(
    `https://go.example.com/q/_umami-domain-verification?challenge=${challenge}`,
    { headers: { host: 'go.example.com' } },
  );

  expect(getLinkDomainVerificationHostname(request)).toBe('go.example.com');
});

test('rejects a verification challenge for another hostname', () => {
  const challenge = createToken(
    { type: 'link-domain-verification', hostname: 'go.example.com' },
    'test-secret',
    { expiresIn: '5m' },
  );
  const request = new Request(
    `https://other.example.com/q/_umami-domain-verification?challenge=${challenge}`,
    { headers: { host: 'other.example.com' } },
  );

  expect(getLinkDomainVerificationHostname(request)).toBeNull();
});
