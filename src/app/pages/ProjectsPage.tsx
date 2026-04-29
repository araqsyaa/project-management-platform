import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { t } from '../i18n/translations';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { buildProjectProgressMap, useProjects, useTasks, useTeams } from '../api/useApi';
import { api } from '../api/client';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { tasks } = useTasks();
  const { teams, loading: teamsLoading } = useTeams();
  const projectProgressMap = buildProjectProgressMap(tasks);

  const [projectList, setProjectList] = useState(projects);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTeam, setProjectTeam] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setProjectList(projects);
  }, [projects]);

  const resetProjectForm = () => {
    setProjectTitle('');
    setProjectTeam('');
    setProjectClient('');
    setProjectDeadline('');
    setEditingProjectId(null);
  };

  const openCreateProjectModal = () => {
    resetProjectForm();
    setProjectTeam(teams[0]?.id ? String(teams[0].id) : '');
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (projectId: string) => {
    const project = projectList.find((entry) => entry.id === projectId);
    if (!project) return;
    setProjectTitle(project.title);
    setProjectTeam(project.teamId || (teams[0]?.id ? String(teams[0].id) : ''));
    setProjectClient(project.client || '');
    setProjectDeadline(project.deadline || '');
    setEditingProjectId(projectId);
    setIsProjectModalOpen(true);
  };

  const filteredProjects = projectList.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === 'all' || project.teamId === filterTeam;
    return matchesSearch && matchesTeam;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#6246EA';
      case 'completed': return '#2CB67D';
      case 'on-hold': return '#E45858';
      default: return '#2B2C34';
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find((team) => String(team.id) === teamId)?.name || 'Unknown Team';
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim() || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const teamId = projectTeam || (teams[0]?.id ? String(teams[0].id) : '');
      const payload = {
        name: projectTitle,
        description: projectClient,
        teamId,
        endDate: projectDeadline || undefined,
      };

      if (editingProjectId) {
        const res = await api.updateProject(editingProjectId, payload);
        setProjectList((prev) => prev.map((entry) => (
          entry.id === editingProjectId
            ? {
              ...entry,
              title: res.name,
              teamId: res.team ? String(res.team.id) : teamId,
              deadline: res.endDate || projectDeadline,
              client: res.description || projectClient,
            }
            : entry
        )));
      } else {
        const res = await api.createProject(payload);
        const created = {
          id: String(res.id),
          title: res.name,
          teamId: res.team ? String(res.team.id) : teamId,
          progress: 0,
          deadline: res.endDate || projectDeadline || new Date().toISOString().split('T')[0],
          status: 'active' as const,
          client: res.description || projectClient,
        };
        setProjectList((prev) => [created, ...prev]);
      }

      setIsProjectModalOpen(false);
      resetProjectForm();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await api.deleteProject(projectToDelete);
      setProjectList((prev) => prev.filter((entry) => entry.id !== projectToDelete));
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (projectsLoading) return <div className="p-8">Loading...</div>;
  if (projectsError) return <div className="p-8 text-red-500">Error: {projectsError}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">{t.projects}</h1>
        <Button onClick={openCreateProjectModal} disabled={teamsLoading}>
          <Plus className="mr-2 h-4 w-4" />
          {t.createProject}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-foreground/20"
          />
        </div>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-48 border-foreground/20">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t.filterByTeam} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => {
          const projectProgress = projectProgressMap[project.id] ?? 0;

          return (
            <Card
              key={project.id}
              className="border-foreground/10 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <div className="flex items-center gap-1">
                      <Badge
                        style={{
                          backgroundColor: getStatusColor(project.status) + '20',
                          color: getStatusColor(project.status),
                        }}
                      >
                        {project.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProjectModal(project.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">{t.assignedTeam}</span>
                      <span className="font-medium">{getTeamName(project.teamId)}</span>
                    </div>
                    {project.client && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/60">Client</span>
                        <span className="font-medium">{project.client}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">{t.deadline}</span>
                      <span className="font-medium">{project.deadline}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground/60">{t.progress}</span>
                      <span className="font-medium">{projectProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${projectProgress}%`,
                          backgroundColor: '#6246EA',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">{t.noData}</p>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editingProjectId ? 'Edit Project' : t.createProject}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.projectTitle}</label>
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="border-foreground/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.assignedTeam}</label>
                <Select value={projectTeam} onValueChange={setProjectTeam}>
                  <SelectTrigger className="border-foreground/20">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Input
                  value={projectClient}
                  onChange={(e) => setProjectClient(e.target.value)}
                  placeholder="Enter client name"
                  className="border-foreground/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.deadline}</label>
                <Input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="border-foreground/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    resetProjectForm();
                  }}
                >
                  {t.cancel}
                </Button>
                <Button onClick={handleSaveProject} disabled={isSaving}>
                  {editingProjectId ? 'Save Changes' : t.create}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setProjectToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove the project and its related milestones and tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setProjectToDelete(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteProject}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
