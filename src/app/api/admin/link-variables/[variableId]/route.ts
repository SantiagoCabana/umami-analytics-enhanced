import { normalizeLinkVariableName } from '@/lib/link-variables';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound, ok, serverError, unauthorized } from '@/lib/response';
import { canManageLinkVariables } from '@/permissions';
import { deleteLinkVariable, getLinkVariable, updateLinkVariable } from '@/queries/prisma';
import { linkVariableSchema } from '../route';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ variableId: string }> },
) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canManageLinkVariables(auth))) {
    return unauthorized();
  }

  const result = linkVariableSchema.safeParse(body);

  if (!result.success) {
    return badRequest({ message: result.error.issues[0]?.message });
  }

  const name = normalizeLinkVariableName(result.data.name);

  if (!name) {
    return badRequest({
      message: 'Enter a variable name using lowercase letters, numbers, and underscores.',
    });
  }

  const { variableId } = await params;

  try {
    if (!auth.user.isAdmin) {
      const variable = await getLinkVariable(variableId);

      if (!variable) {
        return notFound();
      }

      if (name !== variable.name) {
        return unauthorized();
      }
    }

    // A user's value update must never overwrite a concurrent administrator rename.
    const data = auth.user.isAdmin
      ? { name, value: result.data.value }
      : { value: result.data.value };

    return json(await updateLinkVariable(variableId, data));
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('not found')) {
      return notFound();
    }
    if (error.message?.toLowerCase().includes('unique constraint')) {
      return badRequest({ message: 'That variable already exists.' });
    }

    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ variableId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canManageLinkVariables(auth))) {
    return unauthorized();
  }

  const { variableId } = await params;

  try {
    await deleteLinkVariable(variableId);
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('not found')) {
      return notFound();
    }

    return serverError(error);
  }

  return ok();
}
