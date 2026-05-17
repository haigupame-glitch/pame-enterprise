import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
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
      setState(prev => ({ ...prev, isOnline: true, syncStatus: 'syncing' }));
      
      // Simulate sync to server
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          syncStatus: 'synced',
          pendingChanges: 0 // Clear pending changes after "sync"
        }));
      }, 1500); 
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check on mount if online and has pending
    if (navigator.onLine && state.pendingChanges > 0 && isLoaded) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isLoaded]);

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
  
  const addGroup = (group: Group) => updateState({ groups: [...state.groups, group], activeGroupId: group.id });
  
  const addMember = (member: Member) => updateState({ members: [...state.members, member] });
  const updateMember = (member: Member) => updateState({ members: state.members.map(m => m.id === member.id ? member : m) });
  const deleteMember = (id: string) => updateState({ members: state.members.filter(m => m.id !== id) });

  const saveCollection = (col: Collection) => {
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

  const addTransaction = (t: Transaction) => updateState({ transactions: [...state.transactions, t] });
  const updateTransaction = (t: Transaction) => updateState({ transactions: state.transactions.map(tr => tr.id === t.id ? t : tr) });
  const deleteTransaction = (id: string) => updateState({ transactions: state.transactions.filter(t => t.id !== id) });
  
  const addLoan = (loan: Loan) => updateState({ loans: [...state.loans, loan] });
  const updateLoan = (loan: Loan) => updateState({ loans: state.loans.map(l => l.id === loan.id ? loan : l) });
  const deleteLoan = (id: string) => updateState({ loans: state.loans.filter(l => l.id !== id) });
  const addRepayment = (rep: LoanRepayment) => updateState({ loanRepayments: [...state.loanRepayments, rep] });
  const deleteRepayment = (id: string) => updateState({ loanRepayments: state.loanRepayments.filter(r => r.id !== id) });
  
  const addResolution = (res: Resolution) => updateState({ resolutions: [...state.resolutions, res] });
  const addNotice = (notice: Notice) => updateState({ notices: [...state.notices, notice] });
  const addActivity = (activity: Activity) => updateState({ activities: [...state.activities, activity] });
  const updateConstitution = (groupId: string, constitution: string) => {
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, constitution } : g)
    });
  };

  const updateGroup = (groupId: string, data: Partial<Group>) => {
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, ...data } : g)
    });
  };

  const deleteGroup = (groupId: string) => {
    updateState({
      groups: state.groups.filter(g => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? (state.groups.filter(g => g.id !== groupId)[0]?.id || null) : state.activeGroupId
    });
  };

  const updateGroupLogo = (groupId: string, logo: string) => {
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
