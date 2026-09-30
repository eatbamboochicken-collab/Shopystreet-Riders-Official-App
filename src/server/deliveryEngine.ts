/**
 * Shopystreet Riders — Server-Side Core Delivery Engine
 *
 * Implements:
 * 1. Generic source-independent Delivery Job Model
 * 2. Strict Delivery State Machine
 * 3. Server-authoritative Atomic Rider Assignment (prevents double-booking)
 * 4. Controlled Location & ETA recalculation
 * 5. Event Model for external source integration (Bamboo Chicken, Shopystreet SEND, etc.)
 * 6. Privacy sanitization before job acceptance
 */

import {
  DeliveryJob,
  DeliveryStatus,
  DeliveryEvent,
  DeliveryEventType,
  PublicDeliveryJobOffer,
  RiderProfile,
  RiderNotification,
  SourceAppId,
  AssignedRider,
} from '../types/delivery.js';

class DeliveryEngine {
  private jobs: Map<string, DeliveryJob> = new Map();
  private events: DeliveryEvent[] = new Map<string, DeliveryEvent>().values() as unknown as DeliveryEvent[];
  private allEvents: DeliveryEvent[] = [];
  private notifications: RiderNotification[] = [];
  private riders: Map<string, RiderProfile> = new Map();
  private eventListeners: Set<(event: DeliveryEvent | { type: string; payload: unknown }) => void> = new Set();

  constructor() {
    this.seedRiders();
    this.seedInitialJobs();
  }

  // --- Seed Initial Data for Demonstration ---
  private seedRiders() {
    const defaultRiders: RiderProfile[] = [
      {
        id: 'rider_tawanda',
        name: 'Tawanda Moyo',
        phone: '+263 77 123 4567',
        email: 'tawanda@shopystreet.co.zw',
        vehicle_type: 'motorbike',
        vehicle_reg: 'ABG 4812',
        rating: 4.9,
        is_online: true,
        current_job_id: null,
        battery_saver: false,
        active_zone: 'Harare Central & Northern',
      },
      {
        id: 'rider_farai',
        name: 'Farai Chiwara',
        phone: '+263 71 987 6543',
        email: 'farai@shopystreet.co.zw',
        vehicle_type: 'motorbike',
        vehicle_reg: 'AEU 9031',
        rating: 4.8,
        is_online: true,
        current_job_id: null,
        battery_saver: true,
        active_zone: 'Harare CBD & East',
      },
      {
        id: 'rider_simba',
        name: 'Simba Nyathi',
        phone: '+263 78 456 7890',
        email: 'simba@shopystreet.co.zw',
        vehicle_type: 'bicycle',
        vehicle_reg: 'BYC-HAR-09',
        rating: 4.9,
        is_online: false,
        current_job_id: null,
        battery_saver: true,
        active_zone: 'Harare CBD & Avenues',
      },
    ];

    defaultRiders.forEach((r) => this.riders.set(r.id, r));
  }

