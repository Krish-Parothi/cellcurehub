'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Mail, ArrowRight, User, Phone, MapPin, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(5, 'Address is required (min 5 characters)'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: { fullName: '', phone: '', email: '', password: '', address: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    const { error } = await signUpWithPassword(data.email, data.password, data.fullName, 'customer');
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    // Store default address in localStorage
    localStorage.setItem('cellcurehub_default_address', data.address);
    // Store phone - will be updated in profile after auth
    localStorage.setItem('cellcurehub_signup_phone', data.phone);
    toast.success('Account created successfully!');
    router.push('/dashboard');
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#00D084] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">CellCureHub</h1>
          </div>

          <h2 className="text-xl font-semibold text-white text-center mb-6">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input id="fullName" type="text" placeholder="Abhishek Sharma" {...register('fullName')} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10" />
              </div>
              {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-white/80">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-3 text-white/60 text-sm shrink-0">+91</div>
                <Input id="phone" type="tel" placeholder="9876543210" maxLength={10} {...register('phone')} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]" />
              </div>
              {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10" />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input id="password" type="password" placeholder="Min. 6 characters" {...register('password')} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10" />
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-white/80">Home Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <Textarea id="address" placeholder="Flat/House No., Building, Street, Area, Nagpur" {...register('address')} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10 min-h-[70px]" />
              </div>
              {errors.address && <p className="text-red-400 text-xs">{errors.address.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-medium">
              {loading ? 'Creating Account...' : (<span className="flex items-center justify-center gap-2">Sign Up <ArrowRight className="w-4 h-4" /></span>)}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-transparent px-3 text-white/40">Or</span></div>
          </div>

          {/* Google */}
          <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium">
            {googleLoading ? 'Connecting...' : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Continue with Google
              </span>
            )}
          </Button>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <a href="/login" className="text-[#00D084] hover:text-[#00D084]/80 font-medium transition-colors">Sign In</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
