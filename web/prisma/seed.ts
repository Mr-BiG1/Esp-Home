import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Smart Home Mesh Controller Database...');

  // 1. Seed Main Device
  const device = await prisma.device.upsert({
    where: { deviceId: 'HOME-CTRL-001' },
    update: {},
    create: {
      deviceId: 'HOME-CTRL-001',
      macAddress: '24:0A:C4:00:11:22',
      chipId: 'ESP32S3-N16R8-001',
      firmwareVersion: '1.0.0',
      name: 'Main TFT Mesh Controller',
      deviceType: 'ESP32-S3-CONTROLLER',
      location: 'Living Room Command Center',
      registrationStatus: 'ACTIVE',
      ipAddress: '192.168.1.100',
      wifiSignalRssi: -45,
      uptimeSeconds: BigInt(36000),
      capabilitiesJson: JSON.stringify(['tft_display', 'touchscreen', 'relays', 'climate_control', 'wifi', 'hmac_sha256'])
    }
  });

  // 2. Seed Servers
  const desktop = await prisma.server.upsert({
    where: { hostname: 'desktop-rig.local' },
    update: {},
    create: {
      name: 'Main Workstation Rig',
      hostname: 'desktop-rig.local',
      ipAddress: '192.168.1.150',
      os: 'Windows 11 Pro',
      online: true,
      isMeasured: true,
      cpuUsage: 28.4,
      memUsage: 64.2,
      gpuTemp: 46.5,
      diskUsage: 52.0,
      uptimeSeconds: BigInt(86400),
      powerRelayIndex: 0
    }
  });

  const piNode = await prisma.server.upsert({
    where: { hostname: 'rpi-mesh-node.local' },
    update: {},
    create: {
      name: 'Raspberry Pi Mesh Gateway',
      hostname: 'rpi-mesh-node.local',
      ipAddress: '192.168.1.105',
      os: 'Raspbian Bookworm',
      online: true,
      isMeasured: true,
      cpuUsage: 12.1,
      memUsage: 38.0,
      gpuTemp: 41.2,
      diskUsage: 24.5,
      uptimeSeconds: BigInt(259200),
      powerRelayIndex: 1
    }
  });

  // 3. Seed Climate Zone
  const zone = await prisma.climateZone.create({
    data: {
      name: 'Living Room Main Zone',
      targetTemp: 21.5,
      currentTemp: 22.1,
      currentHumidity: 44.5,
      mode: 'AUTO',
      hysteresis: 0.5,
      heaterRelayIndex: 2,
      safetyStatus: 'OK',
      isMeasured: true
    }
  });

  // 4. Seed Tasks
  await prisma.taskItem.createMany({
    data: [
      { text: 'Verify automated database backup', category: 'Maintenance', priority: 2, completed: false },
      { text: 'Inspect ESP32-S3 touch screen calibration', category: 'Hardware', priority: 1, completed: true },
      { text: 'Update Raspberry Pi agent packages', category: 'Software', priority: 1, completed: false },
      { text: 'Check mesh WiFi RSSI signal map', category: 'Network', priority: 0, completed: false }
    ]
  });

  // 5. Seed Calendar Events
  await prisma.calendarEvent.createMany({
    data: [
      { title: 'System Maintenance Window', description: 'Firmware & OS updates for mesh nodes', startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 90000000), location: 'Server Rack' },
      { title: 'Climate Hysteresis Audit', description: 'Review temperature log efficiency', startTime: new Date(Date.now() + 172800000), endTime: new Date(Date.now() + 176400000), location: 'Living Room' }
    ]
  });

  // 6. Seed Automation Rules
  await prisma.automationRule.createMany({
    data: [
      { name: 'Overheat Power Off', enabled: true, triggerType: 'GPU_TEMP_ABOVE', triggerConditionJson: JSON.stringify({ threshold: 85.0 }), actionType: 'RELAY_TOGGLE', actionPayloadJson: JSON.stringify({ relayIndex: 0, state: false }) },
      { name: 'Auto Climate Freeze Guard', enabled: true, triggerType: 'TEMP_BELOW', triggerConditionJson: JSON.stringify({ threshold: 12.0 }), actionType: 'CLIMATE_MODE', actionPayloadJson: JSON.stringify({ mode: 'BOOST' }) }
    ]
  });

  // 7. Seed Alerts
  await prisma.alert.createMany({
    data: [
      { deviceId: device.deviceId, severity: 'INFO', message: 'Smart Home Mesh Controller booted successfully', isRead: true },
      { deviceId: device.deviceId, severity: 'WARNING', message: 'Raspberry Pi agent memory usage exceeded 80% temporarily', isRead: false }
    ]
  });

  console.log('Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
