import { useState } from 'react';
import { Plug, KeyRound, UserPlus, ShieldCheck } from 'lucide-react';
import {
  api,
  getApiBase, getUserId, getProvider, getAiKey,
  API_BASE_KEY, USER_ID_KEY, PROVIDER_KEY, API_KEY_KEY,
} from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox } from '../components/ui';

export default function Settings() {
  const [apiBase, setApiBase] = useState(getApiBase());
  const [userId, setUserId] = useState(getUserId());
  const [provider, setProvider] = useState(getProvider());
  const [aiKey, setAiKey] = useState(getAiKey());

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('react, node.js, typescript');
  const [locations, setLocations] = useState('Bengaluru, Remote');

  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [naEmail, setNaEmail] = useState('');
  const [naPass, setNaPass] = useState('');

  const [answerMode, setAnswerMode] = useState<'assisted' | 'full-auto'>('assisted');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyTopic, setNotifyTopic] = useState('');

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [health, setHealth] = useState('');

  function persistLocal() {
    localStorage.setItem(API_BASE_KEY, apiBase.replace(/\/$/, ''));
    localStorage.setItem(USER_ID_KEY, userId.trim());
    localStorage.setItem(PROVIDER_KEY, provider);
    localStorage.setItem(API_KEY_KEY, aiKey.trim());
    setNotice('Local settings saved.');
  }

  async function checkHealth() {
    setBusy('health');
    setError('');
    setHealth('');
    try {
      const h = await api.health();
      setHealth(`Backend OK (${h.timestamp})`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Health check failed');
    } finally {
      setBusy('');
    }
  }

  async function createUser() {
    setBusy('user');
    setError('');
    setNotice('');
    try {
      const r = await api.createUser({
        email,
        name: name || undefined,
        profile: { name: name || email.split('@')[0], email },
        preferences: {
          keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
          locations: locations.split(',').map((s) => s.trim()).filter(Boolean),
          roles: [],
          autoApply: false,
          easyApplyOnly: true,
          sources: ['linkedin', 'naukri'],
        },
      });
      setUserId(r.id);
      localStorage.setItem(USER_ID_KEY, r.id);
      setNotice(`User ready. ID: ${r.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy('');
    }
  }

  async function saveNotifications() {
    if (!userId) {
      setError('Set User ID first');
      return;
    }
    setBusy('notif');
    setError('');
    setNotice('');
    try {
      const u = await api.getUser(userId);
      await api.savePreferences(userId, {
        ...(u.preferences || {}),
        autoAnswerMode: answerMode,
        notifyEmail: notifyEmail || undefined,
        notifyTopic: notifyTopic || undefined,
      });
      setNotice('Notifications saved. Assisted = ask you on phone. Full-auto = answer everything, no stops.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy('');
    }
  }

  async function saveCreds() {
    if (!userId) {
      setError('Set User ID first');
      return;
    }
    setBusy('creds');
    setError('');
    setNotice('');
    try {
      const payload: Record<string, string> = {};
      if (liEmail) payload.linkedinEmail = liEmail;
      if (liPass) payload.linkedinPassword = liPass;
      if (naEmail) payload.naukriEmail = naEmail;
      if (naPass) payload.naukriPassword = naPass;
      await api.saveCredentials(userId, payload);
      setLiPass('');
      setNaPass('');
      setNotice('Credentials saved (encrypted, never returned).');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy('');
    }
  }

  async function verify(platform: 'linkedin' | 'naukri') {
    if (!userId) {
      setError('Set User ID first');
      return;
    }
    setBusy(`verify-${platform}`);
    setError('');
    setNotice('');
    try {
      const r = await api.verifyCredentials(userId, { platform });
      if (r.ok) setNotice(`${platform} login works.`);
      else setError(r.error || `${platform} login failed`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Set<span className="grad-text">tings</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">Connect backend, identity, AI keys, and portal logins.</p>
      </div>
      <ErrorBox message={error} />
      {notice && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle sub="Stored in this browser only">Connection + AI</CardTitle>
          <div className="space-y-3">
            <Field label="Backend URL">
              <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://localhost:3000" className={inputCls} />
            </Field>
            <Field label="User ID (from backend)">
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Mongo ObjectId…" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="AI provider">
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls}>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </Field>
              <Field label="AI key">
                <input type="password" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="AIza…" className={inputCls} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Btn onClick={persistLocal}><Plug size={16} /> Save locally</Btn>
              <Btn variant="ghost" onClick={checkHealth} disabled={busy === 'health'}>
                {busy === 'health' ? <Spinner label="Pinging…" /> : 'Check backend'}
              </Btn>
            </div>
            {health && <p className="text-sm text-emerald-300">{health}</p>}
          </div>
        </Card>

        <Card>
          <CardTitle sub="Creates the DB user the watcher + auto-apply need">Bootstrap user</CardTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
              </Field>
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
              </Field>
            </div>
            <Field label="Keywords (comma separated)">
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Locations (comma separated)">
              <input value={locations} onChange={(e) => setLocations(e.target.value)} className={inputCls} />
            </Field>
            <Btn onClick={createUser} disabled={busy === 'user' || !email.includes('@')}>
              {busy === 'user' ? <Spinner label="Creating…" /> : (<><UserPlus size={16} /> Create / upsert user</>)}
            </Btn>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Assisted asks you on your phone. Full-auto never stops.">Answer mode + phone alerts (free)</CardTitle>
          <div className="space-y-3">
            <Field label="Screening-question mode">
              <select value={answerMode} onChange={(e) => setAnswerMode(e.target.value as 'assisted' | 'full-auto')} className={inputCls}>
                <option value="assisted">Assisted (recommended) — popup on phone when unsure</option>
                <option value="full-auto">Full-auto — best-effort everything, never stop</option>
              </select>
            </Field>
            <Field label="Notify email (Gmail app pops up on your phone)" hint="Free via Gmail SMTP. Needs GMAIL_USER + App Password on backend.">
              <input value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="you@gmail.com" className={inputCls} />
            </Field>
            <Field label="ntfy topic (instant push, app closed too)" hint="Install ntfy app, subscribe to this topic. Free.">
              <input value={notifyTopic} onChange={(e) => setNotifyTopic(e.target.value)} placeholder="hakein-yourname-123" className={inputCls} />
            </Field>
            <Btn onClick={saveNotifications} disabled={busy === 'notif'}>
              {busy === 'notif' ? <Spinner label="Saving…" /> : 'Save notifications'}
            </Btn>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle sub="Encrypted at rest. Verify tests login without applying.">Portal logins</CardTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3 rounded-xl bg-slate-950/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound size={16} /> LinkedIn</p>
              <Field label="Email">
                <input value={liEmail} onChange={(e) => setLiEmail(e.target.value)} placeholder="linkedin email" className={inputCls} />
              </Field>
              <Field label="Password">
                <input type="password" value={liPass} onChange={(e) => setLiPass(e.target.value)} placeholder="••••••" className={inputCls} />
              </Field>
              <Btn variant="ghost" onClick={() => verify('linkedin')} disabled={busy === 'verify-linkedin'}>
                {busy === 'verify-linkedin' ? <Spinner label="Logging in…" /> : (<><ShieldCheck size={16} /> Test LinkedIn login</>)}
              </Btn>
            </div>
            <div className="space-y-3 rounded-xl bg-slate-950/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound size={16} /> Naukri</p>
              <Field label="Email">
                <input value={naEmail} onChange={(e) => setNaEmail(e.target.value)} placeholder="naukri email" className={inputCls} />
              </Field>
              <Field label="Password">
                <input type="password" value={naPass} onChange={(e) => setNaPass(e.target.value)} placeholder="••••••" className={inputCls} />
              </Field>
              <Btn variant="ghost" onClick={() => verify('naukri')} disabled={busy === 'verify-naukri'}>
                {busy === 'verify-naukri' ? <Spinner label="Logging in…" /> : (<><ShieldCheck size={16} /> Test Naukri login</>)}
              </Btn>
            </div>
          </div>
          <div className="mt-4">
            <Btn onClick={saveCreds} disabled={busy === 'creds'}>
              {busy === 'creds' ? <Spinner label="Saving…" /> : 'Save portal credentials'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
