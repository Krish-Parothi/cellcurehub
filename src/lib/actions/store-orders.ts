'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { StoreOrderStatus, StoreOrder } from '@/lib/types';

export async function createStoreOrder(data: {
  full_name: string;
  phone: string;
  address: string;
  total_amount: number;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Get cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('*, shop_item:shop_items(*)')
    .eq('customer_id', user.id);

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .insert({
      customer_id: user.id,
      full_name: data.full_name,
      phone: data.phone,
      address: data.address,
      total_amount: data.total_amount,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) return { success: false, error: orderError?.message || 'Failed to create order' };

  // Create order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    shop_item_id: item.shop_item_id,
    quantity: item.quantity,
    price_at_purchase: item.shop_item?.price || 0,
  }));

  const { error: itemsError } = await supabase
    .from('store_order_items')
    .insert(orderItems);

  if (itemsError) return { success: false, error: itemsError.message };

  // Clear cart
  await supabase.from('cart_items').delete().eq('customer_id', user.id);

  // Update stock
  for (const item of cartItems) {
    if (item.shop_item) {
      const newStock = Math.max(0, item.shop_item.stock_qty - item.quantity);
      await supabase.from('shop_items').update({ stock_qty: newStock }).eq('id', item.shop_item_id);
    }
  }

  revalidatePath('/dashboard');
  return { success: true, orderId: order.id };
}

export async function assignDeliveryBoyToStoreOrder(orderId: string, deliveryBoyId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('store_orders')
    .update({ 
      delivery_boy_id: deliveryBoyId,
      status: 'driver_assigned'
    })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/store-orders');
  return { success: true };
}

export async function updateStoreOrderStatus(orderId: string, status: StoreOrderStatus) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('store_orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/delivery/store-orders');
  revalidatePath('/admin/store-orders');
  return { success: true };
}

export async function markStoreOrderOutForDelivery(orderId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch the order to get the customer's email
  const { data: order, error: orderErr } = await supabase
    .from('store_orders')
    .select('id, customer:users!store_orders_customer_id_fkey(email)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) return { success: false, error: 'Order not found' };
  
  const customerEmail = (order as any).customer?.email;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };

  const { sendEmailOtp } = await import('./email-otp');
  const otpRes = await sendEmailOtp(customerEmail);
  if (!otpRes.success) return otpRes;

  const { error } = await supabase
    .from('store_orders')
    .update({ status: 'out_for_delivery' })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/delivery/store-orders');
  revalidatePath('/admin/store-orders');
  return { success: true };
}

export async function verifyStoreOrderDeliveryOtp(orderId: string, code: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch the order to get the customer's email
  const { data: order, error: orderErr } = await supabase
    .from('store_orders')
    .select('id, customer:users!store_orders_customer_id_fkey(email)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) return { success: false, error: 'Order not found' };
  
  const customerEmail = (order as any).customer?.email;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };

  const { verifyEmailOtp } = await import('./email-otp');
  const otpRes = await verifyEmailOtp(customerEmail, code);
  if (!otpRes.success) return otpRes;

  const { error } = await supabase
    .from('store_orders')
    .update({ status: 'delivered' })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/delivery/store-orders');
  revalidatePath('/admin/store-orders');
  return { success: true };
}
