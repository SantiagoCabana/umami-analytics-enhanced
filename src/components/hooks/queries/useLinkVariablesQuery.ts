import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useLinkVariablesQuery() {
  const { get, useQuery } = useApi();
  const { modified } = useModified('link-variables');

  return useQuery({
    queryKey: ['link-variables', modified],
    queryFn: () => get('/admin/link-variables'),
  });
}
