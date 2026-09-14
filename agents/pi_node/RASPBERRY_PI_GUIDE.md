# Smart Home Mesh Controller — Raspberry Pi OS Touch GUI & Hardware Guide

This folder contains the complete touchscreen GUI application and hardware controller designed specifically for **Raspberry Pi OS (Debian / Raspbian Bullseye & Bookworm)**.

---

## 1. Features
- **Native Touchscreen Interface:** Custom Pygame dark-mode glassmorphism interface optimized for Raspberry Pi displays (800x480, 480x320, 1024x600).
- **Interactive GPIO Relay Control:** Control 4 physical relay channels (GPIO 17, 27, 22, 23) via touchscreen buttons or swipe navigation.
- **Live System Telemetry:** Real-time monitoring of CPU temperature, CPU load, RAM usage, and network status.
- **HMAC Authenticated Cloud Mesh Sync:** Background thread automatically syncs telemetry and receives commands from the Next.js web cloud app.
- **Auto-Boot Kiosk Mode:** Systemd service script to automatically launch the touch GUI on system boot without screen sleeping.

---

## 2. Hardware Wiring Diagram

### Relay Module Wiring (4-Channel 5V Relay)
| Relay Module Pin | Raspberry Pi Pin | Header Pin # | Description |
|------------------|------------------|--------------|-------------|
| **VCC**          | 5V Power         | Pin 2 / 4    | 5V DC Power |
| **GND**          | Ground           | Pin 6 / 14   | Common Ground |
| **IN1**          | GPIO 17          | Pin 11       | Relay Channel 1 |
| **IN2**          | GPIO 27          | Pin 13       | Relay Channel 2 |
| **IN3**          | GPIO 22          | Pin 15       | Relay Channel 3 |
| **IN4**          | GPIO 23          | Pin 16       | Relay Channel 4 |

### Supported Displays
1. **Official Raspberry Pi 7" Touchscreen (DSI):** Plug Ribbon Cable into DSI port. Works natively out of the box with zero drivers.
2. **HDMI Touchscreens (WaveShare, Elecrow, SunFounder, 5"/7"):** Connect HDMI cable for video + USB cable for Touch inputs.
3. **SPI / DSI 3.5" Touchscreens (ILI9486 / XPT2046):** Enable SPI overlay in `/boot/config.txt`.

---

## 3. Quick Installation on Raspberry Pi OS

Open a terminal on your Raspberry Pi (or via SSH) and run:

```bash
cd /home/pi
git clone <repo-url> smart-home
cd smart-home/agents/pi_node

# Make script executable and run setup
chmod +x setup_display_touch.sh
sudo ./setup_display_touch.sh
```

---

## 4. Manual Execution & Testing

To test the Touch GUI interactively from the command line:

```bash
python3 pi_touch_gui.py
```

### Controls & Navigation
- **Touch Screen:** Tap on relay cards to toggle hardware relays.
- **Touch Swipe:** Swipe left or right anywhere on the screen to switch tabs.
- **Keyboard Shortcuts:**
  - `ESC` or `Q`: Quit app
  - `Right Arrow`: Next tab (Home -> Relays -> System)
  - `Left Arrow`: Previous tab

---

## 5. Systemd Auto-Start Service Management

```bash
# Check service status
sudo systemctl status smarthome-gui.service

# Restart the touch interface
sudo systemctl restart smarthome-gui.service

# View live application logs
journalctl -u smarthome-gui.service -f
```
