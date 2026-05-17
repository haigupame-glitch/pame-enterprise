import React from 'react';
import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Edit2, Check, X, Trash2, MessageCircle } from 'lucide-react';

export function Loans() {
  const { groups, loans, loanRepayments, members, activeGroupId, addLoan, updateLoan, deleteLoan, addRepayment, deleteRepayment, currentUserRole } = useAppContext();
  
  const [memberId, setMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('2'); // typically SHG uses 1-3% per month
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loanTerm, setLoanTerm] = useState('12');

  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [repayPrincipal, setRepayPrincipal] = useState('');
  const [repayInterest, setRepayInterest] = useState('');
  const [repayDate, setRepayDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const groupLoans = loans.filter(l => l.groupId === activeGroupId);
  const groupMembers = members.filter(m => m.groupId === activeGroupId);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);

  const handleLoanDelete = (id: string) => {
    deleteLoan(id);
    if (activeLoanId === id) setActiveLoanId(null);
    setDeletingLoanId(null);
  };

  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editLoanForm, setEditLoanForm] = useState({ principal: '', interestRate: '', issueDate: '' });

  const startEditLoan = (loan: any) => {
    setEditingLoanId(loan.id);
    setEditLoanForm({
      principal: loan.principal.toString(),
      interestRate: loan.interestRate.toString(),
      issueDate: loan.issueDate,
    });
  };

  const saveEditLoan = (loan: any) => {
    updateLoan({
      ...loan,
      principal: parseFloat(editLoanForm.principal) || 0,
      interestRate: parseFloat(editLoanForm.interestRate) || 0,
      issueDate: editLoanForm.issueDate || loan.issueDate,
    });
    setEditingLoanId(null);
  };

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
    if (!activeLoanId || (!repayPrincipal && !repayInterest)) return;

    addRepayment({
      id: generateId(),
      loanId: activeLoanId,
      date: repayDate,
      principalAmount: parseFloat(repayPrincipal || '0'),
      interestAmount: parseFloat(repayInterest || '0'),
    });
    
    setRepayPrincipal('');
    setRepayInterest('');
    // Instead of closing the view, keep it open to allow multiple entries or reviewing
  };

  // Interest calculator logic
  const [calcP, setCalcP] = useState(10000);
  const [calcR, setCalcR] = useState(2);
  const [calcMonths, setCalcMonths] = useState(12);
  const calculatedInterest = (calcP * calcR * calcMonths) / 100;

  const getEMI = (p: number, r: number, m: number) => {
    if (p <= 0 || m <= 0) return 0;
    if (r === 0) return Math.round(p / m);
    const rateMonthly = r / 100;
    const factor = Math.pow(1 + rateMonthly, m);
    return Math.round((p * rateMonthly * factor) / (factor - 1));
  };
  
  const formEMI = getEMI(parseFloat(principal) || 0, parseFloat(interestRate) || 0, parseInt(loanTerm) || 0);
  const standaloneEMI = getEMI(calcP, calcR, calcMonths);

  const renderLedgerView = () => {
    if (!activeLoanId) return null;
    const loan = groupLoans.find(l => l.id === activeLoanId);
    if (!loan) {
      setActiveLoanId(null);
      return null;
    }
    
    const member = groupMembers.find(m => m.id === loan.memberId);
    let runningBalance = loan.principal;
    let lastDate = new Date(loan.issueDate);
    
    const loanHistory = loanRepayments.filter(r => r.loanId === loan.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const ledgerRows = loanHistory.map((rep, index) => {
      const paymentDate = new Date(rep.date);
      const diffTime = Math.abs(paymentDate.getTime() - lastDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const monthToMonth = `${format(lastDate, 'dd/MM/yy')} - ${format(paymentDate, 'dd/MM/yy')}`;
      
      const toRepaidPrincipal = runningBalance;
      const toRepaidInterest = (runningBalance * (loan.interestRate / 100)) * (diffDays / 30); 
      const balancePrincipal = runningBalance - rep.principalAmount;
      
      const row = {
        slNo: index + 1,
        dateOfRecord: lastDate,
        monthToMonth,
        toBeRepaidPrincipal: toRepaidPrincipal,
        toBeRepaidInterest: toRepaidInterest,
        totalToBeRepaid: toRepaidPrincipal + toRepaidInterest,
        months: diffDays,
        paymentDate: paymentDate,
        duesPrincipal: 0,
        duesInterest: Math.max(0, toRepaidInterest - rep.interestAmount),
        repPrincipal: rep.principalAmount,
        repInterest: rep.interestAmount,
        repTotal: rep.principalAmount + rep.interestAmount,
        balancePrincipal: balancePrincipal,
        balanceInterest: Math.max(0, toRepaidInterest - rep.interestAmount),
      };
      
      lastDate = paymentDate;
      runningBalance = balancePrincipal;
      return row;
    });

    return (
      <div className="space-y-6 lg:col-span-3">
        <div className="flex justify-between items-center">
          <button onClick={() => setActiveLoanId(null)} className="bento-btn bg-app-card text-app-text">
            &larr; Back to Loans
          </button>
        </div>
        
        <div className="bento-card relative overflow-hidden bg-app-card">
          <div className="absolute top-0 left-0 w-full h-1 bg-app-accent"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pt-2 pb-4 border-b border-app-border gap-4">
            <div>
              <div className="text-xs font-bold text-app-muted uppercase">Member</div>
              <div className="font-bold text-xl">{member?.name || 'Unknown'}</div>
            </div>
            <div className="flex gap-4 sm:gap-8 flex-wrap">
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Sanction Date</div>
                <div className="font-bold text-lg">{format(new Date(loan.issueDate), 'dd/MM/yyyy')}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Principal</div>
                <div className="font-bold text-lg text-app-primary">{formatCurrency(loan.principal)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Interest Rate</div>
                <div className="font-bold text-lg">{loan.interestRate}% /mo</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse border border-app-border">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="border border-app-border p-2" colSpan={3}></th>
                  <th className="border border-app-border p-2 text-center text-app-text" colSpan={3}>To be Repaid</th>
                  <th className="border border-app-border p-2" colSpan={2}></th>
                  <th className="border border-app-border p-2 text-center text-app-text" colSpan={2}>Repayment Dues</th>
                  <th className="border border-app-border p-2 text-center text-app-text" colSpan={3}>Repayment</th>
                  <th className="border border-app-border p-2 text-center text-app-text" colSpan={2}>Balance Amount of</th>
                </tr>
                <tr className="bg-slate-700/30 text-xs text-app-muted">
                  <th className="border border-app-border p-1">Sl No</th>
                  <th className="border border-app-border p-1">Date of Record</th>
                  <th className="border border-app-border p-1">Period</th>
                  <th className="border border-app-border p-1 text-right">Principal</th>
                  <th className="border border-app-border p-1 text-right">Interest</th>
                  <th className="border border-app-border p-1 text-right">Total</th>
                  <th className="border border-app-border p-1 text-center">Days</th>
                  <th className="border border-app-border p-1">Payment Date</th>
                  <th className="border border-app-border p-1 text-right">Principal</th>
                  <th className="border border-app-border p-1 text-right">Interest</th>
                  <th className="border border-app-border p-1 text-right">Principal</th>
                  <th className="border border-app-border p-1 text-right">Interest</th>
                  <th className="border border-app-border p-1 text-right">Total</th>
                  <th className="border border-app-border p-1 text-right">Principal</th>
                  <th className="border border-app-border p-1 text-right">Interest</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((r) => (
                  <tr key={r.slNo} className="hover:bg-slate-700/20">
                    <td className="border border-app-border p-1 text-center text-app-muted">{r.slNo}</td>
                    <td className="border border-app-border p-1 whitespace-nowrap text-app-text">{format(r.dateOfRecord, 'dd/MM/yyyy')}</td>
                    <td className="border border-app-border p-1 whitespace-nowrap text-app-text">{r.monthToMonth}</td>
                    <td className="border border-app-border p-1 text-right text-app-text font-mono">{formatCurrency(r.toBeRepaidPrincipal)}</td>
                    <td className="border border-app-border p-1 text-right text-app-text font-mono">{formatCurrency(r.toBeRepaidInterest)}</td>
                    <td className="border border-app-border p-1 text-right text-app-text font-mono">{formatCurrency(r.totalToBeRepaid)}</td>
                    <td className="border border-app-border p-1 text-center text-app-muted">{r.months}</td>
                    <td className="border border-app-border p-1 whitespace-nowrap text-app-text">{format(r.paymentDate, 'dd/MM/yyyy')}</td>
                    <td className="border border-app-border p-1 text-right text-app-text font-mono">{formatCurrency(r.duesPrincipal)}</td>
                    <td className="border border-app-border p-1 text-right text-app-text font-mono">{formatCurrency(r.duesInterest)}</td>
                    <td className="border border-app-border p-1 text-right text-app-primary font-mono">{formatCurrency(r.repPrincipal)}</td>
                    <td className="border border-app-border p-1 text-right text-app-primary font-mono">{formatCurrency(r.repInterest)}</td>
                    <td className="border border-app-border p-1 text-right bg-app-accent/10 text-app-accent font-bold font-mono">{formatCurrency(r.repTotal)}</td>
                    <td className="border border-app-border p-1 text-right font-bold text-amber-500 font-mono">{formatCurrency(r.balancePrincipal)}</td>
                    <td className="border border-app-border p-1 text-right text-amber-500 font-mono">{formatCurrency(r.balanceInterest)}</td>
                  </tr>
                ))}
                {ledgerRows.length === 0 && (
                  <tr>
                    <td colSpan={15} className="border border-app-border p-4 text-center font-bold text-app-muted">No repayment history yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-app-border">
            <h4 className="font-bold text-lg mb-4">Record New Repayment</h4>
            {!canEdit ? (
              <p className="text-app-muted">Only Admins can record repayments.</p>
            ) : (
              <form onSubmit={handleAddRepayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="label-small mb-1 block">Payment Date</label>
                  <input type="date" value={repayDate} onChange={e => setRepayDate(e.target.value)} required className="bento-input" />
                </div>
                <div>
                  <label className="label-small mb-1 block">Principal Amount</label>
                  <input type="number" value={repayPrincipal} onChange={e => setRepayPrincipal(e.target.value)} className="bento-input" />
                </div>
                <div>
                  <label className="label-small mb-1 block">Interest Amount</label>
                  <input type="number" value={repayInterest} onChange={e => setRepayInterest(e.target.value)} className="bento-input" />
                </div>
                <div>
                  <button type="submit" className="bento-btn bento-btn-primary w-full">Save Entry</button>
                </div>
              </form>
            )}
          </div>
          <div className="mt-8 bg-slate-800/50 p-6 rounded-xl border border-app-border">
            <h4 className="font-bold text-lg mb-4">Individual Repayments History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-app-border">
                <thead>
                  <tr className="bg-slate-700/30 text-xs text-app-muted">
                    <th className="border border-app-border p-2">Date</th>
                    <th className="border border-app-border p-2 text-right">Principal</th>
                    <th className="border border-app-border p-2 text-right">Interest</th>
                    <th className="border border-app-border p-2 text-right">Total</th>
                    <th className="border border-app-border p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loanHistory.map(rep => (
                    <tr key={rep.id} className="hover:bg-slate-700/20">
                      <td className="border border-app-border p-2 text-app-text">{format(new Date(rep.date), 'dd/MM/yyyy')}</td>
                      <td className="border border-app-border p-2 text-right font-mono text-app-primary">{formatCurrency(rep.principalAmount)}</td>
                      <td className="border border-app-border p-2 text-right font-mono text-amber-500">{formatCurrency(rep.interestAmount)}</td>
                      <td className="border border-app-border p-2 text-right font-mono font-bold text-app-accent">{formatCurrency(rep.principalAmount + rep.interestAmount)}</td>
                      <td className="border border-app-border p-2 text-center">
                        {canEdit && (
                          <button 
                            onClick={() => deleteRepayment(rep.id)} 
                            className="text-red-400 hover:text-red-300 p-1 transition-colors" 
                            title="Delete Repayment"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loanHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border border-app-border p-4 text-center text-app-muted">No individual repayments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeLoanId ? renderLedgerView() : (
          <div className="lg:col-span-2 space-y-6">
          {canEdit && (
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-small mb-1 block">Issue Date</label>
                    <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="bento-input" />
                  </div>
                  <div>
                    <label className="label-small mb-1 block">Term (Months)</label>
                    <input type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} min="1" className="bento-input" placeholder="e.g. 12" />
                  </div>
                </div>
                {parseFloat(principal) > 0 && parseInt(loanTerm) > 0 && (
                  <div className="sm:col-span-2 mt-2 bg-app-primary/10 border border-app-primary/20 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-app-primary uppercase tracking-wider mb-1">Suggested EMI</div>
                      <div className="text-xs text-app-primary/80 font-medium">Equated Monthly Installment (reducing balance)</div>
                    </div>
                    <div className="text-2xl font-black text-app-primary">
                      {formatCurrency(formEMI)}<span className="text-sm font-bold text-app-primary/60">/mo</span>
                    </div>
                  </div>
                )}
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className="bento-btn bento-btn-primary w-full">Create Loan Account</button>
                </div>
              </form>
            </div>
          )}

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
                    const member = groupMembers.find(m => m.id === loan.memberId);
                    
                    const reminderText = encodeURIComponent(`Hello ${member?.name},\nThis is a gentle reminder for your upcoming loan repayment of ${formatCurrency(remaining)} to ${activeGroup?.name || 'our SHG'}. Thank you!`);

                    return (
                      <tr key={loan.id} className="hover:bg-slate-700/20">
                        {editingLoanId === loan.id ? (
                          <>
                            <td>
                              <div className="font-bold">{getMemberName(loan.memberId)}</div>
                              <input 
                                type="date" 
                                value={editLoanForm.issueDate} 
                                onChange={e => setEditLoanForm({...editLoanForm, issueDate: e.target.value})} 
                                className="bento-input py-1 px-2 text-xs mt-1 w-full"
                              />
                            </td>
                            <td className="text-right">
                              <input 
                                type="number" 
                                value={editLoanForm.principal} 
                                onChange={e => setEditLoanForm({...editLoanForm, principal: e.target.value})} 
                                className="bento-input py-1 px-2 text-sm text-right w-full min-w-[80px]"
                              />
                            </td>
                            <td className="text-right">
                              <input 
                                type="number" 
                                value={editLoanForm.interestRate} 
                                onChange={e => setEditLoanForm({...editLoanForm, interestRate: e.target.value})} 
                                className="bento-input py-1 px-2 text-sm text-right w-full min-w-[60px]"
                              />
                            </td>
                            <td className="text-center">
                              <span className={`status-pill ${remaining <= 0 ? 'bg-app-accent/20 text-app-accent' : 'bg-amber-500/20 text-amber-500'}`}>
                                {remaining <= 0 ? 'REPAID' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => saveEditLoan(loan)} className="text-app-accent hover:text-emerald-400 p-1" title="Save"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingLoanId(null)} className="text-app-muted hover:text-white p-1" title="Cancel"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <div className="font-bold">{getMemberName(loan.memberId)}</div>
                              <div className="text-xs text-app-muted font-mono">{format(new Date(loan.issueDate), 'dd/MM/yy')}</div>
                            </td>
                            <td className="text-right">
                              <div className="font-mono">Orig: {formatCurrency(loan.principal)}</div>
                              <div className="text-xs text-app-primary font-bold font-mono">Rem: {formatCurrency(remaining)}</div>
                            </td>
                            <td className="text-right font-mono text-sm">{loan.interestRate}%</td>
                            <td className="text-center">
                              <span className={`status-pill ${remaining <= 0 ? 'bg-app-accent/20 text-app-accent' : 'bg-amber-500/20 text-amber-500'}`}>
                                {remaining <= 0 ? 'REPAID' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-2 items-center">
                                {remaining > 0 && member?.contact && (
                                  <a 
                                    href={`https://wa.me/${member.contact.replace(/\D/g, '')}?text=${reminderText}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bento-btn py-1 px-2 text-xs !bg-emerald-500/10 !text-emerald-400 !border-emerald-500/20 hover:!bg-emerald-500/20 flex items-center justify-center gap-1 transition-colors"
                                    title="Send WhatsApp Reminder"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Send Reminder
                                  </a>
                                )}
                                <button onClick={() => setActiveLoanId(loan.id)} className="bento-btn py-1 px-2 text-xs">
                                  Ledger
                                </button>
                                {canEdit && (
                                  <>
                                    <button onClick={() => startEditLoan(loan)} className="text-app-primary hover:text-blue-400 p-1 transition-colors" title="Edit">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    {deletingLoanId === loan.id ? (
                                      <div className="flex gap-1 items-center">
                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Sure?</span>
                                        <button onClick={() => handleLoanDelete(loan.id)} className="text-red-400 hover:text-red-300 p-1" title="Yes"><Check className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeletingLoanId(null)} className="text-app-muted hover:text-white p-1" title="No"><X className="w-3.5 h-3.5" /></button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setDeletingLoanId(loan.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </>
                        )}
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
        )}

        {!activeLoanId && (
          <div className="space-y-6">
            <div className="bento-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-app-primary"></div>
              <div className="card-header pt-2 pb-2">EMI & INTEREST CALCULATOR</div>
              <div className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Principal Amount</label>
                <input type="number" value={calcP} onChange={e => setCalcP(parseFloat(e.target.value)||0)} className="bento-input text-lg font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Rate (%/mo)</label>
                  <input type="number" step="0.1" value={calcR} onChange={e => setCalcR(parseFloat(e.target.value)||0)} className="bento-input" />
                </div>
                <div>
                  <label className="label-small mb-1 block">Term (Months)</label>
                  <input type="number" value={calcMonths} onChange={e => setCalcMonths(parseFloat(e.target.value)||0)} className="bento-input" />
                </div>
              </div>
              <div className="pt-4 border-t border-app-border space-y-3">
                <div className="bg-app-primary/10 p-4 rounded-xl border border-app-primary/20">
                  <div className="text-xs font-bold text-app-primary mb-1 uppercase tracking-wider">Suggested Standard EMI</div>
                  <div className="text-3xl font-black text-app-primary">{formatCurrency(standaloneEMI)} <span className="text-sm font-bold text-app-primary/60">/mo</span></div>
                  <div className="text-xs font-medium text-app-primary/80 mt-2 leading-relaxed">Equated Monthly Installment based on reducing balance method over {calcMonths} months.</div>
                </div>
                
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  <div className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-wider">Simple Interest (Flat Rate)</div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-bold text-amber-500/80">Total Interest</span>
                    <span className="font-bold text-amber-500">{formatCurrency(calculatedInterest)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-app-text">Total Payable</span>
                    <span className="font-black text-app-text">{formatCurrency(calcP + calculatedInterest)}</span>
                  </div>
                </div>

                {calcP > 0 && calcR > 0 && calcMonths > 0 && (
                  <div className="mt-4 pt-4 border-t border-app-border">
                    <div className="text-xs font-bold text-app-muted mb-3 uppercase tracking-wider">Projected Amortization</div>
                    <div className="overflow-y-auto max-h-[300px] rounded-lg border border-app-border bg-slate-800/20">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800/80 sticky top-0 shadow-sm">
                          <tr>
                            <th className="p-2 border-b border-app-border text-center">Mo</th>
                            <th className="p-2 border-b border-app-border text-right text-app-primary">Principal</th>
                            <th className="p-2 border-b border-app-border text-right text-amber-500">Interest</th>
                            <th className="p-2 border-b border-app-border text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: calcMonths }).reduce<any[]>((acc, _, i) => {
                            const prevBal = i === 0 ? calcP : acc[i-1].balance;
                            const interest = prevBal * (calcR / 100);
                            let emi = standaloneEMI;
                            if (i === calcMonths - 1) emi = prevBal + interest; // adjusting last payment
                            const p = emi - interest;
                            const bal = Math.max(0, prevBal - p);
                            acc.push({ interest, p, balance: bal });
                            return acc;
                          }, []).map((row: any, i: number) => (
                            <tr key={i} className="border-b border-app-border/30 hover:bg-slate-700/30 transition-colors">
                              <td className="p-2 text-center text-app-muted">{i+1}</td>
                              <td className="p-2 text-right font-mono text-app-primary/80">{formatCurrency(row.p)}</td>
                              <td className="p-2 text-right font-mono text-amber-500/80">{formatCurrency(row.interest)}</td>
                              <td className="p-2 text-right font-mono font-bold text-app-text">{formatCurrency(row.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Legacy Modal code removed completely */}
    </div>
  );
}