  private seedInitialJobs() {
    // Initial Bamboo Chicken delivery job
    const bambooJob: DeliveryJob = {
      job_id: 'JOB-BC-8821',
      source_app: 'bamboo_select',
      source_order_id: 'BC-9482',
      merchant_name: 'Bamboo Chicken Select',
      pickup: {
        name: 'Bamboo Chicken — Central',
        address: '88 Kwame Nkrumah Ave, Harare CBD',
        general_area: 'Harare CBD',
        latitude: -17.8286,
        longitude: 31.0522,
        contact_name: 'Bamboo Cashier Dispatch',
        contact_phone: '+263 24 275 8899',
        notes: 'Order bagged and sealed at pickup counter.',
      },
      dropoff: {
        name: 'Tatenda Chitiyo',
        address: '14 Bath Road, Avondale West, Harare',
        general_area: 'Avondale West',
        latitude: -17.8012,
        longitude: 31.0345,
        contact_name: 'Tatenda',
        contact_phone: '+263 77 345 8812',
        instructions: 'White gate, ring intercom #3. Leave with security if gate locked.',
      },
      package_summary: {
        description: '2x 1/4 Chicken Meals + Spicy Fried Wings + 2L Drink',
        items_count: 3,
        is_food: true,
        is_fragile: false,
        special_handling: 'Keep upright in thermal delivery box',
      },
      delivery_fee: 3.5,
      rider_payout: 3.0,
      platform_fee: 0.5,
      distance_km: 4.2,
      status: 'seeking_rider',
      assigned_rider: null,
      created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      eta_minutes: 14,
      updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    };

    // Initial Shopystreet SEND delivery job
    const sendJob: DeliveryJob = {
      job_id: 'JOB-SEND-1093',
      source_app: 'shopystreet_send',
      source_order_id: 'SEND-881',
      merchant_name: 'Shopystreet SEND',
      pickup: {
        name: 'Eastlea Business Hub',
        address: '22 Samora Machel Ave East, Eastlea',
        general_area: 'Eastlea',
        latitude: -17.8241,
        longitude: 31.0789,
        contact_name: 'Farai Moyo (Sender)',
        contact_phone: '+263 77 654 3210',
        notes: 'Package is sealed in protective courier flyer.',
      },
      dropoff: {
        name: 'Kudzi Makoni',
        address: '55 Borrowdale Road, Borrowdale',
        general_area: 'Borrowdale',
        latitude: -17.7621,
        longitude: 31.0912,
        contact_name: 'Kudzi',
        contact_phone: '+263 71 888 9900',
        instructions: 'Deliver to main office reception desk.',
      },
      package_summary: {
        description: 'Express documents & contract folder (A4)',
        items_count: 1,
        is_food: false,
        is_fragile: true,
        special_handling: 'Do not bend or expose to rain',
      },
      delivery_fee: 5.0,
      rider_payout: 4.2,
      platform_fee: 0.8,
      distance_km: 7.4,
      status: 'seeking_rider',
      assigned_rider: null,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      eta_minutes: 22,
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    // Past completed job for realistic history & earnings
    const completedJob: DeliveryJob = {
      job_id: 'JOB-BC-8819',
      source_app: 'bamboo_select',
      source_order_id: 'BC-9477',
      merchant_name: 'Bamboo Chicken Select',
      pickup: {
        name: 'Bamboo Chicken — Central',
        address: '88 Kwame Nkrumah Ave, Harare CBD',
        general_area: 'Harare CBD',
        latitude: -17.8286,
        longitude: 31.0522,
      },
      dropoff: {
        name: 'Munya Sithole',
        address: '28 Fife Ave, Avenues, Harare',
        general_area: 'Avenues',
        latitude: -17.819,
        longitude: 31.051,
      },
      package_summary: {
        description: 'Family Feast + 6 Rolls',
        items_count: 2,
        is_food: true,
        is_fragile: false,
      },
      delivery_fee: 3.0,
      rider_payout: 2.75,
      platform_fee: 0.25,
      distance_km: 2.1,
      status: 'delivered',
      assigned_rider: {
        id: 'rider_tawanda',
        name: 'Tawanda Moyo',
        phone: '+263 77 123 4567',
        vehicle_type: 'motorbike',
        vehicle_reg: 'ABG 4812',
        rating: 4.9,
      },
      created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      accepted_at: new Date(Date.now() - 73 * 60 * 1000).toISOString(),
      pickup_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      delivered_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      eta_minutes: 0,
      updated_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    };

    this.jobs.set(bambooJob.job_id, bambooJob);
    this.jobs.set(sendJob.job_id, sendJob);
    this.jobs.set(completedJob.job_id, completedJob);

    // Initial event logs
    this.logEvent('DELIVERY_CREATED', bambooJob, { note: 'Order dispatched by Bamboo Chicken' });
    this.logEvent('DELIVERY_CREATED', sendJob, { note: 'Package dispatched by Shopystreet SEND' });
    this.logEvent('DELIVERED', completedJob, { note: 'Handed to customer successfully' });

    // Initial notification
    this.notifications.push({
      id: 'notif_init_1',
      job_id: bambooJob.job_id,
      type: 'new_offer',
      title: 'New Delivery: Bamboo Chicken',
      message: 'Pickup at Harare CBD • Drop-off Avondale West • $3.00 payout',
      timestamp: bambooJob.created_at,
      read: false,
    });
  }

  // --- Real-time Subscription ---
  public subscribe(callback: (event: DeliveryEvent | { type: string; payload: unknown }) => void) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private broadcast(payload: DeliveryEvent | { type: string; payload: unknown }) {
    for (const listener of this.eventListeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('Error broadcasting event:', err);
      }
    }
  }

