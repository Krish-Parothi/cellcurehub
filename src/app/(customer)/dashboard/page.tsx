'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry, Ewaste, Review, RcaReport, Invoice } from '@/lib/types';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import VerticalTimeline from '@/components/vertical-timeline';
import RcaModal from '@/components/rca-modal';
import ActiveTab from './_tabs/active-tab';
import HistoryTab from './_tabs/history-tab';
import AnalyticsTab from './_tabs/analytics-tab';
import EwasteTab from './_tabs/ewaste-tab';
import ProfileTab from './_tabs/profile-tab';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Wrench, History, Recycle, ChartBar as BarChart3, User, LogOut, Settings } from 'lucide-react';

type Tab = 'active' | 'history' | 'analytics' | 'ewaste' | 'profile';
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'active', label: 'Active Repairs', icon: Wrench },
  { key: 'history', label: 'Repair History', icon: History },
  { key: 'analytics', label: 'Spend Analytics', icon: BarChart3 },
  { key: 'ewaste', label: 'E-Waste Portal', icon: Recycle },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('active');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => { await signOut(); router.replace('/login'); };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#00D084] border-t-transparent animate-spin" />
    </div>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 border-2 border-[#00D084]/30 mb-3">
          {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
          <AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xl font-bold">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <h3 className="text-white font-semibold text-sm">{user?.full_name}</h3>
        <p className="text-white/40 text-xs mt-0.5">{user?.email}</p>
      </div>
      <Separator className="bg-white/10" />
      <nav className="flex-1 p-3 space-y-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setDrawerOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === key ? 'bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/20' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"><LogOut className="w-4 h-4" />Logout</button>
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={['customer', 'admin']}>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
        </div>
        <div className="flex flex-1 pt-20 relative z-10">
          <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md h-[calc(100vh-5rem)] sticky top-20"><Sidebar /></aside>
          <AnimatePresence>
            {drawerOpen && (<>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
              <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 w-72 bg-[#0A0A0A] border-r border-white/10 z-50 lg:hidden"><Sidebar /></motion.aside>
            </>)}
          </AnimatePresence>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <div className="lg:hidden flex items-center justify-between mb-6">
              <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 text-white/70 hover:text-white"><Settings className="w-5 h-5" /><span className="text-sm font-medium">Menu</span></button>
              <h2 className="text-lg font-semibold text-white">{TABS.find(t => t.key === tab)?.label}</h2>
              <div className="w-16" />
            </div>
            {tab === 'active' && user && <ActiveTab userId={user.id} />}
            {tab === 'history' && user && <HistoryTab userId={user.id} />}
            {tab === 'analytics' && user && <AnalyticsTab userId={user.id} />}
            {tab === 'ewaste' && user && <EwasteTab userId={user.id} />}
            {tab === 'profile' && user && <ProfileTab user={user} />}
          </main>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}
