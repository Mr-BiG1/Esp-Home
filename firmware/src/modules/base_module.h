#ifndef BASE_MODULE_H
#define BASE_MODULE_H

#include <Arduino.h>

class BaseModule {
public:
    virtual ~BaseModule() {}
    virtual bool init() = 0;
    virtual const char* getModuleId() = 0;
    virtual const char* getVersion() = 0;
};

#endif // BASE_MODULE_H
