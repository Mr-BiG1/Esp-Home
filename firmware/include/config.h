#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// Default Network & Cloud Credentials (Can be overridden via NVS / Web setup)
#ifndef DEFAULT_WIFI_SSID
#define DEFAULT_WIFI_SSID "HomeWiFi"
#endif

#ifndef DEFAULT_WIFI_PASS
#define DEFAULT_WIFI_PASS "SecretPassword123"
#endif

#ifndef DEFAULT_API_ENDPOINT
#define DEFAULT_API_ENDPOINT "https://api.smarthome.example.com"
#endif

// Hardware Pin Definitions for ESP32-S3
#define PIN_TFT_MOSI 11
#define PIN_TFT_SCLK 12
#define PIN_TFT_MISO 13
#define PIN_TFT_CS   10
#define PIN_TFT_DC    9
#define PIN_TFT_RST  14
// LED wired directly to 3.3V — no software control needed

// Touch Controller (XPT2046) — shares SPI bus with TFT
#define PIN_TOUCH_CS  15
#define PIN_TOUCH_IRQ 16

// Hardware Relays (avoiding GPIO 19/20 native USB pins!)
#define PIN_RELAY_1  18
#define PIN_RELAY_2  17
#define PIN_RELAY_3  21
#define PIN_RELAY_4  38

// Status LED / User Button
#define PIN_STATUS_LED 2
#define PIN_BTN_MENU   0

#endif // CONFIG_H
