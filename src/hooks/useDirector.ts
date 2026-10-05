import { useQuery } from '@tanstack/react-query';
import { directorApi, type DirectorTeamParams } from '../api/director.api';

export const directorQueryKeys = {
  all: ['director'] as const,
  dashboard: () => [...directorQueryKeys.all, 'dashboard'] as const,
  team: (params: DirectorTeamParams) => [...directorQueryKeys.all, 'team', params] as const,
  teamMember: (memberId: string) => [...directorQueryKeys.all, 'team-member', memberId] as const,
};

export function useDirectorDashboard() {
  return useQuery({
    queryKey: directorQueryKeys.dashboard(),
    queryFn: directorApi.getDashboard,
  });
}

export function useDirectorTeam(params: DirectorTeamParams) {
  return useQuery({
    queryKey: directorQueryKeys.team(params),
    queryFn: () => directorApi.getTeam(params),
  });
}

export function useDirectorTeamMember(memberId: string) {
  return useQuery({
    queryKey: directorQueryKeys.teamMember(memberId),
    queryFn: () => directorApi.getTeamMember(memberId),
    enabled: Boolean(memberId),
  });
}
