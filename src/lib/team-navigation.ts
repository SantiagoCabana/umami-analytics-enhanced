const TEAM_PREFIX_REGEX = /^\/teams\/[a-f0-9-]+(?=\/|$)/i;

const scopedViews = ['/boards', '/websites', '/links', '/pixels'] as const;

function getViewPath(pathname: string) {
  const normalizedPathname = pathname.replace(TEAM_PREFIX_REGEX, '') || '/';

  return scopedViews.find(
    path => normalizedPathname === path || normalizedPathname.startsWith(`${path}/`),
  );
}

/**
 * Returns the collection route for a user or team context.
 * Resource identifiers, sub-routes, and query parameters are intentionally not preserved.
 */
export function getTeamNavigationPath(pathname: string, targetTeamId?: string) {
  const viewPath = getViewPath(pathname) ?? '/websites';

  return targetTeamId ? `/teams/${targetTeamId}${viewPath}` : viewPath;
}
