'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/lib/auth-context';
import { useShopId, clearAdminShopOverride } from '@/lib/use-shop-id';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  LayoutDashboard, Wrench, Users, Package,
  BarChart3, UserCircle, Smartphone, Menu, X, ArrowLeft, Store, Truck, Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/shop-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/shop-admin/repairs', icon: Wrench, label: 'Repairs' },
  { href: '/shop-admin/staff', icon: Users, label: 'Staff' },
  { href: '/shop-admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/shop-admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/shop-admin/customers', icon: UserCircle, label: 'Customers' },
  { href: '/shop-admin/devices', icon: Smartphone, label: 'Devices' },
  { href: '/technician', icon: Activity, label: 'Tech Dashboard' },
  { href: '/delivery', icon: Truck, label: 'Delivery Dashboard' },
];

export default function ShopAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const shopId = useShopId();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopName, setShopName] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  // Fetch shop name for display
  useEffect(() => {
    if (shopId) {
      supabase.from('shops').select('name').eq('id', shopId).single().then(({ data }) => {
        setShopName(data?.name || 'Unknown Shop');
      });
    }
  }, [shopId]);

  const isActive = (href: string) =>
    href === '/shop-admin' ? pathname === '/shop-admin' : pathname.startsWith(href);

  const handleBackToAdmin = () => {
    clearAdminShopOverride();
    router.push('/admin/shops');
  };

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      {/* Shop name badge */}
      {shopName && (
        <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20">
          <Store className="w-3.5 h-3.5 text-[#FF5C00] shrink-0" />
          <span className="text-[#FF5C00] text-xs font-semibold truncate">{shopName}</span>
        </div>
      )}
      {/* Back to admin button */}
      {isAdmin && (
        <button onClick={handleBackToAdmin} className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-xs text-[#FF5C00] hover:bg-[#FF5C00]/10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Admin
        </button>
      )}
      <p className="text-xs text-[#1A1A1A]/40 font-semibold uppercase tracking-wider px-3 mb-2">Shop Admin</p>
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
    <RoleGuard allowedRoles={['shop_admin', 'admin']}>
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
