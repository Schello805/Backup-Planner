import type { ChangeEvent } from 'react';
import type { AppData, Entity, Plan } from './types';

type Copy = { value: string; label: string };

type PlanSourceSelectorProps = {
  value: Plan;
  data: AppData;
  label: string;
  availableCopyLabel: string;
  sourceLabel: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export function PlanSourceSelector({ value, data, label, availableCopyLabel, sourceLabel, onChange }: PlanSourceSelectorProps) {
  const activePlans = data.plans.filter(plan => plan.active && !plan.deleted_at);
  const targetIds = new Set<string>([
    ...data.dataset_availability.filter(item => item.node_type === 'target').map(item => item.node_id),
    ...activePlans.map(plan => plan.target_id),
  ]);
  const options: Copy[] = [
    ...data.targets
      .filter((target: Entity) => target.active && targetIds.has(target.id))
      .map(target => ({ value: `target:${target.id}`, label: `${target.name} · ${availableCopyLabel}` })),
    ...data.sources
      .filter((source: Entity) => source.active)
      .map(source => ({ value: `source:${source.id}`, label: `${source.name} · ${sourceLabel}` })),
  ];
  const selected = value.source_target_id ? `target:${value.source_target_id}` : value.source_id ? `source:${value.source_id}` : '';

  return (
    <select aria-label={label} value={selected} onChange={onChange}>
      <option value="">Select…</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
