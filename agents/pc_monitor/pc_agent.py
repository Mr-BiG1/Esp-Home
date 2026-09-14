#!/usr/bin/env python3
"""
Smart Home Mesh Controller — Desktop PC Monitoring Agent
Reports CPU, RAM, GPU, Disk, Uptime, and executes remote graceful actions.
"""

import time
import json
import hashlib
import hmac
import requests
import psutil
import socket

CONFIG = {
    "device_id": "DESKTOP-RIG-01",
    "device_secret": "pc_secret_key_mesh_2026",
    "cloud_endpoint": "http://localhost:3000/api/v1/device",
    "poll_interval_sec": 5
}

def compute_hmac(secret: str, data: str) -> str:
    return hmac.new(secret.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()

def collect_telemetry():
    return {
        "device_id": CONFIG["device_id"],
        "timestamp": int(time.time()),
        "hostname": socket.gethostname(),
        "ip_address": socket.gethostbyname(socket.gethostname()),
        "cpu_usage": psutil.cpu_percent(interval=0.5),
        "mem_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('C:\\' if psutil.WINDOWS else '/').percent,
        "gpu_temp": 48.5, # Placeholder or pynvml
        "uptime_sec": int(time.time() - psutil.boot_time())
    }

def main():
    print(f"=== PC Telemetry Agent Active [{CONFIG['device_id']}] ===")
    while True:
        try:
            telemetry = collect_telemetry()
            payload_str = json.dumps(telemetry)
            ts = str(int(time.time()))
            sig = compute_hmac(CONFIG["device_secret"], ts + payload_str)

            headers = {
                "Content-Type": "application/json",
                "X-Device-Id": CONFIG["device_id"],
                "X-Timestamp": ts,
                "X-Signature": sig
            }

            url = f"{CONFIG['cloud_endpoint']}/telemetry"
            resp = requests.post(url, data=payload_str, headers=headers, timeout=5)
            print(f"[{time.strftime('%H:%M:%S')}] Telemetry Sent -> HTTP {resp.status_code}")

        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] Telemetry poll error: {e}")

        time.sleep(CONFIG["poll_interval_sec"])

if __name__ == "__main__":
    main()
