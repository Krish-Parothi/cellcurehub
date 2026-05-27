'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  LayoutDashboard, Wrench, Users, Package, DollarSign, Smartphone,
  BarChart3, UserCircle, Store, Menu, X, Truck, Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Command Center' },
  { href: '/admin/repairs', icon: Wrench, label: 'Repairs' },
  { href: '/admin/staff', icon: Users, label: 'Staff' },
  { href: '/admin/pricing', icon: DollarSign, label: 'Pricing' },
  { href: '/admin/devices', icon: Smartphone, label: 'Devices' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/customers', icon: UserCircle, label: 'Customers' },
  { href: '/admin/shops', icon: Store, label: 'Shops' },
  { href: '/technician', icon: Activity, label: 'Tech Dashboard' },
  { href: '/delivery', icon: Truck, label: 'Delivery Dashboard' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      <p className="text-xs text-white/30 font-semibold uppercase tracking-wider px-3 mb-2">Admin Panel</p>
      {NAV_ITEMS.map(item => (
        <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            isActive(item.href)
              ? 'bg-[#00D084]/10 text-[#00D084] font-semibold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}>
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <div className="flex flex-1 pt-20">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-5rem)] border-r border-white/5 bg-white/[0.02] sticky top-20 shrink-0">
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-white/10 pt-16">
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <SidebarContent />
              </aside>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 lg:hidden w-12 h-12 rounded-full bg-[#00D084] text-black flex items-center justify-center shadow-lg">
            <Menu className="w-5 h-5" />
          </button>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}
