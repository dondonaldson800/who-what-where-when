import { useEffect, useState } from 'react';
import { CreditCard, Mail, Copy, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';

const KEY = 'lead-capture-payment-link';
/** The live $9.99 one-time Stripe Payment Link for this app (Don's Empire Stripe account). */
export const DEFAULT_PAYMENT_LINK = 'https://buy.stripe.com/aFaaEPcEb7Fh2AtbCYcMM07';

export type SavedLead = { name: string; email: string; value: number };

export function PaymentShare({ lead, onClose }: { lead: SavedLead; onClose: () => void }) {
  const [link, setLink] = useState(DEFAULT_PAYMENT_LINK);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_PAYMENT_LINK);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        setLink(saved);
        setDraft(saved);
        setEditing(false);
      } else {
        // First run: default to the real $9.99 Stripe link and remember it.
        localStorage.setItem(KEY, DEFAULT_PAYMENT_LINK);
        setLink(DEFAULT_PAYMENT_LINK);
        setDraft(DEFAULT_PAYMENT_LINK);
        setEditing(false);
      }
    } catch {
      setEditing(false);
    }
  }, []);

  function saveLink() {
    const v = draft.trim();
    if (!/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com|.+\.stripe\.com)\//.test(v)) {
      toast.error('Paste a Stripe payment link (starts with https://buy.stripe.com/)');
      return;
    }
    try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ }
    setLink(v);
    setEditing(false);
  }

  const amount = lead.value ? ` for $${lead.value.toLocaleString('en-US')}` : '';
  const body = `Hi ${lead.name.split(' ')[0]},\n\nGreat meeting you. You can complete payment${amount} here:\n${link}\n\nThanks!`;
  const mailto = `mailto:${lead.email}?subject=${encodeURIComponent('Your payment link')}&body=${encodeURIComponent(body)}`;

  async function copy() {
    try { await navigator.clipboard.writeText(link); toast.success('Link copied'); }
    catch { toast.error('Could not copy the link'); }
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-foreground p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4" /> Request payment</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">Send {lead.name} your Stripe payment link{amount}.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>
      {editing ? (
        <div className="mt-4 flex flex-col gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} inputMode="url" placeholder="https://buy.stripe.com/…"
            className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none focus:border-foreground" />
          <button type="button" onClick={saveLink} className="h-12 rounded-full border border-foreground text-sm font-medium hover:bg-foreground hover:text-background">Save payment link</button>
          <p className="text-xs text-muted-foreground">Your $9.99 Stripe payment link is filled in by default. Paste a different Stripe link here to change it — it's remembered on this device.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <a href={mailto} className="flex h-12 items-center justify-center gap-2 rounded-full border border-foreground text-sm font-medium hover:bg-foreground hover:text-background"><Mail className="h-4 w-4" /> Email link</a>
          <button type="button" onClick={copy} aria-label="Copy payment link" className="flex h-12 w-12 items-center justify-center rounded-full border border-input hover:border-foreground"><Copy className="h-4 w-4" /></button>
          <button type="button" onClick={() => setEditing(true)} aria-label="Change payment link" className="flex h-12 w-12 items-center justify-center rounded-full border border-input hover:border-foreground"><Settings2 className="h-4 w-4" /></button>
        </div>
      )}
    </section>
  );
}
