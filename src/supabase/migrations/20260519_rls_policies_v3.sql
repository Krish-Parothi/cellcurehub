-- ============================================================
-- STEP 1: NUKE EVERY SINGLE POLICY (explicit drops)
-- ============================================================
-- Users
DROP POLICY IF EXISTS "Admin full access to users" ON public.users;
DROP POLICY IF EXISTS "Shop admin manages own shop staff" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
-- Shops
DROP POLICY IF EXISTS "Admin full access to shops" ON public.shops;
DROP POLICY IF EXISTS "Shop admin reads own shop" ON public.shops;
DROP POLICY IF EXISTS "Authenticated users can read active shops" ON public.shops;
DROP POLICY IF EXISTS "Anyone can read shops" ON public.shops;
DROP POLICY IF EXISTS "Admin can manage shops" ON public.shops;
-- Repairs
DROP POLICY IF EXISTS "Admin full access to repairs" ON public.repairs;
DROP POLICY IF EXISTS "Shop admin manages shop repairs" ON public.repairs;
DROP POLICY IF EXISTS "Customer manages own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technician reads assigned repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technician updates assigned repairs" ON public.repairs;
DROP POLICY IF EXISTS "Delivery reads assigned repairs" ON public.repairs;
DROP POLICY IF EXISTS "Customers can create repairs" ON public.repairs;
DROP POLICY IF EXISTS "Customers can view own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technicians can view assigned repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technicians can update assigned repairs" ON public.repairs;
DROP POLICY IF EXISTS "Admin can manage all repairs" ON public.repairs;
-- Repair Timeline
DROP POLICY IF EXISTS "Admin full access to repair_timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Shop admin manages shop timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Customer reads own repair timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Customer inserts own repair timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Technician manages assigned repair timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Delivery inserts timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Anyone can read repair timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Authenticated users can insert timeline" ON public.repair_timeline;
DROP POLICY IF EXISTS "Admin can manage timeline" ON public.repair_timeline;
-- Devices
DROP POLICY IF EXISTS "Admin full access to devices" ON public.devices;
DROP POLICY IF EXISTS "All authenticated read devices" ON public.devices;
DROP POLICY IF EXISTS "Anyone can read devices" ON public.devices;
DROP POLICY IF EXISTS "Admin can manage devices" ON public.devices;
-- Pricing
DROP POLICY IF EXISTS "Admin full access to pricing" ON public.pricing;
DROP POLICY IF EXISTS "All authenticated read pricing" ON public.pricing;
DROP POLICY IF EXISTS "Anyone can read pricing" ON public.pricing;
DROP POLICY IF EXISTS "Admin can manage pricing" ON public.pricing;
-- Parts
DROP POLICY IF EXISTS "Admin full access to parts" ON public.parts;
DROP POLICY IF EXISTS "Shop admin manages own parts" ON public.parts;
DROP POLICY IF EXISTS "Technician reads shop parts" ON public.parts;
DROP POLICY IF EXISTS "Admin can manage parts" ON public.parts;
-- Parts Used
DROP POLICY IF EXISTS "Admin full access to parts_used" ON public.parts_used;
DROP POLICY IF EXISTS "Shop admin manages shop parts_used" ON public.parts_used;
DROP POLICY IF EXISTS "Technician manages own parts_used" ON public.parts_used;
DROP POLICY IF EXISTS "Admin can manage parts_used" ON public.parts_used;
-- Invoices
DROP POLICY IF EXISTS "Admin full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Shop admin manages shop invoices" ON public.invoices;
DROP POLICY IF EXISTS "Customer reads own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Technician reads repair invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Customers can view own invoices" ON public.invoices;
-- Delivery Assignments
DROP POLICY IF EXISTS "Admin full access to delivery_assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Shop admin manages shop deliveries" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Delivery boy manages own assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Admin can manage delivery assignments" ON public.delivery_assignments;
-- RCA Reports
DROP POLICY IF EXISTS "Admin full access to rca_reports" ON public.rca_reports;
DROP POLICY IF EXISTS "Shop admin manages shop RCA" ON public.rca_reports;
DROP POLICY IF EXISTS "Technician manages own RCA" ON public.rca_reports;
DROP POLICY IF EXISTS "Admin can manage RCA" ON public.rca_reports;
-- Reviews
DROP POLICY IF EXISTS "Admin full access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Shop admin reads shop reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customer manages own reviews" ON public.reviews;
DROP POLICY IF EXISTS "All authenticated read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can delete reviews" ON public.reviews;
-- Ewaste
DROP POLICY IF EXISTS "Admin full access to ewaste" ON public.ewaste;
DROP POLICY IF EXISTS "Customer manages own ewaste" ON public.ewaste;
DROP POLICY IF EXISTS "Admin can manage ewaste" ON public.ewaste;
DROP POLICY IF EXISTS "Customers can manage own ewaste" ON public.ewaste;
-- Ewaste Payout Rates
DROP POLICY IF EXISTS "Admin full access to ewaste_payout_rates" ON public.ewaste_payout_rates;
DROP POLICY IF EXISTS "All authenticated read ewaste_payout_rates" ON public.ewaste_payout_rates;
DROP POLICY IF EXISTS "Admin can manage payout rates" ON public.ewaste_payout_rates;
DROP POLICY IF EXISTS "Anyone can read payout rates" ON public.ewaste_payout_rates;
-- Shop Items
DROP POLICY IF EXISTS "Admin full access to shop_items" ON public.shop_items;
DROP POLICY IF EXISTS "Shop admin manages own shop_items" ON public.shop_items;
-- Attendance
DROP POLICY IF EXISTS "Admin full access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Shop admin manages own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Employee reads own attendance" ON public.attendance;
-- Salary Config
DROP POLICY IF EXISTS "Admin full access to salary_config" ON public.salary_config;
DROP POLICY IF EXISTS "Shop admin manages own salary_config" ON public.salary_config;
DROP POLICY IF EXISTS "Employee reads own salary" ON public.salary_config;
-- Holidays
DROP POLICY IF EXISTS "Admin full access to holidays" ON public.holidays;
DROP POLICY IF EXISTS "All authenticated read holidays" ON public.holidays;
DROP POLICY IF EXISTS "Admin can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "Anyone can read holidays" ON public.holidays;
-- Notifications
DROP POLICY IF EXISTS "Admin full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "User manages own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
-- Technician Details
DROP POLICY IF EXISTS "Admin full access to technician_details" ON public.technician_details;
DROP POLICY IF EXISTS "Shop admin manages shop technician_details" ON public.technician_details;
DROP POLICY IF EXISTS "Technician reads own details" ON public.technician_details;


