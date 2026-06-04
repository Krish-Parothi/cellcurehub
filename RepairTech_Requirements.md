**RepairTech**

Mobile Repair Management Platform

Project Requirements & Technical Specification Document

| **Client**        | RepairTech (Nagpur-based Mobile Repair Business)      |
| ----------------- | ----------------------------------------------------- |
| **Document Type** | Full Product Specification - All Roles & Workflows    |
| **Version**       | 2.0 - Revised with New Role Structure & Modifications |
| **Date**          | May 2025                                              |
| **Prepared By**   | Product & Development Team                            |
| **Tech Stack**    | React / React Native / Node.js / Supabase             |

_This document contains the complete product specification for the RepairTech platform - covering the public-facing website, customer app, technician PWA, delivery boy PWA, and admin dashboard. It includes all workflows, page-by-page breakdowns, data models, and business logic for each of the four user roles._

# **1\. Project Overview**

RepairTech is a full-stack mobile device repair management platform built for a Nagpur-based repair shop. It digitizes and streamlines every step of the repair lifecycle - from customer booking and device pickup through technician repair workflows to final delivery - while giving the business owner real-time visibility and control over operations.

## **1.1 Core Objectives**

- Build customer trust through radical transparency (live repair tracking, RCA reports, photo evidence)
- Eliminate manual coordination between front desk, technicians, and delivery staff
- Provide the business owner with a live command center for operations, inventory, and financials
- Offer scalable, role-separated interfaces so each user sees only what they need
- Support eco-friendly e-waste trade-in and recycling as a customer value-add

## **1.2 Competitive Context**

The platform is designed to outperform the following competitors through superior UX, real-time tracking, and operational depth:

- Cashify - buyback-focused, no repair tracking depth
- Fixify - limited real-time status updates
- GadgetZippy - no integrated delivery/pickup management
- ShatterFix (shatterfix.com) - US-based, no India-specific UX
- OngoFix (ongofix.com) - basic workflow, no technician-facing tools

## **1.3 User Roles (4 Roles)**

The platform separates all functionality into four strictly distinct user roles:

| **Role**          | **Interface**           | **Primary Responsibility**                                      |
| ----------------- | ----------------------- | --------------------------------------------------------------- |
| **Customer**      | Website + Mobile App    | Book repairs, track status, manage profile, e-waste, approvals  |
| **Technician**    | Shop Floor PWA (Tablet) | Diagnose, repair, update job status, submit RCA                 |
| **Delivery Boy**  | Mobile PWA              | Pick up & deliver devices with OTP verification                 |
| **Admin / Owner** | Web Dashboard           | Full business oversight, assignments, pricing, staff management |

# **2\. Technology Stack**

| **Layer**             | **Technology**                          | **Purpose**                                      |
| --------------------- | --------------------------------------- | ------------------------------------------------ |
| **Frontend - Web**    | React.js + Tailwind CSS + Framer Motion | Public website & admin dashboard                 |
| **Frontend - Mobile** | React Native (Expo)                     | Customer iOS/Android app                         |
| **Frontend - PWA**    | React + Tailwind (PWA)                  | Technician & delivery boy web apps               |
| **Backend**           | Node.js + Express.js                    | REST API, business logic, OTP, notifications     |
| **Database**          | Supabase (PostgreSQL)                   | All data: users, jobs, inventory, parts          |
| **Auth**              | Supabase Auth                           | Role-based JWT authentication for all 4 roles    |
| **Real-time**         | Supabase Realtime (WebSockets)          | Live job status updates, kanban syncing          |
| **Storage**           | Supabase Storage                        | Device photos, RCA images, e-waste uploads       |
| **Notifications**     | WhatsApp Business API / FCM             | OTP, status updates, post-repair follow-up       |
| **Payments**          | Razorpay (UPI QR)                       | Dynamic per-job UPI QR code generation           |
| **Maps / Location**   | Browser Geolocation API                 | GPS location fetch for customer pickup (Phase 1) |
| **Hosting**           | Vercel (frontend) + Railway (backend)   | CI/CD deployments                                |

