import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone, formatCurrencyInput, isEmail } from '@/lib/format';
import { addLead, type LeadType, type Priority } from '@/lib/leads';
import { CardScanner } from '@/components/CardScanner';
import type { ScanResult } from '@/lib/ocr';
import type { SavedLead } from '@/components/PaymentShare';

const TYPES = ['Lead', 'Prospect', 'Partner'] as const;
const PRIORITIES = ['High', 'Medium', 'Low'] as const;

const field = 'h-14 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

export function LeadForm({ event, onEventChange, onSaved }: {
  event: string;
  onEventChange: (v: string) => void;
  onSaved: (value: number, priority: Priority, type: LeadType, lead: SavedLead) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<LeadType>('Lead');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    name: !name.trim() ? 'Enter a name' : '',
    email: !isEmail(email) ? 'Enter a valid email' : '',
    phone: phone.replace(/\D/g, '').length < 10 ? 'Enter a 10-digit phone number' : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  function onScanned(r: ScanResult) {
    if (r.name) setName(r.name);
    if (r.email) setEmail(r.email.replace(/\s/g, ''));
    if (r.phone) setPhone(formatPhone(r.phone));
    if (r.company) setCompany(r.company);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid || saving) return;
    const dealValue = value ? Number(value.replace(/,/g, '')) : null;
    setSaving(true);
    try {
      addLead({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        company: company.trim(),
        type,
        priority,
        dealValue,
        event,
        notes: notes.trim(),
      });
      onSaved(dealValue ?? 0, priority, type, { name: name.trim(), email: email.trim().toLowerCase(), value: dealValue ?? 0 });
      toast.success(`${name.trim()} saved`);
      setName(''); setEmail(''); setPhone(''); setCompany(''); setNotes(''); setValue(''); setType('Lead'); setPriority('Medium'); setTouched(false);
    } catch (err) {
      console.error(err);
      toast.error('Could not save this lead. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const Err = ({ msg }: { msg: string }) => (touched && msg ? <p className="mt-1.5 text-sm text-destructive">{msg}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6 pb-8">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Event</span>
        <input className={field} placeholder="e.g. SaaS Connect 2026" value={event} onChange={(e) => onEventChange(e.target.value)} />
        <span className="mt-1.5 block text-xs text-muted-foreground">Stays filled in for every lead you add here.</span>
      </label>
      <CardScanner onScanned={onScanned} />
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Full name</span>
        <input className={field} placeholder="e.g. Jordan Lee" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Err msg={errors.name} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Email</span>
        <input className={field} type="email" inputMode="email" autoCapitalize="none" placeholder="jordan@company.com" value={email} onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))} />
        <Err msg={errors.email} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Phone</span>
        <input className={field} type="tel" inputMode="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
        <Err msg={errors.phone} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Company <span className="text-muted-foreground">(optional)</span></span>
        <input className={field} placeholder="e.g. Acme Corp" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
      <div>
        <span className="mb-2 block text-sm font-medium">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LeadType)}
          aria-label="Type"
          className={`${field} appearance-none bg-background`}
        >
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium">Priority</span>
        <div role="radiogroup" aria-label="Priority" className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={priority === p} onClick={() => setPriority(p)}
              className={`h-12 rounded-full border text-sm font-medium transition-colors ${priority === p ? 'border-foreground bg-foreground text-background' : 'border-input hover:border-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Estimated deal value <span className="text-muted-foreground">(optional)</span></span>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <input className={`${field} pl-8 tabular-nums`} inputMode="numeric" placeholder="10,000" value={value} onChange={(e) => setValue(formatCurrencyInput(e.target.value))} />
        </div>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Notes <span className="text-muted-foreground">(optional)</span></span>
        <textarea
          className="min-h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          placeholder="e.g. Met at the booth, wants a demo next week"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div>
        <button type="submit" disabled={saving}
          className="mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full border border-foreground bg-[hsl(var(--lime))] text-base font-semibold text-[hsl(var(--lime-foreground))] shadow-[0_4px_0_0_hsl(var(--foreground))] transition-transform active:translate-y-1 active:shadow-none disabled:opacity-70">
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {saving ? 'Saving…' : 'Save lead'}
        </button>
      </div>
    </form>
  );
}
