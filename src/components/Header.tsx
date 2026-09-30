import React from 'react';
import { RiderProfile, RiderNotification } from '../types/delivery.js';
import { Bell, Radio, Shield, Wifi, WifiOff, Users, Layers } from 'lucide-react';

interface HeaderProps {
  currentRider: RiderProfile | null;
  riders: RiderProfile[];
  onSelectRider: (riderId: string) => void;
  onToggleOnline: () => void;
  notifications: RiderNotification[];
  onOpenNotifications: () => void;
  onOpenSourceConsole: () => void;
  isOnlineLocally: boolean;
  networkConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRider,
  riders,
  onSelectRider,
  onToggleOnline,
  notifications,
  onOpenNotifications,
  onOpenSourceConsole,
  isOnlineLocally,
  networkConnected,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isOnline = currentRider?.is_online ?? false;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F3A] text-white shadow-md border-b border-[#146EF5]/20">
      {/* Network Alert if connection is interrupted */}
      {!networkConnected && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Connection interrupted. Queuing local actions...</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#146EF5] to-[#0B1F3A] border border-[#21D4FD]/40 flex items-center justify-center shadow-sm">
            <Radio className="w-4 h-4 text-[#21D4FD]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm text-white">SHOPYSTREET</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#146EF5] text-white tracking-wider">
                RIDERS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#21D4FD]"></span>
              <span>Harare Courier Grid</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick source dispatch test console button */}
          <button
            onClick={onOpenSourceConsole}
            className="p-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition"
            title="Open Bamboo & Sources Dispatch Console"
            aria-label="Open Source Dispatch Console"
          >
            <Layers className="w-3.5 h-3.5 text-[#21D4FD]" />
            <span className="hidden sm:inline text-[11px]">Sources</span>
          </button>

          {/* Notifications bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#146EF5] text-[#21D4FD] text-[10px] font-bold flex items-center justify-center border-2 border-[#0B1F3A]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Rider Switcher dropdown for multi-rider concurrency testing */}
          <div className="relative">
            <select
              value={currentRider?.id || ''}
              onChange={(e) => onSelectRider(e.target.value)}
              className="bg-slate-800/90 text-white text-xs rounded-lg px-2 py-1.5 border border-slate-700 focus:outline-none focus:border-[#21D4FD] max-w-[110px] truncate"
              title="Switch rider to test atomic concurrency"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0B1F3A] text-white">
                  {r.name.split(' ')[0]} ({r.vehicle_type === 'motorbike' ? '🏍️' : '🚲'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rider Status Sub-bar */}
      <div className="bg-[#0e274a] px-4 py-2 border-t border-slate-800/80">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-[#21D4FD] animate-cyan-pulse' : 'bg-slate-400'
                }`}
              />
            </div>
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              {isOnline ? 'ONLINE & AVAILABLE' : 'OFFLINE'}
            </span>
            {currentRider?.battery_saver && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                Eco
              </span>
            )}
          </div>

          {/* 1-Tap Online/Offline Switch */}
          <button
            onClick={onToggleOnline}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
              isOnline
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-[#146EF5] text-white hover:bg-blue-600 border border-blue-400'
            }`}
          >
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </button>
        </div>
      </div>
    </header>
  );
};
