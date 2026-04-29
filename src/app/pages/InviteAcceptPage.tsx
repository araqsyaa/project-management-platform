import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [message, setMessage] = useState('Validating invite...');
  const [joining, setJoining] = useState(false);
  const [isInviteValid, setIsInviteValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage('Invalid invite link.');
      setIsInviteValid(false);
      return;
    }

    api.inviteDetails(token)
      .then((details) => {
        setProjectName(details.projectName);
        if (details.revoked || details.expired || details.usageExceeded) {
          setIsInviteValid(false);
          setMessage('This invite is no longer valid.');
          return;
        }
        setIsInviteValid(true);
        setMessage('Invite is valid.');
      })
      .catch(() => {
        setIsInviteValid(false);
        setMessage('Invite not found.');
      });
  }, [token]);

  const handleJoinProject = async () => {
    if (!token || !isInviteValid) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    try {
      setJoining(true);
      const membership = await api.acceptProjectInvite(token);
      navigate(`/projects/${membership.project.id}`);
    } catch {
      setMessage('Failed to join project. Invite may be expired or already used.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border border-foreground/10 p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Project Invite</h1>
        {projectName && <p className="text-foreground/70">You were invited to join: <strong>{projectName}</strong></p>}
        <p className="text-sm text-foreground/70">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/projects')}>Go to Projects</Button>
          <Button onClick={handleJoinProject} disabled={!isInviteValid || joining}>
            {joining ? 'Joining...' : isAuthenticated ? 'Join Project' : 'Sign in to Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}
