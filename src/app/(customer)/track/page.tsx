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
import { Search, Phone, Hash, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';

export default function TrackPage() {
  const [searchMode, setSearchMode] = useState<'id' | 'phone'>('id');
  const [repairId, setRepairId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [repair, setRepair] = useState<Repair | null>(null);
  const [timelines, setTimelines] = useState<RepairTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
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
    setRepair(data as Repair); 
    await fetchTimeline(id);
    setLoading(false);
  }, [fetchTimeline]);

  const searchByPhone = useCallback(async (phone: string) => {
    setLoading(true); setNotFound(false); setRepair(null); setTimelines([]);
    const formatted = phone.startsWith('+91') ? phone : `+91${phone}`;
    const { data: userData } = await supabase.from('users').select('id').eq('phone', formatted).single();
    if (!userData) { setNotFound(true); setLoading(false); return; }
    const { data } = await supabase.from('repairs').select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)').eq('customer_id', userData.id).order('created_at', { ascending: false }).limit(1).single();
    if (!data) { setNotFound(true); setLoading(false); return; }
    setRepair(data as Repair); 
    await fetchTimeline(data.id);
    setLoading(false);
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



  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#FF5C00]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FF5C00]/5 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
        {/* Search */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Track Your <span className="text-[#FF5C00]">Repair</span></h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Enter your Repair ID or phone number to get real-time status updates</p>
          </div>

          <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button type="button" onClick={() => setSearchMode('id')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${searchMode === 'id' ? 'bg-[#FF5C00] text-white' : 'text-gray-600 hover:text-gray-900'}`}><Hash className="w-4 h-4" /> Repair ID</button>
              <button type="button" onClick={() => setSearchMode('phone')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${searchMode === 'phone' ? 'bg-[#FF5C00] text-white' : 'text-gray-600 hover:text-gray-900'}`}><Phone className="w-4 h-4" /> Phone</button>
            </div>

            <AnimatePresence mode="wait">
              {searchMode === 'id' ? (
                <motion.div key="id" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-2">
                  <Label htmlFor="rid" className="text-gray-700 text-sm">Repair ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="rid" placeholder="e.g. 550e8400-e29b-41d4..." value={repairId} onChange={(e) => setRepairId(e.target.value)} className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#FF5C00] pl-10 font-mono text-sm" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ph" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                  <Label htmlFor="phn" className="text-gray-700 text-sm">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-gray-600 text-sm shrink-0">+91</div>
                    <Input id="phn" type="tel" placeholder="Enter phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#FF5C00]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="button" onClick={handleSearch} disabled={loading} className="mt-5 w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold h-11">
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</span> : <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Track</span>}
            </Button>
          </div>
        </div>

        {/* Not Found */}
        <AnimatePresence>
          {notFound && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-500" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No repair found</h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">Please double-check the Repair ID or phone number and try again.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {repair && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
              {/* Repair Info */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-900">Repair Details</CardTitle>
                      <CardDescription className="text-gray-600 text-xs mt-1 font-mono">ID: {repair.id}</CardDescription>
                    </div>
                    <Badge className={repair.status === 'delivered' ? 'bg-[#FF5C00] text-white' : 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/20'}>{REPAIR_STATUS_LABELS[repair.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-gray-600">Device</p><p className="text-gray-900 font-medium">{repair.manual_model || (repair.device ? `${repair.device.brand} ${repair.device.model_name}` : 'N/A')}</p></div>
                    <div><p className="text-xs text-gray-600">Repair Type</p><p className="text-gray-700 capitalize">{repair.repair_type?.replace(/_/g, ' ') || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-600">Estimated Cost</p><p className="text-[#FF5C00] font-semibold">{repair.estimated_cost ? `₹${repair.estimated_cost.toLocaleString('en-IN')}` : 'Pending'}</p></div>
                    <div><p className="text-xs text-gray-600">Booked On</p><p className="text-gray-700">{formatDate(repair.created_at)}</p></div>
                    <div><p className="text-xs text-gray-600">Pickup Type</p><p className="text-gray-700 capitalize">{repair.pickup_type === 'home' ? 'Home Pickup' : 'Store Drop-off'}</p></div>
                    {repair.imei_number && <div><p className="text-xs text-gray-600">IMEI</p><p className="text-gray-700 font-mono text-xs">{repair.imei_number}</p></div>}
                  </div>
                </CardContent>
              </Card>


              {/* Timeline */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Repair Progress</CardTitle>
                  <CardDescription className="text-gray-600">Current: <span className="text-[#FF5C00] font-medium">{REPAIR_STATUS_LABELS[repair.status]}</span></CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineLoading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="flex gap-4"><Skeleton className="w-8 h-8 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32 bg-gray-200" /><Skeleton className="h-3 w-48 bg-gray-200" /></div></div>)}</div>
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
