#include "security_manager.h"
#include "constants.h"
#include "../utils/logger.h"
#include <WiFi.h>
#include <mbedtls/md.h>

Preferences SecurityManager::s_prefs;

bool SecurityManager::init() {
    return s_prefs.begin(NVS_NAMESPACE_AUTH, false);
}

String SecurityManager::getMacAddress() {
    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(macStr);
}

String SecurityManager::getChipId() {
    uint64_t chipId = ESP.getEfuseMac();
    char chipStr[16];
    snprintf(chipStr, sizeof(chipStr), "ESP32S3-%04X%08X",
             (uint16_t)(chipId >> 32), (uint32_t)chipId);
    return String(chipStr);
}

String SecurityManager::getDeviceId() {
    return s_prefs.getString("device_id", "UNREGISTERED-CTRL");
}

void SecurityManager::setDeviceId(const String& deviceId) {
    s_prefs.putString("device_id", deviceId);
}

String SecurityManager::getDeviceSecret() {
    return s_prefs.getString("device_secret", "");
}

void SecurityManager::setDeviceSecret(const String& secret) {
    s_prefs.putString("device_secret", secret);
}

SystemState SecurityManager::getSystemState() {
    int val = s_prefs.getInt("sys_state", (int)SystemState::UNREGISTERED);
    return (SystemState)val;
}

void SecurityManager::setSystemState(SystemState state) {
    s_prefs.putInt("sys_state", (int)state);
}

String SecurityManager::computeHmacSha256(const String& secret, const String& data) {
    mbedtls_md_context_t ctx;
    mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
    mbedtls_md_hmac_starts(&ctx, (const unsigned char*)secret.c_str(), secret.length());
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)data.c_str(), data.length());

    unsigned char hmacResult[32];
    mbedtls_md_hmac_finish(&ctx, hmacResult);
    mbedtls_md_free(&ctx);

    char hexResult[65];
    for (int i = 0; i < 32; i++) {
        snprintf(&hexResult[i * 2], 3, "%02x", hmacResult[i]);
    }
    return String(hexResult);
}

void SecurityManager::generateAuthHeaders(const String& requestBodyText, String& outTimestamp, String& outNonce, String& outSignature) {
    uint32_t nowSec = millis() / 1000;
    outTimestamp = String(nowSec);

    uint32_t randomVal = esp_random();
    char nonceHex[9];
    snprintf(nonceHex, sizeof(nonceHex), "%08x", randomVal);
    outNonce = String(nonceHex);

    String deviceId = getDeviceId();
    String secret = getDeviceSecret();

    String stringToSign = deviceId + outTimestamp + outNonce + requestBodyText;
    outSignature = computeHmacSha256(secret, stringToSign);
}
