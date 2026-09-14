#!/usr/bin/env bash
# ==============================================================================
# Smart Home Mesh Controller — Raspberry Pi OS Display & Touch Installer
# Configures DSI / HDMI / SPI Touchscreens and auto-launches Kiosk Touch UI.
# Compatible with Raspberry Pi OS (Bullseye, Bookworm, and Trixie / Pi 5)
# ==============================================================================

set -e

echo "======================================================================"
echo "    Smart Home Mesh Controller — Raspberry Pi OS Touch GUI Setup"
echo "======================================================================"

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run this script with sudo or as root:"
  echo "  sudo ./setup_display_touch.sh"
  exit 1
fi

echo "[1/4] Updating package lists and installing Python & X11 dependencies..."
apt-get update -y
apt-get install -y \
  python3 \
  python3-pip \
  python3-pygame \
  python3-psutil \
  python3-requests \
  python3-gpiozero \
  python3-lgpio \
  x11-xserver-utils \
  unclutter \
  git \
  curl

echo "[2/4] Configuring Raspberry Pi Display & Touch Overlay..."

# Detect config file location (Bookworm / Trixie uses /boot/firmware/config.txt, older uses /boot/config.txt)
CONFIG_FILE="/boot/config.txt"
if [ -f "/boot/firmware/config.txt" ]; then
  CONFIG_FILE="/boot/firmware/config.txt"
fi

echo "Updating $CONFIG_FILE for Display & Touch support..."

# Ensure KMS / FKMS graphics driver is active
if ! grep -q "dtoverlay=vc4-kms-v3d" "$CONFIG_FILE"; then
  echo "dtoverlay=vc4-kms-v3d" >> "$CONFIG_FILE"
fi

# Enable SPI & I2C hardware interfaces
if ! grep -q "dtparam=spi=on" "$CONFIG_FILE"; then
  echo "dtparam=spi=on" >> "$CONFIG_FILE"
fi
if ! grep -q "dtparam=i2c_arm=on" "$CONFIG_FILE"; then
  echo "dtparam=i2c_arm=on" >> "$CONFIG_FILE"
fi

echo "[3/4] Creating Auto-Start Kiosk Service for Raspberry Pi OS..."

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_PATH="/etc/systemd/system/smarthome-gui.service"

cat <<EOF > "$SERVICE_PATH"
[Unit]
Description=Smart Home Mesh Touch GUI
After=graphical.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
WorkingDirectory=$APP_DIR
ExecStartPre=/bin/sleep 3
ExecStart=/usr/bin/python3 $APP_DIR/pi_touch_gui.py
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

# If user is not 'pi', update service file for current user
REAL_USER="${SUDO_USER:-$USER}"
if [ "$REAL_USER" != "root" ] && [ "$REAL_USER" != "pi" ]; then
  sed -i "s/User=pi/User=$REAL_USER/g" "$SERVICE_PATH"
  sed -i "s|/home/pi|/home/$REAL_USER|g" "$SERVICE_PATH"
fi

systemctl daemon-reload
systemctl enable smarthome-gui.service

echo "[4/4] Screen Saver & Blanking Suppression Setup..."
AUTOSTART_DIR="/home/${REAL_USER}/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

cat <<EOF > "$AUTOSTART_DIR/disable-dpms.desktop"
[Desktop Entry]
Type=Application
Name=Disable Screen Blanking
Exec=xset s off -dpms s noblank
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

chown -R "$REAL_USER:$REAL_USER" "$AUTOSTART_DIR"

echo "======================================================================"
echo "    Raspberry Pi OS Display & Touch Setup Complete!"
echo "======================================================================"
echo "  - Touch GUI App Location: $APP_DIR/pi_touch_gui.py"
echo "  - Systemd Service Name:   smarthome-gui.service"
echo ""
echo "To test immediately without rebooting, run:"
echo "  python3 $APP_DIR/pi_touch_gui.py"
echo ""
echo "To start the auto-boot service now:"
echo "  sudo systemctl start smarthome-gui.service"
echo ""
echo "Rebooting recommended to apply touchscreen driver overlays:"
echo "  sudo reboot"
echo "======================================================================"
