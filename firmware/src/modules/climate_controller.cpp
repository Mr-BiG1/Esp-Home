#include "climate_controller.h"

// Safety constants
#define MIN_ON_TIME_MS      60000   // 1 minute minimum runtime to prevent relay chatter
#define MIN_OFF_TIME_MS     180000  // 3 minutes minimum off time
#define MAX_RUNTIME_MS      7200000 // 2 hours max continuous heating runtime
#define SENSOR_TIMEOUT_MS   45000   // 45 seconds stale sensor timeout

ClimateController::ClimateController(RelayModule &relays, uint8_t heaterRelayIndex)
    : m_relays(relays), m_heaterRelayIndex(heaterRelayIndex),
      m_targetTemp(21.5f), m_currentTemp(20.0f), m_currentHumidity(45.0f),
      m_hysteresis(0.5f), m_mode(ClimateMode::AUTO), m_heaterState(false),
      m_safetyStatus(ClimateSafetyStatus::OK), m_sensorValid(false),
      m_lastStateChangeMs(0), m_heaterOnStartMs(0), m_lastSensorUpdateMs(0) {}

void ClimateController::init() {
    m_relays.setState(m_heaterRelayIndex, false);
    m_heaterState = false;
    m_lastStateChangeMs = millis();
}

void ClimateController::setTargetTemp(float target) {
    m_targetTemp = constrain(target, 10.0f, 35.0f);
}

void ClimateController::setMode(ClimateMode mode) {
    m_mode = mode;
    if (m_mode == ClimateMode::OFF) {
        setHeaterState(false, "Mode set to OFF");
    }
}

void ClimateController::setHysteresis(float band) {
    m_hysteresis = constrain(band, 0.2f, 2.0f);
}

void ClimateController::setHeaterState(bool turnOn, const char* reason) {
    uint32_t now = millis();

    if (turnOn == m_heaterState) return;

    if (turnOn) {
        // Enforce MIN_OFF_TIME
        if (now - m_lastStateChangeMs < MIN_OFF_TIME_MS) {
            m_safetyStatus = ClimateSafetyStatus::MIN_OFF_TIMER;
            return;
        }
        m_heaterState = true;
        m_relays.setState(m_heaterRelayIndex, true);
        m_lastStateChangeMs = now;
        m_heaterOnStartMs = now;
        m_safetyStatus = ClimateSafetyStatus::OK;
    } else {
        // Enforce MIN_ON_TIME unless sensor fault or max runtime
        if (m_safetyStatus == ClimateSafetyStatus::OK && (now - m_lastStateChangeMs < MIN_ON_TIME_MS)) {
            m_safetyStatus = ClimateSafetyStatus::MIN_ON_TIMER;
            return;
        }
        m_heaterState = false;
        m_relays.setState(m_heaterRelayIndex, false);
        m_lastStateChangeMs = now;
        if (m_safetyStatus != ClimateSafetyStatus::SENSOR_FAULT && m_safetyStatus != ClimateSafetyStatus::MAX_RUNTIME_EXCEEDED) {
            m_safetyStatus = ClimateSafetyStatus::OK;
        }
    }
}

void ClimateController::update(float currentTemp, float currentHumidity, bool sensorValid) {
    uint32_t now = millis();

    if (sensorValid) {
        m_currentTemp = currentTemp;
        m_currentHumidity = currentHumidity;
        m_sensorValid = true;
        m_lastSensorUpdateMs = now;
    }

    // Check sensor stale timeout
    if (now - m_lastSensorUpdateMs > SENSOR_TIMEOUT_MS) {
        m_sensorValid = false;
        m_safetyStatus = ClimateSafetyStatus::SENSOR_FAULT;
        setHeaterState(false, "SENSOR FAULT - STALE DATA");
        return;
    }

    // Check max continuous runtime safety
    if (m_heaterState && (now - m_heaterOnStartMs > MAX_RUNTIME_MS)) {
        m_safetyStatus = ClimateSafetyStatus::MAX_RUNTIME_EXCEEDED;
        setHeaterState(false, "MAX RUNTIME EXCEEDED");
        return;
    }

    // Thermostat logic according to Mode
    switch (m_mode) {
        case ClimateMode::OFF:
            setHeaterState(false, "Mode OFF");
            break;

        case ClimateMode::BOOST:
            // Force heating up to target + 1.0C
            if (m_currentTemp < m_targetTemp + 1.0f) {
                setHeaterState(true, "BOOST mode active");
            } else {
                m_mode = ClimateMode::AUTO; // Drop back to auto after boost reached
            }
            break;

        case ClimateMode::AUTO:
            // Hysteresis algorithm
            if (m_currentTemp < (m_targetTemp - m_hysteresis)) {
                setHeaterState(true, "Temp below low threshold");
            } else if (m_currentTemp > (m_targetTemp + m_hysteresis)) {
                setHeaterState(false, "Temp above high threshold");
            }
            break;

        case ClimateMode::MANUAL:
            // Manual overrides leave state unchanged unless limits hit
            break;
    }
}
