/**
 * Shopystreet Riders — API Client
 * Resilient, low-data, handles offline/weak connectivity smoothly.
 */

import {
  DeliveryJob,
  PublicDeliveryJobOffer,
  RiderProfile,
  RiderNotification,
  EarningsSummary,
  DeliveryStatus,
  DeliveryEvent,
} from '../types/delivery.js';

class ApiService {
  private activeEventSource: EventSource | null = null;
  private sseListeners: Set<(data: unknown) => void> = new Set();
  private pendingRequests = new Set<string>();

  // Generic request with network failure handling
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const reqKey = `${options.method || 'GET'}:${endpoint}`;

    // Prevent duplicate fast-clicks for mutations
    if (options.method && options.method !== 'GET') {
      if (this.pendingRequests.has(reqKey)) {
        throw new Error('A request is already in flight. Please wait.');
      }
      this.pendingRequests.add(reqKey);
    }

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.error || data.message || `Request failed (${res.status})`;
        const error = new Error(errorMsg) as Error & { status?: number; data?: unknown };
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } finally {
      if (options.method && options.method !== 'GET') {
        this.pendingRequests.delete(reqKey);
      }
    }
  }

  // --- Riders ---
  public async getRiders(): Promise<{ riders: RiderProfile[] }> {
    return this.request('/api/riders');
  }

  public async getRider(riderId: string): Promise<{ rider: RiderProfile }> {
    return this.request(`/api/riders/${riderId}`);
  }

  public async setRiderOnlineStatus(
    riderId: string,
    isOnline: boolean
  ): Promise<{ success: boolean; rider: RiderProfile }> {
    return this.request(`/api/riders/${riderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_online: isOnline }),
    });
  }

  public async getRiderActiveJob(riderId: string): Promise<{ job: DeliveryJob | null }> {
    return this.request(`/api/riders/${riderId}/active-job`);
  }

  public async getRiderEarnings(riderId: string): Promise<{ earnings: EarningsSummary }> {
    return this.request(`/api/riders/${riderId}/earnings`);
  }

  // --- Jobs ---
  public async getAvailableOffers(): Promise<{ offers: PublicDeliveryJobOffer[] }> {
    return this.request('/api/jobs/available');
  }

  public async getAllJobs(): Promise<{ jobs: DeliveryJob[] }> {
    return this.request('/api/jobs');
  }

  public async getJob(jobId: string): Promise<{ job: DeliveryJob }> {
    return this.request(`/api/jobs/${jobId}`);
  }

  // CRITICAL: Atomic Claim
  public async claimJob(
    jobId: string,
    rider: {
      rider_id: string;
      rider_name: string;
      rider_phone: string;
      vehicle_type: 'motorbike' | 'bicycle' | 'scooter';
      vehicle_reg: string;
    }
  ): Promise<{ success: boolean; job: DeliveryJob; message?: string }> {
    return this.request(`/api/jobs/${jobId}/claim`, {
      method: 'POST',
      body: JSON.stringify(rider),
    });
  }

  // Delivery Lifecycle State Transitions
  public async transitionJob(
    jobId: string,
    riderId: string,
    nextStatus: DeliveryStatus,
    extra?: { cancellation_reason?: string }
  ): Promise<{ success: boolean; job: DeliveryJob }> {
    return this.request(`/api/jobs/${jobId}/transition`, {
      method: 'POST',
      body: JSON.stringify({
        rider_id: riderId,
        next_status: nextStatus,
        ...extra,
      }),
    });
  }

  // Location Updates
  public async sendLocationUpdate(
    jobId: string,
    riderId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    }
  ): Promise<{ success: boolean; job: DeliveryJob }> {
    return this.request(`/api/jobs/${jobId}/location`, {
      method: 'POST',
      body: JSON.stringify({
        rider_id: riderId,
        ...location,
      }),
    });
  }

  // --- Notifications ---
  public async getNotifications(): Promise<{ notifications: RiderNotification[] }> {
    return this.request('/api/notifications');
  }

  // --- External Source Integration API ---
  public async getSourceEvents(
    sourceApp?: string,
    jobId?: string
  ): Promise<{ events: DeliveryEvent[] }> {
    const query = new URLSearchParams();
    if (sourceApp) query.set('source_app', sourceApp);
    if (jobId) query.set('job_id', jobId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/api/sources/events${qs}`);
  }

  public async createSourceJob(payload: {
    source_app: string;
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
    };
    delivery_fee: number;
    rider_payout: number;
    distance_km: number;
  }): Promise<{ success: boolean; job: DeliveryJob }> {
    return this.request('/api/sources/create-job', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Real-time SSE Connection ---
  public connectSSE(onEvent: (data: unknown) => void) {
    this.sseListeners.add(onEvent);

    if (!this.activeEventSource) {
      this.initSSE();
    }

    return () => {
      this.sseListeners.delete(onEvent);
      if (this.sseListeners.size === 0 && this.activeEventSource) {
        this.activeEventSource.close();
        this.activeEventSource = null;
      }
    };
  }

  private initSSE() {
    try {
      this.activeEventSource = new EventSource('/api/events/stream');

      this.activeEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          for (const listener of this.sseListeners) {
            listener(data);
          }
        } catch {
          // ignore heartbeat / unparseable
        }
      };

      this.activeEventSource.onerror = () => {
        if (this.activeEventSource) {
          this.activeEventSource.close();
          this.activeEventSource = null;
        }
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (this.sseListeners.size > 0 && !this.activeEventSource) {
            this.initSSE();
          }
        }, 5000);
      };
    } catch (e) {
      console.warn('SSE not supported or failed to initialize:', e);
    }
  }
}

export const api = new ApiService();
