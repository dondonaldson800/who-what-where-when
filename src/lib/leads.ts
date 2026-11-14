export type LeadType = 'Lead' | 'Prospect' | 'Partner';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: LeadType;
  priority: Priority;
  dealValue: number | null;
  event: string;
  notes: string;
  createdAt: string;
}

export interface NewLead {
  name: string;
  email: string;
  phone: string;
  company: string;
  type: LeadType;
  priority: Priority;
  dealValue: number | null;
  event: string;
  notes: string;
}

const KEY = 'wwww-leads-v1';

export function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(leads));
  } catch {
    /* storage unavailable */
  }
}

export function addLead(data: NewLead): Lead {
  const lead: Lead = {
    ...data,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const leads = loadLeads();
  leads.unshift(lead);
  saveLeads(leads);
  return lead;
}

export function deleteLead(id: string): void {
  saveLeads(loadLeads().filter((l) => l.id !== id));
}

export interface SummaryRow {
  label: string;
  total: number;
  count: number;
}

export interface Summary {
  total: number;
  count: number;
  event: { name: string; total: number; count: number } | null;
  byPriority: SummaryRow[];
  byType: SummaryRow[];
}

export function computeSummary(leads: Lead[], eventFilter: string): Summary {
  const ev = eventFilter.trim();
  const eventLeads = ev ? leads.filter((l) => l.event.toLowerCase().includes(ev.toLowerCase())) : [];
  const bump = (rows: SummaryRow[], label: string, v: number): SummaryRow[] =>
    rows.some((r) => r.label === label)
      ? rows.map((r) => (r.label === label ? { ...r, total: r.total + v, count: r.count + 1 } : r))
      : [...rows, { label, total: v, count: 1 }];
  let byPriority: SummaryRow[] = [];
  let byType: SummaryRow[] = [];
  for (const l of leads) {
    const v = l.dealValue ?? 0;
    byPriority = bump(byPriority, l.priority, v);
    byType = bump(byType, l.type, v);
  }
  return {
    total: leads.reduce((s, l) => s + (l.dealValue ?? 0), 0),
    count: leads.length,
    event: ev
      ? {
          name: ev,
          total: eventLeads.reduce((s, l) => s + (l.dealValue ?? 0), 0),
          count: eventLeads.length,
        }
      : null,
    byPriority,
    byType,
  };
}
