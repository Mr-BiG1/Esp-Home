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

const globalForDevices = globalThis as unknown as {
  inMemoryDevices: Map<string, StoreDevice>;
};

if (!globalForDevices.inMemoryDevices) {
  globalForDevices.inMemoryDevices = new Map<string, StoreDevice>();
  
  // Seed initial demo devices if empty
  globalForDevices.inMemoryDevices.set('RPI-TOUCH-NODE-01', {
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
    ipAddress: '192.168.1.105',
    wifiSignalRssi: -45,
    uptimeSeconds: 3600,
    capabilities: ['relay_1', 'relay_2', 'relay_3', 'relay_4', 'temp_sensor', 'touch_ui'],
    configVersion: 1,
    state: { relay_1: false, relay_2: false, relay_3: false, relay_4: false, temp: 42.5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export const inMemoryDevices = globalForDevices.inMemoryDevices;

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
    ipAddress: device.ipAddress || '192.168.1.100',
    wifiSignalRssi: -50,
    uptimeSeconds: 100,
    capabilities: device.capabilities || ['relay_1', 'relay_2'],
    configVersion: 1,
    state: device.state || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated: StoreDevice = {
    ...existing,
    ...device,
    lastHeartbeat: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wifiStatus: 'ONLINE',
  };

  inMemoryDevices.set(device.deviceId, updated);
  return updated;
}
