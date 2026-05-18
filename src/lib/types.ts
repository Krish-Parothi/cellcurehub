export type UserRole = 'customer' | 'technician' | 'delivery' | 'admin';

export type RepairStatus =
  | 'booked'
  | 'pickup_scheduled'
  | 'device_received'
  | 'diagnostic'
  | 'repair_in_progress'
  | 'qa_testing'
  | 'ready'
  | 'delivered';

export type PickupType = 'home' | 'store';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type EwasteStatus = 'pending' | 'valued' | 'picked_up' | 'credited';
export type DeviceCategory = 'smartphone' | 'laptop' | 'tablet';

export interface User {
  id: string;
  firebase_uid: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Device {
  id: string;
  brand: string;
  model_name: string;
  category: DeviceCategory;
}

export interface Repair {
  id: string;
  customer_id: string;
  device_id: string;
  technician_id: string | null;
  issue_description: string;
  status: RepairStatus;
  estimated_cost: number | null;
  final_cost: number | null;
  pickup_type: PickupType;
  address: string | null;
  created_at: string;
  updated_at: string;
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
}

export interface Ewaste {
  id: string;
  customer_id: string;
  device_description: string;
  photos_url: string | null;
  estimated_value: number | null;
  status: EwasteStatus;
  created_at: string;
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

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  booked: 'Booked',
  pickup_scheduled: 'Pickup Scheduled',
  device_received: 'Device Received',
  diagnostic: 'Diagnostic',
  repair_in_progress: 'Repair In Progress',
  qa_testing: 'QA Testing',
  ready: 'Ready',
  delivered: 'Delivered',
};

export const REPAIR_STATUS_ORDER: RepairStatus[] = [
  'booked',
  'pickup_scheduled',
  'device_received',
  'diagnostic',
  'repair_in_progress',
  'qa_testing',
  'ready',
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
