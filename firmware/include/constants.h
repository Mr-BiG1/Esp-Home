#ifndef CONSTANTS_H
#define CONSTANTS_H

#include <Arduino.h>

// Firmware Metadata
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_TYPE_NAME "ESP32-S3-CONTROLLER"

// Polling & Heartbeat Intervals
#define DEFAULT_HEARTBEAT_INTERVAL_MS 30000
#define DEFAULT_POLL_INTERVAL_MS      5000
#define MIN_BACKOFF_MS                 2000
#define MAX_BACKOFF_MS                 60000

// Idempotency Ring Buffer Size
#define COMMAND_HISTORY_BUFFER_SIZE    64

// NVS Storage Namespaces
#define NVS_NAMESPACE_SYS    "sys_cfg"
#define NVS_NAMESPACE_AUTH   "auth_sec"

#endif // CONSTANTS_H
