import { describe, expect, test } from 'vitest';
import { isAllowedShortDomainPath } from './short-domain-routes';

describe('short domain routes', () => {
  test('allows only public tracker, replay, pixel, collector, and short-link routes', () => {
    expect(isAllowedShortDomainPath('/q/abcdefgh')).toBe(true);
    expect(isAllowedShortDomainPath('/q/_umami-domain-verification')).toBe(true);
    expect(isAllowedShortDomainPath('/script.js')).toBe(true);
    expect(isAllowedShortDomainPath('/recorder.js')).toBe(true);
    expect(isAllowedShortDomainPath('/api/send')).toBe(true);
    expect(isAllowedShortDomainPath('/api/batch')).toBe(true);
    expect(isAllowedShortDomainPath('/api/record')).toBe(true);
    expect(isAllowedShortDomainPath('/api/websites/website-1/recorder')).toBe(true);
    expect(isAllowedShortDomainPath('/p/abcdefgh')).toBe(true);
    expect(isAllowedShortDomainPath('/admin/domains')).toBe(false);
    expect(isAllowedShortDomainPath('/login')).toBe(false);
    expect(isAllowedShortDomainPath('/api/websites')).toBe(false);
  });

  test('supports configured collection and tracker paths under a base path', () => {
    const options = {
      basePath: '/umami',
      collectApiEndpoint: '/collect',
      trackerScriptName: 'analytics.js, track.js',
    };

    expect(isAllowedShortDomainPath('/umami/collect', options)).toBe(true);
    expect(isAllowedShortDomainPath('/umami/analytics.js', options)).toBe(true);
    expect(isAllowedShortDomainPath('/umami/track.js', options)).toBe(true);
    expect(isAllowedShortDomainPath('/umami/recorder.js', options)).toBe(true);
  });
});
