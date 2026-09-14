#include "cloud_client.h"
#include "../config/config_manager.h"
#include "../security/security_manager.h"
#include "../network/wifi_manager.h"
#include "../commands/command_dispatcher.h"
#include "../utils/logger.h"
#include "constants.h"
#include <WiFiClientSecure.h>

uint32_t CloudClient::s_lastHeartbeatTime = 0;
uint32_t CloudClient::s_lastPollTime = 0;

void CloudClient::init() {
    Logger::info("CloudClient initialized. Ready for HTTPS cloud polling.");
}

bool CloudClient::sendSignedPost(const String& path, const String& bodyText, String& outResponseText, int& outStatusCode) {
    if (!WifiManager::isConnected()) return false;

    WiFiClientSecure client;
    client.setInsecure(); // In production, attach root CA certificate bundle

    HTTPClient http;
    String fullUrl = ConfigManager::getApiEndpoint() + path;
    http.begin(client, fullUrl);

    String timestamp, nonce, signature;
    SecurityManager::generateAuthHeaders(bodyText, timestamp, nonce, signature);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-ID", SecurityManager::getDeviceId());
    http.addHeader("X-Timestamp", timestamp);
    http.addHeader("X-Nonce", nonce);
    http.addHeader("X-Signature", signature);

    outStatusCode = http.POST(bodyText);
    if (outStatusCode > 0) {
        outResponseText = http.getString();
        http.end();
        return (outStatusCode >= 200 && outStatusCode < 300);
    } else {
        Logger::error("HTTPS POST failed to %s: %s", path.c_str(), http.errorToString(outStatusCode).c_str());
        http.end();
        return false;
    }
}

bool CloudClient::sendSignedGet(const String& path, String& outResponseText, int& outStatusCode) {
    if (!WifiManager::isConnected()) return false;

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    String fullUrl = ConfigManager::getApiEndpoint() + path;
    http.begin(client, fullUrl);

    String timestamp, nonce, signature;
    SecurityManager::generateAuthHeaders("", timestamp, nonce, signature);

    http.addHeader("X-Device-ID", SecurityManager::getDeviceId());
    http.addHeader("X-Timestamp", timestamp);
    http.addHeader("X-Nonce", nonce);
    http.addHeader("X-Signature", signature);

    outStatusCode = http.GET();
    if (outStatusCode > 0) {
        outResponseText = http.getString();
        http.end();
        return (outStatusCode >= 200 && outStatusCode < 300);
    } else {
        Logger::error("HTTPS GET failed to %s: %s", path.c_str(), http.errorToString(outStatusCode).c_str());
        http.end();
        return false;
    }
}

bool CloudClient::pairDevice(const String& pairingToken) {
    JsonDocument doc;
    doc["pairing_token"] = pairingToken;
    doc["mac_address"] = SecurityManager::getMacAddress();
    doc["chip_id"] = SecurityManager::getChipId();
    doc["firmware_version"] = FIRMWARE_VERSION;

    JsonArray caps = doc["capabilities"].to<JsonArray>();
    caps.add("relay");
    caps.add("sensor_temp");
    caps.add("tft_display");

    String reqBody;
    serializeJson(doc, reqBody);

    String responseText;
    int statusCode;

    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = ConfigManager::getApiEndpoint() + "/api/v1/device/pair";
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    statusCode = http.POST(reqBody);
    if (statusCode == 200) {
        responseText = http.getString();
        JsonDocument resDoc;
        deserializeJson(resDoc, responseText);

        if (resDoc["status"] == "APPROVED") {
            String deviceId = resDoc["device_id"];
            String secret = resDoc["device_secret"];
            SecurityManager::setDeviceId(deviceId);
            SecurityManager::setDeviceSecret(secret);
            SecurityManager::setSystemState(SystemState::ACTIVE);
            Logger::info("Device successfully paired! Assigned ID: %s", deviceId.c_str());
            http.end();
            return true;
        }
    }
    http.end();
    return false;
}

