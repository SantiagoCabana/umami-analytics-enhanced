type ShortDomainRouteOptions = {
  basePath?: string;
  collectApiEndpoint?: string;
  trackerScriptName?: string;
};

function removeBasePath(pathname: string, basePath?: string) {
  const normalizedBasePath = basePath?.replace(/^\/+|\/+$/g, '');

  if (!normalizedBasePath) {
    return pathname;
  }

  const prefix = `/${normalizedBasePath}`;

  return pathname === prefix
    ? '/'
    : pathname.startsWith(`${prefix}/`)
      ? pathname.slice(prefix.length)
      : pathname;
}

function matchesPath(pathname: string, configuredPath?: string) {
  return !!configuredPath && pathname === `/${configuredPath.replace(/^\/+/, '')}`;
}

// Short-link hosts deliberately expose only their public collection and redirect endpoints.
export function isAllowedShortDomainPath(
  pathname: string,
  { basePath, collectApiEndpoint, trackerScriptName }: ShortDomainRouteOptions = {},
) {
  const path = removeBasePath(pathname, basePath);
  const trackerPaths = trackerScriptName?.split(',').map(name => name.trim()) || [];

  return (
    path === '/' ||
    path.startsWith('/q/') ||
    path === '/script.js' ||
    path === '/recorder.js' ||
    path === '/api/send' ||
    path === '/api/batch' ||
    path === '/api/record' ||
    /^\/api\/websites\/[^/]+\/recorder$/.test(path) ||
    /^\/p\/[^/]+$/.test(path) ||
    matchesPath(path, collectApiEndpoint) ||
    trackerPaths.some(name => matchesPath(path, name))
  );
}
