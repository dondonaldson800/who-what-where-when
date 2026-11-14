import { Trash2 } from 'lucide-react';
import { money } from '@/lib/format';
import type { Lead } from '@/lib/leads';

export function LeadsList({ leads, onDelete }: { leads: Lead[]; onDelete: (id: string) => void }) {
  if (leads.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">No leads saved yet. Scan a card or fill in the form above.</p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {leads.map((l) => (
        <li key={l.id} className="rounded-2xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{l.name}</p>
              <p className="truncate text-sm text-muted-foreground">{l.email} · {l.phone}</p>
              {l.company && <p className="truncate text-sm text-muted-foreground">{l.company}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {l.type} · {l.priority}
                {l.event ? ` · ${l.event}` : ''}
                {l.dealValue != null ? ` · ${money(l.dealValue)}` : ''}
              </p>
              {l.notes && <p className="mt-1 text-sm">{l.notes}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDelete(l.id)}
              aria-label={`Delete ${l.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-input hover:border-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
