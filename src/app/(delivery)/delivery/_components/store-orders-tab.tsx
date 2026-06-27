'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import type { StoreOrder, StoreOrderStatus } from '@/lib/types';
import { updateStoreOrderStatus, markStoreOrderOutForDelivery, verifyStoreOrderDeliveryOtp } from '@/lib/actions/store-orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Package, User as UserIcon, Phone, MapPin, Calendar, CheckCircle, Truck } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_COLORS: Record<StoreOrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  driver_assigned: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  out_for_delivery: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STATUS_LABELS: Record<StoreOrderStatus, string> = {
  pending: 'Pending',
  driver_assigned: 'Driver Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function StoreOrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  
  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('store_orders')
      .select('*, items:store_order_items(*, shop_item:shop_items(name, image_url))')
      .eq('delivery_boy_id', user.id)
      .order('created_at', { ascending: false });
    
    setOrders((data as StoreOrder[]) || []);
  }, [user]);

  const { loading } = useAuthFetch(fetchOrders, {
    requiredRole: ['delivery', 'admin', 'shop_admin'],
    realtimeTable: 'store_orders'
  });

  const handleOutForDelivery = async (order: StoreOrder) => {
    const result = await markStoreOrderOutForDelivery(order.id);
    if (result.success) {
      toast.success('Marked as Out for Delivery. OTP sent to customer.');
      setOtpModalOpen(true);
      setSelectedOrder(order);
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedOrder) return;
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    const result = await verifyStoreOrderDeliveryOtp(selectedOrder.id, otpCode);
    setIsVerifying(false);

    if (result.success) {
      toast.success('OTP verified successfully! Order marked as Delivered.');
      setOtpModalOpen(false);
      setOtpCode('');
      setSelectedOrder(null);
    } else {
      toast.error(result.error || 'Invalid or expired OTP');
    }
  };

  const handleResendOtp = async () => {
    if (!selectedOrder) return;
    toast.loading('Resending OTP...');
    const result = await markStoreOrderOutForDelivery(selectedOrder.id);
    toast.dismiss();
    if (result.success) {
      toast.success('OTP resent successfully!');
    } else {
      toast.error(result.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="space-y-6">

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full bg-[#1A1A1A]/5 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center flex flex-col items-center">
          <Package className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
          <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">No Assigned Deliveries</h3>
          <p className="text-[#1A1A1A]/50 text-sm">You have no store orders to deliver at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <Card key={order.id} className="bg-white border-[#E8E4DF] shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Order Details */}
                  <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-[#E8E4DF]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#1A1A1A]/40">#{order.id.slice(0, 8)}</span>
                          <Badge variant="outline" className={`${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-[#1A1A1A]/40" />
                          {order.full_name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[#FF5C00] font-black text-xl">₹{fmt(order.total_amount)}</p>
                        <p className="text-xs font-semibold text-[#1A1A1A]/50 mt-0.5">Collect Cash</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Contact</p>
                        <a href={`tel:${order.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {order.phone}
                        </a>
                        {order.contact_email && (
                          <p className="text-xs text-[#1A1A1A]/60 flex items-center gap-2">
                            <span>📧</span> {order.contact_email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Delivery Address</p>
                        <p className="text-sm text-[#1A1A1A] flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#1A1A1A]/40 shrink-0 mt-0.5" /> 
                          <span className="line-clamp-2">{order.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-3">Items ({order.items?.length || 0})</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex items-center gap-2 bg-[#F7F7F5] border border-[#E8E4DF] rounded-lg p-2 pr-4">
                            <div className="w-8 h-8 rounded bg-white border border-[#E8E4DF] flex items-center justify-center overflow-hidden">
                              {item.shop_item?.image_url ? (
                                <img src={item.shop_item.image_url} alt={item.shop_item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-[#1A1A1A]/20" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1A1A1A] truncate max-w-[150px]">{item.shop_item?.name}</p>
                              <p className="text-[10px] text-[#1A1A1A]/60">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-64 bg-[#F7F7F5] p-6 flex flex-col justify-center">
                    {order.status === 'driver_assigned' ? (
                      <Button 
                        onClick={() => handleOutForDelivery(order)} 
                        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base"
                      >
                        <Truck className="w-5 h-5 mr-2" /> Start Delivery
                      </Button>
                    ) : order.status === 'out_for_delivery' ? (
                      <Button 
                        onClick={() => { setSelectedOrder(order); setOtpModalOpen(true); }} 
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" /> Verify OTP & Deliver
                      </Button>
                    ) : (
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[#1A1A1A] font-semibold">Delivery Complete</p>
                        <p className="text-[#1A1A1A]/50 text-xs mt-1">Cash collected: ₹{fmt(order.total_amount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-[#E8E4DF]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[#FF5C00]" />
              Verify Delivery OTP
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60 text-base">
              Ask the customer for the 6-digit OTP sent to their email address.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-12 h-14 rounded-lg border-2 border-[#E8E4DF] flex items-center justify-center text-2xl font-bold text-[#1A1A1A] bg-[#F7F7F5]">
                    {otpCode[i] || ''}
                  </div>
                ))}
              </div>
            </div>
            
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="text-center text-lg tracking-widest bg-white border-[#E8E4DF]"
              autoFocus
            />

            <div className="mt-4 flex justify-between items-center px-1">
              <p className="text-sm text-[#1A1A1A]/60">Didn't receive OTP?</p>
              <button 
                onClick={handleResendOtp}
                className="text-sm text-[#FF5C00] font-semibold hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-row gap-3">
            <Button variant="outline" onClick={() => setOtpModalOpen(false)} className="w-full">
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyOtp} 
              className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white"
              disabled={otpCode.length !== 6 || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Complete Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