  // --- Event Logger ---
  private logEvent(eventType: DeliveryEventType, job: DeliveryJob, data: Record<string, unknown> = {}) {
    const event: DeliveryEvent = {
      event_id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      job_id: job.job_id,
      source_app: job.source_app,
      source_order_id: job.source_order_id,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data: {
        rider_id: job.assigned_rider?.id,
        rider_name: job.assigned_rider?.name,
        eta_minutes: job.eta_minutes,
        location: job.latest_location
          ? { latitude: job.latest_location.latitude, longitude: job.latest_location.longitude }
          : undefined,
        ...data,
      },
    };

    this.allEvents.unshift(event);
    if (this.allEvents.length > 500) this.allEvents.pop();

    this.broadcast(event);
    return event;
  }

  // --- Notification Logger ---
  private addNotification(
    type: RiderNotification['type'],
    title: string,
    message: string,
    job_id?: string
  ) {
    const notif: RiderNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      job_id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(notif);
    if (this.notifications.length > 100) this.notifications.pop();
    this.broadcast({ type: 'NOTIFICATION', payload: notif });
    return notif;
  }

  // --- Read Operations ---
  public getAllJobs(): DeliveryJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getJob(id: string): DeliveryJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Returns sanitized public offers for available jobs.
   * STRICT PRIVACY: customer full name, street address, and phone number are hidden!
   */
  public getAvailableOffers(): PublicDeliveryJobOffer[] {
    const available = Array.from(this.jobs.values()).filter((j) => j.status === 'seeking_rider');

    return available.map((j) => ({
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
      status: 'seeking_rider',
      created_at: j.created_at,
    }));
  }

  public getRiderActiveJob(riderId: string): DeliveryJob | null {
    for (const job of this.jobs.values()) {
      if (
        job.assigned_rider?.id === riderId &&
        job.status !== 'delivered' &&
        job.status !== 'cancelled' &&
        job.status !== 'expired'
      ) {
        return job;
      }
    }
    return null;
  }

  public getRiders(): RiderProfile[] {
    return Array.from(this.riders.values());
  }

  public getRider(id: string): RiderProfile | undefined {
    return this.riders.get(id);
  }

  public getNotifications(): RiderNotification[] {
    return this.notifications;
  }

  public getEvents(source_app?: string, job_id?: string): DeliveryEvent[] {
    let filtered = this.allEvents;
    if (source_app) {
      filtered = filtered.filter((e) => e.source_app === source_app);
    }
    if (job_id) {
      filtered = filtered.filter((e) => e.job_id === job_id);
    }
    return filtered;
  }

