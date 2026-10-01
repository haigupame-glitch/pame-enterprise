import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';
import { DateInput } from '../components/DateInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Investment, InvestmentType, InvestmentStatus } from '../types';
import { 
  TrendingUp, PiggyBank, Plus, Search, Filter, 
  Download, Printer, Edit2, Trash2, CheckCircle2, 
  Clock, X, Check, Building2, FileText, ChevronRight, AlertCircle 
} from 'lucide-react';

const INVESTMENT_TYPES: InvestmentType[] = ['Fixed Deposit', 'Recurring Deposit', 'Mutual Fund', 'Other'];
const INVESTMENT_STATUSES: InvestmentStatus[] = ['Active', 'Matured', 'Closed'];

export function Investments() {
  const { groups, activeGroupId, investments, addInvestment, updateInvestment, deleteInvestment, currentUserRole } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  const groupInvestments = investments.filter(i => i.groupId === activeGroupId);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    type: InvestmentType;
    title: string;
    institution: string;
    accountNumber: string;
    amountInvested: string;
    monthlyDeposit: string;
    currentValue: string;
    maturityAmount: string;
    interestRate: string;
    startDate: string;
    maturityDate: string;
    status: InvestmentStatus;
    nominee: string;
    remarks: string;
  }>({
    type: 'Fixed Deposit',
    title: '',
    institution: '',
    accountNumber: '',
    amountInvested: '',
    monthlyDeposit: '',
    currentValue: '',
    maturityAmount: '',
    interestRate: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    maturityDate: '',
    status: 'Active',
    nominee: '',
    remarks: ''
  });

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  if (!activeGroupId || !activeGroup) {
    return (
      <div className="p-8 text-center text-app-muted">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40 text-app-primary" />
        <p>Please select a group first to view investments.</p>
      </div>
    );
  }

  // Filtered investments
  const filteredInvestments = groupInvestments.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.accountNumber && item.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate Metrics
  const totalInvested = groupInvestments
    .filter(i => i.status === 'Active')
    .reduce((sum, i) => sum + (Number(i.amountInvested) || 0), 0);

  const totalCurrentValue = groupInvestments
    .filter(i => i.status === 'Active')
    .reduce((sum, i) => sum + (Number(i.currentValue || i.maturityAmount || i.amountInvested) || 0), 0);

  const fdList = groupInvestments.filter(i => i.type === 'Fixed Deposit' && i.status === 'Active');
  const rdList = groupInvestments.filter(i => i.type === 'Recurring Deposit' && i.status === 'Active');
  const mfList = groupInvestments.filter(i => i.type === 'Mutual Fund' && i.status === 'Active');

  const totalFdAmount = fdList.reduce((sum, i) => sum + (Number(i.amountInvested) || 0), 0);
  const totalRdMonthly = rdList.reduce((sum, i) => sum + (Number(i.monthlyDeposit) || 0), 0);
  const totalMfValue = mfList.reduce((sum, i) => sum + (Number(i.currentValue || i.amountInvested) || 0), 0);

  const openCreateModal = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      type: 'Fixed Deposit',
      title: '',
      institution: '',
      accountNumber: '',
      amountInvested: '',
      monthlyDeposit: '',
      currentValue: '',
      maturityAmount: '',
      interestRate: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      maturityDate: '',
      status: 'Active',
      nominee: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Investment) => {
    setEditingId(item.id);
    setFormError(null);
    setFormData({
      type: item.type,
      title: item.title,
      institution: item.institution,
      accountNumber: item.accountNumber || '',
      amountInvested: item.amountInvested ? item.amountInvested.toString() : '',
      monthlyDeposit: item.monthlyDeposit ? item.monthlyDeposit.toString() : '',
      currentValue: item.currentValue ? item.currentValue.toString() : '',
      maturityAmount: item.maturityAmount ? item.maturityAmount.toString() : '',
      interestRate: item.interestRate !== undefined ? item.interestRate.toString() : '',
      startDate: item.startDate,
      maturityDate: item.maturityDate || '',
      status: item.status,
      nominee: item.nominee || '',
      remarks: item.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.institution || !formData.amountInvested) {
      setFormError('Please fill in Scheme Title, Financial Institution, and Amount Invested.');
      return;
    }
    setFormError(null);

    const payload: Investment = {
      id: editingId || generateId(),
      groupId: activeGroupId,
      type: formData.type,
      title: formData.title.trim(),
      institution: formData.institution.trim(),
      accountNumber: formData.accountNumber.trim() || undefined,
      amountInvested: parseFloat(formData.amountInvested) || 0,
      monthlyDeposit: formData.monthlyDeposit ? parseFloat(formData.monthlyDeposit) : undefined,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      maturityAmount: formData.maturityAmount ? parseFloat(formData.maturityAmount) : undefined,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      startDate: formData.startDate,
      maturityDate: formData.maturityDate || undefined,
      status: formData.status,
      nominee: formData.nominee.trim() || undefined,
      remarks: formData.remarks.trim() || undefined,
      createdAt: editingId ? (groupInvestments.find(i => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) {
      updateInvestment(payload);
    } else {
      addInvestment(payload);
    }

    setIsModalOpen(false);
  };

  const exportToCSV = () => {
    if (!groupInvestments.length) return;

    const headers = [
      'Sl No.',
      'Type',
      'Scheme / Investment Title',
      'Institution / Bank / AMC',
      'Account / Folio No.',
      'Amount Invested',
      'Monthly Deposit (RD)',
      'Current Value',
      'Maturity Amount',
      'Interest Rate (% p.a.)',
      'Start Date',
      'Maturity Date',
      'Status',
      'Nominee / Signatory',
      'Remarks'
    ];

    const rows = groupInvestments.map((item, idx) => [
      idx + 1,
      `"${item.type}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.institution || '').replace(/"/g, '""')}"`,
      `"${(item.accountNumber || '').replace(/"/g, '""')}"`,
      item.amountInvested || 0,
      item.monthlyDeposit || '',
      item.currentValue || '',
      item.maturityAmount || '',
      item.interestRate !== undefined ? `${item.interestRate}%` : '',
      `"${item.startDate}"`,
      `"${item.maturityDate || ''}"`,
      `"${item.status}"`,
      `"${(item.nominee || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `investments-${activeGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadgeClass = (type: InvestmentType) => {
    switch (type) {
      case 'Fixed Deposit':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Recurring Deposit':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'Mutual Fund':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  const getStatusBadgeClass = (status: InvestmentStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold';
      case 'Matured':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold';
      case 'Closed':
        return 'bg-slate-700/60 text-slate-400 border border-slate-600/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-app-card p-5 rounded-xl border border-app-border print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text">Group Investments</h1>
              <p className="text-app-muted text-xs sm:text-sm mt-0.5">
                Fixed Deposits (FD), Recurring Deposits (RD), and Mutual Funds portfolio for <strong className="text-app-text">{activeGroup.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {groupInvestments.length > 0 && (
            <>
              <button
                type="button"
                onClick={exportToCSV}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
                title="Export Investments to CSV"
              >
                <Download className="w-4 h-4 text-app-primary" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
                title="Print Investment Register"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={openCreateModal}
              className="bento-btn bento-btn-primary flex items-center gap-2 py-2 px-3.5 text-xs sm:text-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="bento-card border-app-primary/30 bg-app-primary/5 relative overflow-hidden">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Active Capital Invested</div>
          <div className="text-2xl font-black font-mono text-app-primary truncate">
            {formatCurrency(totalInvested)}
          </div>
          <div className="text-[11px] text-app-muted mt-1">
            Current Est. Value: <strong className="text-slate-200">{formatCurrency(totalCurrentValue)}</strong>
          </div>
        </div>

        <div className="bento-card border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Fixed Deposits (FD)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20">{fdList.length}</span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400 truncate">
            {formatCurrency(totalFdAmount)}
          </div>
          <div className="text-[11px] text-app-muted mt-1">Guaranteed term returns</div>
        </div>

        <div className="bento-card border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Recurring Deposits (RD)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20">{rdList.length}</span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-400 truncate">
            {formatCurrency(totalRdMonthly)}<span className="text-xs font-normal text-purple-400/70">/mo</span>
          </div>
          <div className="text-[11px] text-app-muted mt-1">Monthly disciplined savings</div>
        </div>

        <div className="bento-card border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Mutual Funds (MF)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">{mfList.length}</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 truncate">
            {formatCurrency(totalMfValue)}
          </div>
          <div className="text-[11px] text-app-muted mt-1">Market-linked growth assets</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search scheme name, bank/AMC, folio no., or remarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bento-input pl-9 text-xs sm:text-sm py-2 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bento-select py-1 px-2.5 text-xs font-medium"
            >
              <option value="All">All Types</option>
              {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bento-select py-1 px-2.5 text-xs font-medium"
            >
              <option value="All">All Statuses</option>
              {INVESTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Header (Visible only in print) */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-300">
        <h1 className="text-2xl font-black uppercase text-slate-900">{activeGroup.name}</h1>
        <h2 className="text-base font-bold uppercase text-blue-700 mt-0.5">GROUP INVESTMENT REGISTER</h2>
        <p className="text-xs text-slate-500 mt-1">Generated on {format(new Date(), 'dd MMMM yyyy, hh:mm a')}</p>
      </div>

      {/* Main Table */}
      <div className="bento-card !p-0 overflow-hidden border border-app-border">
        <div className="overflow-x-auto">
          <table className="bento-table w-full">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Type</th>
                <th>Scheme Title & Institution</th>
                <th>Folio / Account</th>
                <th className="text-right">Amount Invested</th>
                <th className="text-right">Maturity / Current Value</th>
                <th className="text-center">ROI</th>
                <th className="text-center">Dates (Start - Due)</th>
                <th className="text-center">Status</th>
                <th className="text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((item, index) => {
                const daysRemaining = item.maturityDate ? differenceInDays(new Date(item.maturityDate), new Date()) : null;
                const isNearingMaturity = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30 && item.status === 'Active';
                const isOverdueMaturity = daysRemaining !== null && daysRemaining <= 0 && item.status === 'Active';

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="text-center font-mono text-xs text-app-muted">{index + 1}</td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${getTypeBadgeClass(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        {item.title}
                      </div>
                      <div className="text-xs text-app-muted flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 opacity-70" />
                        <span>{item.institution}</span>
                      </div>
                      {item.remarks && (
                        <div className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                          "{item.remarks}"
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-xs text-slate-300">
                      {item.accountNumber || <span className="text-app-muted">-</span>}
                    </td>
                    <td className="text-right font-mono font-bold text-app-primary">
                      {formatCurrency(item.amountInvested)}
                      {item.monthlyDeposit ? (
                        <div className="text-[10px] text-purple-400 font-normal mt-0.5">
                          ({formatCurrency(item.monthlyDeposit)}/mo)
                        </div>
                      ) : null}
                    </td>
                    <td className="text-right font-mono">
                      {item.currentValue ? (
                        <div className="font-bold text-emerald-400">{formatCurrency(item.currentValue)}</div>
                      ) : item.maturityAmount ? (
                        <div className="font-bold text-slate-200">{formatCurrency(item.maturityAmount)}</div>
                      ) : (
                        <span className="text-app-muted">-</span>
                      )}
                      {item.currentValue && item.maturityAmount && (
                        <div className="text-[10px] text-app-muted">Mat: {formatCurrency(item.maturityAmount)}</div>
                      )}
                    </td>
                    <td className="text-center font-mono text-xs">
                      {item.interestRate !== undefined ? `${item.interestRate}%` : '-'}
                    </td>
                    <td className="text-center font-mono text-xs">
                      <div>{format(new Date(item.startDate), 'dd/MM/yy')}</div>
                      {item.maturityDate ? (
                        <div className={`text-[11px] mt-0.5 ${isOverdueMaturity ? 'text-rose-400 font-bold' : isNearingMaturity ? 'text-amber-400 font-bold' : 'text-app-muted'}`}>
                          Due: {format(new Date(item.maturityDate), 'dd/MM/yy')}
                        </div>
                      ) : (
                        <div className="text-[10px] text-app-muted">Open-ended</div>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-right print:hidden">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvestment(item)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded hover:bg-slate-700 text-app-primary hover:text-app-primary transition-colors"
                              title="Edit Investment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete Investment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvestments.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-app-muted">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30 text-app-primary" />
                    <p className="font-semibold text-sm">No investment records found.</p>
                    <p className="text-xs text-app-muted mt-1">
                      {groupInvestments.length === 0 ? 'Click "Add Investment" to record a Fixed Deposit, Recurring Deposit, or Mutual Fund.' : 'Try clearing your search query or filters.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Investment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-app-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Investment Record' : 'Record New Investment'}
                </h3>
                <p className="text-xs text-app-muted mt-0.5">Fixed Deposit, Recurring Deposit, or Mutual Fund details</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Investment Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as InvestmentType })}
                    className="bento-select w-full"
                    required
                  >
                    {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label-small mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as InvestmentStatus })}
                    className="bento-select w-full"
                  >
                    {INVESTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Scheme / Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI 3-Yr Special FD, HDFC Balance Advantage"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="bento-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Financial Institution / Bank / AMC *</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India, Post Office, Nippon India"
                    value={formData.institution}
                    onChange={e => setFormData({ ...formData, institution: e.target.value })}
                    className="bento-input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-small mb-1 block">Account / Folio / Cert. No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 40291823901 or 192837/91"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="bento-input w-full font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Amount Invested (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amountInvested}
                    onChange={e => setFormData({ ...formData, amountInvested: e.target.value })}
                    className="bento-input w-full font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    placeholder="e.g. 7.25"
                    value={formData.interestRate}
                    onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                    className="bento-input w-full font-mono"
                  />
                </div>
              </div>

              {/* Conditional RD Monthly Deposit */}
              {formData.type === 'Recurring Deposit' && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
                  <label className="label-small mb-1 block text-purple-300 font-bold">Monthly RD Installment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 1000"
                    value={formData.monthlyDeposit}
                    onChange={e => setFormData({ ...formData, monthlyDeposit: e.target.value })}
                    className="bento-input w-full font-mono font-bold text-purple-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Current / NAV Valuation (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional: Current market value"
                    value={formData.currentValue}
                    onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                    className="bento-input w-full font-mono"
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Expected Maturity Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional: Final payout at maturity"
                    value={formData.maturityAmount}
                    onChange={e => setFormData({ ...formData, maturityAmount: e.target.value })}
                    className="bento-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Start / Deposit Date *</label>
                  <DateInput
                    value={formData.startDate}
                    onChange={val => setFormData({ ...formData, startDate: val })}
                    className="bento-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Maturity Date (Optional for MF)</label>
                  <DateInput
                    value={formData.maturityDate}
                    onChange={val => setFormData({ ...formData, maturityDate: val })}
                    className="bento-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label-small mb-1 block">Nominee / Authorized Signatories</label>
                <input
                  type="text"
                  placeholder="e.g. President Sunita Devi & Treasurer Rita Roy"
                  value={formData.nominee}
                  onChange={e => setFormData({ ...formData, nominee: e.target.value })}
                  className="bento-input w-full text-sm"
                />
              </div>

              <div>
                <label className="label-small mb-1 block">Investment Remarks & Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Auto-renewal on maturity, certificate kept in bank safe deposit, quarterly interest credited to savings A/C..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="bento-input w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bento-btn bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bento-btn bento-btn-primary flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Record Investment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-start pb-3 border-b border-app-border mb-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${getTypeBadgeClass(selectedInvestment.type)}`}>
                  {selectedInvestment.type}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedInvestment.title}</h3>
                <p className="text-xs text-app-muted flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{selectedInvestment.institution}</span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedInvestment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-app-border/40">
                <div>
                  <div className="text-[11px] text-app-muted uppercase">Invested Capital</div>
                  <div className="font-bold text-base text-app-primary font-mono">{formatCurrency(selectedInvestment.amountInvested)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-app-muted uppercase">Current / Est. Value</div>
                  <div className="font-bold text-base text-emerald-400 font-mono">
                    {formatCurrency(selectedInvestment.currentValue || selectedInvestment.maturityAmount || selectedInvestment.amountInvested)}
                  </div>
                </div>
              </div>

              {selectedInvestment.monthlyDeposit && (
                <div className="flex justify-between items-center p-2 rounded bg-purple-500/10 border border-purple-500/20 text-xs">
                  <span className="text-purple-300 font-medium">Monthly RD Deposit:</span>
                  <span className="font-bold text-purple-200 font-mono">{formatCurrency(selectedInvestment.monthlyDeposit)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-app-muted block">Account / Folio No.</span>
                  <span className="font-mono text-white">{selectedInvestment.accountNumber || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-app-muted block">Interest Rate</span>
                  <span className="font-mono text-white">{selectedInvestment.interestRate !== undefined ? `${selectedInvestment.interestRate}% p.a.` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-app-muted block">Start Date</span>
                  <span className="font-mono text-white">{format(new Date(selectedInvestment.startDate), 'dd MMMM yyyy')}</span>
                </div>
                <div>
                  <span className="text-app-muted block">Maturity Date</span>
                  <span className="font-mono text-white">
                    {selectedInvestment.maturityDate ? format(new Date(selectedInvestment.maturityDate), 'dd MMMM yyyy') : 'Open-ended'}
                  </span>
                </div>
                {selectedInvestment.nominee && (
                  <div className="col-span-2">
                    <span className="text-app-muted block">Nominee / Signatory</span>
                    <span className="text-white">{selectedInvestment.nominee}</span>
                  </div>
                )}
              </div>

              {selectedInvestment.remarks && (
                <div className="p-3 bg-slate-900 rounded-lg border border-app-border/40 text-xs">
                  <span className="text-app-muted block font-semibold mb-1">Remarks & Investment Details:</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{selectedInvestment.remarks}</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-app-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvestment(null)}
                className="bento-btn bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Delete Investment Record"
        message="Are you sure you want to delete this investment record? This will remove the investment entry from the group ledger."
        onConfirm={() => {
          if (deletingId) {
            deleteInvestment(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