bool CloudClient::sendHeartbeat() {
    JsonDocument doc;
    doc["wifi_rssi"] = WifiManager::getRssi();
    doc["ip_address"] = WifiManager::getIpAddress();
    doc["uptime_seconds"] = millis() / 1000;
    doc["config_version"] = ConfigManager::getConfigVersion();

    JsonObject moduleStates = doc["module_states"].to<JsonObject>();
    JsonObject relayStates = moduleStates["relay"].to<JsonObject>();
    relayStates["relay_1"] = digitalRead(PIN_RELAY_1) == HIGH;
    relayStates["relay_2"] = digitalRead(PIN_RELAY_2) == HIGH;

    String body;
    serializeJson(doc, body);

    String responseText;
    int statusCode;
    if (sendSignedPost("/api/v1/device/heartbeat", body, responseText, statusCode)) {
        JsonDocument resDoc;
        deserializeJson(resDoc, responseText);
        if (resDoc["config_outdated"] == true) {
            Logger::info("New remote config detected! Fetching...");
            fetchLatestConfig();
        }
        return true;
    }
    return false;
}

bool CloudClient::pollCommands() {
    String responseText;
    int statusCode;
    if (sendSignedGet("/api/v1/device/commands", responseText, statusCode)) {
        JsonDocument doc;
        deserializeJson(doc, responseText);
        JsonArray commands = doc["commands"].as<JsonArray>();

        for (JsonObject cmdObj : commands) {
            CommandData cmd;
            cmd.commandId = cmdObj["command_id"].as<String>();
            cmd.module = cmdObj["module"].as<String>();
            cmd.action = cmdObj["action"].as<String>();
            serializeJson(cmdObj["parameters"], cmd.parametersJson);
            cmd.expiresAt = cmdObj["expires_at"].as<String>();

            Logger::info("Received Command: %s [%s.%s]", cmd.commandId.c_str(), cmd.module.c_str(), cmd.action.c_str());
            CommandDispatcher::dispatch(cmd);
        }
        return true;
    }
    return false;
}

bool CloudClient::sendCommandAck(const CommandAck& ack) {
    JsonDocument doc;
    doc["command_id"] = ack.commandId;
    doc["status"] = ack.status;
    if (ack.errorCode.length() > 0) doc["error_code"] = ack.errorCode;
    if (ack.errorMessage.length() > 0) doc["error_message"] = ack.errorMessage;
    doc["execution_time_ms"] = ack.executionTimeMs;

    String body;
    serializeJson(doc, body);

    String responseText;
    int statusCode;
    return sendSignedPost("/api/v1/device/ack", body, responseText, statusCode);
}

bool CloudClient::sendTelemetryBatch(const JsonArrayConst& batch) {
    JsonDocument doc;
    doc["telemetry_batch"] = batch;
    String body;
    serializeJson(doc, body);

    String responseText;
    int statusCode;
    return sendSignedPost("/api/v1/device/telemetry", body, responseText, statusCode);
}

bool CloudClient::fetchLatestConfig() {
    String responseText;
    int statusCode;
    if (sendSignedGet("/api/v1/device/config", responseText, statusCode)) {
        JsonDocument doc;
        deserializeJson(doc, responseText);
        uint32_t version = doc["version"];
        ConfigManager::setConfigVersion(version);
        Logger::info("Applied config version v%lu", version);
        return true;
    }
    return false;
}

void CloudClient::loop() {
    if (!WifiManager::isConnected()) return;

    uint32_t now = millis();

    // Heartbeat loop
    if (now - s_lastHeartbeatTime >= DEFAULT_HEARTBEAT_INTERVAL_MS) {
        s_lastHeartbeatTime = now;
        sendHeartbeat();
    }

    // Command Polling loop
    if (now - s_lastPollTime >= DEFAULT_POLL_INTERVAL_MS) {
        s_lastPollTime = now;
        pollCommands();
    }
}
