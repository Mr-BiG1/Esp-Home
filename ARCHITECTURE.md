# Smart Home Mesh Controller — Architectural Specification

## Platform Summary
The Smart Home Mesh Controller is a modular home control, monitoring, automation, and cloud management platform. It operates local-first (independent of cloud availability) while integrating cloud capabilities via Vercel Admin Cloud and Next.js REST APIs.

---

## Key Principles

1. **Local-First Reliability**: The ESP32-S3 TFT controller operates all screens, relays, touch controls, and thermostat loops locally without requiring WiFi or cloud servers.
2. **Data Provenance**: Every metric displayed in the web dashboard or firmware UI explicitly designates whether data is **MEASURED** (active physical sensor / software agent telemetry) or **INFERRED** (derived from network pings or status fallbacks).
3. **Cryptographic Security**: Per-device credentials stored in NVS encrypted storage. API communication is authenticated with HMAC-SHA256 signatures with timestamp anti-replay validation.
4. **No Remote Code Execution**: System commands are constrained to pre-defined safe firmware modules (relay toggles, setpoint adjustments, reset pulses).

---

## Subsystem Architecture

### 1. ESP32-S3 Firmware
- **Framework**: Arduino / PlatformIO
- **Memory**: 16MB QIO Flash, 8MB OPI PSRAM
- **Display**: 3.2" ILI9341 SPI TFT (320x240) + XPT2046 Touch (Shared HSPI Bus)
- **UI Engine**: `ScreenManager` + 4 Swipeable BaseScreen subclasses (HomeScreen, ServerScreen, ClimateScreen, TaskScreen)
- **Thermostat**: Safety-first `ClimateController` with hysteresis (±0.5°C), min ON/OFF timers, max runtime limit (2h), and sensor fault fallback.

### 2. Next.js Admin Cloud
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Vanilla CSS + TailwindCSS HSL Dark Palette
- **Database**: SQLite (Prisma ORM with 16 models)
- **REST Endpoints**: Device pairing, heartbeats, telemetry ingest, command dispatching, server gauges, climate setpoint controls, task checklists, and automation rule engine.

### 3. Node Agents
- **Raspberry Pi Agent**: Python telemetry daemon (`pi_agent.py`)
- **Desktop PC Agent**: Windows/Linux telemetry daemon (`pc_agent.py`)
