#!/usr/bin/env python3
"""
Smart Home Mesh Controller — Fully Responsive Raspberry Pi Touchscreen Application
Dynamically scales layout, typography, cards, buttons, and touch target hitboxes to ANY screen resolution.
Supports 1920x1080, 1280x720, 1024x600, 800x480, 480x320, and custom monitor aspect ratios.
"""

import os
import sys
import time
import json
import threading
import math
import requests
import psutil
import socket
import hmac
import hashlib

# Ensure DISPLAY is set for physical screen output when launching over SSH
if "DISPLAY" not in os.environ:
    os.environ["DISPLAY"] = ":0"
if "XAUTHORITY" not in os.environ and os.path.exists(os.path.expanduser("~/.Xauthority")):
    os.environ["XAUTHORITY"] = os.path.expanduser("~/.Xauthority")

# GPIO Library Detection (Supports legacy RPi.GPIO, gpiozero, and Pi 5 lgpio/gpiod)
GPIO_TYPE = None
gpio_devices = []

try:
    from gpiozero import OutputDevice
    GPIO_TYPE = "gpiozero"
except Exception:
    try:
        import RPi.GPIO as GPIO
        GPIO_TYPE = "rpi_gpio"
    except Exception:
        GPIO_TYPE = None

import pygame
from pygame.locals import *

# === Configuration ===
CONFIG = {
    "device_id": "RPI-TOUCH-NODE-01",
    "device_secret": "rpi_secret_key_mesh_2026",
    "cloud_endpoint": "http://localhost:3000/api/v1",
    "poll_interval_sec": 5,
    "relay_pins": [17, 27, 22, 23],  # BCM pin numbers
    "fullscreen": True if os.environ.get("DESKTOP_SESSION") is None else False,
    "screen_rotation": 0  # Set to 180 for upside-down display flip
}

# Color Palette (Dark Mode Glassmorphism)
COLOR_BG = (12, 18, 32)
COLOR_CARD = (22, 32, 54)
COLOR_CARD_BORDER = (40, 58, 90)
COLOR_ACCENT = (0, 210, 255)
COLOR_ON = (46, 213, 115)
COLOR_OFF = (87, 101, 116)
COLOR_RED = (255, 71, 87)
COLOR_WHITE = (255, 255, 255)
COLOR_MUTED = (160, 175, 200)
COLOR_YELLOW = (255, 171, 0)
COLOR_HEADER = (17, 25, 44)

class HardwareManager:
    def __init__(self, relay_pins):
        self.relay_pins = relay_pins
        self.states = [False] * len(relay_pins)
        self.mode = "mock"
        self.devices = []

        # Try gpiozero first (Works on RPi 5, 4, 3 with RP1 & lgpio backend)
        try:
            from gpiozero import OutputDevice
            for pin in self.relay_pins:
                dev = OutputDevice(pin, active_high=True, initial_value=False)
                self.devices.append(dev)
            self.mode = "gpiozero"
            print(f"[HardwareManager] GPIO initialized via gpiozero (Pi 5 / Bookworm / Trixie supported)")
            return
        except Exception as e:
            print(f"[HardwareManager] gpiozero initialization skipped: {e}")

        # Fallback to RPi.GPIO with full safety catch for Pi 5 peripheral base address error
        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            for pin in self.relay_pins:
                GPIO.setup(pin, GPIO.OUT)
                GPIO.output(pin, GPIO.LOW)
            self.mode = "rpi_gpio"
            self.rpi_gpio = GPIO
            print(f"[HardwareManager] GPIO initialized via RPi.GPIO")
            return
        except Exception as e:
            print(f"[HardwareManager] RPi.GPIO unsupported on this kernel/SOC ({e}). Running in software emulation mode.")
            self.mode = "mock"

    def set_relay(self, index, state):
        if 0 <= index < len(self.relay_pins):
            self.states[index] = state
            if self.mode == "gpiozero":
                try:
                    if state:
                        self.devices[index].on()
                    else:
                        self.devices[index].off()
                except Exception as e:
                    print(f"Error setting gpiozero pin: {e}")
            elif self.mode == "rpi_gpio":
                try:
                    self.rpi_gpio.output(self.relay_pins[index], self.rpi_gpio.HIGH if state else self.rpi_gpio.LOW)
                except Exception as e:
                    print(f"Error setting RPi.GPIO pin: {e}")

    def toggle_relay(self, index):
        if 0 <= index < len(self.relay_pins):
            self.set_relay(index, not self.states[index])
            return self.states[index]
        return False

    def cleanup(self):
        if self.mode == "gpiozero":
            for dev in self.devices:
                try:
                    dev.close()
                except Exception:
                    pass
        elif self.mode == "rpi_gpio":
            try:
                self.rpi_gpio.cleanup()
            except Exception:
                pass

