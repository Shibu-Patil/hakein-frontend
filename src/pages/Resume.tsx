import { useState } from 'react';
import { Wand2, Link2, Copy, Check, Upload, FileDown } from 'lucide-react';
import { api, getApiBase, getUserId, formatTokens, type AtsScore, type TokenUsage } from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox, ScoreRing } from '../components/ui';

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
  const [usage, setUsage] = useState<TokenUsage | { input: number; output: number; total: number } | null>(null);
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

  const [myResume, setMyResume] = useState('');
  const [srcMode, setSrcMode] = useState<'paste' | 'file'>('paste');
  const [file, setFile] = useState<File | null>(null);
  const [pdfReady, setPdfReady] = useState(false);

  async function generateFromFile() {
    if (!file) {
      setError('Choose your resume file first (PDF / Word / txt).');
      return;
    }
    const jobText = jd.trim();
    const jobUrl = mode === 'url' ? url.trim() : '';
    if (!jobText && !jobUrl) {
      setError('Paste a JD or give a job link too.');
      return;
    }
    setLoading(true);
    setError('');
    setPdfReady(false);
    setUsage(null);
    try {
      const form = new FormData();
      form.append('resume', file);
      if (jobText) form.append('jobText', jobText);
      else form.append('jobUrl', jobUrl);
      const res = await fetch(`${getApiBase()}/api/resume/tailor-file`, { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Failed (${res.status})` }));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tailored-resume.pdf';
      a.click();
      const score = Number(res.headers.get('X-ATS-Score'));
      if (score) setAts({ score });
      const tIn = Number(res.headers.get('X-Tokens-In'));
      const tOut = Number(res.headers.get('X-Tokens-Out'));
      const tTotal = Number(res.headers.get('X-Tokens-Total'));
      setUsage(tTotal ? { input: tIn || 0, output: tOut || 0, total: tTotal } : null);
      setResume('');
      setPdfReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    // Public file path returns a PDF download instead of on-screen text.
    if (!userId && srcMode === 'file') {
      await generateFromFile();
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
    setUsage(null);
    try {
      let r;
      if (userId) {
        // Logged in: tailor from saved profile.
        const u = await api.getUser(userId);
        r = await api.generateResume({
          userProfile: u.profile,
          jobInput: { type: 'jd', content: jd.trim() },
          options: { format: 'ats' },
        });
      } else {
        // Public: tailor from pasted resume text. No login needed.
        if (myResume.trim().length < 50) {
          setError('Paste your current resume above (or finish Setup once).');
          setLoading(false);
          return;
        }
        r = await api.tailorPublic({
          resumeText: myResume.trim(),
          jobInput: { type: 'jd', content: jd.trim() },
        });
      }
      setResume(r.resume);
      setAts(r.atsScore);
      setUsage(r.usage || null);
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
        <p className="mt-1 text-sm text-slate-400">
          {userId ? 'Paste a JD or job link — we use your saved profile.' : 'No login needed — paste your resume + a JD or job link.'}
        </p>
      </div>
      <ErrorBox message={error} />

      <>
        {!userId && (
          <Card>
            <div className="mb-3 flex gap-2">
              <Btn variant={srcMode === 'paste' ? 'soft' : 'ghost'} onClick={() => setSrcMode('paste')}>Paste resume</Btn>
              <Btn variant={srcMode === 'file' ? 'soft' : 'ghost'} onClick={() => setSrcMode('file')}>Upload PDF / Word</Btn>
            </div>
            {srcMode === 'paste' ? (
              <Field label="Your current resume (paste full text)">
                <textarea value={myResume} onChange={(e) => setMyResume(e.target.value)} rows={8} placeholder="Paste your current resume here…" className={inputCls} />
              </Field>
            ) : (
              <Field label="Resume file (.pdf, .doc, .docx, .txt — max 5MB). You get back a PDF.">
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-600 px-4 py-3 text-sm text-slate-200 hover:border-cyan-400/60">
                    <Upload size={16} />
                    {file ? file.name : 'Choose file…'}
                    <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  {file && <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>}
                </div>
              </Field>
            )}
          </Card>
        )}
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
                {loading
                  ? <Spinner label="Tailoring…" />
                  : (!userId && srcMode === 'file'
                    ? (<><FileDown size={16} /> Make my resume (PDF)</>)
                    : (<><Wand2 size={16} /> Make my resume</>))}
              </Btn>
            </div>
          </Card>

          {pdfReady && (
            <Card className="flex items-center gap-3 border-emerald-500/20">
              <FileDown size={20} className="text-emerald-300" />
              <div>
                <p className="font-medium text-white">Your tailored PDF downloaded.</p>
                <p className="text-sm text-slate-400">Check your downloads folder for tailored-resume.pdf{ats ? ` · ATS ${ats.score}` : ''}.</p>
                {formatTokens(usage) && <p className="mt-0.5 text-xs text-slate-500">{formatTokens(usage)}</p>}
              </div>
            </Card>
          )}

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
                {formatTokens(usage) && <p className="mt-2 text-xs text-slate-500">{formatTokens(usage)}</p>}
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
    </div>
  );
}
