import { useEffect, useRef, useState } from 'react';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface FrontendTeam {
  id: string;
  name: string;
  members: string[];
  pendingMembers: string[];
  declinedMembers: string[];
  invitationStatuses: Record<string, InvitationStatus>;
  createdAt: string;
}

const STORAGE_KEY = 'pm-local-teams-v1';
const TEAMS_CHANGED_EVENT = 'pm-local-teams-changed';

function normalizeTeam(team: Partial<FrontendTeam> & { id: string; name: string; createdAt: string }): FrontendTeam {
  const invitationStatuses: Record<string, InvitationStatus> = {
    ...(team.invitationStatuses ?? {}),
  };

  (team.members ?? []).forEach((userId) => {
    invitationStatuses[userId] = 'accepted';
  });
  (team.pendingMembers ?? []).forEach((userId) => {
    if (!invitationStatuses[userId]) invitationStatuses[userId] = 'pending';
  });
  (team.declinedMembers ?? []).forEach((userId) => {
    invitationStatuses[userId] = 'declined';
  });

  const entries = Object.entries(invitationStatuses);

  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt,
    invitationStatuses,
    members: entries.filter(([, status]) => status === 'accepted').map(([userId]) => userId),
    pendingMembers: entries.filter(([, status]) => status === 'pending').map(([userId]) => userId),
    declinedMembers: entries.filter(([, status]) => status === 'declined').map(([userId]) => userId),
  };
}

function loadStoredTeams(): FrontendTeam[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as FrontendTeam[]).map(normalizeTeam);
  } catch {
    return [];
  }
}

function saveStoredTeams(teams: FrontendTeam[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    window.dispatchEvent(new Event(TEAMS_CHANGED_EVENT));
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
  const scheduledTransitions = useRef(new Set<string>());

  useEffect(() => {
    setTeams(loadStoredTeams());

    const refresh = () => setTeams(loadStoredTeams());
    window.addEventListener(TEAMS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(TEAMS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    saveStoredTeams(teams);
  }, [teams]);

  useEffect(() => {
    const timers: number[] = [];

    teams.forEach((team) => {
      team.pendingMembers.forEach((userId) => {
        const transitionKey = `${team.id}:${userId}`;
        if (scheduledTransitions.current.has(transitionKey)) return;

        scheduledTransitions.current.add(transitionKey);
        const delay = 3000 + Math.floor(Math.random() * 2000);
        const timer = window.setTimeout(() => {
          setTeams((current) =>
            current.map((currentTeam) => {
              if (currentTeam.id !== team.id || currentTeam.invitationStatuses[userId] !== 'pending') {
                return currentTeam;
              }

              const nextStatus: InvitationStatus = Math.random() > 0.25 ? 'accepted' : 'declined';
              const invitationStatuses = {
                ...currentTeam.invitationStatuses,
                [userId]: nextStatus,
              };

              return normalizeTeam({
                ...currentTeam,
                invitationStatuses,
              });
            }),
          );
          scheduledTransitions.current.delete(transitionKey);
        }, delay);

        timers.push(timer);
      });
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [teams]);

  const createTeam = (name: string, invitedUserIds: string[]) => {
    const invitationStatuses = invitedUserIds.reduce<Record<string, InvitationStatus>>((statuses, userId) => {
      statuses[userId] = 'pending';
      return statuses;
    }, {});

    const team: FrontendTeam = normalizeTeam({
      id: generateTeamId(),
      name,
      invitationStatuses,
      createdAt: new Date().toISOString(),
    });
    setTeams((current) => [...current, team]);
    return team;
  };

  const acceptInvitation = (teamId: string, userId: string) => {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) return team;
        if (!team.pendingMembers.includes(userId)) return team;

        return normalizeTeam({
          ...team,
          invitationStatuses: {
            ...team.invitationStatuses,
            [userId]: 'accepted',
          },
        });
      }),
    );
  };

  const declineInvitation = (teamId: string, userId: string) => {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) return team;
        return normalizeTeam({
          ...team,
          invitationStatuses: {
            ...team.invitationStatuses,
            [userId]: 'declined',
          },
        });
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
