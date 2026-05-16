import React, { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n/translations';
import { useUsers } from '../api/useApi';
import { useLocalTeams, type InvitationStatus } from '../hooks/useLocalTeams';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Check, X } from 'lucide-react';
import type { FrontendUser } from '../types/frontend';

const mockUsers: FrontendUser[] = [
  { id: 'demo-user-1', name: 'Anna Grigoryan', email: 'anna.grigoryan@example.com', role: 'project_manager' },
  { id: 'demo-user-2', name: 'David Petrosyan', email: 'david.petrosyan@example.com', role: 'team_member' },
  { id: 'demo-user-3', name: 'Mariam Hakobyan', email: 'mariam.hakobyan@example.com', role: 'team_member' },
  { id: 'demo-user-4', name: 'Arman Sargsyan', email: 'arman.sargsyan@example.com', role: 'viewer' },
  { id: 'demo-user-5', name: 'Lilit Avagyan', email: 'lilit.avagyan@example.com', role: 'administrator' },
  { id: 'demo-user-6', name: 'Narek Vardanyan', email: 'narek.vardanyan@example.com', role: 'team_member' },
];

const statusStyles: Record<InvitationStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-red-200 bg-red-50 text-red-700',
};

const statusLabels: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

function InvitationBadge({ status, label }: { status: InvitationStatus; label?: string }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {label ?? statusLabels[status]}
    </Badge>
  );
}

