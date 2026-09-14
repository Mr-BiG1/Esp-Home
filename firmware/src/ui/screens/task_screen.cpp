#include "task_screen.h"

#define COL_BG       0x0841
#define COL_CARD     0x10A3
#define COL_ACCENT   0x04FF
#define COL_ON       0x07E0
#define COL_OFF      0x4208
#define COL_RED      ILI9341_RED
#define COL_WHITE    ILI9341_WHITE
#define COL_YELLOW   0xFD20
#define COL_MUTED    0x632C

TaskScreen::TaskScreen() : m_taskCount(0), m_needsRedraw(true), m_lastUpdateMs(0) {
    addTask("T1", "Check Server Backup", 2, false);
    addTask("T2", "Calibrate Temp Sensor", 1, false);
    addTask("T3", "Verify Mesh Node Pi", 1, true);
    addTask("T4", "Sync Cloud Tokens", 0, false);
}

void TaskScreen::onEnter() {
    m_needsRedraw = true;
}

void TaskScreen::addTask(const char* id, const char* text, uint8_t priority, bool completed) {
    if (m_taskCount >= 5) return;
    strncpy(m_tasks[m_taskCount].id, id, sizeof(m_tasks[m_taskCount].id) - 1);
    strncpy(m_tasks[m_taskCount].text, text, sizeof(m_tasks[m_taskCount].text) - 1);
    m_tasks[m_taskCount].priority = priority;
    m_tasks[m_taskCount].completed = completed;
    m_taskCount++;
    m_needsRedraw = true;
}

void TaskScreen::render(Adafruit_ILI9341 &tft) {
    if (!m_needsRedraw) return;
    m_needsRedraw = false;

    tft.fillScreen(COL_BG);

    // Header bar
    tft.fillRect(0, 0, 320, 26, COL_CARD);
    tft.setTextColor(COL_ACCENT);
    tft.setTextSize(2);
    tft.setCursor(8, 5);
    tft.print("TASKS & REMINDERS");

    // Task count badge
    tft.setTextSize(1);
    tft.setTextColor(COL_WHITE);
    tft.setCursor(260, 8);
    tft.printf("%d TASKS", m_taskCount);

    // Task Rows
    for (uint8_t i = 0; i < m_taskCount; i++) {
        uint16_t y = 34 + (i * 36);
        bool done = m_tasks[i].completed;

        tft.fillRoundRect(10, y, 300, 32, 4, done ? 0x01A0 : COL_CARD);
        tft.drawRoundRect(10, y, 300, 32, 4, done ? COL_ON : COL_MUTED);

        // Checkbox: x: 18-34, y: y+8 - y+24
        tft.drawRect(18, y + 8, 16, 16, done ? COL_ON : COL_WHITE);
        if (done) {
            tft.fillRect(20, y + 10, 12, 12, COL_ON);
        }

        // Priority Pill
        uint16_t priCol = m_tasks[i].priority == 2 ? COL_RED : (m_tasks[i].priority == 1 ? COL_YELLOW : COL_ACCENT);
        tft.fillRect(42, y + 9, 6, 14, priCol);

        // Task Text
        tft.setTextSize(1);
        tft.setTextColor(done ? COL_MUTED : COL_WHITE);
        tft.setCursor(55, y + 12);
        tft.print(m_tasks[i].text);
    }

    // Clear completed button: x: 10-310, y: 185-212
    tft.fillRoundRect(10, 185, 300, 28, 4, COL_CARD);
    tft.drawRoundRect(10, 185, 300, 28, 4, COL_ACCENT);
    tft.setTextSize(1);
    tft.setTextColor(COL_ACCENT);
    tft.setCursor(95, 194);
    tft.print("[ TAP COMPLETED TO TOGGLE ]");

    // Footer
    tft.setTextSize(1);
    tft.setTextColor(COL_MUTED);
    tft.setCursor(10, 222);
    tft.print("Swipe < > for Home / Server / Climate");
}

void TaskScreen::handleTouch(TouchPoint &tp) {
    if (tp.gesture == TouchGesture::TAP || tp.isPressed) {
        for (uint8_t i = 0; i < m_taskCount; i++) {
            uint16_t y = 34 + (i * 36);
            if (tp.x >= 10 && tp.x <= 310 && tp.y >= y && tp.y <= (y + 32)) {
                m_tasks[i].completed = !m_tasks[i].completed;
                m_needsRedraw = true;
                break;
            }
        }
    }
}

void TaskScreen::update() {
    if (millis() - m_lastUpdateMs > 5000) {
        m_lastUpdateMs = millis();
        m_needsRedraw = true;
    }
}
