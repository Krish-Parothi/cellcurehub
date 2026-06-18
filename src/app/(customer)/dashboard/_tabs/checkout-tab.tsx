'use client';

import { motion } from 'framer-motion';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, Package, IndianRupee, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function CheckoutTab() {
  const { items, cartCount, cartTotal, updateQty, removeFromCart, clearCart, loading } = useCart();
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    // For now, just show a summary confirmation (no payment integration)
    await clearCart();
    setPlaced(true);
    toast.success('Order placed successfully! We will contact you shortly.');
  };

  if (placed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Order Placed!</h2>
        <p className="text-[#1A1A1A]/60 text-sm max-w-sm text-center mb-6">
          Thank you for your order. Our team will reach out to you shortly to arrange delivery and payment.
        </p>
        <Button onClick={() => setPlaced(false)} className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white">
          Continue Shopping
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Your Cart</h1>

      {loading ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF5C00] border-t-transparent animate-spin mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center flex flex-col items-center">
          <ShoppingCart className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
          <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">Cart is Empty</h3>
          <p className="text-[#1A1A1A]/50 text-sm">Browse the store and add items to your cart.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-[#E8E4DF] rounded-xl p-4 flex gap-4 items-center hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl bg-[#F7F7F5] border border-[#E8E4DF] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.shop_item?.image_url ? (
                    <img src={item.shop_item.image_url} alt={item.shop_item?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-[#1A1A1A]/20" />
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1A1A1A] font-semibold truncate">{item.shop_item?.name}</h4>
                  <p className="text-[#FF5C00] font-bold mt-0.5">₹{fmt(item.shop_item?.price || 0)}</p>
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.shop_item_id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-[#F7F7F5] border border-[#E8E4DF] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  </button>
                  <span className="w-8 text-center text-[#1A1A1A] font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.shop_item_id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-[#F7F7F5] border border-[#E8E4DF] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  </button>
                </div>
                {/* Subtotal & Remove */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[#1A1A1A] font-bold text-sm">₹{fmt((item.shop_item?.price || 0) * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.shop_item_id)} className="text-red-400 hover:text-red-600 mt-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 sticky top-24">
              <h3 className="text-[#1A1A1A] font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1A1A]/60">Items ({cartCount})</span>
                  <span className="text-[#1A1A1A] font-medium">₹{fmt(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1A1A]/60">Delivery</span>
                  <span className="text-emerald-500 font-medium">Free</span>
                </div>
                <Separator className="bg-[#E8E4DF]" />
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A] font-bold">Total</span>
                  <span className="text-[#FF5C00] font-black text-xl flex items-center">
                    <IndianRupee className="w-4 h-4 mr-0.5" />{fmt(cartTotal)}
                  </span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} className="w-full mt-6 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold h-12 text-base">
                Place Order
              </Button>
              <p className="text-[#1A1A1A]/40 text-xs text-center mt-3">
                Payment will be collected on delivery
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
