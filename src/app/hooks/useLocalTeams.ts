import { useEffect, useRef, useState } from 'react';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface FrontendTeam {
  id: string;
  name: string;
  createdById?: string;
  members: string[];
  pendingMembers: string[];
  declinedMembers: string[];
  invitationStatuses: Record<string, InvitationStatus>;
  createdAt: string;
}

const STORAGE_KEY = 'pm-local-teams-v1';
const DEMO_SEED_KEY = 'pm-local-teams-demo-seeded-v1';

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
    createdById: team.createdById,
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
  const [teams, setTeams] = useState<FrontendTeam[]>(() => loadStoredTeams());
  const scheduledTransitions = useRef(new Set<string>());

  useEffect(() => {
    const refresh = () => setTeams(loadStoredTeams());
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    saveStoredTeams(teams);
  }, [teams]);

  useEffect(() => {
    teams.forEach((team) => {
      team.pendingMembers.forEach((userId) => {
        const transitionKey = `${team.id}:${userId}`;
        if (scheduledTransitions.current.has(transitionKey)) return;
        if (Math.random() < 0.45) return;

        scheduledTransitions.current.add(transitionKey);
        const delay = 3000 + Math.floor(Math.random() * 2000);
        window.setTimeout(() => {
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
      });
    });
  }, [teams]);

  const createTeam = (name: string, invitedUserIds: string[], createdById?: string) => {
    const invitationStatuses = invitedUserIds.reduce<Record<string, InvitationStatus>>((statuses, userId) => {
      statuses[userId] = 'pending';
      return statuses;
    }, {});

    const team: FrontendTeam = normalizeTeam({
      id: generateTeamId(),
      name,
      createdById,
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

  const seedDemoTeams = (userIds: string[], currentUserId?: string) => {
    if (typeof window !== 'undefined' && window.localStorage.getItem(DEMO_SEED_KEY)) return;
    if (teams.length > 0 || userIds.length === 0) return;

    const me = currentUserId ?? userIds[0];
    const otherUsers = userIds.filter((userId) => userId !== me);
    const sentPending = otherUsers.slice(0, 3);
    const sentAccepted = otherUsers[3] ?? otherUsers[0];
    const sentDeclined = otherUsers[4] ?? otherUsers[1];
    const receivedOwner = otherUsers[5] ?? otherUsers[0] ?? me;
    const now = Date.now();

    const demoTeams = [
      normalizeTeam({
        id: 'demo-product-team',
        name: 'Product Demo Team',
        createdById: me,
        createdAt: new Date(now - 86400000).toISOString(),
        invitationStatuses: {
          ...sentPending.reduce<Record<string, InvitationStatus>>((statuses, userId) => {
            statuses[userId] = 'pending';
            return statuses;
          }, {}),
          ...(sentAccepted ? { [sentAccepted]: 'accepted' as const } : {}),
          ...(sentDeclined ? { [sentDeclined]: 'declined' as const } : {}),
        },
      }),
      normalizeTeam({
        id: 'demo-design-review',
        name: 'Design Review Group',
        createdById: receivedOwner,
        createdAt: new Date(now - 43200000).toISOString(),
        invitationStatuses: {
          [me]: 'pending',
          ...(otherUsers[1] ? { [otherUsers[1]]: 'accepted' as const } : {}),
        },
      }),
    ];

    setTeams(demoTeams);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEMO_SEED_KEY, 'true');
    }
  };

  return {
    teams,
    createTeam,
    acceptInvitation,
    declineInvitation,
    refreshTeams,
    seedDemoTeams,
  };
}