_Note: Google Maps or Mapbox integration for route optimization can be added in Phase 2 pending decision on mapping provider._

**👤 ROLE 1: Customer (Website + Mobile App)**

## **3.1 Overview**

The customer-facing surface includes both the public marketing website and the customer mobile app. The website handles discovery and trust-building; the app handles the full lifecycle of their repair interactions.

## **3.2 Onboarding & Authentication**

### **Sign-Up Fields (Minimal)**

At sign-up, collect only the essentials to reduce friction:

- Full Name
- Mobile Number (used for OTP-based login)
- Email Address
- Home Address (used as default pickup address)

Device details (phone model, IMEI) are NOT collected at sign-up. They are collected at the time of booking a repair or e-waste service to keep sign-up friction minimal.

## **3.3 Website Pages**

| **Page / Screen**         | **Key Features & Content**                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home / Landing**        | 3D scroll animations, hero section with repair CTA, trust badges, competitor differentiation, 'How It Works' visual flow, testimonials, live repair counter widget                                                                                                        |
| **Device Booking Flow**   | Step 1: Select brand (admin-editable list). Step 2: Select model (admin-editable per brand). Step 3: Select issue type (preset list + 'Custom / Other' option for unspecified repairs). Step 4: Cost estimate range display. Step 5: Choose Store Drop-off or Home Pickup |
| **Home Pickup Details**   | Address form with 'Use Current Location' GPS button (fetches lat/lng via Browser Geolocation API, converts to readable address). Date/time slot selector. Contact number confirmation                                                                                     |
| **E-Waste Portal**        | Select brand > Select model (same admin-editable model list as repair). Add IMEI number field. Upload photos of device (max 5). Estimated cash/store credit value display. Option: 'Lock In Value & Schedule Pickup'                                                      |
| **Track Repair (Public)** | Enter booking ID or phone number. View dynamic timeline. No login required for basic status                                                                                                                                                                               |
| **Pricing Page**          | Dynamic pricing table pulled from admin's master pricing config. Repair costs, part costs, pickup fees                                                                                                                                                                    |
| **About / Contact**       | Business story, team, shop locations (Nagpur). Contact form, WhatsApp link, Google Maps embed                                                                                                                                                                             |
| **Sign Up / Login**       | Phone number OTP login. Sign-up collects: Name, Number, Email, Address only                                                                                                                                                                                               |

## **3.4 Customer App Screens**

| **Page / Screen**              | **Key Features & Content**                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home / Dashboard**           | Active repair cards with real-time status chip. Quick 'Book New Repair' CTA. Promotions/offers banner. Notifications bell                                                                                                                                    |
| **Book Repair**                | Brand > Model selection (admin-editable). Issue selection (preset + 'Custom Repair' option). Auto-ask for phone model and IMEI if not already on file. Cost estimate. Pickup type selection                                                                  |
| **Active Repairs**             | List of in-progress jobs. Each card: Device name, current status chip, timeline progress bar. 'View RCA' button (available once technician submits - opens PDF/HTML view with option to download). 'Approve' button if additional damage approval is pending |
| **Repair Timeline (Detail)**   | Dynamic Domino's-style visual tracker. Statuses: Pickup Scheduled > Device Received > Diagnostic in Progress > Part Replaced > QA Testing > Ready for Delivery > Delivered. Real-time via Supabase WebSockets. Each step shows timestamp when completed      |
| **Approval Gateway**           | Push notification + in-app screen. Shows: additional issue found, photo evidence, updated quote. Two buttons: 'Approve & Continue' / 'Cancel Repair'                                                                                                         |
| **My Profile**                 | Edit name, number, email, address. View saved devices (model + IMEI). Total repairs count. Total amount spent. Active warranty timers per past repair                                                                                                        |
| **Repair History & RCA Vault** | All past repairs listed. Each entry: date, device, issue, cost paid. 'View RCA Report' button for each - opens the full Root Cause Analysis with pre/post repair photos, technician notes, warranty expiry                                                   |
| **E-Waste**                    | Same flow as website. Brand > Model > IMEI > Photo upload. Estimated value. Schedule pickup                                                                                                                                                                  |
| **Benefits & Wallet**          | Store credits earned from e-waste. Loyalty points (if implemented). Active offers                                                                                                                                                                            |
| **Notifications**              | Real-time alerts: status changes, approval requests, delivery OTP, post-repair follow-up message                                                                                                                                                             |