class CloudSyncThread(threading.Thread):
    def __init__(self, hw_mgr, status_dict):
        super().__init__()
        self.hw_mgr = hw_mgr
        self.status = status_dict
        self.running = True
        self.daemon = True

    def compute_hmac(self, secret: str, data: str) -> str:
        return hmac.new(secret.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()

    def run(self):
        while self.running:
            try:
                # Read Pi Temp
                temp = 42.0
                try:
                    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                        temp = float(f.read().strip()) / 1000.0
                except Exception:
                    pass

                self.status["cpu_temp"] = temp
                self.status["cpu_usage"] = psutil.cpu_percent()
                self.status["ram_usage"] = psutil.virtual_memory().percent

                # Telemetry Payload
                telemetry = {
                    "device_id": CONFIG["device_id"],
                    "timestamp": int(time.time()),
                    "cpu_usage": self.status["cpu_usage"],
                    "mem_usage": self.status["ram_usage"],
                    "cpu_temp": self.status["cpu_temp"],
                    "relays": self.hw_mgr.states
                }

                payload_str = json.dumps(telemetry)
                ts = str(int(time.time()))
                sig = self.compute_hmac(CONFIG["device_secret"], ts + payload_str)

                headers = {
                    "Content-Type": "application/json",
                    "X-Device-Id": CONFIG["device_id"],
                    "X-Timestamp": ts,
                    "X-Signature": sig
                }

                url = f"{CONFIG['cloud_endpoint']}/device/telemetry"
                resp = requests.post(url, data=payload_str, headers=headers, timeout=3)
                if resp.status_code == 200:
                    self.status["cloud_online"] = True
                else:
                    self.status["cloud_online"] = False

            except Exception:
                self.status["cloud_online"] = False

            time.sleep(CONFIG["poll_interval_sec"])

class TouchApp:
    def __init__(self):
        pygame.init()
        pygame.font.init()
        
        info = pygame.display.Info()
        w = info.current_w if info.current_w > 0 else 800
        h = info.current_h if info.current_h > 0 else 480

        flags = pygame.FULLSCREEN if CONFIG["fullscreen"] else pygame.RESIZABLE
        self.screen = pygame.display.set_mode((w, h), flags)
        pygame.display.set_caption("Smart Home Mesh Controller — Responsive")

        self.width = w
        self.height = h
        self.clock = pygame.time.Clock()

        # Dynamic Layout Metrics
        self.recalculate_layout()

        # Hardware & Sync
        self.hw = HardwareManager(CONFIG["relay_pins"])
        self.status = {
            "cpu_temp": 42.5,
            "cpu_usage": 15.0,
            "ram_usage": 32.0,
            "cloud_online": False,
            "active_tab": 0  # 0: Home, 1: Relays, 2: System
        }

        self.sync_thread = CloudSyncThread(self.hw, self.status)
        self.sync_thread.start()

        # Touch state
        self.touch_start_x = None
        self.touch_start_y = None
        self.clickable_rects = []  # Stores (rect, callback_id, payload)

    def recalculate_layout(self):
        w = self.width
        h = self.height

        # Dynamic typography scaled to screen height
        self.font_title = pygame.font.SysFont("DejaVu Sans, Arial", max(16, int(h * 0.045)), bold=True)
        self.font_big = pygame.font.SysFont("DejaVu Sans, Arial", max(22, int(h * 0.075)), bold=True)
        self.font_med = pygame.font.SysFont("DejaVu Sans, Arial", max(13, int(h * 0.034)), bold=True)
        self.font_small = pygame.font.SysFont("DejaVu Sans, Arial", max(10, int(h * 0.024)))

        # Header and Tab Dimensions
        self.header_h = max(40, int(h * 0.10))
        self.tab_h = max(40, int(h * 0.09))
        self.content_h = h - self.header_h - self.tab_h

        # Padding
        self.pad_x = max(10, int(w * 0.025))
        self.pad_y = max(10, int(h * 0.025))

    def update_window_size(self, w, h):
        self.width = max(320, w)
        self.height = max(240, h)
        self.screen = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)
        self.recalculate_layout()

    def draw_rounded_rect(self, surface, rect, color, radius=12, border_color=None):
        rw, rh = int(rect[2]), int(rect[3])
        if rw <= 0 or rh <= 0:
            return
        shape_surf = pygame.Surface((rw, rh), pygame.SRCALPHA)
        rad = min(radius, rw // 2, rh // 2)
        pygame.draw.rect(shape_surf, color, (0, 0, rw, rh), border_radius=rad)
        if border_color:
            pygame.draw.rect(shape_surf, border_color, (0, 0, rw, rh), width=2, border_radius=rad)
        surface.blit(shape_surf, (int(rect[0]), int(rect[1])))

    def render_header(self):
        # Header bar
        pygame.draw.rect(self.screen, COLOR_HEADER, (0, 0, self.width, self.header_h))
        pygame.draw.line(self.screen, COLOR_CARD_BORDER, (0, self.header_h), (self.width, self.header_h), 2)

        # Title
        t_surf = self.font_title.render("SMART HOME MESH", True, COLOR_ACCENT)
        self.screen.blit(t_surf, (self.pad_x, (self.header_h - t_surf.get_height()) // 2))

        # Clock
        time_str = time.strftime("%H:%M:%S")
        clk_surf = self.font_med.render(time_str, True, COLOR_WHITE)
        clk_x = self.width - self.pad_x - clk_surf.get_width() - int(self.width * 0.05)
        self.screen.blit(clk_surf, (clk_x, (self.header_h - clk_surf.get_height()) // 2))

        # Cloud Status Indicator
        c_color = COLOR_ON if self.status["cloud_online"] else COLOR_RED
        indicator_r = max(4, int(self.header_h * 0.16))
        pygame.draw.circle(self.screen, c_color, (self.width - self.pad_x - indicator_r, self.header_h // 2), indicator_r)

    def render_tabs(self):
        tabs = ["HOME & SENSORS", "RELAYS & POWER", "SYSTEM HEALTH"]
        tab_w = self.width // len(tabs)
        y = self.height - self.tab_h

        pygame.draw.rect(self.screen, COLOR_HEADER, (0, y, self.width, self.tab_h))
        pygame.draw.line(self.screen, COLOR_CARD_BORDER, (0, y), (self.width, y), 2)

        for i, name in enumerate(tabs):
            x = i * tab_w
            is_active = (self.status["active_tab"] == i)
            bg_col = COLOR_CARD if is_active else COLOR_HEADER
            txt_col = COLOR_ACCENT if is_active else COLOR_MUTED

            btn_rect = (x + 2, y + 2, tab_w - 4, self.tab_h - 4)
            pygame.draw.rect(self.screen, bg_col, btn_rect, border_radius=6)
            if is_active:
                pygame.draw.line(self.screen, COLOR_ACCENT, (x + 10, y + self.tab_h - 3), (x + tab_w - 10, y + self.tab_h - 3), 3)

            lbl = self.font_med.render(name, True, txt_col)
            lbl_rect = lbl.get_rect(center=(x + tab_w // 2, y + self.tab_h // 2))
            self.screen.blit(lbl, lbl_rect)

            self.clickable_rects.append((pygame.Rect(btn_rect), "TAB", i))

    def render_home_page(self):
        y_top = self.header_h + self.pad_y
        row1_h = int(self.content_h * 0.38)
        card_w = (self.width - self.pad_x * 3) // 2

        # Card 1: Temperature & Climate
        card1_rect = (self.pad_x, y_top, card_w, row1_h)
        self.draw_rounded_rect(self.screen, card1_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        t_lbl = self.font_med.render("CPU / SYSTEM TEMP", True, COLOR_MUTED)
        self.screen.blit(t_lbl, (card1_rect[0] + 15, card1_rect[1] + 12))

        temp_val = self.status["cpu_temp"]
        t_color = COLOR_RED if temp_val > 65 else (COLOR_ACCENT if temp_val < 50 else COLOR_YELLOW)
        v_surf = self.font_big.render(f"{temp_val:.1f} °C", True, t_color)
        self.screen.blit(v_surf, (card1_rect[0] + 15, card1_rect[1] + 12 + t_lbl.get_height() + 5))

        sub_surf = self.font_small.render("Thermal Status: NOMINAL", True, COLOR_WHITE)
        self.screen.blit(sub_surf, (card1_rect[0] + 15, card1_rect[1] + row1_h - sub_surf.get_height() - 10))

        # Card 2: Mesh Controller Status
        card2_rect = (self.pad_x * 2 + card_w, y_top, card_w, row1_h)
        self.draw_rounded_rect(self.screen, card2_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        e_lbl = self.font_med.render("MESH CONTROLLER STATUS", True, COLOR_MUTED)
        self.screen.blit(e_lbl, (card2_rect[0] + 15, card2_rect[1] + 12))

        m_surf = self.font_big.render("ACTIVE NODE", True, COLOR_ON)
        self.screen.blit(m_surf, (card2_rect[0] + 15, card2_rect[1] + 12 + e_lbl.get_height() + 5))

        m_sub = self.font_small.render(f"Cloud: {'ONLINE' if self.status['cloud_online'] else 'STANDALONE'}", True, COLOR_WHITE)
        self.screen.blit(m_sub, (card2_rect[0] + 15, card2_rect[1] + row1_h - m_sub.get_height() - 10))

        # Row 2: Quick Relays Container
        y_row2 = y_top + row1_h + self.pad_y
        row2_h = self.header_h + self.content_h - y_row2 - self.pad_y
        container_rect = (self.pad_x, y_row2, self.width - self.pad_x * 2, row2_h)
        self.draw_rounded_rect(self.screen, container_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        q_lbl = self.font_med.render("QUICK RELAY CONTROL (TOUCH TO TOGGLE)", True, COLOR_MUTED)
        self.screen.blit(q_lbl, (container_rect[0] + 15, container_rect[1] + 10))

        relay_gap = 10
        relay_w = (container_rect[2] - 30 - relay_gap * 3) // 4
        btn_h = row2_h - q_lbl.get_height() - 25

        for i in range(4):
            rx = container_rect[0] + 15 + i * (relay_w + relay_gap)
            ry = container_rect[1] + q_lbl.get_height() + 18
            state = self.hw.states[i]
            btn_bg = (10, 60, 40) if state else (30, 40, 60)
            btn_border = COLOR_ON if state else COLOR_CARD_BORDER

            btn_r = (rx, ry, relay_w, btn_h)
            self.draw_rounded_rect(self.screen, btn_r, btn_bg, 10, btn_border)

            r_name = self.font_med.render(f"RELAY {i+1}", True, COLOR_WHITE)
            self.screen.blit(r_name, (rx + 10, ry + 10))

            r_st = self.font_big.render("ON" if state else "OFF", True, COLOR_ON if state else COLOR_OFF)
            self.screen.blit(r_st, (rx + 10, ry + 10 + r_name.get_height() + 5))

            self.clickable_rects.append((pygame.Rect(btn_r), "RELAY", i))

    def render_relays_page(self):
        y_top = self.header_h + self.pad_y
        lbl = self.font_title.render("HARDWARE GPIO RELAY MANAGEMENT", True, COLOR_WHITE)
        self.screen.blit(lbl, (self.pad_x, y_top))

        card_gap = 15
        avail_h = self.height - self.tab_h - (y_top + lbl.get_height() + 15) - self.pad_y
        relay_w = (self.width - self.pad_x * 2 - card_gap) // 2
        relay_h = (avail_h - card_gap) // 2

        positions = [
            (self.pad_x, y_top + lbl.get_height() + 15),
            (self.pad_x + relay_w + card_gap, y_top + lbl.get_height() + 15),
            (self.pad_x, y_top + lbl.get_height() + 15 + relay_h + card_gap),
            (self.pad_x + relay_w + card_gap, y_top + lbl.get_height() + 15 + relay_h + card_gap)
        ]

        labels = ["MAIN POWER (GPIO 17)", "AUXILIARY LIGHTS (GPIO 27)", "CLIMATE FAN (GPIO 22)", "AUTOMATION SPARE (GPIO 23)"]

        for i in range(4):
            x, y = positions[i]
            state = self.hw.states[i]
            bg_col = (14, 75, 45) if state else COLOR_CARD
            b_col = COLOR_ON if state else COLOR_CARD_BORDER

            card_r = (x, y, relay_w, relay_h)
            self.draw_rounded_rect(self.screen, card_r, bg_col, 12, b_col)

            t_surf = self.font_med.render(labels[i], True, COLOR_ACCENT if state else COLOR_WHITE)
            self.screen.blit(t_surf, (x + 15, y + 12))

            st_surf = self.font_big.render("STATE: ENABLED" if state else "STATE: DISABLED", True, COLOR_ON if state else COLOR_OFF)
            self.screen.blit(st_surf, (x + 15, y + 12 + t_surf.get_height() + 5))

            sub_t = self.font_small.render("Tap card anywhere to toggle pin", True, COLOR_MUTED)
            self.screen.blit(sub_t, (x + 15, y + relay_h - sub_t.get_height() - 10))

            self.clickable_rects.append((pygame.Rect(card_r), "RELAY", i))

    def render_system_page(self):
        y_top = self.header_h + self.pad_y
        lbl = self.font_title.render("SYSTEM TELEMETRY & HARDWARE STATUS", True, COLOR_WHITE)
        self.screen.blit(lbl, (self.pad_x, y_top))

        box_w = self.width - self.pad_x * 2
        box_h = self.height - self.tab_h - (y_top + lbl.get_height() + 15) - self.pad_y
        box_r = (self.pad_x, y_top + lbl.get_height() + 15, box_w, box_h)
        self.draw_rounded_rect(self.screen, box_r, COLOR_CARD, 12, COLOR_CARD_BORDER)

        metrics = [
            f"Device ID: {CONFIG['device_id']}",
            f"IP Address: {socket.gethostbyname(socket.gethostname())}",
            f"Screen Resolution: {self.width}x{self.height} (Auto-Scaled)",
            f"CPU Load: {self.status['cpu_usage']:.1f}%",
            f"RAM Load: {self.status['ram_usage']:.1f}%",
            f"CPU Temp: {self.status['cpu_temp']:.1f} °C",
            f"GPIO Driver: {self.hw.mode}"
        ]

        step_y = max(22, box_h // (len(metrics) + 1))
        for i, m in enumerate(metrics):
            m_surf = self.font_med.render(m, True, COLOR_ACCENT if i < 3 else COLOR_WHITE)
            self.screen.blit(m_surf, (self.pad_x + 20, box_r[1] + 15 + i * step_y))

    def handle_click(self, pos):
        if CONFIG.get("screen_rotation", 0) == 180:
            pos = (self.width - pos[0], self.height - pos[1])
        for rect, cb_type, payload in self.clickable_rects:
            if rect.collidepoint(pos):
                if cb_type == "TAB":
                    self.status["active_tab"] = payload
                elif cb_type == "RELAY":
                    self.hw.toggle_relay(payload)
                return

    def run(self):
        running = True
        while running:
            self.clickable_rects.clear()

            for event in pygame.event.get():
                if event.type == QUIT:
                    running = False
                elif event.type == VIDEORESIZE:
                    self.update_window_size(event.w, event.h)
                elif event.type == KEYDOWN:
                    if event.key == K_ESCAPE or event.key == K_q:
                        running = False
                    elif event.key == K_RIGHT:
                        self.status["active_tab"] = (self.status["active_tab"] + 1) % 3
                    elif event.key == K_LEFT:
                        self.status["active_tab"] = (self.status["active_tab"] - 1) % 3

                elif event.type == MOUSEBUTTONDOWN:
                    self.touch_start_x, self.touch_start_y = event.pos
                    self.handle_click(event.pos)

                elif event.type == MOUSEBUTTONUP:
                    if self.touch_start_x is not None:
                        dx = event.pos[0] - self.touch_start_x
                        if abs(dx) > int(self.width * 0.15): # Dynamic Swipe Threshold
                            if dx < 0:
                                self.status["active_tab"] = (self.status["active_tab"] + 1) % 3
                            else:
                                self.status["active_tab"] = (self.status["active_tab"] - 1) % 3
                        self.touch_start_x = None

            # Render Screen to main window or rotated buffer
            if CONFIG.get("screen_rotation", 0) == 180:
                # Render to offscreen surface then flip 180
                offscreen = pygame.Surface((self.width, self.height))
                offscreen.fill(COLOR_BG)
                
                # Temporarily point drawing to offscreen
                real_screen = self.screen
                self.screen = offscreen
                
                self.render_header()
                if self.status["active_tab"] == 0:
                    self.render_home_page()
                elif self.status["active_tab"] == 1:
                    self.render_relays_page()
                elif self.status["active_tab"] == 2:
                    self.render_system_page()
                self.render_tabs()

                self.screen = real_screen
                rotated_surf = pygame.transform.rotate(offscreen, 180)
                self.screen.blit(rotated_surf, (0, 0))
            else:
                self.screen.fill(COLOR_BG)
                self.render_header()

                if self.status["active_tab"] == 0:
                    self.render_home_page()
                elif self.status["active_tab"] == 1:
                    self.render_relays_page()
                elif self.status["active_tab"] == 2:
                    self.render_system_page()

                self.render_tabs()

            pygame.display.flip()
            self.clock.tick(30)

        self.hw.cleanup()
        pygame.quit()
        sys.exit(0)

if __name__ == "__main__":
    app = TouchApp()
    app.run()
