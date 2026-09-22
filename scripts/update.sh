#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "Run this updater with sudo."; exit 1; fi
APP_DIR=/opt/backup-planner
set -a
source /etc/backup-planner/environment
set +a
cd "$APP_DIR"
OLD_REF=$(git rev-parse HEAD)
OLD_APP_VERSION=${APP_VERSION:-}
dependency_fingerprint() {
  node -e "const crypto=require('node:crypto');const p=require('./package.json');process.stdout.write(crypto.createHash('sha256').update(JSON.stringify([p.dependencies,p.devDependencies,p.engines])).digest('hex'))"
}
OLD_DEPS=$(dependency_fingerprint)
git fetch --tags --prune
LATEST=$(git tag --list 'v[0-9]*' --sort=-v:refname | head -n1)
IS_TAG=1
if [[ -z "$LATEST" ]]; then LATEST=origin/main; IS_TAG=0; fi
LATEST_REF=$(git rev-parse "$LATEST")
if [[ "$LATEST_REF" == "$OLD_REF" ]]; then
  echo "Backup Planner ${APP_VERSION:-${LATEST#v}} is already up to date."
  exit 0
fi
scripts/backup.sh
DEPENDENCIES_CHANGED=0
rollback(){ echo "Update failed; restoring the previous version."; git checkout --detach "$OLD_REF"; if [[ "$DEPENDENCIES_CHANGED" -eq 1 ]]; then npm ci; fi; npm run build; if [[ -n "$OLD_APP_VERSION" ]]; then sed -i "s/^APP_VERSION=.*/APP_VERSION=$OLD_APP_VERSION/" /etc/backup-planner/environment; fi; systemctl restart backup-planner; }
trap rollback ERR
git checkout --detach "$LATEST"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [[ "$IS_TAG" -eq 1 ]]; then
  VERSION=${LATEST#v}
  if [[ "$PACKAGE_VERSION" != "$VERSION" ]]; then
    echo "Release tag $LATEST does not match package.json version $PACKAGE_VERSION." >&2
    exit 1
  fi
else
  VERSION=$PACKAGE_VERSION
fi
NEW_DEPS=$(dependency_fingerprint)
if [[ "$OLD_DEPS" != "$NEW_DEPS" || ! -x node_modules/.bin/vite ]]; then
  DEPENDENCIES_CHANGED=1
  echo "Dependencies changed; installing packages…"
  npm ci --prefer-offline --no-audit --no-fund
else
  echo "Dependencies unchanged; reusing installed packages."
fi
npm run build
sed -i "s/^APP_VERSION=.*/APP_VERSION=$VERSION/" /etc/backup-planner/environment
systemctl restart backup-planner
trap - ERR
echo "Backup Planner $VERSION installed successfully."
