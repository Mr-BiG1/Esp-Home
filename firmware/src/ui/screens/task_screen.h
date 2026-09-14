#ifndef TASK_SCREEN_H
#define TASK_SCREEN_H

#include "../base_screen.h"

struct TaskItemFirmware {
    char id[8];
    char text[28];
    bool completed;
    uint8_t priority; // 0=LOW, 1=MED, 2=HIGH
};

class TaskScreen : public BaseScreen {
public:
    TaskScreen();
    void onEnter() override;
    void render(Adafruit_ILI9341 &tft) override;
    void handleTouch(TouchPoint &tp) override;
    void update() override;
    const char* getTitle() const override { return "Task Checklist"; }

    void addTask(const char* id, const char* text, uint8_t priority, bool completed = false);

private:
    TaskItemFirmware m_tasks[5];
    uint8_t m_taskCount;
    bool m_needsRedraw;
    uint32_t m_lastUpdateMs;
};

#endif // TASK_SCREEN_H
