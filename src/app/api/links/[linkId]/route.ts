import { z } from 'zod';
import { isValidLinkSlug, normalizeAssignedLinkDomains } from '@/lib/link-domains';
import { isValidLinkDestinationUrl } from '@/lib/link-variables';
import { parseRequest } from '@/lib/request';
import { badRequest, json, ok, serverError, unauthorized } from '@/lib/response';
import { canDeleteLink, canUpdateLink, canViewLink } from '@/permissions';
import { deleteLink, getLink, getShortDomainIds, updateLink } from '@/queries/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const { linkId } = await params;

  if (!(await canViewLink(auth, linkId))) {
    return unauthorized();
  }

  const website = await getLink(linkId);

  return json(website);
}

export async function POST(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const schema = z.object({
    name: z.string().max(100).optional(),
    url: z.string().max(2000).refine(isValidLinkDestinationUrl).optional(),
    slug: z.string().refine(isValidLinkSlug).optional(),
    isDefaultDomainEnabled: z.boolean().optional(),
    domains: z.array(z.string()).max(20).optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { linkId } = await params;
  const { name, url, slug, domains, isDefaultDomainEnabled } = body;
  const assignedDomains = domains === undefined ? undefined : normalizeAssignedLinkDomains(domains);
  const assignedDomainIds =
    assignedDomains === undefined
      ? undefined
      : assignedDomains && (await getShortDomainIds(assignedDomains));

  if (assignedDomains === null || assignedDomainIds === null) {
    return badRequest({ message: 'One or more selected domains are not available.' });
  }

  if (!(await canUpdateLink(auth, linkId))) {
    return unauthorized();
  }

  try {
    const result = await updateLink(linkId, {
      name,
      url,
      slug,
      isDefaultDomainEnabled,
      domains: assignedDomainIds,
    });

    return Response.json(result);
  } catch (e: any) {
    if (e.message?.toLowerCase().includes('unique constraint') && e.message.includes('slug')) {
      return badRequest({ message: 'That slug is already taken.' });
    }

    return serverError(e);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const { linkId } = await params;

  if (!(await canDeleteLink(auth, linkId))) {
    return unauthorized();
  }

  await deleteLink(linkId);

  return ok();
}
