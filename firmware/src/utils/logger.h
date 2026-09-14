#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>
#include "types.h"

class Logger {
public:
    static void init(uint32_t baudRate = 115200);
    static void setLogLevel(LogLevel level);

    static void debug(const char* format, ...);
    static void info(const char* format, ...);
    static void warn(const char* format, ...);
    static void error(const char* format, ...);
    static void critical(const char* format, ...);

private:
    static LogLevel s_minLogLevel;
    static void logFormatted(LogLevel level, const char* prefix, const char* format, va_list args);
};

#endif // LOGGER_H
