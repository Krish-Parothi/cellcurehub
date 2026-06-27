-- Add out_for_delivery to the status check constraint
ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE public.store_orders ADD CONSTRAINT store_orders_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'driver_assigned'::text, 'out_for_delivery'::text, 'delivered'::text, 'cancelled'::text]));

-- Add contact_email column
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS contact_email text;

-- Add shop_admin policy for store_orders (so shop admins can manage)
CREATE POLICY "Shop admin can manage store_orders" ON public.store_orders FOR ALL TO authenticated USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'shop_admin'
);
