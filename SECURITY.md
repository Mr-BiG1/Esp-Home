# Security Architecture & Policies

## 1. Authentication & HMAC Signing
- Every ESP32 API payload is signed using `HMAC-SHA256`.
- Requests require `X-Device-ID`, `X-Timestamp`, `X-Nonce`, and `X-Signature`.
- Replay attacks are prevented via strict timestamp drift limits (±60 seconds) and nonce uniqueness tracking.

## 2. Secrets Management
- No API keys, passwords, or JWT secrets are hard-coded in source code or Git.
- Firmware stores Wi-Fi and device secrets in ESP32 Non-Volatile Storage (NVS).
- Environment variables (`.env`) manage web credentials.

## 3. RBAC & Audit Trails
- Administrative tasks (pairing, revoking, firmware OTA) require `ADMIN` authorization.
- Every state-modifying call is logged to `AuditLog` with timestamp, user/device ID, action, and IP address.
