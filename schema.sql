-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
  phone_verified boolean DEFAULT false,
  credits numeric DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['smartphone'::text, 'laptop'::text, 'tablet'::text])),
  is_active boolean DEFAULT true,
  CONSTRAINT devices_pkey PRIMARY KEY (id)
);
CREATE TABLE public.repairs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  device_id uuid NOT NULL,
  technician_id uuid,
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'booked'::text CHECK (status = ANY (ARRAY['ticket_raised'::text, 'booked'::text, 'pickup_scheduled'::text, 'device_received'::text, 'dropped_at_store'::text, 'diagnostic'::text, 'repair_in_progress'::text, 'qa_testing'::text, 'ready'::text, 'done'::text, 'pending_approval'::text, 'out_for_delivery'::text, 'delivered'::text, 'cancelled'::text, 'wocr'::text])),
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
  sla_deadline timestamp with time zone,
  sla_extended boolean DEFAULT false,
  sla_extension_reason text,
  CONSTRAINT repairs_pkey PRIMARY KEY (id),
  CONSTRAINT repairs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT repairs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id),
  CONSTRAINT repairs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id),
  CONSTRAINT repairs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
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
CREATE TABLE public.ewaste (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  device_description text NOT NULL,
  photos_url text,
  estimated_value numeric,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'admin_offered'::text, 'valued'::text, 'agreed'::text, 'rejected'::text, 'pickup_assigned'::text, 'picked_up'::text, 'credited'::text])),
  created_at timestamp with time zone DEFAULT now(),
  device_id uuid,
  imei_number text,
  condition text CHECK (condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'dead'::text, 'powers_off'::text])),
  condition_description text,
  quoted_value numeric,
  payout_method text,
  admin_offer numeric,
  customer_agreed boolean,
  address text,
  ewaste_category_id uuid,
  category text DEFAULT 'ewaste'::text CHECK (category = ANY (ARRAY['ewaste'::text, 'resell'::text])),
  CONSTRAINT ewaste_pkey PRIMARY KEY (id),
  CONSTRAINT ewaste_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT ewaste_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id),
  CONSTRAINT ewaste_ewaste_category_id_fkey FOREIGN KEY (ewaste_category_id) REFERENCES public.ewaste_categories(id)
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
CREATE TABLE public.delivery_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repair_id uuid,
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
  ewaste_id uuid,
  CONSTRAINT delivery_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_assignments_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id),
  CONSTRAINT delivery_assignments_delivery_boy_id_fkey FOREIGN KEY (delivery_boy_id) REFERENCES public.users(id),
  CONSTRAINT delivery_assignments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id),
  CONSTRAINT delivery_assignments_ewaste_id_fkey FOREIGN KEY (ewaste_id) REFERENCES public.ewaste(id)
);
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
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
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
CREATE TABLE public.technician_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  aadhar_number text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT technician_details_pkey PRIMARY KEY (id),
  CONSTRAINT technician_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
