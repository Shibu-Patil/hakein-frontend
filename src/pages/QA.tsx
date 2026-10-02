import { useEffect, useState } from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { api, getUserId, getProvider, getAiKey } from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox, Empty } from '../components/ui';

const QA_FIELDS = [
  'workAuth', 'sponsorship', 'noticeDays', 'ctc', 'expectedCtc',
  'relocation', 'remote', 'experienceYears', 'location', 'dob', 'gender',
];

export default function QA() {
  const [userId] = useState(getUserId());
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Array<{ id: string; question: string; answer: string; source: string }>>([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [previewQ, setPreviewQ] = useState('');
  const [previewJd, setPreviewJd] = useState('');
  const [preview, setPreview] = useState<{ answer: string | null; source: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await api.getQa(userId);
      const p: Record<string, string> = {};
      for (const k of QA_FIELDS) {
        const v = (r.qaProfile as Record<string, unknown>)?.[k];
        p[k] = Array.isArray(v) ? v.join(', ') : (v ?? '').toString();
      }
      setProfile(p);
      setAnswers(r.answers || []);
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

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(profile)) if (v.trim()) payload[k] = v.trim();
      await api.saveQaProfile(userId, payload);
      setNotice('General answers saved — the engine uses these before LLM.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addPair() {
    if (!userId || !q.trim() || !a.trim()) return;
    setError('');
    try {
      await api.addQa(userId, { question: q.trim(), answer: a.trim() });
      setQ('');
      setA('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add failed');
    }
  }

  async function runPreview() {
    if (!userId || !previewQ.trim()) return;
    setError('');
    setPreview(null);
    try {
      const r = await api.answerPreview(userId, {
        question: previewQ.trim(),
        jobDescription: previewJd || undefined,
        provider: getProvider(),
        apiKey: getAiKey() || undefined,
      });
      setPreview(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Screening <span className="grad-text">Q&A</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Stored answers beat LLM guesses. Priority: stored → general profile → LLM → review.
        </p>
      </div>
      <ErrorBox message={error} />
      {notice && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}

      {!userId ? (
        <Empty title="No user connected" sub="Set your User ID in Settings first." />
      ) : loading ? (
        <Spinner label="Loading Q&A…" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardTitle sub="Used for work-auth, salary, notice, relocation…">General answers</CardTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {QA_FIELDS.map((k) => (
                <Field key={k} label={k}>
                  <input
                    value={profile[k] || ''}
                    onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                    placeholder="—"
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-4">
              <Btn onClick={saveProfile} disabled={saving}>{saving ? <Spinner label="Saving…" /> : 'Save general answers'}</Btn>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardTitle sub="Add exact pairs — matched first, no LLM needed">Saved answers ({answers.length})</CardTitle>
              <div className="mb-3 flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question…" className={inputCls} />
                <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Answer…" className={inputCls} />
                <Btn onClick={addPair} disabled={!q.trim() || !a.trim()}><Plus size={16} /></Btn>
              </div>
              <div className="max-h-64 space-y-2 overflow-auto">
                {answers.map((x) => (
                  <div key={x.id} className="rounded-lg bg-slate-950/60 p-2.5 text-sm">
                    <p className="text-slate-300">{x.question}</p>
                    <p className="mt-0.5 text-white">→ {x.answer} <span className="ml-1 text-xs text-slate-500">({x.source})</span></p>
                  </div>
                ))}
                {answers.length === 0 && <p className="text-sm text-slate-500">None yet — run the backend seed or add above.</p>}
              </div>
            </Card>

            <Card>
              <CardTitle sub="See exactly how a question would be answered">Answer preview</CardTitle>
              <div className="space-y-3">
                <Field label="Question">
                  <input value={previewQ} onChange={(e) => setPreviewQ(e.target.value)} placeholder="How many years of React experience?" className={inputCls} />
                </Field>
                <Field label="Job context (optional)">
                  <textarea value={previewJd} onChange={(e) => setPreviewJd(e.target.value)} rows={3} placeholder="Paste JD snippet…" className={inputCls} />
                </Field>
                <Btn variant="soft" onClick={runPreview}><FlaskConical size={16} /> Preview answer</Btn>
                {preview && (
                  <div className="rounded-xl bg-slate-950/60 p-3 text-sm">
                    <p className="text-white">→ {preview.answer ?? 'No answer'} <span className="ml-1 text-xs text-slate-500">({preview.source})</span></p>
                    {preview.error && <p className="mt-1 text-xs text-amber-300">{preview.error}</p>}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
