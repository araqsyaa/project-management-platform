import React, { useMemo, useState } from 'react';
import { t } from '../i18n/translations';
import { useUsers } from '../api/useApi';
import { useLocalTeams } from '../hooks/useLocalTeams';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Check, X } from 'lucide-react';

export default function TeamsPage() {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { teams, createTeam, acceptInvitation, declineInvitation } = useLocalTeams();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return users
      .filter((user) =>
        (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)) &&
        !selectedUserIds.includes(user.id),
      )
      .slice(0, 12);
  }, [searchQuery, users, selectedUserIds]);

  const pendingInviteUsers = useMemo(() => {
    return users.filter((user) => selectedUserIds.includes(user.id));
  }, [selectedUserIds, users]);

  const teamUserStatusMap = useMemo(() => {
    return teams.reduce<Record<string, { memberships: string[]; invitations: string[] }>>((map, team) => {
      team.members.forEach((userId) => {
        const entry = map[userId] ?? { memberships: [], invitations: [] };
        entry.memberships.push(team.name);
        map[userId] = entry;
      });
      team.pendingMembers.forEach((userId) => {
        const entry = map[userId] ?? { memberships: [], invitations: [] };
        entry.invitations.push(team.name);
        map[userId] = entry;
      });
      return map;
    }, {});
  }, [teams]);

  const resetModal = () => {
    setTeamName('');
    setSearchQuery('');
    setSelectedUserIds([]);
  };

  const handleSaveTeam = () => {
    const trimmedName = teamName.trim();
    if (!trimmedName) return;
    createTeam(trimmedName, selectedUserIds);
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
            Manage your teams, invite users, and track pending memberships.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetModal(); }}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t.createTeam}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.createTeam}</DialogTitle>
              <DialogDescription>
                Create a new team and invite members. Invitations are stored as pending until accepted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/90">{t.teamName}</label>
                <Input
                  placeholder={t.teamName}
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{t.searchUsers}</p>
                    <p className="text-xs text-foreground/60">Search users by name or email to invite them to the team.</p>
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
                  ) : usersLoading ? (
                    <p className="text-sm text-foreground/60">Loading users...</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-foreground/60">No users match your search.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleSelection(user.id)}
                          className="flex w-full items-center gap-3 rounded-lg border border-foreground/10 bg-secondary/5 px-3 py-3 text-left transition hover:border-foreground/20"
                        >
                          <Checkbox checked={selectedUserIds.includes(user.id)} onCheckedChange={() => toggleSelection(user.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-foreground/60">{user.email}</p>
                          </div>
                          <Badge variant="outline">{t.invited}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{t.pendingInvitations}</h2>
                  <span className="text-sm text-foreground/60">{pendingInviteUsers.length} selected</span>
                </div>
                <div className="grid gap-2">
                  {pendingInviteUsers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-foreground/20 bg-muted px-4 py-6 text-sm text-foreground/60">
                      Select users from search results to add them as pending invitations.
                    </div>
                  ) : (
                    pendingInviteUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-4 py-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-foreground/60">{user.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSelection(user.id)}
                          className="text-sm font-medium text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="button" onClick={handleSaveTeam} disabled={!teamName.trim()}>
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
            <p className="text-sm text-foreground/60">Teams let you group users and manage invitations before membership is accepted.</p>
            <div className="mt-4 grid gap-2">
              <div className="rounded-lg bg-secondary/5 px-4 py-3">
                <p className="text-sm text-foreground/60">Total teams</p>
                <p className="text-2xl font-semibold">{teams.length}</p>
              </div>
              <div className="rounded-lg bg-secondary/5 px-4 py-3">
                <p className="text-sm text-foreground/60">Pending invitations</p>
                <p className="text-2xl font-semibold">{teams.reduce((count, team) => count + team.pendingMembers.length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 xl:col-span-2">
          <CardHeader>
            <CardTitle>Team list</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-foreground/20 bg-muted px-4 py-8 text-center text-sm text-foreground/60">
                No teams created yet. Start by creating a new team and inviting users.
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => {
                  const teamMembers = users.filter((user) => team.members.includes(user.id));
                  const teamPending = users.filter((user) => team.pendingMembers.includes(user.id));

                  return (
                    <Card key={team.id} className="border-foreground/10 bg-background">
                      <CardContent>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold">{team.name}</p>
                              <p className="text-sm text-foreground/60">Created on {new Date(team.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{team.members.length} {t.members}</Badge>
                              <Badge variant="outline">{team.pendingMembers.length} {t.pending}</Badge>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{t.members}</p>
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
                              <p className="text-sm font-medium">{t.pendingInvitations}</p>
                              {teamPending.length === 0 ? (
                                <p className="text-sm text-foreground/60">No pending invitations.</p>
                              ) : (
                                <div className="space-y-2">
                                  {teamPending.map((user) => (
                                    <div key={user.id} className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-foreground/60">{user.email}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button size="icon" variant="secondary" onClick={() => acceptInvitation(team.id, user.id)}>
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => declineInvitation(team.id, user.id)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
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
