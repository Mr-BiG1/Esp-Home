#include "display_driver.h"

// SPIClass HSPI bus for ESP32-S3
SPIClass DisplayDriver::hspi = SPIClass(HSPI);
Adafruit_ILI9341 DisplayDriver::s_tft = Adafruit_ILI9341(&DisplayDriver::hspi, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);

// Color palette
#define COL_BG       0x0841  // Dark Blue-Grey background
#define COL_CARD     0x10A3  // Card surface
#define COL_ACCENT   0x04FF  // Vibrant Cyan accent
#define COL_ON       0x07E0  // Bright Green
#define COL_OFF      0x4208  // Dark Grey
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE

bool DisplayDriver::init() {
    Serial.println("=== DISPLAY DRIVER INIT ===");

    // 1. Configure GPIO CS & Reset pins HIGH before SPI bus init
    pinMode(PIN_TFT_CS, OUTPUT);   digitalWrite(PIN_TFT_CS, HIGH);
    pinMode(PIN_TFT_DC, OUTPUT);   digitalWrite(PIN_TFT_DC, HIGH);
    pinMode(PIN_TFT_RST, OUTPUT);  digitalWrite(PIN_TFT_RST, HIGH);
    pinMode(PIN_TOUCH_CS, OUTPUT); digitalWrite(PIN_TOUCH_CS, HIGH);

    // 2. Hardware RESET pulse BEFORE tft.begin()
    digitalWrite(PIN_TFT_RST, HIGH); delay(20);
    digitalWrite(PIN_TFT_RST, LOW);  delay(50);
    digitalWrite(PIN_TFT_RST, HIGH); delay(150);

    // 3. Initialize HSPI bus with exact hardware pins (MOSI 11, SCLK 12, MISO 13, CS 10)
    hspi.begin(PIN_TFT_SCLK, PIN_TFT_MISO, PIN_TFT_MOSI, PIN_TFT_CS);

    // 4. Adafruit ILI9341 driver begin with safe 16MHz SPI clock
    s_tft.begin(16000000);
    s_tft.setRotation(1); // 320x240 Landscape mode
    s_tft.fillScreen(COL_BG);

    Serial.println("ILI9341 Display Initialized Successfully!");
    return true;
}

void DisplayDriver::clear(uint16_t color) {
    s_tft.fillScreen(color);
}

void DisplayDriver::drawHeader(const char* title, bool wifiOnline, bool cloudOnline) {
    s_tft.fillRect(0, 0, 320, 28, COL_ACCENT);
    s_tft.setTextColor(ILI9341_BLACK);
    s_tft.setTextSize(2);
    s_tft.setCursor(8, 6);
    s_tft.print(title);
    s_tft.fillCircle(290, 14, 6, wifiOnline  ? COL_ON : COL_RED);
    s_tft.fillCircle(307, 14, 6, cloudOnline ? COL_ON : 0xFD20);
}

void DisplayDriver::drawHomeScreen(float temp, bool relay1State, bool relay2State, const char* deviceId) {
    s_tft.fillScreen(COL_BG);
    drawHeader("Smart Home ESP", true, true);

    // Temperature card
    s_tft.fillRoundRect(10, 38, 145, 90, 8, COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(20, 48); s_tft.print("TEMPERATURE");
    uint16_t tc = (temp < 15) ? ILI9341_CYAN : (temp > 28) ? COL_RED : COL_WHITE;
    s_tft.setTextSize(3); s_tft.setTextColor(tc);
    s_tft.setCursor(20, 72);
    char buf[16]; snprintf(buf, sizeof(buf), "%.1fC", temp);
    s_tft.print(buf);

    // Relay 1 card
    s_tft.fillRoundRect(165, 38, 145, 42, 8, relay1State ? 0x0340 : COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(175, 48); s_tft.print("RELAY 1");
    s_tft.setTextSize(2); s_tft.setTextColor(relay1State ? COL_ON : COL_OFF);
    s_tft.setCursor(175, 62); s_tft.print(relay1State ? "  ON" : "  OFF");

    // Relay 2 card
    s_tft.fillRoundRect(165, 86, 145, 42, 8, relay2State ? 0x0340 : COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(175, 96); s_tft.print("RELAY 2");
    s_tft.setTextSize(2); s_tft.setTextColor(relay2State ? COL_ON : COL_OFF);
    s_tft.setCursor(175, 110); s_tft.print(relay2State ? "  ON" : "  OFF");

    // Cloud connection info card
    s_tft.fillRoundRect(10, 136, 300, 80, 8, COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(20, 146); s_tft.print("CLOUD ENDPOINT");
    s_tft.setTextSize(1); s_tft.setTextColor(COL_WHITE);
    s_tft.setCursor(20, 162); s_tft.print("https://esp-home-inky.vercel.app");
    s_tft.setTextColor(COL_ON);
    s_tft.setCursor(20, 182); s_tft.print("Status: Connected & Polling");

    // Footer
    s_tft.setTextSize(1); s_tft.setTextColor(0x528A);
    s_tft.setCursor(8, 226); s_tft.print("ID: "); s_tft.print(deviceId);
}

void DisplayDriver::drawPairingScreen(const char* pairingCode) {
    s_tft.fillScreen(COL_BG);
    drawHeader("Pair Device", false, false);
    s_tft.setTextSize(2); s_tft.setTextColor(COL_WHITE);
    s_tft.setCursor(30, 60); s_tft.print("Scan or enter code:");
    s_tft.fillRoundRect(40, 95, 240, 55, 10, COL_CARD);
    s_tft.setTextSize(3); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(55, 110); s_tft.print(pairingCode);
    s_tft.setTextSize(1); s_tft.setTextColor(0x528A);
    s_tft.setCursor(30, 170); s_tft.print("Open the web app and enter this code");
    s_tft.setCursor(30, 185); s_tft.print("to connect this device.");
}