export default function TeamsPage() {
  const { user: currentUser } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { teams, createTeam, acceptInvitation, declineInvitation, seedDemoTeams } = useLocalTeams();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const availableUsers = useMemo(() => {
    const baseUsers = users.length > 0 ? users : mockUsers;
    if (!currentUser || baseUsers.some((user) => user.id === currentUser.id)) return baseUsers;
    return [currentUser, ...baseUsers];
  }, [currentUser, users]);
  const currentUserId = currentUser?.id ?? availableUsers[0]?.id;
  const currentUserName = availableUsers.find((user) => user.id === currentUserId)?.name ?? 'Current user';

  useEffect(() => {
    if (!usersLoading && availableUsers.length > 0) {
      seedDemoTeams(availableUsers.map((user) => user.id), currentUserId);
    }
  }, [availableUsers, currentUserId, seedDemoTeams, usersLoading]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return availableUsers
      .filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
      .slice(0, 50);
  }, [availableUsers, searchQuery]);

  const selectedUsers = useMemo(() => {
    return availableUsers.filter((user) => selectedUserIds.includes(user.id));
  }, [availableUsers, selectedUserIds]);

  const teamStats = useMemo(() => {
    return teams.reduce(
      (stats, team) => {
        stats.totalPending += team.pendingMembers.length;
        if (currentUserId && team.createdById === currentUserId) {
          stats.sentPending += team.pendingMembers.length;
        }
        if (currentUserId && team.createdById !== currentUserId && team.invitationStatuses[currentUserId] === 'pending') {
          stats.receivedPending += 1;
        }
        return stats;
      },
      { totalPending: 0, sentPending: 0, receivedPending: 0 },
    );
  }, [currentUserId, teams]);

  const pendingSentByYou = useMemo(() => {
    if (!currentUserId) return [];
    return teams
      .filter((team) => team.createdById === currentUserId)
      .flatMap((team) =>
        team.pendingMembers.map((userId) => ({
          teamId: team.id,
          teamName: team.name,
          userName: availableUsers.find((user) => user.id === userId)?.name ?? 'Unknown user',
        })),
      );
  }, [availableUsers, currentUserId, teams]);

  const pendingReceivedByYou = useMemo(() => {
    if (!currentUserId) return [];
    return teams
      .filter((team) => team.createdById !== currentUserId && team.invitationStatuses[currentUserId] === 'pending')
      .map((team) => ({
        teamId: team.id,
        teamName: team.name,
        senderName: availableUsers.find((user) => user.id === team.createdById)?.name ?? 'Team owner',
      }));
  }, [availableUsers, currentUserId, teams]);

  const resetModal = () => {
    setTeamName('');
    setSearchQuery('');
    setSelectedUserIds([]);
  };

  const handleSaveTeam = () => {
    const trimmedName = teamName.trim() || `Team ${teams.length + 1}`;
    createTeam(trimmedName, selectedUserIds, currentUserId);
    resetModal();
    setIsCreateOpen(false);
  };

  const handleCancel = () => {
    resetModal();
    setIsCreateOpen(false);
  };

  const toggleSelection = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t.teams}</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage teams, sent invitations, and invitations waiting for your response.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetModal(); }}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t.createTeam}
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{t.createTeam}</DialogTitle>
              <DialogDescription>
                Create a team and send mock invitations to selected users.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              {usersError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Backend users are unavailable, so demo users are shown for invitations.
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/90">{t.teamName}</label>
                <Input
                  placeholder={t.teamName}
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Selected Users</h2>
                  {selectedUsers.length > 0 && <InvitationBadge status="pending" label="Invite Sent" />}
                </div>
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-foreground/10 bg-background p-3">
                  {selectedUsers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-foreground/20 bg-muted px-4 py-4 text-sm text-foreground/60">
                      Selected users will appear here before the invitations are saved.
                    </div>
                  ) : (
                    selectedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-secondary/5 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-sm text-foreground/60">{user.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <InvitationBadge status="pending" label="Invite Sent" />
                          <Button type="button" size="sm" variant="outline" onClick={() => toggleSelection(user.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.searchUsers}</p>
                    <p className="text-xs text-foreground/60">Search by name or email and select multiple users.</p>
                  </div>
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <Input
                      className="pl-10"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t.userSearchPlaceholder}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-foreground/10 bg-background p-3">
                  {searchQuery.trim().length === 0 ? (
                    <p className="text-sm text-foreground/60">Type to search users for invitation.</p>
                  ) : usersLoading && users.length === 0 ? (
                    <p className="text-sm text-foreground/60">Loading users...</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-foreground/60">No users match your search.</p>
                  ) : (
                    <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSelection(user.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleSelection(user.id);
                              }
                            }}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-foreground/10 bg-secondary/5 px-3 py-3 text-left transition hover:border-foreground/20"
                          >
                            <Checkbox checked={isSelected} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{user.name}</p>
                              <p className="truncate text-sm text-foreground/60">{user.email}</p>
                            </div>
                            {isSelected ? <InvitationBadge status="pending" label="Invite Sent" /> : <Badge variant="outline">Select</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 shrink-0 border-t border-foreground/10 pt-4">
              <Button variant="outline" type="button" onClick={handleCancel}>
                {t.cancel}
              </Button>
              <Button type="button" onClick={handleSaveTeam}>
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle>{t.teams}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/60">Pending invitations are split into sent by you and received by you.</p>
            <div className="mt-4 grid gap-2">
              <div className="rounded-lg bg-secondary/5 px-4 py-3">
                <p className="text-sm text-foreground/60">Total teams</p>
                <p className="text-2xl font-semibold">{teams.length}</p>
              </div>
              <div className="rounded-lg bg-secondary/5 px-4 py-3">
                <p className="text-sm text-foreground/60">Pending sent by you</p>
                <p className="text-2xl font-semibold">{teamStats.sentPending}</p>
              </div>
              <div className="rounded-lg bg-secondary/5 px-4 py-3">
                <p className="text-sm text-foreground/60">Pending received by you</p>
                <p className="text-2xl font-semibold">{teamStats.receivedPending}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-foreground/10 bg-background px-4 py-3">
              <p className="text-sm font-medium">Where you see your invitations</p>
              <p className="mt-1 text-sm text-foreground/60">
                Team invitations sent to {currentUserName} appear below with Accept and Decline actions. Project invitations are opened from their invite link on the project invitation page.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 xl:col-span-2">
          <CardHeader>
            <CardTitle>Team list</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-foreground/10 bg-secondary/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Pending Sent by You</p>
                  <InvitationBadge status="pending" label={`${pendingSentByYou.length} pending`} />
                </div>
                <div className="mt-3 space-y-2">
                  {pendingSentByYou.slice(0, 3).map((invite) => (
                    <div key={`${invite.teamId}-${invite.userName}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-foreground/70">{invite.userName}</span>
                      <span className="shrink-0 text-foreground/50">{invite.teamName}</span>
                    </div>
                  ))}
                  {pendingSentByYou.length > 3 && (
                    <p className="text-xs text-foreground/50">+{pendingSentByYou.length - 3} more pending invitations</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-foreground/10 bg-secondary/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Pending Received by You</p>
                  <InvitationBadge status="pending" label={`${pendingReceivedByYou.length} pending`} />
                </div>
                <div className="mt-3 space-y-2">
                  {pendingReceivedByYou.slice(0, 3).map((invite) => (
                    <div key={invite.teamId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-foreground/70">{invite.teamName}</span>
                      <span className="shrink-0 text-foreground/50">from {invite.senderName}</span>
                    </div>
                  ))}
                  {pendingReceivedByYou.length > 3 && (
                    <p className="text-xs text-foreground/50">+{pendingReceivedByYou.length - 3} more received invitations</p>
                  )}
                </div>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-foreground/20 bg-muted px-4 py-8 text-center text-sm text-foreground/60">
                No teams created yet. Start by creating a new team and inviting users.
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => {
                  const invitedUsers = availableUsers.filter((user) => team.invitationStatuses[user.id]);
                  const teamMembers = invitedUsers.filter((user) => team.invitationStatuses[user.id] === 'accepted');
                  const sentByCurrentUser = currentUserId && team.createdById === currentUserId;
                  const receivedByCurrentUser = currentUserId && team.createdById !== currentUserId && team.invitationStatuses[currentUserId];

                  return (
                    <Card key={team.id} className="border-foreground/10 bg-background">
                      <CardContent>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold">{team.name}</p>
                              <p className="text-sm text-foreground/60">Created on {new Date(team.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 sm:pr-2">
                              <Badge variant="secondary">{team.members.length} {t.members}</Badge>
                              <InvitationBadge status="pending" label={`${team.pendingMembers.length} pending`} />
                              <InvitationBadge status="accepted" label={`${team.members.length} accepted`} />
                              {team.declinedMembers.length > 0 && <InvitationBadge status="declined" label={`${team.declinedMembers.length} declined`} />}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Accepted Members</p>
                              {teamMembers.length === 0 ? (
                                <p className="text-sm text-foreground/60">No accepted members yet.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {teamMembers.map((member) => (
                                    <Badge key={member.id}>{member.name}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium">{sentByCurrentUser ? 'Invitations sent by you' : 'Team invitations'}</p>
                                {receivedByCurrentUser && <p className="text-xs text-foreground/60">This team includes an invitation received by you.</p>}
                              </div>
                              {invitedUsers.length === 0 ? (
                                <p className="text-sm text-foreground/60">No invitations for this team.</p>
                              ) : (
                                <div className="space-y-2">
                                  {invitedUsers.map((user) => {
                                    const status = team.invitationStatuses[user.id];
                                    const isCurrentUserPending = currentUserId === user.id && status === 'pending';
                                    return (
                                      <div key={user.id} className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="truncate font-medium">{user.name}</p>
                                          <p className="truncate text-sm text-foreground/60">{user.email}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                          <InvitationBadge status={status} />
                                          {isCurrentUserPending && (
                                            <>
                                              <Button size="icon" variant="secondary" onClick={() => acceptInvitation(team.id, user.id)} aria-label="Accept invitation">
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button size="icon" variant="outline" onClick={() => declineInvitation(team.id, user.id)} aria-label="Decline invitation">
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
