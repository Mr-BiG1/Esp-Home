# Platform Expansion Roadmap

## Phase 1: Core Foundation (Current)
- ESP32-S3 firmware modular architecture (PlatformIO).
- TFT Display SPI driver abstraction & basic UI screens.
- Next.js Web Application on Vercel with Cloudflare DNS architecture.
- HMAC-SHA256 device authentication, command queueing, telemetry, audit logging.
- Protected Developer Mode foundation.

## Phase 2: Sensor & Actuator Expansion
- Relay controller module (Multi-channel IO).
- Temperature/Humidity (DHT22/BME280) module integration.
- Door/Window state sensors.
- Local rule automation engine foundation.

## Phase 3: Multi-Controller & Computer Monitoring Agents
- Support for multiple ESP32 edge units (`HOME-CTRL-001`, `GARAGE-CTRL-001`).
- Desktop computer monitoring agent (CPU, RAM, Disk, Uptime metrics).

## Phase 4: Advanced Automation & Realtime Transport
- Visual Rule Engine (IF-THEN triggers, schedules, cooldowns).
- Optional MQTT / WebSocket realtime push transport layer.

## Phase 5: Plugin Engine & OTA Firmware Management
- Secure OTA firmware distribution pipeline.
- Sandboxed developer plugin runtime.
