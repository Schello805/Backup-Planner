import { describe, expect, it } from 'vitest';
import { calculateAvailability, isDatasetAvailable } from './availability.js';

describe('dataset availability chains', () => {
  it('propagates one dataset through multiple backup targets', () => {
    const data = {
      datasets: [{ id: 'photos', source_id: 'qnap2', active: 1 }],
      plans: [
        { id: 'sync', source_id: 'qnap2', source_target_id: null, target_id: 'qnap4', dataset_ids: ['photos'], active: 1 },
        { id: 'usb', source_id: 'qnap2', source_target_id: 'qnap4', target_id: 'external', dataset_ids: ['photos'], active: 1 },
      ],
    };
    const result = calculateAvailability(data);
    expect(isDatasetAvailable(result, 'photos', 'qnap2')).toBe(true);
    expect(isDatasetAvailable(result, 'photos', 'qnap2', 'qnap4')).toBe(true);
    expect(isDatasetAvailable(result, 'photos', 'qnap2', 'external')).toBe(true);
    expect(result.find(x => x.node_id === 'external')?.depth).toBe(2);
  });

  it('does not propagate a downstream plan whose source copy does not exist', () => {
    const result = calculateAvailability({
      datasets: [{ id: 'photos', source_id: 'qnap2', active: 1 }],
      plans: [{ id: 'broken', source_id: 'qnap2', source_target_id: 'qnap4', target_id: 'external', dataset_ids: ['photos'], active: 1 }],
    });
    expect(isDatasetAvailable(result, 'photos', 'qnap2', 'external')).toBe(false);
  });
});
