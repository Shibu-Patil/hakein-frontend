import { useCallback, useEffect, useState } from 'react';
import { BellRing, Send, CheckCircle2 } from 'lucide-react';
import { api, getUserId, getProvider, getAiKey, type InboxItem } from '../lib/api';
import { Card, CardTitle, Btn, inputCls, Spinner, ErrorBox, Empty } from '../components/ui';

export default function Inbox() {
  const [userId] = useState(getUserId());
  const [items, setItems] = useState<InboxItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await api.inbox(userId);
      setItems(r.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [userId, load]);

  async function answer(item: InboxItem) {
    const text = (drafts[item.id] || '').trim();
    if (!text || !userId) return;
    setSending(item.id);
    setError('');
    try {
      const r = await api.answerInbox(userId, item.id, {
        answer: text,
        provider: getProvider(),
        apiKey: getAiKey() || undefined,
      });
      setDone({ ...done, [item.id]: r.retried ? 'Answered — apply retried automatically.' : `Answered — ${r.remainingForApp} more for this job.` });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Answer failed');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-fuchsia-500 shadow-xl shadow-fuchsia-500/25">
          <BellRing className="text-white" size={26} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Action <span className="grad-text">inbox</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Questions the autopilot couldn't answer. Reply here (or from the Gmail app) — the apply retries itself.
        </p>
      </div>

      <ErrorBox message={error} />
      {!userId ? (
        <Empty title="No user connected" sub="Set your User ID in Settings." />
      ) : loading ? (
        <div className="text-center"><Spinner label="Checking inbox…" /></div>
      ) : items.length === 0 ? (
        <Empty title="All clear" sub="New questions pop up here + on your phone via email/push." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-amber-400/20">
              <p className="text-xs text-slate-500">
                {item.job ? `${item.job.title} @ ${item.job.company} · ${item.source}` : item.source} ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="mt-1.5 font-medium text-white">{item.question}</p>
              {done[item.id] ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-300">
                  <CheckCircle2 size={16} /> {done[item.id]}
                </p>
              ) : (
                <div className="mt-3">
                  {item.options?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.options.map((o) => (
                        <Btn
                          key={o}
                          variant={drafts[item.id] === o ? 'primary' : 'soft'}
                          onClick={() => setDrafts({ ...drafts, [item.id]: o })}
                        >
                          {o}
                        </Btn>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={drafts[item.id] || ''}
                      onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })}
                      placeholder="Type your answer…"
                      className={inputCls}
                    />
                  )}
                  <div className="mt-2.5">
                    <Btn onClick={() => answer(item)} disabled={sending === item.id || !(drafts[item.id] || '').trim()}>
                      {sending === item.id ? <Spinner label="Sending…" /> : (<><Send size={15} /> Answer & retry apply</>)}
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardTitle sub="Get these on your phone even with this app closed">Phone alerts (free)</CardTitle>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          <li>Email: backend sends from Gmail to your notify email → Gmail app pops a notification.</li>
          <li>Push: install <b>ntfy</b> app, subscribe to your topic → instant popup.</li>
          <li>Set both in Settings → Notifications, plus <b>full-auto</b> mode to skip questions entirely.</li>
        </ol>
      </Card>
    </div>
  );
}
