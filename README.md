# Smart Home Mesh Controller

> Complete modular home control, monitoring, climate automation, and cloud management platform built for ESP32-S3-N16R8, Raspberry Pi, Desktop PCs, and Next.js Admin Cloud.

---

## Hardware Features
- **ESP32-S3-N16R8**: 16MB QIO Flash, 8MB OPI PSRAM
- **Display**: 3.2" SPI ILI9341 TFT (320x240 landscape)
- **Touch**: XPT2046 Touch Controller (Shared HSPI Bus with Display)
- **Relays**: 4-channel hardware relay module (GPIO 18, 19, 20, 21)
- **Sensors**: Ambient Temperature & Humidity

---

## UI Screens (ESP32 Firmware)
1. **Home Screen**: System health summary, climate status, WiFi/Cloud state, Relay 1 & 2 quick toggles.
2. **Server & PC Screen**: Desktop PC resource gauges (CPU, RAM, GPU temp), data provenance tags (MEASURED vs INFERRED), power relay triggers, reboot pulse.
3. **Climate & Thermostat Screen**: Ambient temp vs target setpoint, + / - setpoint adjusters, thermostat mode toggles (AUTO, BOOST, MANUAL, OFF), safety trip diagnostic banner.
4. **Task Screen**: Interactive task checklist, priority flags (HIGH/MED/LOW), tap-to-complete toggles.

---

## Web Dashboard Pages (Next.js 14)
- **Dashboard (`/`)**: System overview, online nodes, command queue.
- **Devices (`/devices`)**: Registered ESP32, Pi, and PC mesh devices.
- **Servers & PCs (`/servers`)**: Real-time workstation gauges & relay power control.
- **Climate (`/climate`)**: Thermostat zone targets & safety trip logs.
- **Tasks (`/tasks`)**: Synchronized checklist mirrored to ESP32 screen.
- **Calendar (`/calendar`)**: Maintenance schedule and update windows.
- **Automations (`/automations`)**: Event rule engine (IF trigger THEN action).
- **Alerts (`/alerts`)**: Diagnostic alert stream & acknowledgement.
- **Display Designer (`/designer`)**: 320x240 visual display canvas editor.
- **Settings (`/settings`)**: Device pairing tokens & HMAC security keys.

---

## Quick Start Guide

### 1. Build ESP32 Firmware
```bash
cd firmware
pio run
```

### 2. Run Web Dashboard
```bash
cd web
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### 3. Run Node Agents
```bash
python agents/pc_monitor/pc_agent.py
python agents/pi_node/pi_agent.py
```
