import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useProjects, useProjectMembers, useUsersInMyProjects } from '../api/useApi';
import { api } from '../api/client';

type ViewMode = 'all' | 'project';

export default function RolesPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { members, loading: membersLoading, refresh } = useProjectMembers(selectedProjectId);
  const { users: allProjectUsers, loading: allUsersLoading } = useUsersInMyProjects();
  const [isSaving, setIsSaving] = useState(false);

  // Get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  };

  // Handle view mode change
  const handleViewModeChange = (value: string) => {
    if (value === 'all') {
      setViewMode('all');
      setSelectedProjectId('');
    } else {
      setViewMode('project');
      setSelectedProjectId(value);
    }
  };

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
        <Select value={viewMode === 'all' ? 'all' : selectedProjectId} onValueChange={handleViewModeChange}>
          <SelectTrigger className={viewMode === 'all' ? 'border-primary/50 bg-primary/5' : ''}>
            <SelectValue placeholder="Select project">
              {viewMode === 'all' ? (
                <span className="flex items-center gap-2">
                  <span className="text-primary font-medium">All Projects</span>
                </span>
              ) : selectedProjectId ? (
                <span>{getProjectName(selectedProjectId)}</span>
              ) : (
                <span>Select project</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span className="font-medium">All Projects</span>
                <Badge variant="outline" className="text-xs">View only</Badge>
              </div>
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View mode indicator */}
      <div className="flex items-center gap-2">
        {viewMode === 'all' ? (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Viewing users from all projects you are part of (read-only)
          </Badge>
        ) : (
          <Badge variant="outline">
            Managing roles in: {selectedProjectId ? getProjectName(selectedProjectId) : 'Select a project'}
          </Badge>
        )}
      </div>

      {viewMode === 'all' ? (
        allUsersLoading ? (
          <div className="text-foreground/60">Loading users...</div>
        ) : allProjectUsers.length === 0 ? (
          <div className="text-foreground/60">No users found in your projects.</div>
        ) : (
          <div className="space-y-3">
            {allProjectUsers.map((user) => (
              <div key={user.id} className="rounded-lg border border-foreground/10 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-foreground/60">{user.email}</p>
                </div>
                <Badge variant="secondary">
                  In Your Projects
                </Badge>
              </div>
            ))}
          </div>
        )
      ) : membersLoading ? (
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
