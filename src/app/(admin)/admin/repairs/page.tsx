'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_ORDER } from '@/lib/types';
import type { Repair, RepairStatus, User, RcaReport } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Wrench, Truck, Send, Eye, CheckCircle, XCircle, Loader2, FileSearch, Store, Phone } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const shortId = (id: string) => id.slice(0, 8);
const statusColor = (s: string) => {
  const m: Record<string, string> = {
    booked: 'bg-blue-500/10 text-blue-600', pickup_scheduled: 'bg-cyan-500/10 text-cyan-600',
    device_received: 'bg-indigo-500/10 text-indigo-600', diagnostic: 'bg-yellow-500/15 text-yellow-600',
    repair_in_progress: 'bg-orange-500/10 text-orange-600', qa_testing: 'bg-purple-500/10 text-purple-600',
    ready: 'bg-teal-500/10 text-teal-600', done: 'bg-green-500/10 text-green-600',
    out_for_delivery: 'bg-cyan-500/10 text-cyan-600', delivered: 'bg-emerald-500/10 text-emerald-600',
    pending_approval: 'bg-amber-500/10 text-amber-600',
  };
  return m[s] || 'bg-gray-500/10 text-gray-600';
};

export default function RepairsPage() {

  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRepair, setSelectedRepair] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  
  // SLA Extension
  const [extendSlaDialog, setExtendSlaDialog] = useState(false);
  const [slaExtensionHours, setSlaExtensionHours] = useState('24');
  const [slaExtensionReason, setSlaExtensionReason] = useState('');
  const [extendingSla, setExtendingSla] = useState(false);

  // Assignment
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  // RCA
  const [pendingRcas, setPendingRcas] = useState<any[]>([]);
  const [rcaModal, setRcaModal] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rcaProcessing, setRcaProcessing] = useState(false);

  // Delivery assignments map: repair_id -> { delivery_boy_name, delivery_boy_phone, status }
  const [deliveryMap, setDeliveryMap] = useState<Record<string, { name: string; phone: string; status: string }>>({});

  const fetchRepairs = useCallback(async () => {
    console.debug('[fetchRepairs] starting...');
    try {
      setLoading(true);
      console.debug('[fetchRepairs] querying repairs...');
      const { data, error: err1 } = await supabase.from('repairs')
        .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone), technician:users!repairs_technician_id_fkey(full_name), shop:shops(name)')
        .order('created_at', { ascending: false }).limit(200);
      
      if (err1) {
        console.error('[fetchRepairs] repairs query error:', err1);
      }
      setRepairs(data || []);
      console.debug('[fetchRepairs] repairs count:', data?.length || 0);

      console.debug('[fetchRepairs] querying RCA reports...');
      const { data: rcas, error: err2 } = await supabase.from('rca_reports')
        .select('*, repair:repairs(id, customer:users!repairs_customer_id_fkey(full_name), device:devices(brand, model_name), technician:users!repairs_technician_id_fkey(full_name))')
        .eq('admin_confirmed', false);
      if (err2) {
        console.error('[fetchRepairs] RCA query error:', err2);
      }
      setPendingRcas(rcas || []);

      // Fetch delivery assignments to map delivery boys to repairs
      const repairIds = (data || []).map((r: any) => r.id);
      if (repairIds.length > 0) {
        console.debug('[fetchRepairs] querying delivery assignments...');
        const { data: assignments, error: err3 } = await supabase.from('delivery_assignments')
          .select('repair_id, status, delivery_boy:users!delivery_assignments_delivery_boy_id_fkey(full_name, phone)')
          .in('repair_id', repairIds)
          .order('created_at', { ascending: false });
        if (err3) {
          console.error('[fetchRepairs] delivery assignments query error:', err3);
        }
        const dMap: Record<string, { name: string; phone: string; status: string }> = {};
        (assignments || []).forEach((a: any) => {
          // Only keep the latest assignment per repair
          if (!dMap[a.repair_id]) {
            dMap[a.repair_id] = {
              name: a.delivery_boy?.full_name || 'Unknown',
              phone: a.delivery_boy?.phone || '',
              status: a.status,
            };
          }
        });
        setDeliveryMap(dMap);
      }
      console.debug('[fetchRepairs] completed successfully.');
    } catch (e) {
      console.error('[fetchRepairs] exception caught:', e);
      toast.error('Failed to load repairs');
    } finally {
      console.debug('[fetchRepairs] setting loading to false.');
      setLoading(false);
    }
  }, []);

  const { user } = useAuthFetch(fetchRepairs, {
    requiredRole: 'admin',
    deps: [statusFilter],
    realtimeTable: 'repairs',
  });

  const openRepairSheet = async (repair: any) => {
    console.debug('[OPEN_REPAIR_SHEET]', { repairId: repair.id, status: repair.status });
    setSelectedRepair(repair);
    setSheetOpen(true);
    // Fetch timeline
    const { data: tl } = await supabase.from('repair_timeline').select('*').eq('repair_id', repair.id).order('created_at', { ascending: true });
    setTimeline(tl || []);
    // Fetch assignable staff — include admin for self-assignment
    const { data: techs } = await supabase.from('users').select('*').in('role', ['technician', 'admin']).eq('is_active', true);
    setTechnicians(techs || []);
    const { data: dboys } = await supabase.from('users').select('*').in('role', ['delivery', 'admin']).eq('is_active', true);
    setDeliveryBoys(dboys || []);
    // Fetch shops
    const { data: shopList } = await supabase.from('shops').select('id, name').eq('is_active', true);
    setShops(shopList || []);
  };

  const changeStatus = async (newStatus: string) => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_CHANGE_STATUS]', { repairId: selectedRepair.id, from: selectedRepair.status, to: newStatus, userId: user?.id });
    setAssigning(true);
    const { error } = await supabase.from('repairs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    if (error) { console.debug('[ADMIN_CHANGE_STATUS_ERROR]', error); toast.error('Failed to change status: ' + error.message); setAssigning(false); return; }
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: newStatus,
      note: `Status changed to ${REPAIR_STATUS_LABELS[newStatus as RepairStatus] || newStatus} by admin`, updated_by: user?.id,
    });
    toast.success(`Status → ${REPAIR_STATUS_LABELS[newStatus as RepairStatus] || newStatus}`);
    setSelectedRepair({ ...selectedRepair, status: newStatus });
    setAssigning(false);
    fetchRepairs();
  };

  const assignShop = async (shopId: string) => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_ASSIGN_SHOP]', { repairId: selectedRepair.id, shopId, userId: user?.id });
    setAssigning(true);
    await supabase.from('repairs').update({ shop_id: shopId, updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    const shop = shops.find(s => s.id === shopId);
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: selectedRepair.status,
      note: `Assigned to shop: ${shop?.name}`, updated_by: user?.id,
    });
    toast.success(`Assigned to ${shop?.name}`);
    setAssigning(false);
    setSelectedRepair({ ...selectedRepair, shop_id: shopId, shop: { name: shop?.name } });
    fetchRepairs();
  };

  const assignTechnician = async (techId: string) => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_ASSIGN_TECH]', { repairId: selectedRepair.id, techId, userId: user?.id });
    setAssigning(true);
    const tech = technicians.find(t => t.id === techId);
    const { error } = await supabase.from('repairs').update({ technician_id: techId, updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    if (error) { console.debug('[ADMIN_ASSIGN_TECH_ERROR]', error); toast.error('Failed: ' + error.message); setAssigning(false); return; }
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: selectedRepair.status,
      note: `Technician ${tech?.full_name} assigned`, updated_by: user?.id,
    });
    toast.success('Technician assigned');
    setAssigning(false);
    fetchRepairs();
  };

  const assignDelivery = async (boyId: string) => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_ASSIGN_DELIVERY]', { repairId: selectedRepair.id, boyId, userId: user?.id });
    setAssigning(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Clear any existing dropoff assignment for this device
    await supabase.from('delivery_assignments')
      .delete()
      .eq('repair_id', selectedRepair.id)
      .eq('job_type', 'dropoff');

    const { error } = await supabase.from('delivery_assignments').insert({
      repair_id: selectedRepair.id, delivery_boy_id: boyId, shop_id: selectedRepair.shop_id,
      job_type: 'dropoff', status: 'assigned', scheduled_date: today,
    });
    if (error) { console.debug('[ADMIN_ASSIGN_DELIVERY_ERROR]', error); toast.error('Failed: ' + error.message); setAssigning(false); return; }
    toast.success('Drop-off delivery boy assigned');
    setAssigning(false);
    fetchRepairs();
  };

  const assignPickup = async (boyId: string) => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_ASSIGN_PICKUP]', { repairId: selectedRepair.id, boyId, userId: user?.id });
    setAssigning(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Clear any existing pickup assignment for this device
    await supabase.from('delivery_assignments')
      .delete()
      .eq('repair_id', selectedRepair.id)
      .eq('job_type', 'pickup');

    const { error } = await supabase.from('delivery_assignments').insert({
      repair_id: selectedRepair.id, delivery_boy_id: boyId, shop_id: selectedRepair.shop_id,
      job_type: 'pickup', status: 'assigned', scheduled_date: today,
    });
    
    if (error) { console.debug('[ADMIN_ASSIGN_PICKUP_ERROR]', error); toast.error('Failed: ' + error.message); setAssigning(false); return; }
    
    // Also update repair status to pickup_scheduled
    await supabase.from('repairs').update({ status: 'pickup_scheduled' }).eq('id', selectedRepair.id);
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: 'pickup_scheduled',
      note: 'Pickup scheduled — delivery boy assigned', updated_by: user?.id,
    });

    toast.success('Pickup delivery boy assigned');
    setAssigning(false);
    fetchRepairs();
  };

  const sendOutForDelivery = async () => {
    if (!selectedRepair || selectedRepair.status !== 'done') return;
    console.debug('[ADMIN_SEND_FOR_DELIVERY]', { repairId: selectedRepair.id, userId: user?.id });
    setAssigning(true);
    await supabase.from('repairs').update({ status: 'out_for_delivery', updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: 'out_for_delivery',
      note: 'Ready for delivery — dispatched by admin', updated_by: user?.id,
    });
    toast.success('Sent out for delivery');
    setAssigning(false);
    fetchRepairs();
    setSheetOpen(false);
  };

  const setWocr = async () => {
    if (!selectedRepair) return;
    console.debug('[ADMIN_SET_WOCR]', { repairId: selectedRepair.id, userId: user?.id });
    setAssigning(true);
    await supabase.from('repairs').update({ status: 'wocr', updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: 'wocr',
      note: 'Waiting on Customer Response', updated_by: user?.id,
    });
    toast.success('Status set to Waiting on Customer');
    setSelectedRepair({ ...selectedRepair, status: 'wocr' });
    setAssigning(false);
    fetchRepairs();
  };

  const extendSla = async () => {
    if (!selectedRepair || !slaExtensionReason.trim()) {
      toast.error('Please provide a reason for SLA extension');
      return;
    }
    setExtendingSla(true);
    
    // Calculate new deadline based on current deadline (or created_at + 48h if null)
    const baseDate = selectedRepair.sla_deadline ? new Date(selectedRepair.sla_deadline) : new Date(new Date(selectedRepair.created_at).getTime() + 48 * 60 * 60 * 1000);
    const newDeadline = new Date(baseDate.getTime() + Number(slaExtensionHours) * 60 * 60 * 1000);

    const { error } = await supabase.from('repairs').update({
      sla_deadline: newDeadline.toISOString(),
      sla_extended: true,
      sla_extension_reason: slaExtensionReason
    }).eq('id', selectedRepair.id);

    if (error) {
      toast.error('Failed to extend SLA');
      setExtendingSla(false);
      return;
    }

    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id, status: selectedRepair.status,
      note: `SLA extended by ${slaExtensionHours} hours. Reason: ${slaExtensionReason}`,
      updated_by: user?.id,
    });

    toast.success('SLA extended successfully');
    setExtendSlaDialog(false);
    setSlaExtensionReason('');
    setSlaExtensionHours('24');
    setExtendingSla(false);
    fetchRepairs();
    setSheetOpen(false); // Close sheet to refresh data
  };

  const confirmRca = async (rca: any) => {
    console.debug('[ADMIN_CONFIRM_RCA]', { rcaId: rca.id, repairId: rca.repair_id, userId: user?.id });
    setRcaProcessing(true);
    try {
      const { error: updateErr } = await supabase.from('rca_reports').update({ admin_confirmed: true }).eq('id', rca.id);
      if (updateErr) { console.debug('[ADMIN_CONFIRM_RCA_UPDATE_ERROR]', updateErr); toast.error('Failed to confirm RCA: ' + updateErr.message); setRcaProcessing(false); return; }
      const { error: tlErr } = await supabase.from('repair_timeline').insert({
        repair_id: rca.repair_id, status: 'device_received',
        note: 'RCA confirmed by admin — visible to customer', updated_by: user?.id,
      });
      if (tlErr) console.debug('[ADMIN_CONFIRM_RCA_TIMELINE_ERROR]', tlErr);
      toast.success('RCA confirmed');
      setRcaModal(null);
      fetchRepairs();
    } catch (e) {
      console.debug('[ADMIN_CONFIRM_RCA_EXCEPTION]', e);
      toast.error('RCA confirmation failed');
    }
    setRcaProcessing(false);
  };

  const requestRevision = async (rca: any) => {
    if (!adminNotes.trim()) { toast.error('Please add notes'); return; }
    setRcaProcessing(true);
    await supabase.from('rca_reports').update({ admin_notes: adminNotes }).eq('id', rca.id);
    toast.success('Revision requested');
    setRcaModal(null);
    setAdminNotes('');
    setRcaProcessing(false);
  };

  const filtered = repairs.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.customer?.full_name?.toLowerCase().includes(s) || r.device?.model_name?.toLowerCase().includes(s) || r.id.startsWith(s);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Repairs Management</h1>
        <p className="text-[#1A1A1A]/60 text-sm mt-1">View, assign, and manage all repairs</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#1A1A1A]/40" />
          <Input className="pl-9 bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40" placeholder="Search repairs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
            <SelectItem value="all" className="hover:bg-[#F7F7F5] cursor-pointer">All Status</SelectItem>
            {REPAIR_STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="hover:bg-[#F7F7F5] cursor-pointer">{REPAIR_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Repairs Table */}
      <Card className="bg-white border-[#E8E4DF] shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><Skeleton className="h-64 w-full bg-[#1A1A1A]/5" /></div> : (
            <Table>
              <TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/50">ID</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Customer</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Device</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Status</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Shop</TableHead>
                <TableHead className="text-[#1A1A1A]/50">SLA</TableHead>
                <TableHead className="text-[#1A1A1A]/50 text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map(r => {
                  const slaDeadline = r.sla_deadline ? new Date(r.sla_deadline).getTime() : new Date(r.created_at).getTime() + 48 * 60 * 60 * 1000;
                  const isSlaExpired = Date.now() > slaDeadline && !['done', 'out_for_delivery', 'delivered', 'cancelled'].includes(r.status);
                  
                  return (
                  <TableRow key={r.id} className={`border-[#E8E4DF]/40 hover:bg-[#F7F7F5] transition-colors ${isSlaExpired ? 'bg-red-50/50' : ''}`}>
                    <TableCell className="font-mono text-[#FF5C00] text-xs font-semibold">{shortId(r.id)}</TableCell>
                    <TableCell className="text-[#1A1A1A] font-medium">{r.customer?.full_name}</TableCell>
                    <TableCell className="text-[#1A1A1A]/70">{r.device ? `${r.device.brand} ${r.device.model_name}` : r.manual_model || 'Unknown'}</TableCell>
                    <TableCell><Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status as RepairStatus]}</Badge></TableCell>
                    <TableCell className="text-[#1A1A1A]/70">{r.shop?.name || <span className="text-amber-600 font-medium">Unassigned</span>}</TableCell>
                    <TableCell>
                      {['done', 'out_for_delivery', 'delivered', 'cancelled'].includes(r.status) ? (
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      ) : isSlaExpired ? (
                        <span className="text-xs text-red-600 font-bold animate-pulse">EXPIRED</span>
                      ) : (
                        <span className="text-xs text-[#1A1A1A]/60">{Math.floor((slaDeadline - Date.now()) / (1000 * 60 * 60))}h left</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => openRepairSheet(r)} className="text-[#FF5C00] hover:bg-[#FF5C00]/10 text-xs font-semibold"><Eye className="w-3.5 h-3.5 mr-1" /> View</Button></TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending RCA Reviews */}
      {pendingRcas.length > 0 && (
        <Card className="bg-white border-[#E8E4DF] shadow-sm">
          <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><FileSearch className="w-4 h-4 text-purple-600" /> Pending RCA Reviews ({pendingRcas.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/50">Repair</TableHead><TableHead className="text-[#1A1A1A]/50">Customer</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Device</TableHead><TableHead className="text-[#1A1A1A]/50">Technician</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>{pendingRcas.map(rca => (
                <TableRow key={rca.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                  <TableCell className="font-mono text-[#FF5C00] text-xs font-semibold">{shortId(rca.repair_id)}</TableCell>
                  <TableCell className="text-[#1A1A1A] font-medium">{rca.repair?.customer?.full_name}</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{rca.repair?.device?.brand} {rca.repair?.device?.model_name}</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{rca.repair?.technician?.full_name}</TableCell>
                  <TableCell><Button size="sm" onClick={() => { setRcaModal(rca); setAdminNotes(''); }} className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 text-xs font-semibold"><Eye className="w-3.5 h-3.5 mr-1" />Review</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Repair Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto text-[#1A1A1A]">
          {selectedRepair && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#1A1A1A]">Repair {shortId(selectedRepair.id)}</SheetTitle>
                <SheetDescription className="text-[#1A1A1A]/60">{selectedRepair.issue_description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 pb-12">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Customer</span><p className="text-[#1A1A1A] font-semibold">{selectedRepair.customer?.full_name}</p><p className="text-[#1A1A1A]/60 text-xs">{selectedRepair.customer?.phone}</p></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Device</span><p className="text-[#1A1A1A] font-semibold">{selectedRepair.device?.brand} {selectedRepair.device?.model_name}</p></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Status</span><div className="mt-1"><Badge className={statusColor(selectedRepair.status)}>{REPAIR_STATUS_LABELS[selectedRepair.status as RepairStatus]}</Badge></div></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Shop</span><p className="text-[#1A1A1A] font-semibold">{selectedRepair.shop?.name || <span className="text-amber-600 font-medium">Unassigned</span>}</p></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg col-span-2"><span className="text-[#1A1A1A]/40 text-xs block">Technician</span><p className="text-[#1A1A1A] font-semibold">{selectedRepair.technician?.full_name || 'Unassigned'}</p></div>
                  {deliveryMap[selectedRepair.id] && (
                    <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg col-span-2">
                      <span className="text-[#1A1A1A]/40 text-xs block">Delivery Boy</span>
                      <p className="text-[#1A1A1A] font-semibold">{deliveryMap[selectedRepair.id].name}</p>
                      {deliveryMap[selectedRepair.id].phone && (
                        <a href={`tel:${deliveryMap[selectedRepair.id].phone}`} className="text-[#FF5C00] text-xs flex items-center gap-1 mt-0.5 font-medium"><Phone className="w-3 h-3" />{deliveryMap[selectedRepair.id].phone}</a>
                      )}
                      <Badge className="mt-1 text-[10px] bg-cyan-500/10 text-cyan-600 capitalize">{deliveryMap[selectedRepair.id].status.replace(/_/g, ' ')}</Badge>
                    </div>
                  )}
                </div>

                {(() => {
                  const slaDeadline = selectedRepair.sla_deadline ? new Date(selectedRepair.sla_deadline).getTime() : new Date(selectedRepair.created_at).getTime() + 48 * 60 * 60 * 1000;
                  const isSlaExpired = Date.now() > slaDeadline && !['done', 'out_for_delivery', 'delivered', 'cancelled'].includes(selectedRepair.status);
                  
                  if (isSlaExpired) {
                    return (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                            ⚠️ SLA Expired
                          </div>
                          <p className="text-xs text-red-600/80">This repair has exceeded its 48-hour SLA.</p>
                        </div>
                        <Button size="sm" onClick={() => setExtendSlaDialog(true)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0">Extend SLA</Button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <Separator className="bg-[#E8E4DF]" />

                {/* Status Change — Admin can set ANY status */}
                <div>
                  <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1">⚡ Change Status (Admin)</p>
                  <Select value={selectedRepair.status} onValueChange={(val) => { console.debug('[ADMIN_STATUS_SELECT]', val); changeStatus(val); }} disabled={assigning}>
                    <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                      {REPAIR_STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="hover:bg-[#F7F7F5] cursor-pointer">{REPAIR_STATUS_LABELS[s as RepairStatus]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-[#E8E4DF]" />

                {/* Shop Assignment */}
                <div>
                  <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Store className="w-3 h-3" /> Assign to Shop</p>
                  <Select value={selectedRepair.shop_id || ''} onValueChange={assignShop} disabled={assigning}>
                    <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select shop..." /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                      {shops.map(s => <SelectItem key={s.id} value={s.id} className="hover:bg-[#F7F7F5] cursor-pointer">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Technician Assignment (includes admin for self-assign) */}
                <div>
                  <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Wrench className="w-3 h-3" /> Assign Technician</p>
                  <Select onValueChange={assignTechnician} disabled={assigning}>
                    <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select technician..." /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                      {technicians.map(t => <SelectItem key={t.id} value={t.id} className="hover:bg-[#F7F7F5] cursor-pointer">{t.full_name} {t.role === 'admin' ? '(Admin)' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pickup Assignment (if home pickup and booked) */}
                {selectedRepair.pickup_type === 'home' && selectedRepair.status === 'booked' && (
                  <div>
                    <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Truck className="w-3 h-3 text-[#FF5C00]" /> Assign Pickup Boy</p>
                    <Select onValueChange={assignPickup} disabled={assigning}>
                      <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select pickup boy..." /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                        {deliveryBoys.map(d => <SelectItem key={d.id} value={d.id} className="hover:bg-[#F7F7F5] cursor-pointer">{d.full_name} {d.role === 'admin' ? '(Admin)' : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Drop-off Assignment (if ready/done) */}
                {(selectedRepair.status === 'ready' || selectedRepair.status === 'done') && (
                  <div>
                    <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Truck className="w-3 h-3" /> Assign Drop-off Boy</p>
                    <Select onValueChange={assignDelivery} disabled={assigning}>
                      <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select drop-off boy..." /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                        {deliveryBoys.map(d => <SelectItem key={d.id} value={d.id} className="hover:bg-[#F7F7F5] cursor-pointer">{d.full_name} {d.role === 'admin' ? '(Admin)' : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Send Out for Delivery */}
                {selectedRepair.status === 'done' && (
                  <Button onClick={sendOutForDelivery} disabled={assigning} className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold">
                    {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Out for Delivery
                  </Button>
                )}

                {/* Set WOCR */}
                {selectedRepair.status !== 'wocr' && !['done', 'out_for_delivery', 'delivered', 'cancelled'].includes(selectedRepair.status) && (
                  <Button onClick={setWocr} disabled={assigning} variant="outline" className="w-full border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 font-bold">
                    Set "Waiting on Customer Response" (WOCR)
                  </Button>
                )}

                <Separator className="bg-[#E8E4DF]" />

                {/* Timeline */}
                <div>
                  <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold">Repair Timeline</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {timeline.map(t => (
                      <div key={t.id} className="flex items-start gap-2 text-xs">
                        <Badge className={`shrink-0 text-[9px] ${statusColor(t.status)}`}>{REPAIR_STATUS_LABELS[t.status as RepairStatus] || t.status}</Badge>
                        <span className="text-[#1A1A1A]/60 flex-1">{t.note}</span>
                        <span className="text-[#1A1A1A]/40 shrink-0">{new Date(t.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    {timeline.length === 0 && <p className="text-[#1A1A1A]/30 text-center py-4">No timeline entries</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* RCA Review Modal */}
      <Dialog open={!!rcaModal} onOpenChange={() => setRcaModal(null)}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-lg text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">RCA Review</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60">Review diagnostic report from technician</DialogDescription>
          </DialogHeader>
          {rcaModal && (
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
              <div><p className="text-[#1A1A1A]/40 text-xs mb-1 font-semibold">Diagnostic Checklist</p>
                <div className="grid grid-cols-2 gap-1">{Object.entries(rcaModal.diagnostic_checklist || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs">
                    {v ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                    <span className="text-[#1A1A1A]/70">{k.replace(/_/g, ' ')}</span>
                  </div>
                ))}</div>
              </div>
              {rcaModal.before_photos?.length > 0 && (
                <div><p className="text-[#1A1A1A]/40 text-xs mb-1 font-semibold">Before Photos</p>
                  <div className="flex gap-2 flex-wrap">{rcaModal.before_photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="before" className="w-20 h-20 rounded-lg object-cover border border-[#E8E4DF]" />
                  ))}</div>
                </div>
              )}
              {rcaModal.after_photos?.length > 0 && (
                <div><p className="text-[#1A1A1A]/40 text-xs mb-1 font-semibold">After Photos</p>
                  <div className="flex gap-2 flex-wrap">{rcaModal.after_photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="after" className="w-20 h-20 rounded-lg object-cover border border-[#E8E4DF]" />
                  ))}</div>
                </div>
              )}
              <div><p className="text-[#1A1A1A]/40 text-xs mb-1 font-semibold">Technician Notes</p><p className="text-[#1A1A1A]/80">{rcaModal.technician_notes}</p></div>
              <Separator className="bg-[#E8E4DF]" />
              <div><p className="text-[#1A1A1A]/40 text-xs mb-1 font-semibold">Admin Notes (for revision request)</p>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes if requesting revision..." className="bg-white border-[#E8E4DF] text-[#1A1A1A] min-h-[60px] placeholder:text-[#1A1A1A]/30" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => requestRevision(rcaModal)} disabled={rcaProcessing} className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-semibold">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Request Revision
            </Button>
            <Button onClick={() => confirmRca(rcaModal)} disabled={rcaProcessing} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold">
              {rcaProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />} Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Extend SLA Dialog */}
      <Dialog open={extendSlaDialog} onOpenChange={setExtendSlaDialog}>
        <DialogContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle>Extend SLA</DialogTitle>
            <DialogDescription>Add more time to the SLA deadline and provide a reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]/70">Extension Time</label>
              <Select value={slaExtensionHours} onValueChange={setSlaExtensionHours}>
                <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                  <SelectItem value="12">+12 Hours</SelectItem>
                  <SelectItem value="24">+24 Hours</SelectItem>
                  <SelectItem value="48">+48 Hours</SelectItem>
                  <SelectItem value="72">+72 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]/70">Reason for Extension (Required)</label>
              <Textarea 
                value={slaExtensionReason} 
                onChange={e => setSlaExtensionReason(e.target.value)} 
                placeholder="e.g. Waiting for specific parts to arrive..."
                className="bg-white border-[#E8E4DF] text-[#1A1A1A] min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendSlaDialog(false)} className="border-[#E8E4DF] text-[#1A1A1A]">Cancel</Button>
            <Button onClick={extendSla} disabled={extendingSla || !slaExtensionReason.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
              {extendingSla ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirm Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
