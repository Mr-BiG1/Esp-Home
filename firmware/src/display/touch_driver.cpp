#include "touch_driver.h"

XPT2046_Touchscreen TouchDriver::s_touch(PIN_TOUCH_CS, PIN_TOUCH_IRQ);
bool TouchDriver::s_isTouched = false;
int16_t TouchDriver::s_startX = 0;
int16_t TouchDriver::s_startY = 0;
uint32_t TouchDriver::s_touchStartMs = 0;
int16_t TouchDriver::s_lastX = 0;
int16_t TouchDriver::s_lastY = 0;

// Calibration mapping for 320x240 landscape (rotation 1)
#define TOUCH_X_MIN 300
#define TOUCH_X_MAX 3800
#define TOUCH_Y_MIN 300
#define TOUCH_Y_MAX 3800

static int16_t mapTouchX(uint16_t rawX, uint16_t rawY) {
    rawX = constrain(rawX, TOUCH_X_MIN, TOUCH_X_MAX);
    return map(rawX, TOUCH_X_MIN, TOUCH_X_MAX, 0, 320);
}

static int16_t mapTouchY(uint16_t rawX, uint16_t rawY) {
    rawY = constrain(rawY, TOUCH_Y_MIN, TOUCH_Y_MAX);
    return map(rawY, TOUCH_Y_MIN, TOUCH_Y_MAX, 0, 240);
}

bool TouchDriver::init(SPIClass &spiBus) {
    pinMode(PIN_TOUCH_CS, OUTPUT);
    digitalWrite(PIN_TOUCH_CS, HIGH);

    pinMode(PIN_TFT_CS, OUTPUT);
    digitalWrite(PIN_TFT_CS, HIGH);

    if (PIN_TOUCH_IRQ >= 0) {
        pinMode(PIN_TOUCH_IRQ, INPUT_PULLUP);
    }

    // Initialize touch controller on shared SPI bus
    s_touch.begin(spiBus);
    s_touch.setRotation(1);

    digitalWrite(PIN_TFT_CS, HIGH);
    digitalWrite(PIN_TOUCH_CS, HIGH);
    return true;
}

bool TouchDriver::isTouched() {
    digitalWrite(PIN_TFT_CS, HIGH);
    return s_touch.touched();
}

bool TouchDriver::getPoint(int16_t &x, int16_t &y) {
    digitalWrite(PIN_TFT_CS, HIGH);
    if (!s_touch.touched()) {
        return false;
    }

    TS_Point p = s_touch.getPoint();
    x = mapTouchX(p.x, p.y);
    y = mapTouchY(p.x, p.y);
    return true;
}

bool TouchDriver::update(TouchPoint &outPoint) {
    outPoint.gesture = TouchGesture::NONE;
    outPoint.isPressed = false;

    // Ensure TFT chip select is HIGH (deselected) before reading touch controller
    digitalWrite(PIN_TFT_CS, HIGH);

    bool rawTouch = s_touch.touched();

    if (rawTouch) {
        TS_Point p = s_touch.getPoint();
        int16_t px = mapTouchX(p.x, p.y);
        int16_t py = mapTouchY(p.x, p.y);

        if (!s_isTouched) {
            // Touch press down start
            s_isTouched = true;
            s_startX = px;
            s_startY = py;
            s_touchStartMs = millis();
        }

        s_lastX = px;
        s_lastY = py;
        outPoint.x = px;
        outPoint.y = py;
        outPoint.isPressed = true;
        return true;
    } else {
        if (s_isTouched) {
            // Touch release up
            s_isTouched = false;
            uint32_t duration = millis() - s_touchStartMs;
            int16_t dx = s_lastX - s_startX;
            int16_t dy = s_lastY - s_startY;

            outPoint.x = s_lastX;
            outPoint.y = s_lastY;
            outPoint.isPressed = false;

            // Swipe threshold 40px, tap max duration 450ms
            if (abs(dx) > 40 && abs(dx) > abs(dy)) {
                outPoint.gesture = (dx > 0) ? TouchGesture::SWIPE_RIGHT : TouchGesture::SWIPE_LEFT;
            } else if (abs(dy) > 40 && abs(dy) > abs(dx)) {
                outPoint.gesture = (dy > 0) ? TouchGesture::SWIPE_DOWN : TouchGesture::SWIPE_UP;
            } else if (duration < 450 && abs(dx) < 20 && abs(dy) < 20) {
                outPoint.gesture = TouchGesture::TAP;
            }
            return true;
        }
    }

    return false;
}
