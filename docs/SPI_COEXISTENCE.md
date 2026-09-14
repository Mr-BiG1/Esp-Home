# SPI Bus Multiplexing & Hardware Coexistence Guide

## System Architecture

The Smart Home Mesh Controller shares a single hardware SPI bus (`HSPI`) on the ESP32-S3 between the **ILI9341 3.2" Display** (40MHz clock) and the **XPT2046 Touchscreen Controller** (2MHz clock).

---

## Root Cause of Bus Conflicts

Standard Arduino libraries (such as `Adafruit_ILI9341` and `XPT2046_Touchscreen`) default to calling `SPI.begin()` with default ESP32 pins. When called sequentially, one library overwrites the pin multiplexer configuration of the other, resulting in a white screen or dead touchscreen.

---

## Solutions & Implementation

### 1. Unified Bus Initialization
Both `PIN_TFT_CS` (10) and `PIN_TOUCH_CS` (15) are configured as `OUTPUT` and pulled `HIGH` before initialization:

```cpp
pinMode(PIN_TFT_CS, OUTPUT);
digitalWrite(PIN_TFT_CS, HIGH);

pinMode(PIN_TOUCH_CS, OUTPUT);
digitalWrite(PIN_TOUCH_CS, HIGH);
```

### 2. Custom SPI Instance Injection
Both `DisplayDriver` and `TouchDriver` share a single static `SPIClass` instance (`HSPI`):

```cpp
// DisplayDriver.cpp
SPIClass DisplayDriver::hspi = SPIClass(HSPI);
Adafruit_ILI9341 DisplayDriver::s_tft(&DisplayDriver::hspi, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);

// TouchDriver.cpp
TouchDriver::init(DisplayDriver::hspi);
```

### 3. SPI Transaction Wrapping
Adafruit_GFX and XPT2046 libraries wrap their SPI communications in `SPI.beginTransaction(SPISettings(...))` and `SPI.endTransaction()`. This automatically handles clock speed adjustments (40MHz for TFT, 2MHz for Touch) dynamically without resetting pin mappings.
