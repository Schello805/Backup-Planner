import type { Plan } from './types';

export type ProtectionPath = { plan: Plan | null; targetId?: string; sourceId: string }[];

export function buildProtectionPaths(datasetId: string, plans: Plan[]): ProtectionPath[] {
  const related = plans.filter(plan => plan.active && !plan.deleted_at && plan.dataset_ids.includes(datasetId));
  if (!related.length) return [];

  const roots = related.filter(plan => !plan.source_target_id);
  const startPlans = roots.length ? roots : related;
  const paths: ProtectionPath[] = [];
  const visit = (plan: Plan, path: ProtectionPath, visited: Set<string>) => {
    if (visited.has(plan.id)) return;
    const nextPath = [...path, { plan, targetId: plan.target_id, sourceId: plan.source_id }];
    const next = related.filter(candidate => candidate.source_target_id === plan.target_id);
    if (!next.length) {
      paths.push(nextPath);
      return;
    }
    const nextVisited = new Set(visited).add(plan.id);
    next.forEach(candidate => visit(candidate, nextPath, nextVisited));
  };

  startPlans.forEach(plan => visit(plan, [{ plan: null, sourceId: plan.source_id }], new Set()));
  return paths;
}
