'use client';

import { useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { useCart } from '@/lib/cart-context';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { ShopItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Image as ImageIcon, ShoppingCart, Plus, Check } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function ShopTab() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addToCart, cartCount, items: cartItems } = useCart();

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('shop_items')
      .select('id, name, price, stock_qty, image_url, shop_id, category, created_at')
      .eq('category', 'shop')
      .order('created_at', { ascending: false });
    
    setItems((data as ShopItem[]) || []);
  }, []);

  const { loading } = useAuthFetch(fetchItems, {
    realtimeTable: 'shop_items'
  });

  const handleAddToCart = async (itemId: string) => {
    setAddingId(itemId);
    await addToCart(itemId);
    setTimeout(() => setAddingId(null), 800);
  };

  const isInCart = (itemId: string) => cartItems.some(ci => ci.shop_item_id === itemId);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] hidden lg:block">CellCureHub Store</h1>
        {cartCount > 0 && (
          <Badge className="bg-[#FF5C00] text-white px-3 py-1.5 text-sm font-semibold">
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden">
              <Skeleton className="h-48 w-full bg-[#1A1A1A]/5" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-[#1A1A1A]/5" />
                <Skeleton className="h-4 w-1/2 bg-[#1A1A1A]/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center flex flex-col items-center">
          <Store className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
          <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">Store is Empty</h3>
          <p className="text-[#1A1A1A]/50 text-sm">Check back later for newly added refurbished devices and accessories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item, idx) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden hover:border-[#FF5C00]/30 hover:shadow-[0_8px_30px_rgba(255,92,0,0.06)] transition-all group"
            >
              <div className="h-40 w-full bg-[#F7F7F5] relative overflow-hidden flex items-center justify-center border-b border-[#E8E4DF]">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-contain p-8 mix-blend-multiply group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#1A1A1A]/20" />
                )}
                {item.stock_qty <= 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-[#1A1A1A] text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-[#1A1A1A] font-bold text-lg mb-1 truncate">{item.name}</h3>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-[#FF5C00] font-black text-xl">₹{fmt(item.price)}</p>
                    <p className="text-[#1A1A1A]/40 text-xs font-medium mt-0.5">
                      {item.stock_qty > 0 ? `${item.stock_qty} in stock` : 'Sold out'}
                    </p>
                  </div>
                  {item.stock_qty > 0 ? (
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item.id)}
                      disabled={addingId === item.id}
                      className={`transition-all duration-300 ${
                        isInCart(item.id)
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white'
                      }`}
                    >
                      {addingId === item.id ? (
                        <Check className="w-4 h-4 animate-bounce" />
                      ) : isInCart(item.id) ? (
                        <><Plus className="w-4 h-4 mr-1" />Add More</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4 mr-1" />Add to Cart</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed text-xs font-semibold"
                    >
                      Out of Stock
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
