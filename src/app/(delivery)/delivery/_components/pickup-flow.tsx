'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { INTAKE_CONDITION_CHECKS } from '@/lib/types';
import type { DeliveryAssignment } from '@/lib/types';
import { Camera, CheckCircle, Loader2, Truck, PenTool, Hash, MapPin, Phone, Smartphone, Package } from 'lucide-react';

interface PickupFlowProps {
  assignment: (DeliveryAssignment & { repair: any }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const STEPS = ['Intake Verification', 'Customer Signature', 'OTP Confirmation'];

export default function PickupFlow({ assignment, open, onOpenChange, onComplete }: PickupFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  // Step 1 - Intake
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [conditionChecks, setConditionChecks] = useState<Record<string, boolean>>({});
  const [observations, setObservations] = useState('');

  // Step 2 - Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Step 3 - OTP
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Post-pickup
  const [showReachedStore, setShowReachedStore] = useState(false);
  const [markingStore, setMarkingStore] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0); setPhotos([]); setConditionChecks({}); setObservations('');
      setHasSigned(false); setOtpSent(false); setOtpInput(''); setOtpVerified(false);
      setAttempts(0); setShowReachedStore(false);
    }
  }, [open]);

  // Canvas drawing
  useEffect(() => {
    if (step !== 1 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#00D084';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSigned(true);
    };
    const end = () => { isDrawing.current = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', end);
    };
  }, [step, open]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); setHasSigned(false); }
  };

  if (!assignment) return null;
  const repair = assignment.repair;

  // --- Step 1: Submit Intake ---
  const canProceedStep1 = photos.length >= 1 && Object.values(conditionChecks).some(Boolean);

  const submitIntake = async () => {
    if (!canProceedStep1) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of photos) {
        const path = `repair-photos/${repair.id}/intake/${Date.now()}_${file.name}`;
        await supabase.storage.from('repair-photos').upload(path, file);
        const { data: { publicUrl } } = supabase.storage.from('repair-photos').getPublicUrl(path);
        urls.push(publicUrl);
      }
      const conditionData = { ...conditionChecks, additional_observations: observations };
      await supabase.from('delivery_assignments').update({
        intake_photos: urls,
        intake_condition: conditionData,
      }).eq('id', assignment.id);
      toast.success('Intake data saved');
      setStep(1);
    } catch { toast.error('Failed to upload photos'); }
    setUploading(false);
  };

  // --- Step 2: Submit Signature ---
  const submitSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    setUploading(true);
    try {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Canvas export failed');
      const path = `repair-photos/${repair.id}/signature/pickup_${Date.now()}.png`;
      await supabase.storage.from('repair-photos').upload(path, blob);
      const { data: { publicUrl } } = supabase.storage.from('repair-photos').getPublicUrl(path);
      await supabase.from('delivery_assignments').update({ customer_signature_url: publicUrl }).eq('id', assignment.id);
      toast.success('Signature saved');
      setStep(2);
    } catch { toast.error('Failed to save signature'); }
    setUploading(false);
  };

  // --- Step 3: OTP ---
  const sendOtp = async () => {
    setOtpSending(true);
    try {
      // Try Edge Function first, fallback to client-side
      const invokePromise = supabase.functions.invoke('send-pickup-otp', {
        body: { assignment_id: assignment.id, phone: repair.customer?.phone },
      });
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Edge Function timed out') }), 4000)
      );
      const { error } = await Promise.race([invokePromise, timeoutPromise]);
      if (error) {
        // Fallback: generate OTP client-side and store in DB
        const otp = String(Math.floor(1000 + Math.random() * 9000));
        await supabase.from('delivery_assignments').update({ pickup_otp: otp }).eq('id', assignment.id);
        toast.success(`OTP generated: ${otp} (dev mode — SMS not configured)`);
      } else {
        toast.success('OTP sent to customer');
      }
      setOtpSent(true);
    } catch {
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      await supabase.from('delivery_assignments').update({ pickup_otp: otp }).eq('id', assignment.id);
      toast.success(`OTP generated: ${otp} (dev mode)`);
      setOtpSent(true);
    }
    setOtpSending(false);
  };

  const verifyOtp = async () => {
    if (attempts >= 3) return;
    setOtpVerifying(true);
    const { data } = await supabase.from('delivery_assignments').select('pickup_otp').eq('id', assignment.id).single();
    if (data?.pickup_otp === otpInput) {
      // Update all tables
      await supabase.from('repairs').update({ status: 'device_received', updated_at: new Date().toISOString() }).eq('id', repair.id);
      await supabase.from('delivery_assignments').update({ status: 'picked_up' }).eq('id', assignment.id);
      await supabase.from('repair_timeline').insert({
        repair_id: repair.id, status: 'device_received',
        note: 'Device picked up from customer — OTP confirmed', updated_by: user?.id,
      });
      // Notify admins
      const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'shop_admin']);
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map(a => ({
            recipient_id: a.id, type: 'pickup_confirmed',
            message: `Device picked up from ${repair.customer?.full_name} for repair ${repair.id.split('-')[0]}`,
          }))
        );
      }
      setOtpVerified(true);
      setShowReachedStore(true);
      toast.success('✓ Device picked up successfully!');
    } else {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= 3) toast.error('Max attempts reached — contact support');
      else toast.error('Incorrect OTP');
    }
    setOtpVerifying(false);
  };

  const markReachedStore = async () => {
    setMarkingStore(true);
    await supabase.from('delivery_assignments').update({ status: 'at_store' }).eq('id', assignment.id);
    await supabase.from('repair_timeline').insert({
      repair_id: repair.id, status: 'device_received',
      note: 'Device arrived at shop', updated_by: user?.id,
    });
    const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'shop_admin']);
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({
          recipient_id: a.id, type: 'device_at_store',
          message: `${repair.customer?.full_name}'s device has arrived at the store`,
        }))
      );
    }
    toast.success('Marked as reached store');
    setMarkingStore(false);
    onComplete();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full bg-[#0A0A0A] border-l border-white/10 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#00D084]" /> Pickup Flow
          </SheetTitle>
          <SheetDescription className="text-white/50">
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < step ? 'bg-[#00D084] text-black' : i === step ? 'bg-[#00D084]/20 text-[#00D084] ring-2 ring-[#00D084]' : 'bg-white/10 text-white/30'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs truncate ${i === step ? 'text-white' : 'text-white/30'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-[#00D084]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Customer Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-1.5 text-sm">
          <p className="text-white font-semibold">{repair.customer?.full_name}</p>
          <a href={`tel:${repair.customer?.phone}`} className="text-[#00D084] flex items-center gap-1.5">
            <Phone className="w-3 h-3" />{repair.customer?.phone}
          </a>
          <p className="text-white/50 flex items-center gap-1.5"><MapPin className="w-3 h-3" />{repair.address}</p>
          <p className="text-white/50 flex items-center gap-1.5">
            <Smartphone className="w-3 h-3" />
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </p>
          {assignment.special_instructions && (
            <p className="text-amber-400 text-xs mt-2">⚠ {assignment.special_instructions}</p>
          )}
        </div>

        <div className="space-y-6 pb-12">
          {/* STEP 1: Intake */}
          {step === 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00D084]" /> Intake Verification
              </h3>

              <div>
                <Label className="text-white/60 text-xs block mb-1">Device Photos (min 1) *</Label>
                <Input type="file" accept="image/*" capture="environment" multiple
                  onChange={e => setPhotos(Array.from(e.target.files || []))}
                  className="bg-white/5 border-white/10 text-white text-sm" />
                {photos.length > 0 && <p className="text-xs text-[#00D084] mt-1">{photos.length} photo(s) selected</p>}
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2">
                <Label className="text-white/80 text-xs block mb-2">Condition Checklist</Label>
                {INTAKE_CONDITION_CHECKS.map(item => (
                  <label key={item.key} className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                    <input type="checkbox" checked={!!conditionChecks[item.key]}
                      onChange={e => setConditionChecks(p => ({ ...p, [item.key]: e.target.checked }))}
                      className="rounded bg-white/10 border-white/20 text-[#00D084] focus:ring-[#00D084]" />
                    {item.label}
                  </label>
                ))}
              </div>

              <div>
                <Label className="text-white/60 text-xs block mb-1">Additional Observations</Label>
                <Textarea value={observations} onChange={e => setObservations(e.target.value)}
                  placeholder="Note any damage, scratches, etc..."
                  className="bg-white/5 border-white/10 text-white min-h-[60px]" />
              </div>

              <Button onClick={submitIntake} disabled={!canProceedStep1 || uploading}
                className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save & Continue to Signature
              </Button>
            </section>
          )}

          {/* STEP 2: Signature */}
          {step === 1 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#00D084]" /> Customer Signature
              </h3>
              <p className="text-xs text-white/50">Customer confirms current device condition</p>

              <div className="relative">
                <canvas ref={canvasRef}
                  className="w-full h-40 rounded-xl border border-dashed border-white/20 bg-white/[0.02] touch-none cursor-crosshair" />
                {!hasSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-white/20 text-sm">Sign here</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={clearCanvas}
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">Clear</Button>
                <Button onClick={submitSignature} disabled={!hasSigned || uploading}
                  className="flex-1 bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save & Continue to OTP
                </Button>
              </div>
            </section>
          )}

          {/* STEP 3: OTP */}
          {step === 2 && !otpVerified && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#00D084]" /> OTP Confirmation
              </h3>

              <Button onClick={sendOtp} disabled={otpSending || otpSent}
                variant="outline" className="w-full border-[#00D084]/30 text-[#00D084] hover:bg-[#00D084]/10">
                {otpSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {otpSent ? 'OTP Sent ✓' : 'Send OTP to Customer'}
              </Button>

              {otpSent && attempts < 3 && (
                <div className="space-y-3">
                  <Input value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4-digit OTP" maxLength={4}
                    className="bg-white/5 border-white/10 text-white text-center text-2xl font-mono tracking-[0.5em] h-14" />
                  <Button onClick={verifyOtp} disabled={otpInput.length !== 4 || otpVerifying}
                    className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                    {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm OTP
                  </Button>
                  {attempts > 0 && <p className="text-xs text-red-400 text-center">{3 - attempts} attempt(s) remaining</p>}
                </div>
              )}

              {attempts >= 3 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-semibold">Max attempts reached</p>
                  <p className="text-red-400/60 text-xs mt-1">Please contact support for assistance</p>
                </div>
              )}
            </section>
          )}

          {/* Success + Reached Store */}
          {otpVerified && (
            <section className="space-y-4 text-center">
              <div className="bg-[#00D084]/10 border border-[#00D084]/20 rounded-2xl p-8">
                <CheckCircle className="w-12 h-12 text-[#00D084] mx-auto mb-3" />
                <h3 className="text-white text-lg font-bold">Device Picked Up Successfully!</h3>
                <p className="text-white/50 text-sm mt-1">OTP confirmed — device is now in transit</p>
              </div>

              {showReachedStore && (
                <Button onClick={markReachedStore} disabled={markingStore}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                  {markingStore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                  Mark as Reached Store
                </Button>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
