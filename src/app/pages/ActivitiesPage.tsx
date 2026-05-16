import React from 'react';
import { useNavigate } from 'react-router';
import { t } from '../i18n/translations';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Bell, Flag, MessageSquare, CheckCircle2, FolderKanban, Settings, Download } from 'lucide-react';
import { useActivities } from '../api/useApi';

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'comment':
      return MessageSquare;
    case 'milestone':
      return Flag;
    case 'project':
      return FolderKanban;
    case 'settings':
      return Settings;
    case 'export':
      return Download;
    case 'success':
      return CheckCircle2;
    default:
      return Bell;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'comment':
      return '#2B2C34';
    case 'milestone':
      return '#6246EA';
    case 'project':
      return '#6246EA';
    case 'settings':
      return '#2B2C34';
    case 'export':
      return '#2CB67D';
    case 'success':
      return '#2CB67D';
    default:
      return '#6246EA';
  }
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { activities, loading, error } = useActivities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{t.recentActivity}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          General project actions and workspace history.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="border-foreground/10">
            <CardContent className="p-12 text-center">
              <p className="text-foreground/60">Loading activity...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-foreground/10">
            <CardContent className="p-12 text-center">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : activities.length === 0 ? (
          <Card className="border-foreground/10">
            <CardContent className="p-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-foreground/20" />
              <p className="text-foreground/60">No activity has been recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);

            return (
              <Card
                key={activity.id}
                className="cursor-pointer border-foreground/10 transition-all hover:border-foreground/20"
                onClick={() => navigate(activity.targetPath)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 rounded-lg p-3"
                      style={{ backgroundColor: color + '20' }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{activity.type}</Badge>
                        <span className="whitespace-nowrap text-xs text-foreground/50">
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-semibold">{activity.title}</h4>
                      <p className="text-sm text-foreground/70">{activity.message}</p>
                      <p className="mt-2 text-xs text-foreground/50">{activity.actorName}</p>
                    </div>
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
