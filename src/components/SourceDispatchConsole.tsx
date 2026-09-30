import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DeliveryEvent, SourceAppId, RiderProfile } from '../types/delivery.js';
import {
  Layers,
  Send,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Radio,
  X,
  Code,
  Lock,
} from 'lucide-react';

interface SourceDispatchConsoleProps {
  onClose: () => void;
  riders: RiderProfile[];
  onRefreshData: () => void;
}

export const SourceDispatchConsole: React.FC<SourceDispatchConsoleProps> = ({
  onClose,
  riders,
  onRefreshData,
}) => {
  const [selectedSource, setSelectedSource] = useState<SourceAppId>('bamboo_select');
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [raceTestResult, setRaceTestResult] = useState<{
    tested: boolean;
    job_id?: string;
    rider1: { name: string; status: number; result: string };
    rider2: { name: string; status: number; result: string };
    explanation: string;
  } | null>(null);

  // Quick preset dispatch options
  const [preset, setPreset] = useState<'bamboo_chicken' | 'shopystreet_send' | 'long_live_harare'>(
    'bamboo_chicken'
  );

  const fetchEvents = async () => {
    try {
      const res = await api.getSourceEvents();
      setEvents(res.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch a new job from source app
  const handleDispatchJob = async () => {
    setIsLoading(true);
    try {
      if (preset === 'bamboo_chicken') {
        const orderNum = Math.floor(1000 + Math.random() * 9000);
        await api.createSourceJob({
          source_app: 'bamboo_select',
          source_order_id: `BC-${orderNum}`,
          merchant_name: 'Bamboo Chicken Select',
          pickup: {
            name: 'Bamboo Chicken — Harare CBD',
            address: '88 Kwame Nkrumah Ave, Harare',
            general_area: 'Harare CBD',
            latitude: -17.8286,
            longitude: 31.0522,
            contact_name: 'Bamboo Cashier #4',
            contact_phone: '+263 24 275 8899',
          },
          dropoff: {
            name: 'Kudakwashe Shumba',
            address: '42 Argyle Road, Avondale West',
            general_area: 'Avondale West',
            latitude: -17.8012,
            longitude: 31.0345,
            contact_name: 'Kuda',
            contact_phone: '+263 77 999 1122',
            instructions: 'Black gate, call upon arrival.',
          },
          package_summary: {
            description: '1x Whole Charcoal Chicken + 4 Sides + 2L Lemonade',
            items_count: 3,
            is_food: true,
            is_fragile: false,
          },
          delivery_fee: 3.5,
          rider_payout: 3.0,
          distance_km: 4.5,
        });
      } else if (preset === 'shopystreet_send') {
        const orderNum = Math.floor(100 + Math.random() * 900);
        await api.createSourceJob({
          source_app: 'shopystreet_send',
          source_order_id: `SEND-${orderNum}`,
          merchant_name: 'Shopystreet SEND',
          pickup: {
            name: 'Send Hub Eastlea',
            address: 'Samora Machel East, Harare',
            general_area: 'Eastlea',
            latitude: -17.8241,
            longitude: 31.0789,
            contact_name: 'Sender Dispatch',
            contact_phone: '+263 77 111 2233',
          },
          dropoff: {
            name: 'Dr. Chipo Mutasa',
            address: '18 Piers Road, Borrowdale',
            general_area: 'Borrowdale',
            latitude: -17.7621,
            longitude: 31.0912,
            contact_name: 'Dr. Mutasa',
            contact_phone: '+263 71 222 3344',
            instructions: 'Leave with reception.',
          },
          package_summary: {
            description: 'Medical laboratory diagnostic parcel (Secure sealed flyer)',
            items_count: 1,
            is_food: false,
            is_fragile: true,
          },
          delivery_fee: 5.5,
          rider_payout: 4.5,
          distance_km: 7.8,
        });
      } else {
        const orderNum = Math.floor(1000 + Math.random() * 9000);
        await api.createSourceJob({
          source_app: 'long_live_harare',
          source_order_id: `LLH-${orderNum}`,
          merchant_name: 'Long Live Harare',
          pickup: {
            name: 'Harare Artisans Boutique',
            address: 'Newlands Shopping Centre, Harare',
            general_area: 'Newlands',
            latitude: -17.815,
            longitude: 31.085,
            contact_name: 'Artisan Store',
            contact_phone: '+263 77 444 5566',
          },
          dropoff: {
            name: 'Grace Marufu',
            address: '12 Fife Avenue, Avenues',
            general_area: 'Avenues',
            latitude: -17.818,
            longitude: 31.052,
            contact_name: 'Grace',
            contact_phone: '+263 78 555 6677',
            instructions: 'Flat 4B, 2nd floor.',
          },
          package_summary: {
            description: 'Handmade ceramic planter & boutique coffee beans',
            items_count: 2,
            is_food: false,
            is_fragile: true,
          },
          delivery_fee: 4.0,
          rider_payout: 3.25,
          distance_km: 4.0,
        });
      }

      await fetchEvents();
      onRefreshData();
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL TEST: Simulate 2 riders firing simultaneous atomic claim requests
  const handleSimulateAtomicRace = async () => {
    setIsLoading(true);
    setRaceTestResult(null);

    try {
      // 1. First create a fresh new job
      const orderNum = Math.floor(5000 + Math.random() * 4000);
      const res = await api.createSourceJob({
        source_app: 'bamboo_select',
        source_order_id: `BC-RACE-${orderNum}`,
        merchant_name: 'Bamboo Chicken Select (Race Test)',
        pickup: {
          name: 'Bamboo Chicken — Central',
          address: '88 Kwame Nkrumah Ave, Harare',
          general_area: 'Harare CBD',
          latitude: -17.8286,
          longitude: 31.0522,
        },
        dropoff: {
          name: 'Race Destination',
          address: 'Belgravia Shopping Centre',
          general_area: 'Belgravia',
          latitude: -17.795,
          longitude: 31.048,
        },
        package_summary: {
          description: 'Spicy Burger + Fries (Atomic Test)',
          items_count: 2,
          is_food: true,
          is_fragile: false,
        },
        delivery_fee: 3.0,
        rider_payout: 2.75,
        distance_km: 3.8,
      });

      const testJobId = res.job.job_id;

      // 2. Prepare Rider A (Tawanda) and Rider B (Farai)
      const riderA = {
        rider_id: 'rider_tawanda',
        rider_name: 'Tawanda Moyo',
        rider_phone: '+263 77 123 4567',
        vehicle_type: 'motorbike' as const,
        vehicle_reg: 'ABG 4812',
      };

      const riderB = {
        rider_id: 'rider_farai',
        rider_name: 'Farai Chiwara',
        rider_phone: '+263 71 987 6543',
        vehicle_type: 'motorbike' as const,
        vehicle_reg: 'AEU 9031',
      };

      // 3. Fire BOTH simultaneously via Promise.all
      const [resA, resB] = await Promise.all([
        fetch(`/api/jobs/${testJobId}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(riderA),
        }).then(async (r) => ({ status: r.status, data: await r.json() })),

        fetch(`/api/jobs/${testJobId}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(riderB),
        }).then(async (r) => ({ status: r.status, data: await r.json() })),
      ]);

      setRaceTestResult({
        tested: true,
        job_id: testJobId,
        rider1: {
          name: riderA.rider_name,
          status: resA.status,
          result:
            resA.status === 200
              ? 'ASSIGNED (Claim Won)'
              : resA.data?.error || 'Rejected by Server',
        },
        rider2: {
          name: riderB.rider_name,
          status: resB.status,
          result:
            resB.status === 200
              ? 'ASSIGNED (Claim Won)'
              : resB.data?.error || 'Rejected by Server',
        },
        explanation:
          (resA.status === 200 && resB.status === 409) ||
          (resB.status === 200 && resA.status === 409)
            ? 'VERIFIED: Server atomic lock succeeded. Only 1 rider claimed the job; the second rider received HTTP 409 Conflict (DELIVERY NO LONGER AVAILABLE).'
            : 'Race condition test finished.',
      });

      await fetchEvents();
      onRefreshData();
    } catch (e) {
      console.error('Race test failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B1F3A] text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#21D4FD]" />
            <div>
              <h2 className="font-bold text-sm text-white">Source Dispatch & Integration Console</h2>
              <p className="text-[10px] text-slate-300">
                Bamboo Chicken • Shopystreet SEND • Long Live Harare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Section 1: Dispatch from Source Apps */}
          <div className="bg-[#F5F8FC] rounded-xl p-3.5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                1. Simulate Source Application Order Dispatch
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPreset('bamboo_chicken')}
                className={`p-2 rounded-lg border text-left transition ${
                  preset === 'bamboo_chicken'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span className="block text-[11px] font-bold">Bamboo Chicken</span>
                <span className="text-[10px] text-slate-500">Food • $3.00 payout</span>
              </button>

              <button
                onClick={() => setPreset('shopystreet_send')}
                className={`p-2 rounded-lg border text-left transition ${
                  preset === 'shopystreet_send'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span className="block text-[11px] font-bold">Shopystreet SEND</span>
                <span className="text-[10px] text-slate-500">Parcel • $4.50 payout</span>
              </button>

              <button
                onClick={() => setPreset('long_live_harare')}
                className={`p-2 rounded-lg border text-left transition ${
                  preset === 'long_live_harare'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span className="block text-[11px] font-bold">Long Live Harare</span>
                <span className="text-[10px] text-slate-500">Craft • $3.25 payout</span>
              </button>
            </div>

            <button
              onClick={handleDispatchJob}
              disabled={isLoading}
              className="w-full py-2.5 px-3 bg-[#146EF5] hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>DISPATCH NEW ORDER TO RIDERS NETWORK</span>
            </button>
          </div>

          {/* Section 2: Atomic Concurrency Verification */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#21D4FD] uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#21D4FD]" />
                2. Test Atomic Rider Assignment Race
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SPEC SECTION 6</span>
            </div>

            <p className="text-[11px] text-slate-300">
              Fires simultaneous claim requests for Tawanda and Farai at the exact same millisecond to
              prove server-side atomicity locks out the second rider with HTTP 409 Conflict.
            </p>

            <button
              onClick={handleSimulateAtomicRace}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>EXECUTE DUAL-RIDER CONCURRENT CLAIM RACE</span>
            </button>

            {raceTestResult && (
              <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">Rider A: {raceTestResult.rider1.name}</span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                      raceTestResult.rider1.status === 200
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    HTTP {raceTestResult.rider1.status}: {raceTestResult.rider1.result}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">Rider B: {raceTestResult.rider2.name}</span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                      raceTestResult.rider2.status === 200
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    HTTP {raceTestResult.rider2.status}: {raceTestResult.rider2.result}
                  </span>
                </div>

                <p className="text-[10px] text-[#21D4FD] font-semibold pt-1 border-t border-slate-700">
                  {raceTestResult.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Real-Time Event Feed for Bamboo & External Sources */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#146EF5]" />
                3. Live Source Application Event Stream
              </span>
              <button
                onClick={fetchEvents}
                className="text-slate-500 hover:text-slate-800 p-1 rounded"
                title="Refresh events"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Bamboo Chicken and partner applications listen to these events (RIDER_ASSIGNED,
              RIDER_ARRIVED_PICKUP, DELIVERED) to update their customer status screens.
            </p>

            <div className="bg-slate-900 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto space-y-1.5 border border-slate-800">
              {events.slice(0, 10).map((evt) => (
                <div key={evt.event_id} className="pb-1 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#21D4FD]">{evt.event_type}</span>
                    <span className="text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Source: <span className="text-amber-400">{evt.source_app}</span> • Job:{' '}
                    <span className="text-slate-300">{evt.job_id}</span>
                  </div>
                  {evt.data?.rider_name && (
                    <div className="text-emerald-400">
                      Rider: {evt.data.rider_name} (ETA: {evt.data.eta_minutes ?? '~12'} min)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
