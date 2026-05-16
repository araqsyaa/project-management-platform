import React from 'react';
import { useNavigate } from 'react-router';
import { t } from '../i18n/translations';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Bell } from 'lucide-react';
import { useImportantNotifications, type ImportantNotificationKind, type ImportantNotificationPriority } from '../hooks/useImportantNotifications';

const notificationStyles: Record<ImportantNotificationKind, { label: string; color: string }> = {
  project: { label: 'Project invite', color: '#6246EA' },
  task: { label: 'Task assignment', color: '#2CB67D' },
  milestone: { label: 'Milestone deadline', color: '#E45858' },
  team: { label: 'Team request', color: '#F59E0B' },
};

const priorityLabels: Record<ImportantNotificationPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useImportantNotifications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{t.notifications}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Important user-related alerts, separated from general recent activity.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const style = notificationStyles[notification.kind];

          return (
            <Card
              key={notification.id}
              className="cursor-pointer border-foreground/10 transition-all hover:border-foreground/20"
              onClick={() => navigate(notification.targetPath)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${style.color}20` }}
                  >
                    <Bell className="h-5 w-5" style={{ color: style.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{style.label}</Badge>
                      <Badge variant="outline">{priorityLabels[notification.priority]}</Badge>
                    </div>
                    <h4 className="text-lg font-semibold">{notification.title}</h4>
                    <p className="mt-1 text-base text-foreground/70">{notification.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
