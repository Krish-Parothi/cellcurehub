'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, User } from '@/lib/types';
import { updateRepairStatus } from '@/lib/actions/repairs';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Wrench, CheckCircle, Timer, Clock } from 'lucide-react';
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

function getSlaTime(createdAt: string, slaDeadline: string | null) {
  const deadline = slaDeadline ? new Date(slaDeadline).getTime() : new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;
  if (remaining <= 0) return { text: 'SLA EXPIRED', color: 'text-red-600 font-bold animate-pulse', expired: true };
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const color = hours > 24 ? 'text-emerald-600' : hours >= 12 ? 'text-amber-600' : 'text-red-600 animate-pulse font-bold';
  return { text: `${hours}h ${minutes}m left`, color, expired: false };
}

export default function TechnicianDashboard() {
  const [repairs, setRepairs] = useState<RepairWithJoins[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<RepairWithJoins | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setTick] = useState(0);

  // Update SLA timers every minute
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchRepairs = useCallback(async () => {
    const { data, error } = await supabase
      .from('repairs')
      .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)')
      .in('status', ['booked', 'pickup_scheduled', 'device_received', 'diagnostic', 'repair_in_progress', 'qa_testing', 'done'])
      .order('created_at', { ascending: false });
      
    if (error) { toast.error('Failed to fetch repairs'); } 
    else { setRepairs((data as RepairWithJoins[]) || []); }
  }, []);

  const { user, loading } = useAuthFetch(fetchRepairs, {
    requiredRole: ['technician', 'admin', 'shop_admin'],
    realtimeTable: 'repairs',
  });

  const handleStatusUpdate = async (repairId: string, newStatus: string) => {
    console.debug('[TECH:STATUS_UPDATE] Starting...', { repairId, newStatus, userId: user?.id });
    const result = await updateRepairStatus(
      repairId,
      newStatus,
      `Status updated to ${REPAIR_STATUS_LABELS[newStatus as keyof typeof REPAIR_STATUS_LABELS]}`
    );

    if (!result.success) {
      console.error('[TECH:STATUS_UPDATE_ERROR]', result.error);
      toast.error(result.error || 'Failed to update status');
      return;
    }
    
    console.debug('[TECH:STATUS_UPDATE_OK]', { repairId, newStatus });
    toast.success('Status updated');
    setSheetOpen(false);
    fetchRepairs();
  };

  const activeCount = repairs.filter(r => !['done', 'ready', 'delivered'].includes(r.status)).length;
  const completedToday = repairs.filter(r => r.status === 'done' && new Date(r.updated_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Technician Dashboard</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Welcome back, {user?.full_name}</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-white border-[#E8E4DF] px-4 py-3 flex items-center gap-3 shadow-sm">
            <Wrench className="w-5 h-5 text-[#FF5C00]" />
            <div>
              <p className="text-xs text-[#1A1A1A]/50 font-medium">Active Jobs</p>
              <p className="text-lg font-bold text-[#1A1A1A]">{activeCount}</p>
            </div>
          </Card>
          <Card className="bg-white border-[#E8E4DF] px-4 py-3 flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-[#FF5C00]" />
            <div>
              <p className="text-xs text-[#1A1A1A]/50 font-medium">Done Today</p>
              <p className="text-lg font-bold text-[#1A1A1A]">{completedToday}</p>
            </div>
          </Card>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="space-y-3"><Skeleton className="h-8 w-32 bg-[#1A1A1A]/5" />{[0, 1].map(j => <Skeleton key={j} className="h-40 w-full rounded-xl bg-[#1A1A1A]/5" />)}</div>
          ))}
        </div>
      ) : (
        <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory">
          {KANBAN_COLUMNS.map((col, ci) => {
            const colRepairs = repairs.filter(r => col.statuses.includes(r.status));
            return (
              <motion.div key={col.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }} className="min-w-[280px] md:min-w-0 snap-start bg-[#E8E4DF]/20 rounded-2xl p-4 border border-[#E8E4DF]/40">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-sm font-semibold text-[#1A1A1A]/80">{col.label}</h2>
                  <Badge variant="secondary" className="ml-auto text-xs bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 border border-[#FF5C00]/20 font-semibold">{colRepairs.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {colRepairs.map((repair, ri) => {
                    return (
                      <motion.div key={repair.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ri * 0.05 }}
                        onClick={() => { setSelectedRepair(repair); setSheetOpen(true); }}
                        className="bg-white border border-[#E8E4DF] rounded-xl p-4 cursor-pointer hover:border-[#FF5C00]/40 hover:shadow-[0_8px_30px_rgba(255,92,0,0.05)] transition-all group relative overflow-hidden shadow-sm"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: col.color }} />
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-semibold text-[#1A1A1A] truncate pr-2">
                            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
                          </span>
                          {repair.repair_type === 'custom' && <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] absolute right-2 top-2">Custom Repair</Badge>}
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                          <span className="text-xs text-[#1A1A1A]/70 truncate font-medium">{repair.customer?.full_name}</span>
                          <span className="text-xs text-[#1A1A1A]/50 truncate">{repair.repair_type === 'custom' ? repair.custom_repair_description : repair.repair_type?.replace(/_/g, ' ')}</span>
                        </div>
                        {['done', 'out_for_delivery', 'delivered', 'cancelled'].includes(repair.status) ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-700 font-semibold text-xs border border-green-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </div>
                        ) : repair.status === 'wocr' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-700 font-semibold text-xs border border-yellow-500/20">
                            <Clock className="w-3.5 h-3.5" /> WOCR
                          </div>
                        ) : (() => {
                          const sla = getSlaTime(repair.created_at, repair.sla_deadline);
                          return (
                            <div className={`flex items-center gap-1.5 text-[11px] bg-[#F7F7F5] border border-[#E8E4DF] px-2 py-1 rounded w-fit ${sla.color}`}>
                              <Timer className="w-3 h-3" /> {sla.text}
                            </div>
                          );
                        })()}
                      </motion.div>
                    );
                  })}
                  {colRepairs.length === 0 && <div className="h-24 border border-dashed border-[#E8E4DF] rounded-xl flex items-center justify-center text-[#1A1A1A]/30 text-xs bg-white/40">Drop jobs here</div>}
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
        onStatusUpdate={handleStatusUpdate}
        fetchRepairs={fetchRepairs}
      />
    </div>
  );
}
