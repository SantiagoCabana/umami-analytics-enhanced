import { z } from 'zod';
import { isValidLinkUrl, normalizeLinkDomain } from '@/lib/link-domains';
import { parseRequest } from '@/lib/request';
import { badRequest, json, serverError, unauthorized } from '@/lib/response';
import { canManageLinkDomains } from '@/permissions';
import { createShortDomain, getShortDomains, verifyShortDomain } from '@/queries/prisma';

const domainSchema = z.object({
  hostname: z
    .string()
    .min(1, 'Enter a valid hostname without a protocol, path, or port.')
    .max(255, 'Enter a valid hostname without a protocol, path, or port.')
    .refine(value => !!normalizeLinkDomain(value), {
      message: 'Enter a valid hostname without a protocol, path, or port.',
    }),
  rootRedirectUrl: z
    .string()
    .min(1, 'Enter a valid root redirect URL starting with http:// or https://.')
    .max(500, 'Enter a valid root redirect URL starting with http:// or https://.')
    .refine(isValidLinkUrl, {
      message: 'Enter a valid root redirect URL starting with http:// or https://.',
    }),
});

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canManageLinkDomains(auth))) {
    return unauthorized();
  }

  return json(await getShortDomains());
}

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const result = domainSchema.safeParse(body);

  if (!result.success) {
    return badRequest({ message: result.error.issues[0]?.message });
  }

  if (!(await canManageLinkDomains(auth))) {
    return unauthorized();
  }

  const hostname = normalizeLinkDomain(result.data.hostname);

  if (!hostname) {
    return badRequest({ message: 'Enter a valid hostname without a protocol, path, or port.' });
  }

  try {
    const domain = await createShortDomain({
      hostname,
      rootRedirectUrl: result.data.rootRedirectUrl,
    });

    return json(await verifyShortDomain(domain.id));
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('unique constraint')) {
      return badRequest({ message: 'That domain has already been added.' });
    }

    return serverError(error);
  }
}
