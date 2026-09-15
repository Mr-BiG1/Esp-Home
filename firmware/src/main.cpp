#include <Arduino.h>
#include "config.h"
#include "display/display_driver.h"
#include "display/touch_driver.h"
#include "config/config_manager.h"
#include "security/security_manager.h"
#include "network/wifi_manager.h"
#include "cloud/cloud_client.h"

uint32_t lastDisplayUpdateMs = 0;
bool relay1State = false;
bool relay2State = false;

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== SMART HOME ESP32-S3 CONTROLLER FIRMWARE ===");

  // Onboard WS2812 RGB LED boot strobe (Red -> Green -> Blue)
  neopixelWrite(48, 255, 0, 0); delay(150);
  neopixelWrite(48, 0, 255, 0); delay(150);
  neopixelWrite(48, 0, 0, 255); delay(150);
  neopixelWrite(48, 0, 0, 0);

  // Setup Relay GPIO output pins
  pinMode(PIN_RELAY_1, OUTPUT); digitalWrite(PIN_RELAY_1, LOW);
  pinMode(PIN_RELAY_2, OUTPUT); digitalWrite(PIN_RELAY_2, LOW);
  pinMode(PIN_RELAY_3, OUTPUT); digitalWrite(PIN_RELAY_3, LOW);
  pinMode(PIN_RELAY_4, OUTPUT); digitalWrite(PIN_RELAY_4, LOW);

  // Initialize NVS Preferences & Security
  ConfigManager::init();
  SecurityManager::init();

  // Initialize Display Driver (SPI ILI9341)
  DisplayDriver::init();

  // Initialize Touch Controller
  TouchDriver::init(DisplayDriver::hspi);

  // Render initial HomeScreen UI
  DisplayDriver::drawHomeScreen(23.5f, relay1State, relay2State, SecurityManager::getDeviceId().c_str());

  // Initialize Wi-Fi and Cloud Connection
  WifiManager::init();
  CloudClient::init();

  Serial.println("ESP32-S3 Setup Complete! System Running.");
}

void loop() {
  // Wi-Fi reconnect & state loop
  WifiManager::loop();

  // Cloud HTTPS heartbeat & command polling loop
  CloudClient::loop();

  // Touch UI interaction loop
  TouchPoint tp;
  if (TouchDriver::update(tp) && tp.gesture == TouchGesture::TAP) {
    Serial.printf("Touch Tap at X:%d, Y:%d\n", tp.x, tp.y);
    // Tap on Relay 1 card (X: 165..310, Y: 38..80)
    if (tp.x >= 165 && tp.x <= 310 && tp.y >= 38 && tp.y <= 80) {
      relay1State = !relay1State;
      digitalWrite(PIN_RELAY_1, relay1State ? HIGH : LOW);
      DisplayDriver::drawHomeScreen(23.5f, relay1State, relay2State, SecurityManager::getDeviceId().c_str());
    }
    // Tap on Relay 2 card (X: 165..310, Y: 86..128)
    else if (tp.x >= 165 && tp.x <= 310 && tp.y >= 86 && tp.y <= 128) {
      relay2State = !relay2State;
      digitalWrite(PIN_RELAY_2, relay2State ? HIGH : LOW);
      DisplayDriver::drawHomeScreen(23.5f, relay1State, relay2State, SecurityManager::getDeviceId().c_str());
    }
  }

  // Periodic Display Refresh (every 5 seconds)
  uint32_t now = millis();
  if (now - lastDisplayUpdateMs >= 5000) {
    lastDisplayUpdateMs = now;
    DisplayDriver::drawHomeScreen(23.5f, relay1State, relay2State, SecurityManager::getDeviceId().c_str());
  }

  delay(10);
}

