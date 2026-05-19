import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['search', 'global', query],
    queryFn: () => searchApi.globalSearch(query),
    enabled: !!query && query.length >= 2,
  });
}
