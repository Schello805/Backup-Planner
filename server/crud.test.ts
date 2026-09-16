import { describe, expect, it } from 'vitest';
import { db, listAll, id, now } from './db.js';

describe('CRUD operations audit', () => {
  let locationId: string;
  let sourceId: string;
  let targetId: string;
  let datasetId: string;
  let softwareId: string;
  let planId: string;

  it('Create (C): creates master data records', () => {
    locationId = id();
    db.prepare("INSERT INTO locations(id, name, type, notes, active, created_at, updated_at) VALUES(?, ?, 'site', '', 1, ?, ?)").run(locationId, 'Test Location', now(), now());

    sourceId = id();
    db.prepare("INSERT INTO sources(id, name, location_id, device_type, notes, active, created_at, updated_at) VALUES(?, ?, ?, 'server', '', 1, ?, ?)").run(sourceId, 'Test Source', locationId, now(), now());

    targetId = id();
    db.prepare("INSERT INTO targets(id, name, location_id, storage_type, provider, color, immutable_capable, encrypted_default, notes, active, created_at, updated_at) VALUES(?, ?, ?, 'nas', '', '#3478f6', 0, 0, '', 1, ?, ?)").run(targetId, 'Test Target', locationId, now(), now());

    datasetId = id();
    db.prepare("INSERT INTO datasets(id, name, source_id, priority, notes, active, created_at, updated_at) VALUES(?, ?, ?, 'normal', '', 1, ?, ?)").run(datasetId, 'Test Dataset', sourceId, now(), now());

    softwareId = id();
    db.prepare("INSERT INTO software(id, name, notes, active, created_at, updated_at) VALUES(?, ?, '', 1, ?, ?)").run(softwareId, 'Test Software', now(), now());

    planId = id();
    db.prepare(`INSERT INTO plans(id, name, source_id, target_id, software_id, protection_type, schedule_type, weekdays, start_time, duration_minutes, active, created_at, updated_at) VALUES(?, ?, ?, ?, ?, 'backup', 'daily', '[]', '03:00', 30, 1, ?, ?)`).run(planId, 'Test Plan', sourceId, targetId, softwareId, now(), now());
    db.prepare("INSERT INTO plan_datasets(plan_id, dataset_id) VALUES(?, ?)").run(planId, datasetId);

    const data = listAll();
    expect(data.locations.some((x: any) => x.id === locationId)).toBe(true);
    expect(data.sources.some((x: any) => x.id === sourceId)).toBe(true);
    expect(data.targets.some((x: any) => x.id === targetId)).toBe(true);
    expect(data.datasets.some((x: any) => x.id === datasetId)).toBe(true);
    expect(data.software.some((x: any) => x.id === softwareId)).toBe(true);
    expect(data.plans.some((x: any) => x.id === planId)).toBe(true);
  });

  it('Read (R): listAll reads created records with expected fields', () => {
    const data = listAll();
    const plan = data.plans.find((x: any) => x.id === planId);
    expect(plan).toBeDefined();
    expect(plan.dataset_ids).toContain(datasetId);
    expect(plan.name).toBe('Test Plan');
  });

  it('Update (U): updates master data and plan records', () => {
    const stamp = now();
    db.prepare("UPDATE locations SET name=?, updated_at=? WHERE id=?").run('Updated Location', stamp, locationId);
    db.prepare("UPDATE plans SET name=?, updated_at=? WHERE id=?").run('Updated Plan', stamp, planId);

    const data = listAll();
    expect((data.locations as any[]).find((x: any) => x.id === locationId)?.name).toBe('Updated Location');
    expect(data.plans.find((x: any) => x.id === planId)?.name).toBe('Updated Plan');
  });

  it('Delete (D) soft delete: marks record as deleted and removes from listAll()', () => {
    const stamp = now();
    db.prepare("UPDATE plans SET deleted_at=?, active=0 WHERE id=?").run(stamp, planId);

    const data = listAll();
    expect(data.plans.some((x: any) => x.id === planId)).toBe(false);

    const trash = listAll(true).plans.filter((x: any) => x.deleted_at);
    expect(trash.some((x: any) => x.id === planId)).toBe(true);
  });

  it('Restore: restores soft deleted plan', () => {
    const stamp = now();
    db.prepare("UPDATE plans SET deleted_at=NULL, active=1, updated_at=? WHERE id=?").run(stamp, planId);

    const data = listAll();
    expect(data.plans.some((x: any) => x.id === planId)).toBe(true);
  });

  it('Permanent Delete: removes record completely from database', () => {
    const stamp = now();
    // soft delete first
    db.prepare("UPDATE plans SET deleted_at=?, active=0 WHERE id=?").run(stamp, planId);
    // permanent delete
    db.prepare("DELETE FROM plans WHERE id=? AND deleted_at IS NOT NULL").run(planId);

    const dataAll = listAll(true);
    expect(dataAll.plans.some((x: any) => x.id === planId)).toBe(false);

    // Clean up master data test records
    db.prepare("DELETE FROM plan_datasets WHERE plan_id=?").run(planId);
    db.prepare("DELETE FROM datasets WHERE id=?").run(datasetId);
    db.prepare("DELETE FROM software WHERE id=?").run(softwareId);
    db.prepare("DELETE FROM targets WHERE id=?").run(targetId);
    db.prepare("DELETE FROM sources WHERE id=?").run(sourceId);
    db.prepare("DELETE FROM locations WHERE id=?").run(locationId);
  });
});
