import { useState } from 'react';
import { Rocket, CheckCircle2 } from 'lucide-react';
import { api, USER_ID_KEY } from '../lib/api';
import { Card, CardTitle, Btn, Field, inputCls, Spinner, ErrorBox } from '../components/ui';

const QUICK = [
  { key: 'experienceYears', label: 'Total experience (years)' },
  { key: 'noticeDays', label: 'Notice period (days, 0 = immediate)' },
  { key: 'ctc', label: 'Current CTC' },
  { key: 'expectedCtc', label: 'Expected CTC' },
  { key: 'location', label: 'Current location' },
  { key: 'workAuth', label: 'Authorized to work? (yes/no)' },
  { key: 'sponsorship', label: 'Need sponsorship? (yes/no)' },
  { key: 'relocation', label: 'Open to relocate? (yes/no)' },
];

export default function Setup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('react, node.js');
  const [locations, setLocations] = useState('Bengaluru, Remote');
  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [naEmail, setNaEmail] = useState('');
  const [naPass, setNaPass] = useState('');
  const [gmail, setGmail] = useState('');
  const [gmailAppPass, setGmailAppPass] = useState('');
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState('');

  async function save() {
    setError('');
    setDoneId('');
    if (!email.includes('@')) {
      setError('Enter your email first.');
      return;
    }
    if ((!liEmail || !liPass) && (!naEmail || !naPass)) {
      setError('Add at least one login — LinkedIn or Naukri (both is best).');
      return;
    }
    setSaving(true);
    try {
      // 1. Account + job taste
      const u = await api.createUser({
        email,
        name: name || undefined,
        profile: { name: name || email.split('@')[0], email },
        preferences: {
          keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
          locations: locations.split(',').map((s) => s.trim()).filter(Boolean),
          roles: [],
          autoApply: true,
          easyApplyOnly: true,
          sources: ['linkedin', 'naukri'],
          autoAnswerMode: 'full-auto',
          notifyEmail: email,
        },
      });
      // 2. Portal logins + Gmail (all encrypted per-user in DB)
      const creds: Record<string, string> = {};
      if (liEmail && liPass) { creds.linkedinEmail = liEmail; creds.linkedinPassword = liPass; }
      if (naEmail && naPass) { creds.naukriEmail = naEmail; creds.naukriPassword = naPass; }
      if (gmail && gmailAppPass) { creds.gmailUser = gmail; creds.gmailAppPassword = gmailAppPass; }
      await api.saveCredentials(u.id, creds);
      // 3. Quick answers (whatever you fill — rest is automatic)
      const qa: Record<string, string> = {};
      for (const [k, v] of Object.entries(quick)) if (v.trim()) qa[k] = v.trim();
      if (Object.keys(qa).length) await api.saveQaProfile(u.id, qa);
      localStorage.setItem(USER_ID_KEY, u.id);
      setDoneId(u.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">One-time <span className="grad-text">setup</span></h1>
        <p className="mt-1 text-sm text-slate-400">Fill once. We apply all day from here.</p>
      </div>
      <ErrorBox message={error} />
      {doneId && (
        <p className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 size={16} /> Done — auto-apply is ON. New jobs get applied through the day.
        </p>
      )}

      <Card>
        <CardTitle sub="Where should we look for you?">You + job taste</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
          </Field>
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
          </Field>
          <Field label="Skills to match (comma separated)">
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Locations (comma separated)">
            <input value={locations} onChange={(e) => setLocations(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle sub="Stored encrypted. We log in as you and apply.">Logins (at least one)</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="LinkedIn email">
            <input value={liEmail} onChange={(e) => setLiEmail(e.target.value)} placeholder="linkedin email" className={inputCls} />
          </Field>
          <Field label="LinkedIn password">
            <input type="password" value={liPass} onChange={(e) => setLiPass(e.target.value)} placeholder="••••••" className={inputCls} />
          </Field>
          <Field label="Naukri email">
            <input value={naEmail} onChange={(e) => setNaEmail(e.target.value)} placeholder="naukri email" className={inputCls} />
          </Field>
          <Field label="Naukri password">
            <input type="password" value={naPass} onChange={(e) => setNaPass(e.target.value)} placeholder="••••••" className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle sub="Lets us pass LinkedIn's email-code check alone + alerts on your phone. Stored encrypted, per-user.">Gmail (recommended)</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gmail address">
            <input value={gmail} onChange={(e) => setGmail(e.target.value)} placeholder="you@gmail.com" className={inputCls} />
          </Field>
          <Field label="Google app password (not your login password)">
            <input type="password" value={gmailAppPass} onChange={(e) => setGmailAppPass(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" className={inputCls} />
          </Field>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-slate-400">
          <li>Open <b>myaccount.google.com</b> → Security → turn <b>2-Step Verification ON</b>.</li>
          <li>Same page → <b>App passwords</b> → name it <b>Hakein</b> → Create.</li>
          <li>Paste the 16-letter code above. Done — never needed again.</li>
        </ol>
      </Card>

      <Card>
        <CardTitle sub="Fill what you know — anything left is answered automatically">Quick answers</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                value={quick[f.key] || ''}
                onChange={(e) => setQuick({ ...quick, [f.key]: e.target.value })}
                placeholder="—"
                className={inputCls}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Btn onClick={save} disabled={saving} className="w-full py-3.5 text-base">
        {saving ? <Spinner label="Setting you up…" /> : (<><Rocket size={18} /> Save & start applying</>)}
      </Btn>
      <p className="text-center text-xs text-slate-500">
        If a question is ever left over, you get a free email alert — answer in the Inbox and the apply retries itself.
      </p>
    </div>
  );
}
