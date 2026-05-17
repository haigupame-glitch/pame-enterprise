import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Group, Member, Collection, Transaction, Loan, LoanRepayment, Resolution, Notice, Activity, Role } from '../types';

interface AppState {
  groups: Group[];
  members: Member[];
  collections: Collection[];
  transactions: Transaction[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  resolutions: Resolution[];
  notices: Notice[];
  activities: Activity[];
  activeGroupId: string | null;
  currentUserRole: Role;
  currentUserId: string | null;
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  pendingChanges: number;
}

interface AppContextType extends AppState {
  setCurrentUserRole: (role: Role) => void;
  setCurrentUserId: (id: string | null) => void;
  setActiveGroup: (id: string | null) => void;
  addGroup: (group: Group) => void;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  saveCollection: (collection: Collection) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (loan: Loan) => void;
  deleteLoan: (id: string) => void;
  addRepayment: (repayment: LoanRepayment) => void;
  deleteRepayment: (id: string) => void;
  addResolution: (resolution: Resolution) => void;
  addNotice: (notice: Notice) => void;
  addActivity: (activity: Activity) => void;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  updateConstitution: (groupId: string, constitution: string) => void;
  updateGroupLogo: (groupId: string, logo: string) => void;
}

const defaultState: AppState = {
  groups: [],
  members: [],
  collections: [],
  transactions: [],
  loans: [],
  loanRepayments: [],
  resolutions: [],
  notices: [],
  activities: [],
  activeGroupId: null,
  currentUserRole: 'SUPER_ADMIN',
  currentUserId: null,
  isOnline: navigator.onLine,
  syncStatus: navigator.onLine ? 'synced' : 'offline',
  pendingChanges: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localforage instead of localStorage, fallback to localStorage if needed initially
    async function loadState() {
      try {
        let savedState: any = await localforage.getItem('shg_app_data');
        if (!savedState) {
          // Check localStorage for migration
          const legacySaved = localStorage.getItem('shg_app_data');
          if (legacySaved) {
            savedState = JSON.parse(legacySaved);
            localStorage.removeItem('shg_app_data'); // cleanup after migration
          }
        }
        if (savedState) {
          // Always ensure current network status is true to real world, overwrite the saved states for them
          setState({ ...defaultState, ...savedState, isOnline: navigator.onLine, syncStatus: navigator.onLine ? 'synced' : 'offline', pendingChanges: savedState.pendingChanges || 0 });
        }
      } catch (e) {
        console.error('Failed to parse saved data', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadState();
  }, []);

  // Network listeners
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore sync: PULL
  useEffect(() => {
    if (!isLoaded) return;
    
    let unsubscribeSnapshot: (() => void) | undefined;
    
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        // Subscribe to firestore
        unsubscribeSnapshot = onSnapshot(doc(db, 'appStore', 'globalState'), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
            const data = snapshot.data() as any;
            setState(prev => ({
              ...prev,
              groups: data.groups || prev.groups,
              members: data.members || prev.members,
              collections: data.collections || prev.collections,
              transactions: data.transactions || prev.transactions,
              loans: data.loans || prev.loans,
              loanRepayments: data.loanRepayments || prev.loanRepayments,
              resolutions: data.resolutions || prev.resolutions,
              notices: data.notices || prev.notices,
              activities: data.activities || prev.activities,
            }));
          } else if (!snapshot.exists()) {
            // Document does not exist yet! If we have any local data, trigger a push.
            setState(prev => {
              const hasData = prev.groups.length > 0 || prev.members.length > 0;
              if (hasData) {
                return { ...prev, pendingChanges: prev.pendingChanges + 1 };
              }
              return prev;
            });
          }
        }, (error) => {
          console.error("Firestore sync error:", error);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [isLoaded]);

  // Firestore sync: PUSH
  useEffect(() => {
    if (isLoaded && state.isOnline && state.pendingChanges > 0) {
      if (!auth.currentUser) return; // Only push if authenticated
      
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));
      const payload = {
        groups: state.groups,
        members: state.members,
        collections: state.collections,
        transactions: state.transactions,
        loans: state.loans,
        loanRepayments: state.loanRepayments,
        resolutions: state.resolutions,
        notices: state.notices,
        activities: state.activities,
        updatedAt: new Date().toISOString()
      };
      
      setDoc(doc(db, 'appStore', 'globalState'), payload, { merge: true })
        .then(() => {
          setState(prev => ({ ...prev, pendingChanges: 0, syncStatus: 'synced' }));
        })
        .catch(err => {
          console.error('Sync failed', err);
          setState(prev => ({ ...prev, syncStatus: 'offline' }));
        });
    }
  }, [
    isLoaded, 
    state.isOnline, 
    state.pendingChanges, 
    state.groups, 
    state.members, 
    state.collections, 
    state.transactions, 
    state.loans, 
    state.loanRepayments, 
    state.resolutions, 
    state.notices, 
    state.activities
  ]);

  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('shg_app_data', state).catch(e => {
        console.error('Failed to save to localforage:', e);
      });
    }
  }, [state, isLoaded]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => {
      const isMutation = Object.keys(updates).some(key => 
        !['activeGroupId', 'currentUserRole', 'currentUserId', 'isOnline', 'syncStatus', 'pendingChanges'].includes(key)
      );
      
      const newState = { ...prev, ...updates };
      
      if (isMutation && !prev.isOnline) {
        newState.pendingChanges = prev.pendingChanges + 1;
      }
      
      return newState;
    });
  };

  const setCurrentUserRole = (role: Role) => updateState({ currentUserRole: role });
  const setCurrentUserId = (id: string | null) => updateState({ currentUserId: id });

  const setActiveGroup = (id: string | null) => updateState({ activeGroupId: id });
  
  const enforceSuperAdmin = () => state.currentUserRole === 'SUPER_ADMIN';
  const enforceAdminOrAbove = () => state.currentUserRole === 'SUPER_ADMIN' || state.currentUserRole === 'ADMIN';

  const addGroup = (group: Group) => {
    if (!enforceSuperAdmin()) return;
    updateState({ groups: [...state.groups, group], activeGroupId: group.id });
  };
  
  const addMember = (member: Member) => {
    if (!enforceAdminOrAbove()) return;
    if (!enforceSuperAdmin()) member.role = 'MEMBER';
    updateState({ members: [...state.members, member] });
  };
  
  const updateMember = (member: Member) => {
    const isSelf = state.currentUserId === member.id;
    if (!enforceAdminOrAbove() && !isSelf) return;
    
    // Protect role/auth assignment (only SUPER_ADMIN can change these)
    if (!enforceSuperAdmin()) {
      const oldMember = state.members.find(m => m.id === member.id);
      if (oldMember) {
        member.role = oldMember.role;
        member.loginId = oldMember.loginId;
        member.loginPassword = oldMember.loginPassword;
      }
    }
    
    updateState({ members: state.members.map(m => m.id === member.id ? member : m) });
  };
  
  const deleteMember = (id: string) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ members: state.members.filter(m => m.id !== id) });
  };

  const saveCollection = (col: Collection) => {
    if (!enforceAdminOrAbove()) return;
    const existingIndex = state.collections.findIndex(
      c => c.groupId === col.groupId && c.memberId === col.memberId && c.year === col.year && c.month === col.month
    );
    if (existingIndex >= 0) {
      const newCols = [...state.collections];
      newCols[existingIndex] = col;
      updateState({ collections: newCols });
    } else {
      updateState({ collections: [...state.collections, col] });
    }
  };

  const addTransaction = (t: Transaction) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ transactions: [...state.transactions, t] });
  };
  const updateTransaction = (t: Transaction) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ transactions: state.transactions.map(tr => tr.id === t.id ? t : tr) });
  };
  const deleteTransaction = (id: string) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ transactions: state.transactions.filter(t => t.id !== id) });
  };
  
  const addLoan = (loan: Loan) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ loans: [...state.loans, loan] });
  };
  const updateLoan = (loan: Loan) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ loans: state.loans.map(l => l.id === loan.id ? loan : l) });
  };
  const deleteLoan = (id: string) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ loans: state.loans.filter(l => l.id !== id) });
  };
  const addRepayment = (rep: LoanRepayment) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ loanRepayments: [...state.loanRepayments, rep] });
  };
  const deleteRepayment = (id: string) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ loanRepayments: state.loanRepayments.filter(r => r.id !== id) });
  };
  
  const addResolution = (res: Resolution) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ resolutions: [...state.resolutions, res] });
  };
  const addNotice = (notice: Notice) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ notices: [...state.notices, notice] });
  };
  const addActivity = (activity: Activity) => {
    if (!enforceAdminOrAbove()) return;
    updateState({ activities: [...state.activities, activity] });
  };
  
  const updateConstitution = (groupId: string, constitution: string) => {
    if (!enforceSuperAdmin()) return;
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, constitution } : g)
    });
  };

  const updateGroup = (groupId: string, data: Partial<Group>) => {
    if (!enforceSuperAdmin()) return;
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, ...data } : g)
    });
  };

  const deleteGroup = (groupId: string) => {
    if (!enforceSuperAdmin()) return;
    updateState({
      groups: state.groups.filter(g => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? (state.groups.filter(g => g.id !== groupId)[0]?.id || null) : state.activeGroupId
    });
  };

  const updateGroupLogo = (groupId: string, logo: string) => {
    if (!enforceSuperAdmin()) return;
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, logo } : g)
    });
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading data...</div>;
  }

  return (
    <AppContext.Provider value={{
      ...state,
      setCurrentUserRole,
      setCurrentUserId,
      setActiveGroup,
      addGroup,
      addMember,
      updateMember,
      deleteMember,
      saveCollection,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addLoan,
      updateLoan,
      deleteLoan,
      addRepayment,
      deleteRepayment,
      addResolution,
      addNotice,
      addActivity,
      updateGroup,
      deleteGroup,
      updateConstitution,
      updateGroupLogo
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
