'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useShopId } from '@/lib/use-shop-id';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { RepairStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserCircle, Phone, Mail, MessageSquare, Eye } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const statusColor = (s: string) => {
  const m: Record<string, string> = { booked: 'bg-blue-500/20 text-blue-400', device_received: 'bg-indigo-500/20 text-indigo-400', repair_in_progress: 'bg-orange-500/20 text-orange-400', done: 'bg-green-500/20 text-green-400', delivered: 'bg-emerald-500/20 text-emerald-400' };
  return m[s] || 'bg-gray-500/20 text-gray-400';
};

export default function ShopCustomersPage() {
  const { user } = useAuth();
  const shopId = useShopId();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customerRepairs, setCustomerRepairs] = useState<any[]>([]);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    // Get distinct customer_ids from this shop's repairs
    const { data: repairData } = await supabase.from('repairs').select('customer_id, id, final_cost, created_at').eq('shop_id', shopId);
    const customerIds = [...new Set((repairData || []).map(r => r.customer_id))];
    if (customerIds.length === 0) { setCustomers([]); setLoading(false); return; }

    const { data: users } = await supabase.from('users').select('*').in('id', customerIds);
    const repairIds = (repairData || []).map((r: any) => r.id);
    const { data: invoices } = repairIds.length > 0 
      ? await supabase.from('invoices').select('repair_id, total').in('repair_id', repairIds).eq('payment_status', 'paid')
      : { data: [] };

    const enriched = (users || []).map((c: any) => {
      const cRepairs = (repairData || []).filter(r => r.customer_id === c.id);
      const cRepairIds = cRepairs.map((r: any) => r.id);
      const spent = (invoices || []).filter(i => cRepairIds.includes(i.repair_id)).reduce((s: number, i: any) => s + (i.total || 0), 0);
      return { ...c, repairCount: cRepairs.length, totalSpent: spent, lastRepair: cRepairs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.created_at || null };
    });
    setCustomers(enriched);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { if ((user?.role === 'shop_admin' || user?.role === 'admin') && shopId) fetchData(); }, [user, shopId, fetchData]);

  const openProfile = async (c: any) => {
    setSelectedCustomer(c); setSheetOpen(true);
    const [repRes, revRes] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(brand, model_name)').eq('customer_id', c.id).eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
    ]);
    setCustomerRepairs(repRes.data || []); setCustomerReviews(revRes.data || []);
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.phone?.includes(s) || c.email?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-white/50 text-sm mt-1">Customers who visited your shop</p>
      </motion.div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" /><Input className="pl-9 bg-white/5 border-white/10 text-white" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-64 w-full bg-white/5" /></div> : (
          <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-white/50">Customer</TableHead><TableHead className="text-white/50">Phone</TableHead>
            <TableHead className="text-white/50">Repairs</TableHead><TableHead className="text-white/50">Spent</TableHead>
            <TableHead className="text-white/50">Last Repair</TableHead><TableHead className="text-white/50">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map(c => (
            <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xs">{c.full_name?.[0] || '?'}</AvatarFallback></Avatar><span className="text-white">{c.full_name}</span></TableCell>
              <TableCell className="text-white/60">{c.phone || '—'}</TableCell>
              <TableCell className="text-white">{c.repairCount}</TableCell>
              <TableCell className="text-[#00D084]">₹{fmt(c.totalSpent)}</TableCell>
              <TableCell className="text-white/40 text-xs">{c.lastRepair ? new Date(c.lastRepair).toLocaleDateString('en-IN') : '—'}</TableCell>
              <TableCell className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openProfile(c)} className="text-[#00D084] hover:bg-[#00D084]/10 text-xs"><Eye className="w-3 h-3 mr-1" />View</Button>
                <Button size="sm" variant="ghost" onClick={() => window.open(`https://wa.me/91${c.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${c.full_name}, greetings from CellCureHub!`)}`, '_blank')} className="text-green-400 hover:bg-green-500/10 text-xs"><MessageSquare className="w-3 h-3" /></Button>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent></Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="max-w-xl w-full bg-[#0A0A0A] border-l border-white/10 overflow-y-auto">
          {selectedCustomer && (<>
            <SheetHeader className="mb-4"><SheetTitle className="text-white flex items-center gap-2"><UserCircle className="w-5 h-5 text-[#00D084]" />{selectedCustomer.full_name}</SheetTitle><SheetDescription className="text-white/50">{selectedCustomer.email}</SheetDescription></SheetHeader>
            <div className="space-y-6 pb-12">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 p-3 rounded-lg"><span className="text-white/40 text-xs block">Phone</span><a href={`tel:${selectedCustomer.phone}`} className="text-[#00D084] flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</a></div>
                <div className="bg-white/5 p-3 rounded-lg"><span className="text-white/40 text-xs block">Email</span><p className="text-white/80 flex items-center gap-1"><Mail className="w-3 h-3" />{selectedCustomer.email || '—'}</p></div>
                <div className="bg-white/5 p-3 rounded-lg"><span className="text-white/40 text-xs block">Repairs</span><p className="text-white text-lg font-bold">{selectedCustomer.repairCount}</p></div>
                <div className="bg-white/5 p-3 rounded-lg"><span className="text-white/40 text-xs block">Spent</span><p className="text-[#00D084] text-lg font-bold">₹{fmt(selectedCustomer.totalSpent)}</p></div>
              </div>
              <Separator className="bg-white/10" />
              <div><p className="text-xs text-white/60 mb-2 font-semibold">Repair History (this shop)</p>
                <div className="space-y-2">{customerRepairs.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg text-sm">
                    <div><span className="text-white">{r.device?.brand} {r.device?.model_name}</span><span className="text-white/30 ml-2 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</span></div>
                    <Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status as RepairStatus]}</Badge>
                  </div>
                ))}{customerRepairs.length === 0 && <p className="text-white/20 text-center py-4">No repairs at this shop</p>}</div>
              </div>
              {customerReviews.length > 0 && <div><p className="text-xs text-white/60 mb-2 font-semibold">Reviews</p><div className="space-y-2">{customerReviews.map(rv => (<div key={rv.id} className="bg-white/5 rounded-lg p-3 text-sm"><div className="text-amber-400 text-xs mb-1">{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</div><p className="text-white/70">{rv.comment}</p></div>))}</div></div>}
              <Button onClick={() => window.open(`https://wa.me/91${selectedCustomer.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedCustomer.full_name}, greetings from CellCureHub!`)}`, '_blank')} className="w-full bg-green-600 hover:bg-green-700 text-white"><MessageSquare className="w-4 h-4 mr-2" />Send WhatsApp</Button>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
