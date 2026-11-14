import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { money, WEIGHTS } from '@/lib/format';
import type { Summary } from '@/lib/leads';

function Bars({ title, rows, max }: { title: string; rows: Summary['byType']; max: number }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-[hsl(var(--inverse-foreground))]/60">{title}</p>
      {rows.filter((r) => r.label).map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{r.label} <span className="text-[hsl(var(--inverse-foreground))]/50">· {r.count}</span></span>
            <span className="tabular-nums">{money(r.total)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[hsl(var(--inverse-foreground))]/10">
            <div className="h-full rounded-full bg-[hsl(var(--inverse-foreground))]" style={{ width: `${max ? (r.total / max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RevenueHeader({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const forecast = (summary?.byPriority ?? []).reduce((s, r) => s + r.total * (WEIGHTS[r.label] ?? 0), 0);
  const max = Math.max(1, ...(summary?.byPriority ?? []).map((r) => r.total), ...(summary?.byType ?? []).map((r) => r.total));

  return (
    <section className="rounded-[64px_24px_24px_64px] bg-[hsl(var(--inverse))] px-7 py-6 text-[hsl(var(--inverse-foreground))]">
      <p className="text-xs uppercase tracking-wider text-[hsl(var(--inverse-foreground))]/60">Potential revenue</p>
      {loading && !summary ? (
        <div className="mt-2 h-12 w-48 animate-pulse rounded-md bg-[hsl(var(--inverse-foreground))]/10" />
      ) : (
        <p className="mt-1 text-5xl font-semibold tracking-[-0.05em] tabular-nums">{money(summary?.total ?? 0)}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[hsl(var(--inverse-foreground))]/75">
        <span>Forecast <b className="font-medium text-[hsl(var(--inverse-foreground))]">{money(forecast)}</b></span>
        <span>{summary?.count ?? 0} leads</span>
      </div>
      {summary?.event && (
        <div className="mt-4 rounded-2xl border border-[hsl(var(--inverse-foreground))]/15 px-4 py-3">
          <p className="truncate text-xs uppercase tracking-wider text-[hsl(var(--inverse-foreground))]/60">This event · {summary.event.name}</p>
          <p className="mt-1 text-lg font-medium tabular-nums">
            {money(summary.event.total)} <span className="text-sm text-[hsl(var(--inverse-foreground))]/60">from {summary.event.count} leads</span>
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-full border border-[hsl(var(--inverse-foreground))]/30 px-4 text-sm"
        aria-expanded={open}
      >
        Breakdown <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && summary && (
        <div className="mt-5 grid gap-5">
          <Bars title="By priority" rows={summary.byPriority} max={max} />
          <Bars title="By type" rows={summary.byType} max={max} />
        </div>
      )}
    </section>
  );
}
