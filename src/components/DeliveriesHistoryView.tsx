import React, { useState } from 'react';
import { DeliveryJob, RiderProfile } from '../types/delivery.js';
import { Package, Clock, CheckCircle2, XCircle, MapPin, ChevronRight, Filter } from 'lucide-react';

interface DeliveriesHistoryViewProps {
  jobs: DeliveryJob[];
  currentRider: RiderProfile | null;
  onSelectJob?: (job: DeliveryJob) => void;
}

export const DeliveriesHistoryView: React.FC<DeliveriesHistoryViewProps> = ({
  jobs,
  currentRider,
  onSelectJob,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine' | 'bamboo' | 'send'>('all');

  const filteredJobs = jobs.filter((job) => {
    if (selectedFilter === 'mine') {
      return job.assigned_rider?.id === currentRider?.id;
    }
    if (selectedFilter === 'bamboo') {
      return job.source_app === 'bamboo_select';
    }
    if (selectedFilter === 'send') {
      return job.source_app === 'shopystreet_send';
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Delivered', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'cancelled':
        return { label: 'Cancelled', style: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'seeking_rider':
        return { label: 'Seeking Rider', style: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'In Progress', style: 'bg-blue-100 text-[#146EF5] border-blue-300' };
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Title & Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#172033]">Deliveries Feed</h1>
          <p className="text-xs text-slate-500">Universal courier job registry across Harare</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'mine', label: 'My Deliveries' },
          { id: 'bamboo', label: 'Bamboo Chicken' },
          { id: 'send', label: 'Shopystreet SEND' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as typeof selectedFilter)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedFilter === tab.id
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      <div className="space-y-2.5">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No deliveries found</p>
            <p className="text-xs text-slate-500">No matching orders in the registry.</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const statusBadge = getStatusBadge(job.status);
            const isMine = job.assigned_rider?.id === currentRider?.id;

            return (
              <div
                key={job.job_id}
                onClick={() => onSelectJob?.(job)}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-[#146EF5] transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#172033]">{job.merchant_name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusBadge.style}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      {job.job_id} • Order #{job.source_order_id}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[#146EF5]">
                      ${job.rider_payout.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{job.distance_km} km</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {job.pickup.general_area} → {job.dropoff.general_area}
                    </span>
                  </div>

                  {job.assigned_rider && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isMine ? 'bg-[#146EF5]/10 text-[#146EF5]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isMine ? 'You' : job.assigned_rider.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
