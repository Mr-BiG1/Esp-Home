# Device Identity, Lifecycle & Command Protocol

## Device Lifecycle States

```text
UNREGISTERED ────► PAIRING ────► REGISTERED ────► ACTIVE ────► REVOKED
```

1. **UNREGISTERED:** Device flashed with base firmware, missing `device_secret`.
2. **PAIRING:** User initiates pairing in Web UI; device transmits pairing token & MAC ID.
3. **REGISTERED:** Backend accepts registration, issues unique `device_id` and secret. Secret saved to NVS.
4. **ACTIVE:** Device regularly polls backend, submits heartbeats, executes commands.
5. **REVOKED:** Admin revokes device credentials. Backend rejects signature authentication.

## Idempotency Engine
To prevent duplicate execution during network retries:
- Firmware maintains an LRU execution buffer of the last 64 `command_id`s.
- If a received `command_id` exists in the execution buffer, firmware re-transmits the previous ACK result without re-executing hardware side-effects.
