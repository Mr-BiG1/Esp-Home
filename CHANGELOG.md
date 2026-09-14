# Changelog

All notable changes to the ESP32-S3 Smart Home Controller Platform will be documented in this file.

## [1.0.0-phase1] - 2026-09-11
### Added
- Initial monorepo layout separating `firmware/` and `web/`.
- Architecture, API, Security, Database, and Protocol specifications.
- Relational schema definitions (`schema.prisma`) for Devices, Credentials, Commands, Telemetry, Audit Logs, and Developer Modules.
- HMAC-SHA256 device authentication protocol implementation.
- PlatformIO C++ firmware scaffold with modular display, network, security, and command dispatcher subsystems.
- Next.js Web Application dashboard with device management, pairing token generator, command queue control, audit logging, and Developer Mode.
