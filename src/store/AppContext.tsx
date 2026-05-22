import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import type { Group, Member, Collection, Transaction, Loan, LoanRepayment, Resolution, Notice, Activity, Role, Feedback } from '../types';

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
  feedbacks: Feedback[];
  activeGroupId: string | null;
  currentUserRole: Role | null;
  currentUserId: string | null;
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  pendingChanges: number;
}

interface AppContextType extends AppState {
  setCurrentUserRole: (role: Role | null) => void;
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
  updateRepayment: (repayment: LoanRepayment) => void;
  deleteRepayment: (id: string) => void;
  addResolution: (resolution: Resolution) => void;
  addNotice: (notice: Notice) => void;
  addActivity: (activity: Activity) => void;
  addFeedback: (feedback: Feedback) => void;
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
  feedbacks: [],
  activeGroupId: null,
  currentUserRole: null,
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
        let savedState: any = null;
        try {
          let timeoutId: NodeJS.Timeout;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Timeout loading localforage')), 3000);
          });
          // Attach a dummy catch to prevent UnhandledPromiseRejection if it rejects later
          timeoutPromise.catch(() => {});
          
          try {
            savedState = await Promise.race([
              localforage.getItem('shg_app_data_v2'),
              timeoutPromise
            ]);
          } finally {
            clearTimeout(timeoutId!);
          }
        } catch (e) {
          console.warn('localforage load failed or timed out', e);
        }
        
        if (!savedState) {
          // Check localStorage for migration
          const legacySaved = localStorage.getItem('shg_app_data_v2');
          if (legacySaved) {
            savedState = JSON.parse(legacySaved);
            localStorage.removeItem('shg_app_data_v2'); // cleanup after migration
          }
        }
        if (savedState) {
          // Always ensure current network status is true to real world, overwrite the saved states for them
          setState({ ...defaultState, ...savedState, isOnline: navigator.onLine, syncStatus: navigator.onLine ? 'synced' : 'offline', pendingChanges: savedState.pendingChanges || 0 });
        }
      } catch (e) {
        console.error('Failed to parse saved data or timeout', e);
        // If it hangs, we'll hit this and just use default state
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
        unsubscribeSnapshot = onSnapshot(doc(db, 'appStore', 'globalState_967c2d0c'), { includeMetadataChanges: true }, (snapshot) => {
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
              feedbacks: data.feedbacks || prev.feedbacks,
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
        }, (error: any) => {
          const errorString = String(error).toLowerCase();
          if (!errorString.includes('permission-denied') && !errorString.includes('missing or insufficient permissions')) {
            console.error("Firestore sync error:", error);
          }
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
      
      const timer = setTimeout(() => {
        if (!auth.currentUser) {
           setState(prev => ({ ...prev, pendingChanges: 0, syncStatus: 'synced' }));
           return;
        }
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
          feedbacks: state.feedbacks,
          updatedAt: new Date().toISOString()
        };
        
        setDoc(doc(db, 'appStore', 'globalState_967c2d0c'), payload, { merge: true })
          .then(() => {
            setState(prev => ({ ...prev, pendingChanges: 0, syncStatus: 'synced' }));
          })
          .catch(err => {
            const errorString = String(err).toLowerCase();
            if (errorString.includes('permission-denied') || errorString.includes('missing or insufficient permissions')) {
               // We just signed out or got removed. Clear pending changes and avoid logging an error gracefully.
               setState(prev => ({ ...prev, pendingChanges: 0, syncStatus: 'offline' }));
            } else {
               console.error('Sync failed', err);
               setState(prev => ({ ...prev, syncStatus: 'offline' }));
            }
          });
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timer);
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
    state.activities,
    state.feedbacks
  ]);

  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('shg_app_data_v2', state).catch(e => {
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
      
      if (isMutation) {
        newState.pendingChanges = prev.pendingChanges + 1;
      }
      
      return newState;
    });
  };

  const setCurrentUserRole = (role: Role | null) => updateState({ currentUserRole: role });
  const setCurrentUserId = (id: string | null) => updateState({ currentUserId: id });

  const setActiveGroup = (id: string | null) => updateState({ activeGroupId: id });
  
  const enforceSuperAdmin = () => state.currentUserRole === 'SUPER_ADMIN';
  const enforceAdminOrAbove = () => state.currentUserRole === 'SUPER_ADMIN' || state.currentUserRole === 'ADMIN';
  const enforceTreasurerOrAbove = () => state.currentUserRole === 'SUPER_ADMIN' || state.currentUserRole === 'ADMIN' || state.currentUserRole === 'TREASURER';

  const addGroup = (group: Group) => {
    // If they already have a group and aren't SUPER_ADMIN, block. But if they're grouped we allow Super admin.
    // If they have NO group (e.g. new user), allow them to create a group!
    const currentUser = state.currentUserId ? state.members.find(m => m.id === state.currentUserId) : null;
    const isNewUserWithoutGroup = currentUser && (!currentUser.groupId || currentUser.groupId === 'PENDING' || currentUser.groupId === '');
    
    if (state.groups.length > 0 && !enforceSuperAdmin() && !isNewUserWithoutGroup) return;
    
    updateState({ groups: [...state.groups, group], activeGroupId: group.id });
    
    // If the current user doesn't have a group, update them to this newly created group and make them ADMIN
    if (isNewUserWithoutGroup) {
       const updatedMembers = state.members.map(m => 
          m.id === state.currentUserId ? { ...m, groupId: group.id, role: 'ADMIN' as Role } : m
       );
       updateState({ members: updatedMembers, currentUserRole: 'ADMIN' });
    }
  };
  
  const addMember = (member: Member) => {
    if (state.members.length > 0 && !enforceAdminOrAbove()) return;
    if (state.members.length > 0 && !enforceAdminOrAbove()) member.role = 'MEMBER';
    updateState({ members: [...state.members, member] });
  };
  
  const updateMember = (member: Member) => {
    const isSelf = state.currentUserId === member.id;
    if (!enforceAdminOrAbove() && !isSelf) return;
    
    // Protect role/auth assignment (only SUPER_ADMIN/ADMIN can change these)
    if (!enforceAdminOrAbove()) {
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
    const isSelf = state.currentUserId === id;
    if (!enforceAdminOrAbove() && !isSelf) return;
    updateState({ members: state.members.filter(m => m.id !== id) });
  };

  const saveCollection = (col: Collection) => {
    if (!enforceTreasurerOrAbove()) return;
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
    if (!enforceTreasurerOrAbove()) return;
    updateState({ transactions: [...state.transactions, t] });
  };
  const updateTransaction = (t: Transaction) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ transactions: state.transactions.map(tr => tr.id === t.id ? t : tr) });
  };
  const deleteTransaction = (id: string) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ transactions: state.transactions.filter(t => t.id !== id) });
  };
  
  const addLoan = (loan: Loan) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loans: [...state.loans, loan] });
  };
  const updateLoan = (loan: Loan) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loans: state.loans.map(l => l.id === loan.id ? loan : l) });
  };
  const deleteLoan = (id: string) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loans: state.loans.filter(l => l.id !== id) });
  };
  const addRepayment = (rep: LoanRepayment) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loanRepayments: [...state.loanRepayments, rep] });
  };
  const updateRepayment = (rep: LoanRepayment) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loanRepayments: state.loanRepayments.map(r => r.id === rep.id ? rep : r) });
  };
  const deleteRepayment = (id: string) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ loanRepayments: state.loanRepayments.filter(r => r.id !== id) });
  };
  
  const addResolution = (res: Resolution) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ resolutions: [...state.resolutions, res] });
  };
  const addNotice = (notice: Notice) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ notices: [...state.notices, notice] });
  };
  const addActivity = (activity: Activity) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({ activities: [...state.activities, activity] });
  };
  
  const addFeedback = (feedback: Feedback) => {
    updateState({ feedbacks: [...state.feedbacks, feedback] });
  };
  
  const updateConstitution = (groupId: string, constitution: string) => {
    if (!enforceTreasurerOrAbove()) return;
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, constitution } : g)
    });
  };

  const updateGroup = (groupId: string, data: Partial<Group>) => {
    if (!enforceTreasurerOrAbove()) return;
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
    if (!enforceTreasurerOrAbove()) return;
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
      updateRepayment,
      deleteRepayment,
      addResolution,
      addNotice,
      addActivity,
      addFeedback,
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
