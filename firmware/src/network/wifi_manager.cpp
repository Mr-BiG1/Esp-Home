#include "wifi_manager.h"
#include "../config/config_manager.h"
#include "../utils/logger.h"
#include "constants.h"

uint32_t WifiManager::s_lastReconnectAttempt = 0;
uint32_t WifiManager::s_backoffMs = MIN_BACKOFF_MS;

void WifiManager::init() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    connect();
}

void WifiManager::connect() {
    String ssid = ConfigManager::getWifiSsid();
    String pass = ConfigManager::getWifiPassword();

    Logger::info("Connecting to Wi-Fi SSID: %s", ssid.c_str());
    WiFi.begin(ssid.c_str(), pass.c_str());
    s_lastReconnectAttempt = millis();
}

void WifiManager::loop() {
    if (WiFi.status() == WL_CONNECTED) {
        s_backoffMs = MIN_BACKOFF_MS; // Reset backoff on successful connection
        return;
    }

    uint32_t now = millis();
    if (now - s_lastReconnectAttempt >= s_backoffMs) {
        Logger::warn("Wi-Fi disconnected. Retrying in %lu ms...", s_backoffMs);
        connect();

        // Exponential backoff up to MAX_BACKOFF_MS
        s_backoffMs = min(s_backoffMs * 2, (uint32_t)MAX_BACKOFF_MS);
    }
}

bool WifiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

int WifiManager::getRssi() {
    return isConnected() ? WiFi.RSSI() : 0;
}

String WifiManager::getIpAddress() {
    return isConnected() ? WiFi.localIP().toString() : "0.0.0.0";
}

NetworkStatus WifiManager::getStatus() {
    NetworkStatus status;
    status.wifiConnected = isConnected();
    status.cloudConnected = false;
    status.rssi = getRssi();
    status.ipAddress = getIpAddress();
    status.uptimeSeconds = millis() / 1000;
    return status;
}
