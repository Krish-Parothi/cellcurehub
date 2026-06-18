'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * useAuthReady — blocks data fetching until auth is resolved.
 * 
 * Returns { user, loading, isReady }.
 * `isReady` is true only when loading is false AND user is non-null.
 * 
 * Usage:
 *   const { user, isReady } = useAuthReady();
 *   useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);
 */
export function useAuthReady() {
  const { user, loading } = useAuth();
  return {
    user,
    loading,
    isReady: !loading && !!user,
  };
}

/**
 * useAuthFetch — industry-standard hook that:
 * 1. Waits for auth to be ready before fetching.
 * 2. Re-fetches when deps change.
 * 3. Optionally subscribes to Supabase Realtime for live updates.
 * 
 * @param fetchFn  - The async function to call for data fetching.
 * @param options  - Configuration options.
 * 
 * Usage:
 *   const { user } = useAuthFetch(fetchData, {
 *     requiredRole: 'admin',
 *     deps: [statusFilter],
 *     realtimeTable: 'repairs',  // optional: auto-refetch on DB changes
 *   });
 */
export function useAuthFetch(
  fetchFn: () => void | Promise<void>,
  options: {
    requiredRole?: UserRole | UserRole[];
    deps?: any[];
    realtimeTable?: string;       // Subscribe to INSERT/UPDATE/DELETE on this table
    realtimeFilter?: string;      // Optional: Supabase realtime filter e.g. 'customer_id=eq.xxx'
  } = {}
) {
  const { user, loading: authLoading } = useAuth();
  const { requiredRole, deps = [], realtimeTable, realtimeFilter } = options;
  const [dataLoading, setDataLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const hasFetchedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isReady = !authLoading && !!user;
  const hasRole = !requiredRole
    ? true
    : Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role as UserRole)
      : user?.role === requiredRole;

  const fetchFnRef = useRef(fetchFn);
  // Keep the ref up-to-date with the latest function without triggering re-renders
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const triggerFetch = useCallback(async () => {
    if (DEBUG) console.log('[useAuthFetch] triggerFetch called. dataLoading -> true');
    try {
      setDataLoading(true);
      await fetchFnRef.current();
      if (DEBUG) console.log('[useAuthFetch] fetchFn completed successfully.');
    } catch (e) {
      if (DEBUG) console.error('[useAuthFetch] fetchFn threw an error:', e);
    } finally {
      hasFetchedRef.current = true;
      setDataLoading(false);
      setInitialFetchDone(true);
      if (DEBUG) console.log('[useAuthFetch] triggerFetch finally block. dataLoading -> false');
    }
  }, []); // Empty dependencies, so triggerFetch never changes identity

  // Main fetch effect — fires when auth is ready and deps change
  useEffect(() => {
    if (DEBUG) console.log('[useAuthFetch] useEffect triggered. isReady:', isReady, 'hasRole:', hasRole);
    if (!isReady || !hasRole) {
      if (DEBUG) console.log('[useAuthFetch] Conditions not met, aborting fetch effect.');
      return;
    }

    // Small debounce to batch rapid dep changes (e.g. filter + user arriving at once)
    if (DEBUG) console.log('[useAuthFetch] Setting 50ms timer for triggerFetch.');
    const timer = setTimeout(() => {
      if (DEBUG) console.log('[useAuthFetch] 50ms timer fired, calling triggerFetch.');
      triggerFetch();
    }, 50);

    return () => {
      if (DEBUG) console.log('[useAuthFetch] useEffect cleanup, clearing timer.');
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hasRole, ...deps]);

  // Realtime subscription — auto-refetch on DB changes
  useEffect(() => {
    // Wait until the initial fetch is completely done before establishing a WebSocket connection
    if (!isReady || !hasRole || !realtimeTable || !initialFetchDone) return;

    if (DEBUG) console.log('[useAuthFetch] Subscribing to realtime for:', realtimeTable);
    const channelName = `realtime_${realtimeTable}_${Date.now()}`;
    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table: realtimeTable,
    };
    if (realtimeFilter) {
      channelConfig.filter = realtimeFilter;
    }

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, () => {
        // Refetch immediately when an update happens
        triggerFetch();
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        if (DEBUG) console.log('[useAuthFetch] Unsubscribing realtime channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hasRole, realtimeTable, realtimeFilter, initialFetchDone]);

  // Overall loading is true if auth is loading OR data is loading (and we have the right role)
  // If user doesn't have the role, we stop loading so the RoleGuard can kick them out
  const loading = authLoading || (isReady && hasRole && dataLoading);

  return { user, loading, isReady, refetch: triggerFetch };
}
