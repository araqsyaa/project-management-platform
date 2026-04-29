import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useProjects, useProjectMembers } from '../api/useApi';
import { api } from '../api/client';

export default function RolesPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { members, loading: membersLoading, refresh } = useProjectMembers(selectedProjectId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleRoleChange = async (userId: string, role: 'OWNER' | 'MEMBER') => {
    if (!selectedProjectId) return;
    try {
      setIsSaving(true);
      await api.updateProjectMemberRole(selectedProjectId, userId, role);
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  if (projectsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Project Roles</h1>
        <p className="text-foreground/60 mt-1">Manage Owner/Member roles for each project.</p>
      </div>

      <div className="max-w-md">
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

      {membersLoading ? (
        <div className="text-foreground/60">Loading members...</div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border border-foreground/10 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{member.userName}</p>
                <p className="text-sm text-foreground/60">{member.userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleRoleChange(member.userId, member.role === 'owner' ? 'MEMBER' : 'OWNER')}
                >
                  Make {member.role === 'owner' ? 'Member' : 'Owner'}
                </Button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-foreground/60">No members in this project yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
