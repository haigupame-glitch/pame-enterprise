import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Group, Member, Collection, Transaction, Loan, LoanRepayment, Resolution, Notice, Activity } from '../types';

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
}

interface AppContextType extends AppState {
  setActiveGroup: (id: string | null) => void;
  addGroup: (group: Group) => void;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  saveCollection: (collection: Collection) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Loan) => void;
  addRepayment: (repayment: LoanRepayment) => void;
  addResolution: (resolution: Resolution) => void;
  addNotice: (notice: Notice) => void;
  addActivity: (activity: Activity) => void;
  updateConstitution: (groupId: string, constitution: string) => void;
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
    localStorage.setItem('shg_app_data', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

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
  const deleteTransaction = (id: string) => updateState({ transactions: state.transactions.filter(t => t.id !== id) });
  
  const addLoan = (loan: Loan) => updateState({ loans: [...state.loans, loan] });
  const addRepayment = (rep: LoanRepayment) => updateState({ loanRepayments: [...state.loanRepayments, rep] });
  
  const addResolution = (res: Resolution) => updateState({ resolutions: [...state.resolutions, res] });
  const addNotice = (notice: Notice) => updateState({ notices: [...state.notices, notice] });
  const addActivity = (activity: Activity) => updateState({ activities: [...state.activities, activity] });
  const updateConstitution = (groupId: string, constitution: string) => {
    updateState({
      groups: state.groups.map(g => g.id === groupId ? { ...g, constitution } : g)
    });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setActiveGroup,
      addGroup,
      addMember,
      updateMember,
      deleteMember,
      saveCollection,
      addTransaction,
      deleteTransaction,
      addLoan,
      addRepayment,
      addResolution,
      addNotice,
      addActivity,
      updateConstitution
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
