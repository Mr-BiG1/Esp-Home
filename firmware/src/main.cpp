#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

// Your confirmed pin assignments
// === Pin Definitions ===
#define TFT_CS   10
#define TFT_DC    9
#define TFT_RST  14
#define TFT_MOSI 11
#define TFT_CLK  12
#define TFT_MISO 13

// Use hardware SPI with explicit pin configuration
SPIClass mySPI(HSPI);
Adafruit_ILI9341 tft = Adafruit_ILI9341(&mySPI, TFT_DC, TFT_CS, TFT_RST);

// === Raw SPI write ===
void writeCmd(uint8_t cmd) {
  digitalWrite(TFT_DC, LOW);
  digitalWrite(TFT_CS, LOW);
  SPI.transfer(cmd);
  digitalWrite(TFT_CS, HIGH);
}

void writeData(uint8_t data) {
  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);
  SPI.transfer(data);
  digitalWrite(TFT_CS, HIGH);
}

void writeData16(uint16_t data) {
  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);
  SPI.transfer16(data);
  digitalWrite(TFT_CS, HIGH);
}

// === Fill entire screen with one color ===
void fillScreen(uint16_t color) {
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
  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);
  for (uint32_t i = 0; i < 240UL * 320UL; i++) {
    SPI.transfer16(color);
  }
  digitalWrite(TFT_CS, HIGH);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== ILI9341 STANDALONE DISPLAY TEST ===");

  // Onboard WS2812 RGB LED strobe on boot
  neopixelWrite(48, 255, 0, 0); delay(200);
  neopixelWrite(48, 0, 255, 0); delay(200);
  neopixelWrite(48, 0, 0, 255); delay(200);
  neopixelWrite(48, 0, 0, 0);

  // Initialize SPI bus with exact pins
  mySPI.begin(TFT_CLK, TFT_MISO, TFT_MOSI, TFT_CS);

  // Setup GPIO
  pinMode(TFT_CS,  OUTPUT); digitalWrite(TFT_CS,  HIGH);
  pinMode(TFT_DC,  OUTPUT); digitalWrite(TFT_DC,  HIGH);
  pinMode(TFT_RST, OUTPUT); digitalWrite(TFT_RST, HIGH);

  tft.begin(40000000); // 40MHz SPI

  // Hardware RESET pulse
  Serial.println("Hardware Reset...");
  digitalWrite(TFT_RST, HIGH); delay(10);
  digitalWrite(TFT_RST, LOW);  delay(20);
  digitalWrite(TFT_RST, HIGH); delay(150);

  Serial.println("tft.begin() called");

  // Init SPI on correct FSPI pins for ESP32-S3
  SPI.begin(TFT_CLK, TFT_MISO, TFT_MOSI, TFT_CS);
  SPI.setFrequency(10000000); // 10MHz conservative
  SPI.setDataMode(SPI_MODE0);
  SPI.setBitOrder(MSBFIRST);

  // Read display registers to verify SPI communication
  uint8_t x = tft.readcommand8(ILI9341_RDMODE);
  Serial.print("Display Power Mode: 0x"); Serial.println(x, HEX);
  Serial.println("SPI Initialized");

  // Solid color tests
  Serial.println("BLACK...");
  tft.fillScreen(ILI9341_BLACK);
  delay(1500);

  // === ILI9341 Init sequence ===
  writeCmd(0x01); delay(150); // Software Reset
  writeCmd(0x11); delay(120); // Sleep out
  Serial.println("RED...");
  tft.fillScreen(ILI9341_RED);
  delay(1500);

  writeCmd(0xCF); writeData(0x00); writeData(0xC1); writeData(0x30);
  writeCmd(0xED); writeData(0x64); writeData(0x03); writeData(0x12); writeData(0x81);
  writeCmd(0xE8); writeData(0x85); writeData(0x00); writeData(0x78);
  writeCmd(0xCB); writeData(0x39); writeData(0x2C); writeData(0x00); writeData(0x34); writeData(0x02);
  writeCmd(0xF7); writeData(0x20);
  writeCmd(0xEA); writeData(0x00); writeData(0x00);

  Serial.println("GREEN...");
  tft.fillScreen(ILI9341_GREEN);
  delay(1500);

  writeCmd(0xC0); writeData(0x23);            // Power Control 1
  writeCmd(0xC1); writeData(0x10);            // Power Control 2
  writeCmd(0xC5); writeData(0x3E); writeData(0x28); // VCOM Control 1
  writeCmd(0xC7); writeData(0x86);            // VCOM Control 2

  Serial.println("BLUE...");
  tft.fillScreen(ILI9341_BLUE);
  delay(1500);

  writeCmd(0x36); writeData(0x48);            // Memory Access Control (portrait)
  writeCmd(0x3A); writeData(0x55);            // Pixel Format = 16bit RGB565

  Serial.println("TEXT...");
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(20, 80);
  tft.print("ESP32-S3");
  tft.setCursor(20, 130);
  tft.setTextColor(ILI9341_GREEN);
  tft.print("ONLINE!");

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

  Serial.println("ILI9341 Init done — filling RED");
  fillScreen(0xF800); // RED
  delay(2000);
  Serial.println("Filling GREEN");
  fillScreen(0x07E0); // GREEN
  delay(2000);
  Serial.println("Filling BLUE");
  fillScreen(0x001F); // BLUE
  delay(2000);
  Serial.println("Filling BLACK");
  fillScreen(0x0000); // BLACK
  delay(1000);
  Serial.println("=== DONE INIT ===");
}

void loop() {
  // Continuous loop cycling colors on display so display status is unmistakably visible
  Serial.println("Looping color test: RED...");
  fillScreen(0xF800); delay(1500); // RED
  Serial.println("Looping color test: GREEN...");
  fillScreen(0x07E0); delay(1500); // GREEN
  Serial.println("Looping color test: BLUE...");
  fillScreen(0x001F); delay(1500); // BLUE
  Serial.println("Looping color test: WHITE...");
  fillScreen(0xFFFF); delay(1500); // WHITE
  Serial.println("Looping color test: BLACK...");
  fillScreen(0x0000); delay(1500); // BLACK
}
