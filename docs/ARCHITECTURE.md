# Architecture

Backup Planner uses a React and TypeScript client, a Fastify TypeScript API, and a local SQLite database. The production build is served by the same Node.js process and managed by systemd.

The core domain separates locations, sources, targets, datasets, software, and plans. Plans connect one source and target with one or more datasets. Locations form a hierarchy so the scoring engine can identify shared physical failure domains.

The score is calculated per dataset: real backup (30), three copies (20), two locations (15), off-primary-site copy (10), two media types (10), immutable copy (10), and retention/versioning (5). Overall results weight low, normal, and high priority datasets by 1, 2, and 4.

Server endpoints validate plan payloads, use prepared SQLite statements, and perform restore operations transactionally. SQLite runs in WAL mode with foreign keys enabled.
