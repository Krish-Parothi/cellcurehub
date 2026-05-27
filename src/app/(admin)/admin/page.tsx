'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
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
    booked: 'bg-blue-500/20 text-blue-400', pickup_scheduled: 'bg-cyan-500/20 text-cyan-400',
    device_received: 'bg-indigo-500/20 text-indigo-400', diagnostic: 'bg-yellow-500/20 text-yellow-400',
    repair_in_progress: 'bg-orange-500/20 text-orange-400', qa_testing: 'bg-purple-500/20 text-purple-400',
    ready: 'bg-teal-500/20 text-teal-400', done: 'bg-green-500/20 text-green-400',
    out_for_delivery: 'bg-cyan-500/20 text-cyan-400', delivered: 'bg-emerald-500/20 text-emerald-400',
  };
  return m[s] || 'bg-gray-500/20 text-gray-400';
};

export default function CommandCenter() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ openRepairs: 0, outForDelivery: 0, todayRevenue: 0, pendingPayments: 0, pendingApprovals: 0, pendingRca: 0 });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [openRes, ofdRes, revRes, pendRes, apprRes, rcaRes, tlRes, fuRes] = await Promise.all([
      supabase.from('repairs').select('id', { count: 'exact', head: true }).not('status', 'in', '("delivered","cancelled")'),
      supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('status', 'out_for_delivery'),
      supabase.from('invoices').select('total').eq('payment_status', 'paid').gte('created_at', today),
      supabase.from('invoices').select('total').eq('payment_status', 'pending'),
      supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabase.from('rca_reports').select('id', { count: 'exact', head: true }).eq('admin_confirmed', false),
      supabase.from('repair_timeline').select('*, repair:repairs(id, customer:users!repairs_customer_id_fkey(full_name), device:devices(brand, model_name))').order('created_at', { ascending: false }).limit(20),
      supabase.from('repairs').select('*, customer:users!repairs_customer_id_fkey(full_name, phone), device:devices(model_name)').eq('status', 'delivered').eq('follow_up_sent', false),
    ]);

    const todayRev = (revRes.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0);
    const pendPay = (pendRes.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0);

    setStats({
      openRepairs: openRes.count || 0,
      outForDelivery: ofdRes.count || 0,
      todayRevenue: todayRev,
      pendingPayments: pendPay,
      pendingApprovals: apprRes.count || 0,
      pendingRca: rcaRes.count || 0,
    });
    setTimeline(tlRes.data || []);

    // Filter 48h+ follow-ups client-side
    const now = Date.now();
    const fups = (fuRes.data || []).filter((r: any) => {
      const delivered = r.delivered_at ? new Date(r.delivered_at).getTime() : new Date(r.updated_at).getTime();
      return (now - delivered) > 48 * 60 * 60 * 1000;
    });
    setFollowUps(fups);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
      // Realtime subscriptions
      const ch1 = supabase.channel('admin_repairs').on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => fetchData()).subscribe();
      const ch2 = supabase.channel('admin_timeline').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'repair_timeline' }, () => fetchData()).subscribe();
      const ch3 = supabase.channel('admin_invoices').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData()).subscribe();
      return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
    }
  }, [user, fetchData]);

  const sendFollowUp = async (repair: any) => {
    const phone = repair.customer?.phone?.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hi ${repair.customer?.full_name}, thank you for choosing CellCureHub! We hope your device is working perfectly. If you have any issues, please don't hesitate to reach out. — CellCureHub Team`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
    await supabase.from('repairs').update({ follow_up_sent: true }).eq('id', repair.id);
    setFollowUps(prev => prev.filter(r => r.id !== repair.id));
    toast.success('Follow-up marked as sent');
  };

  const statCards = [
    { icon: Wrench, label: 'Open Repairs', value: stats.openRepairs, color: 'text-blue-400' },
    { icon: Truck, label: 'Out for Delivery', value: stats.outForDelivery, color: 'text-cyan-400' },
    { icon: IndianRupee, label: "Today's Revenue", value: `₹${fmt(stats.todayRevenue)}`, color: 'text-[#00D084]' },
    { icon: Clock, label: 'Pending Payments', value: `₹${fmt(stats.pendingPayments)}`, color: 'text-amber-400' },
    { icon: AlertTriangle, label: 'Pending Approvals', value: stats.pendingApprovals, color: 'text-red-400' },
    { icon: FileSearch, label: 'Pending RCA Reviews', value: stats.pendingRca, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-white/50 text-sm mt-1">Real-time overview of all operations</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-white/5 border-white/10 hover:border-[#00D084]/20 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Feed */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-[#00D084]" /> Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}</div> : (
            <div className="max-h-80 overflow-y-auto">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] text-sm">
                  <Badge className={`shrink-0 text-[10px] ${statusColor(t.status)}`}>{REPAIR_STATUS_LABELS[t.status as RepairStatus] || t.status}</Badge>
                  <span className="text-white/80 truncate flex-1">
                    {t.repair?.customer?.full_name || 'Customer'} — {t.repair?.device?.brand} {t.repair?.device?.model_name}
                  </span>
                  <span className="text-white/30 text-xs shrink-0">{t.note?.slice(0, 40)}</span>
                  <span className="text-white/20 text-xs shrink-0">{new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              {timeline.length === 0 && <p className="text-white/30 text-center py-8">No recent activity</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 48-Hour Follow-up Queue */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-400" /> 48-Hour Follow-up Queue ({followUps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4"><Skeleton className="h-20 w-full bg-white/5" /></div> : followUps.length === 0 ? (
            <p className="text-white/30 text-center py-8">No pending follow-ups</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Customer</TableHead>
                <TableHead className="text-white/50">Phone</TableHead>
                <TableHead className="text-white/50">Device</TableHead>
                <TableHead className="text-white/50">Delivered</TableHead>
                <TableHead className="text-white/50">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {followUps.map((r: any) => (
                  <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-white">{r.customer?.full_name}</TableCell>
                    <TableCell className="text-white/60">{r.customer?.phone}</TableCell>
                    <TableCell className="text-white/60">{r.device?.model_name || r.manual_model}</TableCell>
                    <TableCell className="text-white/40 text-xs">{new Date(r.delivered_at || r.updated_at).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => sendFollowUp(r)} className="bg-green-600 hover:bg-green-700 text-white text-xs">
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
