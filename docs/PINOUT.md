# ESP32-S3 Hardware Pinout & Wiring Specifications

## Primary Controller Hardware
- **MCU**: ESP32-S3-N16R8 (16MB QIO Flash, 8MB OPI PSRAM)
- **Display**: 3.2" SPI ILI9341 TFT (320x240, Landscape Rotation 1)
- **Touch Controller**: XPT2046 (Shared SPI Bus)

---

## Pin Mapping Table

| Periph / Function | ESP32-S3 GPIO | Bus / Signal | Notes / Wire Colors |
| :--- | :--- | :--- | :--- |
| **Display SCK** | `GPIO 12` | HSPI SCLK | Confirmed Working |
| **Display MISO** | `GPIO 13` | HSPI MISO | Confirmed Working |
| **Display MOSI** | `GPIO 11` | HSPI MOSI | Confirmed Working |
| **Display CS** | `GPIO 10` | HSPI TFT_CS | Active LOW |
| **Display DC** | `GPIO 9` | TFT_DC | Data / Command |
| **Display RST** | `GPIO 14` | TFT_RST | Hardware Reset |
| **Display LED** | `3.3V Direct` | Backlight | Wired to 3.3V (Always ON) |
| **Touch CS** | `GPIO 15` | TOUCH_CS | Active LOW |
| **Touch IRQ** | `GPIO 16` | TOUCH_IRQ | Interrupt (Optional) |
| **Relay Channel 1**| `GPIO 18` | Main Power | Desktop PC Remote Power Switch |
| **Relay Channel 2**| `GPIO 19` | Aux Power | Desk Lighting / Peripherals |
| **Relay Channel 3**| `GPIO 20` | Climate Relay | Heater Control Relay |
| **Relay Channel 4**| `GPIO 21` | Spare Relay | Unassigned / Expansion |
| **Status LED** | `GPIO 2` | Onboard LED | System Heartbeat Indicator |
| **User Button** | `GPIO 0` | BOOT Button | Setup Mode Trigger |
