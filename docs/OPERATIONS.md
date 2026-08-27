# Operations

Use `systemctl status backup-planner` to check the service and `journalctl -u backup-planner` to inspect local logs. Configuration lives in `/etc/backup-planner/environment`.

The monthly backup timer is `backup-planner-backup.timer`. Run `sudo systemctl start backup-planner-backup.service` for an immediate scheduled-style backup. The web interface also provides manual backup controls.

To uninstall the service while retaining data, run `sudo /opt/backup-planner/scripts/uninstall.sh`. Remove `/var/lib/backup-planner` only after making and verifying a final download.
