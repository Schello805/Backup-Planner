#!/usr/bin/env bash
set -euo pipefail
curl --fail --silent --show-error --request POST http://127.0.0.1:${BACKUP_PLANNER_PORT:-3000}/api/backups >/dev/null
echo "Backup Planner backup created."
