import type { BPType } from '../types';

const config: Record<BPType, { icon: string; label: string; cls: string }> = {
  MCP:      { icon: '🔌', label: 'MCP',      cls: 'bg-green-50 text-green-700 border-green-100' },
  SKILL:    { icon: '🔧', label: 'Skill',    cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  RULE:     { icon: '📋', label: 'Rule',     cls: 'bg-orange-50 text-orange-700 border-orange-100' },
  WORKFLOW: { icon: '⚡', label: 'Workflow', cls: 'bg-violet-50 text-violet-700 border-violet-100' },
  HOOKS:    { icon: '🪝', label: 'Hooks',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  PROMPT:   { icon: '💬', label: 'Prompt',   cls: 'bg-teal-50 text-teal-700 border-teal-100' },
  TOOL:     { icon: '🛠️', label: 'Tool',     cls: 'bg-slate-50 text-slate-700 border-slate-100' },
  OTHER:    { icon: '✨', label: 'Other',    cls: 'bg-gray-50 text-gray-700 border-gray-100' },
};

export function TypeBadge({ type }: { type: BPType }) {
  const c = config[type] || config.OTHER;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${c.cls}`}>
      <span>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
}

export function TypeBadgeList({ types }: { types: BPType[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map(t => <TypeBadge key={t} type={t} />)}
    </div>
  );
}
