#ifndef DISPLAY_DRIVER_H
#define DISPLAY_DRIVER_H

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include "config.h"

class DisplayDriver {
public:
    static bool init();
    static void clear(uint16_t color = ILI9341_BLACK);
    static void drawHeader(const char* title, bool wifiOnline, bool cloudOnline);
    static void drawHomeScreen(float temp, bool relay1State, bool relay2State, const char* deviceId);
    static void drawPairingScreen(const char* pairingCode);

    static SPIClass hspi;
    static Adafruit_ILI9341& getTft() { return s_tft; }

private:
    static Adafruit_ILI9341 s_tft;
};

#endif // DISPLAY_DRIVER_H
