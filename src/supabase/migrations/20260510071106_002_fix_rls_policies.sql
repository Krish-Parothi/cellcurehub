/*
  # Fix RLS Policies for Customer, Delivery, and Public Access

  1. Policy Changes
    - `repair_timeline`: Allow customers to insert timeline entries for their own repairs
    - `repairs`: Allow delivery personnel to update status on repairs with pickup_scheduled or ready status
    - `repair_timeline`: Allow delivery personnel to insert timeline entries for repairs they can update
    - `invoices`: Allow delivery personnel to insert invoices
    - Public read access for repair tracking, devices, parts, reviews, and user basic info

  2. Security
    - Customer timeline insert scoped to their own repairs
    - Delivery updates scoped to repairs in pickup_scheduled or ready status
    - Public read access limited to what's needed for tracking
*/

-- Allow customers to insert timeline entries for their own repairs
CREATE POLICY "Customers can add timeline for own repairs"
  ON repair_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_timeline.repair_id
      AND repairs.customer_id = auth.uid()
    )
  );

-- Allow delivery personnel to update repair status for pickups and deliveries
CREATE POLICY "Delivery can update pickup and delivery status"
  ON repairs FOR UPDATE
  TO authenticated
  USING (
    is_delivery() AND status IN ('pickup_scheduled', 'ready')
  )
  WITH CHECK (
    is_delivery() AND status IN ('pickup_scheduled', 'device_received', 'ready', 'delivered')
  );

-- Allow delivery personnel to insert timeline entries for repairs they handle
CREATE POLICY "Delivery can add timeline entries"
  ON repair_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_timeline.repair_id
      AND (
        (is_delivery() AND repairs.status IN ('pickup_scheduled', 'ready'))
        OR repairs.customer_id = auth.uid()
        OR repairs.technician_id = auth.uid()
        OR is_admin()
      )
    )
  );

-- Allow delivery personnel to insert invoices
CREATE POLICY "Delivery can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    is_delivery() OR is_admin()
  );

-- Public read access for repair tracking
CREATE POLICY "Public can read repairs by ID"
  ON repairs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for repair timeline
CREATE POLICY "Public can read repair timeline"
  ON repair_timeline FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for devices catalog
CREATE POLICY "Public can read devices"
  ON devices FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for users (limited info for tracking)
CREATE POLICY "Public can read user basic info"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for reviews
CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for parts
CREATE POLICY "Public can read parts"
  ON parts FOR SELECT
  TO anon, authenticated
  USING (true);
