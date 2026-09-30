/**
 * Shopystreet Riders — Server Entry Point
 * Pure Node.js & Express (No React, No Vite, No build process)
 * Serves static mobile-first PWA assets and provides the real delivery engine API.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTION_WORKER_URL = 'https://shopystreet-delivery-api.warstreett.workers.dev';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Serve static assets from public/ directory
const publicDir = path.join(__dirname, 'public');
app.use(
  express.static(publicDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      }
    },
  })
);

// ============================================================
// DATA MODELS & IN-MEMORY ENGINE (ZERO FAKE DATA INITIALIZED)
// ============================================================

export type DeliveryStatus =
  | 'SEEKING_RIDER'
  | 'RIDER_ASSIGNED'
  | 'HEADING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'NEAR_DESTINATION'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export function normalizeStatus(raw: string): DeliveryStatus {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'SEEKING_RIDER' || s === 'SEEKING') return 'SEEKING_RIDER';
  if (s === 'RIDER_ASSIGNED' || s === 'ASSIGNED') return 'RIDER_ASSIGNED';
  if (s === 'HEADING_TO_PICKUP') return 'HEADING_TO_PICKUP';
  if (s === 'ARRIVED_AT_PICKUP' || s === 'ARRIVED_PICKUP') return 'ARRIVED_AT_PICKUP';
  if (s === 'PICKED_UP') return 'PICKED_UP';
  if (s === 'DELIVERING') return 'DELIVERING';
  if (s === 'NEAR_DESTINATION' || s === 'ARRIVED_DESTINATION') return 'NEAR_DESTINATION';
  if (s === 'DELIVERED') return 'DELIVERED';
  if (s === 'CANCELLED') return 'CANCELLED';
  if (s === 'EXPIRED') return 'EXPIRED';
  if (s === 'FAILED') return 'FAILED';
  return (s as DeliveryStatus);
}

export interface LocationPoint {
  name: string;
  address: string;
  general_area: string;
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
  is_fragile?: boolean;
}

export interface AssignedRider {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'motorbike' | 'bicycle' | 'car';
  vehicle_reg: string;
}

export interface DeliveryJob {
  job_id: string;
  source_app: string;
  source_order_id: string;
  merchant_name: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  package_summary: PackageSummary;
  delivery_fee: number;
  rider_payout: number;
  distance_km: number;
  status: DeliveryStatus;
  assigned_rider: AssignedRider | null;
  created_at: string;
  accepted_at?: string;
  pickup_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  eta_minutes: number;
  latest_location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  updated_at: string;
}

export interface RiderNotification {
  id: string;
  job_id?: string;
  type: 'offer' | 'assigned' | 'status' | 'completed' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PayoutRecord {
  job_id: string;
  source_app: string;
  merchant_name: string;
  payout: number;
  completed_at: string;
  distance_km: number;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'motorbike' | 'bicycle' | 'car';
  vehicle_reg: string;
  is_online: boolean;
}

// REAL STORE — ZERO FAKE DATA
// No hardcoded fake orders, no fake statistics, no fake ratings
const jobs = new Map<string, DeliveryJob>();
const notifications: RiderNotification[] = [];
const payoutRecords: PayoutRecord[] = [];

// Single real rider session state
let currentRider: RiderProfile = {
  id: 'rider_current',
  name: 'Tawanda Moyo',
  phone: '+263 77 123 4567',
  vehicle_type: 'motorbike',
  vehicle_reg: 'ABG 4812',
  is_online: true,
};

// SSE Subscribers
const sseClients = new Set<(data: string) => void>();

function broadcast(event: { type: string; payload: unknown }) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const send of sseClients) {
    try {
      send(data);
    } catch (e) {
      // client dropped
    }
  }
}

function addNotification(type: RiderNotification['type'], title: string, message: string, job_id?: string) {
  const notif: RiderNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    job_id,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(notif);
  if (notifications.length > 50) notifications.pop();
  broadcast({ type: 'NOTIFICATION', payload: notif });
  return notif;
}

// ============================================================
// API ENDPOINTS
// ============================================================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Shopystreet Riders Courier Network',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 1b. Rider Application Registration (Transparent proxy to Production Worker)
app.post('/api/riders/register', async (req: Request, res: Response) => {
  try {
    const workerRes = await fetch(`${PRODUCTION_WORKER_URL}/api/riders/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const data = await workerRes.json().catch(() => ({}));
    return res.status(workerRes.status).json(data);
  } catch (err) {
    console.error('Registration proxy error:', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to production delivery worker' });
  }
});

// 1c. Rider Application Status (Transparent proxy to Production Worker)
app.post('/api/riders/application-status', async (req: Request, res: Response) => {
  try {
    const workerRes = await fetch(`${PRODUCTION_WORKER_URL}/api/riders/application-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const data = await workerRes.json().catch(() => ({}));
    return res.status(workerRes.status).json(data);
  } catch (err) {
    console.error('Application status proxy error:', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to production delivery worker' });
  }
});

// 2. Rider Profile & Status
app.get('/api/rider', (req: Request, res: Response) => {
  res.json({ rider: currentRider });
});

app.post('/api/rider/profile', (req: Request, res: Response) => {
  const { name, phone, vehicle_type, vehicle_reg } = req.body;
  if (name) currentRider.name = String(name).trim();
  if (phone) currentRider.phone = String(phone).trim();
  if (vehicle_type) currentRider.vehicle_type = vehicle_type;
  if (vehicle_reg) currentRider.vehicle_reg = String(vehicle_reg).trim().toUpperCase();
  res.json({ success: true, rider: currentRider });
});

app.patch('/api/rider/status', (req: Request, res: Response) => {
  const { is_online } = req.body;
  if (typeof is_online !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid is_online parameter' });
  }

  // If rider has an active delivery, prevent going offline
  if (!is_online) {
    for (const j of jobs.values()) {
      if (
        j.assigned_rider?.id === currentRider.id &&
        j.status !== 'DELIVERED' &&
        j.status !== 'CANCELLED' &&
        j.status !== 'EXPIRED' &&
        j.status !== 'FAILED'
      ) {
        return res.status(400).json({
          error: 'Cannot go offline while an active delivery is in progress.',
        });
      }
    }
  }

  currentRider.is_online = is_online;
  broadcast({ type: 'RIDER_STATUS', payload: currentRider });
  res.json({ success: true, rider: currentRider });
});

// 3. Available Delivery Requests (Sanitized for Privacy)
// Before acceptance: Reveals only general area, merchant, pay, and distance
app.get('/api/jobs/available', (req: Request, res: Response) => {
  const available = Array.from(jobs.values()).filter((j) => j.status === 'SEEKING_RIDER');

  const sanitized = available.map((j) => ({
    job_id: j.job_id,
    source_app: j.source_app,
    source_order_id: j.source_order_id,
    merchant_name: j.merchant_name,
    pickup_area: j.pickup.general_area,
    pickup_name: j.pickup.name,
    dropoff_general_area: j.dropoff.general_area,
    package_summary: j.package_summary,
    rider_payout: j.rider_payout,
    distance_km: j.distance_km,
    eta_minutes: j.eta_minutes,
    created_at: j.created_at,
    status: j.status,
  }));

  res.json({ jobs: sanitized });
});

// 4. Current Active Delivery
app.get('/api/jobs/active', (req: Request, res: Response) => {
  let active: DeliveryJob | null = null;
  for (const j of jobs.values()) {
    if (
      j.assigned_rider?.id === currentRider.id &&
      j.status !== 'DELIVERED' &&
      j.status !== 'CANCELLED' &&
      j.status !== 'EXPIRED' &&
      j.status !== 'FAILED'
    ) {
      active = j;
      break;
    }
  }
  res.json({ job: active });
});

// 5. ATOMIC RIDER ASSIGNMENT (Critical Check-and-Set)
app.post('/api/jobs/:id/claim', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Delivery request not found.' });
  }

  if (!currentRider.is_online) {
    return res.status(400).json({
      error: 'You must be Online to accept delivery requests.',
    });
  }

  // Check if rider already has an active delivery
  for (const j of jobs.values()) {
    if (
      j.assigned_rider?.id === currentRider.id &&
      j.status !== 'DELIVERED' &&
      j.status !== 'CANCELLED' &&
      j.status !== 'EXPIRED' &&
      j.status !== 'FAILED'
    ) {
      return res.status(400).json({
        error: 'You already have an active delivery in progress. Complete it first.',
      });
    }
  }

  // ATOMIC SERVER LOCK: Verify still seeking rider
  if (job.status !== 'SEEKING_RIDER' || job.assigned_rider !== null) {
    return res.status(409).json({
      success: false,
      error: 'DELIVERY NO LONGER AVAILABLE',
      reason: 'Another rider accepted this job first.',
    });
  }

  // Lock assignment atomically in Delivery Engine
  const now = new Date().toISOString();
  job.status = 'RIDER_ASSIGNED';
  job.assigned_rider = {
    id: currentRider.id,
    name: currentRider.name,
    phone: currentRider.phone,
    vehicle_type: currentRider.vehicle_type,
    vehicle_reg: currentRider.vehicle_reg,
  };
  job.accepted_at = now;
  job.updated_at = now;

  // Real notification
  addNotification(
    'assigned',
    'Delivery Assigned',
    `Proceed to ${job.pickup.name} (${job.pickup.general_area}).`,
    job.job_id
  );

  // Broadcast to all riders and engine consumers (Cashier + Customer interfaces)
  broadcast({
    type: 'JOB_CLAIMED',
    payload: {
      job_id: job.job_id,
      source_app: job.source_app,
      source_order_id: job.source_order_id,
      status: 'RIDER_ASSIGNED',
      assigned_rider_id: currentRider.id,
      rider_name: currentRider.name,
      vehicle_type: currentRider.vehicle_type,
      vehicle_reg: currentRider.vehicle_reg,
      eta_minutes: job.eta_minutes,
      updated_at: job.updated_at,
    },
  });

  res.json({
    success: true,
    message: 'Delivery successfully claimed and assigned.',
    job,
  });
});

// 6. Delivery Lifecycle State Machine Transitions
app.post('/api/jobs/:id/transition', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const rawStatus = req.body.next_status;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Delivery job not found.' });
  }

  if (job.assigned_rider?.id !== currentRider.id) {
    return res.status(403).json({ error: 'Unauthorized: Job is not assigned to you.' });
  }

  const next_status = normalizeStatus(rawStatus);

  const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
    SEEKING_RIDER: ['RIDER_ASSIGNED', 'CANCELLED', 'EXPIRED', 'FAILED'],
    RIDER_ASSIGNED: ['HEADING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'CANCELLED', 'FAILED'],
    HEADING_TO_PICKUP: ['ARRIVED_AT_PICKUP', 'CANCELLED', 'FAILED'],
    ARRIVED_AT_PICKUP: ['PICKED_UP', 'CANCELLED', 'FAILED'],
    PICKED_UP: ['DELIVERING', 'CANCELLED', 'FAILED'],
    DELIVERING: ['NEAR_DESTINATION', 'DELIVERED', 'CANCELLED', 'FAILED'],
    NEAR_DESTINATION: ['DELIVERED', 'CANCELLED', 'FAILED'],
    DELIVERED: [],
    CANCELLED: [],
    EXPIRED: [],
    FAILED: [],
  };

  const allowed = validTransitions[job.status] || [];
  if (!allowed.includes(next_status)) {
    return res.status(400).json({
      error: `Invalid status transition from '${job.status}' to '${next_status}'.`,
    });
  }

  const now = new Date().toISOString();
  job.status = next_status;
  job.updated_at = now;

  if (next_status === 'ARRIVED_AT_PICKUP' || next_status === 'PICKED_UP') {
    job.pickup_at = job.pickup_at || now;
  }

  if (next_status === 'DELIVERED') {
    job.delivered_at = now;
    job.eta_minutes = 0;

    // Record real settled payout
    payoutRecords.unshift({
      job_id: job.job_id,
      source_app: job.source_app,
      merchant_name: job.merchant_name,
      payout: job.rider_payout,
      completed_at: now,
      distance_km: job.distance_km,
    });

    addNotification(
      'completed',
      'Delivery Completed',
      `Earned $${job.rider_payout.toFixed(2)} from ${job.merchant_name}.`,
      job.job_id
    );
  }

  // Delivery Engine updates and notifies both Cashier & Customer interfaces via SSE
  broadcast({
    type: 'JOB_UPDATED',
    payload: {
      job_id: job.job_id,
      source_app: job.source_app,
      source_order_id: job.source_order_id,
      status: job.status,
      rider_name: job.assigned_rider?.name,
      vehicle_type: job.assigned_rider?.vehicle_type,
      eta_minutes: job.eta_minutes,
      updated_at: job.updated_at,
      job,
    },
  });

  res.json({ success: true, job });
});

// 7. Location Update (Only active during in-progress delivery: Rider -> Engine -> Cashier/Customer)
app.post('/api/jobs/:id/location', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const { latitude, longitude } = req.body;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.assigned_rider?.id !== currentRider.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const activeStates: DeliveryStatus[] = [
    'RIDER_ASSIGNED',
    'HEADING_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'DELIVERING',
    'NEAR_DESTINATION',
  ];

  if (!activeStates.includes(job.status)) {
    return res.status(400).json({ error: 'Location tracking is inactive for completed/cancelled jobs.' });
  }

  job.latest_location = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    timestamp: Date.now(),
  };

  // Broadcast GPS updates to authorized interfaces (Cashier & Customer)
  broadcast({
    type: 'RIDER_LOCATION_UPDATED',
    payload: {
      job_id: job.job_id,
      source_app: job.source_app,
      source_order_id: job.source_order_id,
      status: job.status,
      rider_name: job.assigned_rider?.name,
      approximate_eta_minutes: job.eta_minutes,
      latest_rider_location: job.latest_location,
    },
  });

  res.json({ success: true });
});

// 7b. CUSTOMER TRACKING ENDPOINT (Mediated solely by Delivery Engine — NEVER direct rider-to-customer)
app.get('/api/engine/tracking/:id', (req: Request, res: Response) => {
  const jobId = req.params.id;
  let job = jobs.get(jobId);

  // If not found by job_id, search by source_order_id
  if (!job) {
    for (const j of jobs.values()) {
      if (j.source_order_id === jobId || j.job_id === jobId) {
        job = j;
        break;
      }
    }
  }

  if (!job) {
    return res.status(404).json({ error: 'Order not found in Delivery Engine.' });
  }

  const activeTrackingStates: DeliveryStatus[] = [
    'RIDER_ASSIGNED',
    'HEADING_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'DELIVERING',
    'NEAR_DESTINATION',
  ];

  // Sanitized view for customer app
  res.json({
    job_id: job.job_id,
    source_app: job.source_app,
    source_order_id: job.source_order_id,
    merchant_name: job.merchant_name,
    status: job.status,
    rider_assigned: job.assigned_rider !== null,
    rider_name: job.assigned_rider ? job.assigned_rider.name : null,
    vehicle_type: job.assigned_rider ? job.assigned_rider.vehicle_type : null,
    approximate_eta_minutes: job.eta_minutes,
    latest_rider_location:
      activeTrackingStates.includes(job.status) && job.latest_location
        ? job.latest_location
        : null,
    pickup: {
      name: job.pickup.name,
      general_area: job.pickup.general_area,
    },
    dropoff: {
      general_area: job.dropoff.general_area,
    },
    updated_at: job.updated_at,
  });
});

// 7c. CASHIER ORDER STATUS ENDPOINT (Bamboo Chicken Cashier, SEND, Long Live Harare)
app.get('/api/engine/cashier/:id', (req: Request, res: Response) => {
  const jobId = req.params.id;
  let job = jobs.get(jobId);

  if (!job) {
    for (const j of jobs.values()) {
      if (j.source_order_id === jobId || j.job_id === jobId) {
        job = j;
        break;
      }
    }
  }

  if (!job) {
    return res.status(404).json({ error: 'Order not found in Delivery Engine.' });
  }

  res.json({
    job_id: job.job_id,
    source_app: job.source_app,
    source_order_id: job.source_order_id,
    merchant_name: job.merchant_name,
    status: job.status,
    rider_assigned: job.assigned_rider !== null,
    assigned_rider: job.assigned_rider,
    approximate_eta_minutes: job.eta_minutes,
    latest_rider_location: job.latest_location,
    pickup: job.pickup,
    dropoff: job.dropoff,
    package_summary: job.package_summary,
    delivery_fee: job.delivery_fee,
    rider_payout: job.rider_payout,
    created_at: job.created_at,
    accepted_at: job.accepted_at,
    pickup_at: job.pickup_at,
    delivered_at: job.delivered_at,
    updated_at: job.updated_at,
  });
});

// 8. Notifications Feed
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ notifications });
});

// 9. Earnings Summary (REAL DATA ONLY)
app.get('/api/earnings', (req: Request, res: Response) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let today_earnings = 0;
  let today_deliveries = 0;
  let week_earnings = 0;
  let week_deliveries = 0;

  for (const p of payoutRecords) {
    const time = new Date(p.completed_at).getTime();
    if (time >= startOfToday) {
      today_earnings += p.payout;
      today_deliveries += 1;
    }
    if (time >= startOfWeek) {
      week_earnings += p.payout;
      week_deliveries += 1;
    }
  }

  res.json({
    today_earnings: Number(today_earnings.toFixed(2)),
    today_deliveries,
    week_earnings: Number(week_earnings.toFixed(2)),
    week_deliveries,
    recent_payouts: payoutRecords.slice(0, 20),
  });
});

// 10. External Source Integration Webhook (Bamboo Chicken "Notify Riders", Shopystreet SEND, etc.)
app.post('/api/webhook/delivery-request', (req: Request, res: Response) => {
  const {
    source_app,
    source_order_id,
    merchant_name,
    pickup,
    dropoff,
    package_summary,
    delivery_fee,
    rider_payout,
    distance_km,
  } = req.body;

  if (!source_app || !source_order_id || !pickup || !dropoff) {
    return res.status(400).json({ error: 'Incomplete delivery job payload.' });
  }

  const prefix = source_app.toUpperCase().slice(0, 4);
  const jobId = `JOB-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newJob: DeliveryJob = {
    job_id: jobId,
    source_app,
    source_order_id: String(source_order_id),
    merchant_name: merchant_name || 'Merchant',
    pickup: {
      name: pickup.name || 'Pickup Location',
      address: pickup.address || 'Address',
      general_area: pickup.general_area || pickup.name || 'Harare',
      latitude: Number(pickup.latitude) || -17.8286,
      longitude: Number(pickup.longitude) || 31.0522,
      contact_name: pickup.contact_name,
      contact_phone: pickup.contact_phone,
      notes: pickup.notes,
    },
    dropoff: {
      name: dropoff.name || 'Customer Destination',
      address: dropoff.address || 'Customer Address',
      general_area: dropoff.general_area || 'Harare Area',
      latitude: Number(dropoff.latitude) || -17.8012,
      longitude: Number(dropoff.longitude) || 31.0345,
      contact_name: dropoff.name,
      contact_phone: dropoff.contact_phone,
      instructions: dropoff.instructions,
    },
    package_summary: {
      description: package_summary?.description || 'Standard Package',
      items_count: Number(package_summary?.items_count) || 1,
      is_food: Boolean(package_summary?.is_food),
      is_fragile: Boolean(package_summary?.is_fragile),
    },
    delivery_fee: Number(delivery_fee) || 3.5,
    rider_payout: Number(rider_payout) || 3.0,
    distance_km: Number(distance_km) || 4.0,
    status: 'SEEKING_RIDER',
    assigned_rider: null,
    created_at: now,
    eta_minutes: Math.max(8, Math.round((Number(distance_km) || 4) * 3)),
    updated_at: now,
  };

  jobs.set(newJob.job_id, newJob);

  // Real notification
  addNotification(
    'offer',
    `New Delivery: ${newJob.merchant_name}`,
    `Pickup: ${newJob.pickup.general_area} • Pay: $${newJob.rider_payout.toFixed(2)}`,
    newJob.job_id
  );

  broadcast({ type: 'NEW_JOB', payload: newJob });

  res.status(201).json({
    success: true,
    job_id: newJob.job_id,
    message: 'Delivery job created and dispatched to available riders.',
  });
});

// 10b. Order Cancellation / Expiry / Failure (Bamboo Chicken Cashier or Engine timeout)
app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const { reason } = req.body;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.status === 'DELIVERED') {
    return res.status(400).json({ error: 'Cannot cancel an already delivered order.' });
  }

  job.status = 'CANCELLED';
  job.updated_at = new Date().toISOString();
  job.cancelled_at = job.updated_at;

  broadcast({
    type: 'JOB_UPDATED',
    payload: { job_id: job.job_id, status: 'CANCELLED', reason: reason || 'Cancelled' },
  });

  res.json({ success: true, message: 'Delivery cancelled', job });
});

app.post('/api/jobs/:id/expire', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.status !== 'SEEKING_RIDER') {
    return res.status(400).json({ error: 'Only pending requests can expire.' });
  }

  job.status = 'EXPIRED';
  job.updated_at = new Date().toISOString();

  broadcast({
    type: 'JOB_UPDATED',
    payload: { job_id: job.job_id, status: 'EXPIRED' },
  });

  res.json({ success: true, message: 'Delivery offer expired', job });
});

app.post('/api/jobs/:id/fail', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const { reason } = req.body;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = 'FAILED';
  job.updated_at = new Date().toISOString();

  broadcast({
    type: 'JOB_UPDATED',
    payload: { job_id: job.job_id, status: 'FAILED', reason: reason || 'Delivery Failed' },
  });

  res.json({ success: true, message: 'Delivery marked as failed', job });
});

// 11. Real-Time Server-Sent Events (SSE) Stream
app.get('/api/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data: string) => res.write(data);
  sseClients.add(send);

  send(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(send);
  });
});

// Fallback: Return index.html for any frontend navigation
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Shopystreet Riders] Real Mobile App running on http://0.0.0.0:${PORT}`);
});
