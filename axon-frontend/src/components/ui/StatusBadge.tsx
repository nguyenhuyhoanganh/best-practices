import type { BPStatus } from '../types';

const config: Record<BPStatus, { label: string; cls: string }> = {
  DRAFT:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-600' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700' },
  UNDER_REVIEW:   { label: 'Under Review',   cls: 'bg-blue-100 text-blue-700' },
  PUBLISHED:      { label: 'Published',      cls: 'bg-green-100 text-green-700' },
  REJECTED:       { label: 'Rejected',       cls: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: BPStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}
