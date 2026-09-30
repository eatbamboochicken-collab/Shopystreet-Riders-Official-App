import React from 'react';
import {
  RiderProfile,
  DeliveryJob,
  PublicDeliveryJobOffer,
  EarningsSummary,
  DeliveryStatus,
} from '../types/delivery.js';
import { ActiveDeliveryView } from './ActiveDeliveryView.js';
import {
  CheckCircle2,
  DollarSign,
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Radio,
  Zap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface HomeViewProps {
  currentRider: RiderProfile | null;
  activeJob: DeliveryJob | null;
  availableOffers: PublicDeliveryJobOffer[];
  earnings: EarningsSummary | null;
  onOpenOffer: (offer: PublicDeliveryJobOffer) => void;
  onStatusTransition: (nextStatus: DeliveryStatus) => Promise<void>;
  onToggleOnline: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentRider,
  activeJob,
  availableOffers,
  earnings,
  onOpenOffer,
  onStatusTransition,
  onToggleOnline,
}) => {
  const isOnline = currentRider?.is_online ?? false;

  return (
    <div className="space-y-4 pb-20">
      {/* Rider Status & Rapid Metrics Bar */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Completed Deliveries */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">TODAY'S TRIPS</span>
            <div className="w-6 h-6 rounded-md bg-[#146EF5]/10 text-[#146EF5] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#172033]">
              {earnings?.today_deliveries ?? 0}
            </span>
            <span className="text-xs text-slate-600 font-medium">completed</span>
          </div>
        </div>

        {/* Today's Earnings */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">EARNINGS</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600">
              ${(earnings?.today_earnings ?? 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-600 font-medium">today</span>
          </div>
        </div>
      </div>

      {/* ACTIVE DELIVERY (if one is currently in progress) */}
      {activeJob && (
        <section>
          <ActiveDeliveryView
            job={activeJob}
            onStatusTransition={onStatusTransition}
            riderName={currentRider?.name || 'Rider'}
          />
        </section>
      )}

      {/* IF OFFLINE: Prompt to go online */}
      {!isOnline && !activeJob && (
        <div className="bg-slate-100 rounded-2xl p-6 text-center border border-slate-300 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <Radio className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172033]">You are currently Offline</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Go online to receive incoming delivery requests from Bamboo Chicken and Shopystreet
              dispatchers.
            </p>
          </div>
          <button
            onClick={onToggleOnline}
            className="w-full py-3 px-4 bg-[#146EF5] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md transition"
          >
            GO ONLINE NOW
          </button>
        </div>
      )}

      {/* NEW DELIVERY REQUESTS (Shown when online and no active job) */}
      {isOnline && !activeJob && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#21D4FD] animate-cyan-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                AVAILABLE REQUESTS ({availableOffers.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">Auto-refreshing</span>
          </div>

          {availableOffers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#146EF5]/10 text-[#146EF5] mx-auto flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-[#172033]">Scanning Harare Grid...</p>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                No open delivery requests at this moment. Bamboo Chicken and partner orders appear here
                instantly when dispatched.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableOffers.map((offer) => (
                <div
                  key={offer.job_id}
                  onClick={() => onOpenOffer(offer)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-[#146EF5] transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#146EF5]/10 text-[#146EF5]">
                          {offer.merchant_name}
                        </span>
                        <span className="text-[11px] text-slate-600 font-mono">
                          #{offer.source_order_id}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#172033] mt-1.5">{offer.pickup_name}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-[#146EF5]">
                        ${offer.rider_payout.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-600 block">Payout</span>
                    </div>
                  </div>

                  {/* Route & Distance info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Drop-off:</span>
                      <span className="font-semibold text-slate-800">
                        {offer.dropoff_general_area}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-slate-700">
                      <span>{offer.distance_km} km</span>
                      <span className="text-slate-300">•</span>
                      <span>~{offer.eta_minutes} min</span>
                    </div>
                  </div>

                  {/* 1-Tap Review Action */}
                  <div className="mt-3 flex items-center justify-end text-xs font-bold text-[#146EF5] gap-1">
                    <span>VIEW & ACCEPT</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Network / Architecture note badge */}
      <div className="bg-[#0B1F3A]/5 rounded-xl p-3 border border-[#0B1F3A]/10 text-[11px] text-slate-600 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-[#146EF5] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#0B1F3A]">Shared Courier Architecture:</span>
          <span> Atomic server-side lock prevents duplicate claims across multiple riders. Customer private addresses are strictly revealed only upon job acceptance.</span>
        </div>
      </div>
    </div>
  );
};
