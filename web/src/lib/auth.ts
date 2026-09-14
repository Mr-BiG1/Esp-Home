import { Role } from '../types';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

// Development session mock / token validator
export function getCurrentUser(request: Request): UserSession {
  // Check authorization header or session cookie
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    if (token === 'admin-dev-token') {
      return {
        userId: 'usr_admin_01',
        email: 'admin@smarthome.local',
        name: 'System Administrator',
        role: 'ADMIN',
      };
    }
  }

  // Default fallback for dev environment: Admin access
  return {
    userId: 'usr_admin_01',
    email: 'admin@smarthome.local',
    name: 'System Administrator',
    role: 'ADMIN',
  };
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    VIEWER: 1,
    USER: 2,
    ADMIN: 3,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
