'use client';

import { useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
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

  // Wrong role: return 404 to completely hide the page
  if (!allowedRoles.includes(user.role)) {
    notFound();
  }

  // Authorized: render children
  return <>{children}</>;
}
