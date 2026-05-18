'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Loading state: show skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-3 w-1/2 bg-white/5" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-12 w-full rounded-lg bg-white/5" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-lg bg-white/5" />
              <Skeleton className="h-24 rounded-lg bg-white/5" />
            </div>
          </div>
          {/* Footer skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg bg-white/5" />
            <Skeleton className="h-10 flex-1 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: will redirect, show nothing
  if (!user) {
    return null;
  }

  // Wrong role: show access denied
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm text-center"
        >
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20"
            >
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </motion.div>

            {/* Title */}
            <h1 className="text-xl font-bold text-white mb-2">
              Access Denied
            </h1>

            {/* Message */}
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              You don&apos;t have permission to access this page. This area is restricted to{' '}
              <span className="text-[#00D084] font-medium">
                {allowedRoles.join(', ')}
              </span>{' '}
              roles.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
              >
                Go Back
              </Button>
              <Button
                onClick={() => router.replace('/')}
                className="bg-[#00D084] hover:bg-[#00B872] text-black font-semibold"
              >
                Go Home
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authorized: render children
  return <>{children}</>;
}
