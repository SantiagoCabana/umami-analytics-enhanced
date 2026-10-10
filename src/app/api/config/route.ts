import { isRelationalOnly } from '@/lib/db';
import { getBaseDomain } from '@/lib/link-domains';
import { parseRequest } from '@/lib/request';
import { json, serverError } from '@/lib/response';
import { getShortDomainHostnames } from '@/queries/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { error } = await parseRequest(request, null, { skipAuth: true });

  if (error) {
    return error();
  }

  let linkDomains: string[];

  try {
    linkDomains = await getShortDomainHostnames();
  } catch (error) {
    return serverError(error);
  }

  return json({
    cloudMode: !!process.env.CLOUD_MODE,
    faviconUrl: process.env.FAVICON_URL,
    linkDomains,
    baseDomain: getBaseDomain(),
    pixelsUrl: process.env.PIXELS_URL,
    privateMode: !!process.env.PRIVATE_MODE,
    sessionDeletionEnabled: isRelationalOnly(),
    telemetryDisabled: !!process.env.DISABLE_TELEMETRY,
    trackerScriptName: process.env.TRACKER_SCRIPT_NAME,
    updatesDisabled: !!process.env.DISABLE_UPDATES,
  });
}
