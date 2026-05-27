-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  shop_id uuid,
  date date NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'half_day'::text])),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id),
  CONSTRAINT attendance_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.delivery_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  delivery_boy_id uuid NOT NULL,
  shop_id uuid,
  job_type text NOT NULL CHECK (job_type = ANY (ARRAY['pickup'::text, 'dropoff'::text])),
  status text NOT NULL DEFAULT 'assigned'::text CHECK (status = ANY (ARRAY['assigned'::text, 'in_transit'::text, 'picked_up'::text, 'at_store'::text, 'out_for_delivery'::text, 'delivered'::text, 'returned'::text])),
  scheduled_date date,
  special_instructions text,
  pickup_otp text,
  delivery_otp text,
  intake_photos ARRAY DEFAULT '{}'::text[],
  intake_condition jsonb DEFAULT '{}'::jsonb,
  customer_signature_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_assignments_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT delivery_assignments_delivery_boy_id_fkey FOREIGN KEY (delivery_boy_id) REFERENCES public.users(id),
  CONSTRAINT delivery_assignments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['smartphone'::text, 'laptop'::text, 'tablet'::text])),
  is_active boolean DEFAULT true,
  CONSTRAINT devices_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ewaste (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  device_description text NOT NULL,
  photos_url text,
  estimated_value numeric,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'valued'::text, 'picked_up'::text, 'credited'::text])),
  created_at timestamp with time zone DEFAULT now(),
  device_id uuid,
  imei_number text,
  condition text CHECK (condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'dead'::text, 'powers_off'::text])),
  condition_description text,
  quoted_value numeric,
  payout_method text,
  CONSTRAINT ewaste_pkey PRIMARY KEY (id),
  CONSTRAINT ewaste_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT ewaste_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id)
);
CREATE TABLE public.ewaste_payout_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model_id uuid,
  cash_min numeric DEFAULT 0,
  cash_max numeric DEFAULT 0,
  credit_min numeric DEFAULT 0,
  credit_max numeric DEFAULT 0,
  CONSTRAINT ewaste_payout_rates_pkey PRIMARY KEY (id),
  CONSTRAINT ewaste_payout_rates_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.devices(id)
);
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text])),
  payment_method text CHECK (payment_method = ANY (ARRAY['cash'::text, 'upi'::text, 'card'::text])),
  upi_qr_url text,
  created_at timestamp with time zone DEFAULT now(),
  merchant_upi_id text,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  type text,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  model_compatible text NOT NULL,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  shop_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parts_pkey PRIMARY KEY (id),
  CONSTRAINT parts_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.parts_used (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  part_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  cost_at_time numeric NOT NULL DEFAULT 0,
  CONSTRAINT parts_used_pkey PRIMARY KEY (id),
  CONSTRAINT parts_used_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT parts_used_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id)
);
CREATE TABLE public.pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  device_id uuid,
  repair_type text NOT NULL,
  min_price numeric NOT NULL DEFAULT 0,
  max_price numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pricing_pkey PRIMARY KEY (id),
  CONSTRAINT pricing_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id)
);
CREATE TABLE public.rca_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  technician_id uuid NOT NULL,
  diagnostic_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  technician_notes text,
  before_photos ARRAY DEFAULT '{}'::text[],
  after_photos ARRAY DEFAULT '{}'::text[],
  admin_confirmed boolean DEFAULT false,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rca_reports_pkey PRIMARY KEY (id),
  CONSTRAINT rca_reports_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT rca_reports_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id)
);
CREATE TABLE public.repair_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  status text NOT NULL,
  note text,
  photo_url text,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT repair_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT repair_timeline_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT repair_timeline_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.repairs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  device_id uuid NOT NULL,
  technician_id uuid,
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'booked'::text CHECK (status = ANY (ARRAY['booked'::text, 'pickup_scheduled'::text, 'device_received'::text, 'diagnostic'::text, 'repair_in_progress'::text, 'qa_testing'::text, 'ready'::text, 'done'::text, 'pending_approval'::text, 'out_for_delivery'::text, 'delivered'::text, 'cancelled'::text])),
  estimated_cost numeric,
  final_cost numeric,
  pickup_type text NOT NULL DEFAULT 'store'::text CHECK (pickup_type = ANY (ARRAY['home'::text, 'store'::text])),
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  repair_type text,
  custom_repair_description text,
  imei_number text,
  manual_model text,
  coordinates point,
  preferred_date date,
  time_slot text CHECK (time_slot = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text])),
  shop_id uuid,
  approval_status text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  approval_photo_url text,
  approval_note text,
  delivered_at timestamp with time zone,
  follow_up_sent boolean DEFAULT false,
  CONSTRAINT repairs_pkey PRIMARY KEY (id),
  CONSTRAINT repairs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT repairs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id),
  CONSTRAINT repairs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id),
  CONSTRAINT repairs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id)
);
CREATE TABLE public.salary_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  shop_id uuid,
  base_salary numeric NOT NULL DEFAULT 0,
  per_day_deduction numeric NOT NULL DEFAULT 0,
  month date NOT NULL,
  final_salary_override numeric,
  CONSTRAINT salary_config_pkey PRIMARY KEY (id),
  CONSTRAINT salary_config_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id),
  CONSTRAINT salary_config_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.shop_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  price numeric NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_items_pkey PRIMARY KEY (id),
  CONSTRAINT shop_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.shops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  area text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shops_pkey PRIMARY KEY (id)
);
CREATE TABLE public.technician_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  aadhar_number text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT technician_details_pkey PRIMARY KEY (id),
  CONSTRAINT technician_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['customer'::text, 'technician'::text, 'delivery'::text, 'admin'::text, 'shop_admin'::text])),
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  shop_id uuid,
  is_active boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
