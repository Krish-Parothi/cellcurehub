'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { DeliveryAssignment } from '@/lib/types';
import { CheckCircle, Loader2, Truck, MapPin, Phone, Smartphone, Package, Navigation, Hash } from 'lucide-react';
import { sendDeliveryEmailOtp, verifyDeliveryEmailOtp } from '@/lib/actions/delivery';

interface PickupFlowProps {
  assignment: (DeliveryAssignment & { repair?: any; ewaste?: any }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function PickupFlow({ assignment, open, onOpenChange, onComplete }: PickupFlowProps) {
  const { user } = useAuth();

  // OTP State
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);

  // Post-pickup
  const [showReachedStore, setShowReachedStore] = useState(false);
  const [markingStore, setMarkingStore] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      if (['picked_up', 'at_store', 'delivered'].includes(assignment.status)) {
        setOtpVerified(true);
        setShowReachedStore(true);
      } else {
        setOtpSent(false); setOtpInput(''); setOtpVerified(false);
        setAttempts(0); setShowReachedStore(false); setResendTimer(0);
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
  const targetId = assignment.ewaste_id || assignment.repair_id;
  const customerName = isEwaste ? assignment.ewaste?.customer?.full_name : assignment.repair?.customer?.full_name;

  // --- OTP Flow ---
  const sendOtp = async () => {
    setOtpSending(true);
    const result = await sendDeliveryEmailOtp(assignment.id, 'pickup');
    if (!result.success) {
      toast.error(result.error || 'Failed to send OTP');
    } else {
      toast.success('OTP sent to customer');
      setOtpSent(true);
      setResendTimer(60);
    }
    setOtpSending(false);
  };

  const verifyOtp = async () => {
    if (attempts >= 3) return;
    setOtpVerifying(true);
    const result = await verifyDeliveryEmailOtp(assignment.id, 'pickup', otpInput);
    if (result.success) {
      // Update models
      await supabase.from('delivery_assignments').update({ status: 'picked_up' }).eq('id', assignment.id);

      if (isEwaste) {
        await supabase.from('ewaste').update({ status: 'picked_up' }).eq('id', assignment.ewaste_id);
      } else {
        await supabase.from('repair_timeline').insert({
          repair_id: assignment.repair_id,
          status: 'pickup_scheduled',
          note: 'Device picked up by delivery boy from customer — OTP confirmed',
          updated_by: user?.id,
        });
      }

      // Notify admins
      const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'shop_admin']);
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map(a => ({
            recipient_id: a.id,
            type: 'pickup_confirmed',
            message: `Device picked up from ${customerName} — OTP confirmed`,
          }))
        );
      }

      setOtpVerified(true);
      toast.success('Pickup successful!');
      setShowReachedStore(true);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= 3) toast.error('Max attempts reached — contact support');
      else toast.error(result.error || 'Incorrect OTP');
    }
    setOtpVerifying(false);
  };

  const markAtStore = async () => {
    setMarkingStore(true);
    try {
      await supabase.from('delivery_assignments').update({ status: isEwaste ? 'delivered' : 'at_store' }).eq('id', assignment.id);
      
      if (!isEwaste) {
        await supabase.from('repairs').update({ status: 'device_received' }).eq('id', assignment.repair_id);
        await supabase.from('repair_timeline').insert({
          repair_id: assignment.repair_id,
          status: 'device_received',
          note: 'Device delivered to store by delivery boy',
          updated_by: user?.id,
        });
      }
      
      toast.success(isEwaste ? 'E-waste / Resell item delivered to store' : 'Device dropped at store');
      onComplete(); // close sheet and refresh
    } catch {
      toast.error('Failed to update');
    }
    setMarkingStore(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto text-[#1A1A1A]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF5C00]" /> Device Pickup
          </SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/60">
            {isEwaste ? 'E-Waste Pickup' : 'Repair Pickup'}
          </SheetDescription>
        </SheetHeader>

        {!showReachedStore ? (
          <div className="space-y-6">
            <div className="bg-[#F7F7F5] rounded-xl p-5 border border-[#E8E4DF]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E8E4DF]">
                  <Smartphone className="w-5 h-5 text-[#FF5C00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] text-lg">
                    {isEwaste
                      ? assignment.ewaste?.device_description
                      : (assignment.repair?.device ? `${assignment.repair.device.brand} ${assignment.repair.device.model_name}` : assignment.repair?.manual_model)}
                  </h3>
                  <div className="space-y-1.5 mt-3">
                    <p className="text-sm text-[#1A1A1A] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1A1A1A]/40" />{isEwaste ? assignment.ewaste?.address : assignment.repair?.address}</p>
                    <p className="text-sm text-[#1A1A1A] flex items-center gap-2"><Phone className="w-4 h-4 text-[#1A1A1A]/40" />{isEwaste ? assignment.ewaste?.customer?.phone : assignment.repair?.customer?.phone}</p>
                    <p className="text-sm text-[#1A1A1A] flex items-center gap-2"><span className="w-4 text-center">@</span>{isEwaste ? assignment.ewaste?.contact_email : assignment.repair?.contact_email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#1A1A1A] flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#FF5C00]" /> OTP Verification</h3>
              {!otpSent ? (
                <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#FF5C00]/10 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-6 h-6 text-[#FF5C00]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Verify Customer</h3>
                  <p className="text-[#1A1A1A]/60 text-sm mb-6 max-w-sm mx-auto">Send an OTP to the customer's registered mobile number to confirm pickup.</p>
                  <Button onClick={sendOtp} disabled={otpSending} className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white h-11">
                    {otpSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                    {otpSending ? 'Sending...' : 'Send OTP to Customer Email'}
                  </Button>
                </div>
              ) : otpVerified ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">Pickup Confirmed!</h3>
                  <p className="text-emerald-700 text-sm">The device has been successfully picked up.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 shadow-sm">
                  <Label className="text-[#1A1A1A]/80 text-sm mb-2 block text-center">Enter 6-digit OTP</Label>
                  <div className="flex justify-center mb-6">
                    <div className="relative w-48">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30" />
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="pl-10 text-center text-xl tracking-[0.5em] font-mono h-12 bg-[#F7F7F5] border-[#E8E4DF]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={verifyOtp} disabled={otpInput.length !== 6 || otpVerifying || attempts >= 3} className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white h-11">
                      {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Verify & Confirm Pickup
                    </Button>
                    <div className="text-center">
                      <Button variant="ghost" onClick={sendOtp} disabled={resendTimer > 0 || otpSending || attempts >= 3} className="text-sm text-[#1A1A1A]/60 hover:text-[#FF5C00]">
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Navigation className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Head to the Store</h3>
              <p className="text-[#1A1A1A]/60">The device has been successfully picked up.</p>
            </div>
            <div className="pt-8 w-full">
              {assignment.status === 'at_store' || assignment.status === 'delivered' ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-emerald-700 font-medium">Device is already at the store.</p>
                </div>
              ) : (
                <Button onClick={markAtStore} disabled={markingStore} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg">
                  {markingStore ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Truck className="w-5 h-5 mr-2" />}
                  Mark as 'Dropped at Store'
                </Button>
              )}
              <Button variant="ghost" onClick={onComplete} className="w-full mt-2 text-[#1A1A1A]/60">
                Close & do this later
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
