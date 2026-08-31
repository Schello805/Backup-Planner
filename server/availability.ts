type Row = Record<string, any>;

export type DatasetAvailability = {
  dataset_id: string;
  node_type: 'source' | 'target';
  node_id: string;
  depth: number;
  via_plan_id: string | null;
};

export function calculateAvailability(data: { datasets: unknown[]; plans: unknown[] }): DatasetAvailability[] {
  const available = new Map<string, DatasetAvailability>();
  const key = (datasetId: string, nodeType: string, nodeId: string) => `${datasetId}:${nodeType}:${nodeId}`;

  const datasets = data.datasets as Row[];
  for (const dataset of datasets.filter(d => d.active && !d.deleted_at)) {
    const item: DatasetAvailability = { dataset_id: dataset.id, node_type: 'source', node_id: dataset.source_id, depth: 0, via_plan_id: null };
    available.set(key(dataset.id, item.node_type, item.node_id), item);
  }

  const plans = (data.plans as Row[]).filter(p => p.active && !p.deleted_at);
  let changed = true;
  while (changed) {
    changed = false;
    for (const plan of plans) {
      for (const datasetId of plan.dataset_ids || []) {
        const sourceType = plan.source_target_id ? 'target' : 'source';
        const sourceId = plan.source_target_id || plan.source_id;
        const source = available.get(key(datasetId, sourceType, sourceId));
        const targetKey = key(datasetId, 'target', plan.target_id);
        if (source && !available.has(targetKey)) {
          available.set(targetKey, { dataset_id: datasetId, node_type: 'target', node_id: plan.target_id, depth: source.depth + 1, via_plan_id: plan.id });
          changed = true;
        }
      }
    }
  }
  return [...available.values()];
}

export function isDatasetAvailable(items: DatasetAvailability[], datasetId: string, sourceId: string, sourceTargetId?: string | null) {
  return items.some(item => item.dataset_id === datasetId && item.node_type === (sourceTargetId ? 'target' : 'source') && item.node_id === (sourceTargetId || sourceId));
}
