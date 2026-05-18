'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Phone, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type LoginMethod = 'phone' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const {
    signInWithPhone,
    verifyOtp,
    signInWithPassword,
    signInWithGoogle,
  } = useAuth();

  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // --- Phone + OTP ---
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    setOtpLoading(true);
    const { error } = await signInWithPhone(`+91${phone}`);
    setOtpLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(`+91${phone}`, otp);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Login successful');
      router.push('/dashboard');
    }
  };

  // --- Email + Password ---
  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Login successful');
      router.push('/dashboard');
    }
  };

  // --- Google ---
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
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#00D084] flex items-center justify-center mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">CellCureHub</h1>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Welcome Back
          </h2>

          {/* Method toggle */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setOtpSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                method === 'phone'
                  ? 'bg-[#00D084] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setOtpSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                method === 'email'
                  ? 'bg-[#00D084] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          {/* Phone + OTP form */}
          {method === 'phone' && (
            <motion.div
              key="phone-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/80">
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-3 text-white/60 text-sm shrink-0">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                  />
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="bg-[#00D084] hover:bg-[#00D084]/90 text-black shrink-0"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </div>
              </div>

              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="otp" className="text-white/80">
                    OTP
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="bg-[#00D084] hover:bg-[#00D084]/90 text-black shrink-0"
                    >
                      {loading ? (
                        'Verifying...'
                      ) : (
                        <span className="flex items-center gap-1">
                          Verify <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Email + Password form */}
          {method === 'email' && (
            <motion.div
              key="email-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleEmailSignIn}
                disabled={loading}
                className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-medium"
              >
                {loading ? (
                  'Signing In...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-3 text-white/40">Or</span>
            </div>
          </div>

          {/* Google sign-in */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium"
          >
            {googleLoading ? (
              'Connecting...'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </span>
            )}
          </Button>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              className="text-[#00D084] hover:text-[#00D084]/80 font-medium transition-colors"
            >
              Sign Up
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
