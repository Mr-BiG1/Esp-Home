'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  Server,
  Thermometer,
  CheckSquare,
  Calendar,
  Zap,
  Bell,
  Palette,
  ShieldAlert,
  Terminal,
  Settings,
  Activity
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Devices', href: '/devices', icon: Cpu },
    { name: 'Servers & PCs', href: '/servers', icon: Server },
    { name: 'Climate', href: '/climate', icon: Thermometer },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Automations', href: '/automations', icon: Zap },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Display Designer', href: '/designer', icon: Palette },
    { name: 'Security Audit', href: '/audit', icon: ShieldAlert },
    { name: 'Developer Mode', href: '/developer', icon: Terminal },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide">SMART HOME</h1>
          <p className="text-xs text-teal-400 font-mono">ESP32-S3 Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
          <span>Vercel / Cloudflare</span>
        </span>
        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">v1.0.0</span>
      </div>
    </aside>
  );
}
