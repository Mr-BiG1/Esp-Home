#include "display_driver.h"

// SPIClass mySPI(HSPI) matching proven diagnostic sketch
SPIClass DisplayDriver::hspi = SPIClass(HSPI);
Adafruit_ILI9341 DisplayDriver::s_tft = Adafruit_ILI9341(&DisplayDriver::hspi, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);

// Color palette
#define COL_BG       0x0841
#define COL_CARD     0x10A3
#define COL_ACCENT   0x04FF
#define COL_ON       0x07E0
#define COL_OFF      0x4208
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE

static void writeCmd(uint8_t cmd) {
    digitalWrite(PIN_TFT_DC, LOW);
    digitalWrite(PIN_TFT_CS, LOW);
    DisplayDriver::hspi.beginTransaction(SPISettings(10000000, MSBFIRST, SPI_MODE0));
    DisplayDriver::hspi.transfer(cmd);
    DisplayDriver::hspi.endTransaction();
    digitalWrite(PIN_TFT_CS, HIGH);
}

static void writeData(uint8_t data) {
    digitalWrite(PIN_TFT_DC, HIGH);
    digitalWrite(PIN_TFT_CS, LOW);
    DisplayDriver::hspi.beginTransaction(SPISettings(10000000, MSBFIRST, SPI_MODE0));
    DisplayDriver::hspi.transfer(data);
    DisplayDriver::hspi.endTransaction();
    digitalWrite(PIN_TFT_CS, HIGH);
}

static void rawFillScreen(uint16_t color) {
    // Set column address 0..239
    writeCmd(0x2A);
    writeData(0x00); writeData(0x00);
    writeData(0x00); writeData(0xEF);
    // Set row address 0..319
    writeCmd(0x2B);
    writeData(0x00); writeData(0x00);
    writeData(0x01); writeData(0x3F);
    // Write to RAM
    writeCmd(0x2C);
    digitalWrite(PIN_TFT_DC, HIGH);
    digitalWrite(PIN_TFT_CS, LOW);
    DisplayDriver::hspi.beginTransaction(SPISettings(10000000, MSBFIRST, SPI_MODE0));
    for (uint32_t i = 0; i < 240UL * 320UL; i++) {
        DisplayDriver::hspi.transfer16(color);
    }
    DisplayDriver::hspi.endTransaction();
    digitalWrite(PIN_TFT_CS, HIGH);
}

