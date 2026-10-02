import { useState } from 'react';
import { Wand2, Link2, Copy, Download, Check } from 'lucide-react';
import { api, getProvider, getAiKey, type AtsScore } from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox, ScoreRing } from '../components/ui';

const SAMPLE_PROFILE = {
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  phone: '+91 98765 43210',
  location: 'Bengaluru, India',
  linkedin: 'https://linkedin.com/in/aarav',
  github: 'https://github.com/aarav',
  summary: 'Full-stack developer with 4 years of experience building React + Node.js apps.',
  experience: [
    {
      company: 'TechCorp',
      role: 'Senior Frontend Engineer',
      startDate: '01/2022',
      endDate: 'Present',
      description: ['Shipped dashboard used by 40k users', 'Cut bundle size by 35%'],
      technologies: ['React', 'TypeScript', 'Node.js'],
    },
  ],
  education: [
    { institution: 'VTU', degree: 'B.E.', field: 'Computer Science', graduationDate: '05/2020' },
  ],
  skills: { technical: ['React', 'Node.js', 'TypeScript'], soft: ['Communication'], tools: ['Git', 'Docker'] },
  projects: [],
  certifications: [],
};

export default function Resume() {
  const [profile, setProfile] = useState(JSON.stringify(SAMPLE_PROFILE, null, 2));
  const [jdMode, setJdMode] = useState<'jd' | 'url'>('jd');
  const [jd, setJd] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState(getProvider());
  const [apiKey, setApiKey] = useState(getAiKey());
  const [loading, setLoading] = useState(false);
  const [fetchingJd, setFetchingJd] = useState(false);
  const [error, setError] = useState('');
  const [resume, setResume] = useState('');
  const [ats, setAts] = useState<AtsScore | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchJdFromUrl() {
    setError('');
    setFetchingJd(true);
    try {
      const r = await api.extractJd(url);
      setJd(r.jobDescription);
      setJdMode('jd');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JD fetch failed');
    } finally {
      setFetchingJd(false);
    }
  }

  async function generate() {
    setError('');
    setResume('');
    setAts(null);
    let userProfile: unknown;
    try {
      userProfile = JSON.parse(profile);
    } catch {
      setError('Profile is not valid JSON');
      return;
    }
    if (jdMode === 'jd' && !jd.trim()) {
      setError('Paste a job description first');
      return;
    }
    if (jdMode === 'url' && !url.trim()) {
      setError('Paste a job URL first');
      return;
    }
    setLoading(true);
    try {
      const r = await api.generateResume({
        provider,
        apiKey: apiKey || undefined,
        userProfile,
        jobInput: jdMode === 'jd' ? { type: 'jd', content: jd } : { type: 'url', url },
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

  function copy() {
    navigator.clipboard.writeText(resume).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function download() {
    const blob = new Blob([resume], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tailored-resume.txt';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Resume <span className="grad-text">builder</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">Paste a JD or job link → get a tailored, ATS-safe resume.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle sub="Your base profile as JSON (saved per user in Settings)">Profile</CardTitle>
          <textarea
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            rows={16}
            spellCheck={false}
            className={`${inputCls} font-mono text-xs leading-relaxed`}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="AI provider">
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls}>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </Field>
            <Field label="API key (or set in Settings)">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza…"
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Either paste the JD or drop a job link">Job input</CardTitle>
          <div className="mb-3 flex gap-2">
            <Btn variant={jdMode === 'jd' ? 'soft' : 'ghost'} onClick={() => setJdMode('jd')}>
              JD text
            </Btn>
            <Btn variant={jdMode === 'url' ? 'soft' : 'ghost'} onClick={() => setJdMode('url')}>
              Job link
            </Btn>
          </div>
          {jdMode === 'jd' ? (
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={12}
              placeholder="Paste the full job description here…"
              className={inputCls}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/…"
                  className={inputCls}
                />
                <Btn variant="soft" onClick={fetchJdFromUrl} disabled={fetchingJd || !url.trim()}>
                  <Link2 size={16} /> {fetchingJd ? 'Fetching…' : 'Fetch JD'}
                </Btn>
              </div>
              <p className="text-xs text-slate-500">Fetch pulls the JD into the text tab so you can review it.</p>
            </div>
          )}
          <div className="mt-4">
            <Btn onClick={generate} disabled={loading} className="w-full py-3">
              {loading ? <Spinner label="Tailoring resume…" /> : (<><Wand2 size={16} /> Generate tailored resume</>)}
            </Btn>
          </div>
          <ErrorBox message={error} />
        </Card>
      </div>

      {(resume || ats) && (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle sub="ATS-safe plain text — copy or download">Tailored resume</CardTitle>
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}</Btn>
                <Btn variant="ghost" onClick={download}><Download size={16} /> .txt</Btn>
              </div>
            </div>
            <pre className="resume-output max-h-[560px] overflow-auto rounded-xl bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">
              {resume}
            </pre>
          </Card>
          <Card>
            <CardTitle sub="How well it matches this JD">ATS score</CardTitle>
            {ats ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ScoreRing score={ats.score} />
                  <p className="text-sm text-slate-400">
                    {ats.score >= 85 ? 'Excellent — ready to apply.' : ats.score >= 70 ? 'Good — check missing keywords.' : 'Needs work — review recommendations.'}
                  </p>
                </div>
                {ats.breakdown && (
                  <div className="space-y-2">
                    {Object.entries(ats.breakdown).map(([k, v]) => (
                      <div key={k}>
                        <div className="mb-1 flex justify-between text-xs text-slate-400">
                          <span className="capitalize">{k}</span>
                          <span>{v}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" style={{ width: `${Math.min(100, v)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!!ats.missingKeywords?.length && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">Missing keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ats.missingKeywords.map((k) => (
                        <span key={k} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!!ats.recommendations?.length && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {ats.recommendations.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                )}
              </div>
            ) : (
              <Spinner label="Scoring…" />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
