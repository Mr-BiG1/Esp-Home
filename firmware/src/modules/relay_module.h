#ifndef RELAY_MODULE_H
#define RELAY_MODULE_H

#include <Arduino.h>
#include "base_module.h"
#include "config.h"

class RelayModule : public BaseModule {
public:
    static bool initRelays();
    static bool setRelay(int channel, bool state);
    static bool getRelayState(int channel);
    static bool toggleRelay(int channel);
    static void pulseRelay(int channel, uint32_t durationMs = 1000);

    bool init() override { return initRelays(); }
    const char* getModuleId() override { return "relay"; }
    const char* getVersion() override { return "1.0.0"; }

    // Instance convenience wrappers
    bool setState(int channel, bool state) { return setRelay(channel, state); }
    bool getState(int channel) { return getRelayState(channel); }
    bool toggle(int channel) { return toggleRelay(channel); }
    void pulse(int channel, uint32_t durationMs = 1000) { pulseRelay(channel, durationMs); }
};

#endif // RELAY_MODULE_H
