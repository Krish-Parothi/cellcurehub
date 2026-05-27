export type UserRole = 'customer' | 'technician' | 'delivery' | 'admin' | 'shop_admin';

export type RepairStatus =
  | 'booked'
  | 'pickup_scheduled'
  | 'device_received'
  | 'diagnostic'
  | 'repair_in_progress'
  | 'qa_testing'
  | 'ready'
  | 'done'
  | 'pending_approval'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PickupType = 'home' | 'store';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type EwasteStatus = 'pending' | 'valued' | 'picked_up' | 'credited';
export type DeviceCategory = 'smartphone' | 'laptop' | 'tablet';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type EwasteCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'dead' | 'powers_off';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  firebase_uid: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  shop_id: string | null;
  is_active: boolean;
}

export interface Device {
  id: string;
  brand: string;
  model_name: string;
  category: DeviceCategory;
  is_active: boolean;
}

export interface Repair {
  id: string;
  customer_id: string;
  device_id: string | null;
  technician_id: string | null;
  issue_description: string;
  status: RepairStatus;
  estimated_cost: number | null;
  final_cost: number | null;
  pickup_type: PickupType;
  address: string | null;
  created_at: string;
  updated_at: string;
  repair_type: string | null;
  custom_repair_description: string | null;
  imei_number: string | null;
  manual_model: string | null;
  coordinates: string | null; // Postgres point type as string "(lng,lat)"
  preferred_date: string | null;
  time_slot: TimeSlot | null;
  shop_id: string | null;
  approval_status: ApprovalStatus | null;
  approval_photo_url: string | null;
  approval_note: string | null;
  delivered_at: string | null;
  follow_up_sent: boolean;
  device?: Device;
  customer?: User;
  technician?: User;
}

export interface RepairTimelineEntry {
  id: string;
  repair_id: string;
  status: RepairStatus;
  note: string | null;
  photo_url: string | null;
  updated_by: string | null;
  created_at: string;
}

export interface Part {
  id: string;
  name: string;
  brand: string;
  model_compatible: string;
  quantity_in_stock: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  shop_id: string | null;
  updated_at: string;
}

export interface PartUsed {
  id: string;
  repair_id: string;
  part_id: string;
  quantity: number;
  cost_at_time: number;
  part?: Part;
}

export interface Invoice {
  id: string;
  repair_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  upi_qr_url: string | null;
  created_at: string;
  merchant_upi_id: string | null;
}

export interface Ewaste {
  id: string;
  customer_id: string;
  device_description: string;
  photos_url: string | null;
  estimated_value: number | null;
  status: EwasteStatus;
  created_at: string;
  device_id: string | null;
  imei_number: string | null;
  condition: EwasteCondition | null;
  condition_description: string | null;
  quoted_value: number | null;
  payout_method: string | null;
}

export interface Review {
  id: string;
  repair_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer?: User;
}

export interface RcaReport {
  id: string;
  repair_id: string;
  technician_id: string;
  diagnostic_checklist: Record<string, boolean | string>;
  technician_notes: string | null;
  before_photos: string[];
  after_photos: string[];
  admin_confirmed: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pricing {
  id: string;
  device_id: string | null;
  repair_type: string;
  min_price: number;
  max_price: number;
  updated_at: string;
}

export interface EwastePayoutRate {
  id: string;
  brand: string;
  model_id: string | null;
  cash_min: number;
  cash_max: number;
  credit_min: number;
  credit_max: number;
}

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  booked: 'Booked',
  pickup_scheduled: 'Pickup Scheduled',
  device_received: 'Device Received',
  diagnostic: 'Diagnostic',
  repair_in_progress: 'Repair In Progress',
  qa_testing: 'QA Testing',
  ready: 'Ready for Delivery',
  done: 'Done',
  pending_approval: 'Pending Approval',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const REPAIR_STATUS_ORDER: RepairStatus[] = [
  'booked',
  'pickup_scheduled',
  'device_received',
  'diagnostic',
  'repair_in_progress',
  'qa_testing',
  'ready',
  'out_for_delivery',
  'delivered',
];

export const NAGPUR_AREAS = [
  'Dharampeth',
  'Sitabuldi',
  'Wardha Road',
  'Civil Lines',
  'Sadar',
  'Mahal',
  'Itwari',
  'Hingna',
  'Kalamna',
  'Manewada',
  'Besanwadi',
  'Pratap Nagar',
  'Laxmi Nagar',
  'Gitti Khadan',
  'Kamptee Road',
  'Koradi',
  'Wadi',
  'Jaripatka',
  'Gandhibagh',
  'Mominpura',
];

export const REPAIR_TYPE_OPTIONS = [
  { value: 'screen_replacement', label: 'Screen Replacement' },
  { value: 'battery_replacement', label: 'Battery Replacement' },
  { value: 'charging_port', label: 'Charging Port Repair' },
  { value: 'water_damage', label: 'Water Damage Treatment' },
  { value: 'software_issue', label: 'Software Issue' },
  { value: 'custom', label: 'Custom / Other' },
] as const;

export const DEVICE_BRANDS = [
  'Apple',
  'Samsung',
  'OnePlus',
  'Xiaomi',
  'Vivo',
  'Realme',
  'Google Pixel',
  'Motorola',
  'Dell',
  'HP',
  'Lenovo',
  'Asus',
] as const;

export const EWASTE_CONDITIONS: { value: EwasteCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'dead', label: 'Dead' },
  { value: 'powers_off', label: 'Powers Off' },
];

