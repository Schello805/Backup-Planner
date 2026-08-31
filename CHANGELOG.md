# Changelog

All notable changes are documented here. This project follows Semantic Versioning.

## [Unreleased]

## [0.1.7] - 2026-08-31

- Replaced the flat location list with an expandable hierarchy tree.
- Added indentation and connector lines for countries, sites, buildings, and rooms.
- Preserved status, edit, and delete controls on every tree row.
- Added responsive tree spacing for smaller screens.

## [0.1.6] - 2026-08-31

- Added user-defined colors to backup targets with an automatic database migration.
- Added target color markers to Settings and the backup-plan overview.
- Added a dashboard distribution that counts and ranks active plans by destination.
- Added bilingual guidance explaining how target colors are used.

## [0.1.5] - 2026-08-31

- Added automatic dataset propagation through multi-stage backup and synchronization chains.
- Made storage targets with available copies selectable as sources for downstream plans.
- Added validation that prevents plans from using unavailable datasets or the same source and target.
- Added chain-origin labels, bilingual guidance, CSV support, schema migration, and automated chain tests.

## [0.1.4] - 2026-08-28

- Unified the focus styling of the compound duration control.
- Kept modal tooltips fully visible above the dialog edge and action bar.
- Completed visual quality assurance for the backup-plan form.

## [0.1.3] - 2026-08-28

- Added selectable minute and hour units for estimated backup duration.
- Added explanatory info tooltips to all backup-plan fields.
- Removed the preselected Monday from new weekly plans and require an explicit weekday choice.
- Standardized the height of adjacent form controls.

## [0.1.2] - 2026-08-28

- Added bilingual explanations for every master-data category.
- Added accessible field tooltips that work with mouse, keyboard, and touch layouts.
- Clarified dataset selection in backup plans with guidance, empty states, and required-field validation.
- Added visible progress, timestamps, and error feedback to manual update checks.
- Made CLI updates reuse installed packages when dependencies are unchanged and exit immediately when already current.

## [0.1.1] - 2026-08-27

- Initial Backup Planner implementation.
- Fixed source archive creation in the release workflow.
