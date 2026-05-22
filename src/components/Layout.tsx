import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, ScrollText, PiggyBank, FileText, Send, Building, LogOut, FileSignature, ClipboardList, BarChart3, UserCircle2, Wifi, WifiOff, RefreshCw, CloudCheck, MessageSquare } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import type { Role } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ConfirmDialog } from './ConfirmDialog';

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
  const { groups, activeGroupId, setActiveGroup, setCurrentUserId, setCurrentUserRole, members, currentUserId, deleteMember, pendingChanges } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (currentUserId && !activeGroupId) {
      const myMember = members.find(m => m.id === currentUserId);
      if (myMember && myMember.groupId) {
        setActiveGroup(myMember.groupId);
      } else if (groups.length > 0) {
        // Fallback for isolated admins without membership links
        // but prefer linking them to a group
        const myCreatedGroup = groups.find(g => g.id === currentUserId || true); // fallback is risky
      }
    }
  }, [currentUserId, activeGroupId, members, groups, setActiveGroup]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch(err) {
      console.error(err);
    }
    setCurrentUserId(null);
    setCurrentUserRole('MEMBER');
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    if (!currentUserId) return;

    // Remove locally first
    deleteMember(currentUserId);
    
    try {
      // Force an immediate synchronous write to bypass debounce timers
      // and ensure data is erased before Auth is revoked.
      const newMembers = members.filter(m => m.id !== currentUserId);
      await setDoc(doc(db, 'appStore', 'globalState_v3_967c2d0c'), {
        members: newMembers,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch(err: any) {
      const errorString = String(err).toLowerCase();
      if (!errorString.includes('permission-denied') && !errorString.includes('missing or insufficient permissions')) {
        console.error("Account data delete error:", err);
      }
    }

    try {
      const user = auth.currentUser;
      if (user) {
        try {
          await user.delete();
        } catch(authErr) {
          console.warn("Failed to delete from Firebase Auth, might require recent login.", authErr);
          // If we fail here, at least we've removed the member from the app data tree.
          await auth.signOut();
        }
      } else {
        await auth.signOut();
      }
    } catch(e) {
      console.warn("Sign out failed", e);
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
          <div className="font-medium text-sm px-3 py-2 bg-slate-800/50 rounded-lg text-slate-200 border border-slate-700">
            {activeGroup ? activeGroup.name : 'Unknown Group'}
          </div>
        </div>

        <nav className="flex-1 mt-2">
          <ul className="space-y-1.5 print:hidden">
            {navigation.map((item) => {
              if (item.defaultGroupNeeds && !activeGroup) return null;
              
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
        
        <div className="mt-auto pt-4 text-xs text-slate-500 flex flex-col gap-1 print:hidden">
          <a href="/privacy-policy" className="hover:text-slate-300 transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="/terms-of-service" className="hover:text-slate-300 transition-colors" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        </div>
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
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-lg transition-colors border border-orange-400/20"
              title="Delete Account"
            >
              Delete Account
            </button>
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Account"
        message="Are you sure you want to delete your account permanently? This action cannot be undone."
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
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

