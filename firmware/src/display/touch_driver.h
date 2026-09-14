#ifndef TOUCH_DRIVER_H
#define TOUCH_DRIVER_H

#include <Arduino.h>
#include <SPI.h>
#include <XPT2046_Touchscreen.h>
#include "config.h"

enum class TouchGesture {
    NONE,
    TAP,
    SWIPE_LEFT,
    SWIPE_RIGHT,
    SWIPE_UP,
    SWIPE_DOWN
};

struct TouchPoint {
    int16_t x;
    int16_t y;
    bool isPressed;
    TouchGesture gesture;
};

class TouchDriver {
public:
    static bool init(SPIClass &spiBus);
    static bool update(TouchPoint &outPoint);
    static bool isTouched();
    static bool getPoint(int16_t &x, int16_t &y);

private:
    static XPT2046_Touchscreen s_touch;
    static bool s_isTouched;
    static int16_t s_startX;
    static int16_t s_startY;
    static uint32_t s_touchStartMs;
    static int16_t s_lastX;
    static int16_t s_lastY;
};

#endif // TOUCH_DRIVER_H
