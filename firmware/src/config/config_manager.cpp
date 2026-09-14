#include "config_manager.h"
#include "constants.h"
#include "../utils/logger.h"

Preferences ConfigManager::s_prefs;

bool ConfigManager::init() {
    return s_prefs.begin(NVS_NAMESPACE_SYS, false);
}

String ConfigManager::getWifiSsid() {
    return s_prefs.getString("wifi_ssid", DEFAULT_WIFI_SSID);
}

String ConfigManager::getWifiPassword() {
    return s_prefs.getString("wifi_pass", DEFAULT_WIFI_PASS);
}

void ConfigManager::setWifiCredentials(const String& ssid, const String& pass) {
    s_prefs.putString("wifi_ssid", ssid);
    s_prefs.putString("wifi_pass", pass);
    Logger::info("Updated Wi-Fi credentials in NVS");
}

String ConfigManager::getApiEndpoint() {
    return s_prefs.getString("api_endpoint", DEFAULT_API_ENDPOINT);
}

void ConfigManager::setApiEndpoint(const String& endpoint) {
    s_prefs.putString("api_endpoint", endpoint);
}

uint32_t ConfigManager::getConfigVersion() {
    return s_prefs.getUInt("config_ver", 1);
}

void ConfigManager::setConfigVersion(uint32_t version) {
    s_prefs.putUInt("config_ver", version);
}

String ConfigManager::getDeviceName() {
    return s_prefs.getString("dev_name", "ESP32 Controller");
}

void ConfigManager::setDeviceName(const String& name) {
    s_prefs.putString("dev_name", name);
}
