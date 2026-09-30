import React, { useState } from 'react';
import { PublicDeliveryJobOffer } from '../types/delivery.js';
import { MapPin, Navigation, DollarSign, Clock, ShieldCheck, AlertCircle, X, ChevronRight } from 'lucide-react';

interface DeliveryRequestModalProps {
  offer: PublicDeliveryJobOffer;
  onAccept: (jobId: string) => Promise<void>;
  onDismiss: () => void;
}

export const DeliveryRequestModal: React.FC<DeliveryRequestModalProps> = ({
  offer,
  onAccept,
  onDismiss,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccept = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onAccept(offer.job_id);
    } catch (err: unknown) {
      const errObj = err as { message?: string; data?: { error?: string; reason?: string } };
      const displayMsg =
        errObj.data?.error === 'DELIVERY NO LONGER AVAILABLE'
          ? 'DELIVERY NO LONGER AVAILABLE'
          : errObj.message || 'Failed to claim delivery.';
      setErrorMessage(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'bamboo_select':
        return { label: 'Bamboo Chicken Select', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'shopystreet_send':
        return { label: 'Shopystreet SEND', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'long_live_harare':
        return { label: 'Long Live Harare', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: offer.merchant_name, bg: 'bg-slate-100 text-slate-900 border-slate-300' };
    }
  };

  const sourceBadge = getSourceBadge(offer.source_app);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Alert strip */}
        <div className="bg-[#0B1F3A] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#21D4FD] animate-cyan-pulse" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-[#21D4FD]">
              NEW DELIVERY
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-full transition"
            aria-label="Dismiss request"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Merchant / Source */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                SOURCE
              </span>
              <h2 className="text-xl font-bold text-[#172033] mt-0.5">{offer.merchant_name}</h2>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${sourceBadge.bg}`}
            >
              {sourceBadge.label}
            </span>
          </div>

          {/* Route Card: Pickup & Dropoff (General Area Protected) */}
          <div className="bg-[#F5F8FC] rounded-xl p-3.5 border border-slate-200 space-y-3">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#146EF5]/15 border border-[#146EF5]/40 flex items-center justify-center text-[#146EF5] shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#146EF5]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#146EF5] uppercase tracking-wide">
                  PICKUP
                </span>
                <p className="text-sm font-semibold text-[#172033] truncate">{offer.pickup_name}</p>
                <p className="text-xs text-slate-500">{offer.pickup_area}</p>
              </div>
            </div>

            <div className="ml-3.5 border-l-2 border-dashed border-slate-300 h-4" />

            {/* Drop-off (General Area ONLY for privacy) */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                <Navigation className="w-3.5 h-3.5 text-slate-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    DROP-OFF
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium bg-slate-200 px-1.5 py-0.2 rounded">
                    Area Only
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#172033]">{offer.dropoff_general_area}</p>
                <p className="text-[11px] text-slate-600 italic">
                  Exact address revealed upon acceptance
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics: Distance & Pay */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F8FC] rounded-xl p-3 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">DISTANCE</span>
              <p className="text-lg font-bold text-[#172033] mt-0.5">{offer.distance_km} km</p>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-600" /> ~{offer.eta_minutes} min transit
              </span>
            </div>

            <div className="bg-[#146EF5]/10 rounded-xl p-3 border border-[#146EF5]/30">
              <span className="text-[11px] font-bold text-[#146EF5] uppercase">DELIVERY PAY</span>
              <p className="text-2xl font-extrabold text-[#146EF5] mt-0.5">
                ${offer.rider_payout.toFixed(2)}
              </p>
              <span className="text-[11px] text-slate-600 font-medium">Guaranteed rider payout</span>
            </div>
          </div>

          {/* Package brief */}
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Package:</span>
            <span className="truncate">{offer.package_summary.description}</span>
          </div>

          {/* Concurrency Error Banner if someone claimed first */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl flex items-start gap-2.5 animate-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">{errorMessage}</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Another rider accepted this job before you. The request has been removed.
                </p>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              onClick={handleAccept}
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 transition duration-150 ${
                isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#146EF5] hover:bg-blue-600 text-white active:scale-[0.99] border-b-2 border-blue-800'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>CLAIMING JOB...</span>
                </div>
              ) : (
                <>
                  <span>ACCEPT DELIVERY</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={onDismiss}
              className="w-full mt-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center"
            >
              Pass on this delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
