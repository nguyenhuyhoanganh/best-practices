import type { BPType } from '../types';

const config: Record<BPType, { icon: string; label: string; cls: string }> = {
  SKILL_SET:      { icon: '🔧', label: 'Skill Set',  cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  MCP_CONFIG:     { icon: '🔌', label: 'MCP Config', cls: 'bg-green-50 text-green-700 border-green-100' },
  RULE_SET:       { icon: '📋', label: 'Rule Set',   cls: 'bg-orange-50 text-orange-700 border-orange-100' },
  AGENT_WORKFLOW: { icon: '⚡', label: 'Workflow',   cls: 'bg-violet-50 text-violet-700 border-violet-100' },
};

export function TypeBadge({ type }: { type: BPType }) {
  const c = config[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${c.cls}`}>
      <span>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
}
