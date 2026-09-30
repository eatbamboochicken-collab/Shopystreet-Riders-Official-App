import React from 'react';
import { Home, Package, DollarSign, User } from 'lucide-react';

export type TabId = 'home' | 'deliveries' | 'earnings' | 'profile';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasActiveDelivery: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hasActiveDelivery,
}) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'deliveries', label: 'Deliveries', icon: Package },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1F3A] border-t border-slate-800 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 transition-colors ${
                isActive ? 'text-[#21D4FD]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.id === 'deliveries' && hasActiveDelivery && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#21D4FD] animate-ping" />
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-[#21D4FD] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
