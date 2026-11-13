import { expect, test } from 'vitest';
import { isTelemetryDisabled } from './telemetry-policy';

test('Umami telemetry is disabled without explicit opt-in', () => {
  expect(isTelemetryDisabled({})).toBe(true);
  expect(isTelemetryDisabled({ ENABLE_UMAMI_TELEMETRY: '0' })).toBe(true);
  expect(isTelemetryDisabled({ ENABLE_UMAMI_TELEMETRY: '1' })).toBe(false);
});

test('the existing disable setting overrides opt-in', () => {
  expect(isTelemetryDisabled({ ENABLE_UMAMI_TELEMETRY: '1', DISABLE_TELEMETRY: '1' })).toBe(true);
});
