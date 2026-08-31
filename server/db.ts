import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = process.env.DATA_DIR || path.resolve('data');
export const backupDir = process.env.BACKUP_DIR || path.join(dataDir, 'backups');
fs.mkdirSync(backupDir, { recursive: true });
export const dbPath = path.join(dataDir, 'backup-planner.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'site', parent_id TEXT REFERENCES locations(id), notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, name TEXT NOT NULL, location_id TEXT REFERENCES locations(id), device_type TEXT NOT NULL DEFAULT 'other', notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS targets (id TEXT PRIMARY KEY, name TEXT NOT NULL, location_id TEXT REFERENCES locations(id), storage_type TEXT NOT NULL DEFAULT 'other', provider TEXT NOT NULL DEFAULT '', immutable_capable INTEGER NOT NULL DEFAULT 0, encrypted_default INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, name TEXT NOT NULL, source_id TEXT NOT NULL REFERENCES sources(id), priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')), notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS software (id TEXT PRIMARY KEY, name TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, source_id TEXT NOT NULL REFERENCES sources(id), target_id TEXT NOT NULL REFERENCES targets(id), software_id TEXT REFERENCES software(id), protection_type TEXT NOT NULL DEFAULT 'backup' CHECK(protection_type IN ('backup','synchronization','archive')), schedule_type TEXT NOT NULL DEFAULT 'weekly' CHECK(schedule_type IN ('daily','weekly','monthly','manual')), weekdays TEXT NOT NULL DEFAULT '[]', day_of_month INTEGER, start_time TEXT NOT NULL DEFAULT '03:00', duration_minutes INTEGER NOT NULL DEFAULT 30, retention_value INTEGER, retention_unit TEXT, version_count INTEGER, immutable INTEGER NOT NULL DEFAULT 0, encrypted INTEGER NOT NULL DEFAULT 0, owner TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#3478f6', notes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS plan_datasets (plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE, dataset_id TEXT NOT NULL REFERENCES datasets(id), PRIMARY KEY(plan_id,dataset_id));
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_sources_location ON sources(location_id);
CREATE INDEX IF NOT EXISTS idx_targets_location ON targets(location_id);
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source_id);
CREATE INDEX IF NOT EXISTS idx_plans_source_target ON plans(source_id,target_id);
CREATE INDEX IF NOT EXISTS idx_plans_deleted ON plans(deleted_at);
`);
const planColumns = db.prepare('PRAGMA table_info(plans)').all() as Array<{name:string}>;
if (!planColumns.some(column => column.name === 'source_target_id')) db.exec('ALTER TABLE plans ADD COLUMN source_target_id TEXT REFERENCES targets(id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_plans_source_target_node ON plans(source_target_id)');
db.pragma('optimize');

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export const bool = (v: unknown) => v === true || v === 1 || v === '1' ? 1 : 0;
export const cleanTrash = () => db.prepare("DELETE FROM plans WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now','-180 days')").run();

export const entities = {
  locations: { table:'locations', fields:['name','type','parent_id','notes','active'], bools:['active'] },
  sources: { table:'sources', fields:['name','location_id','device_type','notes','active'], bools:['active'] },
  targets: { table:'targets', fields:['name','location_id','storage_type','provider','immutable_capable','encrypted_default','notes','active'], bools:['immutable_capable','encrypted_default','active'] },
  datasets: { table:'datasets', fields:['name','source_id','priority','notes','active'], bools:['active'] },
  software: { table:'software', fields:['name','notes','active'], bools:['active'] },
} as const;

export function listAll(includeDeleted=false) {
  const where = includeDeleted ? '' : ' WHERE deleted_at IS NULL';
  return {
    locations: db.prepare(`SELECT * FROM locations${where} ORDER BY name`).all(),
    sources: db.prepare(`SELECT * FROM sources${where} ORDER BY name`).all(),
    targets: db.prepare(`SELECT * FROM targets${where} ORDER BY name`).all(),
    datasets: db.prepare(`SELECT * FROM datasets${where} ORDER BY name`).all(),
    software: db.prepare(`SELECT * FROM software${where} ORDER BY name`).all(),
    plans: db.prepare(`SELECT * FROM plans${where} ORDER BY name`).all().map((p:any)=>({...p,weekdays:JSON.parse(p.weekdays||'[]'),dataset_ids:(db.prepare('SELECT dataset_id FROM plan_datasets WHERE plan_id=?').all(p.id) as any[]).map(x=>x.dataset_id)})),
    settings: Object.fromEntries((db.prepare('SELECT key,value FROM settings').all() as any[]).map(x=>[x.key,x.value])),
  };
}
