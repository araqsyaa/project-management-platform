import React, { useState, useMemo } from 'react';
import { Badge } from '../components/ui/badge';
import { useProjectMembers, useProjects, useUsersInMyProjects } from '../api/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type ViewMode = 'all' | 'project';

interface UserWithProject {
  id: string;
  userName: string;
  userEmail: string;
  role: 'owner' | 'member';
  projectId: string;
  projectName: string;
}

export default function UsersPage() {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { members, loading: membersLoading } = useProjectMembers(selectedProjectId);
  const { users: allProjectUsers, loading: allUsersLoading } = useUsersInMyProjects();

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

  // Get display value for the select
  const getSelectDisplayValue = () => {
    if (viewMode === 'all') return 'All Projects';
    return selectedProjectId;
  };

  // Build user list based on view mode
  const displayUsers = useMemo((): UserWithProject[] => {
    if (viewMode === 'all') {
      // For "All Projects" view, we need to get users from all projects the current user is part of
      // The API returns users with their project memberships
      return allProjectUsers.map(user => ({
        id: user.id,
        userName: user.name,
        userEmail: user.email,
        role: 'member' as const,
        projectId: '',
        projectName: 'All Projects'
      }));
    } else {
      // Project-specific view
      return members.map(member => ({
        id: member.id,
        userName: member.userName,
        userEmail: member.userEmail,
        role: member.role,
        projectId: member.projectId,
        projectName: getProjectName(member.projectId)
      }));
    }
  }, [viewMode, allProjectUsers, members]);

  if (projectsLoading) return <div className="p-8">Loading...</div>;
  if (projectsError) return <div className="p-8 text-red-500">Error: {projectsError}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">People & Access</h1>
      </div>

      <div className="space-y-3 border rounded-lg border-foreground/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">Project Membership Roles</h2>
          <div className="w-full max-w-sm">
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
                    <Badge variant="outline" className="text-xs">Users in my projects</Badge>
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
        </div>

        {/* View mode indicator */}
        <div className="flex items-center gap-2 mb-4">
          {viewMode === 'all' ? (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Showing users from all projects you are part of
            </Badge>
          ) : (
            <Badge variant="outline">
              Showing members of: {selectedProjectId ? getProjectName(selectedProjectId) : 'Select a project'}
            </Badge>
          )}
        </div>

        {viewMode === 'all' ? (
          allUsersLoading ? (
            <p className="text-foreground/60">Loading users...</p>
          ) : displayUsers.length === 0 ? (
            <p className="text-foreground/60">No users found in your projects.</p>
          ) : (
            <div className="space-y-2">
              {displayUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border border-foreground/10 px-3 py-2">
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-foreground/60">{user.userEmail}</p>
                  </div>
                  <Badge variant="secondary">
                    In Your Projects
                  </Badge>
                </div>
              ))}
            </div>
          )
        ) : (
          membersLoading ? (
            <p className="text-foreground/60">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-foreground/60">No members in selected project.</p>
          ) : (
            <div className="space-y-2">
              {displayUsers.map((member) => (
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
          )
        )}
      </div>

    </div>
  );
}
