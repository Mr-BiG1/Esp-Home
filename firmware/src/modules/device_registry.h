#ifndef DEVICE_REGISTRY_H
#define DEVICE_REGISTRY_H

#include <Arduino.h>

struct MeshDeviceRecord {
    char deviceId[16];
    char name[24];
    char ipAddress[16];
    uint8_t deviceType; // 0=ESP32, 1=RaspberryPi, 2=DesktopPC, 3=SensorNode
    bool online;
    uint32_t lastSeenMs;
    float batteryLevel;
};

class DeviceRegistry {
public:
    DeviceRegistry();
    bool registerDevice(const char* id, const char* name, const char* ip, uint8_t type);
    bool updateDeviceStatus(const char* id, bool online, float battery = 100.0f);
    MeshDeviceRecord* getDevice(const char* id);
    const MeshDeviceRecord* getDeviceByIndex(uint8_t index) const;
    uint8_t getDeviceCount() const { return m_count; }
    uint8_t getOnlineCount() const;

private:
    MeshDeviceRecord m_devices[16];
    uint8_t m_count;
};

#endif // DEVICE_REGISTRY_H
