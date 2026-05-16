import React, { createContext, useContext, useState, useEffect } from 'react';
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('shg_app_data');
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem('shg_app_data', JSON.stringify(state));
    } catch (e: any) {
      console.error('Failed to save to localStorage:', e);
      if (e && e.name === 'QuotaExceededError') {
        alert("Warning: Local storage quota exceeded! The application has run out of storage space. Your most recent changes could not be saved. Consider deleting some old records or lowering your data footprint.");
      }
    }
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
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
