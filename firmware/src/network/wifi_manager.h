#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "types.h"

class WifiManager {
public:
    static void init();
    static void loop();

    static bool isConnected();
    static int getRssi();
    static String getIpAddress();
    static NetworkStatus getStatus();

private:
    static uint32_t s_lastReconnectAttempt;
    static uint32_t s_backoffMs;
    static void connect();
};

#endif // WIFI_MANAGER_H
