'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import VerticalTimeline from '@/components/vertical-timeline';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Phone, Hash, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader as Loader2, Image as ImageIcon } from 'lucide-react';

export default function TrackPage() {
  const [searchMode, setSearchMode] = useState<'id' | 'phone'>('id');
  const [repairId, setRepairId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [repair, setRepair] = useState<Repair | null>(null);
  const [timelines, setTimelines] = useState<RepairTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Realtime subscription
  useEffect(() => {
    if (!repair?.id) return;
    const channel = supabase
      .channel(`track-${repair.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'repair_timeline', filter: `repair_id=eq.${repair.id}` }, (payload) => {
        const entry = payload.new as RepairTimelineEntry;
        setTimelines((prev) => [...prev, entry]);
        // Also update the repair status locally
        setRepair((prev) => prev ? { ...prev, status: entry.status } : prev);
        toast.success('Repair update received!', { description: REPAIR_STATUS_LABELS[entry.status] || 'New update' });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [repair?.id]);

  const fetchTimeline = useCallback(async (id: string) => {
    setTimelineLoading(true);
    const { data } = await supabase.from('repair_timeline').select('*').eq('repair_id', id).order('created_at', { ascending: true });
    if (data) setTimelines(data as RepairTimelineEntry[]);
    setTimelineLoading(false);
  }, []);

  const searchById = useCallback(async (id: string) => {
    setLoading(true); setNotFound(false); setRepair(null); setTimelines([]);
    const { data, error } = await supabase.from('repairs').select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)').eq('id', id).single();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setRepair(data as Repair); setLoading(false);
    await fetchTimeline(id);
  }, [fetchTimeline]);

  const searchByPhone = useCallback(async (phone: string) => {
    setLoading(true); setNotFound(false); setRepair(null); setTimelines([]);
    const formatted = phone.startsWith('+91') ? phone : `+91${phone}`;
    const { data: userData } = await supabase.from('users').select('id').eq('phone', formatted).single();
    if (!userData) { setNotFound(true); setLoading(false); return; }
    const { data } = await supabase.from('repairs').select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)').eq('customer_id', userData.id).order('created_at', { ascending: false }).limit(1).single();
    if (!data) { setNotFound(true); setLoading(false); return; }
    setRepair(data as Repair); setLoading(false);
    await fetchTimeline(data.id);
  }, [fetchTimeline]);

  const handleSearch = () => {
    if (searchMode === 'id') {
      if (!repairId.trim()) { toast.error('Please enter a Repair ID'); return; }
      searchById(repairId.trim());
    } else {
      if (!phoneNumber.trim()) { toast.error('Please enter a phone number'); return; }
      searchByPhone(phoneNumber.trim());
    }
  };

  // Approval Gateway
  const handleApprove = async () => {
    if (!repair) return;
    setApprovalLoading(true);
    await supabase.from('repairs').update({ approval_status: 'approved' }).eq('id', repair.id);
    await supabase.from('repair_timeline').insert({ repair_id: repair.id, status: repair.status, note: 'Customer approved revised quote' });
    setRepair((prev) => prev ? { ...prev, approval_status: 'approved' } : prev);
    toast.success('Quote approved! Repair will proceed.');
    setApprovalLoading(false);
  };

  const handleReject = async () => {
    if (!repair) return;
    setApprovalLoading(true);
    await supabase.from('repairs').update({ approval_status: 'rejected', status: 'cancelled' }).eq('id', repair.id);
    await supabase.from('repair_timeline').insert({ repair_id: repair.id, status: 'cancelled', note: 'Customer rejected revised quote — repair cancelled' });
    setRepair((prev) => prev ? { ...prev, approval_status: 'rejected', status: 'cancelled' } : prev);
    toast('Repair cancelled.');
    setApprovalLoading(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
        {/* Search */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Track Your <span className="text-[#00D084]">Repair</span></h1>
            <p className="mt-2 text-white/50 text-sm sm:text-base">Enter your Repair ID or phone number to get real-time status updates</p>
          </div>

          <div className="w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex rounded-lg bg-white/5 p-1 mb-6">
              <button type="button" onClick={() => setSearchMode('id')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${searchMode === 'id' ? 'bg-[#00D084] text-black' : 'text-white/60 hover:text-white'}`}><Hash className="w-4 h-4" /> Repair ID</button>
              <button type="button" onClick={() => setSearchMode('phone')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${searchMode === 'phone' ? 'bg-[#00D084] text-black' : 'text-white/60 hover:text-white'}`}><Phone className="w-4 h-4" /> Phone</button>
            </div>

            <AnimatePresence mode="wait">
              {searchMode === 'id' ? (
                <motion.div key="id" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-2">
                  <Label htmlFor="rid" className="text-white/80 text-sm">Repair ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input id="rid" placeholder="e.g. 550e8400-e29b-41d4..." value={repairId} onChange={(e) => setRepairId(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10 font-mono text-sm" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ph" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                  <Label htmlFor="phn" className="text-white/80 text-sm">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-3 text-white/60 text-sm shrink-0">+91</div>
                    <Input id="phn" type="tel" placeholder="Enter phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="button" onClick={handleSearch} disabled={loading} className="mt-5 w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold h-11">
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</span> : <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Track</span>}
            </Button>
          </div>
        </div>

        {/* Not Found */}
        <AnimatePresence>
          {notFound && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-400" /></div>
              <h3 className="text-lg font-semibold text-white mb-2">No repair found</h3>
              <p className="text-sm text-white/50 max-w-sm mx-auto">Please double-check the Repair ID or phone number and try again.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {repair && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
              {/* Repair Info */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">Repair Details</CardTitle>
                      <CardDescription className="text-white/40 text-xs mt-1 font-mono">ID: {repair.id}</CardDescription>
                    </div>
                    <Badge className={repair.status === 'delivered' ? 'bg-[#00D084] text-black' : 'bg-[#00D084]/10 text-[#00D084] border-[#00D084]/20'}>{REPAIR_STATUS_LABELS[repair.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-white/40">Device</p><p className="text-white font-medium">{repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model || 'N/A'}</p></div>
                    <div><p className="text-xs text-white/40">Repair Type</p><p className="text-white/80 capitalize">{repair.repair_type?.replace(/_/g, ' ') || 'N/A'}</p></div>
                    <div><p className="text-xs text-white/40">Estimated Cost</p><p className="text-[#00D084] font-semibold">{repair.estimated_cost ? `₹${repair.estimated_cost.toLocaleString('en-IN')}` : 'Pending'}</p></div>
                    <div><p className="text-xs text-white/40">Booked On</p><p className="text-white/80">{formatDate(repair.created_at)}</p></div>
                    <div><p className="text-xs text-white/40">Pickup Type</p><p className="text-white/80 capitalize">{repair.pickup_type === 'home' ? 'Home Pickup' : 'Store Drop-off'}</p></div>
                    {repair.imei_number && <div><p className="text-xs text-white/40">IMEI</p><p className="text-white/80 font-mono text-xs">{repair.imei_number}</p></div>}
                  </div>
                </CardContent>
              </Card>

              {/* Approval Gateway */}
              {repair.approval_status === 'pending' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="backdrop-blur-xl bg-amber-500/5 border-amber-500/20 shadow-2xl">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                        <div>
                          <CardTitle className="text-lg text-white">⚠️ Action Required</CardTitle>
                          <CardDescription className="text-white/40">Please review the revised quote</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {repair.approval_note && <div className="bg-white/5 rounded-xl p-4 border border-white/5"><p className="text-xs text-white/40 mb-1">Technician&apos;s Note</p><p className="text-sm text-white/80">{repair.approval_note}</p></div>}
                      {repair.approval_photo_url && (
                        <a href={repair.approval_photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#00D084] hover:underline"><ImageIcon className="w-4 h-4" /> View diagnostic photo</a>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleApprove} disabled={approvalLoading} className="flex-1 bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold h-11">
                          {approvalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> ✓ Approve & Continue</span>}
                        </Button>
                        <Button onClick={handleReject} disabled={approvalLoading} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold h-11">✗ Reject Repair</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Timeline */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Repair Progress</CardTitle>
                  <CardDescription className="text-white/40">Current: <span className="text-[#00D084] font-medium">{REPAIR_STATUS_LABELS[repair.status]}</span></CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineLoading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="flex gap-4"><Skeleton className="w-8 h-8 rounded-full bg-white/5" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32 bg-white/5" /><Skeleton className="h-3 w-48 bg-white/5" /></div></div>)}</div>
                  ) : (
                    <VerticalTimeline entries={timelines} currentStatus={repair.status} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
}
