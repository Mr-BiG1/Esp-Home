# Development Guide

## Environment Setup

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.x & PlatformIO Core (or PlatformIO for VS Code)
- Git

## Web Application Setup (`web/`)
```bash
cd web
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## Firmware Build & Flash (`firmware/`)
```bash
cd firmware
# Build firmware binary
pio run

# Flash to connected ESP32-S3 board
pio run -t upload

# Monitor serial debug output
pio device monitor
```
