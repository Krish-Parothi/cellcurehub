'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { NAGPUR_AREAS } from '@/lib/types';
import type { Repair } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, CircleCheck as CheckCircle, Phone, MapPin, Camera, Signature, QrCode, CreditCard, Banknote, Smartphone, Clock, ChevronRight, Shield, Hash, Loader as Loader2 } from 'lucide-react';

type RepairWithContext = Repair & {
  device: NonNullable<Repair['device']>;
  customer: NonNullable<Repair['customer']>;
};

const CUSTOMER_SELECT = '*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)';
const getArea = (address: string | null) => {
  if (!address) return 'Other';
  return NAGPUR_AREAS.find(a => address.toLowerCase().includes(a.toLowerCase())) || 'Other';
};

export default function DeliveryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pickups, setPickups] = useState<RepairWithContext[]>([]);
  const [dropoffs, setDropoffs] = useState<RepairWithContext[]>([]);
  const [fetching, setFetching] = useState(true);
  // Pickup dialog
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<RepairWithContext | null>(null);
  const [intakeChecks, setIntakeChecks] = useState([false, false, false]);
  const [markingReceived, setMarkingReceived] = useState(false);
  // Drop-off dialog
  const [dropoffDialogOpen, setDropoffDialogOpen] = useState(false);
  const [selectedDropoff, setSelectedDropoff] = useState<RepairWithContext | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'delivery')) router.replace('/login');
  }, [authLoading, user, router]);

  const fetchPickups = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase.from('repairs').select(CUSTOMER_SELECT).in('status', ['pickup_scheduled']);
    if (error) toast.error('Failed to load pickups');
    else setPickups((data as RepairWithContext[]) || []);
    setFetching(false);
  }, [user]);

  const fetchDropoffs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('repairs').select(CUSTOMER_SELECT).eq('status', 'ready');
    if (error) toast.error('Failed to load drop-offs');
    else setDropoffs((data as RepairWithContext[]) || []);
  }, [user]);

  useEffect(() => {
    if (user?.role === 'delivery') { fetchPickups(); fetchDropoffs(); }
  }, [user, fetchPickups, fetchDropoffs]);

  const groupByArea = (repairs: RepairWithContext[]) => {
    const groups: Record<string, RepairWithContext[]> = {};
    repairs.forEach(r => {
      const area = getArea(r.address);
      (groups[area] ??= []).push(r);
    });
    return groups;
  };

  const openPickupDialog = (r: RepairWithContext) => {
    setSelectedPickup(r); setIntakeChecks([false, false, false]); setPickupDialogOpen(true);
  };

  const handleMarkReceived = async () => {
    if (!selectedPickup) return;
    setMarkingReceived(true);
    const { error } = await supabase.from('repairs').update({ status: 'device_received' }).eq('id', selectedPickup.id);
    if (error) { toast.error('Failed to update status'); }
    else {
      await supabase.from('repair_timeline').insert({ repair_id: selectedPickup.id, status: 'device_received', note: 'Device received by delivery partner' });
      toast.success('Device marked as received'); setPickupDialogOpen(false); fetchPickups();
    }
    setMarkingReceived(false);
  };

  const openDropoffDialog = (r: RepairWithContext) => {
    setSelectedDropoff(r); setGeneratedOtp(''); setEnteredOtp(''); setOtpVerified(false); setPaymentMethod('cash'); setDropoffDialogOpen(true);
  };

  const handleGenerateOtp = () => setGeneratedOtp(String(Math.floor(100000 + Math.random() * 900000)));
  const handleSendOtp = () => { if (!generatedOtp) handleGenerateOtp(); toast.success('OTP sent to customer'); };
  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp && generatedOtp) { setOtpVerified(true); toast.success('OTP verified'); }
    else toast.error('Invalid OTP');
  };

  const handleMarkPaid = async () => {
    if (!selectedDropoff || selectedDropoff.final_cost == null) return;
    setMarkingPaid(true);
    const fc = selectedDropoff.final_cost;
    const { error } = await supabase.from('invoices').insert({
      repair_id: selectedDropoff.id, subtotal: fc, discount: 0, tax: Math.round(fc * 0.18),
      total: Math.round(fc * 1.18), payment_status: 'paid', payment_method: paymentMethod,
    });
    if (error) toast.error('Failed to record payment'); else toast.success('Payment recorded');
    setMarkingPaid(false);
  };

  const handleMarkDelivered = async () => {
    if (!selectedDropoff) return;
    setMarkingDelivered(true);
    const { error } = await supabase.from('repairs').update({ status: 'delivered' }).eq('id', selectedDropoff.id);
    if (error) { toast.error('Failed to mark delivered'); }
    else {
      await supabase.from('repair_timeline').insert({ repair_id: selectedDropoff.id, status: 'delivered', note: 'Device delivered to customer' });
      toast.success('Device marked as delivered'); setDropoffDialogOpen(false); fetchDropoffs();
    }
    setMarkingDelivered(false);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#00D084] border-t-transparent animate-spin" />
        <p className="text-white/50 text-sm">Loading delivery dashboard...</p>
      </div>
    </div>
  );
  if (!user || user.role !== 'delivery') return null;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const uniqueAreas = new Set([...pickups, ...dropoffs].map(r => getArea(r.address))).size;

  /* ---- Sub-components ---- */

  const CustomerInfo = ({ r }: { r: RepairWithContext }) => (
    <div className="glass rounded-xl p-4 space-y-1.5">
      <p className="text-white font-semibold">{r.customer?.full_name}</p>
      <p className="text-white/50 text-sm flex items-center gap-1.5"><Phone className="w-3 h-3" />{r.customer?.phone}</p>
      <p className="text-white/50 text-sm flex items-center gap-1.5"><MapPin className="w-3 h-3" />{r.address}</p>
      <p className="text-white/50 text-sm flex items-center gap-1.5"><Smartphone className="w-3 h-3" />{r.device?.brand} {r.device?.model_name}</p>
    </div>
  );

  const JobCard = ({ repair, type }: { repair: RepairWithContext; type: 'pickup' | 'dropoff' }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}
      onClick={() => type === 'pickup' ? openPickupDialog(repair) : openDropoffDialog(repair)}
      className="glass glass-hover rounded-2xl p-5 cursor-pointer transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-white font-semibold truncate">{repair.customer?.full_name}</h4>
          <p className="text-white/50 text-sm flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3" />{repair.customer?.phone || 'N/A'}</p>
        </div>
        <Badge className={`shrink-0 ${type === 'pickup' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' : 'bg-[#00D084]/15 text-[#00D084] border-[#00D084]/25'}`}>
          {type === 'pickup' ? 'Pickup' : 'Drop-off'}
        </Badge>
      </div>
      <div className="space-y-1.5 text-sm text-white/60 mb-3">
        <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{repair.address || 'No address'}</span></p>
        <p className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{repair.device?.brand} {repair.device?.model_name}</p>
      </div>
      <p className="text-white/40 text-xs line-clamp-2 mb-3">{repair.issue_description}</p>
      <div className="flex items-center justify-end text-[#00D084] text-xs font-medium">View Details<ChevronRight className="w-3.5 h-3.5 ml-0.5" /></div>
    </motion.div>
  );

  const JobSkeleton = () => (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between"><Skeleton className="h-5 w-28 bg-white/10" /><Skeleton className="h-5 w-16 bg-white/10 rounded-full" /></div>
      <Skeleton className="h-4 w-3/4 bg-white/10" /><Skeleton className="h-4 w-1/2 bg-white/10" /><Skeleton className="h-3 w-full bg-white/10" />
    </div>
  );

  const ManifestList = ({ repairs, type }: { repairs: RepairWithContext[]; type: 'pickup' | 'dropoff' }) => {
    const grouped = groupByArea(repairs);
    const areas = Object.keys(grouped).sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)));
    if (fetching) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <JobSkeleton key={i} />)}</div>;
    if (repairs.length === 0) return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          {type === 'pickup' ? <Truck className="w-8 h-8 text-white/20" /> : <Package className="w-8 h-8 text-white/20" />}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No {type === 'pickup' ? 'pickups' : 'drop-offs'} scheduled</h3>
        <p className="text-white/50 text-sm max-w-sm">{type === 'pickup' ? 'No devices are scheduled for pickup right now.' : 'No repaired devices are ready for delivery yet.'}</p>
      </motion.div>
    );
    return <div>{areas.map(area => (
      <div key={area} className="mb-6">
        <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-[#00D084]" /><h3 className="text-white font-semibold text-lg">{area}</h3><Badge variant="outline" className="border-white/20 text-white/50 text-xs">{grouped[area].length}</Badge></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{grouped[area].map(r => <JobCard key={r.id} repair={r} type={type} />)}</div>
      </div>
    ))}</div>;
  };

  /* ---- Stats ---- */
  const stats = [
    { icon: Truck, color: 'text-yellow-400', count: pickups.length, label: 'Pickups' },
    { icon: Package, color: 'text-[#00D084]', count: dropoffs.length, label: 'Drop-offs' },
    { icon: CheckCircle, color: 'text-blue-400', count: pickups.length + dropoffs.length, label: 'Total Jobs' },
    { icon: MapPin, color: 'text-purple-400', count: uniqueAreas, label: 'Areas' },
  ];

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Truck className="w-7 h-7 text-[#00D084]" />Delivery Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">Welcome, {user.full_name}</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2"><Clock className="w-4 h-4 text-[#00D084]" /><span className="text-white/70 text-sm">{today}</span></div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label} className="glass border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-center"><s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} /><p className="text-2xl font-bold text-white">{s.count}</p><p className="text-white/40 text-xs">{s.label}</p></CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="pickups" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="pickups" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Truck className="w-4 h-4 mr-2" />Pickups ({pickups.length})</TabsTrigger>
            <TabsTrigger value="dropoffs" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Package className="w-4 h-4 mr-2" />Drop-offs ({dropoffs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pickups"><ManifestList repairs={pickups} type="pickup" /></TabsContent>
          <TabsContent value="dropoffs"><ManifestList repairs={dropoffs} type="dropoff" /></TabsContent>
        </Tabs>
      </div>

      {/* PICKUP DIALOG */}
      <Dialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-[#00D084]" />Pickup Verification</DialogTitle>
            <DialogDescription className="text-white/50">Verify device condition and customer identity before pickup</DialogDescription>
          </DialogHeader>
          {selectedPickup && (
            <div className="space-y-5 py-2">
              <CustomerInfo r={selectedPickup} />
              <Separator className="bg-white/10" />
              {/* Intake Verification */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm font-semibold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#00D084]" />Intake Verification</Label>
                {['Physical condition OK', 'Accessories collected', 'Customer ID verified'].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Checkbox checked={intakeChecks[i]} onCheckedChange={c => { const n = [...intakeChecks]; n[i] = !!c; setIntakeChecks(n); }}
                      className="border-white/30 data-[state=checked]:bg-[#00D084] data-[state=checked]:border-[#00D084]" />
                    <span className="text-white/70 text-sm">{label}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5" onClick={() => toast('Camera coming soon')}>
                <Camera className="w-4 h-4 mr-2" />Snap Photo
              </Button>
              <Separator className="bg-white/10" />
              {/* Customer Signature */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-semibold flex items-center gap-1.5"><Signature className="w-3.5 h-3.5 text-[#00D084]" />Customer Signature</Label>
                <div className="h-24 rounded-xl border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center">
                  <p className="text-white/30 text-sm">Customer will sign here</p>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <Button onClick={handleMarkReceived} disabled={markingReceived || !intakeChecks.every(Boolean)} className="w-full gradient-green text-[#0A0A0A] font-semibold">
                {markingReceived ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Mark Device Received
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DROP-OFF DIALOG */}
      <Dialog open={dropoffDialogOpen} onOpenChange={setDropoffDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-[#00D084]" />Secure Handover</DialogTitle>
            <DialogDescription className="text-white/50">Verify OTP and collect payment before delivery</DialogDescription>
          </DialogHeader>
          {selectedDropoff && (
            <div className="space-y-5 py-2">
              <CustomerInfo r={selectedDropoff} />
              <Separator className="bg-white/10" />
              {/* OTP Verification */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm font-semibold flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#00D084]" />OTP Verification</Label>
                {generatedOtp && (
                  <div className="bg-[#00D084]/10 border border-[#00D084]/30 rounded-xl p-4 text-center">
                    <p className="text-white/40 text-xs mb-1">Generated OTP</p>
                    <p className="text-[#00D084] text-3xl font-bold tracking-[0.3em] font-mono">{generatedOtp}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-[#00D084]/30 text-[#00D084] hover:bg-[#00D084]/10" onClick={handleGenerateOtp}>Generate OTP</Button>
                  <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5" onClick={handleSendOtp}>Send OTP to Customer</Button>
                </div>
                {!otpVerified && (
                  <div className="flex items-center gap-2">
                    <Input placeholder="Enter OTP" value={enteredOtp} onChange={e => setEnteredOtp(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] font-mono tracking-widest text-center" maxLength={6} />
                    <Button size="sm" onClick={handleVerifyOtp} disabled={!enteredOtp} className="gradient-green text-[#0A0A0A] font-semibold shrink-0">Verify</Button>
                  </div>
                )}
                {otpVerified && <div className="flex items-center gap-2 text-[#00D084] text-sm"><CheckCircle className="w-4 h-4" />OTP verified successfully</div>}
              </div>
              <Separator className="bg-white/10" />
              {/* Payment Collection */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm font-semibold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-[#00D084]" />Payment Collection</Label>
                <div className="glass rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-1">Final Cost</p>
                  <p className="text-white text-2xl font-bold">Rs. {(selectedDropoff.final_cost ?? 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([{ key: 'cash' as const, icon: Banknote, label: 'Cash' }, { key: 'upi' as const, icon: QrCode, label: 'UPI' }, { key: 'card' as const, icon: CreditCard, label: 'Card' }]).map(({ key, icon: Icon, label }) => (
                      <button key={key} onClick={() => setPaymentMethod(key)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 ${paymentMethod === key ? 'border-[#00D084]/50 bg-[#00D084]/10 text-[#00D084]' : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5'}`}>
                        <Icon className="w-5 h-5" /><span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethod === 'upi' && (
                  <div className="bg-[#00D084]/10 border border-[#00D084]/30 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center"><QrCode className="w-10 h-10 text-[#00D084] mx-auto mb-2" /><p className="text-[#00D084] text-sm font-semibold">UPI QR</p></div>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleMarkPaid} disabled={markingPaid} className="w-full border-[#00D084]/30 text-[#00D084] hover:bg-[#00D084]/10">
                  {markingPaid ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Mark as Paid
                </Button>
              </div>
              <Separator className="bg-white/10" />
              <Button onClick={handleMarkDelivered} disabled={markingDelivered || !otpVerified} className="w-full gradient-green text-[#0A0A0A] font-semibold">
                {markingDelivered ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}Mark Delivered
              </Button>
              {!otpVerified && <p className="text-white/30 text-xs text-center">Verify OTP first to enable delivery confirmation</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
