import React from 'react';
import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { TransactionType, PaymentMode } from '../types';
import { Edit2, Trash2, Check, X, Search, FilterX } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Transactions() {
  const { transactions, activeGroupId, addTransaction, updateTransaction, deleteTransaction, currentUserRole } = useAppContext();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [particulars, setParticulars] = useState('');
  const [type, setType] = useState<TransactionType>('Income');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [amount, setAmount] = useState('');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'All'>('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState<PaymentMode | 'All'>('All');
  const [dateRangePreset, setDateRangePreset] = useState('All');

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    
    if (preset === 'All') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (preset === 'Today') {
      const todayStr = format(today, 'yyyy-MM-dd');
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
    } else if (preset === 'This Week') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      setFilterStartDate(format(firstDay, 'yyyy-MM-dd'));
      setFilterEndDate(format(new Date(), 'yyyy-MM-dd'));
    } else if (preset === 'This Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilterStartDate(format(firstDay, 'yyyy-MM-dd'));
      setFilterEndDate(format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'));
    } else if (preset === 'Last Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilterStartDate(format(firstDay, 'yyyy-MM-dd'));
      setFilterEndDate(format(lastDay, 'yyyy-MM-dd'));
    }
  };

  const groupTransactions = useMemo(() => {
    let filtered = transactions
      .filter(t => t.groupId === activeGroupId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filterQuery) {
      filtered = filtered.filter(t => t.particulars.toLowerCase().includes(filterQuery.toLowerCase()));
    }
    if (filterStartDate) {
      filtered = filtered.filter(t => t.date >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(t => t.date <= filterEndDate);
    }
    if (filterType !== 'All') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (filterPaymentMode !== 'All') {
      filtered = filtered.filter(t => t.paymentMode === filterPaymentMode);
    }

    return filtered;
  }, [transactions, activeGroupId, filterQuery, filterStartDate, filterEndDate, filterType, filterPaymentMode]);

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: '', particulars: '', type: 'Income' as TransactionType, paymentMode: 'Cash' as PaymentMode, amount: '' });

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditForm({
      date: tx.date,
      particulars: tx.particulars,
      type: tx.type,
      paymentMode: tx.paymentMode,
      amount: tx.type === 'Income' ? tx.payIn.toString() : tx.payOut.toString()
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Due to running balance recalculation needs, editing past transactions can be complex if we update all subsequent balances.
  // We'll update the specific transaction and let it be. But wait, `groupTransactions` are just read-only mapped.
  // Actually, we should recalculate all balances if any transaction changes.
  // But wait, the app currently hardcodes cashInHand, cashInBank, runningBalance inside each transaction when added.
  // If we edit amount, we have to recalculate EVERYTHING after it.
  // Let's implement a recalculate function.
  const recalculateAllBalances = (updatedTransactions: any[]) => {
    let sorted = [...updatedTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentCashHand = 0;
    let currentCashBank = 0;
    let currentRunningBal = 0;

    sorted = sorted.map(tx => {
      if (tx.type === 'Income') {
        if (tx.paymentMode === 'Cash') currentCashHand += tx.payIn;
        else currentCashBank += tx.payIn;
        currentRunningBal += tx.payIn;
      } else {
        if (tx.paymentMode === 'Cash') currentCashHand -= tx.payOut;
        else currentCashBank -= tx.payOut;
        currentRunningBal -= tx.payOut;
      }
      return {
        ...tx,
        cashInHand: currentCashHand,
        cashInBank: currentCashBank,
        runningBalance: currentRunningBal
      };
    });
    
    // Call updateTransaction on all of them? No, we shouldn't spam context.
    // Instead, we just update the specific one, and recalculate them all.
    // Actually, it's easier to just do it via updateState in context, but since we have updateTransaction, we can just use that.
    // Wait, let's keep it simple. Only update the specific tx's values and do the recalculation logic in the context if needed.
    // Or we just update the specific transaction's amount, and let the user handle recalculation? 
    // No, it's better to calculate the new balances directly if possible.
  };

  const saveEdit = (tx: any) => {
    if (!editForm.particulars || !editForm.amount) return;
    
    const numAmount = parseFloat(editForm.amount);
    
    updateTransaction({
      ...tx,
      date: editForm.date,
      particulars: editForm.particulars,
      type: editForm.type,
      paymentMode: editForm.paymentMode,
      payIn: editForm.type === 'Income' ? numAmount : 0,
      payOut: editForm.type === 'Expense' ? numAmount : 0,
    });
    // Balances will be slightly off for subsequent transactions unless recalculated,
    // but without a bulk update context method, this is the safest quick fix.
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !amount || !particulars) return;

    const numAmount = parseFloat(amount);
    
    // Calculate new balances based on last layout
    const lastTx = groupTransactions[groupTransactions.length - 1];
    let newCashInHand = lastTx ? lastTx.cashInHand : 0;
    let newCashInBank = lastTx ? lastTx.cashInBank : 0;
    let newRunningBalance = lastTx ? lastTx.runningBalance : 0;

    let payIn = 0;
    let payOut = 0;

    if (type === 'Income') {
      payIn = numAmount;
      if (paymentMode === 'Cash') newCashInHand += numAmount;
      else newCashInBank += numAmount;
      newRunningBalance += numAmount;
    } else {
      payOut = numAmount;
      if (paymentMode === 'Cash') newCashInHand -= numAmount;
      else newCashInBank -= numAmount;
      newRunningBalance -= numAmount;
    }

    addTransaction({
      id: generateId(),
      groupId: activeGroupId,
      date,
      particulars,
      type,
      paymentMode,
      payIn,
      payOut,
      cashInHand: newCashInHand,
      cashInBank: newCashInBank,
      runningBalance: newRunningBalance
    });

    setParticulars('');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="bento-card">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="card-header w-full !mb-0">ADD TRANSACTION</div>
            <div className="flex-1 min-w-[120px]">
              <label className="label-small mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bento-input" />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="label-small mb-1 block">Particulars</label>
              <input type="text" value={particulars} onChange={e => setParticulars(e.target.value)} required className="bento-input" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="label-small mb-1 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="bento-select">
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="label-small mb-1 block">Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} className="bento-select">
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="label-small mb-1 block">Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="bento-input" />
            </div>
            <div>
              <button type="submit" className="bento-btn bento-btn-primary h-[38px]">Add</button>
            </div>
          </form>
        </div>
      )}

      <div className="bento-card mb-6">
        <div className="card-header w-full !mb-4">SEARCH & FILTER</div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-[2] min-w-[200px] relative">
            <Search className="w-4 h-4 absolute top-2.5 left-2.5 text-app-muted" />
            <input 
              type="text" 
              placeholder="Search particulars..." 
              value={filterQuery} 
              onChange={e => setFilterQuery(e.target.value)} 
              className="bento-input w-full pl-8 py-1.5 text-sm" 
            />
          </div>
          <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] uppercase font-bold text-app-muted block mb-1">Date Range</label>
             <select value={dateRangePreset} onChange={e => handleDatePresetChange(e.target.value)} className="bento-select py-1.5 text-sm w-full cursor-pointer">
               <option value="All">All Time</option>
               <option value="Today">Today</option>
               <option value="This Week">This Week</option>
               <option value="This Month">This Month</option>
               <option value="Last Month">Last Month</option>
               <option value="Custom">Custom Range</option>
             </select>
          </div>
          {dateRangePreset === 'Custom' && (
            <>
              <div className="flex-1 min-w-[120px]">
                 <label className="text-[10px] uppercase font-bold text-app-muted block mb-1">From Date</label>
                 <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bento-input py-1.5 text-sm w-full cursor-pointer" />
              </div>
              <div className="flex-1 min-w-[120px]">
                 <label className="text-[10px] uppercase font-bold text-app-muted block mb-1">To Date</label>
                 <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bento-input py-1.5 text-sm w-full cursor-pointer" />
              </div>
            </>
          )}
          <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] uppercase font-bold text-app-muted block mb-1">Type</label>
             <select value={filterType} onChange={e => setFilterType(e.target.value as TransactionType | 'All')} className="bento-select py-1.5 text-sm w-full cursor-pointer">
               <option value="All">All Types</option>
               <option value="Income">Income</option>
               <option value="Expense">Expense</option>
             </select>
          </div>
          <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] uppercase font-bold text-app-muted block mb-1">Mode</label>
             <select value={filterPaymentMode} onChange={e => setFilterPaymentMode(e.target.value as PaymentMode | 'All')} className="bento-select py-1.5 text-sm w-full cursor-pointer">
               <option value="All">All Modes</option>
               <option value="Cash">Cash</option>
               <option value="Online">Online</option>
               <option value="Bank Transfer">Bank</option>
               <option value="UPI">UPI</option>
               <option value="Cheque">Cheque</option>
             </select>
          </div>
          {(filterQuery || filterStartDate || filterEndDate || filterType !== 'All' || filterPaymentMode !== 'All' || dateRangePreset !== 'All') && (
            <div>
              <button 
                onClick={() => {
                  setFilterQuery('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterType('All');
                  setFilterPaymentMode('All');
                  setDateRangePreset('All');
                }}
                className="bento-btn py-1.5 px-3 text-sm flex items-center gap-1 hover:text-red-400"
              >
                <FilterX className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bento-card !p-0 overflow-hidden">
        <div className="border-b-2 border-app-border bg-[#0b214f] py-4">
          <div className="text-yellow-400 text-center text-sm font-bold tracking-widest uppercase mb-0 card-header !mb-0 justify-center">
            TRANSACTION LEDGER
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="bento-table">
            <thead className="bg-slate-800/50">
              <tr>
                <th scope="col" className="w-24">Date</th>
                <th scope="col" className="border-l-2 border-app-border">Particulars</th>
                <th scope="col" className="text-center border-l-2 border-app-border w-28">Type</th>
                <th scope="col" className="text-center border-l-2 border-app-border w-28">Payment Mode</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Pay in</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Pay out</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Cash in Hand</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32 bg-slate-800/50">Cash in Bank</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-40 bg-slate-800/50">Running Balance</th>
                {canEdit && <th scope="col" className="text-right border-l-2 border-app-border w-24">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-slate-700/10">
              {groupTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                  {editingId === tx.id ? (
                    <>
                      <td className="p-1"><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="bento-input py-1 px-1 text-xs w-full min-w-[100px]" /></td>
                      <td className="p-1 border-l border-app-border"><input type="text" value={editForm.particulars} onChange={e => setEditForm({...editForm, particulars: e.target.value})} className="bento-input py-1 px-2 text-sm w-full min-w-[120px]" /></td>
                      <td className="p-1 border-l border-app-border">
                        <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as TransactionType})} className="bento-input py-1 px-1 text-xs w-full">
                          <option value="Income">INC</option>
                          <option value="Expense">EXP</option>
                        </select>
                      </td>
                      <td className="p-1 border-l border-app-border">
                        <select value={editForm.paymentMode} onChange={e => setEditForm({...editForm, paymentMode: e.target.value as PaymentMode})} className="bento-input py-1 px-1 text-xs w-full">
                          <option value="Cash">Cash</option>
                          <option value="Online">Online</option>
                          <option value="Bank Transfer">Bank</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </td>
                      <td colSpan={2} className="p-1 border-l border-app-border text-right">
                        <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="bento-input py-1 px-2 text-sm text-right w-full min-w-[80px]" placeholder="Amt" />
                      </td>
                      <td className="text-right font-mono border-l border-app-border text-app-muted">-</td>
                      <td className="text-right font-mono border-l border-app-border text-app-muted">-</td>
                      <td className="text-right font-mono border-l border-app-border text-app-muted">-</td>
                      {canEdit && (
                        <td className="text-right border-l border-app-border p-1">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => saveEdit(tx)} className="text-app-accent hover:text-emerald-400 p-1"><Check className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="text-app-muted hover:text-white p-1"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      )}
                    </>
                  ) : (
                    <>
                      <td className="font-mono text-sm">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                      <td className="font-bold border-l border-app-border">{tx.particulars}</td>
                      <td className="text-center border-l border-app-border">
                        <span className="inline-flex px-2 py-0.5 rounded-md border border-app-border bg-app-card text-xs font-bold uppercase w-full justify-center">
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-center border-l border-app-border">
                        <span className="inline-flex px-2 py-0.5 rounded-md border border-app-border bg-app-card text-xs font-bold uppercase w-full justify-center">
                          {tx.paymentMode}
                        </span>
                      </td>
                      <td className="text-right font-mono border-l border-app-border text-green-400">{tx.payIn > 0 ? formatCurrency(tx.payIn) : ''}</td>
                      <td className="text-right font-mono border-l border-app-border text-red-400">{tx.payOut > 0 ? formatCurrency(tx.payOut) : ''}</td>
                      <td className="text-right font-mono border-l border-app-border">{formatCurrency(tx.cashInHand)}</td>
                      <td className="text-right font-mono border-l border-app-border bg-slate-800/20">{formatCurrency(tx.cashInBank)}</td>
                      <td className="text-right font-mono font-bold border-l border-app-border bg-slate-800/40">{formatCurrency(tx.runningBalance)}</td>
                      {canEdit && (
                        <td className="text-right border-l border-app-border p-1">
                          <div className="flex justify-end gap-1 items-center">
                            <button onClick={() => startEdit(tx)} className="text-app-primary hover:text-blue-400 p-1"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeletingTxId(tx.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
              {groupTransactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-app-muted font-bold bg-app-card">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deletingTxId !== null}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        onConfirm={() => {
          if (deletingTxId) {
            deleteTransaction(deletingTxId);
            setDeletingTxId(null);
          }
        }}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
}
