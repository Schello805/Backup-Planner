#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "Run this updater with sudo."; exit 1; fi
APP_DIR=/opt/backup-planner
set -a
source /etc/backup-planner/environment
set +a
cd "$APP_DIR"
OLD_REF=$(git rev-parse HEAD)
scripts/backup.sh
git fetch --tags --prune
LATEST=$(git tag --sort=-v:refname | head -n1)
if [[ -z "$LATEST" ]]; then LATEST=origin/main; fi
rollback(){ echo "Update failed; restoring the previous version."; git checkout --detach "$OLD_REF"; npm ci; npm run build; systemctl restart backup-planner; }
trap rollback ERR
git checkout --detach "$LATEST"
npm ci
npm run build
VERSION=${LATEST#v}
sed -i "s/^APP_VERSION=.*/APP_VERSION=$VERSION/" /etc/backup-planner/environment
systemctl restart backup-planner
trap - ERR
echo "Backup Planner $VERSION installed successfully."
