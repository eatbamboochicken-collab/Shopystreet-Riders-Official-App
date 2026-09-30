/**
 * Shopystreet Riders — Delivery Data Types & Interfaces
 * Source-independent generic delivery architecture
 */

export type DeliveryStatus =
  | 'created'
  | 'seeking_rider'
  | 'assigned'
  | 'heading_to_pickup'
  | 'arrived_pickup'
  | 'picked_up'
  | 'delivering'
  | 'arrived_destination'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export type SourceAppId = 'bamboo_select' | 'shopystreet_send' | 'long_live_harare' | string;

export interface LocationPoint {
  name: string;
  address: string;
  general_area: string; // e.g. "Harare CBD", "Avondale West" - safe to show before acceptance
  latitude: number;
  longitude: number;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
  instructions?: string;
}

export interface PackageSummary {
  description: string;
  items_count: number;
  is_food: boolean;
  is_fragile: boolean;
  special_handling?: string;
}

export interface AssignedRider {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'motorbike' | 'bicycle' | 'scooter';
  vehicle_reg: string;
  rating: number;
}

export interface DeliveryJob {
  job_id: string;
  source_app: SourceAppId;
  source_order_id: string;
  merchant_name: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  package_summary: PackageSummary;
  delivery_fee: number;
  rider_payout: number;
  platform_fee: number;
  distance_km: number;
  status: DeliveryStatus;
  assigned_rider: AssignedRider | null;
  created_at: string;
  accepted_at?: string;
  pickup_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  eta_minutes: number;
  latest_location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
    job_id?: string;
  };
  updated_at: string;
}

// Sanitized job presented to riders before claiming (protecting customer privacy)
export interface PublicDeliveryJobOffer {
  job_id: string;
  source_app: SourceAppId;
  source_order_id: string;
  merchant_name: string;
  pickup_area: string;
  pickup_name: string;
  dropoff_general_area: string; // ONLY general area, no private address or phone
  package_summary: PackageSummary;
  rider_payout: number;
  distance_km: number;
  eta_minutes: number;
  status: 'seeking_rider';
  created_at: string;
}

export type DeliveryEventType =
  | 'DELIVERY_CREATED'
  | 'RIDER_OFFERED'
  | 'RIDER_ASSIGNED'
  | 'RIDER_HEADING_TO_PICKUP'
  | 'RIDER_ARRIVED_PICKUP'
  | 'ORDER_PICKED_UP'
  | 'RIDER_EN_ROUTE'
  | 'RIDER_NEAR_DESTINATION'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryEvent {
  event_id: string;
  job_id: string;
  source_app: SourceAppId;
  source_order_id: string;
  event_type: DeliveryEventType;
  timestamp: string;
  data: {
    rider_id?: string;
    rider_name?: string;
    eta_minutes?: number;
    location?: {
      latitude: number;
      longitude: number;
    };
    note?: string;
    [key: string]: unknown;
  };
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: 'motorbike' | 'bicycle' | 'scooter';
  vehicle_reg: string;
  rating: number;
  is_online: boolean;
  avatar_url?: string;
  current_job_id?: string | null;
  battery_saver: boolean;
  active_zone: string;
}

export interface RiderNotification {
  id: string;
  job_id?: string;
  type: 'new_offer' | 'assigned' | 'cancelled' | 'status_update' | 'system' | 'payout';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface EarningsSummary {
  today_deliveries: number;
  today_earnings: number;
  week_deliveries: number;
  week_earnings: number;
  recent_payouts: Array<{
    job_id: string;
    source_app: SourceAppId;
    merchant_name: string;
    amount: number;
    completed_at: string;
    distance_km: number;
  }>;
}
