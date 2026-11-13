import { isRelationalOnly } from '@/lib/db';
import { getBaseDomain } from '@/lib/link-domains';
import { isTelemetryDisabled } from '@/lib/telemetry-policy';

export type Config = {
  baseDomain?: string;
  cloudMode: boolean;
  faviconUrl?: string;
  linksUrl?: string;
  pixelsUrl?: string;
  privateMode: boolean;
  sessionDeletionEnabled: boolean;
  telemetryDisabled: boolean;
  trackerScriptName?: string;
  updatesDisabled: boolean;
};

/**
 * Server-side only. Reads runtime environment values that the client needs.
 * Must be called at request time (not build time) so Docker/runtime env is honored.
 */
export function getConfig(): Config {
  return {
    baseDomain: getBaseDomain(),
    cloudMode: !!process.env.CLOUD_MODE,
    faviconUrl: process.env.FAVICON_URL,
    linksUrl: process.env.LINKS_URL,
    pixelsUrl: process.env.PIXELS_URL,
    privateMode: !!process.env.PRIVATE_MODE,
    sessionDeletionEnabled: isRelationalOnly(),
    telemetryDisabled: isTelemetryDisabled(),
    trackerScriptName: process.env.TRACKER_SCRIPT_NAME,
    updatesDisabled: !!process.env.DISABLE_UPDATES,
  };
}
