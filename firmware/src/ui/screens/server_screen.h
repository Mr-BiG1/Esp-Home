#ifndef SERVER_SCREEN_H
#define SERVER_SCREEN_H

#include "../base_screen.h"
#include "../../modules/relay_module.h"

struct ServerNodeInfo {
    char name[24];
    bool online;
    float cpuUsage;     // MEASURED from agent
    float memUsage;     // MEASURED from agent
    float gpuTemp;      // MEASURED from agent
    uint32_t uptimeSec; // MEASURED from agent
    bool isMeasured;    // true if active agent reporting, false if inferred from ping
};

class ServerScreen : public BaseScreen {
public:
    ServerScreen(RelayModule &relays);
    void onEnter() override;
    void render(Adafruit_ILI9341 &tft) override;
    void handleTouch(TouchPoint &tp) override;
    void update() override;
    const char* getTitle() const override { return "Server & PC Control"; }

    void updateServerData(const char* name, bool online, float cpu, float mem, float gpuTemp, uint32_t uptime, bool isMeasured);

private:
    RelayModule &m_relays;
    ServerNodeInfo m_server;
    bool m_needsRedraw;
    uint32_t m_lastUpdateMs;
};

#endif // SERVER_SCREEN_H
