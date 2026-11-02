export type VariableSort =
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'created-asc'
  | 'updated-desc'
  | 'updated-asc';

export type SortableLinkVariable = {
  id: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export function sortLinkVariables<T extends SortableLinkVariable>(
  variables: T[],
  sort: VariableSort,
): T[] {
  const [field, direction] = sort.split('-');
  const multiplier = direction === 'desc' ? -1 : 1;
  const timestamp = (value: string | null) => {
    const parsed = value ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };

  return [...variables].sort((a, b) => {
    const fallback = a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    if (field === 'name')
      return multiplier * a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

    const aDate = timestamp(field === 'created' ? a.createdAt : a.updatedAt);
    const bDate = timestamp(field === 'created' ? b.createdAt : b.updatedAt);
    if (aDate === null) return bDate === null ? fallback : 1;
    if (bDate === null) return -1;
    return multiplier * (aDate - bDate) || fallback;
  });
}
