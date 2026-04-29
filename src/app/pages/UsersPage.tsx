import React, { useState } from 'react';
import { t } from '../i18n/translations';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Search } from 'lucide-react';
import { useProjectMembers, useProjects, useUsers } from '../api/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Role } from '../types/frontend';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { users, loading, error } = useUsers();
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { members, loading: membersLoading } = useProjectMembers(selectedProjectId);

  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'administrator': return '#E45858';
      case 'project_manager': return '#6246EA';
      case 'team_member': return '#2CB67D';
      case 'viewer': return '#D1D1E9';
      default: return '#2B2C34';
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'administrator': return t.administrator;
      case 'project_manager': return t.projectManager;
      case 'team_member': return t.teamMember;
      case 'viewer': return t.viewer;
      default: return role;
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">People & Access</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-foreground/20"
        />
      </div>

      {/* Users Table */}
      <div className="border rounded-lg border-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{t.role}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback 
                        style={{ 
                          backgroundColor: '#6246EA', 
                          color: '#FFFFFE' 
                        }}
                      >
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: getRoleColor(user.role) + '20',
                      color: getRoleColor(user.role)
                    }}
                  >
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">{t.noData}</p>
        </div>
      )}

      <div className="space-y-3 border rounded-lg border-foreground/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">Project Membership Roles</h2>
          <div className="w-full max-w-sm">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {membersLoading ? (
          <p className="text-foreground/60">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="text-foreground/60">No members in selected project.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-md border border-foreground/10 px-3 py-2">
                <div>
                  <p className="font-medium">{member.userName}</p>
                  <p className="text-sm text-foreground/60">{member.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
