#ifndef SCREEN_MANAGER_H
#define SCREEN_MANAGER_H

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include "base_screen.h"
#include "screens/home_screen.h"
#include "screens/server_screen.h"
#include "screens/climate_screen.h"
#include "screens/task_screen.h"
#include "../display/touch_driver.h"

enum class ActiveScreenIndex {
    HOME = 0,
    SERVER = 1,
    CLIMATE = 2,
    TASK = 3,
    COUNT = 4
};

class ScreenManager {
public:
    ScreenManager(HomeScreen &home, ServerScreen &server, ClimateScreen &climate, TaskScreen &task);
    void init();
    void setScreen(ActiveScreenIndex index);
    void nextScreen();
    void prevScreen();
    void update(Adafruit_ILI9341 &tft);
    void handleTouch(TouchPoint &tp);

    ActiveScreenIndex getCurrentScreenIndex() const { return m_currentIndex; }
    BaseScreen* getCurrentScreen();

private:
    HomeScreen &m_homeScreen;
    ServerScreen &m_serverScreen;
    ClimateScreen &m_climateScreen;
    TaskScreen &m_taskScreen;

    ActiveScreenIndex m_currentIndex;
    uint32_t m_lastActivityMs;
    bool m_displayOn;
};

#endif // SCREEN_MANAGER_H
