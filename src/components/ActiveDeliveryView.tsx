import React, { useState } from 'react';
import { DeliveryJob, DeliveryStatus } from '../types/delivery.js';
import { LiveRouteMap } from './LiveRouteMap.js';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';

interface ActiveDeliveryViewProps {
  job: DeliveryJob;
  onStatusTransition: (nextStatus: DeliveryStatus) => Promise<void>;
  riderName: string;
}

export const ActiveDeliveryView: React.FC<ActiveDeliveryViewProps> = ({
  job,
  onStatusTransition,
  riderName,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status mapping
  const getStatusDisplay = (status: DeliveryStatus) => {
    switch (status) {
      case 'assigned':
        return { label: 'Assigned', step: 1, desc: 'Delivery secured. Prepare to depart.' };
      case 'heading_to_pickup':
        return { label: 'Heading to Pickup', step: 2, desc: 'En route to merchant' };
      case 'arrived_pickup':
        return { label: 'Arrived at Pickup', step: 3, desc: 'At merchant counter. Collect order.' };
      case 'picked_up':
        return { label: 'Order Picked Up', step: 4, desc: 'Order verified & secured' };
      case 'delivering':
        return { label: 'Delivering to Customer', step: 5, desc: 'En route to customer drop-off' };
      case 'arrived_destination':
        return { label: 'Arrived at Destination', step: 6, desc: 'At customer address. Hand over.' };
      case 'delivered':
        return { label: 'Delivered', step: 7, desc: 'Delivery successfully completed' };
      default:
        return { label: status, step: 0, desc: '' };
    }
  };

  const statusInfo = getStatusDisplay(job.status);

  // Transition handler
  const handleTransition = async (nextStatus: DeliveryStatus) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      await onStatusTransition(nextStatus);
    } catch (err: unknown) {
      const e = err as Error;
      setActionError(e.message || 'Action failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Launch external GPS / Google Maps navigation
  const handleOpenExternalNav = (isPickup: boolean) => {
    const target = isPickup ? job.pickup : job.dropoff;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Active Delivery Card Header */}
      <div className="bg-[#0B1F3A] rounded-2xl p-4 text-white shadow-lg border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#21D4FD] animate-cyan-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#21D4FD]">
              ACTIVE DELIVERY
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {job.job_id}
          </span>
        </div>

        {/* Source info & Live ETA */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              SOURCE
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{job.merchant_name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">Order #{job.source_order_id}</p>
          </div>

          <div className="bg-[#146EF5]/20 border border-[#21D4FD]/40 rounded-xl px-3 py-2 text-right">
            <span className="text-[10px] font-bold text-slate-300 block uppercase">ETA</span>
            <span className="text-base font-extrabold text-[#21D4FD] tracking-tight">
              Approx. {job.eta_minutes} min
            </span>
          </div>
        </div>

        {/* Current status pill */}
        <div className="mt-3.5 bg-slate-800/80 rounded-xl p-2.5 flex items-center justify-between border border-slate-700">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">STATUS</span>
            <span className="text-sm font-bold text-[#21D4FD]">{statusInfo.label}</span>
          </div>
          <span className="text-xs text-slate-300 italic">{statusInfo.desc}</span>
        </div>
      </div>

      {/* Live Harare Schematic Route Map */}
      <LiveRouteMap job={job} />

      {/* Pickup & Destination Details Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
        {/* PICKUP SECTION */}
        <div
          className={`p-3 rounded-xl border transition ${
            job.status === 'assigned' ||
            job.status === 'heading_to_pickup' ||
            job.status === 'arrived_pickup'
              ? 'bg-[#146EF5]/5 border-[#146EF5]/30'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#146EF5] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-[#146EF5] uppercase tracking-wider">
                  PICKUP
                </span>
                <p className="text-sm font-bold text-[#172033]">{job.pickup.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{job.pickup.address}</p>
                {job.pickup.notes && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-0.5 mt-1 border border-amber-200">
                    Note: {job.pickup.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Navigate to Pickup */}
            <button
              onClick={() => handleOpenExternalNav(true)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-[#146EF5] text-slate-700 hover:text-[#146EF5] shadow-xs text-xs font-bold flex items-center gap-1 transition"
              title="Navigate to Pickup"
            >
              <Navigation className="w-3.5 h-3.5 text-[#146EF5]" />
              <span className="hidden sm:inline">Nav</span>
            </button>
          </div>
        </div>

        {/* DESTINATION SECTION */}
        <div
          className={`p-3 rounded-xl border transition ${
            job.status === 'picked_up' ||
            job.status === 'delivering' ||
            job.status === 'arrived_destination'
              ? 'bg-[#21D4FD]/10 border-[#146EF5]/40'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-[#21D4FD] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Navigation className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                    DESTINATION
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Unlocked
                  </span>
                </div>
                <p className="text-sm font-bold text-[#172033]">{job.dropoff.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{job.dropoff.address}</p>
                {job.dropoff.instructions && (
                  <p className="text-[11px] text-blue-900 bg-blue-50 rounded px-2 py-0.5 mt-1 border border-blue-200">
                    Instructions: {job.dropoff.instructions}
                  </p>
                )}
              </div>
            </div>

            {/* Navigate to Destination */}
            <button
              onClick={() => handleOpenExternalNav(false)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-[#146EF5] text-slate-700 hover:text-[#146EF5] shadow-xs text-xs font-bold flex items-center gap-1 transition"
              title="Navigate to Destination"
            >
              <Navigation className="w-3.5 h-3.5 text-[#146EF5]" />
              <span className="hidden sm:inline">Nav</span>
            </button>
          </div>

          {/* Contact customer / source */}
          {job.dropoff.contact_phone && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Customer: {job.dropoff.contact_name}</span>
              <a
                href={`tel:${job.dropoff.contact_phone}`}
                className="text-[#146EF5] font-bold flex items-center gap-1 hover:underline"
              >
                <Phone className="w-3 h-3" />
                {job.dropoff.contact_phone}
              </a>
            </div>
          )}
        </div>

        {/* Package & Payout Details */}
        <div className="bg-[#F5F8FC] rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Package Summary</span>
            <span className="font-semibold text-slate-800">{job.package_summary.description}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium block">Payout</span>
            <span className="text-base font-extrabold text-[#146EF5]">
              ${job.rider_payout.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Error if any */}
        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* STATE ACTION BUTTONS (Clean, prominent mobile touch targets) */}
        <div className="pt-2">
          {/* Step 1: Assigned -> Heading to Pickup */}
          {job.status === 'assigned' && (
            <button
              onClick={() => handleTransition('heading_to_pickup')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-[#146EF5] hover:bg-blue-600 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 border-b-2 border-blue-800 active:scale-[0.99] transition"
            >
              {isProcessing ? 'UPDATING...' : 'START HEADING TO PICKUP'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {/* Step 2: Heading to Pickup -> Arrived Pickup */}
          {job.status === 'heading_to_pickup' && (
            <button
              onClick={() => handleTransition('arrived_pickup')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-[#146EF5] hover:bg-blue-600 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 border-b-2 border-blue-800 active:scale-[0.99] transition"
            >
              {isProcessing ? 'UPDATING...' : 'ARRIVED AT PICKUP'}
              <CheckCircle2 className="w-5 h-5 text-[#21D4FD]" />
            </button>
          )}

          {/* Step 3: Arrived Pickup -> Picked Up */}
          {job.status === 'arrived_pickup' && (
            <button
              onClick={() => handleTransition('picked_up')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-[#0B1F3A] hover:bg-slate-900 text-[#21D4FD] rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 border border-[#21D4FD]/30 active:scale-[0.99] transition"
            >
              {isProcessing ? 'UPDATING...' : 'CONFIRM ORDER PICKED UP'}
              <CheckCircle2 className="w-5 h-5 text-[#21D4FD]" />
            </button>
          )}

          {/* Step 4: Picked Up -> Delivering to customer */}
          {job.status === 'picked_up' && (
            <button
              onClick={() => handleTransition('delivering')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-[#146EF5] hover:bg-blue-600 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 border-b-2 border-blue-800 active:scale-[0.99] transition"
            >
              {isProcessing ? 'UPDATING...' : 'START DELIVERY TO CUSTOMER'}
              <Navigation className="w-5 h-5" />
            </button>
          )}

          {/* Step 5: Delivering -> Arrived Destination */}
          {job.status === 'delivering' && (
            <button
              onClick={() => handleTransition('arrived_destination')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-[#146EF5] hover:bg-blue-600 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 border-b-2 border-blue-800 active:scale-[0.99] transition"
            >
              {isProcessing ? 'UPDATING...' : 'ARRIVED AT DESTINATION'}
              <MapPin className="w-5 h-5 text-[#21D4FD]" />
            </button>
          )}

          {/* Step 6: Arrived Destination -> Delivered */}
          {job.status === 'arrived_destination' && (
            <button
              onClick={() => handleTransition('delivered')}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 border-b-2 border-emerald-800 active:scale-[0.99] transition"
            >
              {isProcessing ? 'COMPLETING...' : 'CONFIRM DELIVERED'}
              <CheckCircle2 className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Quick External Navigation button below primary action */}
          <div className="mt-2.5 flex items-center justify-between">
            <button
              onClick={() =>
                handleOpenExternalNav(
                  job.status === 'assigned' ||
                    job.status === 'heading_to_pickup' ||
                    job.status === 'arrived_pickup'
                )
              }
              className="text-xs font-semibold text-[#146EF5] hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              Open Turn-by-Turn Navigation
            </button>

            <span className="text-[11px] text-slate-600">Assigned: {riderName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
