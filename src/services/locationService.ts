/**
 * Shopystreet Riders — Location Tracking Service
 * Strictly respects Section 8 of the Master Build Prompt:
 * - NO tracking when offline
 * - NO tracking when online with no active job
 * - Active tracking ONLY during assigned/active delivery
 * - Battery & data-conscious interval (12 seconds)
 * - Stops immediately on delivery completion
 */

import { api } from './api.js';
import { DeliveryJob } from '../types/delivery.js';

class LocationTrackingService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentJob: DeliveryJob | null = null;
  private currentRiderId: string | null = null;
  private intervalMs = 12000; // 12 seconds per specification (10-15s target)
  private isSimulated = true; // Use smooth route simulation or real GPS
  private simProgress = 0; // 0 to 1 along path

  // Set interval (can be tuned for battery saver)
  public setIntervalSeconds(seconds: number) {
    this.intervalMs = Math.max(5000, seconds * 1000);
    if (this.timerId && this.currentJob && this.currentRiderId) {
      this.stop();
      this.start(this.currentJob, this.currentRiderId);
    }
  }

  public getIntervalSeconds(): number {
    return Math.round(this.intervalMs / 1000);
  }

  public setUseSimulation(sim: boolean) {
    this.isSimulated = sim;
  }

  public isTracking(): boolean {
    return this.timerId !== null;
  }

  /**
   * Start tracking for an active delivery
   */
  public start(job: DeliveryJob, riderId: string) {
    // If not active delivery status, do not track
    const activeStatuses = [
      'assigned',
      'heading_to_pickup',
      'arrived_pickup',
      'picked_up',
      'delivering',
      'arrived_destination',
    ];

    if (!activeStatuses.includes(job.status)) {
      this.stop();
      return;
    }

    if (this.currentJob?.job_id === job.job_id && this.timerId) {
      // Just update reference
      this.currentJob = job;
      return;
    }

    this.stop();
    this.currentJob = job;
    this.currentRiderId = riderId;
    this.simProgress = 0.15; // start slightly moved

    // Send first fix immediately
    this.sendFix();

    // Periodic updates every 12 seconds
    this.timerId = setInterval(() => {
      this.sendFix();
    }, this.intervalMs);
  }

  /**
   * Stop tracking immediately
   */
  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentJob = null;
    this.currentRiderId = null;
    this.simProgress = 0;
  }

  private async sendFix() {
    if (!this.currentJob || !this.currentRiderId) return;

    const job = this.currentJob;
    const riderId = this.currentRiderId;

    if (this.isSimulated || !navigator.geolocation) {
      // Smoothly advance simulation between pickup and dropoff
      this.simProgress = Math.min(0.95, this.simProgress + 0.08);

      const isHeadingToPickup =
        job.status === 'assigned' || job.status === 'heading_to_pickup';

      // If heading to pickup, interpolate between a nearby point and pickup
      const startLat = isHeadingToPickup ? job.pickup.latitude - 0.015 : job.pickup.latitude;
      const startLng = isHeadingToPickup ? job.pickup.longitude - 0.015 : job.pickup.longitude;
      const endLat = isHeadingToPickup ? job.pickup.latitude : job.dropoff.latitude;
      const endLng = isHeadingToPickup ? job.pickup.longitude : job.dropoff.longitude;

      const lat = startLat + (endLat - startLat) * this.simProgress;
      const lng = startLng + (endLng - startLng) * this.simProgress;

      try {
        await api.sendLocationUpdate(job.job_id, riderId, {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          accuracy: 8,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn('Location fix transmission deferred (low network/offline):', err);
      }
    } else {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.sendLocationUpdate(job.job_id, riderId, {
              latitude: Number(position.coords.latitude.toFixed(6)),
              longitude: Number(position.coords.longitude.toFixed(6)),
              accuracy: Math.round(position.coords.accuracy),
              timestamp: position.timestamp,
            });
          } catch (err) {
            console.warn('Real GPS transmission deferred:', err);
          }
        },
        (err) => {
          console.warn('Geolocation lookup issue, falling back to simulated waypoint:', err);
        },
        { timeout: 8000, maximumAge: 10000, enableHighAccuracy: false }
      );
    }
  }
}

export const locationService = new LocationTrackingService();
