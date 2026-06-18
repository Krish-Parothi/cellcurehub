'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { CartItem, ShopItem } from '@/lib/types';
import { toast } from 'sonner';

interface CartContextType {
  items: (CartItem & { shop_item: ShopItem })[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (shopItemId: string, qty?: number) => Promise<void>;
  removeFromCart: (shopItemId: string) => Promise<void>;
  updateQty: (shopItemId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<(CartItem & { shop_item: ShopItem })[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, shop_item:shop_items(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setItems(data as any);
      }
    } finally {
      setLoading(false);
      fetchedRef.current = true;
    }
  }, [user]);

  // Fetch cart on user change
  useEffect(() => {
    if (user) fetchCart();
    else setItems([]);
  }, [user, fetchCart]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`cart_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `customer_id=eq.${user.id}` }, () => {
        if (fetchedRef.current) fetchCart();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCart]);

  const addToCart = useCallback(async (shopItemId: string, qty = 1) => {
    if (!user) { toast.error('Please log in first'); return; }
    const existing = items.find(i => i.shop_item_id === shopItemId);
    if (existing) {
      const { error } = await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
      if (error) { toast.error('Failed to update cart'); return; }
    } else {
      const { error } = await supabase.from('cart_items').insert({ customer_id: user.id, shop_item_id: shopItemId, quantity: qty });
      if (error) { toast.error('Failed to add to cart'); return; }
    }
    toast.success('Added to cart');
    fetchCart();
  }, [user, items, fetchCart]);

  const removeFromCart = useCallback(async (shopItemId: string) => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('customer_id', user.id).eq('shop_item_id', shopItemId);
    fetchCart();
  }, [user, fetchCart]);

  const updateQty = useCallback(async (shopItemId: string, qty: number) => {
    if (!user) return;
    if (qty <= 0) { await removeFromCart(shopItemId); return; }
    await supabase.from('cart_items').update({ quantity: qty }).eq('customer_id', user.id).eq('shop_item_id', shopItemId);
    fetchCart();
  }, [user, removeFromCart, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('customer_id', user.id);
    fetchCart();
  }, [user, fetchCart]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + (i.shop_item?.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cartCount, cartTotal, loading, addToCart, removeFromCart, updateQty, clearCart, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
