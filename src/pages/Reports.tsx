import { useState, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Printer, Share2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

type ReportTab = 'members' | 'loans' | 'transactions';

export function Reports() {
  const { 
    groups, members, collections, loans, loanRepayments, transactions, activeGroupId 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<ReportTab>('members');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const reportRef = useRef<HTMLDivElement>(null);

  // Guarantee reportYear is not NaN from previous stale states
  const safeReportYear = isNaN(reportYear) ? new Date().getFullYear() : reportYear;

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const groupName = activeGroup?.name || 'Group';

  // Filter data for the active group
  const groupMembers = members.filter(m => m.groupId === activeGroupId);
  const groupCollections = collections.filter(c => c.groupId === activeGroupId);
  const groupLoans = loans.filter(l => l.groupId === activeGroupId);
  const groupRepayments = loanRepayments; // Repayments linked by loanId, which is already filtered by groupLoans below
  const groupTransactions = transactions.filter(t => t.groupId === activeGroupId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const availableYears = Array.from(
    new Set(groupCollections.map(c => Number(c.year)))
  ).filter((y): y is number => !isNaN(y as number));
  if (!availableYears.includes(new Date().getFullYear())) availableYears.push(new Date().getFullYear());
  if (!availableYears.includes(safeReportYear) && !isNaN(safeReportYear)) availableYears.push(safeReportYear);
  availableYears.sort((a, b) => Number(b) - Number(a));

  const handlePrint = () => {
    try {
      // Check if we are inside an iframe (AI Studio preview)
      if (window.self !== window.top) {
        alert('Browser printing is restricted inside the live preview window.\n\nPlease either use the "Save PDF" button instead, or open the app in a new full-browser tab (using the arrow icon in the top right of this preview) to use the native Print feature.');
        return;
      }
    } catch (e) {
      // Cross-origin error means we are definitely in an iframe
      alert('Browser printing is restricted inside the live preview window.\n\nPlease either use the "Save PDF" button instead, or open the app in a new full-browser tab (using the arrow icon in the top right of this preview) to use the native Print feature.');
      return;
    }
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    
    // Give state time to update the UI for capturing (unhide elements)
    setTimeout(async () => {
      try {
        const imgData = await toPng(reportRef.current!, { 
          quality: 1.0,
          backgroundColor: '#ffffff',
          pixelRatio: 2
        });
        
        // Use landscape logic if we are doing a loan ledger to fit 16 columns better, and also Members for 12 months
        const isLandscape = (activeTab === 'loans' && selectedLoanId !== null) || activeTab === 'members';
        const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // We calculate target height based on aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        
        pdf.save(`SHG_Report_${activeTab}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      } catch (e) {
        console.error('Error generating PDF', e);
        alert('Could not generate PDF. Please try Print Report and choose "Save as PDF".');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150); // short delay to allow React to render conditional hidden states
  };

  const handleWhatsAppShare = () => {
    let reportText = '';

    if (activeTab === 'members') {
      const totalCollections = groupCollections.reduce((sum, c) => sum + c.amount, 0);
      reportText = `*MEMBERSHIP FEES SUMMARY*\nGroup: ${groupName}\nTotal Members: ${groupMembers.length}\nTotal Collections: ${formatCurrency(totalCollections)}\n\n`;
      
      groupMembers.forEach((member, index) => {
        const memberCollections = groupCollections.filter(c => c.memberId === member.id);
        const total = memberCollections.reduce((sum, c) => sum + c.amount, 0);
        reportText += `${index + 1}. ${member.name} - Total: ${formatCurrency(total)}\n`;
      });
    } else if (activeTab === 'loans') {
      if (selectedLoanId) {
        const loan = groupLoans.find(l => l.id === selectedLoanId);
        const member = groupMembers.find(m => m.id === loan?.memberId);
        const reps = groupRepayments.filter(r => r.loanId === selectedLoanId);

        reportText = `*LOAN INDIVIDUAL LEDGER*\nMember: ${member?.name}\nSanction Date: ${format(new Date(loan!.issueDate), 'dd/MM/yyyy')}\nAmount: ${formatCurrency(loan!.principal)}\nROI: ${loan!.interestRate}%\n\n`;
        let runningBalance = loan!.principal;
        
        reps.forEach((rep, index) => {
          reportText += `${index+1}. ${format(new Date(rep.date), 'dd/MM/yyyy')} -> Rep: ${formatCurrency(rep.principalAmount)} Prin, ${formatCurrency(rep.interestAmount)} Int. Bal: ${formatCurrency(runningBalance - rep.principalAmount)}\n`
          runningBalance -= rep.principalAmount;
        });
      } else {
        let totalPrincipal = 0;
        let totalRepaid = 0;
        let totalInterest = 0;

        const loanDetails = groupLoans.map(loan => {
          const reps = groupRepayments.filter(r => r.loanId === loan.id);
          const repaidPrincipal = reps.reduce((sum, r) => sum + r.principalAmount, 0);
          const paidInterest = reps.reduce((sum, r) => sum + r.interestAmount, 0);
          
          totalPrincipal += loan.principal;
          totalRepaid += repaidPrincipal;
          totalInterest += paidInterest;

          return {
            ...loan,
            repaidPrincipal,
          };
        });

        const outstanding = totalPrincipal - totalRepaid;
        
        reportText = `*LOAN PORTFOLIO REPORT*\nGroup: ${groupName}\nTotal Issued: ${formatCurrency(totalPrincipal)}\nTotal Repaid: ${formatCurrency(totalRepaid)}\nOutstanding: ${formatCurrency(outstanding)}\nInterest Earned: ${formatCurrency(totalInterest)}\n\n`;

        loanDetails.forEach((loan, index) => {
          const memberName = groupMembers.find(m => m.id === loan.memberId)?.name || 'Unknown';
          const rem = loan.principal - loan.repaidPrincipal;
          reportText += `${index + 1}. ${memberName} - Orig: ${formatCurrency(loan.principal)}, Rem: ${formatCurrency(rem)}\n`;
        });
      }
    } else if (activeTab === 'transactions') {
      const totalIncome = groupTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.payIn, 0);
      const totalExpense = groupTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.payOut, 0);
      const currentBalance = groupTransactions.length > 0 ? groupTransactions[groupTransactions.length - 1].runningBalance : 0;

      reportText = `*TRANSACTION LEDGER REPORT*\nGroup: ${groupName}\nTotal Income: ${formatCurrency(totalIncome)}\nTotal Expense: ${formatCurrency(totalExpense)}\nCurrent Balance: ${formatCurrency(currentBalance)}\n\n`;

      groupTransactions.slice(-20).forEach((tx, index) => { // Limit to last 20 to avoid giant msgs
        const dt = format(new Date(tx.date), 'dd/MM');
        const amt = tx.type === 'Income' ? `+${formatCurrency(tx.payIn)}` : `-${formatCurrency(tx.payOut)}`;
        reportText += `${index + 1}. ${dt} - ${tx.particulars} (${amt})\n`;
      });
    }

    reportText += `\n_Generated on ${format(new Date(), 'dd MMM yyyy')}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  const renderMembersReport = () => {
    const yearCollections = groupCollections.filter(c => Number(c.year) === Number(safeReportYear));
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="space-y-6 print:space-y-4">
        <div className={`flex justify-between items-center print:hidden ${isGeneratingPdf ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-app-muted uppercase">Select Year:</span>
            <select 
              value={safeReportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="bento-input py-1.5 px-3 min-w-[120px]"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`bento-card border-none p-0 print:border-none print:shadow-none ${isGeneratingPdf ? 'border-none p-0 shadow-none' : ''}`}>
          <div className="pb-4 pt-4 border-b-2 border-app-border flex justify-between items-center px-4">
            <h3 className="text-xl font-bold text-app-text mb-0">MEMBERSHIP FEES SUMMARY</h3>
            <span className="font-black text-app-primary">For Year : {safeReportYear}</span>
          </div>
          <div className={isGeneratingPdf ? "overflow-visible" : "overflow-x-auto"}>
            <table className="w-full text-sm border-collapse border border-app-border">
              <thead>
                <tr className="bg-slate-700/30 text-xs text-app-muted">
                  <th className="border border-app-border p-2 text-center w-12">Sl.No.</th>
                  <th className="border border-app-border p-2 text-left min-w-[120px]">Name</th>
                  {monthNames.map(m => (
                    <th key={m} className="border border-app-border p-2 text-center w-16">{m}</th>
                  ))}
                  <th className="border border-app-border p-2 text-left min-w-[80px]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {groupMembers.map((member, index) => {
                  const memberCollections = yearCollections.filter(c => c.memberId === member.id);
                  return (
                    <tr key={member.id} className="hover:bg-slate-700/20">
                      <td className="border border-app-border p-1.5 text-center font-mono">{index + 1}</td>
                      <td className="border border-app-border p-1.5 font-bold whitespace-nowrap">{member.name}</td>
                      {Array.from({ length: 12 }).map((_, monthIndex) => {
                        const monthCol = memberCollections.filter(c => Number(c.month) === monthIndex);
                        const totalForMonth = monthCol.reduce((sum, c) => sum + c.amount, 0);
                        return (
                          <td key={monthIndex} className="border border-app-border p-1.5 text-center font-mono text-xs">
                            {totalForMonth > 0 ? totalForMonth : ''}
                          </td>
                        );
                      })}
                      <td className="border border-app-border p-1.5 text-xs text-app-muted"></td>
                    </tr>
                  );
                })}
                {groupMembers.length === 0 && (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-app-muted font-bold">No members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLoansReport = () => {
    if (selectedLoanId) {
      const loan = groupLoans.find(l => l.id === selectedLoanId);
      if (!loan) {
        setSelectedLoanId(null);
        return null;
      }
      
      const member = groupMembers.find(m => m.id === loan.memberId);
      let runningBalance = loan.principal;
      let lastDate = new Date(loan.issueDate);
      
      const loanHistory = groupRepayments.filter(r => r.loanId === loan.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const ledgerRows = loanHistory.map((rep, index) => {
        const paymentDate = new Date(rep.date);
        const diffTime = Math.abs(paymentDate.getTime() - lastDate.getTime());
        const diffMonths = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)));
        const monthToMonth = `${format(lastDate, 'MMM yyyy')} - ${format(paymentDate, 'MMM yyyy')}`;
        
        const toRepaidPrincipal = runningBalance;
        // Approximation: this assumes simple interest based on the remaining balance per month.
        const toRepaidInterest = (runningBalance * (loan.interestRate / 100)) * diffMonths; 
        const balancePrincipal = runningBalance - rep.principalAmount;
        
        const row = {
          slNo: index + 1,
          dateOfRecord: lastDate,
          monthToMonth,
          toBeRepaidPrincipal: toRepaidPrincipal,
          toBeRepaidInterest: toRepaidInterest,
          totalToBeRepaid: toRepaidPrincipal + toRepaidInterest,
          months: diffMonths,
          paymentDate: paymentDate,
          duesPrincipal: 0,
          duesInterest: Math.max(0, toRepaidInterest - rep.interestAmount),
          repPrincipal: rep.principalAmount,
          repInterest: rep.interestAmount,
          repTotal: rep.principalAmount + rep.interestAmount,
          balancePrincipal: balancePrincipal,
          balanceInterest: Math.max(0, toRepaidInterest - rep.interestAmount),
          remarks: rep.remarks || 'CLEARED'
        };
        
        lastDate = paymentDate;
        runningBalance = balancePrincipal;
        return row;
      });

      return (
        <div className="space-y-6 print:space-y-4">
          <div className={`flex justify-between items-center print:hidden ${isGeneratingPdf ? 'hidden' : ''}`}>
            <button onClick={() => setSelectedLoanId(null)} className="bento-btn bg-app-card text-app-text">
              &larr; Back to Portfolio
            </button>
          </div>
          
          <div className={`bento-card print:border-none print:shadow-none ${isGeneratingPdf ? 'border-none shadow-none' : ''}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-2 pb-4 border-b-2 border-app-border print:border-b">
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Name</div>
                <div className="font-bold">{member?.name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Sanction Date</div>
                <div className="font-bold">{format(new Date(loan.issueDate), 'dd/MM/yyyy')}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">Amount</div>
                <div className="font-bold text-app-primary">{formatCurrency(loan.principal)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-app-muted uppercase">ROI</div>
                <div className="font-bold">{loan.interestRate}%</div>
              </div>
            </div>

            <div className={isGeneratingPdf ? "overflow-visible" : "overflow-x-auto"}>
              <table className="w-full text-sm border-collapse border border-app-border">
                <thead>
                  <tr className="bg-slate-700/30">
                    <th className="border border-app-border p-2" colSpan={3}></th>
                    <th className="border border-app-border p-2 text-center" colSpan={3}>To be Repaid</th>
                    <th className="border border-app-border p-2" colSpan={2}></th>
                    <th className="border border-app-border p-2 text-center" colSpan={2}>Repayment Dues</th>
                    <th className="border border-app-border p-2 text-center" colSpan={3}>Repayment</th>
                    <th className="border border-app-border p-2 text-center" colSpan={2}>Balance Amount of</th>
                    <th className="border border-app-border p-2"></th>
                  </tr>
                  <tr className="bg-slate-700/50 text-xs">
                    <th className="border border-app-border p-1">Sl No</th>
                    <th className="border border-app-border p-1">Date of Record</th>
                    <th className="border border-app-border p-1">Month to Month</th>
                    <th className="border border-app-border p-1">Principal</th>
                    <th className="border border-app-border p-1">Interest</th>
                    <th className="border border-app-border p-1">Total</th>
                    <th className="border border-app-border p-1">Months</th>
                    <th className="border border-app-border p-1">Payment Date</th>
                    <th className="border border-app-border p-1">Principal</th>
                    <th className="border border-app-border p-1">Interest</th>
                    <th className="border border-app-border p-1">Principal</th>
                    <th className="border border-app-border p-1">Interest</th>
                    <th className="border border-app-border p-1">Total</th>
                    <th className="border border-app-border p-1">Principal</th>
                    <th className="border border-app-border p-1">Interest</th>
                    <th className="border border-app-border p-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((r) => (
                    <tr key={r.slNo} className="hover:bg-slate-700/20">
                      <td className="border border-app-border p-1 text-center">{r.slNo}</td>
                      <td className="border border-app-border p-1 whitespace-nowrap">{format(r.dateOfRecord, 'dd/MM/yyyy')}</td>
                      <td className="border border-app-border p-1 whitespace-nowrap">{r.monthToMonth}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.toBeRepaidPrincipal)}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.toBeRepaidInterest)}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.totalToBeRepaid)}</td>
                      <td className="border border-app-border p-1 text-center">{r.months}</td>
                      <td className="border border-app-border p-1 whitespace-nowrap">{format(r.paymentDate, 'dd/MM/yyyy')}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.duesPrincipal)}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.duesInterest)}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.repPrincipal)}</td>
                      <td className="border border-app-border p-1 text-right">{formatCurrency(r.repInterest)}</td>
                      <td className="border border-app-border p-1 text-right bg-emerald-500/10 text-emerald-500">{formatCurrency(r.repTotal)}</td>
                      <td className="border border-app-border p-1 text-right font-bold text-red-500">{formatCurrency(r.balancePrincipal)}</td>
                      <td className="border border-app-border p-1 text-right text-red-500">{formatCurrency(r.balanceInterest)}</td>
                      <td className="border border-app-border p-1 text-xs">{r.remarks}</td>
                    </tr>
                  ))}
                  {ledgerRows.length === 0 && (
                    <tr>
                      <td colSpan={16} className="border border-app-border p-4 text-center font-bold text-app-muted">No repayment history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    let totalPrincipal = 0;
    let totalRepaid = 0;
    let totalInterest = 0;

    const loanDetails = groupLoans.map(loan => {
      const reps = groupRepayments.filter(r => r.loanId === loan.id);
      const repaidPrincipal = reps.reduce((sum, r) => sum + r.principalAmount, 0);
      const paidInterest = reps.reduce((sum, r) => sum + r.interestAmount, 0);
      
      totalPrincipal += loan.principal;
      totalRepaid += repaidPrincipal;
      totalInterest += paidInterest;

      return {
        ...loan,
        repaidPrincipal,
        paidInterest,
        outstanding: loan.principal - repaidPrincipal
      };
    });

    return (
      <div className="space-y-6 print:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
          <div className="bento-card relative overflow-hidden group border-slate-700/30 bg-slate-800/10">
            <div className="absolute right-0 top-0 w-24 h-24 bg-slate-700/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-opacity-10 print:hidden"></div>
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Total Issued</div>
            <div className="text-xl md:text-2xl font-black font-mono text-app-text relative z-10 truncate" title={formatCurrency(totalPrincipal)}>{formatCurrency(totalPrincipal)}</div>
          </div>
          <div className="bento-card relative overflow-hidden group border-app-accent/30 bg-app-accent/5">
            <div className="absolute right-0 top-0 w-24 h-24 bg-app-accent/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-opacity-10 print:hidden"></div>
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Total Repaid</div>
            <div className="text-xl md:text-2xl font-black font-mono text-app-accent relative z-10 truncate" title={formatCurrency(totalRepaid)}>{formatCurrency(totalRepaid)}</div>
          </div>
          <div className="bento-card relative overflow-hidden group border-red-500/30 bg-red-500/5">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-opacity-10 print:hidden"></div>
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Outstanding</div>
            <div className="text-xl md:text-2xl font-black font-mono text-red-500 relative z-10 truncate" title={formatCurrency(totalPrincipal - totalRepaid)}>{formatCurrency(totalPrincipal - totalRepaid)}</div>
          </div>
          <div className="bento-card relative overflow-hidden group border-app-primary/30 bg-app-primary/10">
            <div className="absolute right-0 top-0 w-24 h-24 bg-app-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 print:hidden"></div>
            <div className="text-xs font-bold text-app-primary uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Interest Earned</div>
            <div className="text-xl md:text-2xl font-black font-mono text-app-primary relative z-10 truncate" title={formatCurrency(totalInterest)}>{formatCurrency(totalInterest)}</div>
          </div>
        </div>

        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-app-border bg-app-bg">
            <h3 className="card-header !mb-0 text-app-text">LOAN PORTFOLIO REPORT</h3>
          </div>
          <div className={isGeneratingPdf ? "overflow-visible" : "overflow-x-auto"}>
            <table className="bento-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Issue Date</th>
                  <th className="text-right">Principal</th>
                  <th className="text-right">Principal Repaid</th>
                  <th className="text-right">Interest Paid</th>
                  <th className="text-right">Total Paid</th>
                  <th className="text-right">Outstanding</th>
                  <th className={`text-center print:hidden ${isGeneratingPdf ? 'hidden' : ''}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loanDetails.map(loan => {
                  const memberName = groupMembers.find(m => m.id === loan.memberId)?.name || 'Unknown';
                  return (
                    <tr key={loan.id}>
                      <td className="font-bold">{memberName}</td>
                      <td className="font-mono text-sm text-app-muted">{format(new Date(loan.issueDate), 'dd MMM yyyy')}</td>
                      <td className="text-right font-mono">{formatCurrency(loan.principal)}</td>
                      <td className="text-right font-mono text-app-accent font-bold">{formatCurrency(loan.repaidPrincipal)}</td>
                      <td className="text-right font-mono text-app-primary">{formatCurrency(loan.paidInterest)}</td>
                      <td className="text-right font-mono text-emerald-500 font-bold">{formatCurrency(loan.repaidPrincipal + loan.paidInterest)}</td>
                      <td className="text-right font-mono text-red-600 font-bold">{formatCurrency(loan.outstanding)}</td>
                      <td className={`text-center print:hidden ${isGeneratingPdf ? 'hidden' : ''}`}>
                        <button 
                          onClick={() => setSelectedLoanId(loan.id)}
                          className="px-3 py-1 bg-app-primary text-white text-xs font-bold rounded hover:bg-opacity-90 transition-colors"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {loanDetails.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-app-muted font-bold">No loans issued yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionsReport = () => {
    const totalIncome = groupTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.payIn, 0);
    const totalExpense = groupTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.payOut, 0);
    const currentBalance = groupTransactions.length > 0 ? groupTransactions[groupTransactions.length - 1].runningBalance : 0;

    return (
      <div className="space-y-6 print:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
          <div className="bento-card relative overflow-hidden group border-app-accent/30 bg-app-accent/5">
            <div className="absolute right-0 top-0 w-24 h-24 bg-app-accent/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-opacity-10 print:hidden"></div>
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Total Income</div>
            <div className="text-xl md:text-2xl font-black font-mono text-app-accent relative z-10 truncate" title={formatCurrency(totalIncome)}>{formatCurrency(totalIncome)}</div>
          </div>
          <div className="bento-card relative overflow-hidden group border-red-500/30 bg-red-500/5">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-opacity-10 print:hidden"></div>
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Total Expense</div>
            <div className="text-xl md:text-2xl font-black font-mono text-red-500 relative z-10 truncate" title={formatCurrency(totalExpense)}>{formatCurrency(totalExpense)}</div>
          </div>
          <div className="bento-card relative overflow-hidden group border-app-primary/30 bg-app-primary/10">
            <div className="absolute right-0 top-0 w-24 h-24 bg-app-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 print:hidden"></div>
            <div className="text-xs font-bold text-app-primary uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">Current Balance</div>
            <div className="text-xl md:text-2xl font-black font-mono text-app-primary relative z-10 truncate" title={formatCurrency(currentBalance)}>{formatCurrency(currentBalance)}</div>
          </div>
        </div>

        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-app-border bg-app-bg">
            <h3 className="card-header !mb-0 text-app-text">TRANSACTION LEDGER REPORT</h3>
          </div>
          <div className={isGeneratingPdf ? "overflow-visible" : "overflow-x-auto"}>
            <table className="bento-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th className="text-center">Mode</th>
                  <th className="text-right">Income</th>
                  <th className="text-right">Expense</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {groupTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-mono text-sm text-app-muted whitespace-nowrap">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                    <td className="font-medium max-w-[200px] truncate" title={tx.particulars}>{tx.particulars}</td>
                    <td className="text-center">
                      <span className={`status-pill ${tx.paymentMode === 'Cash' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                        {tx.paymentMode}
                      </span>
                    </td>
                    <td className="text-right font-mono text-app-accent font-bold">
                      {tx.type === 'Income' ? formatCurrency(tx.payIn) : '-'}
                    </td>
                    <td className="text-right font-mono text-red-500 font-bold">
                      {tx.type === 'Expense' ? formatCurrency(tx.payOut) : '-'}
                    </td>
                    <td className="text-right font-mono font-bold text-app-primary">
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                ))}
                {groupTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-app-muted font-bold">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden ${isGeneratingPdf ? 'hidden' : ''}`}>
        <div className="flex bg-app-card p-1 rounded-xl border-2 border-app-border w-full sm:w-auto">
          <button 
            onClick={() => { setActiveTab('members'); setSelectedLoanId(null); }}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${activeTab === 'members' ? 'bg-app-primary text-white' : 'text-app-muted hover:bg-app-bg'}`}
          >
            Members
          </button>
          <button 
            onClick={() => { setActiveTab('loans'); setSelectedLoanId(null); }}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${activeTab === 'loans' ? 'bg-app-primary text-white' : 'text-app-muted hover:bg-app-bg'}`}
          >
            Loans
          </button>
          <button 
            onClick={() => { setActiveTab('transactions'); setSelectedLoanId(null); }}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${activeTab === 'transactions' ? 'bg-app-primary text-white' : 'text-app-muted hover:bg-app-bg'}`}
          >
            Transactions
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="bento-btn flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Save PDF'}</span>
          </button>
          <button onClick={handleWhatsAppShare} className="bento-btn bento-btn-accent flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share Report</span>
          </button>
          <button onClick={handlePrint} className="bento-btn flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      <div ref={reportRef} className={`print:block ${isGeneratingPdf ? 'p-8 bg-white text-black min-w-max min-h-max' : ''}`}>
        <div className={`${isGeneratingPdf ? "block" : "hidden print:block"} mb-8 text-center pb-4 border-b-2 border-app-border`}>
          {activeGroup?.logo && (
            <img src={activeGroup.logo} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-black uppercase text-app-primary mb-2">{activeGroup?.name || 'SHG Connect'} Report</h1>
          <h2 className="text-xl font-bold uppercase text-app-text">{activeTab.toUpperCase()} REPORT</h2>
          <p className="text-app-muted mt-2 font-mono">{format(new Date(), 'dd MMMM yyyy, hh:mm a')}</p>
        </div>

        {activeTab === 'members' && renderMembersReport()}
        {activeTab === 'loans' && renderLoansReport()}
        {activeTab === 'transactions' && renderTransactionsReport()}
      </div>
    </div>
  );
}
