import { useEffect, useState } from 'react';

export interface FrontendTeam {
  id: string;
  name: string;
  members: string[];
  pendingMembers: string[];
  createdAt: string;
}

const STORAGE_KEY = 'pm-local-teams-v1';

function loadStoredTeams(): FrontendTeam[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FrontendTeam[];
  } catch {
    return [];
  }
}

function saveStoredTeams(teams: FrontendTeam[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {
    // ignore write failures in browser storage
  }
}

function generateTeamId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

export function useLocalTeams() {
  const [teams, setTeams] = useState<FrontendTeam[]>([]);

  useEffect(() => {
    setTeams(loadStoredTeams());
  }, []);

  useEffect(() => {
    saveStoredTeams(teams);
  }, [teams]);

  const createTeam = (name: string, invitedUserIds: string[]) => {
    const team: FrontendTeam = {
      id: generateTeamId(),
      name,
      members: [],
      pendingMembers: invitedUserIds,
      createdAt: new Date().toISOString(),
    };
    setTeams((current) => [...current, team]);
    return team;
  };

  const acceptInvitation = (teamId: string, userId: string) => {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) return team;
        if (!team.pendingMembers.includes(userId)) return team;

        return {
          ...team,
          pendingMembers: team.pendingMembers.filter((id) => id !== userId),
          members: team.members.includes(userId)
            ? team.members
            : [...team.members, userId],
        };
      }),
    );
  };

  const declineInvitation = (teamId: string, userId: string) => {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          pendingMembers: team.pendingMembers.filter((id) => id !== userId),
        };
      }),
    );
  };

  const refreshTeams = () => {
    setTeams(loadStoredTeams());
  };

  return {
    teams,
    createTeam,
    acceptInvitation,
    declineInvitation,
    refreshTeams,
  };
}
