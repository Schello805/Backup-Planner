#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "Run this uninstaller with sudo."; exit 1; fi
systemctl disable --now backup-planner.service backup-planner-backup.timer 2>/dev/null || true
rm -f /etc/systemd/system/backup-planner.service /etc/systemd/system/backup-planner-backup.service /etc/systemd/system/backup-planner-backup.timer
systemctl daemon-reload
echo "Application files can now be removed from /opt/backup-planner. Data remains in /var/lib/backup-planner."
