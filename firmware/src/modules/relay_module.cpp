#include "relay_module.h"

static const int s_relayPins[4] = { PIN_RELAY_1, PIN_RELAY_2, PIN_RELAY_3, PIN_RELAY_4 };
static bool s_relayStates[4] = { false, false, false, false };

bool RelayModule::initRelays() {
    for (int i = 0; i < 4; i++) {
        pinMode(s_relayPins[i], OUTPUT);
        digitalWrite(s_relayPins[i], LOW);
        s_relayStates[i] = false;
    }
    return true;
}

bool RelayModule::setRelay(int channel, bool state) {
    if (channel < 0 || channel >= 4) return false;
    digitalWrite(s_relayPins[channel], state ? HIGH : LOW);
    s_relayStates[channel] = state;
    return true;
}

bool RelayModule::getRelayState(int channel) {
    if (channel < 0 || channel >= 4) return false;
    return s_relayStates[channel];
}

bool RelayModule::toggleRelay(int channel) {
    if (channel < 0 || channel >= 4) return false;
    bool newState = !s_relayStates[channel];
    setRelay(channel, newState);
    return newState;
}

void RelayModule::pulseRelay(int channel, uint32_t durationMs) {
    if (channel < 0 || channel >= 4) return;
    setRelay(channel, true);
    delay(durationMs);
    setRelay(channel, false);
}
