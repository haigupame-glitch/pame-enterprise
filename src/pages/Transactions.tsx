import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { TransactionType, PaymentMode } from '../types';

export function Transactions() {
  const { transactions, activeGroupId, addTransaction, deleteTransaction } = useAppContext();
  
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

      <div className="bento-card !p-0 overflow-hidden">
        <div className="border-b-2 border-app-border bg-[#0b214f] py-4">
          <div className="text-yellow-400 text-center text-sm font-bold tracking-widest uppercase mb-0 card-header !mb-0 justify-center">
            TRANSACTION LEDGER
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="bento-table">
            <thead className="bg-[#d4dfb9]">
              <tr>
                <th scope="col" className="w-24">Date</th>
                <th scope="col" className="border-l-2 border-app-border">Particulars</th>
                <th scope="col" className="text-center border-l-2 border-app-border w-28">Type</th>
                <th scope="col" className="text-center border-l-2 border-app-border w-28">Payment Mode</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Pay in</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Pay out</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32">Cash in Hand</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-32 bg-gray-100">Cash in Bank</th>
                <th scope="col" className="text-right border-l-2 border-app-border w-40 bg-gray-100">Running Balance</th>
              </tr>
            </thead>
            <tbody className="bg-[#e2e8f0]">
              {groupTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="font-mono text-sm">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                  <td className="font-bold border-l border-gray-400">{tx.particulars}</td>
                  <td className="text-center border-l border-gray-400">
                    <span className="inline-flex px-2 py-0.5 rounded-md border border-app-border bg-white text-xs font-bold uppercase w-full justify-center">
                      {tx.type}
                    </span>
                  </td>
                  <td className="text-center border-l border-gray-400">
                    <span className="inline-flex px-2 py-0.5 rounded-md border border-app-border bg-white text-xs font-bold uppercase w-full justify-center">
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td className="text-right font-mono border-l border-gray-400 text-green-700">{tx.payIn > 0 ? formatCurrency(tx.payIn) : ''}</td>
                  <td className="text-right font-mono border-l border-gray-400 text-red-700">{tx.payOut > 0 ? formatCurrency(tx.payOut) : ''}</td>
                  <td className="text-right font-mono border-l border-gray-400">{formatCurrency(tx.cashInHand)}</td>
                  <td className="text-right font-mono border-l border-gray-400 bg-gray-100/50">{formatCurrency(tx.cashInBank)}</td>
                  <td className="text-right font-mono font-bold border-l border-gray-400 bg-gray-100">{formatCurrency(tx.runningBalance)}</td>
                </tr>
              ))}
              {groupTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-app-muted font-bold bg-white">
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
