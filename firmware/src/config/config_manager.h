#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

class ConfigManager {
public:
    static bool init();

    static String getWifiSsid();
    static String getWifiPassword();
    static void setWifiCredentials(const String& ssid, const String& pass);

    static String getApiEndpoint();
    static void setApiEndpoint(const String& endpoint);

    static uint32_t getConfigVersion();
    static void setConfigVersion(uint32_t version);

    static String getDeviceName();
    static void setDeviceName(const String& name);

private:
    static Preferences s_prefs;
};

#endif // CONFIG_MANAGER_H
