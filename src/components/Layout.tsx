import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, ScrollText, PiggyBank, FileText, Send, Building, LogOut, FileSignature, ClipboardList, BarChart3, UserCircle2, Wifi, WifiOff, RefreshCw, CloudCheck, MessageSquare } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import type { Role } from '../types';
import { auth } from '../lib/firebase';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Groups', to: '/groups', icon: Building },
  { name: 'Constitution', to: '/constitution', icon: FileText, defaultGroupNeeds: true },
  { name: 'Members', to: '/members', icon: Users, defaultGroupNeeds: true },
  { name: 'Collections', to: '/collections', icon: Wallet, defaultGroupNeeds: true },
  { name: 'Transactions', to: '/transactions', icon: ScrollText, defaultGroupNeeds: true },
  { name: 'Loans', to: '/loans', icon: PiggyBank, defaultGroupNeeds: true },
  { name: 'Activities', to: '/activities', icon: ClipboardList, defaultGroupNeeds: true },
  { name: 'Resolutions', to: '/resolutions', icon: FileSignature, defaultGroupNeeds: true },
  { name: 'Notices', to: '/notices', icon: Send, defaultGroupNeeds: true },
  { name: 'Reports', to: '/reports', icon: BarChart3, defaultGroupNeeds: true },
  { name: 'Feedback', to: '/feedback', icon: MessageSquare },
];

export function Layout() {
  const { members, groups, activeGroupId, setActiveGroup, setCurrentUserId, setCurrentUserRole, currentUserRole, currentUserId, addMember } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Bootstrap Super Admin Member if missing
  useEffect(() => {
    if (currentUserRole === 'SUPER_ADMIN' && currentUserId && !members.find(m => m.id === currentUserId)) {
      addMember({
        id: currentUserId,
        groupId: 'GLOBAL',
        name: 'Super Admin',
        contact: auth.currentUser?.email || auth.currentUser?.phoneNumber || 'admin@admin.com',
        loginId: auth.currentUser?.email || 'admin',
        loginPassword: 'Encrypted',
        role: 'SUPER_ADMIN',
        status: 'active',
        joinDate: new Date().toISOString(),
        memberNumber: 'ADMIN-01'
      });
    }
  }, [currentUserRole, currentUserId, members, addMember]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch(err) {
      console.error(err);
    }
    setCurrentUserId(null);
    setCurrentUserRole('MEMBER');
  };

  return (
    <div className="flex bg-app-bg text-app-text font-sans selection:bg-app-primary selection:text-white print:block print:h-auto print:bg-white h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-app-card border-r border-app-border p-6 flex flex-col gap-8 shrink-0 overflow-y-auto print:hidden">
        <div className="flex items-center gap-3 font-semibold text-lg tracking-tight">
          {activeGroup?.logo ? (
            <img src={activeGroup.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-app-border bg-white shadow-sm shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-app-primary rounded-lg shadow-sm shrink-0 flex items-center justify-center">
               <Building className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
          )}
          <span className="truncate">{activeGroup ? activeGroup.name : 'SHG Connect'}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="label-small text-gray-400">Active Group</div>
          <select 
            value={activeGroupId || ''} 
            onChange={(e) => setActiveGroup(e.target.value || null)}
            className="bento-select font-medium text-sm"
          >
            <option value="">-- Select Group --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 mt-2">
          <ul className="space-y-1.5 print:hidden">
            {navigation.map((item) => {
              if (item.defaultGroupNeeds && !activeGroupId) return null;
              
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all border",
                      isActive 
                        ? "bg-app-primary text-white border-app-primary shadow-sm" 
                        : "bg-transparent border-transparent text-app-text hover:bg-slate-700/50"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-app-muted")} strokeWidth={1.5} />
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
      <div className="flex-1 overflow-hidden flex flex-col print:overflow-visible">
        <header className="bg-app-card border-b border-app-border px-8 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-app-text">
              {activeGroup ? activeGroup.name : 'Welcome'}
            </h2>
            <SyncIndicator />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-app-muted uppercase tracking-wider font-bold">Role:</span>
              <RoleDisplay />
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-red-400/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RoleDisplay() {
  const { currentUserRole, currentUserId, members } = useAppContext();
  const currentMember = members.find(m => m.id === currentUserId);

  return (
    <div className="flex items-center gap-2">
      <div className="py-1 px-3 text-xs font-bold bg-slate-800 text-orange-400 rounded-md border border-slate-700/50 shadow-inner select-none truncate">
        {currentUserRole ? currentUserRole.replace('_', ' ') : 'MEMBER'}
      </div>
      
      {currentMember && (
        <div className="py-1 px-3 text-xs font-semibold bg-slate-700/50 text-white rounded-md border border-slate-600/50 truncate max-w-[150px]" title={currentMember.name}>
          {currentMember.name}
        </div>
      )}
    </div>
  );
}

function SyncIndicator() {
  const { isOnline, syncStatus, pendingChanges } = useAppContext();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 text-xs font-medium" title={`${pendingChanges} pending changes. Saved locally. Will sync when online.`}>
        <WifiOff className="w-4 h-4" />
        <span>Offline {pendingChanges > 0 && `(${pendingChanges} pending)`}</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-xs font-medium">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-xs font-medium">
      {/* Assuming lucide-react doesn't have CloudCheck, fallback to a normal check or standard icon */}
      <Wifi className="w-4 h-4" />
      <span>Synced</span>
    </div>
  );
}

