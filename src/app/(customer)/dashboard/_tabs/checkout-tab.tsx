'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2, Plus, Minus, Package, IndianRupee, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createStoreOrder } from '@/lib/actions/store-orders';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function CheckoutTab() {
  const { user } = useAuth();
  const { items, cartCount, cartTotal, updateQty, removeFromCart, clearCart, loading, refetch } = useCart();
  const [placed, setPlaced] = useState(false);
  
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', address: '' });
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.phone ? user.phone.replace(/^\+91/, '') : '',
        address: localStorage.getItem('cellcurehub_default_address') || '',
      });
    }
  }, [user]);

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    setStep('details');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.address.length < 5) {
      toast.error('Please enter a complete delivery address');
      return;
    }
    
    setPlacingOrder(true);
    const orderResult = await createStoreOrder({
      full_name: formData.fullName,
      email: formData.email,
      phone: `+91${formData.phone}`,
      address: formData.address,
      total_amount: cartTotal,
    });

    setPlacingOrder(false);

    if (orderResult.success) {
      // Save address for future
      localStorage.setItem('cellcurehub_default_address', formData.address);
      setPlaced(true);
      await refetch();
    } else {
      toast.error(orderResult.error || 'Failed to place order');
    }
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
          Thank you for your order. Our team will assign a delivery partner shortly to deliver your items. Payment will be collected on delivery.
        </p>
        <Button onClick={() => { setPlaced(false); setStep('cart'); }} className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white">
          Continue Shopping
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-4 mb-6">
        {step !== 'cart' && (
          <Button variant="ghost" size="sm" onClick={() => setStep('cart')} className="text-[#1A1A1A]/60">
            ← Back
          </Button>
        )}
        <h1 className="text-2xl font-bold text-[#1A1A1A] hidden lg:block">
          {step === 'cart' ? 'Your Cart' : 'Delivery Details'}
        </h1>
      </div>

      {loading && step === 'cart' ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF5C00] border-t-transparent animate-spin mx-auto" />
        </div>
      ) : items.length === 0 && step === 'cart' ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center flex flex-col items-center">
          <ShoppingCart className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
          <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">Cart is Empty</h3>
          <p className="text-[#1A1A1A]/50 text-sm">Browse the store and add items to your cart.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            
            {step === 'cart' && items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-[#E8E4DF] rounded-xl p-4 flex gap-4 items-center hover:shadow-sm transition-shadow"
              >
                <div className="w-20 h-20 rounded-xl bg-[#F7F7F5] border border-[#E8E4DF] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.shop_item?.image_url ? (
                    <img src={item.shop_item.image_url} alt={item.shop_item?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-[#1A1A1A]/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1A1A1A] font-semibold truncate">{item.shop_item?.name}</h4>
                  <p className="text-[#FF5C00] font-bold mt-0.5">₹{fmt(item.shop_item?.price || 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.shop_item_id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-[#F7F7F5] border border-[#E8E4DF] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors">
                    <Minus className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  </button>
                  <span className="w-8 text-center text-[#1A1A1A] font-semibold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.shop_item_id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-[#F7F7F5] border border-[#E8E4DF] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors">
                    <Plus className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  </button>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#1A1A1A] font-bold text-sm">₹{fmt((item.shop_item?.price || 0) * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.shop_item_id)} className="text-red-400 hover:text-red-600 mt-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {step === 'cart' && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Clear Cart
                </Button>
              </div>
            )}

            {step === 'details' && (
              <form id="details-form" onSubmit={handlePlaceOrder} className="bg-white border border-[#E8E4DF] rounded-2xl p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1A1A1A]/70">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40" />
                    <Input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="pl-10 border-[#E8E4DF] focus-visible:ring-[#FF5C00]" placeholder="John Doe" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1A1A1A]/70">Email Address</Label>
                  <div className="relative">
                    <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" placeholder="name@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1A1A1A]/70">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center rounded-md border border-[#E8E4DF] bg-[#F7F7F5] px-3 text-[#1A1A1A]/60 text-sm">+91</div>
                    <Input required maxLength={10} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" placeholder="9876543210" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1A1A1A]/70">Delivery Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#1A1A1A]/40" />
                    <Textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="pl-10 border-[#E8E4DF] focus-visible:ring-[#FF5C00] min-h-[80px]" placeholder="Flat No, Building, Street, Area, City" />
                  </div>
                </div>
              </form>
            )}



          </div>

          {/* Order Summary Sidebar */}
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
              
              {step === 'cart' && (
                <Button onClick={handleCheckoutClick} className="w-full mt-6 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold h-12 text-base">
                  Checkout
                </Button>
              )}
              {step === 'details' && (
                <Button form="details-form" type="submit" disabled={placingOrder} className="w-full mt-6 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold h-12 text-base">
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>
              )}

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
