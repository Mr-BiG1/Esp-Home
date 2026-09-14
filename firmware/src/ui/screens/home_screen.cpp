#include "home_screen.h"

// Color Palette
#define COL_BG       0x0841  // Dark navy background
#define COL_CARD     0x10A3  // Dark slate card
#define COL_ACCENT   0x04FF  // Vibrant cyan
#define COL_ON       0x07E0  // Green
#define COL_OFF      0x4208  // Muted gray
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE
#define COL_YELLOW   0xFD20
#define COL_MUTED    0x632C

HomeScreen::HomeScreen(RelayModule &relayModule)
    : m_relays(relayModule), m_temp(22.5f), m_humidity(45.0f),
      m_wifiConnected(false), m_cloudConnected(false),
      m_alertCount(0), m_needsRedraw(true), m_lastUpdateMs(0) {}

void HomeScreen::onEnter() {
    m_needsRedraw = true;
}

void HomeScreen::setSystemStatus(float temp, float humidity, bool wifiConnected, bool cloudConnected, int alertCount) {
    if (abs(m_temp - temp) > 0.2f || abs(m_humidity - humidity) > 1.0f ||
        m_wifiConnected != wifiConnected || m_cloudConnected != cloudConnected ||
        m_alertCount != alertCount) {
        m_temp = temp;
        m_humidity = humidity;
        m_wifiConnected = wifiConnected;
        m_cloudConnected = cloudConnected;
        m_alertCount = alertCount;
        m_needsRedraw = true;
    }
}

void HomeScreen::render(Adafruit_ILI9341 &tft) {
    if (!m_needsRedraw) return;
    m_needsRedraw = false;

    tft.fillScreen(COL_BG);

    // Header bar
    tft.fillRect(0, 0, 320, 26, COL_CARD);
    tft.setTextColor(COL_ACCENT);
    tft.setTextSize(2);
    tft.setCursor(8, 5);
    tft.print("SMART HOME MESH");

    // Status dots: WiFi & Cloud
    tft.fillCircle(285, 13, 5, m_wifiConnected ? COL_ON : COL_RED);
    tft.fillCircle(305, 13, 5, m_cloudConnected ? COL_ON : COL_YELLOW);

    // Card 1: Environment (Temp & Humidity)
    tft.fillRoundRect(10, 34, 145, 90, 6, COL_CARD);
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 42);
    tft.print("CLIMATE SENSOR");

    tft.setTextSize(3);
    tft.setTextColor(m_temp > 28.0f ? COL_RED : (m_temp < 18.0f ? ILI9341_CYAN : COL_WHITE));
    tft.setCursor(18, 62);
    char buf[16];
    snprintf(buf, sizeof(buf), "%.1f C", m_temp);
    tft.print(buf);

    tft.setTextSize(1);
    tft.setTextColor(COL_ACCENT);
    tft.setCursor(18, 98);
    snprintf(buf, sizeof(buf), "HUMIDITY: %.0f%%", m_humidity);
    tft.print(buf);

    // Card 2: System Health & Mode
    tft.fillRoundRect(165, 34, 145, 90, 6, COL_CARD);
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(173, 42);
    tft.print("SYSTEM STATUS");

    tft.setTextSize(2);
    tft.setTextColor(m_cloudConnected ? COL_ON : COL_YELLOW);
    tft.setCursor(173, 58);
    tft.print(m_cloudConnected ? "CLOUD MESH" : "LOCAL ONLY");

    tft.setTextSize(1);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(173, 85);
    tft.print("ALERTS: ");
    if (m_alertCount > 0) {
        tft.setTextColor(COL_RED);
        tft.print(m_alertCount);
        tft.print(" ACTIVE");
    } else {
        tft.setTextColor(COL_ON);
        tft.print("NOMINAL");
    }

    tft.setCursor(173, 102);
    tft.setTextColor(COL_MUTED);
    tft.print("UPTIME: ");
    tft.print(millis() / 1000);
    tft.print("s");

    // Card 3: Relay 1 Quick Switch (Power)
    bool r1 = m_relays.getState(0);
    tft.fillRoundRect(10, 132, 145, 80, 6, r1 ? 0x0340 : COL_CARD);
    tft.drawRoundRect(10, 132, 145, 80, 6, r1 ? COL_ON : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(18, 140);
    tft.print("RELAY 1 (MAIN)");

    tft.setTextSize(2);
    tft.setTextColor(r1 ? COL_ON : COL_OFF);
    tft.setCursor(18, 160);
    tft.print(r1 ? "[ ON ]" : "[ OFF ]");

    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 192);
    tft.print("Tap to toggle");

    // Card 4: Relay 2 Quick Switch (Aux/Desk)
    bool r2 = m_relays.getState(1);
    tft.fillRoundRect(165, 132, 145, 80, 6, r2 ? 0x0340 : COL_CARD);
    tft.drawRoundRect(165, 132, 145, 80, 6, r2 ? COL_ON : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(173, 140);
    tft.print("RELAY 2 (AUX)");

    tft.setTextSize(2);
    tft.setTextColor(r2 ? COL_ON : COL_OFF);
    tft.setCursor(173, 160);
    tft.print(r2 ? "[ ON ]" : "[ OFF ]");

    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(173, 192);
    tft.print("Tap to toggle");

    // Footer indicator
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(10, 222);
    tft.print("Swipe < > for Servers / Climate / Tasks");
}

void HomeScreen::handleTouch(TouchPoint &tp) {
    if (tp.gesture == TouchGesture::TAP || (tp.isPressed && !m_needsRedraw)) {
        // Relay 1 Card: x: 10-155, y: 132-212
        if (tp.x >= 10 && tp.x <= 155 && tp.y >= 132 && tp.y <= 212) {
            m_relays.toggle(0);
            m_needsRedraw = true;
        }

        // Relay 2 Card: x: 165-310, y: 132-212
        if (tp.x >= 165 && tp.x <= 310 && tp.y >= 132 && tp.y <= 212) {
            m_relays.toggle(1);
            m_needsRedraw = true;
        }
    }
}

void HomeScreen::update() {
    if (millis() - m_lastUpdateMs > 5000) {
        m_lastUpdateMs = millis();
        // Redraw footer uptime
        m_needsRedraw = true;
    }
}
