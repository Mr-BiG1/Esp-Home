#include "command_dispatcher.h"
#include "../cloud/cloud_client.h"
#include "../modules/relay_module.h"
#include "../utils/logger.h"
#include <ArduinoJson.h>

String CommandDispatcher::s_executionRingBuffer[COMMAND_HISTORY_BUFFER_SIZE];
int CommandDispatcher::s_bufferHead = 0;

void CommandDispatcher::init() {
    for (int i = 0; i < COMMAND_HISTORY_BUFFER_SIZE; i++) {
        s_executionRingBuffer[i] = "";
    }
}

bool CommandDispatcher::isDuplicate(const String& commandId) {
    for (int i = 0; i < COMMAND_HISTORY_BUFFER_SIZE; i++) {
        if (s_executionRingBuffer[i] == commandId) return true;
    }
    return false;
}

void CommandDispatcher::addToBuffer(const String& commandId) {
    s_executionRingBuffer[s_bufferHead] = commandId;
    s_bufferHead = (s_bufferHead + 1) % COMMAND_HISTORY_BUFFER_SIZE;
}

void CommandDispatcher::dispatch(const CommandData& cmd) {
    uint32_t startTime = millis();

    // Check idempotency buffer
    if (isDuplicate(cmd.commandId)) {
        Logger::warn("Duplicate command %s suppressed by idempotency buffer", cmd.commandId.c_str());
        CommandAck ack;
        ack.commandId = cmd.commandId;
        ack.status = "EXECUTED";
        ack.executionTimeMs = 1;
        CloudClient::sendCommandAck(ack);
        return;
    }

    CommandAck ack;
    ack.commandId = cmd.commandId;
    bool success = false;

    // Dispatch to Module Engine
    if (cmd.module == "relay") {
        JsonDocument doc;
        deserializeJson(doc, cmd.parametersJson);
        int channel = doc["channel"] | 1;
        bool state = doc["state"] | false;

        success = RelayModule::setRelay(channel, state);
        if (success) {
            ack.status = "EXECUTED";
        } else {
            ack.status = "FAILED";
            ack.errorCode = "INVALID_RELAY_CHANNEL";
            ack.errorMessage = "Failed to toggle relay channel";
        }
    } else {
        ack.status = "FAILED";
        ack.errorCode = "UNKNOWN_MODULE";
        ack.errorMessage = "Module not supported in firmware";
    }

    ack.executionTimeMs = millis() - startTime;
    addToBuffer(cmd.commandId);

    // Send ACK back to cloud
    CloudClient::sendCommandAck(ack);
}
