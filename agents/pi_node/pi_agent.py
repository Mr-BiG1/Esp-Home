#!/usr/bin/env python3
"""
Smart Home Mesh Controller — Raspberry Pi Node Agent
Reports hardware telemetry (CPU, RAM, Disk, Temp) and polls cloud commands.
"""

import time
import json
import hashlib
import hmac
import requests
import psutil
import socket

CONFIG = {
    "device_id": "RPI-MESH-NODE-01",
    "device_secret": "rpi_secret_key_mesh_2026",
    "cloud_endpoint": "http://localhost:3000/api/v1/device",
    "poll_interval_sec": 10
}

def compute_hmac(secret: str, data: str) -> str:
    return hmac.new(secret.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()

def get_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return float(f.read().strip()) / 1000.0
    except Exception:
        return 42.0

def collect_telemetry():
    return {
        "device_id": CONFIG["device_id"],
        "timestamp": int(time.time()),
        "ip_address": socket.gethostbyname(socket.gethostname()),
        "cpu_usage": psutil.cpu_percent(interval=1),
        "mem_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "cpu_temp": get_cpu_temp(),
        "uptime_sec": int(time.time() - psutil.boot_time())
    }

def main():
    print(f"=== Raspberry Pi Node Agent Active [{CONFIG['device_id']}] ===")
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
            print(f"[{time.strftime('%H:%M:%S')}] Error sending telemetry: {e}")

        time.sleep(CONFIG["poll_interval_sec"])

if __name__ == "__main__":
    main()
