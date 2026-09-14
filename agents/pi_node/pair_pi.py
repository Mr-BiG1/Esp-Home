#!/usr/bin/env python3
"""
Smart Home Mesh Controller — Raspberry Pi Pairing Utility
Pairs your Raspberry Pi with the Vercel Cloud Web Admin using your 6-digit pairing code.
Usage: python3 pair_pi.py <PAIRING-CODE> [CLOUD-URL]
Example: python3 pair_pi.py PAIR-849-201 https://esp-home-inky.vercel.app
"""

import sys
import os
import json
import uuid
import requests

def get_mac_address():
    mac = uuid.getnode()
    return ':'.join(('%012X' % mac)[i:i+2] for i in range(0, 12, 2))

def pair_device(pairing_code, cloud_url):
    cloud_url = cloud_url.rstrip('/')
    pair_endpoint = f"{cloud_url}/api/v1/device/pair"
    mac = get_mac_address()
    chip_id = f"RPI-SOC-{mac.replace(':', '')[-6:]}"

    print(f"======================================================================")
    print(f"  Smart Home Raspberry Pi Pairing Utility")
    print(f"======================================================================")
    print(f"  Pairing Code:  {pairing_code}")
    print(f"  Cloud Endpoint: {pair_endpoint}")
    print(f"  Pi MAC Address: {mac}")
    print(f"  Pi Chip ID:     {chip_id}")
    print(f"======================================================================")

    payload = {
        "pairing_token": pairing_code,
        "mac_address": mac,
        "chip_id": chip_id,
        "firmware_version": "2.1.0-RPI",
        "capabilities": ["relay_1", "relay_2", "relay_3", "relay_4", "temp_sensor", "touch_ui"]
    }

    try:
        resp = requests.post(pair_endpoint, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            dev_id = data.get("device_id")
            dev_secret = data.get("device_secret")
            print("\n [SUCCESS] Device successfully paired with Vercel Cloud!")
            print(f"   - Assigned Device ID: {dev_id}")
            print(f"   - Device Secret Key: {dev_secret[:8]}...")

            # Update pi_touch_gui.py config automatically
            app_path = os.path.join(os.path.dirname(__file__), "pi_touch_gui.py")
            if os.path.exists(app_path):
                with open(app_path, "r") as f:
                    content = f.read()

                # Replace cloud_endpoint, device_id, device_secret
                import re
                content = re.sub(r'"device_id":\s*".*?"', f'"device_id": "{dev_id}"', content)
                content = re.sub(r'"device_secret":\s*".*?"', f'"device_secret": "{dev_secret}"', content)
                content = re.sub(r'"cloud_endpoint":\s*".*?"', f'"cloud_endpoint": "{cloud_url}/api/v1"', content)

                with open(app_path, "w") as f:
                    f.write(content)

                print(" Updated pi_touch_gui.py configuration.")

            print("\n You can now launch your Touch UI:")
            print("   DISPLAY=:0 python3 pi_touch_gui.py\n")

        else:
            print(f"\n [ERROR] Pairing failed with HTTP {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"\n [ERROR] Failed to connect to cloud endpoint: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 pair_pi.py <PAIRING-CODE> [CLOUD-URL]")
        print("Example: python3 pair_pi.py PAIR-849-201 https://esp-home-inky.vercel.app")
        sys.exit(1)

    code = sys.argv[1]
    url = sys.argv[2] if len(sys.argv) > 2 else "https://esp-home-inky.vercel.app"
    pair_device(code, url)
