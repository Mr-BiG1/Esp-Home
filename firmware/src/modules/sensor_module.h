#ifndef SENSOR_MODULE_H
#define SENSOR_MODULE_H

#include <Arduino.h>

class SensorModule {
public:
    SensorModule(int8_t gpioPin = -1);
    void init();
    void update();

    float getTemperature() const { return m_temperature; }
    float getHumidity() const { return m_humidity; }
    bool isValid() const { return m_valid; }

private:
    int8_t m_pin;
    float m_temperature;
    float m_humidity;
    bool m_valid;
    uint32_t m_lastReadMs;
};

#endif // SENSOR_MODULE_H
