'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, User } from '@/lib/types';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Wrench, CheckCircle, Timer } from 'lucide-react';
import JobDetailSheet from './_components/job-detail-sheet';

type RepairWithJoins = Repair & {
  device: { brand: string; model_name: string; category: string } | null;
  customer: { full_name: string; phone: string | null } | null;
};

const KANBAN_COLUMNS = [
  { label: 'New', statuses: ['booked', 'pickup_scheduled'], color: '#FF5C00' },
  { label: 'Assigned', statuses: ['device_received', 'diagnostic'], color: '#3B82F6' },
  { label: 'In Progress', statuses: ['repair_in_progress'], color: '#F59E0B' },
  { label: 'QA Testing', statuses: ['qa_testing'], color: '#8B5CF6' },
  { label: 'Done', statuses: ['done'], color: '#00D084' },
];

function getSlaTime(createdAt: string) {
  const deadline = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;
  if (remaining <= 0) return { text: 'SLA EXPIRED', color: 'text-red-500 font-bold animate-pulse', expired: true };
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const color = hours > 24 ? 'text-[#00D084]' : hours >= 12 ? 'text-amber-500' : 'text-red-500 animate-pulse font-bold';
  return { text: `${hours}h ${minutes}m left`, color, expired: false };
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<RepairWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<RepairWithJoins | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setTick] = useState(0);

  // Update SLA timers every minute
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchRepairs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('repairs')
      .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)')
      .eq('technician_id', user.id)
      .in('status', ['booked', 'pickup_scheduled', 'device_received', 'diagnostic', 'repair_in_progress', 'qa_testing', 'done'])
      .order('created_at', { ascending: false });
      
    if (error) { toast.error('Failed to fetch repairs'); } 
    else { setRepairs((data as RepairWithJoins[]) || []); }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'technician' || user.role === 'admin' || user.role === 'shop_admin')) {
      fetchRepairs();
      
      // Realtime subscription
      const channel = supabase
        .channel('technician_repairs')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'repairs',
          filter: `technician_id=eq.${user.id}`
        }, (payload) => {
          fetchRepairs(); // Refetch to get joins easily
        })
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchRepairs]);

  const updateStatus = async (repairId: string, newStatus: string) => {
    console.debug('[TECH_UPDATE_STATUS]', { repairId, newStatus, userId: user?.id });
    const { error } = await supabase.from('repairs').update({ status: newStatus }).eq('id', repairId);
    if (error) { console.debug('[TECH_UPDATE_STATUS_ERROR]', error); toast.error('Failed to update status: ' + error.message); return; }
    
    await supabase.from('repair_timeline').insert({
      repair_id: repairId,
      status: newStatus,
      note: `Status updated to ${REPAIR_STATUS_LABELS[newStatus as keyof typeof REPAIR_STATUS_LABELS]}`,
      updated_by: user!.id,
    });
    
    toast.success('Status updated');
    setSheetOpen(false);
    fetchRepairs();
  };

  const activeCount = repairs.filter(r => !['done', 'ready', 'delivered'].includes(r.status)).length;
  const completedToday = repairs.filter(r => r.status === 'done' && new Date(r.updated_at).toDateString() === new Date().toDateString()).length;

  return (
    <RoleGuard allowedRoles={['technician', 'admin', 'shop_admin']}>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Technician Dashboard</h1>
              <p className="text-white/50 text-sm mt-1">Welcome back, {user?.full_name}</p>
            </div>
            <div className="flex gap-4">
              <Card className="bg-white/5 border-white/10 px-4 py-3 flex items-center gap-3">
                <Wrench className="w-5 h-5 text-[#00D084]" />
                <div>
                  <p className="text-xs text-white/50">Active Jobs</p>
                  <p className="text-lg font-bold text-white">{activeCount}</p>
                </div>
              </Card>
              <Card className="bg-white/5 border-white/10 px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#00D084]" />
                <div>
                  <p className="text-xs text-white/50">Done Today</p>
                  <p className="text-lg font-bold text-white">{completedToday}</p>
                </div>
              </Card>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="space-y-3"><Skeleton className="h-8 w-32 bg-white/5" />{[0, 1].map(j => <Skeleton key={j} className="h-40 w-full rounded-xl bg-white/5" />)}</div>
              ))}
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory">
              {KANBAN_COLUMNS.map((col, ci) => {
                const colRepairs = repairs.filter(r => col.statuses.includes(r.status));
                return (
                  <motion.div key={col.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }} className="min-w-[280px] md:min-w-0 snap-start bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <h2 className="text-sm font-semibold text-white/80">{col.label}</h2>
                      <Badge variant="secondary" className="ml-auto text-xs bg-white/10 text-white hover:bg-white/20">{colRepairs.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {colRepairs.map((repair, ri) => {
                        const sla = getSlaTime(repair.created_at);
                        return (
                          <motion.div key={repair.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ri * 0.05 }}
                            onClick={() => { setSelectedRepair(repair); setSheetOpen(true); }}
                            className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#00D084]/50 transition-colors shadow-lg group relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: col.color }} />
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-semibold text-white truncate pr-2">
                                {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
                              </span>
                              {repair.approval_status === 'pending' && <Badge className="bg-amber-500/20 text-amber-500 text-[10px] absolute right-2 top-2">Waiting Approval</Badge>}
                            </div>
                            <div className="flex flex-col gap-1 mb-3">
                              <span className="text-xs text-white/60 truncate">{repair.customer?.full_name}</span>
                              <span className="text-xs text-white/40 truncate">{repair.repair_type === 'custom' ? repair.custom_repair_description : repair.repair_type?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 text-[11px] bg-black/40 px-2 py-1 rounded w-fit ${sla.color}`}>
                              <Timer className="w-3 h-3" /> {sla.text}
                            </div>
                          </motion.div>
                        );
                      })}
                      {colRepairs.length === 0 && <div className="h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs">Drop jobs here</div>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <JobDetailSheet 
            repair={selectedRepair} 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
            onStatusUpdate={updateStatus}
            fetchRepairs={fetchRepairs}
          />
        </main>
        
        <Footer />
      </div>
    </RoleGuard>
  );
}
