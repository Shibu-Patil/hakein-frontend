import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Send, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { api, getUserId, type Application } from '../lib/api';
import { Card, CardTitle, StatusBadge, Spinner, ErrorBox, Empty, Btn } from '../components/ui';

export default function Dashboard() {
  const userId = getUserId();
  const [apps, setApps] = useState<Application[]>([]);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([api.listApplications(userId), api.matches(userId)])
      .then(([a, m]) => {
        setApps(a.applications || []);
        setMatchCount(m.count ?? (m.jobs || []).length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl pt-10 text-center">
        <div className="animate-float-slow mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-2xl shadow-indigo-500/30">
          <Sparkles className="text-white" size={34} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Your AI job search <span className="grad-text">autopilot</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-slate-400">
          Tailor resumes to every JD with 100% ATS formatting, watch LinkedIn + Naukri 24×7, and auto-apply
          with screening questions answered from your profile.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/settings">
            <Btn>
              Connect your profile <ArrowRight size={16} />
            </Btn>
          </Link>
          <Link to="/resume">
            <Btn variant="ghost">Try resume builder</Btn>
          </Link>
        </div>
      </div>
    );
  }

  const applied = apps.filter((a) => a.status === 'applied').length;
  const pending = apps.filter((a) => a.status === 'pending').length;
  const review = apps.filter((a) => a.status === 'needs_review').length;

  const stats = [
    { label: 'New matches (24h)', value: matchCount ?? '—', icon: Briefcase, grad: 'from-cyan-400 to-sky-600' },
    { label: 'Applied', value: applied, icon: Send, grad: 'from-emerald-400 to-teal-600' },
    { label: 'Dry-run queue', value: pending, icon: FileText, grad: 'from-amber-400 to-orange-600' },
    { label: 'Needs review', value: review, icon: AlertCircle, grad: 'from-fuchsia-400 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good hunting <span className="grad-text">today</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Live view of your 24h job watch + auto-apply pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/jobs">
            <Btn variant="ghost">Find jobs</Btn>
          </Link>
          <Link to="/resume">
            <Btn>Build resume</Btn>
          </Link>
        </div>
      </div>

      <ErrorBox message={error} />
      {loading ? (
        <Spinner label="Loading overview…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="relative overflow-hidden">
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.grad} opacity-20 blur-2xl`} />
                <s.icon size={20} className="text-slate-300" />
                <p className="mt-3 text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-slate-400">{s.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardTitle sub="Latest across LinkedIn + Naukri">Recent applications</CardTitle>
            {apps.length === 0 ? (
              <Empty title="No applications yet" sub="Run a dry-run from Jobs to see tailored resumes queue up here." />
            ) : (
              <div className="divide-y divide-slate-800">
                {apps.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {a.job?.title} <span className="text-slate-500">@ {a.job?.company}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.job?.source} · {a.job?.location} · {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
