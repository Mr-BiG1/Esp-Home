# Smart Home Mesh Node Agents

This directory contains standalone Python telemetry agents for Raspberry Pi nodes and Desktop PC workstations.

## Agents

1. **Raspberry Pi Agent (`pi_node/pi_agent.py`)**
   - Telemetry: CPU %, RAM %, Disk %, Thermal zone temperature, Uptime, IP address.
   - Authentication: HMAC-SHA256 request signatures.

2. **Desktop PC Agent (`pc_monitor/pc_agent.py`)**
   - Telemetry: CPU %, RAM %, GPU Temp, Disk %, Uptime, Hostname.
   - Authentication: HMAC-SHA256 request signatures.

## Installation & Deployment

### Dependencies
```bash
pip install requests psutil
```

### Running as a Systemd Service (Raspberry Pi)
Create `/etc/systemd/system/smarthome-agent.service`:
```ini
[Unit]
Description=Smart Home Mesh Raspberry Pi Agent
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/smarthome/agents/pi_node/pi_agent.py
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl enable --now smarthome-agent
```
