import React from 'react';
import { DeliveryJob } from '../types/delivery.js';
import { MapPin, Navigation, Radio, Compass, Shield } from 'lucide-react';

interface LiveRouteMapProps {
  job: DeliveryJob;
  isSimulatedMovement?: boolean;
}

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({ job }) => {
  const isPickupPhase =
    job.status === 'assigned' ||
    job.status === 'heading_to_pickup' ||
    job.status === 'arrived_pickup';

  // Coordinate normalizations for Harare bounds
  // Pickup: ~-17.8286, 31.0522 (CBD)
  // Dropoff: ~-17.8012, 31.0345 (Avondale)
  // We can render a neat, high-contrast schematic logistics radar/map view
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#0B1F3A] border border-slate-700 shadow-inner">
      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(#21D4FD 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Street simulation lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#146EF5" />
            <stop offset="100%" stopColor="#21D4FD" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient road paths */}
        <path
          d="M 20 80 Q 120 40 220 70 T 380 90"
          stroke="#1e3a5f"
          strokeWidth="3"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M 60 140 Q 160 100 260 120 T 400 60"
          stroke="#1e3a5f"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M 180 20 L 190 160"
          stroke="#1e3a5f"
          strokeWidth="2"
          fill="none"
        />

        {/* Active Dispatch Route */}
        <path
          d="M 70 115 C 140 115, 170 65, 310 50"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Pickup Marker (Left / Center) */}
        <circle cx="70" cy="115" r="7" fill="#146EF5" stroke="#ffffff" strokeWidth="2" />
        <text x="70" y="135" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
          PICKUP
        </text>

        {/* Dropoff Marker (Right / Top) */}
        <circle cx="310" cy="50" r="7" fill="#21D4FD" stroke="#ffffff" strokeWidth="2" />
        <text x="310" y="35" fill="#21D4FD" fontSize="10" textAnchor="middle" fontWeight="bold">
          DESTINATION
        </text>

        {/* Dynamic Rider Waypoint */}
        {isPickupPhase ? (
          <g transform="translate(110, 105)">
            <circle cx="0" cy="0" r="10" fill="#21D4FD" opacity="0.3" className="animate-ping" />
            <circle cx="0" cy="0" r="6" fill="#21D4FD" stroke="#0B1F3A" strokeWidth="2" />
          </g>
        ) : (
          <g transform="translate(230, 68)">
            <circle cx="0" cy="0" r="10" fill="#21D4FD" opacity="0.3" className="animate-ping" />
            <circle cx="0" cy="0" r="6" fill="#21D4FD" stroke="#0B1F3A" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Top Overlay Badge */}
      <div className="absolute top-2.5 left-3 flex items-center gap-2">
        <span className="bg-[#0B1F3A]/90 backdrop-blur-xs text-[#21D4FD] border border-[#21D4FD]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
          <Radio className="w-3 h-3 text-[#21D4FD] animate-pulse" />
          <span>HARARE GPS 12s INTERVAL</span>
        </span>
      </div>

      {/* Bottom info strip */}
      <div className="absolute bottom-2.5 right-3 bg-[#0B1F3A]/90 backdrop-blur-xs border border-slate-700 px-2.5 py-1 rounded-lg text-right">
        <span className="text-[10px] text-slate-400 block font-medium">ESTIMATED TRANSIT</span>
        <span className="text-xs font-bold text-[#21D4FD]">
          Approx. {job.eta_minutes} min
        </span>
      </div>

      {/* Stage indicator chip */}
      <div className="absolute bottom-2.5 left-3 bg-[#0B1F3A]/90 backdrop-blur-xs border border-slate-700 px-2.5 py-1 rounded-lg">
        <span className="text-[10px] text-slate-400 block font-medium">TARGET</span>
        <span className="text-xs font-semibold text-white truncate max-w-[130px] block">
          {isPickupPhase ? job.pickup.general_area : job.dropoff.general_area}
        </span>
      </div>
    </div>
  );
};
