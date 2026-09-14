# Database Documentation

The platform uses Prisma ORM to map relational models to PostgreSQL (or SQLite local fallback).

## Core Schema Entities

- **User:** Operators with RBAC roles (`ADMIN`, `USER`, `VIEWER`).
- **Device:** Physical edge controllers (`HOME-CTRL-001`). Stores health, IP, uptime, config versions.
- **DeviceCredential:** Stores device secret hash and revocation status.
- **DeviceModule:** Extensible modules enabled per device (`relay`, `sensor.temperature`).
- **DeviceState:** Current dynamic state snapshot.
- **DeviceTelemetry:** Historical telemetry logs.
- **Command:** Queued commands with lifecycle status (`PENDING`, `EXECUTED`, `FAILED`).
- **CommandResult:** Execution timing and error codes reported by devices.
- **Configuration:** Versioned configuration snapshots.
- **Alert:** Device warnings and critical system alerts.
- **AuditLog:** User and device operational audit logs.
