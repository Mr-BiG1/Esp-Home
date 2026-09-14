import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'ESP32 Smart Home Platform',
  description: 'Production Edge Controller & Cloud Management Plane',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
