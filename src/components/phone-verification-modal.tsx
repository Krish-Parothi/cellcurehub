'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { sendBookingOtp, verifyBookingOtp } from '@/lib/actions/otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PhoneVerificationModal() {
  const { user, needsPhoneVerification } = useAuth();
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  if (!needsPhoneVerification || !user) return null;

  const handleSendOtp = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    const result = await sendBookingOtp(phone);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('OTP sent via SMS');
    setShowOtp(true);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    const result = await verifyBookingOtp(phone, otpCode);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // Update user profile in Supabase
    const { error } = await supabase
      .from('users')
      .update({ phone: `+91${phone}`, phone_verified: true })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Phone number verified successfully!');
    // Reload page to re-trigger auth context state
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white border border-[#E8E4DF] p-8 rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mb-6">
          <Phone className="w-6 h-6 text-[#FF5C00]" />
        </div>
        
        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Almost there!</h3>
        <p className="text-sm text-[#1A1A1A]/70 mb-8 leading-relaxed">
          To ensure smooth communication regarding your repairs and deliveries, we require a verified Indian phone number.
        </p>
        
        {!showOtp ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/80 font-semibold text-sm">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center rounded-md border border-[#E8E4DF] bg-[#F7F7F5] px-3 text-[#1A1A1A]/60 text-sm font-medium shrink-0">
                  +91
                </div>
                <Input 
                  type="tel" 
                  maxLength={10} 
                  placeholder="9876543210" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-white border-[#E8E4DF] focus-visible:ring-[#FF5C00] font-medium" 
                />
              </div>
            </div>
            <Button 
              onClick={handleSendOtp} 
              disabled={phone.length !== 10 || loading} 
              className="w-full h-12 bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold text-base mt-2"
            >
              {loading ? 'Sending OTP...' : <span className="flex items-center gap-2">Send Verification Code <ArrowRight className="w-4 h-4" /></span>}
            </Button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#1A1A1A]/80 font-semibold text-sm">Enter 6-digit OTP</Label>
                <button onClick={() => setShowOtp(false)} className="text-xs text-[#FF5C00] font-medium hover:underline">Change Number</button>
              </div>
              <Input 
                type="text" 
                maxLength={6} 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" 
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" 
              />
            </div>
            <Button 
              onClick={handleVerifyOtp} 
              disabled={otpCode.length !== 6 || loading} 
              className="w-full h-12 bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold text-base mt-2"
            >
              {loading ? 'Verifying...' : <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Verify & Continue</span>}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
