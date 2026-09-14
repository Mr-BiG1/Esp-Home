#!/usr/bin/env bash
# ==============================================================================
# Smart Home Mesh Controller — Ubuntu / Raspberry Pi OS Desktop Autostart Installer
# Creates desktop autostart entry so the Touch GUI launches automatically on login.
# ==============================================================================

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOSTART_DIR="$HOME/.config/autostart"

echo "======================================================================"
echo "    Installing Smart Home Touch GUI Desktop Autostart Launcher"
echo "======================================================================"

mkdir -p "$AUTOSTART_DIR"

cat <<EOF > "$AUTOSTART_DIR/smarthome-gui.desktop"
[Desktop Entry]
Type=Application
Name=Smart Home Mesh Touch GUI
Comment=Smart Home Controller Fullscreen Application
Exec=python3 $APP_DIR/pi_touch_gui.py
Path=$APP_DIR
Terminal=false
Icon=utilities-system-monitor
X-GNOME-Autostart-enabled=true
EOF

chmod +x "$AUTOSTART_DIR/smarthome-gui.desktop"

echo " Autostart file created at: $AUTOSTART_DIR/smarthome-gui.desktop"
echo " The Smart Home Touch GUI will now open automatically whenever Ubuntu/Pi OS Desktop starts!"
echo "======================================================================"
