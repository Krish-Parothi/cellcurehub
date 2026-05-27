'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { DeliveryAssignment, Invoice } from '@/lib/types';
import { Package, CheckCircle, Loader2, Hash, Phone, MapPin, Smartphone, CreditCard, Banknote, IndianRupee, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DropoffFlowProps {
  assignment: (DeliveryAssignment & { repair: any; invoice: any }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function DropoffFlow({ assignment, open, onOpenChange, onComplete }: DropoffFlowProps) {
  const { user } = useAuth();

  // OTP
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Payment
  const [cashAmount, setCashAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (open) {
      setOtpSent(false); setOtpInput(''); setOtpVerified(false);
      setAttempts(0); setCashAmount(''); setPaymentDone(false);
    }
  }, [open]);

  if (!assignment) return null;
  const repair = assignment.repair;
  const invoicesArray = assignment.repair?.invoices || [];
  const invoice: Invoice | null = invoicesArray.length > 0 ? invoicesArray[0] : null;
  const needsPayment = invoice && invoice.payment_status === 'pending';

  const sendOtp = async () => {
    setOtpSending(true);
    try {
      const invokePromise = supabase.functions.invoke('send-delivery-otp', {
        body: { assignment_id: assignment.id, phone: repair.customer?.phone },
      });
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Edge Function timed out') }), 4000)
      );
      const { error } = await Promise.race([invokePromise, timeoutPromise]);
      if (error) {
        const otp = String(Math.floor(1000 + Math.random() * 9000));
        await supabase.from('delivery_assignments').update({ delivery_otp: otp }).eq('id', assignment.id);
        toast.success(`OTP generated: ${otp} (dev mode — SMS not configured)`);
      } else {
        toast.success('OTP sent to customer');
      }
      setOtpSent(true);
    } catch {
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      await supabase.from('delivery_assignments').update({ delivery_otp: otp }).eq('id', assignment.id);
      toast.success(`OTP generated: ${otp} (dev mode)`);
      setOtpSent(true);
    }
    setOtpSending(false);
  };

  const verifyOtp = async () => {
    if (attempts >= 3) return;
    setOtpVerifying(true);
    const { data } = await supabase.from('delivery_assignments').select('delivery_otp').eq('id', assignment.id).single();
    if (data?.delivery_otp === otpInput) {
      await supabase.from('repairs').update({
        status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', repair.id);
      await supabase.from('delivery_assignments').update({ status: 'delivered' }).eq('id', assignment.id);
      await supabase.from('repair_timeline').insert({
        repair_id: repair.id, status: 'delivered',
        note: 'Device delivered to customer — OTP confirmed', updated_by: user?.id,
      });
      const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'shop_admin']);
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map(a => ({
            recipient_id: a.id, type: 'delivery_confirmed',
            message: `Delivered to ${repair.customer?.full_name} — OTP confirmed`,
          }))
        );
      }
      setOtpVerified(true);
      toast.success('Device delivered successfully!');
      if (!needsPayment) { onComplete(); }
    } else {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= 3) toast.error('Max attempts reached — contact support');
      else toast.error('Incorrect OTP');
    }
    setOtpVerifying(false);
  };

  const processPayment = async (method: 'upi' | 'cash') => {
    if (!invoice) return;
    setProcessingPayment(true);
    await supabase.from('invoices').update({
      payment_status: 'paid', payment_method: method,
    }).eq('id', invoice.id);
    setPaymentDone(true);
    toast.success('Payment recorded!');
    setProcessingPayment(false);
    onComplete();
  };

  const upiString = invoice
    ? `upi://pay?pa=${invoice.merchant_upi_id || 'cellcurehub@upi'}&pn=CellCureHub&am=${invoice.total}&tn=Repair-${repair.id.split('-')[0]}`
    : '';

  const markOutForDelivery = async () => {
    try {
      await supabase.from('delivery_assignments').update({ status: 'out_for_delivery' }).eq('id', assignment.id);
      await supabase.from('repairs').update({ status: 'out_for_delivery' }).eq('id', repair.id);
      toast.success('Marked as Out for Delivery');
      onComplete(); // Refresh parent view
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full bg-[#0A0A0A] border-l border-white/10 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" /> Drop-off Flow
          </SheetTitle>
          <SheetDescription className="text-white/50">
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </SheetDescription>
        </SheetHeader>

        {/* Delivery Details */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-1.5 text-sm">
          <p className="text-white font-semibold">{repair.customer?.full_name}</p>
          <a href={`tel:${repair.customer?.phone}`} className="text-[#00D084] flex items-center gap-1.5">
            <Phone className="w-3 h-3" />{repair.customer?.phone}
          </a>
          <p className="text-white/50 flex items-center gap-1.5"><MapPin className="w-3 h-3" />{repair.address}</p>
          <p className="text-white/50 flex items-center gap-1.5">
            <Smartphone className="w-3 h-3" />
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
            {repair.repair_type && <span className="text-white/30 ml-1">• {repair.repair_type.replace(/_/g, ' ')}</span>}
          </p>
          {invoice && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
              <IndianRupee className="w-3.5 h-3.5 text-[#00D084]" />
              <span className="text-white font-bold text-lg">₹{invoice.total.toLocaleString('en-IN')}</span>
              <Badge className={invoice.payment_status === 'paid' ? 'bg-[#00D084]/20 text-[#00D084]' : 'bg-amber-500/20 text-amber-500'}>
                {invoice.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-6 pb-12">
          {/* STEP 0: Out for Delivery */}
          {assignment.status !== 'out_for_delivery' && assignment.status !== 'delivered' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#00D084]" /> Status Update
              </h3>
              <Button onClick={markOutForDelivery} className="w-full bg-white/10 hover:bg-white/20 text-white">
                Mark as Out for Delivery
              </Button>
            </div>
          )}

          {/* STEP 1: OTP Handover */}
          {!otpVerified && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-400" /> OTP Handover
              </h3>

              <Button onClick={sendOtp} disabled={otpSending || otpSent}
                variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                {otpSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {otpSent ? 'OTP Sent ✓' : 'Send OTP to Customer'}
              </Button>

              {otpSent && attempts < 3 && (
                <div className="space-y-3">
                  <Input value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4-digit OTP" maxLength={4}
                    className="bg-white/5 border-white/10 text-white text-center text-2xl font-mono tracking-[0.5em] h-14" />
                  <Button onClick={verifyOtp} disabled={otpInput.length !== 4 || otpVerifying}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                    {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Handover
                  </Button>
                  {attempts > 0 && <p className="text-xs text-red-400 text-center">{3 - attempts} attempt(s) remaining</p>}
                </div>
              )}

              {attempts >= 3 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-semibold">Max attempts reached</p>
                  <p className="text-red-400/60 text-xs mt-1">Please contact support</p>
                </div>
              )}
            </section>
          )}

          {/* Success */}
          {otpVerified && !needsPayment && (
            <div className="bg-[#00D084]/10 border border-[#00D084]/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-[#00D084] mx-auto mb-3" />
              <h3 className="text-white text-lg font-bold">Delivered Successfully!</h3>
              <p className="text-white/50 text-sm mt-1">Job complete — no payment pending</p>
            </div>
          )}

          {/* STEP 2: Payment Collection */}
          {otpVerified && needsPayment && !paymentDone && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00D084]" /> Payment Collection
              </h3>

              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Amount Due</p>
                <p className="text-white text-3xl font-bold">₹{invoice!.total.toLocaleString('en-IN')}</p>
              </div>

              <Tabs defaultValue="upi" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 w-full">
                  <TabsTrigger value="upi" className="flex-1 data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> UPI
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="flex-1 data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]">
                    <Banknote className="w-3.5 h-3.5 mr-1.5" /> Cash
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upi" className="space-y-4 mt-4">
                  <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                    <QRCodeSVG value={upiString} size={200} level="H"
                      bgColor="#ffffff" fgColor="#000000" />
                    <p className="text-black/60 text-xs mt-3 text-center break-all max-w-[200px]">{upiString}</p>
                  </div>
                  <Button onClick={() => processPayment('upi')} disabled={processingPayment}
                    className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Payment Received
                  </Button>
                </TabsContent>

                <TabsContent value="cash" className="space-y-4 mt-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-white/50 text-sm mb-1">Collect from customer</p>
                    <p className="text-[#00D084] text-3xl font-bold">₹{invoice!.total.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs block mb-1">Amount Received (confirmation)</Label>
                    <Input value={cashAmount} onChange={e => setCashAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder={`₹${invoice!.total}`} type="text"
                      className="bg-white/5 border-white/10 text-white text-center text-xl font-mono h-12" />
                  </div>
                  <Button onClick={() => processPayment('cash')}
                    disabled={processingPayment || Number(cashAmount) !== invoice!.total}
                    className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
                    Mark Cash Received
                  </Button>
                  {cashAmount && Number(cashAmount) !== invoice!.total && (
                    <p className="text-xs text-amber-400 text-center">Amount must match ₹{invoice!.total.toLocaleString('en-IN')}</p>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          )}

          {/* Payment Complete */}
          {paymentDone && (
            <div className="bg-[#00D084]/10 border border-[#00D084]/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-[#00D084] mx-auto mb-3" />
              <h3 className="text-white text-lg font-bold">Job Complete!</h3>
              <p className="text-white/50 text-sm mt-1">Device delivered & payment collected</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
