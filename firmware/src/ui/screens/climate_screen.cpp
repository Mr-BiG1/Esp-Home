#include "climate_screen.h"

#define COL_BG       0x0841
#define COL_CARD     0x10A3
#define COL_ACCENT   0x04FF
#define COL_ON       0x07E0
#define COL_OFF      0x4208
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE
#define COL_YELLOW   0xFD20
#define COL_MUTED    0x632C

ClimateScreen::ClimateScreen(ClimateController &climate)
    : m_climate(climate), m_needsRedraw(true), m_lastUpdateMs(0) {}

void ClimateScreen::onEnter() {
    m_needsRedraw = true;
}

void ClimateScreen::render(Adafruit_ILI9341 &tft) {
    if (!m_needsRedraw) return;
    m_needsRedraw = false;

    tft.fillScreen(COL_BG);

    // Header bar
    tft.fillRect(0, 0, 320, 26, COL_CARD);
    tft.setTextColor(COL_ACCENT);
    tft.setTextSize(2);
    tft.setCursor(8, 5);
    tft.print("CLIMATE & HEATER");

    // Heater status indicator
    bool heating = m_climate.isHeaterOn();
    tft.fillCircle(305, 13, 5, heating ? COL_RED : COL_MUTED);

    // Current Temp & Humidity Card
    tft.fillRoundRect(10, 34, 145, 95, 6, COL_CARD);
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 42);
    tft.print("CURRENT TEMP");

    tft.setTextSize(3);
    tft.setTextColor(m_climate.getCurrentTemp() > 25.0f ? COL_RED : ILI9341_CYAN);
    tft.setCursor(18, 60);
    tft.printf("%.1f C", m_climate.getCurrentTemp());

    tft.setTextSize(1);
    tft.setTextColor(COL_ACCENT);
    tft.setCursor(18, 98);
    tft.printf("HUMIDITY: %.0f%%", m_climate.getCurrentHumidity());

    // Target Temperature Card (+ / - controls)
    tft.fillRoundRect(165, 34, 145, 95, 6, COL_CARD);
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(173, 42);
    tft.print("TARGET SETPOINT");

    tft.setTextSize(3);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(173, 60);
    tft.printf("%.1f C", m_climate.getTargetTemp());

    // Plus (+) Button: x: 173-228, y: 92-120
    tft.fillRoundRect(173, 92, 55, 30, 4, COL_ACCENT);
    tft.setTextSize(2);
    tft.setTextColor(ILI9341_BLACK);
    tft.setCursor(195, 99);
    tft.print("+");

    // Minus (-) Button: x: 243-298, y: 92-120
    tft.fillRoundRect(243, 92, 55, 30, 4, 0x4208);
    tft.setTextSize(2);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(266, 99);
    tft.print("-");

    // Mode Selector Buttons (AUTO / BOOST / OFF)
    ClimateMode m = m_climate.getMode();

    // AUTO: x: 10-100, y: 136-175
    tft.fillRoundRect(10, 136, 90, 40, 6, m == ClimateMode::AUTO ? 0x0340 : COL_CARD);
    tft.drawRoundRect(10, 136, 90, 40, 6, m == ClimateMode::AUTO ? COL_ON : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(m == ClimateMode::AUTO ? COL_ON : COL_WHITE);
    tft.setCursor(35, 152);
    tft.print("AUTO");

    // BOOST: x: 115-205, y: 136-175
    tft.fillRoundRect(115, 136, 90, 40, 6, m == ClimateMode::BOOST ? 0x7800 : COL_CARD);
    tft.drawRoundRect(115, 136, 90, 40, 6, m == ClimateMode::BOOST ? COL_RED : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(m == ClimateMode::BOOST ? COL_RED : COL_WHITE);
    tft.setCursor(140, 152);
    tft.print("BOOST");

    // OFF: x: 220-310, y: 136-175
    tft.fillRoundRect(220, 136, 90, 40, 6, m == ClimateMode::OFF ? 0x39E7 : COL_CARD);
    tft.drawRoundRect(220, 136, 90, 40, 6, m == ClimateMode::OFF ? COL_YELLOW : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(m == ClimateMode::OFF ? COL_YELLOW : COL_WHITE);
    tft.setCursor(252, 152);
    tft.print("OFF");

    // Safety Banner
    tft.fillRoundRect(10, 184, 300, 32, 4, COL_CARD);
    tft.setTextSize(1);
    tft.setCursor(18, 195);
    tft.setTextColor(COL_MUTED);
    tft.print("SAFETY TRIP: ");

    ClimateSafetyStatus status = m_climate.getSafetyStatus();
    switch (status) {
        case ClimateSafetyStatus::OK:
            tft.setTextColor(COL_ON); tft.print("NOMINAL (PASS)"); break;
        case ClimateSafetyStatus::MIN_ON_TIMER:
            tft.setTextColor(COL_YELLOW); tft.print("HOLD MIN ON (60s)"); break;
        case ClimateSafetyStatus::MIN_OFF_TIMER:
            tft.setTextColor(COL_YELLOW); tft.print("HOLD MIN OFF (180s)"); break;
        case ClimateSafetyStatus::MAX_RUNTIME_EXCEEDED:
            tft.setTextColor(COL_RED); tft.print("TRIP: MAX RUNTIME (2h)"); break;
        case ClimateSafetyStatus::SENSOR_FAULT:
            tft.setTextColor(COL_RED); tft.print("TRIP: SENSOR FAULT"); break;
    }

    // Footer
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(10, 222);
    tft.print("Swipe < > for Home / Server / Tasks");
}

void ClimateScreen::handleTouch(TouchPoint &tp) {
    if (tp.gesture == TouchGesture::TAP || tp.isPressed) {
        // Plus (+) button: x: 173-228, y: 92-122
        if (tp.x >= 173 && tp.x <= 228 && tp.y >= 92 && tp.y <= 122) {
            m_climate.setTargetTemp(m_climate.getTargetTemp() + 0.5f);
            m_needsRedraw = true;
        }

        // Minus (-) button: x: 243-298, y: 92-122
        if (tp.x >= 243 && tp.x <= 298 && tp.y >= 92 && tp.y <= 122) {
            m_climate.setTargetTemp(m_climate.getTargetTemp() - 0.5f);
            m_needsRedraw = true;
        }

        // AUTO button: x: 10-100, y: 136-175
        if (tp.x >= 10 && tp.x <= 100 && tp.y >= 136 && tp.y <= 175) {
            m_climate.setMode(ClimateMode::AUTO);
            m_needsRedraw = true;
        }

        // BOOST button: x: 115-205, y: 136-175
        if (tp.x >= 115 && tp.x <= 205 && tp.y >= 136 && tp.y <= 175) {
            m_climate.setMode(ClimateMode::BOOST);
            m_needsRedraw = true;
        }

        // OFF button: x: 220-310, y: 136-175
        if (tp.x >= 220 && tp.x <= 310 && tp.y >= 136 && tp.y <= 175) {
            m_climate.setMode(ClimateMode::OFF);
            m_needsRedraw = true;
        }
    }
}

void ClimateScreen::update() {
    if (millis() - m_lastUpdateMs > 2000) {
        m_lastUpdateMs = millis();
        m_needsRedraw = true;
    }
}
