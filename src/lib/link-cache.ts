import redis from '@/lib/redis';
import { getLinkCacheKeys } from './link-domains';

export async function invalidateLinkCache(slug: string, domains: string[]) {
  if (!redis.enabled) {
    return;
  }

  await Promise.all(getLinkCacheKeys(slug, domains).map(key => redis.client.del(key)));
}
