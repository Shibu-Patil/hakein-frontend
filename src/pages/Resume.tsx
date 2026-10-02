import { useState } from 'react';
import { Wand2, Link2, Copy, Check } from 'lucide-react';
import { api, getUserId, type AtsScore } from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox, ScoreRing, Empty } from '../components/ui';

export default function Resume() {
  const [userId] = useState(getUserId());
  const [mode, setMode] = useState<'jd' | 'url'>('jd');
  const [jd, setJd] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [resume, setResume] = useState('');
  const [ats, setAts] = useState<AtsScore | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchJd() {
    if (!url.trim()) return;
    setFetching(true);
    setError('');
    try {
      const r = await api.extractJd(url.trim());
      setJd(r.jobDescription);
      setMode('jd');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch JD from that link');
    } finally {
      setFetching(false);
    }
  }

  async function generate() {
    if (!userId) {
      setError('Finish Setup first so we have your profile.');
      return;
    }
    if (!jd.trim()) {
      setError('Paste a job description or fetch one from a link.');
      return;
    }
    setLoading(true);
    setError('');
    setResume('');
    setAts(null);
    try {
      const u = await api.getUser(userId);
      const r = await api.generateResume({
        userProfile: u.profile,
        jobInput: { type: 'jd', content: jd.trim() },
        options: { format: 'ats' },
      });
      setResume(r.resume);
      setAts(r.atsScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tailor a <span className="grad-text">resume</span></h1>
        <p className="mt-1 text-sm text-slate-400">Paste a JD or job link — we use your saved profile.</p>
      </div>
      <ErrorBox message={error} />

      {!userId ? (
        <Empty title="No profile yet" sub="Finish Setup once, then make resumes here." />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex gap-2">
              <Btn variant={mode === 'jd' ? 'soft' : 'ghost'} onClick={() => setMode('jd')}>JD text</Btn>
              <Btn variant={mode === 'url' ? 'soft' : 'ghost'} onClick={() => setMode('url')}>Job link</Btn>
            </div>
            {mode === 'jd' ? (
              <Field label="Job description">
                <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={10} placeholder="Paste the full JD here…" className={inputCls} />
              </Field>
            ) : (
              <Field label="Job link (LinkedIn / Naukri / any posting)">
                <div className="flex gap-2">
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                  <Btn variant="soft" onClick={fetchJd} disabled={fetching || !url.trim()}>
                    {fetching ? <Spinner label="…" /> : (<><Link2 size={15} /> Fetch</>)}
                  </Btn>
                </div>
              </Field>
            )}
            <div className="mt-4">
              <Btn onClick={generate} disabled={loading} className="w-full py-3">
                {loading ? <Spinner label="Tailoring…" /> : (<><Wand2 size={16} /> Make my resume</>)}
              </Btn>
            </div>
          </Card>

          {(resume || ats) && (
            <div className="grid gap-5 md:grid-cols-[1fr_200px]">
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <CardTitle sub="Copy it anywhere">Your tailored resume</CardTitle>
                  <Btn variant="ghost" onClick={() => { navigator.clipboard.writeText(resume); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                    {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
                  </Btn>
                </div>
                <pre className="resume-output max-h-[480px] overflow-auto rounded-xl bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">{resume}</pre>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-2 text-center">
                {ats ? (
                  <>
                    <ScoreRing score={ats.score} />
                    <p className="text-sm text-slate-400">ATS match</p>
                    {!!ats.missingKeywords?.length && (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {ats.missingKeywords.slice(0, 8).map((k) => (
                          <span key={k} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">{k}</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : <Spinner label="Scoring…" />}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
