import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, Rocket, ExternalLink } from 'lucide-react';
import { api, getUserId, getProvider, getAiKey, type Job } from '../lib/api';
import { Card, CardTitle, Btn, inputCls, Spinner, ErrorBox, Empty } from '../components/ui';

export default function Jobs() {
  const [userId] = useState(getUserId());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sources, setSources] = useState({ linkedin: true, naukri: true });
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await api.listJobs({ limit: 30, q: q || undefined });
      setJobs(r.jobs || []);
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

  async function scrape(dryRun: boolean) {
    if (!userId) {
      setError('Set your User ID in Settings first');
      return;
    }
    setScraping(true);
    setError('');
    setNotice('');
    try {
      const srcs = Object.entries(sources).filter(([, v]) => v).map(([k]) => k);
      const r = await api.scrapeJobs({ userId, sources: srcs, hoursBack: 24, maxJobs: 50, dryRun });
      setNotice(dryRun ? `Scanned ${(r.jobs || []).length} fresh jobs (dry-run, nothing stored)` : `Stored ${r.inserted ?? (r.jobs || []).length} new jobs`);
      if (!dryRun) load();
      else setJobs(r.jobs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scrape failed');
    } finally {
      setScraping(false);
    }
  }

  async function autoApply(dryRun: boolean) {
    if (!userId) {
      setError('Set your User ID in Settings first');
      return;
    }
    setApplying(true);
    setError('');
    setNotice('');
    try {
      const r = await api.autoApply({
        userId,
        provider: getProvider(),
        apiKey: getAiKey() || undefined,
        maxApplies: 5,
        dryRun,
      });
      setNotice(dryRun ? `Dry-run queued (${r.jobId}). Check Applications.` : `Auto-apply queued (${r.jobId}). Check Applications.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Queue failed');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            24h job <span className="grad-text">radar</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">LinkedIn + Naukri watch, tailored resumes, one-click apply.</p>
        </div>
        <Link to="/applications">
          <Btn variant="ghost">View applications</Btn>
        </Link>
      </div>

      <Card>
        <CardTitle sub="Scan the last 24 hours for matching posts">Watch controls</CardTitle>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={sources.linkedin} onChange={(e) => setSources({ ...sources, linkedin: e.target.checked })} className="h-4 w-4 accent-cyan-400" />
            LinkedIn
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={sources.naukri} onChange={(e) => setSources({ ...sources, naukri: e.target.checked })} className="h-4 w-4 accent-cyan-400" />
            Naukri
          </label>
          <div className="flex flex-1 gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter stored jobs…" className={inputCls} />
            <Btn variant="soft" onClick={load}>Search</Btn>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn variant="ghost" onClick={() => scrape(true)} disabled={scraping}>
            {scraping ? <Spinner label="Scanning…" /> : (<><Radar size={16} /> Scan now (dry-run)</>)}
          </Btn>
          <Btn variant="ghost" onClick={() => scrape(false)} disabled={scraping}>Scan + store</Btn>
          <Btn onClick={() => autoApply(true)} disabled={applying}>
            {applying ? <Spinner label="Queueing…" /> : (<><Rocket size={16} /> Auto-apply dry-run</>)}
          </Btn>
          <Btn variant="danger" onClick={() => autoApply(false)} disabled={applying}>Go live (apply!)</Btn>
        </div>
        <ErrorBox message={error} />
        {notice && <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Spinner label="Loading jobs…" />
        ) : jobs.length === 0 ? (
          <div className="md:col-span-2"><Empty title="No jobs yet" sub="Hit “Scan now” to pull the last 24h of posts." /></div>
        ) : (
          jobs.map((j) => (
            <Card key={j.id} className="transition hover:border-cyan-400/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{j.title}</p>
                  <p className="text-sm text-slate-400">{j.company} · {j.location}</p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-700 px-2 py-0.5 text-xs capitalize text-slate-300">{j.source}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-400">{j.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{j.postedAt ? new Date(j.postedAt).toLocaleString() : ''}</span>
                <a href={j.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
                  Open <ExternalLink size={14} />
                </a>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
