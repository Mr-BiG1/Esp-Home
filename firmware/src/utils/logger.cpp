#include "logger.h"

LogLevel Logger::s_minLogLevel = LogLevel::DEBUG_LEVEL;

void Logger::init(uint32_t baudRate) {
    Serial.begin(baudRate);
    uint32_t start = millis();
    while (!Serial && (millis() - start < 2000)) {
        delay(10);
    }
    Serial.println("\n--- ESP32-S3 SMART HOME CONTROLLER INITIALIZING ---");
}

void Logger::setLogLevel(LogLevel level) {
    s_minLogLevel = level;
}

void Logger::logFormatted(LogLevel level, const char* prefix, const char* format, va_list args) {
    if (level < s_minLogLevel) return;

    char buffer[256];
    vsnprintf(buffer, sizeof(buffer), format, args);

    Serial.printf("[%lu] [%s] %s\n", millis(), prefix, buffer);
}

void Logger::debug(const char* format, ...) {
    va_list args;
    va_start(args, format);
    logFormatted(LogLevel::DEBUG_LEVEL, "DEBUG", format, args);
    va_end(args);
}

void Logger::info(const char* format, ...) {
    va_list args;
    va_start(args, format);
    logFormatted(LogLevel::INFO_LEVEL, "INFO", format, args);
    va_end(args);
}

void Logger::warn(const char* format, ...) {
    va_list args;
    va_start(args, format);
    logFormatted(LogLevel::WARNING_LEVEL, "WARN", format, args);
    va_end(args);
}

void Logger::error(const char* format, ...) {
    va_list args;
    va_start(args, format);
    logFormatted(LogLevel::ERROR_LEVEL, "ERROR", format, args);
    va_end(args);
}

void Logger::critical(const char* format, ...) {
    va_list args;
    va_start(args, format);
    logFormatted(LogLevel::CRITICAL_LEVEL, "CRITICAL", format, args);
    va_end(args);
}
