import React, { useMemo, useState } from 'react';
import { t } from '../i18n/translations';
import { useUsers } from '../api/useApi';
import { useLocalTeams, type InvitationStatus } from '../hooks/useLocalTeams';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

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

function InvitationBadge({ status, count }: { status: InvitationStatus; count: number }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {count} {statusLabels[status]}
    </Badge>
  );
}

export default function UsersPage() {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { teams } = useLocalTeams();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (!query) return true;
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const membershipMap = useMemo(() => {
    const map = new Map<string, { accepted: string[]; pending: string[]; declined: string[] }>();
    teams.forEach((team) => {
      Object.entries(team.invitationStatuses).forEach(([userId, invitationStatus]) => {
        const entry = map.get(userId) ?? { accepted: [], pending: [], declined: [] };
        entry[invitationStatus].push(team.name);
        map.set(userId, entry);
      });
    });
    return map;
  }, [teams]);

  if (usersLoading) return <div className="p-8">Loading...</div>;
  if (usersError) return <div className="p-8 text-red-500">Error: {usersError}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">{t.usersAndRoles}</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Search and review people in the workspace, with team membership and pending invitation status.
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <Input
            className="pl-10"
            placeholder={t.userSearchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="border-foreground/10">
            <CardContent>
              <p className="text-sm text-foreground/60">No users found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const status = membershipMap.get(user.id) ?? { accepted: [], pending: [], declined: [] };
            return (
              <Card key={user.id} className="border-foreground/10">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-foreground/60">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {user.role === 'administrator'
                        ? t.administrator
                        : user.role === 'project_manager'
                        ? t.projectManager
                        : user.role === 'team_member'
                        ? t.teamMember
                        : t.viewer}
                    </Badge>
                    {status.accepted.length > 0 && (
                      <InvitationBadge status="accepted" count={status.accepted.length} />
                    )}
                    {status.pending.length > 0 && (
                      <InvitationBadge status="pending" count={status.pending.length} />
                    )}
                    {status.declined.length > 0 && (
                      <InvitationBadge status="declined" count={status.declined.length} />
                    )}
                  </div>
                  <div className="text-sm text-foreground/60">
                    {status.accepted.length > 0 ? (
                      <p>Accepted in {status.accepted.slice(0, 2).join(', ')}{status.accepted.length > 2 ? '...' : ''}</p>
                    ) : status.pending.length > 0 ? (
                      <p>Pending in {status.pending.slice(0, 2).join(', ')}{status.pending.length > 2 ? '...' : ''}</p>
                    ) : status.declined.length > 0 ? (
                      <p>Declined in {status.declined.slice(0, 2).join(', ')}{status.declined.length > 2 ? '...' : ''}</p>
                    ) : (
                      <p>Not assigned to a team</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
