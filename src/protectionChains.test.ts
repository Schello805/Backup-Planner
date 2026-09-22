import { describe, expect, it } from 'vitest';
import { buildProtectionPaths } from './protectionChains';
import type { Plan } from './types';

const plan = (overrides: Partial<Plan>): Plan => ({
  id: 'plan', name: 'Plan', active: 1, source_id: 'qnap2', source_target_id: null, target_id: 'qnap4',
  dataset_ids: ['family'], protection_type: 'backup', schedule_type: 'daily', weekdays: [], day_of_month: 1,
  start_time: '03:00', duration_minutes: 30, immutable: false, encrypted: false, owner: '', color: '#16a36a', ...overrides,
});

describe('protection paths', () => {
  it('keeps parallel cloud copies instead of following only the first branch', () => {
    const paths = buildProtectionPaths('family', [
      plan({ id: 'nas', target_id: 'qnap4' }),
      plan({ id: 'cloud', source_target_id: 'qnap4', target_id: 'cloudserver' }),
      plan({ id: 'external', source_target_id: 'qnap4', target_id: 'external-disk' }),
    ]);
    expect(paths.map(path => path.map(node => node.targetId).filter(Boolean))).toEqual([
      ['qnap4', 'cloudserver'],
      ['qnap4', 'external-disk'],
    ]);
  });
});
