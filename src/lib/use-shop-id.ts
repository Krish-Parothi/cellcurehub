'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const STORAGE_KEY = 'cellcurehub_admin_shop_override';

/**
 * Returns the active shop_id for the current user.
 * - shop_admin → always returns their own user.shop_id
 * - admin → returns the override shop_id stored in localStorage (set when they click "Manage" on a shop)
 */
export function useShopId() {
  const { user } = useAuth();
  const [overrideShopId, setOverrideShopId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      const stored = localStorage.getItem(STORAGE_KEY);
      setOverrideShopId(stored);
    }
  }, [user]);

  if (user?.role === 'admin') {
    return overrideShopId;
  }
  return user?.shop_id ?? null;
}

/** Set the shop_id override for admin users */
export function setAdminShopOverride(shopId: string) {
  localStorage.setItem(STORAGE_KEY, shopId);
}

/** Clear the shop_id override */
export function clearAdminShopOverride() {
  localStorage.removeItem(STORAGE_KEY);
}