export const DIAGNOSTIC_CHECKLIST_ITEMS = [
  { key: 'power_boot', label: 'Power / Boot' },
  { key: 'display', label: 'Display & Brightness' },
  { key: 'touch_response', label: 'Touch Response' },
  { key: 'charging_port', label: 'Charging Port' },
  { key: 'speaker', label: 'Speaker' },
  { key: 'microphone', label: 'Microphone' },
  { key: 'front_camera', label: 'Front Camera' },
  { key: 'rear_camera', label: 'Rear Camera' },
  { key: 'volume_button', label: 'Volume Button' },
  { key: 'power_button', label: 'Power Button' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'sim_slot', label: 'SIM Slot' },
  { key: 'water_damage', label: 'Water/Liquid Damage Indicators' },
] as const;

export const QA_CHECKLIST_ITEMS = [
  { key: 'device_powers_on', label: 'Device powers on successfully' },
  { key: 'display_no_dead_pixels', label: 'Display — no dead pixels, correct brightness' },
  { key: 'touch_full_screen', label: 'Touch response — full screen responsive' },
  { key: 'charging_port_works', label: 'Charging port — cable accepted, charging confirmed' },
  { key: 'speaker_functional', label: 'Speaker functional' },
  { key: 'microphone_functional', label: 'Microphone functional' },
  { key: 'front_camera_focuses', label: 'Front camera focuses correctly' },
  { key: 'rear_camera_focuses', label: 'Rear camera focuses correctly' },
  { key: 'biometric_works', label: 'Face ID / Fingerprint sensor works (if applicable)' },
  { key: 'truetone_active', label: 'TrueTone / Display calibration active', appleOnly: true },
  { key: 'all_buttons_responding', label: 'All buttons (volume, power) responding' },
] as const;

export type DeliveryJobType = 'pickup' | 'dropoff';
export type DeliveryStatus = 'assigned' | 'in_transit' | 'picked_up' | 'at_store' | 'out_for_delivery' | 'delivered' | 'returned';

export interface DeliveryAssignment {
  id: string;
  repair_id: string;
  delivery_boy_id: string;
  shop_id: string | null;
  job_type: DeliveryJobType;
  status: DeliveryStatus;
  scheduled_date: string | null;
  special_instructions: string | null;
  intake_photos: string[] | null;
  intake_condition: Record<string, boolean | string> | null;
  customer_signature_url: string | null;
  pickup_otp: string | null;
  delivery_otp: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  repair?: Repair;
  invoice?: Invoice;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const INTAKE_CONDITION_CHECKS = [
  { key: 'screen_intact', label: 'Screen is intact' },
  { key: 'screen_cracked', label: 'Screen is cracked' },
  { key: 'device_powers_on', label: 'Device powers on' },
  { key: 'device_no_power', label: 'Device does not power on' },
  { key: 'visible_damage', label: 'Visible physical damage' },
  { key: 'accessories_included', label: 'Accessories included (charger/case)' },
] as const;

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: 'Assigned',
  in_transit: 'In Transit',
  picked_up: 'Picked Up',
  at_store: 'At Store',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  returned: 'Returned',
};

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ShopItem {
  id: string;
  shop_id: string;
  name: string;
  category: string | null;
  price: number;
  stock_qty: number;
  image_url: string | null;
  created_at: string;
}

export interface SalaryConfig {
  id: string;
  employee_id: string;
  shop_id: string | null;
  month: string; // first of month date
  base_salary: number;
  per_day_deduction: number;
  final_salary_override: number | null;
  created_at: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day';

export interface Attendance {
  id: string;
  employee_id: string;
  shop_id: string | null;
  date: string;
  status: AttendanceStatus;
}

export interface TechnicianDetails {
  id: string;
  user_id: string;
  aadhar_number: string;
  verified: boolean;
  created_at: string;
}
