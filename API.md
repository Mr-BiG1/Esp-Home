# Versioned API Specification (`/api/v1/`)

## Device APIs

All device requests must include the following headers for HMAC-SHA256 authentication:
- `X-Device-ID`: Device Identifier (e.g. `HOME-CTRL-001`)
- `X-Timestamp`: UTC timestamp (UNIX epoch seconds)
- `X-Nonce`: Hex string (8-16 random bytes)
- `X-Signature`: `HMAC_SHA256(secret_key, device_id + timestamp + nonce + body)`

---

### `POST /api/v1/device/pair`
Pair an unregistered device with a temporary pairing token.

**Request:**
```json
{
  "pairing_token": "PAIR-9821-X3A",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "chip_id": "ESP32S3-74A1B2",
  "firmware_version": "1.0.0",
  "capabilities": ["relay", "sensor_temp", "tft_display"]
}
```

**Response (200 OK):**
```json
{
  "status": "APPROVED",
  "device_id": "HOME-CTRL-001",
  "device_secret": "sec_89f3a19e...",
  "config": {
    "reporting_interval": 30,
    "config_version": 1
  }
}
```

---

### `POST /api/v1/device/heartbeat`
Send regular health metrics and check pending commands.

**Request:**
```json
{
  "wifi_rssi": -65,
  "ip_address": "192.168.1.150",
  "uptime_seconds": 3600,
  "config_version": 1,
  "module_states": {
    "relay_1": true,
    "relay_2": false
  }
}
```

**Response (200 OK):**
```json
{
  "server_time": "2026-09-11T18:00:00Z",
  "pending_command_count": 1,
  "config_outdated": false,
  "latest_config_version": 1
}
```

---

### `GET /api/v1/device/commands`
Retrieve pending commands for the device.

**Response (200 OK):**
```json
{
  "commands": [
    {
      "command_id": "cmd_8192a01",
      "module": "relay",
      "action": "set",
      "parameters": { "channel": 1, "state": true },
      "expires_at": "2026-09-11T19:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/device/ack`
Acknowledge completed command execution.

**Request:**
```json
{
  "command_id": "cmd_8192a01",
  "status": "EXECUTED",
  "error_code": null,
  "execution_time_ms": 14
}
```

**Response (200 OK):**
```json
{ "status": "ACKNOWLEDGED" }
```

---

### `POST /api/v1/device/telemetry`
Upload batch sensor samples.

**Request:**
```json
{
  "telemetry_batch": [
    {
      "telemetry_type": "temperature",
      "payload": { "value": 22.4, "unit": "C" },
      "timestamp": "2026-09-11T18:05:00Z"
    }
  ]
}
```

---

## Admin APIs (`/api/v1/admin/`)

- `GET /api/v1/admin/devices` - List devices
- `POST /api/v1/admin/devices/pair-token` - Generate token
- `POST /api/v1/admin/devices/:id/command` - Dispatch command
- `POST /api/v1/admin/devices/:id/revoke` - Revoke device secret
- `GET /api/v1/admin/audit-logs` - Query system logs
- `GET /api/v1/admin/developer/modules` - Module management sandbox
