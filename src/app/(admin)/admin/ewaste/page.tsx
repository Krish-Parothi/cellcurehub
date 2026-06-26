'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { creditEwasteAccount, revokeEwasteCredits } from '@/lib/actions/ewaste';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recycle, Eye, Loader2, IndianRupee, MapPin, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  pickup_assigned: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  picked_up: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  credited: 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  rejected: 'Cancelled/Rejected',
  pickup_assigned: 'Pickup Assigned',
  picked_up: 'Picked Up',
  credited: 'Credited',
};

export default function AdminEwastePage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [updating, setUpdating] = useState<string | null>(null);

  // Price offer
  const [offerAmount, setOfferAmount] = useState('');
  // Delivery assignment
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<string>('');

  const fetchData = useCallback(async () => {
    let query = supabase
      .from('ewaste')
      .select('*, customer:users!ewaste_customer_id_fkey(full_name, phone), ewaste_category:ewaste_categories(name)')
      .eq('category', 'ewaste')
      .order('created_at', { ascending: false });
      
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load submissions');
      console.error(error);
    } else {
      setSubmissions(data || []);
    }

    const { data: dboys } = await supabase.from('users').select('id, full_name, role').in('role', ['admin', 'delivery']);
    setDeliveryBoys(dboys || []);
  }, [statusFilter]);

  const { user, loading } = useAuthFetch(fetchData, {
    requiredRole: 'admin',
    deps: [statusFilter],
    realtimeTable: 'ewaste',
  });

  const sendOffer = async (item: any) => {
    if (!offerAmount || isNaN(Number(offerAmount))) { toast.error('Enter a valid amount'); return; }
    setUpdating(item.id);
    try {
      const result = await creditEwasteAccount(item.id, Number(offerAmount));
      if (!result.success) throw new Error(result.error);
      toast.success('Credits successfully added to customer account');
      fetchData();
      setDetailsDialog({ open: false, item: null });
      setOfferAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to credit account');
    } finally {
      setUpdating(null);
    }
  };

  const assignDelivery = async (item: any) => {
    if (!selectedDeliveryBoy) { toast.error('Select a delivery boy'); return; }
    setUpdating(item.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: delErr } = await supabase.from('delivery_assignments').insert({
        ewaste_id: item.id,
        delivery_boy_id: selectedDeliveryBoy,
        job_type: 'pickup',
        status: 'assigned',
        scheduled_date: today,
      });
      if (delErr) throw delErr;

      const { error: statusErr } = await supabase.from('ewaste').update({ status: 'pickup_assigned' }).eq('id', item.id);
      if (statusErr) throw statusErr;
      
      toast.success('Delivery boy assigned for pickup');
      fetchData();
      setDetailsDialog({ open: false, item: null });
      setSelectedDeliveryBoy('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign delivery');
    } finally {
      setUpdating(null);
    }
  };

  const forceUpdateStatus = async (id: string, nextStatus: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from('ewaste').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Status updated to ${nextStatus.replace(/_/g, ' ')}`);
      fetchData();
      if (detailsDialog.open && detailsDialog.item?.id === id) {
        setDetailsDialog(prev => ({ ...prev, item: { ...prev.item, status: nextStatus } }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const revokeCredits = async (item: any) => {
    if (!confirm(`Are you sure you want to revoke ${item.admin_offer} credits from this customer and cancel the request?`)) return;
    setUpdating(item.id);
    try {
      const result = await revokeEwasteCredits(item.id);
      if (!result.success) throw new Error(result.error);
      toast.success('Credits revoked and request cancelled');
      fetchData();
      setDetailsDialog({ open: false, item: null });
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke credits');
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ['all', 'pending', 'rejected', 'credited', 'pickup_assigned', 'picked_up'];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">E-Waste Management</h1>
          <p className="text-[#1A1A1A]/50 text-sm mt-1">Review submissions, offer prices, and assign pickups</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(filter => (
            <Button 
              key={filter} 
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className={statusFilter === filter ? 'bg-[#FF5C00] text-white hover:bg-[#e05200]' : 'bg-white text-[#1A1A1A]/70'}
            >
              {filter === 'all' ? 'All' : (STATUS_LABELS[filter] || filter).replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </motion.div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div>
          ) : submissions.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <Recycle className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No submissions found</h3>
              <p className="text-[#1A1A1A]/50 text-sm">There are no E-waste submissions matching this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8E4DF] hover:bg-transparent">
                    <TableHead className="text-[#1A1A1A]/50 font-medium whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Customer</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Item</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Category</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Offer</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Status</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(sub => (
                    <TableRow key={sub.id} className="border-[#E8E4DF] hover:bg-[#F7F7F5]">
                      <TableCell className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <p className="text-[#1A1A1A] font-medium">{sub.customer?.full_name || 'Unknown'}</p>
                        <p className="text-[#1A1A1A]/50 text-xs">{sub.customer?.phone || 'No phone'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[#1A1A1A] font-medium">{sub.device_description}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-[#1A1A1A]/60 text-sm">{sub.ewaste_category?.name || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {sub.admin_offer != null ? (
                          <span className="text-[#FF5C00] font-semibold flex items-center">
                            {fmt(sub.admin_offer)} Credits
                          </span>
                        ) : (
                          <span className="text-[#1A1A1A]/40 text-sm">Not offered</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[sub.status] || 'bg-gray-100'}>
                          {STATUS_LABELS[sub.status] || sub.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-[#1A1A1A]/70 hover:text-[#FF5C00] hover:bg-[#FF5C00]/10"
                          onClick={() => { setDetailsDialog({ open: true, item: sub }); setOfferAmount(sub.admin_offer?.toString() || ''); }}
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={o => setDetailsDialog({ open: o, item: o ? detailsDialog.item : null })}>
        <DialogContent className="bg-[#F7F7F5] border-[#E8E4DF] max-w-2xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] text-xl flex items-center gap-2">
              <Recycle className="w-5 h-5 text-[#FF5C00]" /> E-Waste Details
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60">
              Review submission and manage pricing
            </DialogDescription>
          </DialogHeader>

          {detailsDialog.item && (
            <div className="space-y-4 mt-2 overflow-y-auto flex-1 pr-2 pb-2">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1">Customer</p>
                  <p className="text-[#1A1A1A] font-bold">{detailsDialog.item.customer?.full_name}</p>
                  <p className="text-[#1A1A1A]/70 text-sm">{detailsDialog.item.customer?.phone}</p>
                  {detailsDialog.item.contact_email && <p className="text-[#1A1A1A]/70 text-sm">{detailsDialog.item.contact_email}</p>}
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1">Item & Category</p>
                  <p className="text-[#1A1A1A] font-bold">{detailsDialog.item.device_description}</p>
                  <p className="text-[#1A1A1A]/70 text-sm">{detailsDialog.item.ewaste_category?.name || 'Other'}</p>
                </div>
              </div>

              {detailsDialog.item.address && (
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Pickup Address</p>
                  <p className="text-[#1A1A1A] text-sm">{detailsDialog.item.address}</p>
                </div>
              )}

              {detailsDialog.item.condition_description && (
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1">Customer Description</p>
                  <p className="text-[#1A1A1A] text-sm">{detailsDialog.item.condition_description}</p>
                </div>
              )}

              {/* Photos */}
              {detailsDialog.item.photos_url && (
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Uploaded Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailsDialog.item.photos_url.split(',').map((url: string, i: number) => (
                      <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" 
                        className="aspect-square rounded-xl overflow-hidden border border-[#E8E4DF] bg-white hover:opacity-80 transition-opacity block">
                        <img src={url.trim()} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* PENDING: Admin assigns credits directly */}
              {detailsDialog.item.status === 'pending' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">Credit Customer Account</h4>
                  <p className="text-sm text-blue-800/70">Review the photos and item details, then enter the amount of Credits to award. The customer will receive these instantly and the request will be completed.</p>
                  <div className="flex gap-2 items-center">
                    <Input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="Enter Credits" className="bg-white text-[#1A1A1A]" />
                    <Button onClick={() => sendOffer(detailsDialog.item)} disabled={updating === detailsDialog.item.id} className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">Credit & Complete</Button>
                  </div>
                </div>
              )}

              {/* CREDITED: Assign delivery boy */}
              {detailsDialog.item.status === 'credited' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h4 className="font-semibold text-emerald-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Credits Issued!</h4>
                  <p className="text-sm text-emerald-800/70">
                    Customer was credited <span className="font-bold">{fmt(detailsDialog.item.admin_offer)} Credits</span>. Assign a delivery boy for pickup.
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                      <SelectTrigger className="bg-white text-[#1A1A1A] w-48"><SelectValue placeholder="Select delivery boy..." /></SelectTrigger>
                      <SelectContent className="bg-white text-[#1A1A1A]">
                        {deliveryBoys.map(db => <SelectItem key={db.id} value={db.id}>{db.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => assignDelivery(detailsDialog.item)} disabled={updating === detailsDialog.item.id || !selectedDeliveryBoy} className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">
                      <Truck className="w-4 h-4 mr-1" /> Assign Pickup
                    </Button>
                    <Button onClick={() => revokeCredits(detailsDialog.item)} disabled={updating === detailsDialog.item.id} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-auto">
                      <XCircle className="w-4 h-4 mr-1" /> Revoke Credits
                    </Button>
                  </div>
                </div>
              )}

              {/* REJECTED: Customer declined */}
              {detailsDialog.item.status === 'rejected' && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2"><XCircle className="w-4 h-4" /> Customer Declined</h4>
                  <p className="text-sm text-red-800/70 mt-1">
                    The customer declined your offer of {fmt(detailsDialog.item.admin_offer || 0)} Credits. This submission is closed.
                  </p>
                </div>
              )}

              {/* Force Override Status */}
              <div className="flex flex-col p-4 bg-white border border-[#E8E4DF] rounded-xl gap-2 mt-4">
                <Label className="text-[#1A1A1A] font-semibold text-sm">Force Override Status</Label>
                <div className="flex gap-2 items-center">
                  <Select value={detailsDialog.item.status} onValueChange={(v) => forceUpdateStatus(detailsDialog.item.id, v)}>
                    <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]"><SelectValue placeholder="Override status..." /></SelectTrigger>
                    <SelectContent className="bg-white text-[#1A1A1A] border-[#E8E4DF]">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="hover:bg-gray-100 cursor-pointer">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updating === detailsDialog.item.id && <Loader2 className="w-4 h-4 animate-spin text-[#FF5C00]" />}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