-- ============================================================
-- STEP 2: HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _role text;
BEGIN
  SELECT role INTO _role FROM public.users WHERE id = auth.uid();
  RETURN _role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_shop_id()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _shop_id uuid;
BEGIN
  SELECT shop_id INTO _shop_id FROM public.users WHERE id = auth.uid();
  RETURN _shop_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shop_repair_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT id FROM public.repairs WHERE shop_id = get_my_shop_id();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_delivery_repair_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT repair_id FROM public.delivery_assignments WHERE delivery_boy_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tech_repair_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT id FROM public.repairs WHERE technician_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_repair_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT id FROM public.repairs WHERE customer_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shop_user_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT id FROM public.users WHERE shop_id = get_my_shop_id();
END;
$$;


-- ============================================================
-- STEP 3: CREATE ALL POLICIES
-- ============================================================

-- 1. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to users" ON public.users
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages own shop staff" ON public.users
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'shop_admin'
    AND (shop_id = get_my_shop_id() OR id = auth.uid() OR role = 'customer')
  )
  WITH CHECK (
    get_my_role() = 'shop_admin'
    AND (shop_id = get_my_shop_id() OR id = auth.uid())
  );

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Allow insert during signup" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- 2. SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to shops" ON public.shops
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin reads own shop" ON public.shops
  FOR SELECT TO authenticated
  USING (get_my_role() = 'shop_admin' AND id = get_my_shop_id());

CREATE POLICY "Authenticated users can read active shops" ON public.shops
  FOR SELECT TO authenticated USING (is_active = true);

-- 3. REPAIRS
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to repairs" ON public.repairs
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop repairs" ON public.repairs
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id())
  WITH CHECK (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id());

CREATE POLICY "Customer manages own repairs" ON public.repairs
  FOR ALL TO authenticated
  USING (get_my_role() = 'customer' AND customer_id = auth.uid())
  WITH CHECK (get_my_role() = 'customer' AND customer_id = auth.uid());

CREATE POLICY "Technician reads assigned repairs" ON public.repairs
  FOR SELECT TO authenticated
  USING (get_my_role() = 'technician' AND technician_id = auth.uid());

CREATE POLICY "Technician updates assigned repairs" ON public.repairs
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'technician' AND technician_id = auth.uid())
  WITH CHECK (get_my_role() = 'technician' AND technician_id = auth.uid());

CREATE POLICY "Delivery reads assigned repairs" ON public.repairs
  FOR SELECT TO authenticated
  USING (get_my_role() = 'delivery' AND id IN (SELECT get_delivery_repair_ids()));

-- 4. REPAIR_TIMELINE
ALTER TABLE public.repair_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to repair_timeline" ON public.repair_timeline
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop timeline" ON public.repair_timeline
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Customer reads own repair timeline" ON public.repair_timeline
  FOR SELECT TO authenticated
  USING (get_my_role() = 'customer' AND repair_id IN (SELECT get_customer_repair_ids()));

CREATE POLICY "Customer inserts own repair timeline" ON public.repair_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'customer'
    AND repair_id IN (SELECT get_customer_repair_ids())
    AND updated_by = auth.uid()
  );

CREATE POLICY "Technician manages assigned repair timeline" ON public.repair_timeline
  FOR ALL TO authenticated
  USING (get_my_role() = 'technician' AND repair_id IN (SELECT get_tech_repair_ids()))
  WITH CHECK (get_my_role() = 'technician' AND repair_id IN (SELECT get_tech_repair_ids()));

