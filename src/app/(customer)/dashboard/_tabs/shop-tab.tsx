'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { ShopItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Image as ImageIcon } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function ShopTab() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    // Optimized query: select only required columns
    const { data } = await supabase
      .from('shop_items')
      .select('id, name, price, stock_qty, image_url, shop_id, category, created_at')
      .eq('category', 'shop')
      .order('created_at', { ascending: false });
    
    setItems((data as ShopItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Cellcurehub store</h1>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden hover:border-[#FF5C00]/30 hover:shadow-[0_8px_30px_rgba(255,92,0,0.06)] transition-all group"
            >
              <div className="h-48 w-full bg-[#F7F7F5] relative overflow-hidden flex items-center justify-center border-b border-[#E8E4DF]">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              <div className="p-5">
                <h3 className="text-[#1A1A1A] font-bold text-lg mb-1 truncate">{item.name}</h3>
                <div className="flex items-end justify-between mt-4">
                  <p className="text-[#FF5C00] font-black text-xl">₹{fmt(item.price)}</p>
                  <p className="text-[#1A1A1A]/40 text-xs font-medium">
                    {item.stock_qty > 0 ? `${item.stock_qty} in stock` : 'Sold out'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
