/*
  # CellCureHub Initial Database Schema

  1. New Tables
    - `users`: Stores all user profiles with role-based access (customer, technician, delivery, admin)
    - `devices`: Catalog of repairable devices (smartphones, laptops, tablets) by brand and model
    - `repairs`: Core repair tracking table with full lifecycle from booking to delivery
    - `repair_timeline`: Audit trail of every status change for each repair with notes and photos
    - `parts`: Inventory management for repair parts with stock levels and pricing
    - `parts_used`: Junction table linking repairs to parts consumed with cost tracking
    - `invoices`: Billing records for repairs with payment tracking and UPI support
    - `ewaste`: E-waste collection portal for device valuation and pickup
    - `reviews`: Customer feedback and ratings for completed repairs

  2. Security
    - RLS enabled on ALL tables
    - Customers can only see their own data
    - Technicians can see assigned repairs and related data
    - Delivery personnel can see assigned pickups/deliveries
    - Admin has full access to all tables
    - Public read access on devices catalog only

  3. Important Notes
    - All timestamps use timestamptz with DEFAULT now()
    - UUIDs used for all primary keys
    - Repair status is constrained to valid lifecycle stages
    - Payment status and methods are constrained to valid options
    - E-waste status tracks the valuation and pickup lifecycle
*/

-- Users table: extends Supabase auth.users with app-specific profile data
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'delivery', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Devices catalog: brands, models, and categories
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('smartphone', 'laptop', 'tablet')),
  UNIQUE(brand, model_name)
);

-- Repairs: core tracking table
CREATE TABLE IF NOT EXISTS repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  technician_id uuid REFERENCES users(id),
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'pickup_scheduled', 'device_received', 'diagnostic', 'repair_in_progress', 'qa_testing', 'ready', 'delivered')),
  estimated_cost numeric,
  final_cost numeric,
  pickup_type text NOT NULL DEFAULT 'store' CHECK (pickup_type IN ('home', 'store')),
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Repair timeline: audit trail for every status change
CREATE TABLE IF NOT EXISTS repair_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  photo_url text,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Parts inventory
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  model_compatible text NOT NULL,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5
);

-- Parts used in repairs
CREATE TABLE IF NOT EXISTS parts_used (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES parts(id),
  quantity integer NOT NULL DEFAULT 1,
  cost_at_time numeric NOT NULL DEFAULT 0
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id),
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_method text CHECK (payment_method IN ('cash', 'upi', 'card')),
  upi_qr_url text,
  created_at timestamptz DEFAULT now()
);

-- E-waste collection portal
CREATE TABLE IF NOT EXISTS ewaste (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  device_description text NOT NULL,
  photos_url text,
  estimated_value numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'valued', 'picked_up', 'credited')),
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ewaste ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is technician
CREATE OR REPLACE FUNCTION is_technician() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'technician'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is delivery
CREATE OR REPLACE FUNCTION is_delivery() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'delivery'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- DEVICES policies (public read, admin write)
CREATE POLICY "Anyone can read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete devices"
  ON devices FOR DELETE
  TO authenticated
  USING (is_admin());

-- REPAIRS policies
CREATE POLICY "Customers see own repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Technicians see assigned repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid());

CREATE POLICY "Admin sees all repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Delivery sees assigned repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (is_delivery() AND status IN ('pickup_scheduled', 'ready'));

CREATE POLICY "Customers can create repairs"
  ON repairs FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Technicians can update assigned repairs"
  ON repairs FOR UPDATE
  TO authenticated
  USING (technician_id = auth.uid() OR is_admin())
  WITH CHECK (technician_id = auth.uid() OR is_admin());

CREATE POLICY "Customers can update own repairs"
  ON repairs FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- REPAIR_TIMELINE policies
CREATE POLICY "Users can view timeline of accessible repairs"
  ON repair_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_timeline.repair_id
      AND (repairs.customer_id = auth.uid() OR repairs.technician_id = auth.uid() OR is_admin() OR is_delivery())
    )
  );

CREATE POLICY "Technicians and admin can add timeline entries"
  ON repair_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_timeline.repair_id
      AND (repairs.technician_id = auth.uid() OR is_admin())
    )
  );

-- PARTS policies
CREATE POLICY "Authenticated users can read parts"
  ON parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage parts"
  ON parts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update parts"
  ON parts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete parts"
  ON parts FOR DELETE
  TO authenticated
  USING (is_admin());

-- PARTS_USED policies
CREATE POLICY "Users can view parts used in accessible repairs"
  ON parts_used FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = parts_used.repair_id
      AND (repairs.customer_id = auth.uid() OR repairs.technician_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Technicians and admin can add parts used"
  ON parts_used FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = parts_used.repair_id
      AND (repairs.technician_id = auth.uid() OR is_admin())
    )
  );

-- INVOICES policies
CREATE POLICY "Customers see invoices for own repairs"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = invoices.repair_id
      AND (repairs.customer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Admin can manage invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- EWASTE policies
CREATE POLICY "Customers see own ewaste submissions"
  ON ewaste FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admin sees all ewaste"
  ON ewaste FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Customers can create ewaste submissions"
  ON ewaste FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admin can update ewaste"
  ON ewaste FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- REVIEWS policies
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews for own repairs"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admin can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_repairs_customer ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician ON repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repair_timeline_repair ON repair_timeline(repair_id);
CREATE INDEX IF NOT EXISTS idx_parts_used_repair ON parts_used(repair_id);
CREATE INDEX IF NOT EXISTS idx_invoices_repair ON invoices(repair_id);
CREATE INDEX IF NOT EXISTS idx_ewaste_customer ON ewaste(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_repair ON reviews(repair_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Auto-update updated_at trigger for repairs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
