'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { User, Repair, RepairStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sendCustomEmail } from '@/lib/actions/email';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserCircle, Phone, Mail, MessageSquare, Eye, Send } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
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

export default function CustomersPage() {
  
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customerRepairs, setCustomerRepairs] = useState<any[]>([]);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const fetchData = useCallback(async () => {
    
    const { data } = await supabase.from('users').select('*').eq('role', 'customer').order('created_at', { ascending: false });
    // Fetch repair counts and spend
    const enriched = await Promise.all((data || []).map(async (c: any) => {
      const { data: repairs } = await supabase.from('repairs').select('id, final_cost, created_at').eq('customer_id', c.id);
      const repairIds = repairs?.map((r: any) => r.id) || [];
      const { data: invoices } = repairIds.length > 0 
        ? await supabase.from('invoices').select('total').in('repair_id', repairIds).eq('payment_status', 'paid')
        : { data: [] };
      return {
        ...c,
        repairCount: repairs?.length || 0,
        totalSpent: invoices?.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0,
        lastRepair: repairs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.created_at || null,
      };
    }));
    setCustomers(enriched);
    
  }, []);

  const { user, loading } = useAuthFetch(fetchData, { requiredRole: 'admin' });

  const openProfile = async (c: any) => {
    setSelectedCustomer(c);
    setSheetOpen(true);
    const [repRes, revRes] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(brand, model_name)').eq('customer_id', c.id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
    ]);
    setCustomerRepairs(repRes.data || []);
    setCustomerReviews(revRes.data || []);
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.phone?.includes(s) || c.email?.toLowerCase().includes(s);
  });

  const [emailModal, setEmailModal] = useState<{ open: boolean; type: 'feedback' | 'promo'; target: any | 'ALL' }>({ open: false, type: 'feedback', target: null });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const openEmailModal = (type: 'feedback' | 'promo', target: any | 'ALL') => {
    if (target !== 'ALL' && !target.email) {
      toast.error('Customer has no email address.');
      return;
    }
    if (target === 'ALL' && filtered.filter(c => c.email).length === 0) {
      toast.error('No customers with email addresses found.');
      return;
    }

    setEmailModal({ open: true, type, target });
    if (type === 'feedback') {
      setEmailSubject('How was your repair experience with CellCureHub?');
      setEmailBody(`Thank you for trusting CellCureHub with your device repair!\n\nWe constantly strive to provide the best service possible. Could you please take a moment to leave us a quick review? Your feedback means the world to us and helps other customers make informed decisions.\n\nLeave a review here: https://cellcurehub.com/dashboard?tab=history\n\nIf you had any issues with your repair, please reply to this email so we can make it right.`);
    } else {
      setEmailSubject('Check out the latest from CellCureHub!');
      setEmailBody(`We are excited to announce our new product/service...\n\nVisit our website to learn more!`);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error('Subject and body cannot be empty.');
      return;
    }
    
    setSendingAll(true);
    let successCount = 0;
    
    if (emailModal.target === 'ALL') {
      const withEmail = filtered.filter(c => c.email);
      for (const c of withEmail) {
        const res = await sendCustomEmail(c.email, c.full_name, emailSubject, emailBody);
        if (res.success) successCount++;
      }
      toast.success(`Sent emails to ${successCount}/${withEmail.length} customers.`);
    } else {
      const c = emailModal.target;
      const res = await sendCustomEmail(c.email, c.full_name, emailSubject, emailBody);
      if (res.success) toast.success(`Email sent to ${c.full_name}`);
      else toast.error(res.error || 'Failed to send email');
    }
    
    setSendingAll(false);
    setEmailModal({ open: false, type: 'feedback', target: null });
  };

  return (
    <>
      <div className="space-y-8 text-[#1A1A1A]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Customers</h1>
        <p className="text-[#1A1A1A]/60 text-sm mt-1">Customer database & profiles</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#1A1A1A]/40" />
          <Input className="pl-9 bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40" placeholder="Search by name, phone, or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openEmailModal('promo', 'ALL')} disabled={filtered.length === 0} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
            <Send className="w-4 h-4 mr-2" /> New Product (All)
          </Button>
          <Button onClick={() => openEmailModal('feedback', 'ALL')} disabled={filtered.length === 0} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
            <Mail className="w-4 h-4 mr-2" /> Request Feedback (All)
          </Button>
        </div>
      </div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-64 w-full bg-[#1A1A1A]/5" /></div> : (
          <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
            <TableHead className="text-[#1A1A1A]/50">Customer</TableHead><TableHead className="text-[#1A1A1A]/50">Phone</TableHead>
            <TableHead className="text-[#1A1A1A]/50">Email</TableHead><TableHead className="text-[#1A1A1A]/50">Repairs</TableHead>
            <TableHead className="text-[#1A1A1A]/50">Spent</TableHead><TableHead className="text-[#1A1A1A]/50">Last Repair</TableHead>
            <TableHead className="text-[#1A1A1A]/50">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map(c => (
            <TableRow key={c.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-7 w-7"><AvatarFallback className="bg-[#FF5C00]/10 text-[#FF5C00] text-xs font-semibold">{c.full_name?.[0] || '?'}</AvatarFallback></Avatar>
                <span className="text-[#1A1A1A] font-medium">{c.full_name}</span>
              </TableCell>
              <TableCell className="text-[#1A1A1A]/70">{c.phone || '—'}</TableCell>
              <TableCell className="text-[#1A1A1A]/70 text-xs">{c.email || '—'}</TableCell>
              <TableCell className="text-[#1A1A1A]">{c.repairCount}</TableCell>
              <TableCell className="text-[#FF5C00] font-semibold">₹{fmt(c.totalSpent)}</TableCell>
              <TableCell className="text-[#1A1A1A]/40 text-xs">{c.lastRepair ? new Date(c.lastRepair).toLocaleDateString('en-IN') : '—'}</TableCell>
              <TableCell className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openProfile(c)} className="text-[#FF5C00] hover:text-[#e05200] hover:bg-[#FF5C00]/10 text-xs font-semibold"><Eye className="w-3 h-3 mr-1" />View</Button>
                <Button size="sm" variant="ghost" onClick={() => window.open(`https://wa.me/91${c.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${c.full_name}, greetings from CellCureHub!`)}`, '_blank')} className="text-green-600 hover:bg-green-100/10 text-xs px-2" title="WhatsApp"><MessageSquare className="w-3.5 h-3.5" /></Button>
                {c.email && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openEmailModal('feedback', c)} className="text-[#FF5C00] hover:bg-[#FF5C00]/10 text-xs px-2" title="Request Review via Email">
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEmailModal('promo', c)} className="text-[#FF5C00] hover:bg-[#FF5C00]/10 text-xs px-2" title="Send Promo via Email">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent></Card>

      {/* Customer Profile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto text-[#1A1A1A]">
          {selectedCustomer && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#1A1A1A] flex items-center gap-2"><UserCircle className="w-5 h-5 text-[#FF5C00]" />{selectedCustomer.full_name}</SheetTitle>
                <SheetDescription className="text-[#1A1A1A]/60">{selectedCustomer.email}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 pb-12">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Phone</span><a href={`tel:${selectedCustomer.phone}`} className="text-[#FF5C00] flex items-center gap-1 font-medium"><Phone className="w-3 h-3" />{selectedCustomer.phone}</a></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Email</span><p className="text-[#1A1A1A]/80 flex items-center gap-1"><Mail className="w-3 h-3" />{selectedCustomer.email || '—'}</p></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Total Repairs</span><p className="text-[#1A1A1A] text-lg font-bold">{selectedCustomer.repairCount}</p></div>
                  <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg"><span className="text-[#1A1A1A]/40 text-xs block">Total Spent</span><p className="text-[#FF5C00] text-lg font-bold">₹{fmt(selectedCustomer.totalSpent)}</p></div>
                </div>

                <Separator className="bg-[#E8E4DF]" />

                <div>
                  <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold">Repair History</p>
                  <div className="space-y-2">{customerRepairs.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-[#F7F7F5] border border-[#E8E4DF]/60 rounded-lg text-sm">
                      <div><span className="text-[#1A1A1A] font-medium">{r.device?.brand} {r.device?.model_name}</span><span className="text-[#1A1A1A]/40 ml-2 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</span></div>
                      <Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status as RepairStatus]}</Badge>
                    </div>
                  ))}{customerRepairs.length === 0 && <p className="text-[#1A1A1A]/30 text-center py-4">No repairs</p>}</div>
                </div>

                {customerReviews.length > 0 && (
                  <div>
                    <p className="text-xs text-[#1A1A1A]/60 mb-2 font-semibold">Reviews</p>
                    <div className="space-y-2">{customerReviews.map(rv => (
                      <div key={rv.id} className="bg-[#F7F7F5] border border-[#E8E4DF]/60 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-1 text-amber-500 text-xs mb-1">{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</div>
                        <p className="text-[#1A1A1A]/70">{rv.comment}</p>
                      </div>
                    ))}</div>
                  </div>
                )}

                <Button onClick={() => window.open(`https://wa.me/91${selectedCustomer.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedCustomer.full_name}, greetings from CellCureHub!`)}`, '_blank')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"><MessageSquare className="w-4 h-4 mr-2" />Send WhatsApp</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>

      {/* Email Compose Modal */}
      <Dialog open={emailModal.open} onOpenChange={(open) => !sendingAll && setEmailModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[600px] bg-white border-[#E8E4DF] text-[#1A1A1A] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 pb-4 border-b border-[#E8E4DF] bg-[#FF5C00]/5">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00]">
                  {emailModal.type === 'promo' ? <Send className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {emailModal.type === 'feedback' ? 'Request Feedback' : 'Send Promotional Email'}
                  </DialogTitle>
                  <DialogDescription className="text-[#1A1A1A]/60 mt-1">
                    {emailModal.target === 'ALL' 
                      ? <span className="flex items-center gap-1 font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit"><UserCircle className="w-4 h-4"/> Bulk sending to {filtered.filter(c => c.email).length} customers</span>
                      : `Sending to ${emailModal.target?.full_name} (${emailModal.target?.email})`
                    }
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5 bg-[#FDFDFD]">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-wider">Subject Line</Label>
              <Input 
                id="subject" 
                value={emailSubject} 
                onChange={e => setEmailSubject(e.target.value)} 
                className="border-[#E8E4DF] bg-white focus-visible:ring-[#FF5C00]/50 focus-visible:border-[#FF5C00] shadow-sm text-base py-5" 
                placeholder="Enter email subject..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-wider flex justify-between">
                Message Body
                <span className="text-[10px] font-normal text-[#1A1A1A]/40 lowercase normal-case">HTML & Line breaks supported</span>
              </Label>
              <Textarea 
                id="body" 
                value={emailBody} 
                onChange={e => setEmailBody(e.target.value)} 
                className="min-h-[220px] border-[#E8E4DF] bg-white focus-visible:ring-[#FF5C00]/50 focus-visible:border-[#FF5C00] shadow-sm text-base leading-relaxed resize-none p-4" 
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E8E4DF] bg-gray-50/50 sm:justify-between">
            <Button variant="ghost" onClick={() => setEmailModal(prev => ({ ...prev, open: false }))} disabled={sendingAll} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#E8E4DF]/50">
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingAll} className="font-bold shadow-md transition-all bg-[#FF5C00] hover:bg-[#e05200] text-white">
              {sendingAll ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Sending to All...</span>
              ) : (
                <span className="flex items-center gap-2">Send {emailModal.type === 'promo' ? 'Promo' : 'Feedback'} Email <Send className="w-4 h-4" /></span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
