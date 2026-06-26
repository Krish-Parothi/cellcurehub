'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { RepairStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Wrench, Truck, IndianRupee, Clock, AlertTriangle, FileSearch, MessageSquare, Activity } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const statusColor = (s: string) => {
  const m: Record<string, string> = {
    booked: 'bg-blue-500/10 text-blue-600', pickup_scheduled: 'bg-cyan-500/10 text-cyan-600',
    device_received: 'bg-indigo-500/10 text-indigo-600', dropped_at_store: 'bg-blue-600/10 text-blue-700', diagnostic: 'bg-yellow-500/15 text-yellow-600',
    repair_in_progress: 'bg-orange-500/10 text-orange-600', qa_testing: 'bg-purple-500/10 text-purple-600',
    ready: 'bg-teal-500/10 text-teal-600', done: 'bg-green-500/10 text-green-600',
    out_for_delivery: 'bg-cyan-500/10 text-cyan-600', delivered: 'bg-emerald-500/10 text-emerald-600',
  };
  return m[s] || 'bg-gray-500/10 text-gray-600';
};

export default function CommandCenter() {
  const [stats, setStats] = useState({ openRepairs: 0, outForDelivery: 0, todayRevenue: 0, pendingPayments: 0, pendingEwaste: 0, pendingRca: 0 });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [openRes, ofdRes, revRes, pendRes, apprRes, rcaRes, tlRes, fuRes] = await Promise.all([
      supabase.from('repairs').select('id', { count: 'exact', head: true }).not('status', 'in', '("delivered","cancelled")'),
      supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('status', 'out_for_delivery'),
      supabase.from('invoices').select('total').eq('payment_status', 'paid').gte('created_at', today),
      supabase.from('invoices').select('total').eq('payment_status', 'pending'),
      supabase.from('ewaste').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('rca_reports').select('id', { count: 'exact', head: true }).eq('admin_confirmed', false),
      supabase.from('repair_timeline').select('*, repair:repairs!inner(id, status, customer:users!repairs_customer_id_fkey(full_name), device:devices(brand, model_name))').not('repair.status', 'in', '("delivered","done","cancelled")').order('created_at', { ascending: false }).limit(20),
      supabase.from('repairs').select('*, customer:users!repairs_customer_id_fkey(full_name, phone), device:devices(model_name)').eq('status', 'delivered').eq('follow_up_sent', false),
    ]);

    const todayRev = (revRes.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0);
    const pendPay = (pendRes.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0);

    setStats({
      openRepairs: openRes.count || 0,
      outForDelivery: ofdRes.count || 0,
      todayRevenue: todayRev,
      pendingPayments: pendPay,
      pendingEwaste: apprRes.count || 0,
      pendingRca: rcaRes.count || 0,
    });
    setTimeline(tlRes.data || []);

    const now = Date.now();
    const fups = (fuRes.data || []).filter((r: any) => {
      const delivered = r.delivered_at ? new Date(r.delivered_at).getTime() : new Date(r.updated_at).getTime();
      return (now - delivered) > 48 * 60 * 60 * 1000;
    });
    setFollowUps(fups);
  }, []);

  const { loading } = useAuthFetch(fetchDashboardData, {
    requiredRole: 'admin',
    realtimeTable: 'repairs',
  });

  const sendFollowUp = async (repair: any) => {
    const phone = repair.customer?.phone?.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hi ${repair.customer?.full_name}, thank you for choosing CellCureHub! We hope your device is working perfectly. If you have any issues, please don't hesitate to reach out. — CellCureHub Team`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
    await supabase.from('repairs').update({ follow_up_sent: true }).eq('id', repair.id);
    setFollowUps(prev => prev.filter(r => r.id !== repair.id));
    toast.success('Follow-up marked as sent');
  };

  const statCards = [
    { icon: Wrench, label: 'Open Repairs', value: stats.openRepairs, color: 'text-blue-600' },
    { icon: Truck, label: 'Out for Delivery', value: stats.outForDelivery, color: 'text-cyan-600' },
    { icon: IndianRupee, label: "Today's Revenue", value: `₹${fmt(stats.todayRevenue)}`, color: 'text-[#FF5C00]' },
    { icon: Clock, label: 'Pending Payments', value: `₹${fmt(stats.pendingPayments)}`, color: 'text-amber-600' },
    { icon: AlertTriangle, label: 'Pending E-waste Valuations', value: stats.pendingEwaste, color: 'text-red-600' },
    { icon: FileSearch, label: 'Pending RCA Reviews', value: stats.pendingRca, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Command Center</h1>
        <p className="text-[#1A1A1A]/60 text-sm mt-1">Real-time overview of all operations</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-white border-[#E8E4DF] shadow-sm hover:border-[#FF5C00]/30 hover:shadow-[0_8px_30px_rgba(255,92,0,0.05)] transition-all h-full">
              <CardContent className="p-3 sm:p-5 flex items-start sm:items-center justify-between h-full">
                <div className="pr-1 sm:pr-2">
                  <p className="text-[11px] sm:text-xs text-[#1A1A1A]/50 font-medium leading-tight">{s.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#1A1A1A] mt-1">{loading ? '...' : s.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#F7F7F5] shrink-0 flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm">
        <CardHeader className="pb-3 border-b border-[#E8E4DF]">
          <CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-[#FF5C00]" /> Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-10 w-full bg-[#1A1A1A]/5" />)}</div> : (
            <div className="max-h-80 overflow-y-auto">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E4DF]/60 hover:bg-[#F7F7F5] text-sm">
                  <Badge className={`shrink-0 text-[10px] ${statusColor(t.status)}`}>{REPAIR_STATUS_LABELS[t.status as RepairStatus] || t.status}</Badge>
                  <span className="text-[#1A1A1A]/80 truncate flex-1">
                    {t.repair?.customer?.full_name || 'Customer'} — {t.repair?.device?.brand} {t.repair?.device?.model_name}
                  </span>
                  <span className="text-[#1A1A1A]/50 text-xs shrink-0">{t.note?.slice(0, 40)}</span>
                  <span className="text-[#1A1A1A]/30 text-xs shrink-0">{new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              {timeline.length === 0 && <p className="text-[#1A1A1A]/40 text-center py-8">No recent activity</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 48-Hour Follow-up Queue */}
      <Card className="bg-white border-[#E8E4DF] shadow-sm">
        <CardHeader className="pb-3 border-b border-[#E8E4DF]">
          <CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-500" /> 48-Hour Follow-up Queue ({followUps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4"><Skeleton className="h-20 w-full bg-[#1A1A1A]/5" /></div> : followUps.length === 0 ? (
            <p className="text-[#1A1A1A]/40 text-center py-8">No pending follow-ups</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/55">Customer</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Phone</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Device</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Delivered</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {followUps.map((r: any) => (
                  <TableRow key={r.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]">
                    <TableCell className="text-[#1A1A1A] font-medium">{r.customer?.full_name}</TableCell>
                    <TableCell className="text-[#1A1A1A]/70">{r.customer?.phone}</TableCell>
                    <TableCell className="text-[#1A1A1A]/70">{r.device?.model_name || r.manual_model}</TableCell>
                    <TableCell className="text-[#1A1A1A]/50 text-xs">{new Date(r.delivered_at || r.updated_at).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => sendFollowUp(r)} className="bg-[#FF5C00] hover:bg-[#e05200] text-white text-xs font-semibold">
                        <MessageSquare className="w-3 h-3 mr-1" /> Send WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
