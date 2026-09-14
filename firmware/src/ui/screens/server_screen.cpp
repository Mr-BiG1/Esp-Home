#include "server_screen.h"

#define COL_BG       0x0841
#define COL_CARD     0x10A3
#define COL_ACCENT   0x04FF
#define COL_ON       0x07E0
#define COL_OFF      0x4208
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE
#define COL_YELLOW   0xFD20
#define COL_MUTED    0x632C

ServerScreen::ServerScreen(RelayModule &relays)
    : m_relays(relays), m_needsRedraw(true), m_lastUpdateMs(0) {
    strncpy(m_server.name, "DESKTOP-RIG", sizeof(m_server.name));
    m_server.online = true;
    m_server.cpuUsage = 24.5f;
    m_server.memUsage = 62.0f;
    m_server.gpuTemp = 48.0f;
    m_server.uptimeSec = 14200;
    m_server.isMeasured = true;
}

void ServerScreen::onEnter() {
    m_needsRedraw = true;
}

void ServerScreen::updateServerData(const char* name, bool online, float cpu, float mem, float gpuTemp, uint32_t uptime, bool isMeasured) {
    strncpy(m_server.name, name, sizeof(m_server.name) - 1);
    m_server.online = online;
    m_server.cpuUsage = cpu;
    m_server.memUsage = mem;
    m_server.gpuTemp = gpuTemp;
    m_server.uptimeSec = uptime;
    m_server.isMeasured = isMeasured;
    m_needsRedraw = true;
}

void ServerScreen::render(Adafruit_ILI9341 &tft) {
    if (!m_needsRedraw) return;
    m_needsRedraw = false;

    tft.fillScreen(COL_BG);

    // Header bar
    tft.fillRect(0, 0, 320, 26, COL_CARD);
    tft.setTextColor(COL_ACCENT);
    tft.setTextSize(2);
    tft.setCursor(8, 5);
    tft.print("PC / SERVER MONITOR");

    // Online badge
    tft.fillCircle(305, 13, 5, m_server.online ? COL_ON : COL_RED);

    // Server Info Card
    tft.fillRoundRect(10, 34, 300, 95, 6, COL_CARD);
    tft.setTextSize(2);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(18, 42);
    tft.print(m_server.name);

    // Data Provenance Badge (MEASURED vs INFERRED)
    tft.setTextSize(1);
    tft.fillRect(210, 42, 90, 14, m_server.isMeasured ? 0x0340 : 0x7BE0);
    tft.setTextColor(m_server.isMeasured ? COL_ON : COL_YELLOW);
    tft.setCursor(215, 45);
    tft.print(m_server.isMeasured ? "[MEASURED]" : "[INFERRED]");

    // CPU Bar
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 66);
    tft.print("CPU ");
    tft.setTextColor(COL_WHITE);
    tft.printf("%.0f%%", m_server.cpuUsage);
    tft.drawRect(80, 66, 120, 10, COL_MUTED);
    int cpuWidth = map(constrain((int)m_server.cpuUsage, 0, 100), 0, 100, 0, 118);
    tft.fillRect(81, 67, cpuWidth, 8, m_server.cpuUsage > 85 ? COL_RED : COL_ACCENT);

    // MEM Bar
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 82);
    tft.print("RAM ");
    tft.setTextColor(COL_WHITE);
    tft.printf("%.0f%%", m_server.memUsage);
    tft.drawRect(80, 82, 120, 10, COL_MUTED);
    int memWidth = map(constrain((int)m_server.memUsage, 0, 100), 0, 100, 0, 118);
    tft.fillRect(81, 83, memWidth, 8, m_server.memUsage > 85 ? COL_RED : COL_ACCENT);

    // GPU Temp
    tft.setTextColor(COL_MUTED);
    tft.setCursor(18, 98);
    tft.print("GPU ");
    tft.setTextColor(m_server.gpuTemp > 75 ? COL_RED : COL_WHITE);
    tft.printf("%.1f C", m_server.gpuTemp);

    // Uptime
    tft.setTextColor(COL_MUTED);
    tft.setCursor(140, 98);
    tft.print("UP: ");
    tft.setTextColor(COL_WHITE);
    tft.printf("%luh", m_server.uptimeSec / 3600);

    // Relay Power Controls
    bool r1 = m_relays.getState(0);
    tft.fillRoundRect(10, 136, 145, 75, 6, r1 ? 0x0340 : COL_CARD);
    tft.drawRoundRect(10, 136, 145, 75, 6, r1 ? COL_ON : COL_MUTED);
    tft.setTextSize(1);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(18, 144);
    tft.print("PC POWER RELAY");
    tft.setTextSize(2);
    tft.setTextColor(r1 ? COL_ON : COL_OFF);
    tft.setCursor(18, 164);
    tft.print(r1 ? "POWER ON" : "POWER OFF");

    // Relay Reset / Pulse Button
    tft.fillRoundRect(165, 136, 145, 75, 6, COL_CARD);
    tft.drawRoundRect(165, 136, 145, 75, 6, COL_RED);
    tft.setTextSize(1);
    tft.setTextColor(COL_RED);
    tft.setCursor(173, 144);
    tft.print("HARD REBOOT");
    tft.setTextSize(2);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(173, 164);
    tft.print("[ PULSE ]");

    // Footer
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(10, 222);
    tft.print("Swipe < > for Home / Climate / Tasks");
}

void ServerScreen::handleTouch(TouchPoint &tp) {
    if (tp.gesture == TouchGesture::TAP || tp.isPressed) {
        // Power relay toggle: x: 10-155, y: 136-211
        if (tp.x >= 10 && tp.x <= 155 && tp.y >= 136 && tp.y <= 211) {
            m_relays.toggle(0);
            m_needsRedraw = true;
        }

        // Hard reboot pulse: x: 165-310, y: 136-211
        if (tp.x >= 165 && tp.x <= 310 && tp.y >= 136 && tp.y <= 211) {
            m_relays.pulse(0, 1500); // 1.5s power button pulse simulation
            m_needsRedraw = true;
        }
    }
}

void ServerScreen::update() {
    if (millis() - m_lastUpdateMs > 3000) {
        m_lastUpdateMs = millis();
        // Simulation update if disconnected
        if (!m_server.isMeasured) {
            m_server.cpuUsage = constrain(m_server.cpuUsage + random(-5, 5), 5.0f, 95.0f);
            m_server.memUsage = constrain(m_server.memUsage + random(-2, 2), 20.0f, 90.0f);
            m_needsRedraw = true;
        }
    }
}
