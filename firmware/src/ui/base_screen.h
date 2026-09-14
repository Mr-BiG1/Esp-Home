#ifndef BASE_SCREEN_H
#define BASE_SCREEN_H

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include "../display/touch_driver.h"

class BaseScreen {
public:
    virtual ~BaseScreen() {}
    virtual void onEnter() = 0;
    virtual void render(Adafruit_ILI9341 &tft) = 0;
    virtual void handleTouch(TouchPoint &tp) = 0;
    virtual void update() = 0;
    virtual const char* getTitle() const = 0;
};

#endif // BASE_SCREEN_H
