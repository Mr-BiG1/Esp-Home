#ifndef SECURITY_MANAGER_H
#define SECURITY_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "types.h"

class SecurityManager {
public:
    static bool init();

    static String getMacAddress();
    static String getChipId();

    static String getDeviceId();
    static void setDeviceId(const String& deviceId);

    static String getDeviceSecret();
    static void setDeviceSecret(const String& secret);

    static SystemState getSystemState();
    static void setSystemState(SystemState state);
    static bool isPaired() { return getSystemState() == SystemState::REGISTERED || getSystemState() == SystemState::ACTIVE; }

    static String computeHmacSha256(const String& secret, const String& data);
    static void generateAuthHeaders(const String& requestBodyText, String& outTimestamp, String& outNonce, String& outSignature);

private:
    static Preferences s_prefs;
};

#endif // SECURITY_MANAGER_H
