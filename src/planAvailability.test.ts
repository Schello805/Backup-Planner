import { describe, expect, it } from 'vitest';
import { availableDatasetIdsAtTarget, targetsWithAvailableCopies } from './planAvailability';
import type { AppData, Plan } from './types';

const plan = (overrides: Partial<Plan>): Plan => ({
  id: 'copy', name: 'Copy', active: 1, source_id: 'qnap2', source_target_id: null,
  target_id: 'qnap4', dataset_ids: ['photos'], protection_type: 'synchronization',
  schedule_type: 'daily', weekdays: [], start_time: '05:00', duration_minutes: 30,
  immutable: false, encrypted: false, owner: '', color: '#3478f6', ...overrides,
});

const data = (plans: Plan[], availability: AppData['dataset_availability'] = []) => ({ plans, dataset_availability: availability });

describe('plan editor copy availability', () => {
  it('recognizes datasets directly from an active plan when derived API hints are absent', () => {
    expect([...availableDatasetIdsAtTarget(data([plan({})]), 'qnap4')]).toEqual(['photos']);
    expect(targetsWithAvailableCopies(data([plan({})]))).toContain('qnap4');
  });

  it('combines derived and directly planned datasets without duplicates', () => {
    const result = availableDatasetIdsAtTarget(data(
      [plan({ dataset_ids: ['photos', 'music'] })],
      [{ dataset_id: 'photos', node_type: 'target', node_id: 'qnap4', depth: 1, via_plan_id: 'copy' }],
    ), 'qnap4');
    expect([...result]).toEqual(['photos', 'music']);
  });

  it('does not expose copies produced only by inactive or deleted plans', () => {
    const plans = [plan({ active: 0 }), plan({ id: 'deleted', deleted_at: '2026-09-01', dataset_ids: ['music'] })];
    expect(availableDatasetIdsAtTarget(data(plans), 'qnap4').size).toBe(0);
    expect(targetsWithAvailableCopies(data(plans)).has('qnap4')).toBe(false);
  });
});