  // --- Source App Creation (Bamboo Chicken, Shopystreet SEND, Long Live Harare) ---
  public createJobFromSource(params: {
    source_app: SourceAppId;
    source_order_id: string;
    merchant_name: string;
    pickup: {
      name: string;
      address: string;
      general_area: string;
      latitude: number;
      longitude: number;
      contact_name?: string;
      contact_phone?: string;
      notes?: string;
    };
    dropoff: {
      name: string;
      address: string;
      general_area: string;
      latitude: number;
      longitude: number;
      contact_name?: string;
      contact_phone?: string;
      instructions?: string;
    };
    package_summary: {
      description: string;
      items_count: number;
      is_food: boolean;
      is_fragile: boolean;
      special_handling?: string;
    };
    delivery_fee: number;
    rider_payout: number;
    distance_km: number;
    estimated_eta_minutes?: number;
  }): DeliveryJob {
    const job_id = `JOB-${params.source_app.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const job: DeliveryJob = {
      job_id,
      source_app: params.source_app,
      source_order_id: params.source_order_id,
      merchant_name: params.merchant_name,
      pickup: params.pickup,
      dropoff: params.dropoff,
      package_summary: params.package_summary,
      delivery_fee: params.delivery_fee,
      rider_payout: params.rider_payout,
      platform_fee: Number((params.delivery_fee - params.rider_payout).toFixed(2)),
      distance_km: params.distance_km,
      status: 'seeking_rider',
      assigned_rider: null,
      created_at: now,
      eta_minutes: params.estimated_eta_minutes || Math.max(10, Math.round(params.distance_km * 3)),
      updated_at: now,
    };

    this.jobs.set(job.job_id, job);

    this.logEvent('DELIVERY_CREATED', job, {
      note: `New job created from source ${job.source_app} (${job.merchant_name})`,
    });
    this.logEvent('RIDER_OFFERED', job, {
      note: 'Broadcasted to online riders in Harare network',
    });

    this.addNotification(
      'new_offer',
      `New Delivery: ${job.merchant_name}`,
      `Pickup: ${job.pickup.general_area} • Drop-off: ${job.dropoff.general_area} • Pay: $${job.rider_payout.toFixed(2)}`,
      job.job_id
    );

    this.broadcast({ type: 'JOB_CREATED', payload: job });
    return job;
  }

  // --- ATOMIC RIDER CLAIM IMPLEMENTATION ---
  /**
   * CRITICAL: Atomic check-and-set claim.
   * If two riders hit Accept simultaneously:
   * Rider 1 wins -> Assigned
   * Rider 2 gets 409 Conflict -> DELIVERY NO LONGER AVAILABLE
   */
  public claimJob(
    jobId: string,
    riderData: {
      rider_id: string;
      rider_name: string;
      rider_phone: string;
      vehicle_type: 'motorbike' | 'bicycle' | 'scooter';
      vehicle_reg: string;
    }
  ): {
    success: boolean;
    job?: DeliveryJob;
    error?: string;
    code?: 'NOT_FOUND' | 'ALREADY_CLAIMED' | 'RIDER_BUSY' | 'RIDER_OFFLINE';
  } {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        success: false,
        error: 'Job not found',
        code: 'NOT_FOUND',
      };
    }

    // Verify rider online
    const rider = this.riders.get(riderData.rider_id);
    if (rider && !rider.is_online) {
      return {
        success: false,
        error: 'Rider is currently offline. Turn status Online to accept jobs.',
        code: 'RIDER_OFFLINE',
      };
    }

    // Verify rider does not already have an unfinished delivery
    const existingJob = this.getRiderActiveJob(riderData.rider_id);
    if (existingJob && existingJob.job_id !== jobId) {
      return {
        success: false,
        error: `Rider already has an active delivery in progress (${existingJob.job_id}). Complete it first.`,
        code: 'RIDER_BUSY',
      };
    }

    // ATOMIC LOCK CHECK
    // If the job is NOT currently 'seeking_rider' or already has an assigned rider:
    if (job.status !== 'seeking_rider' || job.assigned_rider !== null) {
      return {
        success: false,
        error: 'DELIVERY NO LONGER AVAILABLE',
        code: 'ALREADY_CLAIMED',
      };
    }

    // ATOMIC ASSIGNMENT
    const assignedRider: AssignedRider = {
      id: riderData.rider_id,
      name: riderData.rider_name,
      phone: riderData.rider_phone,
      vehicle_type: riderData.vehicle_type,
      vehicle_reg: riderData.vehicle_reg,
      rating: rider ? rider.rating : 4.9,
    };

    const now = new Date().toISOString();
    job.status = 'assigned';
    job.assigned_rider = assignedRider;
    job.accepted_at = now;
    job.updated_at = now;

    // Update rider record
    if (rider) {
      rider.current_job_id = job.job_id;
    }

    // Log atomic events
    this.logEvent('RIDER_ASSIGNED', job, {
      rider_id: assignedRider.id,
      rider_name: assignedRider.name,
      assigned_at: now,
      eta_minutes: job.eta_minutes,
      note: `Job claimed atomically by ${assignedRider.name}. Source app ${job.source_app} informed.`,
    });

    // Notify assigned rider
    this.addNotification(
      'assigned',
      'Delivery Assigned',
      `You are assigned to ${job.merchant_name} (${job.pickup.general_area}). Proceed to pickup.`,
      job.job_id
    );

    // Broadcast claimed state to ALL riders immediately so other UIs drop or disable this job
    this.broadcast({
      type: 'JOB_CLAIMED',
      payload: {
        job_id: job.job_id,
        claimed_by_id: assignedRider.id,
        claimed_by_name: assignedRider.name,
      },
    });

    return {
      success: true,
      job,
    };
  }

  // --- DELIVERY STATE MACHINE TRANSITIONS ---
  public transitionState(
    jobId: string,
    riderId: string,
    nextStatus: DeliveryStatus,
    extraData?: { cancellation_reason?: string }
  ): {
    success: boolean;
    job?: DeliveryJob;
    error?: string;
  } {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    // Ownership check: only assigned rider or system can transition active jobs
    if (job.assigned_rider && job.assigned_rider.id !== riderId) {
      return {
        success: false,
        error: 'Unauthorized: This delivery is assigned to another rider.',
      };
    }

    // Valid forward state machine rules:
    // created -> seeking_rider
    // seeking_rider -> assigned (via claim)
    // assigned -> heading_to_pickup
    // heading_to_pickup -> arrived_pickup
    // arrived_pickup -> picked_up
    // picked_up -> delivering
    // delivering -> arrived_destination
    // arrived_destination -> delivered
    // Any active -> cancelled
    const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      created: ['seeking_rider', 'cancelled'],
      seeking_rider: ['assigned', 'cancelled', 'expired'],
      assigned: ['heading_to_pickup', 'arrived_pickup', 'cancelled'],
      heading_to_pickup: ['arrived_pickup', 'cancelled'],
      arrived_pickup: ['picked_up', 'cancelled'],
      picked_up: ['delivering', 'cancelled'],
      delivering: ['arrived_destination', 'delivered', 'cancelled'],
      arrived_destination: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
      expired: [],
    };

    const currentAllowed = allowedTransitions[job.status] || [];
    if (!currentAllowed.includes(nextStatus)) {
      return {
        success: false,
        error: `Invalid status transition: Cannot transition from '${job.status}' to '${nextStatus}'. Expected one of: ${currentAllowed.join(', ')}`,
      };
    }

    const now = new Date().toISOString();
    job.status = nextStatus;
    job.updated_at = now;

    let eventType: DeliveryEventType = 'RIDER_EN_ROUTE';

    if (nextStatus === 'heading_to_pickup') {
      eventType = 'RIDER_HEADING_TO_PICKUP';
    } else if (nextStatus === 'arrived_pickup') {
      eventType = 'RIDER_ARRIVED_PICKUP';
      job.pickup_at = now;
    } else if (nextStatus === 'picked_up') {
      eventType = 'ORDER_PICKED_UP';
      job.pickup_at = job.pickup_at || now;
    } else if (nextStatus === 'delivering') {
      eventType = 'RIDER_EN_ROUTE';
    } else if (nextStatus === 'arrived_destination') {
      eventType = 'RIDER_NEAR_DESTINATION';
    } else if (nextStatus === 'delivered') {
      eventType = 'DELIVERED';
      job.delivered_at = now;
      job.eta_minutes = 0;

      // Free rider current job
      const rider = this.riders.get(riderId);
      if (rider) {
        rider.current_job_id = null;
      }

      this.addNotification(
        'payout',
        'Delivery Complete! 💰',
        `Earned $${job.rider_payout.toFixed(2)} for ${job.merchant_name} delivery. Great job!`,
        job.job_id
      );
    } else if (nextStatus === 'cancelled') {
      eventType = 'CANCELLED';
      job.cancelled_at = now;
      job.cancellation_reason = extraData?.cancellation_reason || 'Cancelled by dispatcher/rider';

      const rider = this.riders.get(riderId);
      if (rider) {
        rider.current_job_id = null;
      }
    }

    this.logEvent(eventType, job, {
      rider_id: riderId,
      new_status: nextStatus,
      cancellation_reason: extraData?.cancellation_reason,
    });

    this.broadcast({ type: 'JOB_UPDATED', payload: job });
    return { success: true, job };
  }

  // --- LOCATION & ETA UPDATE ---
  public updateRiderLocation(
    jobId: string,
    riderId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    }
  ): {
    success: boolean;
    job?: DeliveryJob;
    error?: string;
  } {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.assigned_rider?.id !== riderId) {
      return { success: false, error: 'Rider is not assigned to this job.' };
    }

    // Only update during active delivery states
    const activeStates: DeliveryStatus[] = [
      'assigned',
      'heading_to_pickup',
      'arrived_pickup',
      'picked_up',
      'delivering',
      'arrived_destination',
    ];

    if (!activeStates.includes(job.status)) {
      return {
        success: false,
        error: `Location tracking stopped. Job is in '${job.status}' state.`,
      };
    }

    const now = Date.now();
    job.latest_location = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 10,
      timestamp: location.timestamp || now,
      job_id: jobId,
    };

    // Calculate approximate ETA based on target (pickup or dropoff)
    const target =
      job.status === 'assigned' || job.status === 'heading_to_pickup' ? job.pickup : job.dropoff;

    const remainingDistanceKm = this.calculateHaversineDistance(
      location.latitude,
      location.longitude,
      target.latitude,
      target.longitude
    );

    // Motorbike avg speed ~24km/h in Harare urban traffic -> ~2.5 mins per km + 2 min buffer
    const recalculatedEta = Math.max(1, Math.round(remainingDistanceKm * 2.5 + 1));
    job.eta_minutes = recalculatedEta;
    job.updated_at = new Date().toISOString();

    // Broadcast subtle position update
    this.broadcast({
      type: 'LOCATION_UPDATED',
      payload: {
        job_id: job.job_id,
        source_app: job.source_app,
        latest_location: job.latest_location,
        eta_minutes: job.eta_minutes,
      },
    });

    return { success: true, job };
  }

  // --- RIDER ONLINE/OFFLINE TOGGLE ---
  public setRiderOnlineStatus(
    riderId: string,
    isOnline: boolean
  ): { success: boolean; rider?: RiderProfile; error?: string } {
    const rider = this.riders.get(riderId);
    if (!rider) {
      return { success: false, error: 'Rider not found' };
    }

    // If rider has an active delivery, they cannot simply go offline
    if (!isOnline && rider.current_job_id) {
      const active = this.jobs.get(rider.current_job_id);
      if (active && active.status !== 'delivered' && active.status !== 'cancelled') {
        return {
          success: false,
          error: 'Cannot go offline while you have an active delivery in progress.',
        };
      }
    }

    rider.is_online = isOnline;
    this.broadcast({ type: 'RIDER_STATUS_CHANGED', payload: rider });
    return { success: true, rider };
  }

  // --- EARNINGS CALCULATION ---
  public getRiderEarnings(riderId: string) {
    const allJobs = Array.from(this.jobs.values());
    const riderCompleted = allJobs.filter(
      (j) => j.assigned_rider?.id === riderId && j.status === 'delivered'
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let todayDeliveries = 0;
    let todayEarnings = 0;
    let weekDeliveries = 0;
    let weekEarnings = 0;

    const recentPayouts: Array<{
      job_id: string;
      source_app: SourceAppId;
      merchant_name: string;
      amount: number;
      completed_at: string;
      distance_km: number;
    }> = [];

    for (const job of riderCompleted) {
      const deliveredTime = job.delivered_at ? new Date(job.delivered_at).getTime() : 0;
      if (deliveredTime >= startOfToday) {
        todayDeliveries += 1;
        todayEarnings += job.rider_payout;
      }
      if (deliveredTime >= sevenDaysAgo) {
        weekDeliveries += 1;
        weekEarnings += job.rider_payout;
      }

      recentPayouts.push({
        job_id: job.job_id,
        source_app: job.source_app,
        merchant_name: job.merchant_name,
        amount: job.rider_payout,
        completed_at: job.delivered_at || job.updated_at,
        distance_km: job.distance_km,
      });
    }

    recentPayouts.sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    return {
      today_deliveries: todayDeliveries,
      today_earnings: Number(todayEarnings.toFixed(2)),
      week_deliveries: weekDeliveries,
      week_earnings: Number(weekEarnings.toFixed(2)),
      recent_payouts: recentPayouts.slice(0, 15),
    };
  }

  // --- Helper Distance Calculation (Haversine in km) ---
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}

// Global Singleton Instance
export const deliveryEngine = new DeliveryEngine();
