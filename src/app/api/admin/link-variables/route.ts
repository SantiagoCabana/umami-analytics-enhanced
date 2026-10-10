import { z } from 'zod';
import { normalizeLinkVariableName } from '@/lib/link-variables';
import { parseRequest } from '@/lib/request';
import { badRequest, json, serverError, unauthorized } from '@/lib/response';
import { canManageLinkVariables } from '@/permissions';
import { createLinkVariable, getLinkVariables } from '@/queries/prisma';

export const linkVariableSchema = z.object({
  name: z
    .string()
    .min(1, 'Enter a variable name using lowercase letters, numbers, and underscores.')
    .max(64, 'Enter a variable name using lowercase letters, numbers, and underscores.')
    .refine(value => !!normalizeLinkVariableName(value), {
      message: 'Enter a variable name using lowercase letters, numbers, and underscores.',
    }),
  value: z
    .string()
    .min(1, 'Enter a variable value.')
    .max(2000, 'Variable values can contain up to 2000 characters.'),
});

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canManageLinkVariables(auth))) {
    return unauthorized();
  }

  try {
    return json(await getLinkVariables());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const result = linkVariableSchema.safeParse(body);

  if (!result.success) {
    return badRequest({ message: result.error.issues[0]?.message });
  }

  if (!(await canManageLinkVariables(auth))) {
    return unauthorized();
  }

  const name = normalizeLinkVariableName(result.data.name);

  if (!name) {
    return badRequest({
      message: 'Enter a variable name using lowercase letters, numbers, and underscores.',
    });
  }

  try {
    return json(await createLinkVariable({ name, value: result.data.value }));
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('unique constraint')) {
      return badRequest({ message: 'That variable already exists.' });
    }

    return serverError(error);
  }
}
