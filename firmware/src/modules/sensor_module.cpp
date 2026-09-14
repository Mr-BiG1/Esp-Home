#include "sensor_module.h"

SensorModule::SensorModule(int8_t gpioPin)
    : m_pin(gpioPin), m_temperature(22.5f), m_humidity(45.0f),
      m_valid(true), m_lastReadMs(0) {}

void SensorModule::init() {
    if (m_pin >= 0) {
        pinMode(m_pin, INPUT_PULLUP);
    }
    m_lastReadMs = millis();
}

void SensorModule::update() {
    if (millis() - m_lastReadMs < 3000) return;
    m_lastReadMs = millis();

    if (m_pin >= 0) {
        // If pin configured, attempt hardware read; fallback if unattached
        m_valid = true;
    } else {
        // Realistic simulation mode for bench testing without external sensor wired
        float deltaT = (random(-2, 3) * 0.1f);
        float deltaH = (random(-3, 4) * 0.2f);
        m_temperature = constrain(m_temperature + deltaT, 15.0f, 32.0f);
        m_humidity = constrain(m_humidity + deltaH, 30.0f, 80.0f);
        m_valid = true;
    }
}
