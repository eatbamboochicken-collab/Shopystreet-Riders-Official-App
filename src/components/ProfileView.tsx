import React from 'react';
import { RiderProfile } from '../types/delivery.js';
import { User, Phone, Mail, Award, Bike, Zap, MapPin, CheckCircle, Shield } from 'lucide-react';

interface ProfileViewProps {
  rider: RiderProfile | null;
  riders: RiderProfile[];
  onSelectRider: (riderId: string) => void;
  onToggleBatterySaver?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  rider,
  riders,
  onSelectRider,
}) => {
  if (!rider) return null;

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-lg font-bold text-[#172033]">Rider Profile</h1>
        <p className="text-xs text-slate-500">Shopystreet Courier Network Identity</p>
      </div>

      {/* Main Identity Card */}
      <div className="bg-[#0B1F3A] rounded-2xl p-4 text-white shadow-md border border-slate-700 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#146EF5] to-[#21D4FD] text-[#0B1F3A] flex items-center justify-center font-black text-xl shadow-md">
            {rider.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{rider.name}</h2>
              <span className="text-[10px] bg-[#21D4FD]/20 text-[#21D4FD] border border-[#21D4FD]/40 px-1.5 py-0.2 rounded font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{rider.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                ★ {rider.rating.toFixed(1)}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-300">{rider.phone}</span>
            </div>
          </div>
        </div>

        {/* Vehicle specs */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Type</span>
            <span className="font-semibold text-white capitalize flex items-center gap-1 mt-0.5">
              <Bike className="w-3.5 h-3.5 text-[#21D4FD]" />
              {rider.vehicle_type}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration</span>
            <span className="font-mono font-bold text-[#21D4FD] mt-0.5 block">{rider.vehicle_reg}</span>
          </div>
        </div>
      </div>

      {/* Harare Operational Zone Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#146EF5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Operating Territory
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            Connected
          </span>
        </div>
        <p className="text-xs text-slate-700 font-semibold">{rider.active_zone}</p>
        <p className="text-[11px] text-slate-500">
          Covering Harare CBD, Avondale, Eastlea, Borrowdale, Belgravia, and Avenues.
        </p>
      </div>

      {/* Switch Rider for testing multi-rider concurrency */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Switch Rider Profile
            </h3>
            <p className="text-[11px] text-slate-500">
              Test multi-rider concurrency, independent assignments, and earnings
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {riders.map((r) => {
            const isCurrent = r.id === rider.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRider(r.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  isCurrent
                    ? 'border-[#146EF5] bg-[#146EF5]/5 text-[#172033]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isCurrent ? 'bg-[#146EF5] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{r.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {r.vehicle_type} • {r.vehicle_reg}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.is_online ? 'bg-[#21D4FD]/20 text-cyan-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {r.is_online ? 'Online' : 'Offline'}
                  </span>
                  {isCurrent && <CheckCircle className="w-4 h-4 text-[#146EF5]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform & Compliance Info */}
      <div className="text-center text-xs text-slate-600 py-2 space-y-1">
        <p className="font-bold text-slate-700">Shopystreet Riders v1.0.0</p>
        <p>Shared Courier Engine • Harare, Zimbabwe</p>
      </div>
    </div>
  );
};
