import React from 'react';
import { EarningsSummary, RiderProfile } from '../types/delivery.js';
import { DollarSign, Package, TrendingUp, Calendar, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface EarningsViewProps {
  earnings: EarningsSummary | null;
  rider: RiderProfile | null;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ earnings, rider }) => {
  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-lg font-bold text-[#172033]">Rider Earnings</h1>
        <p className="text-xs text-slate-500">Payouts calculated automatically upon job delivery</p>
      </div>

      {/* TODAY & WEEK CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* TODAY */}
        <div className="bg-[#0B1F3A] rounded-2xl p-4 text-white shadow-md border border-slate-700">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#21D4FD]">
              TODAY
            </span>
            <Calendar className="w-3.5 h-3.5 text-[#21D4FD]" />
          </div>

          <div className="mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${(earnings?.today_earnings ?? 0).toFixed(2)}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
              <Package className="w-3.5 h-3.5 text-[#21D4FD]" />
              <span>{earnings?.today_deliveries ?? 0} deliveries completed</span>
            </div>
          </div>
        </div>

        {/* WEEK */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#146EF5]">
              THIS WEEK
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#146EF5]" />
          </div>

          <div className="mt-2">
            <span className="text-3xl font-extrabold text-[#172033] tracking-tight">
              ${(earnings?.week_earnings ?? 0).toFixed(2)}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Package className="w-3.5 h-3.5 text-[#146EF5]" />
              <span>{earnings?.week_deliveries ?? 0} deliveries completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Mechanism Info Card */}
      <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs text-emerald-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Guaranteed Instant Per-Trip Payouts</span>
        </div>
        <p className="text-emerald-700">
          Shopystreet Riders pays directly into your EcoCash or registered bank account on daily settlement.
        </p>
      </div>

      {/* RECENT SETTLED TRIPS */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          RECENT SETTLED DELIVERIES
        </h2>

        {(!earnings?.recent_payouts || earnings.recent_payouts.length === 0) ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500">
            No completed deliveries yet for this rider profile.
          </div>
        ) : (
          <div className="bg-white rounded-2xl divide-y divide-slate-100 border border-slate-200 shadow-xs overflow-hidden">
            {earnings.recent_payouts.map((payout, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      {payout.merchant_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {payout.job_id} • {payout.distance_km} km
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600">
                    +${payout.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Settled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
