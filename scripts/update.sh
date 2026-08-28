#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "Run this updater with sudo."; exit 1; fi
APP_DIR=/opt/backup-planner
set -a
source /etc/backup-planner/environment
set +a
cd "$APP_DIR"
OLD_REF=$(git rev-parse HEAD)
dependency_fingerprint() {
  node -e "const crypto=require('node:crypto');const p=require('./package.json');process.stdout.write(crypto.createHash('sha256').update(JSON.stringify([p.dependencies,p.devDependencies,p.engines])).digest('hex'))"
}
OLD_DEPS=$(dependency_fingerprint)
git fetch --tags --prune
LATEST=$(git tag --sort=-v:refname | head -n1)
if [[ -z "$LATEST" ]]; then LATEST=origin/main; fi
LATEST_REF=$(git rev-parse "$LATEST")
if [[ "$LATEST_REF" == "$OLD_REF" ]]; then
  echo "Backup Planner ${APP_VERSION:-${LATEST#v}} is already up to date."
  exit 0
fi
scripts/backup.sh
DEPENDENCIES_CHANGED=0
rollback(){ echo "Update failed; restoring the previous version."; git checkout --detach "$OLD_REF"; if [[ "$DEPENDENCIES_CHANGED" -eq 1 ]]; then npm ci; fi; npm run build; systemctl restart backup-planner; }
trap rollback ERR
git checkout --detach "$LATEST"
NEW_DEPS=$(dependency_fingerprint)
if [[ "$OLD_DEPS" != "$NEW_DEPS" || ! -x node_modules/.bin/vite ]]; then
  DEPENDENCIES_CHANGED=1
  echo "Dependencies changed; installing packages…"
  npm ci --no-audit --no-fund
else
  echo "Dependencies unchanged; reusing installed packages."
fi
npm run build
VERSION=${LATEST#v}
sed -i "s/^APP_VERSION=.*/APP_VERSION=$VERSION/" /etc/backup-planner/environment
systemctl restart backup-planner
trap - ERR
echo "Backup Planner $VERSION installed successfully."