CREATE TABLE public.early_bird_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  mobile text NOT NULL,
  address text NOT NULL,
  email text NOT NULL DEFAULT ''::text,
  CONSTRAINT early_bird_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.booking_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT booking_otps_pkey PRIMARY KEY (id),
  CONSTRAINT booking_otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.time_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slot_key text NOT NULL UNIQUE,
  label text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  CONSTRAINT time_slots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_otps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  shop_item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT cart_items_shop_item_id_fkey FOREIGN KEY (shop_item_id) REFERENCES public.shop_items(id)
);
CREATE TABLE public.ewaste_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ewaste_categories_pkey PRIMARY KEY (id)
);C R E A T E   T A B L E   p u b l i c . s t o r e _ o r d e r s   (  
     i d   u u i d   N O T   N U L L   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c u s t o m e r _ i d   u u i d   N O T   N U L L ,  
     f u l l _ n a m e   t e x t   N O T   N U L L ,  
     p h o n e   t e x t   N O T   N U L L ,  
     a d d r e s s   t e x t   N O T   N U L L ,  
     t o t a l _ a m o u n t   n u m e r i c   N O T   N U L L   D E F A U L T   0 ,  
     s t a t u s   t e x t   N O T   N U L L   D E F A U L T   ' p e n d i n g ' : : t e x t   C H E C K   ( s t a t u s   =   A N Y   ( A R R A Y [ ' p e n d i n g ' : : t e x t ,   ' d r i v e r _ a s s i g n e d ' : : t e x t ,   ' d e l i v e r e d ' : : t e x t ,   ' c a n c e l l e d ' : : t e x t ] ) ) ,  
     d e l i v e r y _ b o y _ i d   u u i d ,  
     c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) ,  
     C O N S T R A I N T   s t o r e _ o r d e r s _ p k e y   P R I M A R Y   K E Y   ( i d ) ,  
     C O N S T R A I N T   s t o r e _ o r d e r s _ c u s t o m e r _ i d _ f k e y   F O R E I G N   K E Y   ( c u s t o m e r _ i d )   R E F E R E N C E S   p u b l i c . u s e r s ( i d ) ,  
     C O N S T R A I N T   s t o r e _ o r d e r s _ d e l i v e r y _ b o y _ i d _ f k e y   F O R E I G N   K E Y   ( d e l i v e r y _ b o y _ i d )   R E F E R E N C E S   p u b l i c . u s e r s ( i d )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . s t o r e _ o r d e r _ i t e m s   (  
     i d   u u i d   N O T   N U L L   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     o r d e r _ i d   u u i d   N O T   N U L L ,  
     s h o p _ i t e m _ i d   u u i d   N O T   N U L L ,  
     q u a n t i t y   i n t e g e r   N O T   N U L L   D E F A U L T   1 ,  
     p r i c e _ a t _ p u r c h a s e   n u m e r i c   N O T   N U L L   D E F A U L T   0 ,  
     C O N S T R A I N T   s t o r e _ o r d e r _ i t e m s _ p k e y   P R I M A R Y   K E Y   ( i d ) ,  
     C O N S T R A I N T   s t o r e _ o r d e r _ i t e m s _ o r d e r _ i d _ f k e y   F O R E I G N   K E Y   ( o r d e r _ i d )   R E F E R E N C E S   p u b l i c . s t o r e _ o r d e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
     C O N S T R A I N T   s t o r e _ o r d e r _ i t e m s _ s h o p _ i t e m _ i d _ f k e y   F O R E I G N   K E Y   ( s h o p _ i t e m _ i d )   R E F E R E N C E S   p u b l i c . s h o p _ i t e m s ( i d )  
 ) ;  
  
 - -   E n a b l e   R L S  
 A L T E R   T A B L E   p u b l i c . s t o r e _ o r d e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . s t o r e _ o r d e r _ i t e m s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 - -   P o l i c i e s   f o r   s t o r e _ o r d e r s  
 C R E A T E   P O L I C Y   " A d m i n   c a n   d o   e v e r y t h i n g   o n   s t o r e _ o r d e r s "   O N   p u b l i c . s t o r e _ o r d e r s   F O R   A L L   T O   a u t h e n t i c a t e d   U S I N G   (  
     ( S E L E C T   r o l e   F R O M   p u b l i c . u s e r s   W H E R E   i d   =   a u t h . u i d ( ) )   =   ' a d m i n '  
 ) ;  
  
 C R E A T E   P O L I C Y   " C u s t o m e r s   c a n   v i e w   o w n   s t o r e _ o r d e r s "   O N   p u b l i c . s t o r e _ o r d e r s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   (  
     c u s t o m e r _ i d   =   a u t h . u i d ( )  
 ) ;  
  
 C R E A T E   P O L I C Y   " C u s t o m e r s   c a n   c r e a t e   o w n   s t o r e _ o r d e r s "   O N   p u b l i c . s t o r e _ o r d e r s   F O R   I N S E R T   T O   a u t h e n t i c a t e d   W I T H   C H E C K   (  
     c u s t o m e r _ i d   =   a u t h . u i d ( )  
 ) ;  
  
 C R E A T E   P O L I C Y   " D e l i v e r y   b o y   c a n   v i e w   a s s i g n e d   s t o r e _ o r d e r s "   O N   p u b l i c . s t o r e _ o r d e r s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   (  
     d e l i v e r y _ b o y _ i d   =   a u t h . u i d ( )  
 ) ;  
  
 C R E A T E   P O L I C Y   " D e l i v e r y   b o y   c a n   u p d a t e   a s s i g n e d   s t o r e _ o r d e r s "   O N   p u b l i c . s t o r e _ o r d e r s   F O R   U P D A T E   T O   a u t h e n t i c a t e d   U S I N G   (  
     d e l i v e r y _ b o y _ i d   =   a u t h . u i d ( )  
 ) ;  
  
 - -   P o l i c i e s   f o r   s t o r e _ o r d e r _ i t e m s  
 C R E A T E   P O L I C Y   " A d m i n   c a n   d o   e v e r y t h i n g   o n   s t o r e _ o r d e r _ i t e m s "   O N   p u b l i c . s t o r e _ o r d e r _ i t e m s   F O R   A L L   T O   a u t h e n t i c a t e d   U S I N G   (  
     ( S E L E C T   r o l e   F R O M   p u b l i c . u s e r s   W H E R E   i d   =   a u t h . u i d ( ) )   =   ' a d m i n '  
 ) ;  
  
 C R E A T E   P O L I C Y   " C u s t o m e r s   c a n   v i e w   o w n   s t o r e _ o r d e r _ i t e m s "   O N   p u b l i c . s t o r e _ o r d e r _ i t e m s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   (  
     E X I S T S   (  
         S E L E C T   1   F R O M   p u b l i c . s t o r e _ o r d e r s   W H E R E   s t o r e _ o r d e r s . i d   =   s t o r e _ o r d e r _ i t e m s . o r d e r _ i d   A N D   s t o r e _ o r d e r s . c u s t o m e r _ i d   =   a u t h . u i d ( )  
     )  
 ) ;  
  
 C R E A T E   P O L I C Y   " C u s t o m e r s   c a n   c r e a t e   s t o r e _ o r d e r _ i t e m s "   O N   p u b l i c . s t o r e _ o r d e r _ i t e m s   F O R   I N S E R T   T O   a u t h e n t i c a t e d   W I T H   C H E C K   (  
     E X I S T S   (  
         S E L E C T   1   F R O M   p u b l i c . s t o r e _ o r d e r s   W H E R E   s t o r e _ o r d e r s . i d   =   s t o r e _ o r d e r _ i t e m s . o r d e r _ i d   A N D   s t o r e _ o r d e r s . c u s t o m e r _ i d   =   a u t h . u i d ( )  
     )  
 ) ;  
  
 C R E A T E   P O L I C Y   " D e l i v e r y   b o y   c a n   v i e w   a s s i g n e d   s t o r e _ o r d e r _ i t e m s "   O N   p u b l i c . s t o r e _ o r d e r _ i t e m s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   (  
     E X I S T S   (  
         S E L E C T   1   F R O M   p u b l i c . s t o r e _ o r d e r s   W H E R E   s t o r e _ o r d e r s . i d   =   s t o r e _ o r d e r _ i t e m s . o r d e r _ i d   A N D   s t o r e _ o r d e r s . d e l i v e r y _ b o y _ i d   =   a u t h . u i d ( )  
     )  
 ) ;  
 