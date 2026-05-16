import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects, useTasks, useUsers, useMilestones } from '../api/useApi';
import { useLocalTeams } from './useLocalTeams';

export type ImportantNotificationKind = 'project' | 'task' | 'milestone' | 'team';
export type ImportantNotificationPriority = 'high' | 'medium' | 'low';

export interface ImportantNotification {
  id: string;
  kind: ImportantNotificationKind;
  priority: ImportantNotificationPriority;
  title: string;
  message: string;
  targetPath: string;
  createdAt: string;
}

function isUpcoming(dateString: string, daysAhead = 7) {
  if (!dateString) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) return false;
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysAhead;
}

function formatDate(dateString: string) {
  if (!dateString) return 'not set';
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function useImportantNotifications() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { users } = useUsers();
  const { teams } = useLocalTeams();
  const firstProjectId = projects[0]?.id || '';
  const { milestones } = useMilestones(firstProjectId);

  return useMemo(() => {
    const currentUserId = user?.id ?? users[0]?.id;
    const currentUserName = user?.name ?? users[0]?.name ?? 'you';
    const now = new Date().toISOString();

    const projectNameById = projects.reduce<Record<string, string>>((map, project) => {
      map[project.id] = project.title;
      return map;
    }, {});

    const notifications: ImportantNotification[] = [];

    tasks
      .filter((task) => task.assigneeId === currentUserId && task.status !== 'done')
      .slice(0, 2)
      .forEach((task) => {
        notifications.push({
          id: `task-${task.id}`,
          kind: 'task',
          priority: task.priority === 'high' ? 'high' : 'medium',
          title: 'Task assigned to you',
          message: `${task.title} in ${projectNameById[task.projectId] ?? 'a project'} needs your attention.`,
          targetPath: `/projects/${task.projectId}`,
          createdAt: now,
        });
      });

    milestones
      .filter((milestone) => !milestone.completed && isUpcoming(milestone.dueDate))
      .slice(0, 2)
      .forEach((milestone) => {
        notifications.push({
          id: `milestone-${milestone.id}`,
          kind: 'milestone',
          priority: 'high',
          title: 'Milestone deadline approaching',
          message: `${milestone.title} is due ${formatDate(milestone.dueDate)}.`,
          targetPath: `/projects/${milestone.projectId}/milestones/${milestone.id}`,
          createdAt: now,
        });
      });

    teams
      .filter((team) => currentUserId && team.createdById !== currentUserId && team.invitationStatuses[currentUserId] === 'pending')
      .forEach((team) => {
        notifications.push({
          id: `team-${team.id}`,
          kind: 'team',
          priority: 'medium',
          title: 'Team invitation received',
          message: `${currentUserName}, you were invited to join ${team.name}.`,
          targetPath: '/teams',
          createdAt: team.createdAt,
        });
      });

    if (notifications.length === 0) {
      notifications.push(
        {
          id: 'demo-project-invite',
          kind: 'project',
          priority: 'high',
          title: 'Project invitation pending',
          message: 'You have a pending invitation to review for the Mobile App project.',
          targetPath: '/projects',
          createdAt: now,
        },
        {
          id: 'demo-task-assignment',
          kind: 'task',
          priority: 'medium',
          title: 'New task assignment',
          message: 'A design review task has been assigned to you for this week.',
          targetPath: '/projects',
          createdAt: now,
        },
      );
    }

    return notifications.slice(0, 5);
  }, [milestones, projects, tasks, teams, user?.id, user?.name, users]);
}
