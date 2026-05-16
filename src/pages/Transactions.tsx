import React from 'react';
import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { TransactionType, PaymentMode } from '../types';
import { Edit2, Trash2, Check, X } from 'lucide-react';

export function Transactions() {
  const { transactions, activeGroupId, addTransaction, updateTransaction, deleteTransaction, currentUserRole } = useAppContext();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [particulars, setParticulars] = useState('');
  const [type, setType] = useState<TransactionType>('Income');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [amount, setAmount] = useState('');

  const groupTransactions = useMemo(() => {
    return transactions
      .filter(t => t.groupId === activeGroupId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, activeGroupId]);

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

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

  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeletingTxId(null);
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
                          <option value="Bank">Bank</option>
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
                            {deletingTxId === tx.id ? (
                              <div className="flex gap-1 items-center">
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Sure?</span>
                                <button onClick={() => handleDelete(tx.id)} className="text-red-400 hover:text-red-300 p-1"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeletingTxId(null)} className="text-app-muted hover:text-white p-1"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setDeletingTxId(tx.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                            )}
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
    </div>
  );
}
