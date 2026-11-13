import { afterEach, expect, test, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllEnvs());

test('production telemetry is inactive by default', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('ENABLE_UMAMI_TELEMETRY', undefined);
  vi.stubEnv('DISABLE_TELEMETRY', undefined);
  vi.stubEnv('PRIVATE_MODE', undefined);
  expect(await (await GET()).text()).toBe('/* telemetry disabled */');
});

test('telemetry requires an explicit opt-in and respects private mode', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('ENABLE_UMAMI_TELEMETRY', '1');
  vi.stubEnv('DISABLE_TELEMETRY', undefined);
  vi.stubEnv('PRIVATE_MODE', undefined);
  expect(await (await GET()).text()).toContain('https://i.umami.is/a.png');
  vi.stubEnv('PRIVATE_MODE', '1');
  expect(await (await GET()).text()).toBe('/* telemetry disabled */');
});
