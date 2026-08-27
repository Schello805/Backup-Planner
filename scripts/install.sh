#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "Run this installer with sudo."; exit 1; fi
APP_DIR=/opt/backup-planner
DATA_DIR=/var/lib/backup-planner
CONFIG_DIR=/etc/backup-planner
REPOSITORY=https://github.com/Schello805/Backup-Planner.git
PORT=${BACKUP_PLANNER_PORT:-3000}
apt-get update
apt-get install -y ca-certificates curl git build-essential
if ! command -v node >/dev/null || [[ $(node -p 'Number(process.versions.node.split(".")[0])') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
id backup-planner >/dev/null 2>&1 || useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin backup-planner
install -d -o backup-planner -g backup-planner "$DATA_DIR" "$DATA_DIR/backups" "$CONFIG_DIR"
if [[ -d "$APP_DIR/.git" ]]; then git -C "$APP_DIR" pull --ff-only; else git clone "$REPOSITORY" "$APP_DIR"; fi
cd "$APP_DIR"
npm ci
npm run build
chown -R root:root "$APP_DIR"
cat > "$CONFIG_DIR/environment" <<EOF
HOST=0.0.0.0
PORT=$PORT
DATA_DIR=$DATA_DIR
BACKUP_DIR=$DATA_DIR/backups
GITHUB_REPOSITORY=Schello805/Backup-Planner
APP_VERSION=$(node -p "require('./package.json').version")
EOF
install -m 0644 deploy/backup-planner.service /etc/systemd/system/backup-planner.service
install -m 0644 deploy/backup-planner-backup.service /etc/systemd/system/backup-planner-backup.service
install -m 0644 deploy/backup-planner-backup.timer /etc/systemd/system/backup-planner-backup.timer
chmod +x scripts/*.sh
systemctl daemon-reload
systemctl enable --now backup-planner.service backup-planner-backup.timer
echo "Backup Planner is ready at http://$(hostname -I | awk '{print $1}'):$PORT"