## **3.5 Key Customer Workflows**

### **Repair Booking Flow**

- Customer opens app or website
- Selects brand > model (or admin has pre-added model list; can also type custom)
- Selects issue from list or types 'Custom / Other'
- If device model/IMEI not on file: system prompts to enter these before continuing
- System shows estimated cost range from admin pricing table
- Customer selects: Store Drop-off or Home Pickup
- If Home Pickup: address auto-fills from profile, GPS button available for live location, time slot selected
- Booking confirmed - Job card created in system - Customer sees booking ID and initial timeline

### **E-Waste Submission Flow**

- Customer selects brand > model (same admin-editable list)
- Enters IMEI number
- Uploads up to 5 photos of device condition
- System displays estimated cash value or store credit
- Customer locks in value and schedules pickup
- Admin reviews and confirms or adjusts valuation

**🛠️ ROLE 2: Technician (Shop Floor PWA)**

## **4.1 Overview**

The technician accesses a stripped-down, efficiency-focused Progressive Web App designed for use on a shop tablet. The UI removes all marketing elements and focuses entirely on job queue management, diagnostics, and reporting. The technician's key responsibility is to update job statuses and submit mandatory Root Cause Analysis (RCA) reports.

## **4.2 Important: Status Update Rules**

Technicians can update repair statuses through the following progression only:

- Device Received - confirmed on arrival at shop (set by admin or technician)
- Diagnostic in Progress - technician begins assessment
- Parts Ordered - if a part is not in stock (triggers inventory note to admin)
- Repair in Progress - active work underway
- QA Testing - mandatory checklist must be completed before this status is available
- Repair Complete - triggers admin notification; admin then assigns delivery

**The technician CANNOT set status to 'Out for Delivery' or 'Delivered'. These are admin and delivery boy actions respectively.**

## **4.3 Technician PWA Screens**

| **Page / Screen**            | **Key Features & Content**                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Login**                    | Phone/email + password login. Role: Technician. Redirects to Job Queue on success                                                                                                                                                                                                                                                          |
| **Job Queue (Kanban)**       | Columns: Received \| In Diagnostic \| In Repair \| QA \| Complete. Cards show: device, customer name, SLA timer (48hr countdown), urgency color (green/yellow/red). Drag or tap to update status within allowed progression                                                                                                                |
| **Job Detail View**          | Full job card: customer name, device model, IMEI, reported issue, pickup notes. Photo timeline (customer-submitted + runner intake photos). Current status chip. Action buttons based on current status                                                                                                                                    |
| **RCA Generator**            | Triggered when technician moves job to 'Repair Complete'. Quick-tap diagnostic checklist (e.g. 'Screen damaged - Physical', 'Water ingress - Port area'). Camera integration: snap pre/post repair photos directly. Voice-to-text notes field. Formatted RCA is generated and submitted to admin for review before being shown to customer |
| **Part Requisition**         | In job detail: 'Request Part' button. Select part from inventory list. Quantity. Confirm deduction from local shop inventory. Cost auto-logged against this job card                                                                                                                                                                       |
| **QA Checklist**             | Mandatory before 'Repair Complete' status. Checkbox list: FaceID / Touch ID functional, Screen TrueTone active, Front & rear cameras focus, Charging port accepts power, Speakers & mic tested, No new physical damage. Cannot mark complete unless all checked                                                                            |
| **My Schedule / Attendance** | View today's assigned jobs. Attendance auto-logged at first job open per day (or manual check-in button). Visible to admin                                                                                                                                                                                                                 |
| **Notifications**            | New job assigned by admin, approval granted by customer, low stock alert for parts they requested                                                                                                                                                                                                                                          |

