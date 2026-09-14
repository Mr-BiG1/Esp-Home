#include "screen_manager.h"

ScreenManager::ScreenManager(HomeScreen &home, ServerScreen &server, ClimateScreen &climate, TaskScreen &task)
    : m_homeScreen(home), m_serverScreen(server), m_climateScreen(climate), m_taskScreen(task),
      m_currentIndex(ActiveScreenIndex::HOME), m_lastActivityMs(0), m_displayOn(true) {}

void ScreenManager::init() {
    m_currentIndex = ActiveScreenIndex::HOME;
    m_lastActivityMs = millis();
    m_homeScreen.onEnter();
}

BaseScreen* ScreenManager::getCurrentScreen() {
    switch (m_currentIndex) {
        case ActiveScreenIndex::HOME:    return &m_homeScreen;
        case ActiveScreenIndex::SERVER:  return &m_serverScreen;
        case ActiveScreenIndex::CLIMATE: return &m_climateScreen;
        case ActiveScreenIndex::TASK:    return &m_taskScreen;
        default:                         return &m_homeScreen;
    }
}

void ScreenManager::setScreen(ActiveScreenIndex index) {
    if (index >= ActiveScreenIndex::COUNT) return;
    m_currentIndex = index;
    m_lastActivityMs = millis();
    getCurrentScreen()->onEnter();
}

void ScreenManager::nextScreen() {
    uint8_t nextIdx = ((uint8_t)m_currentIndex + 1) % (uint8_t)ActiveScreenIndex::COUNT;
    setScreen((ActiveScreenIndex)nextIdx);
}

void ScreenManager::prevScreen() {
    uint8_t prevIdx = ((uint8_t)m_currentIndex + (uint8_t)ActiveScreenIndex::COUNT - 1) % (uint8_t)ActiveScreenIndex::COUNT;
    setScreen((ActiveScreenIndex)prevIdx);
}

void ScreenManager::handleTouch(TouchPoint &tp) {
    m_lastActivityMs = millis();

    if (tp.gesture == TouchGesture::SWIPE_LEFT) {
        nextScreen();
        return;
    } else if (tp.gesture == TouchGesture::SWIPE_RIGHT) {
        prevScreen();
        return;
    }

    // Pass touch to current screen
    getCurrentScreen()->handleTouch(tp);
}

void ScreenManager::update(Adafruit_ILI9341 &tft) {
    // Render current active screen
    getCurrentScreen()->update();
    getCurrentScreen()->render(tft);
}
