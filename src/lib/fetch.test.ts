import { afterEach, describe, expect, test, vi } from 'vitest';
import { request } from './fetch';

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns a structured error for an empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(request('GET', '/config')).resolves.toEqual({
      ok: false,
      status: 500,
      data: {
        error: {
          message: 'Empty response from /config',
          status: 500,
        },
      },
    });
  });

  test('returns a structured error for a non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })));

    await expect(request('GET', '/config')).resolves.toEqual({
      ok: false,
      status: 502,
      data: {
        error: {
          message: 'Unexpected response from /config',
          status: 502,
        },
      },
    });
  });
});
