import { z } from 'zod';
import { uuid } from '@/lib/crypto';
import { isValidLinkSlug, normalizeAssignedLinkDomains } from '@/lib/link-domains';
import { isValidLinkDestinationUrl } from '@/lib/link-variables';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { badRequest, json, serverError, unauthorized } from '@/lib/response';
import { pagingParams, searchParams, sortingParams } from '@/lib/schema';
import { canCreateTeamWebsite, canCreateWebsite } from '@/permissions';
import { createLink, getShortDomainIds, getUserLinks } from '@/queries/prisma';

export async function GET(request: Request) {
  const schema = z.object({
    ...pagingParams,
    ...searchParams,
    ...sortingParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const filters = await getQueryFilters(query);

  const links = await getUserLinks(auth.user.id, filters);

  return json(links);
}

export async function POST(request: Request) {
  const schema = z.object({
    name: z.string().max(100),
    url: z.string().max(2000).refine(isValidLinkDestinationUrl),
    slug: z.string().refine(isValidLinkSlug),
    isDefaultDomainEnabled: z.boolean().optional(),
    domains: z.array(z.string()).max(20).optional(),
    teamId: z.string().nullable().optional(),
    id: z.uuid().nullable().optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { id, name, url, slug, teamId, domains, isDefaultDomainEnabled = true } = body;
  const assignedDomains = normalizeAssignedLinkDomains(domains || []);
  const assignedDomainIds = assignedDomains ? await getShortDomainIds(assignedDomains) : null;

  if (!assignedDomainIds) {
    return badRequest({ message: 'One or more selected domains are not available.' });
  }

  if ((teamId && !(await canCreateTeamWebsite(auth, teamId))) || !(await canCreateWebsite(auth))) {
    return unauthorized();
  }

  const data: any = {
    id: id ?? uuid(),
    name,
    url,
    slug,
    isDefaultDomainEnabled,
    teamId,
  };

  if (!teamId) {
    data.userId = auth.user.id;
  }

  try {
    const result = await createLink({ ...data, domains: assignedDomainIds });

    return json(result);
  } catch (e: any) {
    if (e.message?.toLowerCase().includes('unique constraint') && e.message.includes('slug')) {
      return badRequest({ message: 'That slug is already taken.' });
    }

    return serverError(e);
  }
}