## **4.4 Key Technician Workflows**

### **Standard Repair Workflow**

- Admin assigns job to technician - appears in technician's Kanban queue
- Technician opens job, reviews reported issue and customer intake photos
- Moves job to 'Diagnostic in Progress'
- If additional damage found: technician raises an Approval Request with photo and updated quote - repair PAUSES until customer approves via app
- Once approved (or if no additional damage): technician proceeds with repair
- If part needed: uses Part Requisition - deducts from shop inventory
- Completes repair - must complete QA checklist
- Fills in RCA Generator (checklist + photos + notes)
- Moves job to 'Repair Complete' - admin is notified
- Admin reviews RCA, approves and pushes it to customer's RCA Vault
- Admin assigns delivery boy for return to customer

**🛵 ROLE 3: Delivery Boy (Mobile PWA)**

## **5.1 Overview**

The delivery boy's PWA is a streamlined, action-focused interface built for use on a phone. Every screen is optimized for one-handed use while on the road. The delivery boy handles both pickup (collecting device from customer) and drop-off (returning repaired device to customer), with full OTP-based verification at both stages.

## **5.2 Delivery Boy PWA Screens**

| **Page / Screen**         | **Key Features & Content**                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**                 | Phone + PIN login. Role: Delivery. Loads today's manifest on login                                                                                                                                                                                                                                                                                                                                                                       |
| **Today's Manifest**      | List of all pickups and drop-offs assigned for today. Each item: customer name, address, phone, job type (Pickup / Delivery), status chip. Organized geographically (closest first) for route efficiency. Nagpur zone-aware ordering                                                                                                                                                                                                     |
| **Job Detail - Pickup**   | Customer address, phone number, device details (brand, model). 'Navigate' button (opens phone's native maps). Intake checklist: snap photo of current device condition, confirm physical state checkboxes (e.g. 'Screen cracked', 'Does not power on'). Customer signs on runner's screen to confirm baseline condition. OTP sent to customer to confirm pickup - runner enters OTP in app to mark 'Picked Up'. Admin notified instantly |
| **Job Detail - Delivery** | Customer address. Repaired device details. UPI QR Code (auto-generated, linked to exact job card) displayed if payment pending. OTP: a 4-digit code is sent to customer's registered number/WhatsApp. Runner enters OTP after customer receives device. Status moves to 'Delivered'. Admin notified                                                                                                                                      |
| **OTP Screen**            | Large, focused input for 4-digit OTP. Resend option after 60 seconds. Fail-safe: if customer cannot receive OTP, runner contacts admin for manual override                                                                                                                                                                                                                                                                               |
| **Earnings / Summary**    | Today's completed pickups and deliveries. Total distance covered (approximate). Per-delivery payout if commission-based                                                                                                                                                                                                                                                                                                                  |
| **Notifications**         | New assignment from admin, customer ready for pickup confirmation, special instructions                                                                                                                                                                                                                                                                                                                                                  |

## **5.3 Key Delivery Workflows**

### **Device Pickup Flow**

- Admin assigns pickup to delivery boy - job appears in manifest
- Runner opens job detail, taps 'Navigate' to customer address
- On arrival: runner photographs device current condition
- Runner and customer go through intake checklist together
- Customer signs screen to confirm condition baseline
- App sends OTP to customer's WhatsApp / number
- Customer receives OTP, shares it with runner
- Runner enters OTP - status updates to 'Picked Up' - admin notified in real-time
- Runner transports device to shop

### **Repaired Device Delivery Flow**

- Admin marks job 'Out for Delivery' and assigns delivery boy
- Job appears in runner's manifest under 'Deliveries'
- If COD payment: runner opens UPI QR in app, customer scans and pays
- Payment confirmation received (Razorpay webhook)
- App sends 4-digit OTP to customer
- Customer shares OTP with runner after receiving phone
- Runner enters OTP - status updates to 'Delivered' - admin and customer notified

**👑 ROLE 4: Admin / Owner (Web Dashboard)**

## **6.1 Overview**

The admin dashboard is the operational nerve center of the entire platform. The owner/admin has read and write access to all entities across the system: jobs, staff, inventory, pricing, customers, and business analytics. The admin does NOT directly update repair statuses mid-repair - that is the technician's role. The admin's key actions are: assignment, oversight, inventory management, pricing control, and staff management.

## **6.2 Admin Status Update Privileges**

The admin can ONLY update a job to the following statuses (not intermediate repair statuses):

- Send Out for Delivery - triggered after technician marks 'Repair Complete'. Admin assigns delivery boy. This status is visible to the customer in their live timeline.
- Admin can also cancel a job or flag it for review.

**All intermediate statuses (Diagnostic, Parts, Repair, QA) are set exclusively by the technician.**

## **6.3 Admin Dashboard Screens**

| **Page / Screen**           | **Key Features & Content**                                                                                                                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command Center (Home)**   | Real-time KPI tiles: open jobs today, in-repair count, out for delivery, today's revenue collected, pending payments. Live feed of recent status changes. Alerts: low stock warnings, jobs past SLA, pending approval requests awaiting customer response                              |
| **All Jobs**                | Full table of all repair jobs (filterable by date, status, technician, device type). Columns: Job ID, Customer, Device, Status, Technician Assigned, Created Date, Est. Completion, Revenue. Click to open full job detail. Date filter: today / this week / this month / custom range |
| **Job Detail (Admin View)** | Full job info. Customer details. Device + IMEI. Technician assigned. Current status. RCA submitted by technician (admin reviews here and marks 'Published to Customer'). Payment status. Delivery assignment. Activity log (all status changes with timestamps)                        |
| **Assign Technician**       | On any job in 'Received' state: dropdown to assign to available technician. Assignment creates a notification to that technician                                                                                                                                                       |
| **Assign Delivery Boy**     | On jobs with status 'Repair Complete': see list of delivery boys (Free / Assigned). Select delivery boy. Enter customer delivery address (or confirm address from booking). Update job to 'Out for Delivery'. Customer is notified. Delivery boy receives manifest update              |
| **RCA Review & Publish**    | Queue of RCAs submitted by technicians. Admin opens each, reviews text, photos. Can request revision or approve. On approval: RCA is pushed to customer's RCA Vault and the 'View RCA' button becomes active in the customer's app                                                     |
| **Inventory Management**    | All parts listed: part name, SKU, quantity in stock, reorder threshold, cost price, linked repair types. Burn-rate graph per part. Low Stock Warnings flagged automatically. Admin can add new parts, update quantities, set reorder thresholds. Supplier contact notes per part       |
| **Pricing & Margins Table** | Master pricing config: repair type, part cost, labor cost, customer-facing price, margin %. Changes here instantly reflect in the customer-facing booking engine's cost estimate. E-waste payout rates also managed here                                                               |
| **Customer Management**     | All registered customers. Search by name/phone. Click to open: repair history, spend total, warranty timers, profile info. Bulk WhatsApp message capability (e.g. send a service campaign)                                                                                             |
| **Device Model Management** | Per brand: list of phone models offered for repair booking. Admin can add new models, rename, or remove. This list powers the brand > model dropdowns in the customer booking flow and e-waste portal                                                                                  |
| **Staff Management**        | List of all technicians and delivery boys. Each profile: name, phone, role, active/inactive. Edit daily/monthly salary. Attendance log view per employee                                                                                                                               |
| **Attendance & Payroll**    | Daily attendance view: who checked in, who is absent. Mark absent employees. Configure salary deduction rules for absences (flat amount or percentage). Monthly payroll summary per employee with deductions applied                                                                   |
| **Analytics & Reports**     | Revenue chart: daily / weekly / monthly / custom. Top repair types by volume. Average repair time. Customer retention rate. E-waste volume. Export reports as CSV/PDF                                                                                                                  |
| **Enquiries**               | Contact form submissions from website. Mark as read/resolved. Basic CRM view                                                                                                                                                                                                           |
| **48-Hour Follow-Up Queue** | Auto-generated queue: all jobs delivered 48 hours ago that haven't had a follow-up message sent. One-click to send WhatsApp template message: 'Is everything working perfectly?'                                                                                                       |
| **Shop Settings**           | Business name, address, contact info. Add/remove shop locations. Operating hours. Manage WhatsApp Business API token and Razorpay keys                                                                                                                                                 |

## **6.4 Key Admin Workflows**

### **New Booking Comes In**

- Booking created by customer (app/website) or manually by front desk
- Job appears in 'All Jobs' with status 'Pending Assignment'
- Admin assigns technician - technician notified
- If pickup: admin sees pickup request, assigns delivery boy for collection

### **Repair Completion & Dispatch**

- Technician marks 'Repair Complete' and submits RCA
- Admin receives notification - reviews RCA in 'RCA Review Queue'
- Admin approves RCA - pushed to customer's vault
- Admin opens job, sees 'Send Out for Delivery' button - assigns delivery boy from free/assigned list
- Job status set to 'Out for Delivery' - customer sees this in their timeline immediately
- Delivery boy gets the job in their manifest

### **Inventory Alert Handling**

- System detects part stock below reorder threshold
- Admin sees 'Low Stock' badge on dashboard and in inventory module
- Admin places order with supplier (outside system) and manually updates quantity when stock arrives
- Burn-rate charts help admin forecast next reorder date

# **7\. Core Data Models (Supabase / PostgreSQL)**

## **7.1 Key Tables**

| **Table**                | **Key Fields**                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **users**                | id, name, phone, email, address, role (customer/technician/delivery/admin), created_at                                                                                                                                              |
| **jobs**                 | id, customer_id, device_brand, device_model, imei, issue_type, custom_issue_text, status, pickup_type, pickup_address, pickup_lat, pickup_lng, assigned_technician_id, assigned_delivery_id, total_cost, payment_status, created_at |
| **job_status_log**       | id, job_id, status, changed_by_user_id, changed_at, notes                                                                                                                                                                           |
| **rca_reports**          | id, job_id, technician_id, checklist_json, notes, photos_before\[\], photos_after\[\], submitted_at, admin_approved, published_at                                                                                                   |
| **inventory_parts**      | id, part_name, sku, brand, model_compatibility\[\], qty_in_stock, reorder_threshold, cost_price, supplier_notes                                                                                                                     |
| **job_parts_used**       | id, job_id, part_id, quantity, cost_at_time                                                                                                                                                                                         |
| **device_models**        | id, brand, model_name, is_active                                                                                                                                                                                                    |
| **pricing**              | id, repair_type, part_cost, labor_cost, customer_price, ewaste_payout                                                                                                                                                               |
| **delivery_assignments** | id, job_id, delivery_boy_id, type (pickup/delivery), status, otp, otp_verified_at, intake_photos\[\], signature_data, assigned_at                                                                                                   |
| **attendance**           | id, staff_id, date, checked_in_at, is_absent, deduction_applied                                                                                                                                                                     |
| **ewaste_submissions**   | id, customer_id, brand, model, imei, photos\[\], estimated_value, status, created_at                                                                                                                                                |
| **enquiries**            | id, name, phone, message, source, is_resolved, created_at                                                                                                                                                                           |

# **8\. Notifications & Automation**

## **8.1 Triggered Notifications**

| **Trigger Event**                    | **Recipients**         | **Channel**                               |
| ------------------------------------ | ---------------------- | ----------------------------------------- |
| Booking confirmed                    | Customer               | Push notification + WhatsApp              |
| Pickup assigned                      | Customer, Delivery Boy | Push + WhatsApp (customer), Push (runner) |
| Device picked up (OTP verified)      | Customer, Admin        | Push + WhatsApp (customer)                |
| Diagnostic started                   | Customer               | Push + in-app timeline update             |
| Approval request (additional damage) | Customer               | Push + WhatsApp + in-app banner           |
| Repair complete - RCA submitted      | Admin                  | In-app notification                       |
| RCA published to customer            | Customer               | Push + WhatsApp                           |
| Out for delivery assigned            | Customer, Delivery Boy | Push + WhatsApp (customer), Push (runner) |
| Delivered (OTP verified)             | Customer, Admin        | Push + WhatsApp (customer)                |
| 48hr post-delivery follow-up         | Customer               | WhatsApp (automated)                      |
| Low stock warning                    | Admin                  | In-app dashboard alert                    |
| Part requisition submitted           | Admin                  | In-app notification                       |

# **9\. Phased Delivery Plan**

## **Phase 1 - Foundation (Weeks 1-6)**

- Supabase project setup: auth, schema, storage buckets, realtime channels
- Customer app: sign-up, device model selection, repair booking, basic timeline
- Admin dashboard: job list, assignment, device model management, pricing table
- Technician PWA: job queue, status updates, QA checklist
- Website: landing page with 3D scroll, booking flow, tracking page

## **Phase 2 - Core Operations (Weeks 7-12)**

- Delivery boy PWA: manifest, OTP-based pickup/delivery, intake checklist
- RCA generator: checklist + photo capture + voice-to-text + admin review flow
- Approval gateway: customer push notification + in-app approval screen
- Inventory management: part requisition, burn-rate tracking, low stock alerts
- WhatsApp Business API integration for OTP and notifications
- Razorpay UPI QR code generation for COD payments

## **Phase 3 - Intelligence & Polish (Weeks 13-18)**

- E-waste portal: full flow with IMEI, photo upload, valuation engine
- Attendance and payroll module with automated deductions
- Analytics dashboard: revenue charts, repair volume, customer retention
- 48-hour post-delivery automated WhatsApp follow-up queue
- GPS-based delivery route optimization (pending mapping provider decision)
- Customer benefits/loyalty wallet module
- Final QA, performance testing, production deployment

# **10\. Open Decisions & Assumptions**

| **Maps Provider**               | Phase 1 uses Browser Geolocation API only (GPS lat/lng). Google Maps or Mapbox integration for route optimization to be decided before Phase 3. |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **E-Waste Valuation**           | Phase 1 uses a static value table (admin-set prices per model). Dynamic market-rate API can be integrated in Phase 3.                           |
| **Multi-Shop Support**          | Architecture supports multiple shop locations. Phase 1 targets single shop; multi-shop inventory separation in Phase 2+.                        |
| **Offline Mode**                | Phase 1 requires connectivity. Offline-first PWA caching for technicians/runners to be considered for Phase 2.                                  |
| **Customer Loyalty Points**     | Schema includes benefits/wallet table. UI to be designed after core flows are stable.                                                           |
| **Admin Manual Override (OTP)** | If delivery OTP fails: admin can approve manual handover via dashboard. Logged with reason.                                                     |
| **AI RCA Formatting**           | Phase 1: technician fills checklist + notes directly. AI auto-formatting of notes into polished RCA can be a Phase 3 enhancement.               |

End of Document - RepairTech Platform Specification v2.0

For questions, contact the product team.