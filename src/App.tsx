/**
 * Shopystreet Riders — Master Application Entry Point
 * V1.0.0 — Shared Courier Execution Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api.js';
import { locationService } from './services/locationService.js';
import {
  RiderProfile,
  DeliveryJob,
  PublicDeliveryJobOffer,
  EarningsSummary,
  RiderNotification,
  DeliveryStatus,
} from './types/delivery.js';

import { Header } from './components/Header.js';
import { Navigation, TabId } from './components/Navigation.js';
import { HomeView } from './components/HomeView.js';
import { DeliveriesHistoryView } from './components/DeliveriesHistoryView.js';
import { EarningsView } from './components/EarningsView.js';
import { ProfileView } from './components/ProfileView.js';
import { DeliveryRequestModal } from './components/DeliveryRequestModal.js';
import { NotificationsModal } from './components/NotificationsModal.js';
import { SourceDispatchConsole } from './components/SourceDispatchConsole.js';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Core Data State
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [currentRiderId, setCurrentRiderId] = useState<string>('rider_tawanda');
  const [currentRider, setCurrentRider] = useState<RiderProfile | null>(null);

  const [activeJob, setActiveJob] = useState<DeliveryJob | null>(null);
  const [availableOffers, setAvailableOffers] = useState<PublicDeliveryJobOffer[]>([]);
  const [allJobs, setAllJobs] = useState<DeliveryJob[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);

  // Modals & Popups
  const [selectedOffer, setSelectedOffer] = useState<PublicDeliveryJobOffer | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSourceConsole, setShowSourceConsole] = useState(false);

  // Network Connectivity
  const [networkConnected, setNetworkConnected] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => setNetworkConnected(true);
    const handleOffline = () => setNetworkConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial riders list
  useEffect(() => {
    const initRiders = async () => {
      try {
        const res = await api.getRiders();
        setRiders(res.riders || []);
        if (res.riders && res.riders.length > 0) {
          const match = res.riders.find((r) => r.id === currentRiderId) || res.riders[0];
          setCurrentRider(match);
        }
      } catch (err) {
        console.error('Failed to fetch riders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initRiders();
  }, [currentRiderId]);

  // Load all rider-dependent data
  const loadRiderData = useCallback(async () => {
    if (!currentRiderId) return;

    try {
      const [riderRes, activeJobRes, offersRes, earningsRes, notifRes, allJobsRes] =
        await Promise.all([
          api.getRider(currentRiderId).catch(() => ({ rider: null })),
          api.getRiderActiveJob(currentRiderId).catch(() => ({ job: null })),
          api.getAvailableOffers().catch(() => ({ offers: [] })),
          api.getRiderEarnings(currentRiderId).catch(() => ({ earnings: null })),
          api.getNotifications().catch(() => ({ notifications: [] })),
          api.getAllJobs().catch(() => ({ jobs: [] })),
        ]);

      if (riderRes.rider) setCurrentRider(riderRes.rider);
      setActiveJob(activeJobRes.job);
      setAvailableOffers(offersRes.offers || []);
      if (earningsRes.earnings) setEarnings(earningsRes.earnings);
      setNotifications(notifRes.notifications || []);
      setAllJobs(allJobsRes.jobs || []);

      // If active job exists and is still in active phases, control location tracking
      if (
        activeJobRes.job &&
        activeJobRes.job.status !== 'delivered' &&
        activeJobRes.job.status !== 'cancelled'
      ) {
        locationService.start(activeJobRes.job, currentRiderId);
      } else {
        locationService.stop();
      }
    } catch (e) {
      console.error('Error refreshing rider data:', e);
    }
  }, [currentRiderId]);

  // Periodic poll + initial load
  useEffect(() => {
    loadRiderData();
    const interval = setInterval(loadRiderData, 4000);
    return () => clearInterval(interval);
  }, [loadRiderData]);

  // Real-time SSE event listener
  useEffect(() => {
    const unsubscribe = api.connectSSE((eventData: unknown) => {
      const event = eventData as {
        type?: string;
        event_type?: string;
        job_id?: string;
        payload?: unknown;
      };

      // If a job was claimed by someone else, update UI immediately
      if (event.type === 'JOB_CLAIMED') {
        const payload = event.payload as {
          job_id: string;
          claimed_by_id: string;
          claimed_by_name: string;
        };

        // Remove from available offers
        setAvailableOffers((prev) => prev.filter((o) => o.job_id !== payload.job_id));

        // If another rider won the claim, close request modal if open
        if (selectedOffer && selectedOffer.job_id === payload.job_id) {
          if (payload.claimed_by_id !== currentRiderId) {
            setSelectedOffer(null);
          }
        }

        // Refresh rider data to stay in sync
        loadRiderData();
      } else if (event.type === 'JOB_CREATED' || event.type === 'JOB_UPDATED') {
        loadRiderData();
      } else if (event.type === 'NOTIFICATION') {
        loadRiderData();
      }
    });

    return () => unsubscribe();
  }, [currentRiderId, selectedOffer, loadRiderData]);

  // Handle Online / Offline toggle
  const handleToggleOnline = async () => {
    if (!currentRider) return;
    const newStatus = !currentRider.is_online;

    try {
      const res = await api.setRiderOnlineStatus(currentRider.id, newStatus);
      if (res.success && res.rider) {
        setCurrentRider(res.rider);
      }
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Failed to change online status.');
    }
  };

  // Handle Switch Rider Profile
  const handleSelectRider = (newRiderId: string) => {
    locationService.stop();
    setCurrentRiderId(newRiderId);
    const found = riders.find((r) => r.id === newRiderId);
    if (found) setCurrentRider(found);
  };

  // Handle Atomic Claim Acceptance
  const handleAcceptJob = async (jobId: string) => {
    if (!currentRider) return;

    const res = await api.claimJob(jobId, {
      rider_id: currentRider.id,
      rider_name: currentRider.name,
      rider_phone: currentRider.phone,
      vehicle_type: currentRider.vehicle_type,
      vehicle_reg: currentRider.vehicle_reg,
    });

    if (res.success && res.job) {
      setActiveJob(res.job);
      setSelectedOffer(null);
      setActiveTab('home');
      locationService.start(res.job, currentRider.id);
      await loadRiderData();
    }
  };

  // Handle Delivery Lifecycle State Transitions
  const handleStatusTransition = async (nextStatus: DeliveryStatus) => {
    if (!activeJob || !currentRider) return;

    const res = await api.transitionJob(activeJob.job_id, currentRider.id, nextStatus);

    if (res.success && res.job) {
      setActiveJob(res.job);

      if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
        locationService.stop();
        setActiveJob(null);
      } else {
        locationService.start(res.job, currentRider.id);
      }

      await loadRiderData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172033] flex flex-col font-sans selection:bg-[#146EF5]/20">
      {/* Brand Header */}
      <Header
        currentRider={currentRider}
        riders={riders}
        onSelectRider={handleSelectRider}
        onToggleOnline={handleToggleOnline}
        notifications={notifications}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenSourceConsole={() => setShowSourceConsole(true)}
        isOnlineLocally={currentRider?.is_online ?? false}
        networkConnected={networkConnected}
      />

      {/* Main Content Area (Mobile viewport optimized) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-[#146EF5] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Connecting to Harare Delivery Grid...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                currentRider={currentRider}
                activeJob={activeJob}
                availableOffers={availableOffers}
                earnings={earnings}
                onOpenOffer={(offer) => setSelectedOffer(offer)}
                onStatusTransition={handleStatusTransition}
                onToggleOnline={handleToggleOnline}
              />
            )}

            {activeTab === 'deliveries' && (
              <DeliveriesHistoryView
                jobs={allJobs}
                currentRider={currentRider}
                onSelectJob={(job) => {
                  if (job.status === 'seeking_rider') {
                    const offer: PublicDeliveryJobOffer = {
                      job_id: job.job_id,
                      source_app: job.source_app,
                      source_order_id: job.source_order_id,
                      merchant_name: job.merchant_name,
                      pickup_name: job.pickup.name,
                      pickup_area: job.pickup.general_area,
                      dropoff_general_area: job.dropoff.general_area,
                      package_summary: job.package_summary,
                      rider_payout: job.rider_payout,
                      distance_km: job.distance_km,
                      eta_minutes: job.eta_minutes,
                      status: 'seeking_rider',
                      created_at: job.created_at,
                    };
                    setSelectedOffer(offer);
                  }
                }}
              />
            )}

            {activeTab === 'earnings' && (
              <EarningsView earnings={earnings} rider={currentRider} />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                rider={currentRider}
                riders={riders}
                onSelectRider={handleSelectRider}
              />
            )}
          </>
        )}
      </main>

      {/* Delivery Request Modal (when a rider taps an offer) */}
      {selectedOffer && (
        <DeliveryRequestModal
          offer={selectedOffer}
          onAccept={handleAcceptJob}
          onDismiss={() => setSelectedOffer(null)}
        />
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onSelectNotificationJob={(jobId) => {
            const foundOffer = availableOffers.find((o) => o.job_id === jobId);
            if (foundOffer) {
              setSelectedOffer(foundOffer);
            }
          }}
        />
      )}

      {/* Source Dispatch & Concurrency Test Console */}
      {showSourceConsole && (
        <SourceDispatchConsole
          onClose={() => setShowSourceConsole(false)}
          riders={riders}
          onRefreshData={loadRiderData}
        />
      )}

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        hasActiveDelivery={Boolean(activeJob)}
      />
    </div>
  );
}