CREATE POLICY "Delivery inserts timeline" ON public.repair_timeline
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'delivery' AND repair_id IN (SELECT get_delivery_repair_ids()));

-- 5. DEVICES
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to devices" ON public.devices
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "All authenticated read devices" ON public.devices
  FOR SELECT TO authenticated USING (true);

-- 6. PRICING
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to pricing" ON public.pricing
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "All authenticated read pricing" ON public.pricing
  FOR SELECT TO authenticated USING (true);

-- 7. PARTS
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to parts" ON public.parts
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages own parts" ON public.parts
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id())
  WITH CHECK (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id());

CREATE POLICY "Technician reads shop parts" ON public.parts
  FOR SELECT TO authenticated
  USING (get_my_role() = 'technician' AND shop_id = get_my_shop_id());

-- 8. PARTS_USED
ALTER TABLE public.parts_used ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to parts_used" ON public.parts_used
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop parts_used" ON public.parts_used
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Technician manages own parts_used" ON public.parts_used
  FOR ALL TO authenticated
  USING (get_my_role() = 'technician' AND repair_id IN (SELECT get_tech_repair_ids()))
  WITH CHECK (get_my_role() = 'technician' AND repair_id IN (SELECT get_tech_repair_ids()));

-- 9. INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Customer reads own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (get_my_role() = 'customer' AND repair_id IN (SELECT get_customer_repair_ids()));

CREATE POLICY "Technician reads repair invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (get_my_role() = 'technician' AND repair_id IN (SELECT get_tech_repair_ids()));

-- 10. DELIVERY_ASSIGNMENTS
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to delivery_assignments" ON public.delivery_assignments
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop deliveries" ON public.delivery_assignments
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Delivery boy manages own assignments" ON public.delivery_assignments
  FOR ALL TO authenticated
  USING (get_my_role() = 'delivery' AND delivery_boy_id = auth.uid())
  WITH CHECK (get_my_role() = 'delivery' AND delivery_boy_id = auth.uid());

-- 11. RCA_REPORTS
ALTER TABLE public.rca_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to rca_reports" ON public.rca_reports
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop RCA" ON public.rca_reports
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Technician manages own RCA" ON public.rca_reports
  FOR ALL TO authenticated
  USING (get_my_role() = 'technician' AND technician_id = auth.uid())
  WITH CHECK (get_my_role() = 'technician' AND technician_id = auth.uid());

-- 12. REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin reads shop reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (get_my_role() = 'shop_admin' AND repair_id IN (SELECT get_shop_repair_ids()));

CREATE POLICY "Customer manages own reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (get_my_role() = 'customer' AND customer_id = auth.uid())
  WITH CHECK (get_my_role() = 'customer' AND customer_id = auth.uid());

CREATE POLICY "All authenticated read reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

-- 13. EWASTE
ALTER TABLE public.ewaste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to ewaste" ON public.ewaste
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Customer manages own ewaste" ON public.ewaste
  FOR ALL TO authenticated
  USING (get_my_role() = 'customer' AND customer_id = auth.uid())
  WITH CHECK (get_my_role() = 'customer' AND customer_id = auth.uid());

-- 14. EWASTE_PAYOUT_RATES
ALTER TABLE public.ewaste_payout_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to ewaste_payout_rates" ON public.ewaste_payout_rates
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "All authenticated read ewaste_payout_rates" ON public.ewaste_payout_rates
  FOR SELECT TO authenticated USING (true);

-- 15. SHOP_ITEMS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to shop_items" ON public.shop_items
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages own shop_items" ON public.shop_items
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id())
  WITH CHECK (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id());

-- 16. ATTENDANCE
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages own attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id())
  WITH CHECK (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id());

CREATE POLICY "Employee reads own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (employee_id = auth.uid());

-- 17. SALARY_CONFIG
ALTER TABLE public.salary_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to salary_config" ON public.salary_config
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages own salary_config" ON public.salary_config
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id())
  WITH CHECK (get_my_role() = 'shop_admin' AND shop_id = get_my_shop_id());

CREATE POLICY "Employee reads own salary" ON public.salary_config
  FOR SELECT TO authenticated USING (employee_id = auth.uid());

-- 18. HOLIDAYS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to holidays" ON public.holidays
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "All authenticated read holidays" ON public.holidays
  FOR SELECT TO authenticated USING (true);

-- 19. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "User manages own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 20. TECHNICIAN_DETAILS
ALTER TABLE public.technician_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to technician_details" ON public.technician_details
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Shop admin manages shop technician_details" ON public.technician_details
  FOR ALL TO authenticated
  USING (get_my_role() = 'shop_admin' AND user_id IN (SELECT get_shop_user_ids()))
  WITH CHECK (get_my_role() = 'shop_admin' AND user_id IN (SELECT get_shop_user_ids()));

CREATE POLICY "Technician reads own details" ON public.technician_details
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- DONE!
