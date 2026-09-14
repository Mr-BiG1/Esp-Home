#ifndef COMMAND_DISPATCHER_H
#define COMMAND_DISPATCHER_H

#include <Arduino.h>
#include "types.h"
#include "constants.h"

class CommandDispatcher {
public:
    static void init();
    static void dispatch(const CommandData& cmd);

private:
    static String s_executionRingBuffer[COMMAND_HISTORY_BUFFER_SIZE];
    static int s_bufferHead;
    static bool isDuplicate(const String& commandId);
    static void addToBuffer(const String& commandId);
};

#endif // COMMAND_DISPATCHER_H
