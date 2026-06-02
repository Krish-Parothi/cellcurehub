'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useShopId } from '@/lib/use-shop-id';
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_ORDER } from '@/lib/types';
import type { RepairStatus, User } from '@/lib/types';
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
import { Search, Wrench, Truck, Send, Eye, CheckCircle, XCircle, Loader2, FileSearch } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const shortId = (id: string) => id.slice(0, 8);
const statusColor = (s: string) => {
  const m: Record<string, string> = {
    booked: 'bg-blue-500/10 text-blue-600', pickup_scheduled: 'bg-cyan-500/10 text-cyan-600',
    device_received: 'bg-indigo-500/10 text-indigo-600', diagnostic: 'bg-yellow-500/15 text-yellow-600',
    repair_in_progress: 'bg-orange-500/10 text-orange-600', qa_testing: 'bg-purple-500/10 text-purple-600',
    ready: 'bg-teal-500/10 text-teal-600', done: 'bg-green-500/10 text-green-600',
    out_for_delivery: 'bg-cyan-500/10 text-cyan-600', delivered: 'bg-emerald-500/10 text-emerald-600',
  };
  return m[s] || 'bg-gray-500/10 text-gray-600';
};

export default function ShopRepairsPage() {
  const { user } = useAuth();
  const shopId = useShopId();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRepair, setSelectedRepair] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [pendingRcas, setPendingRcas] = useState<any[]>([]);
  const [rcaModal, setRcaModal] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rcaProcessing, setRcaProcessing] = useState(false);

  const fetchRepairs = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const { data } = await supabase.from('repairs')
      .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone), technician:users!repairs_technician_id_fkey(full_name)')
      .eq('shop_id', shopId).order('created_at', { ascending: false }).limit(200);
    setRepairs(data || []);

    const { data: rcas } = await supabase.from('rca_reports')
      .select('*, repair:repairs!inner(id, shop_id, customer:users!repairs_customer_id_fkey(full_name), device:devices(brand, model_name), technician:users!repairs_technician_id_fkey(full_name))')
      .eq('repair.shop_id', shopId).eq('admin_confirmed', false);
    setPendingRcas(rcas || []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { if ((user?.role === 'shop_admin' || user?.role === 'admin') && shopId) fetchRepairs(); }, [user, shopId, fetchRepairs]);

  const openRepairSheet = async (repair: any) => {
    console.debug('[SHOP_OPEN_REPAIR]', { repairId: repair.id, status: repair.status });
    setSelectedRepair(repair);
    setSheetOpen(true);
    const { data: tl } = await supabase.from('repair_timeline').select('*').eq('repair_id', repair.id).order('created_at', { ascending: true });
    setTimeline(tl || []);
    const { data: techs } = await supabase.from('users').select('*').in('role', ['technician', 'shop_admin', 'admin']).eq('shop_id', shopId).eq('is_active', true);
    setTechnicians(techs || []);
    const { data: dboys } = await supabase.from('users').select('*').in('role', ['delivery', 'shop_admin', 'admin']).eq('shop_id', shopId).eq('is_active', true);
    setDeliveryBoys(dboys || []);
  };

  const changeStatus = async (newStatus: string) => {
    if (!selectedRepair) return;
    console.debug('[SHOP_CHANGE_STATUS]', { repairId: selectedRepair.id, from: selectedRepair.status, to: newStatus, userId: user?.id });
    setAssigning(true);
    const { error } = await supabase.from('repairs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    if (error) { console.debug('[SHOP_CHANGE_STATUS_ERROR]', error); toast.error('Failed: ' + error.message); setAssigning(false); return; }
    await supabase.from('repair_timeline').insert({ repair_id: selectedRepair.id, status: newStatus, note: `Status changed to ${REPAIR_STATUS_LABELS[newStatus as RepairStatus] || newStatus} by shop admin`, updated_by: user?.id });
    toast.success(`Status → ${REPAIR_STATUS_LABELS[newStatus as RepairStatus] || newStatus}`);
    setSelectedRepair({ ...selectedRepair, status: newStatus });
    setAssigning(false); fetchRepairs();
  };

  const assignTechnician = async (techId: string) => {
    if (!selectedRepair) return;
    console.debug('[SHOP_ASSIGN_TECH]', { repairId: selectedRepair.id, techId });
    setAssigning(true);
    const tech = technicians.find(t => t.id === techId);
    const { error } = await supabase.from('repairs').update({ technician_id: techId, updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    if (error) { console.debug('[SHOP_ASSIGN_TECH_ERROR]', error); toast.error('Failed: ' + error.message); setAssigning(false); return; }
    await supabase.from('repair_timeline').insert({ repair_id: selectedRepair.id, status: selectedRepair.status, note: `Technician ${tech?.full_name} assigned`, updated_by: user?.id });
    toast.success('Technician assigned');
    setAssigning(false); fetchRepairs();
  };

  const assignDelivery = async (boyId: string) => {
    if (!selectedRepair) return;
    setAssigning(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Clear any existing dropoff assignment for this device
    await supabase.from('delivery_assignments')
      .delete()
      .eq('repair_id', selectedRepair.id)
      .eq('job_type', 'dropoff');

    const { error } = await supabase.from('delivery_assignments').insert({ 
      repair_id: selectedRepair.id, delivery_boy_id: boyId, shop_id: shopId, 
      job_type: 'dropoff', status: 'assigned', scheduled_date: today 
    });
    
    if (error) { toast.error('Failed: ' + error.message); setAssigning(false); return; }
    
    toast.success('Delivery boy assigned');
    setAssigning(false); fetchRepairs();
  };

  const sendOutForDelivery = async () => {
    if (!selectedRepair || selectedRepair.status !== 'done') return;
    setAssigning(true);
    await supabase.from('repairs').update({ status: 'out_for_delivery', updated_at: new Date().toISOString() }).eq('id', selectedRepair.id);
    await supabase.from('repair_timeline').insert({ repair_id: selectedRepair.id, status: 'out_for_delivery', note: 'Ready for delivery — dispatched by shop admin', updated_by: user?.id });
    toast.success('Sent out for delivery');
    setAssigning(false); fetchRepairs(); setSheetOpen(false);
  };

  const confirmRca = async (rca: any) => {
    console.debug('[SHOP_CONFIRM_RCA]', { rcaId: rca.id, repairId: rca.repair_id });
    setRcaProcessing(true);
    try {
      const { error: updateErr } = await supabase.from('rca_reports').update({ admin_confirmed: true }).eq('id', rca.id);
      if (updateErr) { console.debug('[SHOP_CONFIRM_RCA_ERROR]', updateErr); toast.error('Failed: ' + updateErr.message); setRcaProcessing(false); return; }
      const { error: tlErr } = await supabase.from('repair_timeline').insert({ repair_id: rca.repair_id, status: 'device_received', note: 'RCA confirmed by shop admin — visible to customer', updated_by: user?.id });
      if (tlErr) console.debug('[SHOP_CONFIRM_RCA_TL_ERROR]', tlErr);
      toast.success('RCA confirmed'); setRcaModal(null); fetchRepairs();
    } catch (e) { console.debug('[SHOP_CONFIRM_RCA_EXCEPTION]', e); toast.error('Failed'); }
    setRcaProcessing(false);
  };

  const requestRevision = async (rca: any) => {
    if (!adminNotes.trim()) { toast.error('Please add notes'); return; }
    setRcaProcessing(true);
    await supabase.from('rca_reports').update({ admin_notes: adminNotes }).eq('id', rca.id);
    toast.success('Revision requested'); setRcaModal(null); setAdminNotes(''); setRcaProcessing(false);
  };

  const filtered = repairs.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) { const s = search.toLowerCase(); return r.customer?.full_name?.toLowerCase().includes(s) || r.device?.model_name?.toLowerCase().includes(s) || r.id.startsWith(s); }
    return true;
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Repairs</h1>
        <p className="text-[#1A1A1A]/60 text-sm mt-1">Manage your shop&apos;s repairs</p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-2.5 w-4 h-4 text-[#1A1A1A]/40" /><Input className="pl-9 bg-white border-[#E8E4DF] text-[#1A1A1A]" placeholder="Search repairs..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-white border-[#E8E4DF]"><SelectItem value="all">All Status</SelectItem>{REPAIR_STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{REPAIR_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-64 w-full bg-[#1A1A1A]/5" /></div> : (
          <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
            <TableHead className="text-[#1A1A1A]/55">ID</TableHead><TableHead className="text-[#1A1A1A]/55">Customer</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Device</TableHead><TableHead className="text-[#1A1A1A]/55">Status</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Technician</TableHead><TableHead className="text-[#1A1A1A]/55">Date</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.slice(0, 50).map(r => (
            <TableRow key={r.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]">
              <TableCell className="font-mono text-[#FF5C00] text-xs font-semibold">{shortId(r.id)}</TableCell>
              <TableCell className="text-[#1A1A1A]">{r.customer?.full_name || '—'}</TableCell>
              <TableCell className="text-[#1A1A1A]/70">{r.device?.model_name || r.manual_model || '—'}</TableCell>
              <TableCell><Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status as RepairStatus]}</Badge></TableCell>
              <TableCell className="text-[#1A1A1A]/70">{r.technician?.full_name || <span className="text-amber-600 font-semibold">Unassigned</span>}</TableCell>
              <TableCell className="text-[#1A1A1A]/50 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</TableCell>
              <TableCell><Button size="sm" variant="ghost" onClick={() => openRepairSheet(r)} className="text-[#FF5C00] hover:bg-[#FF5C00]/10 font-semibold"><Eye className="w-3.5 h-3.5 mr-1" />View</Button></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent></Card>

      {pendingRcas.length > 0 && (
        <Card className="bg-white border-[#E8E4DF] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#E8E4DF]"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><FileSearch className="w-4 h-4 text-purple-600" />Pending RCA Reviews ({pendingRcas.length})</CardTitle></CardHeader>
          <CardContent className="p-0"><Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
            <TableHead className="text-[#1A1A1A]/55">Repair</TableHead><TableHead className="text-[#1A1A1A]/55">Customer</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Technician</TableHead><TableHead className="text-[#1A1A1A]/55">Action</TableHead>
          </TableRow></TableHeader><TableBody>{pendingRcas.map(rca => (
            <TableRow key={rca.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]">
              <TableCell className="font-mono text-[#FF5C00] text-xs font-semibold">{shortId(rca.repair_id)}</TableCell>
              <TableCell className="text-[#1A1A1A]">{rca.repair?.customer?.full_name}</TableCell>
              <TableCell className="text-[#1A1A1A]/70">{rca.repair?.technician?.full_name}</TableCell>
              <TableCell><Button size="sm" onClick={() => { setRcaModal(rca); setAdminNotes(''); }} className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 text-xs font-semibold"><Eye className="w-3 h-3 mr-1" />Review</Button></TableCell>
            </TableRow>
          ))}</TableBody></Table></CardContent>
        </Card>
      )}

      {/* Repair Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto">
          {selectedRepair && (<>
            <SheetHeader className="mb-4"><SheetTitle className="text-[#1A1A1A]">Repair {shortId(selectedRepair.id)}</SheetTitle><SheetDescription className="text-[#1A1A1A]/60">{selectedRepair.issue_description}</SheetDescription></SheetHeader>
            <div className="space-y-6 pb-12">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Customer</span><p className="text-[#1A1A1A] font-medium">{selectedRepair.customer?.full_name}</p><p className="text-[#1A1A1A]/60 text-xs">{selectedRepair.customer?.phone}</p></div>
                <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Device</span><p className="text-[#1A1A1A] font-medium">{selectedRepair.device?.brand} {selectedRepair.device?.model_name}</p></div>
                <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Status</span><Badge className={statusColor(selectedRepair.status)}>{REPAIR_STATUS_LABELS[selectedRepair.status as RepairStatus]}</Badge></div>
                <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Technician</span><p className="text-[#1A1A1A] font-medium">{selectedRepair.technician?.full_name || 'Unassigned'}</p></div>
              </div>
              <Separator className="bg-[#E8E4DF]" />
              {/* Status Change */}
              <div><p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold">⚡ Change Status</p>
                <Select value={selectedRepair.status} onValueChange={(val) => { console.debug('[SHOP_STATUS_SELECT]', val); changeStatus(val); }} disabled={assigning}><SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-white border-[#E8E4DF]">{REPAIR_STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{REPAIR_STATUS_LABELS[s as RepairStatus]}</SelectItem>)}</SelectContent></Select></div>
              <Separator className="bg-[#E8E4DF]" />
              <div><p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Wrench className="w-3 h-3" />Assign Technician</p>
                <Select onValueChange={assignTechnician} disabled={assigning}><SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select technician..." /></SelectTrigger><SelectContent className="bg-white border-[#E8E4DF]">{technicians.map(t => <SelectItem key={t.id} value={t.id} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{t.full_name} {t.role !== 'technician' ? `(${t.role})` : ''}</SelectItem>)}</SelectContent></Select></div>
              <div><p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold flex items-center gap-1"><Truck className="w-3 h-3" />Assign Delivery Boy</p>
                <Select onValueChange={assignDelivery} disabled={assigning}><SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Select delivery boy..." /></SelectTrigger><SelectContent className="bg-white border-[#E8E4DF]">{deliveryBoys.map(d => <SelectItem key={d.id} value={d.id} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{d.full_name} {d.role !== 'delivery' ? `(${d.role})` : ''}</SelectItem>)}</SelectContent></Select></div>
              {selectedRepair.status === 'done' && <Button onClick={sendOutForDelivery} disabled={assigning} className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">{assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Send Out for Delivery</Button>}
              <Separator className="bg-[#E8E4DF]" />
              <div><p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold">Timeline</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">{timeline.map(t => (
                  <div key={t.id} className="flex items-start gap-2 text-xs">
                    <Badge className={`shrink-0 text-[9px] ${statusColor(t.status)}`}>{REPAIR_STATUS_LABELS[t.status as RepairStatus] || t.status}</Badge>
                    <span className="text-[#1A1A1A]/60 flex-1">{t.note}</span>
                    <span className="text-[#1A1A1A]/40 shrink-0">{new Date(t.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}{timeline.length === 0 && <p className="text-[#1A1A1A]/30 text-center py-4">No timeline entries</p>}</div>
              </div>
            </div>
          </>)}
        </SheetContent>
      </Sheet>

      {/* RCA Modal */}
      <Dialog open={!!rcaModal} onOpenChange={() => setRcaModal(null)}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-lg">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">RCA Review</DialogTitle><DialogDescription className="text-[#1A1A1A]/60">Review diagnostic report</DialogDescription></DialogHeader>
          {rcaModal && (
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
              <div><p className="text-[#1A1A1A]/60 text-xs mb-1">Diagnostic Checklist</p>
                <div className="grid grid-cols-2 gap-1">{Object.entries(rcaModal.diagnostic_checklist || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs">{v ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}<span className="text-[#1A1A1A]/70">{k.replace(/_/g, ' ')}</span></div>
                ))}</div></div>
              {rcaModal.before_photos?.length > 0 && <div><p className="text-[#1A1A1A]/60 text-xs mb-1">Before Photos</p><div className="flex gap-2 flex-wrap">{rcaModal.before_photos.map((url: string, i: number) => <img key={i} src={url} alt="before" className="w-20 h-20 rounded-lg object-cover border border-[#E8E4DF]" />)}</div></div>}
              {rcaModal.after_photos?.length > 0 && <div><p className="text-[#1A1A1A]/60 text-xs mb-1">After Photos</p><div className="flex gap-2 flex-wrap">{rcaModal.after_photos.map((url: string, i: number) => <img key={i} src={url} alt="after" className="w-20 h-20 rounded-lg object-cover border border-[#E8E4DF]" />)}</div></div>}
              <div><p className="text-[#1A1A1A]/60 text-xs mb-1">Technician Notes</p><p className="text-[#1A1A1A]">{rcaModal.technician_notes}</p></div>
              <Separator className="bg-[#E8E4DF]" />
              <div><p className="text-[#1A1A1A]/60 text-xs mb-1">Admin Notes</p><Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Notes for revision..." className="bg-white border-[#E8E4DF] text-[#1A1A1A] min-h-[60px]" /></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => requestRevision(rcaModal)} disabled={rcaProcessing} className="border-red-500/20 text-red-600 hover:bg-red-500/10"><XCircle className="w-3.5 h-3.5 mr-1" />Request Revision</Button>
            <Button onClick={() => confirmRca(rcaModal)} disabled={rcaProcessing} className="bg-[#FF5C00] hover:bg-[#e05200] text-white">{rcaProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
