#ifndef CLIMATE_CONTROLLER_H
#define CLIMATE_CONTROLLER_H

#include <Arduino.h>
#include "relay_module.h"

enum class ClimateMode {
    OFF,
    AUTO,
    BOOST,
    MANUAL
};

enum class ClimateSafetyStatus {
    OK,
    MIN_ON_TIMER,
    MIN_OFF_TIMER,
    MAX_RUNTIME_EXCEEDED,
    SENSOR_FAULT
};

class ClimateController {
public:
    ClimateController(RelayModule &relays, uint8_t heaterRelayIndex = 2);
    void init();
    void update(float currentTemp, float currentHumidity, bool sensorValid);

    // Setters
    void setTargetTemp(float target);
    void setMode(ClimateMode mode);
    void setHysteresis(float band);

    // Getters
    float getTargetTemp() const { return m_targetTemp; }
    float getCurrentTemp() const { return m_currentTemp; }
    float getCurrentHumidity() const { return m_currentHumidity; }
    ClimateMode getMode() const { return m_mode; }
    bool isHeaterOn() const { return m_heaterState; }
    ClimateSafetyStatus getSafetyStatus() const { return m_safetyStatus; }
    bool isSensorValid() const { return m_sensorValid; }

private:
    RelayModule &m_relays;
    uint8_t m_heaterRelayIndex;
    float m_targetTemp;
    float m_currentTemp;
    float m_currentHumidity;
    float m_hysteresis;
    ClimateMode m_mode;
    bool m_heaterState;
    ClimateSafetyStatus m_safetyStatus;
    bool m_sensorValid;

    uint32_t m_lastStateChangeMs;
    uint32_t m_heaterOnStartMs;
    uint32_t m_lastSensorUpdateMs;

    void setHeaterState(bool on, const char* reason);
};

#endif // CLIMATE_CONTROLLER_H
