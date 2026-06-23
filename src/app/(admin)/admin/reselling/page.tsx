'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Recycle, Eye, Loader2, IndianRupee, MapPin } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  valued: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  picked_up: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  credited: 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/20',
};

export default function AdminResellingPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog state
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [updating, setUpdating] = useState<string | null>(null);

  // Valuation
  const [valuationAmount, setValuationAmount] = useState('');
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<string>('');

  const fetchData = useCallback(async () => {
    
    let query = supabase
      .from('ewaste')
      .select('*, customer:users!ewaste_customer_id_fkey(full_name, phone)')
      .eq('category', 'resell')
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

    // Also fetch delivery boys
    const { data: dboys } = await supabase.from('users').select('id, full_name, role').in('role', ['admin', 'delivery']);
    setDeliveryBoys(dboys || []);
    
  }, [statusFilter]);

  const { user, loading } = useAuthFetch(fetchData, {
    requiredRole: 'admin',
    deps: [statusFilter],
    realtimeTable: 'ewaste',
  });

  const setValuation = async (item: any) => {
    if (!valuationAmount || isNaN(Number(valuationAmount))) { toast.error('Enter a valid amount'); return; }
    setUpdating(item.id);
    try {
      const { error } = await supabase.from('ewaste').update({ status: 'valued', quoted_value: Number(valuationAmount) }).eq('id', item.id);
      if (error) throw error;
      toast.success('Device valued successfully');
      fetchData();
      setDetailsDialog({ open: false, item: null });
      setValuationAmount('');
    } catch (err: any) {
      toast.error('Failed to set valuation');
    } finally {
      setUpdating(null);
    }
  };

  const assignDelivery = async (item: any) => {
    if (!selectedDeliveryBoy) { toast.error('Select a delivery boy'); return; }
    setUpdating(item.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('delivery_assignments').insert({
        ewaste_id: item.id,
        delivery_boy_id: selectedDeliveryBoy,
        job_type: 'pickup',
        status: 'assigned',
        scheduled_date: today
      });
      if (error) throw error;
      
      toast.success('Delivery boy assigned for pickup today');
      fetchData();
      setDetailsDialog({ open: false, item: null });
      setSelectedDeliveryBoy('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign delivery.');
    } finally {
      setUpdating(null);
    }
  };

  const forceUpdateStatus = async (id: string, nextStatus: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from('ewaste').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Phone Reselling</h1>
          <p className="text-[#1A1A1A]/50 text-sm mt-1">Manage customer phone reselling requests</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'valued', 'picked_up', 'credited'].map(filter => (
            <Button 
              key={filter} 
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className={statusFilter === filter ? 'bg-[#FF5C00] text-white hover:bg-[#e05200]' : 'bg-white text-[#1A1A1A]/70'}
            >
              {filter.replace('_', ' ').charAt(0).toUpperCase() + filter.replace('_', ' ').slice(1)}
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
              <p className="text-[#1A1A1A]/50 text-sm">There are no Phone Reselling submissions matching this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8E4DF] hover:bg-transparent">
                    <TableHead className="text-[#1A1A1A]/50 font-medium whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Customer</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Device</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Admin Offer</TableHead>
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
                        <p className="text-[#1A1A1A]/50 text-xs capitalize">Condition: {sub.condition?.replace('_', ' ')}</p>
                      </TableCell>
                      <TableCell>
                        {sub.quoted_value ? (
                          <span className="text-[#FF5C00] font-semibold flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />{fmt(sub.quoted_value)}
                          </span>
                        ) : (
                          <span className="text-[#1A1A1A]/40 text-sm">Not offered yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[sub.status] || 'bg-gray-100'}>
                          {sub.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-[#1A1A1A]/70 hover:text-[#FF5C00] hover:bg-[#FF5C00]/10"
                          onClick={() => setDetailsDialog({ open: true, item: sub })}
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
        <DialogContent className="bg-[#F7F7F5] border-[#E8E4DF] max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] text-xl flex items-center gap-2">
              <Recycle className="w-5 h-5 text-[#FF5C00]" /> Submission Details
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60">
              Review device condition and set valuation.
            </DialogDescription>
          </DialogHeader>

          {detailsDialog.item && (
            <div className="space-y-4 mt-2">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1">Customer</p>
                  <p className="text-[#1A1A1A] font-bold">{detailsDialog.item.customer?.full_name}</p>
                  <p className="text-[#1A1A1A]/70 text-sm">{detailsDialog.item.customer?.phone}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1">Device & IMEI</p>
                  <p className="text-[#1A1A1A] font-bold">{detailsDialog.item.device_description}</p>
                  <p className="text-[#1A1A1A]/70 text-sm font-mono">{detailsDialog.item.imei_number}</p>
                </div>
              </div>

              {detailsDialog.item.address && (
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
                  <p className="text-xs text-[#1A1A1A]/50 font-medium mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Pickup Address</p>
                  <p className="text-[#1A1A1A] text-sm">{detailsDialog.item.address}</p>
                </div>
              )}

              {/* Valuation Section — show when pending */}
              {detailsDialog.item.status === 'pending' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-blue-900">Make an Offer</h4>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input type="number" value={valuationAmount} onChange={e => setValuationAmount(e.target.value)} placeholder="Enter value (₹)" className="bg-white text-[#1A1A1A]" />
                    <Button onClick={() => setValuation(detailsDialog.item)} disabled={updating === detailsDialog.item.id} className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">Set Value</Button>
                  </div>
                </div>
              )}

              {/* Delivery Assignment Section — show when valued */}
              {detailsDialog.item.status === 'valued' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h4 className="font-semibold text-emerald-900">Assign Pickup</h4>
                  {detailsDialog.item.quoted_value && (
                    <p className="text-sm text-emerald-800">Agreed Offer: <span className="font-bold">₹{fmt(detailsDialog.item.quoted_value)}</span></p>
                  )}
                  <div className="flex gap-2 items-center">
                    <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                      <SelectTrigger className="bg-white text-[#1A1A1A]"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                      <SelectContent className="bg-white text-[#1A1A1A]">
                        {deliveryBoys.map(db => <SelectItem key={db.id} value={db.id}>{db.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => assignDelivery(detailsDialog.item)} disabled={updating === detailsDialog.item.id || !selectedDeliveryBoy} className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">Assign Pickup</Button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Condition Report</p>
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DF] space-y-2">
                  <div className="flex justify-between items-center border-b border-[#E8E4DF] pb-2">
                    <span className="text-[#1A1A1A]/70 text-sm">Base Condition:</span>
                    <Badge variant="outline" className="capitalize bg-gray-50">{detailsDialog.item.condition?.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <span className="text-[#1A1A1A]/70 text-sm block mb-1">Customer Description:</span>
                    <p className="text-[#1A1A1A] text-sm bg-gray-50 p-3 rounded-lg border border-[#E8E4DF]">
                      {detailsDialog.item.condition_description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {detailsDialog.item.photos_url && (
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Uploaded Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailsDialog.item.photos_url.split(',').map((url: string, i: number) => (
                      <a 
                        key={i} 
                        href={url.trim()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="aspect-square rounded-xl overflow-hidden border border-[#E8E4DF] bg-white hover:opacity-80 transition-opacity block cursor-pointer"
                        title="Click to view full size"
                      >
                        <img src={url.trim()} alt={`Device photo ${i+1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col p-4 bg-white border border-[#E8E4DF] rounded-xl gap-2 mt-4">
                <Label className="text-[#1A1A1A] font-semibold text-sm">Force Override Status</Label>
                <div className="flex gap-2 items-center">
                  <Select value={detailsDialog.item.status} onValueChange={(v) => forceUpdateStatus(detailsDialog.item.id, v)}>
                    <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                      <SelectValue placeholder="Override status..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-[#1A1A1A] border-[#E8E4DF]">
                      {['pending', 'valued', 'picked_up', 'credited'].map(status => (
                        <SelectItem key={status} value={status} className="hover:bg-gray-100 cursor-pointer">
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        </SelectItem>
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
