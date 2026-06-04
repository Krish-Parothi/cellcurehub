'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  LayoutDashboard, Wrench, Users, Package, DollarSign, Smartphone,
  BarChart3, UserCircle, Store, Menu, X, Truck, Activity, Recycle, ShoppingCart
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Command Center' },
  { href: '/admin/repairs', icon: Wrench, label: 'Repairs' },
  { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/admin/shop', icon: ShoppingCart, label: 'Store' },
  { href: '/admin/ewaste', icon: Recycle, label: 'E-Waste' },
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
      <p className="text-xs text-[#1A1A1A]/40 font-semibold uppercase tracking-wider px-3 mb-2">Admin Panel</p>
      {NAV_ITEMS.map(item => (
        <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            isActive(item.href)
              ? 'bg-[#FF5C00]/10 text-[#FF5C00] font-semibold'
              : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
          }`}>
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col text-[#1A1A1A]">
        <Navbar />
        <div className="flex flex-1 pt-20">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-5rem)] border-r border-[#E8E4DF] bg-white sticky top-20 shrink-0">
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#F7F7F5] border-r border-[#E8E4DF] pt-16">
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
                  <X className="w-5 h-5" />
                </button>
                <SidebarContent />
              </aside>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 lg:hidden w-12 h-12 rounded-full bg-[#FF5C00] text-white flex items-center justify-center shadow-lg hover:bg-[#e05200]">
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
