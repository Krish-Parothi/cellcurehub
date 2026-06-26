'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Phone, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading, needsPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!needsPhone) {
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        shop_admin: '/shop-admin',
        technician: '/technician',
        delivery: '/delivery',
        customer: '/dashboard',
      };
      router.replace(redirectMap[user.role] || '/dashboard');
    }
  }, [user, loading, needsPhone, router]);

  // If still loading auth or redirecting, show loading state
  if (loading || !user || !needsPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        phone: `+91${phone}`,
        ...(address.trim() ? {} : {}),
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save: ' + error.message);
      setSaving(false);
      return;
    }

    // Store address in localStorage for booking
    if (address.trim()) {
      localStorage.setItem('cellcurehub_default_address', address.trim());
    }

    toast.success('Profile updated!');
    // Reload to re-trigger auth context with updated profile
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#FF5C00]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-[#FF5C00]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#FF5C00] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Almost There!</h1>
          </div>

          <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">
            Welcome, <span className="font-semibold text-gray-900">{user.full_name}</span>! We just need your phone number to complete your profile. This helps us coordinate pickups and deliveries.
          </p>

          <div className="space-y-5">
            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-gray-600 text-sm font-medium shrink-0">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#FF5C00] font-medium"
                />
              </div>
            </div>

            {/* Address (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Home Address <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="address"
                  placeholder="Flat/House No., Building, Street, Area, Nagpur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#FF5C00] pl-10 min-h-[70px]"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={phone.length !== 10 || saving}
              className="w-full h-12 bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold text-base mt-2"
            >
              {saving ? (
                'Saving...'
              ) : (
                <span className="flex items-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
