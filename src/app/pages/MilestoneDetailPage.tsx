import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { t } from '../i18n/translations';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { api, ApiTask, ApiMilestone } from '../api/client';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Trash2 } from 'lucide-react';

export default function MilestoneDetailPage() {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = !milestoneId || location.pathname.endsWith('/milestones/new');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [milestone, setMilestone] = useState<ApiMilestone | null>(null);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.project(projectId).then((p) => {
        setProjectTitle(p.name);
        return p;
      }),
      api.projectTasks(projectId).then((taskList) => {
        setTasks(taskList);
        return taskList;
      }),
      isNew
        ? Promise.resolve(null)
        : milestoneId
          ? api.milestone(milestoneId).then((m) => {
              setMilestone(m);
              setName(m.name);
              setDescription(m.description ?? '');
              setDueDate(m.dueDate ?? '');
              return m;
            })
          : Promise.resolve(null),
    ])
      .then(([, taskList, m]) => {
        if (!isNew && milestoneId && taskList && taskList.length > 0) {
          const ids = taskList
            .filter((task) => task.milestone && String(task.milestone.id) === milestoneId)
            .map((t) => String(t.id));
          setSelectedTaskIds(ids);
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [projectId, milestoneId, isNew]);


  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSave = async () => {
    if (!projectId || !name.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      let savedMilestone: ApiMilestone | null = null;
      if (isNew) {
        savedMilestone = await api.createMilestone(projectId, {
          name: name.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          taskIds: selectedTaskIds,
        });
        toast.success('Milestone created');
      } else if (milestoneId) {
        savedMilestone = await api.updateMilestone(projectId, milestoneId, {
          name: name.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          taskIds: selectedTaskIds,
        });
        toast.success('Milestone updated');
      }
      navigate(`/projects/${projectId}?tab=milestones`, {
        state: savedMilestone
          ? {
              savedMilestone: {
                id: String(savedMilestone.id),
                projectId,
                title: savedMilestone.name,
                description: savedMilestone.description || '',
                dueDate: savedMilestone.dueDate || '',
                completed: savedMilestone.completed,
              },
            }
          : undefined,
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !milestoneId || isNew) return;
    if (!window.confirm('Delete this milestone? Assigned tasks will be kept and unlinked from the milestone.')) {
      return;
    }

    setDeleting(true);
    try {
      await api.deleteMilestone(projectId, milestoneId);
      toast.success('Milestone deleted');
      navigate(`/projects/${projectId}?tab=milestones`, {
        state: { deletedMilestoneId: milestoneId },
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete milestone');
    } finally {
      setDeleting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-8">
        <p>Project not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${projectId}?tab=milestones`)}
          title={t.close}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            {isNew ? t.addMilestone : t.edit}
          </h1>
          <p className="mt-1 text-lg text-foreground/60">
            {projectTitle}
          </p>
        </div>
      </div>

      <Card className="border-foreground/10">
        <CardContent className="space-y-7 p-8">
          {!isNew && milestone && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/10 bg-secondary/5 px-4 py-3">
              {milestone.completed ? (
                <Badge className="text-sm" style={{ backgroundColor: '#2CB67D20', color: '#2CB67D' }}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Completed
                </Badge>
              ) : (
                <Badge className="text-sm" style={{ backgroundColor: '#6246EA20', color: '#6246EA' }}>
                  <Circle className="mr-1 h-4 w-4" />
                  In Progress
                </Badge>
              )}
              <span className="text-base text-foreground/70">
                {milestone.completed
                  ? 'All assigned tasks are done.'
                  : 'Complete all assigned tasks to mark this milestone done.'}
              </span>
            </div>
          )}

          <div className="max-w-2xl space-y-2.5">
            <Label htmlFor="milestone-name" className="text-lg font-semibold">Title *</Label>
            <Input
              id="milestone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 border border-foreground/20 text-lg placeholder:text-base"
              placeholder="Milestone title"
            />
          </div>
          <div className="max-w-2xl space-y-2.5">
            <Label htmlFor="milestone-desc" className="text-lg font-semibold">{t.description} (optional)</Label>
            <Textarea
              id="milestone-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-foreground/20 text-lg placeholder:text-base"
              placeholder="Describe this milestone"
            />
          </div>
          <div className="max-w-sm space-y-2.5">
            <Label htmlFor="milestone-due" className="text-lg font-semibold">{t.dueDate}</Label>
            <Input
              id="milestone-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-12 border border-foreground/20 text-lg"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Tasks in this milestone</Label>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
              Select which tasks belong to this milestone. The milestone is marked done when all assigned tasks are completed.
            </p>
            <div className="max-h-72 max-w-3xl space-y-2 overflow-y-auto rounded-lg border border-foreground/20 p-4">
              {tasks.length === 0 ? (
                <p className="text-base text-foreground/55">No tasks in this project yet.</p>
              ) : (
                tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer flex-wrap items-center gap-3 rounded px-3 py-2.5 hover:bg-foreground/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(String(task.id))}
                      onChange={() => toggleTask(String(task.id))}
                      className="h-5 w-5 rounded border-foreground/30"
                    />
                    <span className="text-base font-medium">{task.title}</span>
                    <span className="text-sm text-foreground/50">ID: {task.id}</span>
                    {task.status && (
                      <Badge variant="secondary" className="text-sm capitalize">
                        {task.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-foreground/10 pt-5">
            {!isNew && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="mr-auto h-11 px-5 text-base text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Deleting...' : t.delete}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}?tab=milestones`)}
              disabled={saving || deleting}
              className="h-11 px-5 text-base"
            >
              {t.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting} className="h-11 px-6 text-base">
              {saving ? 'Saving...' : isNew ? t.create : t.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
