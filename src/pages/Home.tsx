import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api, getUserId, type Application } from '../lib/api';
import { Card, Btn, StatusBadge, Spinner, ErrorBox, Empty } from '../components/ui';

export default function Home() {
  const [userId] = useState(getUserId());
  const [apps, setApps] = useState<Application[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [watching, setWatching] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [a, u, inbox] = await Promise.all([
        api.listApplications(userId),
        api.getUser(userId),
        api.inbox(userId),
      ]);
      setApps(a.applications || []);
      setWatching(!!(u.preferences as { autoApply?: boolean })?.autoApply);
      setInboxCount(inbox.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [userId, load]);

  async function toggleWatch() {
    if (!userId || watching === null) return;
    try {
      const u = await api.getUser(userId);
      await api.savePreferences(userId, { ...(u.preferences || {}), autoApply: !watching });
      setWatching(!watching);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  if (!userId) {
    return (
      <div className="pt-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Jobs apply <span className="grad-text">themselves</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-slate-400">
          Give your details once. We watch LinkedIn + Naukri all day and apply with a tailored resume for
          every matching job.
        </p>
        <div className="mt-6">
          <Link to="/setup">
            <Btn className="px-6 py-3 text-base">Get started <ArrowRight size={17} /></Btn>
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toDateString();
  const todayApps = apps.filter((a) => new Date(a.createdAt).toDateString() === today);
  const appliedToday = todayApps.filter((a) => a.status === 'applied').length;

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${watching ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <p className="font-semibold text-white">{watching ? 'Watching jobs right now' : watching === null ? '…' : 'Paused'}</p>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {appliedToday} applied today · {inboxCount} need{inboxCount === 1 ? 's' : ''} your answer
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Btn variant="ghost" onClick={toggleWatch} disabled={watching === null}>
            {watching ? (<><Pause size={15} /> Pause</>) : (<><Play size={15} /> Resume</>)}
          </Btn>
          {inboxCount > 0 && (
            <Link to="/inbox">
              <Btn>Answer {inboxCount} question{inboxCount === 1 ? '' : 's'}</Btn>
            </Link>
          )}
        </div>
      </Card>

      <ErrorBox message={error} />
      {loading ? (
        <div className="text-center"><Spinner label="Loading…" /></div>
      ) : todayApps.length === 0 ? (
        <Empty title="Nothing applied yet today" sub="New matches are picked up automatically through the day." />
      ) : (
        <div className="space-y-2.5">
          {todayApps.slice(0, 20).map((a) => (
            <Card key={a.id} className="flex items-center gap-3 !p-4">
              <CheckCircle2 size={18} className={a.status === 'applied' ? 'text-emerald-400' : 'text-slate-500'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {a.job?.title} <span className="text-slate-500">@ {a.job?.company}</span>
                </p>
                <p className="text-xs text-slate-500">{a.job?.source} · {new Date(a.createdAt).toLocaleTimeString()}</p>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