bool DisplayDriver::init() {
    Serial.println("=== DISPLAY DRIVER INIT (UNIFIED HSPI) ===");

    // 1. Initialize HSPI bus with exact pins
    hspi.begin(PIN_TFT_SCLK, PIN_TFT_MISO, PIN_TFT_MOSI, PIN_TFT_CS);

    // 2. Setup GPIO
    pinMode(PIN_TFT_CS, OUTPUT);   digitalWrite(PIN_TFT_CS, HIGH);
    pinMode(PIN_TFT_DC, OUTPUT);   digitalWrite(PIN_TFT_DC, HIGH);
    pinMode(PIN_TFT_RST, OUTPUT);  digitalWrite(PIN_TFT_RST, HIGH);
    pinMode(PIN_TOUCH_CS, OUTPUT); digitalWrite(PIN_TOUCH_CS, HIGH);

    // 3. Adafruit ILI9341 driver begin
    s_tft.begin(40000000); // 40MHz SPI

    // 4. Hardware RESET pulse
    Serial.println("Hardware Reset...");
    digitalWrite(PIN_TFT_RST, HIGH); delay(10);
    digitalWrite(PIN_TFT_RST, LOW);  delay(20);
    digitalWrite(PIN_TFT_RST, HIGH); delay(150);

    Serial.println("tft.begin() called");

    // 5. Read display registers to verify SPI communication
    uint8_t x = s_tft.readcommand8(ILI9341_RDMODE);
    Serial.print("Display Power Mode: 0x"); Serial.println(x, HEX);
    Serial.println("HSPI Initialized");

    // 7. Solid color tests & exact register sequence from working sketch
    Serial.println("BLACK...");
    s_tft.fillScreen(ILI9341_BLACK);
    delay(500);

    // === ILI9341 Init sequence ===
    writeCmd(0x01); delay(150); // Software Reset
    writeCmd(0x11); delay(120); // Sleep out

    Serial.println("RED...");
    s_tft.fillScreen(ILI9341_RED);
    delay(500);

    writeCmd(0xCF); writeData(0x00); writeData(0xC1); writeData(0x30);
    writeCmd(0xED); writeData(0x64); writeData(0x03); writeData(0x12); writeData(0x81);
    writeCmd(0xE8); writeData(0x85); writeData(0x00); writeData(0x78);
    writeCmd(0xCB); writeData(0x39); writeData(0x2C); writeData(0x00); writeData(0x34); writeData(0x02);
    writeCmd(0xF7); writeData(0x20);
    writeCmd(0xEA); writeData(0x00); writeData(0x00);

    Serial.println("GREEN...");
    s_tft.fillScreen(ILI9341_GREEN);
    delay(500);

    writeCmd(0xC0); writeData(0x23);            // Power Control 1
    writeCmd(0xC1); writeData(0x10);            // Power Control 2
    writeCmd(0xC5); writeData(0x3E); writeData(0x28); // VCOM Control 1
    writeCmd(0xC7); writeData(0x86);            // VCOM Control 2

    Serial.println("BLUE...");
    s_tft.fillScreen(ILI9341_BLUE);
    delay(500);

    writeCmd(0x36); writeData(0x48);            // Memory Access Control (portrait)
    writeCmd(0x3A); writeData(0x55);            // Pixel Format = 16bit RGB565

    Serial.println("TEXT...");
    s_tft.fillScreen(ILI9341_BLACK);
    s_tft.setTextColor(ILI9341_WHITE);
    s_tft.setTextSize(3);
    s_tft.setCursor(20, 80);
    s_tft.print("ESP32-S3");
    s_tft.setCursor(20, 130);
    s_tft.setTextColor(ILI9341_GREEN);
    s_tft.print("ONLINE!");
    delay(1000);

    writeCmd(0xB1); writeData(0x00); writeData(0x18); // Frame Control
    writeCmd(0xB6); writeData(0x08); writeData(0x82); writeData(0x27); // Display Function
    writeCmd(0xF2); writeData(0x00);            // 3Gamma off
    writeCmd(0x26); writeData(0x01);            // Gamma curve

    // Gamma settings
    writeCmd(0xE0); writeData(0x0F); writeData(0x31); writeData(0x2B); writeData(0x0C); writeData(0x0E);
                    writeData(0x08); writeData(0x4E); writeData(0xF1); writeData(0x37); writeData(0x07);
                    writeData(0x10); writeData(0x03); writeData(0x0E); writeData(0x09); writeData(0x00);
    writeCmd(0xE1); writeData(0x00); writeData(0x0E); writeData(0x14); writeData(0x03); writeData(0x11);
                    writeData(0x07); writeData(0x31); writeData(0xC1); writeData(0x48); writeData(0x08);
                    writeData(0x0F); writeData(0x0C); writeData(0x31); writeData(0x36); writeData(0x0F);

    writeCmd(0x11); delay(120); // Sleep Out
    writeCmd(0x29); delay(50);  // Display ON

    Serial.println("ILI9341 Raw Fill Tests...");
    rawFillScreen(0xF800); delay(500); // RED
    rawFillScreen(0x07E0); delay(500); // GREEN
    rawFillScreen(0x001F); delay(500); // BLUE
    rawFillScreen(0x0000); delay(300); // BLACK

    s_tft.setRotation(1);
    s_tft.fillScreen(COL_BG);
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
    drawHeader("Smart Home", true, true);

    // Temperature card
    s_tft.fillRoundRect(10, 38, 145, 90, 8, COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(20, 48); s_tft.print("TEMPERATURE");
    uint16_t tc = (temp < 15) ? ILI9341_CYAN : (temp > 28) ? COL_RED : COL_WHITE;
    s_tft.setTextSize(3); s_tft.setTextColor(tc);
    s_tft.setCursor(20, 72);
    char buf[16]; snprintf(buf, sizeof(buf), "%.1fC", temp);
    s_tft.print(buf);

    // Relay 1
    s_tft.fillRoundRect(165, 38, 145, 42, 8, relay1State ? 0x0340 : COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(175, 48); s_tft.print("RELAY 1");
    s_tft.setTextSize(2); s_tft.setTextColor(relay1State ? COL_ON : COL_OFF);
    s_tft.setCursor(175, 62); s_tft.print(relay1State ? "  ON" : "  OFF");

    // Relay 2
    s_tft.fillRoundRect(165, 86, 145, 42, 8, relay2State ? 0x0340 : COL_CARD);
    s_tft.setTextSize(1); s_tft.setTextColor(COL_ACCENT);
    s_tft.setCursor(175, 96); s_tft.print("RELAY 2");
    s_tft.setTextSize(2); s_tft.setTextColor(relay2State ? COL_ON : COL_OFF);
    s_tft.setCursor(175, 110); s_tft.print(relay2State ? "  ON" : "  OFF");

    // Footer
    s_tft.setTextSize(1); s_tft.setTextColor(0x528A);
    s_tft.setCursor(8, 230); s_tft.print("ID: "); s_tft.print(deviceId);
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
    s_tft.setCursor(30, 170); s_tft.print("Open the app and enter this code");
    s_tft.setCursor(30, 185); s_tft.print("to connect this device.");
}
