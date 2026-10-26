import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export async function getLinkVariables() {
  return prisma.client.linkVariable.findMany({ orderBy: { name: 'asc' } });
}

export async function getLinkVariable(linkVariableId: string) {
  return prisma.client.linkVariable.findUnique({ where: { id: linkVariableId } });
}

export async function getLinkVariablesByNames(names: string[]) {
  if (names.length === 0) {
    return [];
  }

  return prisma.client.linkVariable.findMany({ where: { name: { in: names } } });
}

export async function createLinkVariable(data: { name: string; value: string }) {
  return prisma.client.linkVariable.create({ data: { id: uuid(), ...data } });
}

export async function updateLinkVariable(
  linkVariableId: string,
  data: { name?: string; value: string },
) {
  return prisma.client.linkVariable.update({ where: { id: linkVariableId }, data });
}

export async function deleteLinkVariable(linkVariableId: string) {
  return prisma.client.linkVariable.delete({ where: { id: linkVariableId } });
}
