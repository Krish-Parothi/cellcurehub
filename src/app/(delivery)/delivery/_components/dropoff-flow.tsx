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
import { Package, CheckCircle, Loader2, Hash, Phone, MapPin, Smartphone, CreditCard, Banknote, IndianRupee, Truck, Navigation } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { sendDeliveryEmailOtp, verifyDeliveryEmailOtp } from '@/lib/actions/delivery';

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
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (assignment?.id) {
      if (sessionStorage.getItem(`otp_sent_${assignment.id}`)) {
        setOtpSent(true);
      }
    }
  }, [assignment?.id]);

  // Payment
  const [cashAmount, setCashAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      if (assignment.status === 'delivered') {
        setOtpVerified(true);
        if (assignment.repair?.invoices?.[0]?.payment_status === 'paid') {
          setPaymentDone(true);
        }
      } else {
        if (assignment?.id && sessionStorage.getItem(`otp_sent_${assignment.id}`)) {
          setOtpSent(true);
        } else {
          setOtpSent(false);
        }
        setOtpInput(''); setOtpVerified(false);
        setAttempts(0); setCashAmount(''); setPaymentDone(false); setResendTimer(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  if (!assignment) return null;
  const isEwaste = !!assignment.ewaste_id;
  if (isEwaste) return null; // E-waste is pickup only

  const repair = assignment.repair;
  const invoicesArray = assignment.repair?.invoices || [];
  const invoice: Invoice | null = invoicesArray.length > 0 ? invoicesArray[0] : null;
  const needsPayment = invoice && invoice.payment_status === 'pending';

  const sendOtp = async () => {
    setOtpSending(true);
    const result = await sendDeliveryEmailOtp(assignment.id, 'delivery');
    if (!result.success) {
      toast.error(result.error || 'Failed to send OTP');
    } else {
      toast.success('OTP sent to customer');
      setOtpSent(true);
      if (assignment?.id) {
        sessionStorage.setItem(`otp_sent_${assignment.id}`, 'true');
      }
      setResendTimer(30);
    }
    setOtpSending(false);
  };

  const verifyOtp = async () => {
    if (attempts >= 3) return;
    setOtpVerifying(true);
    const result = await verifyDeliveryEmailOtp(assignment.id, 'delivery', otpInput);
    if (result.success) {
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
      else toast.error(result.error || 'Incorrect OTP');
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
      <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto text-[#1A1A1A]">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Drop-off Flow
          </SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/60">
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </SheetDescription>
        </SheetHeader>

        {/* Delivery Details */}
        <div className="bg-[#F7F7F5] border border-[#E8E4DF] rounded-xl p-4 mb-6 space-y-1.5 text-sm relative">
          <p className="text-[#1A1A1A] font-semibold">{repair.customer?.full_name}</p>
          <a href={`tel:${repair.customer?.phone}`} className="text-[#FF5C00] flex items-center gap-1.5 font-medium hover:underline">
            <Phone className="w-3 h-3" />{repair.customer?.phone}
          </a>
          {repair.contact_email && <p className="text-[#1A1A1A]/60 flex items-center gap-1.5"><span className="w-3 h-3 flex items-center justify-center font-bold text-xs">@</span>{repair.contact_email}</p>}
          <p className="text-[#1A1A1A]/60 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#1A1A1A]/40" />{repair.address}</p>
          <p className="text-[#1A1A1A]/60 flex items-center gap-1.5">
            <Smartphone className="w-3 h-3 text-[#1A1A1A]/40" />
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
            {repair.repair_type && <span className="text-[#1A1A1A]/40 ml-1">• {repair.repair_type.replace(/_/g, ' ')}</span>}
          </p>
          {invoice && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DF]">
              <IndianRupee className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span className="text-[#1A1A1A] font-bold text-lg">₹{invoice.total.toLocaleString('en-IN')}</span>
              <Badge className={invoice.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}>
                {invoice.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </Badge>
            </div>
          )}
          <Button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(repair.address || '')}`, '_blank')}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-white border-[#FF5C00]/20 text-[#FF5C00] hover:bg-[#FF5C00]/10 hover:text-[#FF5C00]"
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" /> Navigate
          </Button>
        </div>

        <div className="space-y-6 pb-12">
          {/* STEP 0: Out for Delivery */}
          {assignment.status !== 'out_for_delivery' && assignment.status !== 'delivered' && (
            <div className="bg-[#F7F7F5] rounded-xl p-4 border border-[#E8E4DF] mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]/80 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF5C00]" /> Status Update
              </h3>
              <Button onClick={markOutForDelivery} className="w-full bg-white border border-[#E8E4DF] hover:bg-[#F7F7F5] text-[#1A1A1A] font-semibold shadow-xs">
                Mark as Out for Delivery
              </Button>
            </div>
          )}

          {/* STEP 1: OTP Handover */}
          {!otpVerified && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]/80 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" /> OTP Handover
              </h3>

              <Button onClick={sendOtp} disabled={otpSending || otpSent}
                variant="outline" className="w-full border-blue-500/30 text-blue-600 hover:bg-blue-500/10 font-semibold">
                {otpSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {otpSent ? 'OTP Sent ✓' : 'Send OTP to Customer Email'}
              </Button>

              {otpSent && attempts < 3 && (
                <div className="space-y-3">
                  <Input value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP" maxLength={6}
                    className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] text-center text-2xl font-mono tracking-[0.5em] h-14" />
                  <Button onClick={verifyOtp} disabled={otpInput.length !== 6 || otpVerifying}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Handover
                  </Button>
                  <div className="flex justify-between items-center text-xs">
                    {attempts > 0 && <p className="text-red-600 font-medium">{3 - attempts} attempt(s) remaining</p>}
                    <button disabled={resendTimer > 0 || otpSending} onClick={sendOtp} className={`ml-auto ${resendTimer > 0 ? 'text-[#1A1A1A]/30' : 'text-blue-600 hover:text-blue-700 font-semibold'}`}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              {attempts >= 3 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-600 font-semibold">Max attempts reached</p>
                  <p className="text-red-500/60 text-xs mt-1">Please contact support</p>
                </div>
              )}
            </section>
          )}

          {/* Success */}
          {otpVerified && !needsPayment && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-emerald-800 text-lg font-bold">Delivered Successfully!</h3>
              <p className="text-emerald-700/80 text-sm mt-1 font-medium">Job complete — no payment pending</p>
            </div>
          )}

          {/* STEP 2: Payment Collection */}
          {otpVerified && needsPayment && !paymentDone && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]/80 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF5C00]" /> Payment Collection
              </h3>

              <div className="bg-[#F7F7F5] border border-[#E8E4DF] rounded-xl p-4 text-center">
                <p className="text-[#1A1A1A]/60 text-xs mb-1">Amount Due</p>
                <p className="text-[#1A1A1A] text-3xl font-bold">₹{invoice!.total.toLocaleString('en-IN')}</p>
              </div>

              <Tabs defaultValue="upi" className="w-full">
                <TabsList className="bg-[#F7F7F5] border border-[#E8E4DF] w-full">
                  <TabsTrigger value="upi" className="flex-1 data-[state=active]:bg-[#FF5C00]/10 data-[state=active]:text-[#FF5C00] text-[#1A1A1A]/70 font-semibold">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> UPI
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="flex-1 data-[state=active]:bg-[#FF5C00]/10 data-[state=active]:text-[#FF5C00] text-[#1A1A1A]/70 font-semibold">
                    <Banknote className="w-3.5 h-3.5 mr-1.5" /> Cash
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upi" className="space-y-4 mt-4">
                  <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 flex flex-col items-center shadow-xs">
                    <QRCodeSVG value={upiString} size={200} level="H"
                      bgColor="#ffffff" fgColor="#000000" />
                    <p className="text-[#1A1A1A]/60 text-xs mt-3 text-center break-all max-w-[200px] font-mono">{upiString}</p>
                  </div>
                  <Button onClick={() => processPayment('upi')} disabled={processingPayment}
                    className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Payment Received
                  </Button>
                </TabsContent>

                <TabsContent value="cash" className="space-y-4 mt-4">
                  <div className="bg-[#F7F7F5] rounded-xl p-4 border border-[#E8E4DF] text-center">
                    <p className="text-[#1A1A1A]/55 text-sm mb-1">Collect from customer</p>
                    <p className="text-[#FF5C00] text-3xl font-bold">₹{invoice!.total.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <Label className="text-[#1A1A1A]/60 text-xs block mb-1">Amount Received (confirmation)</Label>
                    <Input value={cashAmount} onChange={e => setCashAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder={`₹${invoice!.total}`} type="text"
                      className="bg-white border-[#E8E4DF] text-[#1A1A1A] text-center text-xl font-mono h-12" />
                  </div>
                  <Button onClick={() => processPayment('cash')}
                    disabled={processingPayment || Number(cashAmount) !== invoice!.total}
                    className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
                    Mark Cash Received
                  </Button>
                  {cashAmount && Number(cashAmount) !== invoice!.total && (
                    <p className="text-xs text-amber-600 font-semibold text-center">Amount must match ₹{invoice!.total.toLocaleString('en-IN')}</p>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          )}

          {/* Payment Complete */}
          {paymentDone && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-emerald-800 text-lg font-bold">Job Complete!</h3>
              <p className="text-emerald-700/80 text-sm mt-1 font-medium">Device delivered & payment collected</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
