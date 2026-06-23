'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { StoreOrder, StoreOrderStatus, User } from '@/lib/types';
import { assignDeliveryBoyToStoreOrder, updateStoreOrderStatus } from '@/lib/actions/store-orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, User as UserIcon, Phone, MapPin, Calendar, CheckCircle, Truck, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const STATUS_COLORS: Record<StoreOrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  driver_assigned: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STATUS_LABELS: Record<StoreOrderStatus, string> = {
  pending: 'Pending',
  driver_assigned: 'Driver Assigned',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function AdminStoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('store_orders')
      .select('*, customer:users!store_orders_customer_id_fkey(full_name, phone), delivery_boy:users!store_orders_delivery_boy_id_fkey(full_name, phone), items:store_order_items(*, shop_item:shop_items(name, image_url))')
      .order('created_at', { ascending: false });
    
    setOrders((data as StoreOrder[]) || []);

    const { data: db } = await supabase.from('users').select('*').eq('role', 'delivery').eq('is_active', true);
    setDeliveryBoys((db as User[]) || []);
  }, []);

  const { loading } = useAuthFetch(fetchOrders, {
    requiredRole: ['admin'],
    realtimeTable: 'store_orders'
  });

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    const result = await assignDeliveryBoyToStoreOrder(orderId, driverId);
    if (result.success) {
      toast.success('Driver assigned successfully');
    } else {
      toast.error(result.error || 'Failed to assign driver');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: StoreOrderStatus) => {
    const result = await updateStoreOrderStatus(orderId, status);
    if (result.success) {
      toast.success(`Order marked as ${STATUS_LABELS[status]}`);
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Store Orders</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Manage physical product deliveries</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40" />
          <Input 
            placeholder="Search by ID, Name or Phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-[#E8E4DF] focus-visible:ring-[#FF5C00]"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-[#1A1A1A]/5 rounded-2xl" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center flex flex-col items-center">
          <Package className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
          <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">No Orders Found</h3>
          <p className="text-[#1A1A1A]/50 text-sm">There are no store orders matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map(order => (
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
                        <p className="text-[#1A1A1A]/40 text-xs font-medium flex items-center justify-end gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Contact</p>
                        <p className="text-sm text-[#1A1A1A] flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#1A1A1A]/40" /> {order.phone}
                        </p>
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
                              <p className="text-[10px] text-[#1A1A1A]/60">Qty: {item.quantity} × ₹{fmt(item.price_at_purchase)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-72 bg-[#F7F7F5] p-6 flex flex-col justify-center gap-6">
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-2">Driver Assignment</p>
                      {order.status === 'pending' ? (
                        <Select onValueChange={(val) => handleAssignDriver(order.id, val)}>
                          <SelectTrigger className="bg-white border-[#E8E4DF]">
                            <SelectValue placeholder="Assign Delivery Boy" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#E8E4DF]">
                            {deliveryBoys.map(db => (
                              <SelectItem key={db.id} value={db.id}>{db.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-3 bg-white border border-[#E8E4DF] p-3 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">{order.delivery_boy?.full_name}</p>
                            <p className="text-xs text-[#1A1A1A]/60">{order.delivery_boy?.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-2">Quick Actions</p>
                      <div className="flex flex-col gap-2">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <Button 
                            onClick={() => handleUpdateStatus(order.id, 'delivered')} 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Delivered
                          </Button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <Button 
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')} 
                            variant="outline" 
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
