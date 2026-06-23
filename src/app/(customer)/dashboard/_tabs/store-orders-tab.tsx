'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { StoreOrder, StoreOrderStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin, Calendar, Truck, CheckCircle, XCircle, ShoppingBag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_ORDER: StoreOrderStatus[] = ['pending', 'driver_assigned', 'delivered'];

const STATUS_COLORS: Record<StoreOrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  driver_assigned: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STATUS_LABELS: Record<StoreOrderStatus, string> = {
  pending: 'Order Placed',
  driver_assigned: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ICONS: Record<StoreOrderStatus, React.ElementType> = {
  pending: Package,
  driver_assigned: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

function StoreOrderTimeline({ currentStatus }: { currentStatus: StoreOrderStatus }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-500 py-2">
        <XCircle className="w-5 h-5" />
        <span className="font-semibold text-sm">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="relative pt-6 pb-2">
      <div className="absolute top-10 left-6 right-6 h-1 bg-[#E8E4DF] rounded-full" />
      <div 
        className="absolute top-10 left-6 h-1 bg-[#FF5C00] rounded-full transition-all duration-500"
        style={{ width: `calc(${(currentIndex / (STATUS_ORDER.length - 1)) * 100}% - 24px)` }}
      />

      <div className="relative flex justify-between">
        {STATUS_ORDER.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const Icon = STATUS_ICONS[status];

          return (
            <div key={status} className="flex flex-col items-center gap-2">
              <motion.div 
                initial={false}
                animate={{ scale: isCurrent ? 1.2 : 1 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors relative z-10 bg-white",
                  isPast ? "border-[#FF5C00] text-[#FF5C00]" : 
                  isCurrent ? "border-[#FF5C00] text-white bg-[#FF5C00]" : 
                  "border-[#E8E4DF] text-[#1A1A1A]/40"
                )}
              >
                {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </motion.div>
              <span className={cn(
                "text-xs font-semibold text-center w-20",
                isCurrent ? "text-[#FF5C00]" : 
                isPast ? "text-[#1A1A1A]" : 
                "text-[#1A1A1A]/40"
              )}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StoreOrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [view, setView] = useState<'active' | 'history'>('active');

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('store_orders')
      .select('*, items:store_order_items(*, shop_item:shop_items(name, image_url))')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
    
    setOrders((data as StoreOrder[]) || []);
  }, [userId]);

  const { loading } = useAuthFetch(fetchOrders, {
    realtimeTable: 'store_orders',
    realtimeFilter: `customer_id=eq.${userId}`
  });

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'driver_assigned');
  const historyOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  const displayedOrders = view === 'active' ? activeOrders : historyOrders;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl bg-[#1A1A1A]/5" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] hidden lg:block">Store Orders</h1>
        <div className="flex bg-white border border-[#E8E4DF] rounded-xl p-1 w-fit">
          <Button
            variant="ghost"
            onClick={() => setView('active')}
            className={cn("rounded-lg px-6 font-semibold", view === 'active' ? "bg-[#FF5C00]/10 text-[#FF5C00]" : "text-[#1A1A1A]/60")}
          >
            Active
          </Button>
          <Button
            variant="ghost"
            onClick={() => setView('history')}
            className={cn("rounded-lg px-6 font-semibold", view === 'history' ? "bg-[#FF5C00]/10 text-[#FF5C00]" : "text-[#1A1A1A]/60")}
          >
            History
          </Button>
        </div>
      </div>
      
      {displayedOrders.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 flex flex-col items-center text-center shadow-sm">
          {view === 'active' ? <ShoppingBag className="w-10 h-10 text-[#1A1A1A]/20 mb-3" /> : <Clock className="w-10 h-10 text-[#1A1A1A]/20 mb-3" />}
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No {view} store orders</h3>
          <p className="text-[#1A1A1A]/60 text-sm">When you buy accessories from our store, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {displayedOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-[#E8E4DF] rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row gap-6 hover:shadow-md transition-shadow"
              >
                {/* Status & Timeline */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[order.status]}`}>
                      {(() => {
                        const Icon = STATUS_ICONS[order.status];
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A]">{STATUS_LABELS[order.status]}</h3>
                      <p className="text-xs text-[#1A1A1A]/40 font-mono mt-0.5">Order #{order.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <StoreOrderTimeline currentStatus={order.status} />

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Date Placed</p>
                      <p className="text-sm text-[#1A1A1A] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1A1A1A]/40" />
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Delivery Address</p>
                      <p className="text-sm text-[#1A1A1A] flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#1A1A1A]/40 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.address}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items & Total */}
                <div className="w-full xl:w-72 bg-[#F7F7F5] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-3">Items ({order.items?.length || 0})</p>
                    <div className="space-y-3 mb-4 max-h-[180px] overflow-y-auto pr-2">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-[#E8E4DF] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.shop_item?.image_url ? (
                              <img src={item.shop_item.image_url} alt={item.shop_item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-[#1A1A1A]/20" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{item.shop_item?.name}</p>
                            <p className="text-xs text-[#1A1A1A]/60">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DF]">
                    <span className="text-sm font-semibold text-[#1A1A1A]/60">Total</span>
                    <span className="text-xl font-black text-[#FF5C00]">₹{fmt(order.total_amount)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
