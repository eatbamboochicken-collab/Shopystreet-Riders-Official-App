import React from 'react';
import { RiderNotification } from '../types/delivery.js';
import { Bell, CheckCircle2, AlertCircle, DollarSign, Package, X } from 'lucide-react';

interface NotificationsModalProps {
  notifications: RiderNotification[];
  onClose: () => void;
  onSelectNotificationJob?: (jobId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onSelectNotificationJob,
}) => {
  const getIcon = (type: RiderNotification['type']) => {
    switch (type) {
      case 'new_offer':
        return <Package className="w-4 h-4 text-[#146EF5]" />;
      case 'assigned':
        return <CheckCircle2 className="w-4 h-4 text-[#21D4FD]" />;
      case 'payout':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-[#0B1F3A] text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#21D4FD]" />
            <h2 className="font-bold text-sm text-white">Notifications Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto divide-y divide-slate-100 p-2 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.job_id && onSelectNotificationJob) {
                    onSelectNotificationJob(notif.job_id);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl transition ${
                  notif.job_id ? 'cursor-pointer hover:bg-slate-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#172033]">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-xs"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
