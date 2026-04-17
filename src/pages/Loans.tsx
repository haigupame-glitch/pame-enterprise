import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function Loans() {
  const { loans, loanRepayments, members, activeGroupId, addLoan, addRepayment } = useAppContext();
  
  const [memberId, setMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('2'); // typically SHG uses 1-3% per month
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [repayPrincipal, setRepayPrincipal] = useState('');
  const [repayInterest, setRepayInterest] = useState('');
  const [repayDate, setRepayDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const groupLoans = loans.filter(l => l.groupId === activeGroupId);
  const groupMembers = members.filter(m => m.groupId === activeGroupId);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !memberId || !principal || !interestRate) return;
    
    addLoan({
      id: generateId(),
      groupId: activeGroupId,
      memberId,
      principal: parseFloat(principal),
      interestRate: parseFloat(interestRate),
      issueDate,
      status: 'Active'
    });
    setPrincipal('');
  };

  const handleAddRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanId || !repayPrincipal || !repayInterest) return;

    addRepayment({
      id: generateId(),
      loanId: activeLoanId,
      date: repayDate,
      principalAmount: parseFloat(repayPrincipal),
      interestAmount: parseFloat(repayInterest),
    });
    
    setRepayPrincipal('');
    setRepayInterest('');
    setActiveLoanId(null);
  };

  // Interest calculator logic
  const [calcP, setCalcP] = useState(10000);
  const [calcR, setCalcR] = useState(2);
  const [calcMonths, setCalcMonths] = useState(1);
  const calculatedInterest = (calcP * calcR * calcMonths) / 100;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bento-card">
            <div className="card-header">ISSUE NEW LOAN</div>
            <form onSubmit={handleCreateLoan} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-small mb-1 block">Member</label>
                <select value={memberId} onChange={e => setMemberId(e.target.value)} required className="bento-select">
                  <option value="">Select Member</option>
                  {groupMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-small mb-1 block">Principal Amount</label>
                <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Interest Rate (% per month)</label>
                <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Issue Date</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="bento-input" />
              </div>
              <div className="sm:col-span-2 mt-2">
                <button type="submit" className="bento-btn bento-btn-primary w-full">Create Loan Account</button>
              </div>
            </form>
          </div>

          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-4 border-b-2 border-app-border">
              <div className="card-header !mb-0">LOAN PORTFOLIO</div>
            </div>
            <div className="overflow-x-auto">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th className="text-right">Principal</th>
                    <th className="text-right">Rate /mo</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groupLoans.map(loan => {
                    const reps = loanRepayments.filter(r => r.loanId === loan.id);
                    const totalPrincipalRepaid = reps.reduce((sum, r) => sum + r.principalAmount, 0);
                    const remaining = loan.principal - totalPrincipalRepaid;

                    return (
                      <tr key={loan.id}>
                        <td>
                          <div className="font-bold">{getMemberName(loan.memberId)}</div>
                          <div className="text-xs text-app-muted font-mono">{format(new Date(loan.issueDate), 'dd MMM yyyy')}</div>
                        </td>
                        <td className="text-right">
                          <div className="font-mono">Orig: {formatCurrency(loan.principal)}</div>
                          <div className="text-xs text-app-primary font-bold font-mono">Rem: {formatCurrency(remaining)}</div>
                        </td>
                        <td className="text-right font-mono text-sm">{loan.interestRate}%</td>
                        <td className="text-center">
                          <span className={`status-pill ${remaining <= 0 ? 'status-paid' : 'status-pending'}`}>
                            {remaining <= 0 ? 'REPAID' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="text-right">
                          {remaining > 0 && (
                            <button onClick={() => setActiveLoanId(loan.id)} className="bento-btn py-1 px-2 text-xs">Add Repayment</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {groupLoans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-app-muted font-bold">
                        No loans issued yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bento-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-app-primary"></div>
            <div className="card-header pt-2">INTEREST CALCULATOR</div>
            <div className="space-y-4 mt-2">
              <div>
                <label className="label-small mb-1 block">Principal</label>
                <input type="number" value={calcP} onChange={e => setCalcP(parseFloat(e.target.value)||0)} className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Rate (% per month)</label>
                <input type="number" step="0.1" value={calcR} onChange={e => setCalcR(parseFloat(e.target.value)||0)} className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Months</label>
                <input type="number" value={calcMonths} onChange={e => setCalcMonths(parseFloat(e.target.value)||0)} className="bento-input" />
              </div>
              <div className="pt-4 border-t-2 border-app-border mt-4">
                <div className="flex justify-between items-end">
                  <span className="label-small">Calculated Interest</span>
                  <span className="text-lg font-bold text-app-primary font-mono">{formatCurrency(calculatedInterest)}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="label-small">Total Payable</span>
                  <span className="text-xl font-black text-app-text font-mono">{formatCurrency(calcP + calculatedInterest)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeLoanId && (
        <div className="fixed inset-0 bg-app-border/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bento-card w-full max-w-md shadow-2xl">
            <div className="card-header">RECORD REPAYMENT</div>
            <form onSubmit={handleAddRepayment} className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Date</label>
                <input type="date" value={repayDate} onChange={e => setRepayDate(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Principal Amount</label>
                <input type="number" value={repayPrincipal} onChange={e => setRepayPrincipal(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Interest Amount</label>
                <input type="number" value={repayInterest} onChange={e => setRepayInterest(e.target.value)} required className="bento-input" />
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveLoanId(null)} className="bento-btn">Cancel</button>
                <button type="submit" className="bento-btn bento-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
