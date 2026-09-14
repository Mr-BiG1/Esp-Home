#!/usr/bin/env python3
"""
Smart Home Mesh Controller — Raspberry Pi OS Touchscreen GUI Application
Supports full 800x480 / 480x320 touch displays on Raspberry Pi OS.
Features live environment monitoring, interactive relay toggles, touch gestures, and cloud mesh sync.
"""

import sys
import os
import time
import json
import threading
import math
import requests
import psutil
import socket
import hmac
import hashlib

# Check for RPi.GPIO (runs in mock mode on non-RPi testing systems)
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    GPIO_AVAILABLE = False

import pygame
from pygame.locals import *

# === Configuration ===
CONFIG = {
    "device_id": "RPI-TOUCH-NODE-01",
    "device_secret": "rpi_secret_key_mesh_2026",
    "cloud_endpoint": "http://localhost:3000/api/v1",
    "poll_interval_sec": 5,
    "relay_pins": [17, 27, 22, 23],  # BCM pin numbers
    "screen_width": 800,
    "screen_height": 480,
    "fullscreen": True if os.environ.get("DESKTOP_SESSION") is None else False
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
        if GPIO_AVAILABLE:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            for pin in self.relay_pins:
                GPIO.setup(pin, GPIO.OUT)
                GPIO.output(pin, GPIO.LOW)

    def set_relay(self, index, state):
        if 0 <= index < len(self.relay_pins):
            self.states[index] = state
            if GPIO_AVAILABLE:
                GPIO.output(self.relay_pins[index], GPIO.HIGH if state else GPIO.LOW)

    def toggle_relay(self, index):
        if 0 <= index < len(self.relay_pins):
            self.set_relay(index, not self.states[index])
            return self.states[index]
        return False

    def cleanup(self):
        if GPIO_AVAILABLE:
            GPIO.cleanup()

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
        
        # Hide mouse cursor in fullscreen mode
        if CONFIG["fullscreen"]:
            pygame.mouse.set_visible(False)

        info = pygame.display.Info()
        w = info.current_w if CONFIG["fullscreen"] else CONFIG["screen_width"]
        h = info.current_h if CONFIG["fullscreen"] else CONFIG["screen_height"]
        
        flags = pygame.FULLSCREEN if CONFIG["fullscreen"] else 0
        self.screen = pygame.display.set_mode((w, h), flags)
        pygame.display.set_caption("Smart Home Mesh Controller — Raspberry Pi OS")

        self.width = w
        self.height = h
        self.clock = pygame.time.Clock()

        # Fonts
        self.font_title = pygame.font.SysFont("DejaVu Sans, Arial", 24, bold=True)
        self.font_big = pygame.font.SysFont("DejaVu Sans, Arial", 44, bold=True)
        self.font_med = pygame.font.SysFont("DejaVu Sans, Arial", 18, bold=True)
        self.font_small = pygame.font.SysFont("DejaVu Sans, Arial", 14)

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

    def draw_rounded_rect(self, surface, rect, color, radius=12, border_color=None):
        shape_surf = pygame.Surface((rect[2], rect[3]), pygame.SRCALPHA)
        pygame.draw.rect(shape_surf, color, (0, 0, rect[2], rect[3]), border_radius=radius)
        if border_color:
            pygame.draw.rect(shape_surf, border_color, (0, 0, rect[2], rect[3]), width=2, border_radius=radius)
        surface.blit(shape_surf, (rect[0], rect[1]))

    def render_header(self):
        # Header bar
        pygame.draw.rect(self.screen, COLOR_HEADER, (0, 0, self.width, 50))
        pygame.draw.line(self.screen, COLOR_CARD_BORDER, (0, 50), (self.width, 50), 2)

        # Title
        t_surf = self.font_title.render("SMART HOME MESH — RASPBERRY PI OS", True, COLOR_ACCENT)
        self.screen.blit(t_surf, (20, 12))

        # Clock
        time_str = time.strftime("%H:%M:%S")
        clk_surf = self.font_med.render(time_str, True, COLOR_WHITE)
        self.screen.blit(clk_surf, (self.width - 180, 15))

        # Cloud Status Indicator
        c_color = COLOR_ON if self.status["cloud_online"] else COLOR_RED
        pygame.draw.circle(self.screen, c_color, (self.width - 30, 25), 8)

    def render_tabs(self):
        tabs = ["HOME & SENSORS", "RELAYS & POWER", "SYSTEM HEALTH"]
        tab_w = self.width // len(tabs)
        y = self.height - 45

        pygame.draw.rect(self.screen, COLOR_HEADER, (0, y, self.width, 45))
        pygame.draw.line(self.screen, COLOR_CARD_BORDER, (0, y), (self.width, y), 2)

        for i, name in enumerate(tabs):
            x = i * tab_w
            is_active = (self.status["active_tab"] == i)
            bg_col = COLOR_CARD if is_active else COLOR_HEADER
            txt_col = COLOR_ACCENT if is_active else COLOR_MUTED

            pygame.draw.rect(self.screen, bg_col, (x + 2, y + 2, tab_w - 4, 41), border_radius=6)
            if is_active:
                pygame.draw.line(self.screen, COLOR_ACCENT, (x + 10, y + 43), (x + tab_w - 10, y + 43), 3)

            lbl = self.font_med.render(name, True, txt_col)
            lbl_rect = lbl.get_rect(center=(x + tab_w // 2, y + 22))
            self.screen.blit(lbl, lbl_rect)

    def render_home_page(self):
        # Card 1: Temperature & Climate
        card1_rect = (20, 70, (self.width - 60) // 2, 160)
        self.draw_rounded_rect(self.screen, card1_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        t_lbl = self.font_med.render("CPU / SYSTEM TEMP", True, COLOR_MUTED)
        self.screen.blit(t_lbl, (35, 82))

        temp_val = self.status["cpu_temp"]
        t_color = COLOR_RED if temp_val > 65 else (COLOR_ACCENT if temp_val < 50 else COLOR_YELLOW)
        v_surf = self.font_big.render(f"{temp_val:.1f} °C", True, t_color)
        self.screen.blit(v_surf, (35, 115))

        sub_surf = self.font_small.render(f"Thermal Zone 0 — Thermal Status: NOMINAL", True, COLOR_WHITE)
        self.screen.blit(sub_surf, (35, 185))

        # Card 2: Environment & Mesh Node Count
        card2_rect = (self.width // 2 + 10, 70, (self.width - 60) // 2, 160)
        self.draw_rounded_rect(self.screen, card2_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        e_lbl = self.font_med.render("MESH CONTROLLER STATUS", True, COLOR_MUTED)
        self.screen.blit(e_lbl, (self.width // 2 + 25, 82))

        m_surf = self.font_big.render("ACTIVE NODE", True, COLOR_ON)
        self.screen.blit(m_surf, (self.width // 2 + 25, 115))

        m_sub = self.font_small.render(f"Device ID: {CONFIG['device_id']} | Cloud: {'ONLINE' if self.status['cloud_online'] else 'STANDALONE'}", True, COLOR_WHITE)
        self.screen.blit(m_sub, (self.width // 2 + 25, 185))

        # Quick Relays Row
        card3_rect = (20, 245, self.width - 40, 175)
        self.draw_rounded_rect(self.screen, card3_rect, COLOR_CARD, 12, COLOR_CARD_BORDER)

        q_lbl = self.font_med.render("QUICK RELAY CONTROL (TOUCH TO TOGGLE)", True, COLOR_MUTED)
        self.screen.blit(q_lbl, (35, 257))

        relay_w = (self.width - 100) // 4
        for i in range(4):
            rx = 35 + i * (relay_w + 10)
            ry = 290
            state = self.hw.states[i]
            btn_bg = (10, 60, 40) if state else (30, 40, 60)
            btn_border = COLOR_ON if state else COLOR_CARD_BORDER

            self.draw_rounded_rect(self.screen, (rx, ry, relay_w, 115), btn_bg, 10, btn_border)
            r_name = self.font_med.render(f"RELAY {i+1}", True, COLOR_WHITE)
            self.screen.blit(r_name, (rx + 15, ry + 15))

            r_st = self.font_big.render("ON" if state else "OFF", True, COLOR_ON if state else COLOR_OFF)
            self.screen.blit(r_st, (rx + 15, ry + 48))

    def render_relays_page(self):
        lbl = self.font_title.render("HARDWARE GPIO RELAY MANAGEMENT", True, COLOR_WHITE)
        self.screen.blit(lbl, (30, 70))

        relay_w = (self.width - 80) // 2
        relay_h = 150

        positions = [
            (30, 110), (self.width // 2 + 10, 110),
            (30, 275), (self.width // 2 + 10, 275)
        ]

        labels = ["MAIN POWER (GPIO 17)", "AUXILIARY LIGHTS (GPIO 27)", "CLIMATE FAN (GPIO 22)", "AUTOMATION SPARE (GPIO 23)"]

        for i in range(4):
            x, y = positions[i]
            state = self.hw.states[i]
            bg_col = (14, 75, 45) if state else COLOR_CARD
            b_col = COLOR_ON if state else COLOR_CARD_BORDER

            self.draw_rounded_rect(self.screen, (x, y, relay_w, relay_h), bg_col, 12, b_col)

            t_surf = self.font_med.render(labels[i], True, COLOR_ACCENT if state else COLOR_WHITE)
            self.screen.blit(t_surf, (x + 20, y + 20))

            st_surf = self.font_big.render("STATE: ENABLED" if state else "STATE: DISABLED", True, COLOR_ON if state else COLOR_OFF)
            self.screen.blit(st_surf, (x + 20, y + 60))

            sub_t = self.font_small.render("Tap card anywhere to toggle GPIO pin state", True, COLOR_MUTED)
            self.screen.blit(sub_t, (x + 20, y + 115))

    def render_system_page(self):
        lbl = self.font_title.render("RASPBERRY PI SYSTEM TELEMETRY & HARDWARE", True, COLOR_WHITE)
        self.screen.blit(lbl, (30, 70))

        box_w = self.width - 60
        self.draw_rounded_rect(self.screen, (30, 110, box_w, 310), COLOR_CARD, 12, COLOR_CARD_BORDER)

        metrics = [
            f"Device Identifier: {CONFIG['device_id']}",
            f"Host IP Address: {socket.gethostbyname(socket.gethostname())}",
            f"CPU Usage: {self.status['cpu_usage']:.1f}%",
            f"RAM Usage: {self.status['ram_usage']:.1f}%",
            f"CPU Temperature: {self.status['cpu_temp']:.1f} °C",
            f"Uptime: {int(time.time() - psutil.boot_time()) // 3600} hours",
            f"Cloud API Endpoint: {CONFIG['cloud_endpoint']}",
            f"GPIO Driver Status: {'RPi.GPIO Active' if GPIO_AVAILABLE else 'Mock Emulation'}"
        ]

        for i, m in enumerate(metrics):
            m_surf = self.font_med.render(m, True, COLOR_ACCENT if i < 2 else COLOR_WHITE)
            self.screen.blit(m_surf, (50, 130 + i * 35))

    def handle_click(self, pos):
        x, y = pos

        # Tab navigation bar at bottom
        if y >= self.height - 45:
            tab_w = self.width // 3
            self.status["active_tab"] = x // tab_w
            return

        active_tab = self.status["active_tab"]

        # Home Page Quick Relay Clicks
        if active_tab == 0:
            if 290 <= y <= 405:
                relay_w = (self.width - 100) // 4
                for i in range(4):
                    rx = 35 + i * (relay_w + 10)
                    if rx <= x <= rx + relay_w:
                        self.hw.toggle_relay(i)

        # Relays Page Big Card Clicks
        elif active_tab == 1:
            relay_w = (self.width - 80) // 2
            relay_h = 150
            positions = [
                (30, 110), (self.width // 2 + 10, 110),
                (30, 275), (self.width // 2 + 10, 275)
            ]
            for i in range(4):
                px, py = positions[i]
                if px <= x <= px + relay_w and py <= y <= py + relay_h:
                    self.hw.toggle_relay(i)

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == QUIT:
                    running = False
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
                        if abs(dx) > 100: # Swipe Gesture
                            if dx < 0:
                                self.status["active_tab"] = (self.status["active_tab"] + 1) % 3
                            else:
                                self.status["active_tab"] = (self.status["active_tab"] - 1) % 3
                        self.touch_start_x = None

            # Render Screen
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
