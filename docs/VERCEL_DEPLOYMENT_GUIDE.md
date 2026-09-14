# Deploying Smart Home Mesh Cloud to Vercel & Global Node Security

This guide explains how to deploy your **Next.js 14 Web Admin Cloud** to **Vercel** so you can access your dashboard from anywhere in the world over HTTPS and securely control your ESP32-S3 and Raspberry Pi nodes remotely.

---

## 1. Quick Vercel Deployment (2 Minutes)

### Option A: Via GitHub Integration (Recommended)
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import the repository **`Mr-BiG1/Esp-Home`**.
3. Under **Root Directory**, click **Edit** and set it to **`web`**.
4. Click **Deploy**.

Vercel will build your app and give you a free production HTTPS domain:
`https://esp-home.vercel.app` (or your chosen project name).

---

### Option B: Via Vercel CLI (Command Line)
In your terminal:
```bash
cd f:/ESP/web
npx vercel
```
Follow the prompts to deploy instantly.

---

## 2. Remote Node Configuration (Access Nodes From Anywhere)

Once deployed to Vercel, your cloud URL will be: `https://your-project.vercel.app`.

### A. Updating Raspberry Pi Node (`pi_touch_gui.py` & `pi_agent.py`)
In `agents/pi_node/pi_touch_gui.py`:
```python
CONFIG = {
    "device_id": "RPI-TOUCH-NODE-01",
    "device_secret": "rpi_secret_key_mesh_2026",
    "cloud_endpoint": "https://your-project.vercel.app/api/v1",  # Set your Vercel URL
    "poll_interval_sec": 5
}
```

### B. Updating ESP32-S3 Firmware (`config.h`)
In `firmware/include/config.h`:
```cpp
#define DEFAULT_API_ENDPOINT "https://your-project.vercel.app/api/v1"
```

---

## 3. Global Security Architecture (HMAC-SHA256)

Even though your cloud server is accessible over the public internet on Vercel, **your local nodes remain 100% secure**:

1. **HMAC Signature Verification:** Every telemetry POST and command poll requires an `X-Signature` header computed via `HMAC-SHA256(device_secret, timestamp + payload)`.
2. **Replay Attack Protection:** Timestamps outside a 300-second window are automatically rejected by the Vercel cloud API.
3. **No Inbound Ports Needed:** Your ESP32-S3 and Raspberry Pi initiate outbound HTTPS connections to Vercel, so **you do NOT need to open any router ports or configure port forwarding**.
