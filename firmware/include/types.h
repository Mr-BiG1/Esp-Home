#ifndef TYPES_H
#define TYPES_H

#include <Arduino.h>

enum class SystemState {
    UNREGISTERED,
    PAIRING,
    REGISTERED,
    ACTIVE,
    REVOKED,
    OFFLINE
};

enum class LogLevel {
    DEBUG_LEVEL,
    INFO_LEVEL,
    WARNING_LEVEL,
    ERROR_LEVEL,
    CRITICAL_LEVEL
};

struct DeviceIdentity {
    String deviceId;
    String macAddress;
    String chipId;
    String deviceSecret;
    SystemState state;
    uint32_t configVersion;
};

struct CommandData {
    String commandId;
    String module;
    String action;
    String parametersJson;
    String expiresAt;
};

struct CommandAck {
    String commandId;
    String status; // EXECUTED, FAILED
    String errorCode;
    String errorMessage;
    uint32_t executionTimeMs;
};

struct NetworkStatus {
    bool wifiConnected;
    bool cloudConnected;
    int rssi;
    String ipAddress;
    uint32_t uptimeSeconds;
};

#endif // TYPES_H
