import type { AppData } from './types';

export function availableDatasetIdsAtTarget(data: Pick<AppData, 'dataset_availability' | 'plans'>, targetId?: string | null) {
  if (!targetId) return new Set<string>();

  const reported = (data.dataset_availability || [])
    .filter(item => item.node_type === 'target' && item.node_id === targetId)
    .map(item => item.dataset_id);
  const planned = data.plans
    .filter(plan => plan.active && !plan.deleted_at && plan.target_id === targetId)
    .flatMap(plan => plan.dataset_ids || []);

  return new Set([...reported, ...planned]);
}

export function targetsWithAvailableCopies(data: Pick<AppData, 'dataset_availability' | 'plans'>) {
  const targetIds = new Set(
    (data.dataset_availability || [])
      .filter(item => item.node_type === 'target')
      .map(item => item.node_id),
  );
  for (const plan of data.plans) {
    if (plan.active && !plan.deleted_at && (plan.dataset_ids || []).length) targetIds.add(plan.target_id);
  }
  return targetIds;
}
