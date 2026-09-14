#include "device_registry.h"

DeviceRegistry::DeviceRegistry() : m_count(0) {}

bool DeviceRegistry::registerDevice(const char* id, const char* name, const char* ip, uint8_t type) {
    MeshDeviceRecord* existing = getDevice(id);
    if (existing) {
        strncpy(existing->name, name, sizeof(existing->name) - 1);
        strncpy(existing->ipAddress, ip, sizeof(existing->ipAddress) - 1);
        existing->deviceType = type;
        existing->lastSeenMs = millis();
        existing->online = true;
        return true;
    }

    if (m_count >= 16) return false;

    strncpy(m_devices[m_count].deviceId, id, sizeof(m_devices[m_count].deviceId) - 1);
    strncpy(m_devices[m_count].name, name, sizeof(m_devices[m_count].name) - 1);
    strncpy(m_devices[m_count].ipAddress, ip, sizeof(m_devices[m_count].ipAddress) - 1);
    m_devices[m_count].deviceType = type;
    m_devices[m_count].online = true;
    m_devices[m_count].lastSeenMs = millis();
    m_devices[m_count].batteryLevel = 100.0f;
    m_count++;
    return true;
}

bool DeviceRegistry::updateDeviceStatus(const char* id, bool online, float battery) {
    MeshDeviceRecord* dev = getDevice(id);
    if (!dev) return false;
    dev->online = online;
    dev->batteryLevel = battery;
    dev->lastSeenMs = millis();
    return true;
}

MeshDeviceRecord* DeviceRegistry::getDevice(const char* id) {
    for (uint8_t i = 0; i < m_count; i++) {
        if (strcmp(m_devices[i].deviceId, id) == 0) {
            return &m_devices[i];
        }
    }
    return nullptr;
}

const MeshDeviceRecord* DeviceRegistry::getDeviceByIndex(uint8_t index) const {
    if (index < m_count) return &m_devices[index];
    return nullptr;
}

uint8_t DeviceRegistry::getOnlineCount() const {
    uint8_t online = 0;
    for (uint8_t i = 0; i < m_count; i++) {
        if (m_devices[i].online) online++;
    }
    return online;
}
