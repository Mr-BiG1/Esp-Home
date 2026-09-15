export interface StoreDevice {
  id: string;
  deviceId: string;
  macAddress: string;
  chipId: string;
  firmwareVersion: string;
  name: string;
  deviceType: string;
  location?: string | null;
  registrationStatus: string;
  lastHeartbeat: string | null;
  wifiStatus: string;
  ipAddress?: string | null;
  wifiSignalRssi?: number | null;
  uptimeSeconds: number;
  capabilities: string[];
  configVersion: number;
  state: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCommand {
  commandId: string;
  deviceId: string;
  module: string;
  action: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  createdAt: string;
}

export interface StoreRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerConditionJson: string;
  actionType: string;
  actionPayloadJson: string;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

export interface StoreServer {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  os: string;
  online: boolean;
  isMeasured?: boolean;
  cpuUsage: number;
  memUsage: number;
  gpuTemp: number;
  diskUsage: number;
  uptimeSeconds: number;
  powerRelayIndex: number;
}

export interface StoreCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
}

export interface StoreTask {
  id: string;
  text: string;
  category: string;
  priority: number;
  completed: boolean;
  createdAt: string;
}

export interface StoreAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  isRead: boolean;
  timestamp: string;
}

export interface StoreModule {
  id: string;
  targetControllerId: string;
  moduleKey: string;
  name: string;
  version: string;
  configJson: string;
  status: string;
  updatedAt: string;
}

export interface StoreClimateZone {
  id: string;
  name: string;
  targetTemp: number;
  currentTemp: number;
  currentHumidity: number;
  mode: string;
  hysteresis: number;
  safetyStatus: string;
  isMeasured: boolean;
}

const globalStore = globalThis as unknown as {
  inMemoryDevices: Map<string, StoreDevice>;
  inMemoryCommands: Map<string, StoreCommand[]>;
  inMemoryRules: StoreRule[];
  inMemoryServers: StoreServer[];
  inMemoryCalendar: StoreCalendarEvent[];
  inMemoryTasks: StoreTask[];
  inMemoryAlerts: StoreAlert[];
  inMemoryCanvas: any[];
  inMemoryModules: StoreModule[];
  inMemoryClimate: StoreClimateZone[];
};

