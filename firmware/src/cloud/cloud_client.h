#ifndef CLOUD_CLIENT_H
#define CLOUD_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "types.h"

class CloudClient {
public:
    static void init();
    static void loop();

    static bool pairDevice(const String& pairingToken);
    static bool sendHeartbeat();
    static bool pollCommands();
    static bool sendCommandAck(const CommandAck& ack);
    static bool sendTelemetryBatch(const JsonArrayConst& batch);
    static bool fetchLatestConfig();

private:
    static uint32_t s_lastHeartbeatTime;
    static uint32_t s_lastPollTime;
    static bool sendSignedPost(const String& path, const String& bodyText, String& outResponseText, int& outStatusCode);
    static bool sendSignedGet(const String& path, String& outResponseText, int& outStatusCode);
};

#endif // CLOUD_CLIENT_H
