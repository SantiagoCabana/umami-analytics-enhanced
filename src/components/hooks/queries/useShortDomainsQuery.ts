import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useShortDomainsQuery() {
  const { get, useQuery } = useApi();
  const { modified } = useModified('short-domains');

  return useQuery({
    queryKey: ['short-domains', modified],
    queryFn: () => get('/admin/link-domains'),
  });
}