if (!globalStore.inMemoryDevices) {
  globalStore.inMemoryDevices = new Map<string, StoreDevice>();
  globalStore.inMemoryDevices.set('RPI-TOUCH-NODE-01', {
    id: 'dev_rpi_01',
    deviceId: 'RPI-TOUCH-NODE-01',
    macAddress: '2C:CF:67:04:2F:6C',
    chipId: 'RPI-SOC-042F6C',
    firmwareVersion: '2.1.0-RPI',
    name: 'Raspberry Pi Touch Node',
    deviceType: 'RASPBERRY-PI-TOUCH',
    location: 'Main Living Room',
    registrationStatus: 'ACTIVE',
    lastHeartbeat: new Date().toISOString(),
    wifiStatus: 'ONLINE',
    ipAddress: '192.168.0.20',
    wifiSignalRssi: -45,
    uptimeSeconds: 3600,
    capabilities: ['relay_1', 'relay_2', 'relay_3', 'relay_4', 'temp_sensor', 'touch_ui'],
    configVersion: 1,
    state: { relay_1: false, relay_2: false, relay_3: false, relay_4: false, temp: 42.5, targetTemp: 22.5, climateMode: 'AUTO' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

if (!globalStore.inMemoryCommands) globalStore.inMemoryCommands = new Map<string, StoreCommand[]>();

if (!globalStore.inMemoryRules) {
  globalStore.inMemoryRules = [
    {
      id: 'rule_1',
      name: 'High Temperature Aux Cooling',
      enabled: true,
      triggerType: 'TEMP_ABOVE',
      triggerConditionJson: JSON.stringify({ temp: 28.0 }),
      actionType: 'RELAY_TOGGLE',
      actionPayloadJson: JSON.stringify({ channel: 2, state: true }),
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule_2',
      name: 'Nightly System Power Off',
      enabled: false,
      triggerType: 'SCHEDULE',
      triggerConditionJson: JSON.stringify({ time: "23:00" }),
      actionType: 'RELAY_TOGGLE',
      actionPayloadJson: JSON.stringify({ channel: 1, state: false }),
      createdAt: new Date().toISOString()
    }
  ];
}

if (!globalStore.inMemoryServers) {
  globalStore.inMemoryServers = [
    {
      id: 'srv_1',
      name: 'Home Primary Workstation',
      hostname: 'WORKSTATION-MAIN',
      ipAddress: '192.168.0.100',
      os: 'Windows 11 Enterprise',
      online: true,
      isMeasured: true,
      cpuUsage: 14.2,
      memUsage: 38.5,
      gpuTemp: 44.0,
      diskUsage: 52.1,
      uptimeSeconds: 86400,
      powerRelayIndex: 1
    },
    {
      id: 'srv_2',
      name: 'Media & Storage NAS',
      hostname: 'MEDIA-NAS-01',
      ipAddress: '192.168.0.150',
      os: 'Ubuntu 24.04 LTS',
      online: true,
      isMeasured: true,
      cpuUsage: 8.4,
      memUsage: 22.0,
      gpuTemp: 38.0,
      diskUsage: 68.4,
      uptimeSeconds: 259200,
      powerRelayIndex: 2
    }
  ];
}

if (!globalStore.inMemoryCalendar) {
  globalStore.inMemoryCalendar = [
    {
      id: 'cal_1',
      title: 'Monthly Mesh Security Audit',
      description: 'Rotate security HMAC tokens and check sensor logs',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 90000000).toISOString(),
      location: 'Smart Home Cloud',
      isAllDay: false
    },
    {
      id: 'cal_2',
      title: 'ESP32 Firmware OTA Maintenance',
      description: 'Deploy v2.1.4 update to peripheral nodes',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      endTime: new Date(Date.now() + 176400000).toISOString(),
      location: 'Living Room Node',
      isAllDay: false
    }
  ];
}

if (!globalStore.inMemoryTasks) {
  globalStore.inMemoryTasks = [
    { id: 'task_1', text: 'Verify Raspberry Pi 5 touch calibration', category: 'Hardware', priority: 2, completed: true, createdAt: new Date().toISOString() },
    { id: 'task_2', text: 'Deploy Vercel serverless cloud admin plane', category: 'Cloud', priority: 1, completed: true, createdAt: new Date().toISOString() },
    { id: 'task_3', text: 'Connect DHT22 temperature sensor to GPIO pin', category: 'Sensors', priority: 0, completed: false, createdAt: new Date().toISOString() }
  ];
}

if (!globalStore.inMemoryAlerts) {
  globalStore.inMemoryAlerts = [
    { id: 'alt_1', severity: 'INFO', message: 'Raspberry Pi Node paired with Vercel Cloud plane', isRead: false, timestamp: new Date().toISOString() },
    { id: 'alt_2', severity: 'WARNING', message: 'Relay channel 2 triggered by manual touch gesture', isRead: true, timestamp: new Date(Date.now() - 3600000).toISOString() }
  ];
}

if (!globalStore.inMemoryCanvas) {
  globalStore.inMemoryCanvas = [
    { id: 'w_1', type: 'header', title: 'SMART HOME MESH', x: 0, y: 0, w: 320, h: 26, color: '#00d2ff' },
    { id: 'w_2', type: 'temp_card', title: 'CLIMATE SENSOR', x: 10, y: 34, w: 145, h: 90, color: '#ffab00' },
    { id: 'w_3', type: 'relay_card', title: 'RELAY 1 (MAIN)', x: 165, y: 34, w: 145, h: 42, color: '#2ed573' },
    { id: 'w_4', type: 'relay_card', title: 'RELAY 2 (AUX)', x: 165, y: 82, w: 145, h: 42, color: '#2ed573' }
  ];
}

if (!globalStore.inMemoryModules) {
  globalStore.inMemoryModules = [
    {
      id: 'mod_1',
      targetControllerId: 'RPI-TOUCH-NODE-01',
      moduleKey: 'sensor.temperature.bme280',
      name: 'BME280 Temp & Humidity Sensor',
      version: '1.0.0',
      configJson: JSON.stringify({ i2c_address: '0x76', sampling_rate_sec: 30 }),
      status: 'ACTIVE',
      updatedAt: new Date().toISOString()
    }
  ];
}

if (!globalStore.inMemoryClimate) {
  globalStore.inMemoryClimate = [
    {
      id: 'cz_1',
      name: 'Living Room Thermostat',
      targetTemp: 22.5,
      currentTemp: 21.8,
      currentHumidity: 45,
      mode: 'AUTO',
      hysteresis: 0.5,
      safetyStatus: 'OK',
      isMeasured: true
    },
    {
      id: 'cz_2',
      name: 'Server Room Climate',
      targetTemp: 19.0,
      currentTemp: 20.4,
      currentHumidity: 38,
      mode: 'COOL',
      hysteresis: 1.0,
      safetyStatus: 'OK',
      isMeasured: true
    }
  ];
}

export const inMemoryDevices = globalStore.inMemoryDevices;
export const inMemoryCommands = globalStore.inMemoryCommands;
export const inMemoryRules = globalStore.inMemoryRules;
export const inMemoryServers = globalStore.inMemoryServers;
export const inMemoryCalendar = globalStore.inMemoryCalendar;
export const inMemoryTasks = globalStore.inMemoryTasks;
export const inMemoryAlerts = globalStore.inMemoryAlerts;
export const inMemoryCanvas = globalStore.inMemoryCanvas;
export const inMemoryModules = globalStore.inMemoryModules;
export const inMemoryClimate = globalStore.inMemoryClimate;

export function upsertStoreDevice(device: Partial<StoreDevice> & { deviceId: string }) {
  const existing = inMemoryDevices.get(device.deviceId) || {
    id: `dev_${device.deviceId}`,
    deviceId: device.deviceId,
    macAddress: device.macAddress || '2C:CF:67:04:2F:6C',
    chipId: device.chipId || 'CHIP-001',
    firmwareVersion: device.firmwareVersion || '1.0.0',
    name: device.name || `Device ${device.deviceId}`,
    deviceType: device.deviceType || 'SMART-NODE',
    location: device.location || 'Local Mesh',
    registrationStatus: 'ACTIVE',
    lastHeartbeat: new Date().toISOString(),
    wifiStatus: 'ONLINE',
    ipAddress: device.ipAddress || '192.168.0.20',
    wifiSignalRssi: -50,
    uptimeSeconds: 100,
    capabilities: device.capabilities || ['relay_1', 'relay_2'],
    configVersion: 1,
    state: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated: StoreDevice = {
    ...existing,
    ...device,
    state: { ...(existing.state || {}), ...(device.state || {}) },
    lastHeartbeat: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wifiStatus: 'ONLINE',
  };

  inMemoryDevices.set(device.deviceId, updated);
  return updated;
}

export function addStoreCommand(cmd: Omit<StoreCommand, 'commandId' | 'status' | 'createdAt'>) {
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullCmd: StoreCommand = {
    ...cmd,
    commandId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const list = inMemoryCommands.get(cmd.deviceId) || [];
  list.push(fullCmd);
  inMemoryCommands.set(cmd.deviceId, list);

  if (cmd.module === 'relay') {
    const dev = inMemoryDevices.get(cmd.deviceId);
    if (dev) {
      const channel = cmd.parameters?.channel || 1;
      const key = `relay_${channel}`;
      const currentState = dev.state?.[key] || false;
      const newState = cmd.action === 'toggle' ? !currentState : Boolean(cmd.parameters?.state);
      dev.state = { ...dev.state, [key]: newState };
      inMemoryDevices.set(cmd.deviceId, dev);
    }
  }

  return fullCmd;
}

export function popStoreCommands(deviceId: string): StoreCommand[] {
  const list = inMemoryCommands.get(deviceId) || [];
  inMemoryCommands.set(deviceId, []);
  return list;
}
