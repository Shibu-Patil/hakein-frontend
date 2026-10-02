import { useEffect, useState } from 'react';
import { api, getUserId, type Application } from '../lib/api';
import { Card, StatusBadge, Spinner, ErrorBox, Empty, Btn, Field, inputCls } from '../components/ui';

export default function Applications() {
  const [userId] = useState(getUserId());
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const r = await api.listApplications(userId);
      setApps(r.applications || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = filter === 'all' ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Appli<span className="grad-text">cations</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Every tailored resume sent, queued, or waiting on you.</p>
        </div>
        <div className="flex items-center gap-2">
          <Field label="">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
              <option value="pending">Pending</option>
              <option value="needs_review">Needs review</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
            </select>
          </Field>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </div>

      <ErrorBox message={error} />
      {!userId ? (
        <Empty title="No user connected" sub="Set your User ID in Settings to see applications." />
      ) : loading ? (
        <Spinner label="Loading applications…" />
      ) : shown.length === 0 ? (
        <Empty title="Nothing here yet" sub="Queue a dry-run from Jobs and results land here." />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {a.job?.title} <span className="text-slate-500">@ {a.job?.company}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.job?.source} · {a.job?.location} · {new Date(a.createdAt).toLocaleString()}
                    {a.error ? ` · ${a.error}` : ''}
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <Btn variant="ghost" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  {open === a.id ? 'Hide' : 'Details'}
                </Btn>
              </div>
              {open === a.id && (
                <div className="mt-4 grid gap-4 border-t border-slate-800 pt-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Answers submitted</p>
                    {(a.response as { answersUsed?: Array<{ question: string; answer: string; source: string }> } | undefined)?.answersUsed?.length ? (
                      <ul className="space-y-2">
                        {((a.response as { answersUsed: Array<{ question: string; answer: string; source: string }> }).answersUsed).map((x, i) => (
                          <li key={i} className="rounded-lg bg-slate-950/60 p-2.5 text-sm">
                            <p className="text-slate-300">{x.question}</p>
                            <p className="mt-0.5 text-white">→ {x.answer} <span className="ml-1 text-xs text-slate-500">({x.source})</span></p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No screening answers recorded.</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Job description</p>
                    <p className="max-h-64 overflow-auto whitespace-pre-wrap text-sm text-slate-400">{a.job?.description}</p>
                    <a href={a.job?.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-cyan-300 hover:text-cyan-200">
                      Open job →
                    </a>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
