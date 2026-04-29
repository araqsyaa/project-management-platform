import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useProjects, useTasks, useUsers } from '../api/useApi';

function formatStatusStage(status: string) {
  switch (status) {
    case 'backlog':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return status;
  }
}

function formatDueDate(dateString: string) {
  if (!dateString) return 'Not set';
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function TasksDueSoonPage() {
  const navigate = useNavigate();
  // Use the same API hooks as Boards and Dashboard for shared data source
  const { projects } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { users } = useUsers();

  // Get all tasks with valid deadlines, sorted by due date (ascending)
  // This uses the same task data source as Boards and Dashboard
  const allTasksWithDeadlines = tasks
    .filter((task) => task.dueDate && task.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((task) => ({
      ...task,
      projectName: projects.find((project) => project.id === task.projectId)?.title || 'Unknown Project',
      assigneeName: users.find((user) => user.id === task.assigneeId)?.name || 'Unassigned',
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-3xl">Tasks Due Soon</h1>
        <p className="text-sm text-foreground/60 mt-2">
          All tasks with upcoming deadlines, sorted by nearest deadline first.
        </p>
      </div>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle>All Tasks with Deadlines ({allTasksWithDeadlines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-foreground/60">
              Loading tasks...
            </div>
          ) : allTasksWithDeadlines.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-foreground/60">
              No tasks with deadlines found.
            </div>
          ) : (
            <div className="space-y-4">
              {allTasksWithDeadlines.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="w-full rounded-lg border border-foreground/10 p-4 text-left transition-colors hover:bg-secondary/40"
                  onClick={() => navigate(`/projects/${task.projectId}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant="secondary" className="capitalize">
                          {formatStatusStage(task.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground/50">Project</p>
                          <p className="font-medium">{task.projectName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground/50">Assignee</p>
                          <p className="font-medium">{task.assigneeName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground/50">Due Date</p>
                          <p className="font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDueDate(task.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <ArrowLeft className="h-4 w-4 text-foreground/40 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}