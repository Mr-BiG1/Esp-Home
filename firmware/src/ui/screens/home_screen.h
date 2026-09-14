#ifndef HOME_SCREEN_H
#define HOME_SCREEN_H

#include "../base_screen.h"
#include "../../modules/relay_module.h"

class HomeScreen : public BaseScreen {
public:
    HomeScreen(RelayModule &relayModule);
    void onEnter() override;
    void render(Adafruit_ILI9341 &tft) override;
    void handleTouch(TouchPoint &tp) override;
    void update() override;
    const char* getTitle() const override { return "Home Summary"; }

    void setSystemStatus(float temp, float humidity, bool wifiConnected, bool cloudConnected, int alertCount);

private:
    RelayModule &m_relays;
    float m_temp;
    float m_humidity;
    bool m_wifiConnected;
    bool m_cloudConnected;
    int m_alertCount;
    bool m_needsRedraw;
    uint32_t m_lastUpdateMs;
};

#endif // HOME_SCREEN_H
