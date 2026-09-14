#ifndef CLIMATE_SCREEN_H
#define CLIMATE_SCREEN_H

#include "../base_screen.h"
#include "../../modules/climate_controller.h"

class ClimateScreen : public BaseScreen {
public:
    ClimateScreen(ClimateController &climate);
    void onEnter() override;
    void render(Adafruit_ILI9341 &tft) override;
    void handleTouch(TouchPoint &tp) override;
    void update() override;
    const char* getTitle() const override { return "Climate & Thermostat"; }

private:
    ClimateController &m_climate;
    bool m_needsRedraw;
    uint32_t m_lastUpdateMs;
};

#endif // CLIMATE_SCREEN_H
