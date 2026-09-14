export type RegistrationStatus = 'UNREGISTERED' | 'PAIRING' | 'REGISTERED' | 'ACTIVE' | 'REVOKED';
export type CommandStatus = 'PENDING' | 'DELIVERED' | 'ACKNOWLEDGED' | 'EXECUTED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type Role = 'ADMIN' | 'USER' | 'VIEWER';

export interface DeviceDto {
  id: string;
  deviceId: string;
  macAddress: string;
  chipId: string;
  firmwareVersion: string;
  name: string;
  deviceType: string;
  location?: string | null;
  registrationStatus: RegistrationStatus;
  lastHeartbeat?: string | null;
  wifiStatus?: string | null;
  ipAddress?: string | null;
  wifiSignalRssi?: number | null;
  uptimeSeconds: number;
  capabilities: string[];
  configVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommandDto {
  commandId: string;
  deviceId: string;
  module: string;
  action: string;
  parameters: Record<string, any>;
  status: CommandStatus;
  idempotencyKey?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface TelemetryDto {
  id: string;
  deviceId: string;
  telemetryType: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface AuditLogDto {
  id: string;
  userId?: string | null;
  deviceId?: string | null;
  action: string;
  payload?: Record<string, any> | null;
  result: string;
  sourceIp?: string | null;
  timestamp: string;
}

export interface SystemStatsDto {
  totalDevices: number;
  onlineDevices: number;
  pendingCommands: number;
  totalAuditLogs: number;
  activeModules: number;
}
