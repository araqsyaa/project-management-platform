import React, { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { useProjectMembers, useProjects } from '../api/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function UsersPage() {
  const { projects, loading, error } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { members, loading: membersLoading } = useProjectMembers(selectedProjectId);

  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">People & Access</h1>
      </div>

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
                    {member.role === 'owner' ? 'Owner' : 'Member'}
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
