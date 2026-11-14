import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { computeSummary, deleteLead, loadLeads, type Lead, type Summary } from '@/lib/leads';
import { getGeminiKey, hasGeminiKey, setUserGeminiKey } from '@/lib/ocr';
import { RevenueHeader } from '@/components/RevenueHeader';
import { LeadForm } from '@/components/LeadForm';
import { LeadsList } from '@/components/LeadsList';
import { PaymentShare, type SavedLead } from '@/components/PaymentShare';

const EVENT_KEY = 'lead-capture-event';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [event, setEvent] = useState('');
  const debouncedEvent = useDebounce(event, 400);
  const [lastLead, setLastLead] = useState<SavedLead | null>(null);
  const [geminiKey, setGeminiKey] = useState('');

  const reload = useCallback((ev: string) => {
    const all = loadLeads();
    setLeads(all);
    setSummary(computeSummary(all, ev));
  }, []);

  useEffect(() => {
    try { setEvent(localStorage.getItem(EVENT_KEY) ?? ''); } catch { /* storage unavailable */ }
    setGeminiKey(getGeminiKey());
    reload('');
  }, [reload]);

  useEffect(() => { reload(debouncedEvent); }, [reload, debouncedEvent]);

  const changeEvent = (v: string) => {
    setEvent(v);
    try { localStorage.setItem(EVENT_KEY, v); } catch { /* storage unavailable */ }
  };

  const onSaved = () => {
    reload(event);
  };

  const onDelete = (id: string) => {
    deleteLead(id);
    reload(event);
  };

  const saveGeminiKey = (v: string) => {
    setGeminiKey(v);
    setUserGeminiKey(v);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-md px-5 pt-6">
        <header className="mb-5">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">New lead</h1>
          <p className="mt-1 text-sm text-muted-foreground">Capture a contact in under a minute.</p>
        </header>
        <RevenueHeader summary={summary} loading={false} />
        {lastLead && <PaymentShare key={lastLead.email + lastLead.name} lead={lastLead} onClose={() => setLastLead(null)} />}
        <div className="mt-8">
          <LeadForm
            event={event}
            onEventChange={changeEvent}
            onSaved={(value, priority, type, lead) => { setLastLead(lead); onSaved(); }}
          />
        </div>

        <section className="mt-2 pb-6">
          <h2 className="text-lg font-semibold">Saved leads</h2>
          <LeadsList leads={leads} onDelete={onDelete} />
        </section>

        <section className="mt-2 pb-10">
          <h2 className="text-lg font-semibold">Settings</h2>
          <label className="mt-3 block">
            <span className="mb-2 block text-sm font-medium">Gemini API key <span className="text-muted-foreground">(optional — improves card reading)</span></span>
            <input
              type="password"
              className="h-14 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              placeholder="Paste your Gemini API key"
              autoComplete="off"
              value={geminiKey}
              onChange={(e) => saveGeminiKey(e.target.value)}
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              {hasGeminiKey()
                ? 'Gemini card reading is on. The key stays on this device.'
                : 'No key set — card reading uses on-device OCR instead. The key stays on this device.'}
            </span>
          </label>
          <p className="mt-4 text-xs text-muted-foreground">
            Index — $19.99. Leads are stored on this device only.
          </p>
        </section>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
