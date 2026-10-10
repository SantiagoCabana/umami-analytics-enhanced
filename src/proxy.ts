import { type NextRequest, NextResponse } from 'next/server';
import { getContentSecurityPolicy } from '@/lib/csp';
import { getBaseDomain, getRequestLinkDomain } from '@/lib/link-domains';
import { matchesConfiguredPath } from '@/lib/match-configured-path';
import { isAllowedShortDomainPath } from '@/lib/short-domain-routes';
import { findShortDomainByHostname } from '@/queries/prisma';

export const config = {
  matcher: '/:path*',
};

const TRACKER_PATH = '/script.js';
const RECORDER_PATH = '/recorder.js';
const COLLECT_PATH = '/api/send';
const LOGIN_PATH = '/login';
const BASE_PATH = process.env.BASE_PATH || '';
const apiHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, POST, PUT',
  'Access-Control-Max-Age': process.env.CORS_MAX_AGE || '86400',
  'Cache-Control': 'no-cache',
};

const trackerHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=86400, must-revalidate',
};

const contentSecurityPolicy = getContentSecurityPolicy();

function customCollectEndpoint(request: NextRequest) {
  const collectEndpoint = process.env.COLLECT_API_ENDPOINT;

  if (collectEndpoint) {
    const url = request.nextUrl.clone();

    if (matchesConfiguredPath(url.pathname, collectEndpoint, BASE_PATH)) {
      url.pathname = COLLECT_PATH;
      return NextResponse.rewrite(url, { headers: apiHeaders });
    }
  }
}

function customScriptName(request: NextRequest) {
  const scriptName = process.env.TRACKER_SCRIPT_NAME;

  if (scriptName) {
    const url = request.nextUrl.clone();
    const names = scriptName.split(',').map(name => name.trim().replace(/^\/+/, ''));

    if (names.find(name => matchesConfiguredPath(url.pathname, name, BASE_PATH))) {
      url.pathname = TRACKER_PATH;
      return NextResponse.rewrite(url, { headers: trackerHeaders });
    }
  }
}

function customScriptUrl(request: NextRequest) {
  const scriptUrl = process.env.TRACKER_SCRIPT_URL;

  if (scriptUrl && matchesConfiguredPath(request.nextUrl.pathname, TRACKER_PATH, BASE_PATH)) {
    return NextResponse.rewrite(scriptUrl, { headers: trackerHeaders });
  }
}

function applyStaticScriptHeaders(request: NextRequest, response: NextResponse) {
  if (
    matchesConfiguredPath(request.nextUrl.pathname, TRACKER_PATH, BASE_PATH) ||
    matchesConfiguredPath(request.nextUrl.pathname, RECORDER_PATH, BASE_PATH)
  ) {
    Object.entries(trackerHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
}

function disableLogin(request: NextRequest) {
  const loginDisabled = process.env.DISABLE_LOGIN;

  if (loginDisabled && matchesConfiguredPath(request.nextUrl.pathname, LOGIN_PATH, BASE_PATH)) {
    return new NextResponse('Access denied', { status: 403 });
  }
}

async function restrictShortDomain(request: NextRequest) {
  const hostname = getRequestLinkDomain(request);

  if (!hostname || hostname === getBaseDomain()) {
    return;
  }

  const domain = await findShortDomainByHostname(hostname);

  if (
    domain &&
    !isAllowedShortDomainPath(request.nextUrl.pathname, {
      basePath: BASE_PATH,
      collectApiEndpoint: process.env.COLLECT_API_ENDPOINT,
      trackerScriptName: process.env.TRACKER_SCRIPT_NAME,
    })
  ) {
    return new NextResponse('Not found', { status: 404 });
  }
}

export default async function proxy(req: NextRequest) {
  let res = await restrictShortDomain(req);

  if (res) {
    res.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return res;
  }

  const fns = [customCollectEndpoint, customScriptName, customScriptUrl, disableLogin];

  for (const fn of fns) {
    res = fn(req);
    if (res) {
      break;
    }
  }

  res ??= NextResponse.next();
  applyStaticScriptHeaders(req, res);

  res.headers.set('Content-Security-Policy', contentSecurityPolicy);

  return res;
}
