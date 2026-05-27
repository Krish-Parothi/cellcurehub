# Backend Features Testing Guide

This document lists all the backend features implemented in the CellCureHub project, along with their testing URLs. It is designed to help you verify that the database schema, RLS policies, and server-side data fetching are working perfectly.

## 1. System Administration (Super Admin)
**Base URL:** `http://localhost:3000/admin`

*   **Admin Dashboard** (`/admin`): Overview of system-wide metrics (revenue, active repairs, total users). Tests aggregations.
*   **Manage Repairs** (`/admin/repairs`): Full CRUD for all repairs across the system. 
    *   *Backend Test:* Verify ability to see unassigned repairs and assign a `shop_id` to route them.
*   **Manage Shops** (`/admin/shops`): Create and manage franchise locations.
    *   *Backend Test:* Insert new shops, deactivate existing ones.
*   **Manage Staff** (`/admin/staff`): Manage system-wide users (Shop Admins, Technicians, Delivery, Customers).
*   **Inventory & Parts** (`/admin/inventory`): Manage global parts catalog and stock levels.
*   **Device Models** (`/admin/devices`): Manage the list of supported brands and models (iPhone 14, Samsung S23, etc.).
*   **Pricing Engine** (`/admin/pricing`): Manage base repair costs and profit margins.
*   **Analytics** (`/admin/analytics`): Deep dive into system-wide performance and charts.

## 2. Franchise Management (Shop Admin)
**Base URL:** `http://localhost:3000/shop-admin`

*   **Shop Dashboard** (`/shop-admin`): Overview of shop-specific metrics.
    *   *Backend Test:* Ensure RLS policies restrict metrics to *only* their assigned `shop_id`.
*   **Shop Repairs** (`/shop-admin/repairs`): Manage repairs routed to this specific shop.
    *   *Backend Test:* Assign technicians and delivery personnel to repairs.
*   **Shop Staff** (`/shop-admin/staff`): Manage technicians and delivery boys assigned to this shop.
*   **Shop Inventory** (`/shop-admin/inventory`): Manage local stock levels of parts.
*   **Customers** (`/shop-admin/customers`): View customers who have repairs at this shop.

## 3. Operations Staff (Technician & Delivery)

*   **Technician Dashboard** (`/technician`): 
    *   *Backend Test:* Verify technicians only see repairs assigned to them via `technician_id`. Test changing status (In Progress -> Done) and inserting into `repair_timeline`.
    *   *Backend Test:* Test adding `parts_used` to a repair.
*   **Delivery Dashboard** (`/delivery`):
    *   *Backend Test:* Verify delivery personnel only see assignments linked to their `delivery_boy_id`. Test changing delivery status (Picked Up, Delivered).

## 4. Customer Portal
**Base URL:** `http://localhost:3000`

*   **Signup/Auth** (`/signup`, `/login`): Tests Supabase Auth user creation and `public.users` trigger.
*   **Book a Repair** (`/book`): 
    *   *Backend Test:* Test inserting a new record into `public.repairs` without a `shop_id` or `technician_id`. Ensure RLS allows insert but prevents hijacking other users.
*   **Customer Dashboard** (`/dashboard`): 
    *   *Backend Test:* Ensure customers can only fetch their own repairs, invoices, and E-Waste requests.
*   **Track Repair** (`/track`): Public/semi-public route to check repair timeline status using ID.

## 5. Security & RLS Verification (Database Level)
To test the core backend security, you should verify the v3 RLS policies:
1.  **Infinite Recursion fix:** Ensure opening the `/book` page and submitting a repair no longer throws the `42P17 infinite recursion` error.
2.  **Cross-table access:** Verify that the `SECURITY DEFINER` helper functions (`get_shop_repair_ids`, `get_delivery_repair_ids`) correctly allow shop admins to see repairs assigned to their shop without causing loops.
