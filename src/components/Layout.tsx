import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, ScrollText, PiggyBank, FileText, Send, Building, LogOut, FileSignature, ClipboardList } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Groups', to: '/groups', icon: Building },
  { name: 'Members', to: '/members', icon: Users, defaultGroupNeeds: true },
  { name: 'Collections', to: '/collections', icon: Wallet, defaultGroupNeeds: true },
  { name: 'Transactions', to: '/transactions', icon: ScrollText, defaultGroupNeeds: true },
  { name: 'Loans', to: '/loans', icon: PiggyBank, defaultGroupNeeds: true },
  { name: 'Activities', to: '/activities', icon: ClipboardList, defaultGroupNeeds: true },
  { name: 'Resolutions', to: '/resolutions', icon: FileSignature, defaultGroupNeeds: true },
  { name: 'Notices', to: '/notices', icon: Send, defaultGroupNeeds: true },
];

export function Layout() {
  const { groups, activeGroupId, setActiveGroup } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="flex h-screen bg-app-bg text-app-text font-sans selection:bg-app-primary selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-app-card border-r-2 border-app-border p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <div className="w-8 h-8 bg-app-primary rounded-lg border-2 border-app-border shadow-bento-sm"></div>
          SHG Connect
        </div>

        <div className="flex flex-col gap-2">
          <div className="label-small mb-1">Active Group</div>
          <select 
            value={activeGroupId || ''} 
            onChange={(e) => setActiveGroup(e.target.value || null)}
            className="bento-select font-bold"
          >
            <option value="">-- Select Group --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 mt-2">
          <ul className="space-y-3">
            {navigation.map((item) => {
              if (item.defaultGroupNeeds && !activeGroupId) return null;
              
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl border-2 transition-all",
                      isActive 
                        ? "bg-app-border text-white border-app-border" 
                        : "bg-transparent border-transparent text-app-text hover:border-gray-200"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-app-muted")} />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-app-card border-b-2 border-app-border px-8 py-5 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            {activeGroup ? activeGroup.name : 'Welcome'}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
