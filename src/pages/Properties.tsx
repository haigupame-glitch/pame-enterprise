import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { DateInput } from '../components/DateInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Property, PropertyCategory, PropertyCondition, PropertyStatus } from '../types';
import { 
  Landmark, Plus, Search, Filter, Download, Printer, 
  Edit2, Trash2, MapPin, User, Tag, AlertTriangle, 
  CheckCircle2, X, Check, FileText, ChevronRight, MessageSquare, AlertCircle 
} from 'lucide-react';

const PROPERTY_CATEGORIES: PropertyCategory[] = [
  'Equipment & Machinery',
  'Land & Building',
  'Furniture & Fixtures',
  'Electronics & IT',
  'Vehicles & Transport',
  'Tools & Implements',
  'Other'
];

const PROPERTY_CONDITIONS: PropertyCondition[] = [
  'Excellent',
  'Good',
  'Needs Repair',
  'Damaged',
  'Disposed'
];

const PROPERTY_STATUSES: PropertyStatus[] = [
  'In Use',
  'Rented Out',
  'In Storage',
  'Disposed',
  'Donated'
];

export function Properties() {
  const { groups, activeGroupId, properties, addProperty, updateProperty, deleteProperty, currentUserRole } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  const groupProperties = properties.filter(p => p.groupId === activeGroupId);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Remarks Modal
  const [quickRemarksProperty, setQuickRemarksProperty] = useState<Property | null>(null);
  const [quickRemarksText, setQuickRemarksText] = useState('');

  // Form Fields
  const [formData, setFormData] = useState<{
    name: string;
    category: PropertyCategory;
    acquisitionDate: string;
    purchasePrice: string;
    estimatedValue: string;
    condition: PropertyCondition;
    status: PropertyStatus;
    location: string;
    custodian: string;
    serialNumber: string;
    remarks: string;
  }>({
    name: '',
    category: 'Equipment & Machinery',
    acquisitionDate: format(new Date(), 'yyyy-MM-dd'),
    purchasePrice: '',
    estimatedValue: '',
    condition: 'Good',
    status: 'In Use',
    location: '',
    custodian: '',
    serialNumber: '',
    remarks: ''
  });

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  if (!activeGroupId || !activeGroup) {
    return (
      <div className="p-8 text-center text-app-muted">
        <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40 text-app-primary" />
        <p>Please select a group first to view group property records.</p>
      </div>
    );
  }

  // Filtered properties
  const filteredProperties = groupProperties.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.custodian && item.custodian.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });

  // Calculate Metrics
  const totalValuation = groupProperties
    .filter(p => p.status !== 'Disposed')
    .reduce((sum, p) => sum + (Number(p.estimatedValue || p.purchasePrice) || 0), 0);

  const inUseCount = groupProperties.filter(p => p.status === 'In Use' || p.status === 'Rented Out').length;
  const needsRepairCount = groupProperties.filter(p => p.condition === 'Needs Repair' || p.condition === 'Damaged').length;

  const openCreateModal = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      name: '',
      category: 'Equipment & Machinery',
      acquisitionDate: format(new Date(), 'yyyy-MM-dd'),
      purchasePrice: '',
      estimatedValue: '',
      condition: 'Good',
      status: 'In Use',
      location: activeGroup.name + ' Office',
      custodian: '',
      serialNumber: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Property) => {
    setEditingId(item.id);
    setFormError(null);
    setFormData({
      name: item.name,
      category: item.category,
      acquisitionDate: item.acquisitionDate,
      purchasePrice: item.purchasePrice ? item.purchasePrice.toString() : '',
      estimatedValue: item.estimatedValue ? item.estimatedValue.toString() : '',
      condition: item.condition,
      status: item.status,
      location: item.location,
      custodian: item.custodian || '',
      serialNumber: item.serialNumber || '',
      remarks: item.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      setFormError('Please fill in Property Name and Location.');
      return;
    }
    setFormError(null);

    const payload: Property = {
      id: editingId || generateId(),
      groupId: activeGroupId,
      name: formData.name.trim(),
      category: formData.category,
      acquisitionDate: formData.acquisitionDate,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      condition: formData.condition,
      status: formData.status,
      location: formData.location.trim(),
      custodian: formData.custodian.trim() || undefined,
      serialNumber: formData.serialNumber.trim() || undefined,
      remarks: formData.remarks.trim(),
      createdAt: editingId ? (groupProperties.find(p => p.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) {
      updateProperty(payload);
    } else {
      addProperty(payload);
    }

    setIsModalOpen(false);
  };

  const handleSaveQuickRemarks = () => {
    if (!quickRemarksProperty) return;
    updateProperty({
      ...quickRemarksProperty,
      remarks: quickRemarksText.trim()
    });
    setQuickRemarksProperty(null);
  };

  const exportToCSV = () => {
    if (!groupProperties.length) return;

    const headers = [
      'Sl No.',
      'Property / Asset Name',
      'Category',
      'Acquisition Date',
      'Purchase Price',
      'Estimated Value',
      'Condition',
      'Status',
      'Location / Whereabouts',
      'Custodian / Responsible Person',
      'Serial No. / Asset Tag',
      'Remarks of Property'
    ];

    const rows = groupProperties.map((item, idx) => [
      idx + 1,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.acquisitionDate}"`,
      item.purchasePrice || '',
      item.estimatedValue || '',
      `"${item.condition}"`,
      `"${item.status}"`,
      `"${(item.location || '').replace(/"/g, '""')}"`,
      `"${(item.custodian || '').replace(/"/g, '""')}"`,
      `"${(item.serialNumber || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `group-properties-${activeGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConditionBadgeClass = (condition: PropertyCondition) => {
    switch (condition) {
      case 'Excellent':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold';
      case 'Good':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Needs Repair':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold';
      case 'Damaged':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold';
      case 'Disposed':
        return 'bg-slate-700/60 text-slate-400 border border-slate-600/50';
    }
  };

  const getStatusBadgeClass = (status: PropertyStatus) => {
    switch (status) {
      case 'In Use':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Rented Out':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'In Storage':
        return 'bg-slate-800 text-slate-300 border border-slate-700';
      case 'Disposed':
      case 'Donated':
        return 'bg-slate-800 text-slate-500 border border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-app-card p-5 rounded-xl border border-app-border print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-app-primary/10 text-app-primary border border-app-primary/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text">Group Property & Assets</h1>
              <p className="text-app-muted text-xs sm:text-sm mt-0.5">
                Register of physical property, equipment, machinery, land, and assets for <strong className="text-app-text">{activeGroup.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {groupProperties.length > 0 && (
            <>
              <button
                type="button"
                onClick={exportToCSV}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
                title="Export Property Register to CSV"
              >
                <Download className="w-4 h-4 text-app-primary" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
                title="Print Property Register"
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
              <span>Add Property</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="bento-card border-app-primary/30 bg-app-primary/5 relative overflow-hidden">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Total Assets Registered</div>
          <div className="text-2xl font-black font-mono text-app-primary">
            {groupProperties.length} <span className="text-sm font-medium text-app-muted">items</span>
          </div>
          <div className="text-[11px] text-app-muted mt-1">Across all categories</div>
        </div>

        <div className="bento-card border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Property Valuation</div>
          <div className="text-2xl font-black font-mono text-emerald-400 truncate">
            {formatCurrency(totalValuation)}
          </div>
          <div className="text-[11px] text-app-muted mt-1">Current estimated worth</div>
        </div>

        <div className="bento-card border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Active / In Use</div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {inUseCount} <span className="text-sm font-medium text-app-muted">active</span>
          </div>
          <div className="text-[11px] text-app-muted mt-1">Operating or rented out</div>
        </div>

        <div className="bento-card border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Maintenance Attention</div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {needsRepairCount} <span className="text-sm font-medium text-app-muted">needs repair</span>
          </div>
          <div className="text-[11px] text-app-muted mt-1">Check remarks for status</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bento-card p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search property name, location, custodian, serial no., or remarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bento-input pl-9 text-xs sm:text-sm py-2 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bento-select py-1 px-2.5 text-xs font-medium"
            >
              <option value="All">All Categories</option>
              {PROPERTY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <span>Condition:</span>
            <select
              value={conditionFilter}
              onChange={e => setConditionFilter(e.target.value)}
              className="bento-select py-1 px-2.5 text-xs font-medium"
            >
              <option value="All">All Conditions</option>
              {PROPERTY_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
              {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Header (Visible only in print) */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-300">
        <h1 className="text-2xl font-black uppercase text-slate-900">{activeGroup.name}</h1>
        <h2 className="text-base font-bold uppercase text-blue-700 mt-0.5">GROUP PROPERTY & ASSET REGISTER</h2>
        <p className="text-xs text-slate-500 mt-1">Generated on {format(new Date(), 'dd MMMM yyyy, hh:mm a')}</p>
      </div>

      {/* Main Table */}
      <div className="bento-card !p-0 overflow-hidden border border-app-border">
        <div className="overflow-x-auto">
          <table className="bento-table w-full">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Property / Asset Details</th>
                <th>Category</th>
                <th>Location & Custodian</th>
                <th className="text-right">Acquisition / Est. Value</th>
                <th className="text-center">Acquired Date</th>
                <th className="text-center">Condition</th>
                <th className="text-center">Status</th>
                <th className="max-w-[220px]">Remarks of Property</th>
                <th className="text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((item, index) => {
                const valuation = item.estimatedValue || item.purchasePrice || 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="text-center font-mono text-xs text-app-muted">{index + 1}</td>
                    <td>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        {item.name}
                      </div>
                      {item.serialNumber && (
                        <div className="text-[11px] font-mono text-app-muted flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 opacity-60" />
                          <span>Tag/Serial: {item.serialNumber}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-app-primary opacity-80" />
                        <span>{item.location}</span>
                      </div>
                      {item.custodian && (
                        <div className="text-[11px] text-app-muted flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 opacity-60" />
                          <span>{item.custodian}</span>
                        </div>
                      )}
                    </td>
                    <td className="text-right font-mono">
                      <div className="font-bold text-app-primary">{formatCurrency(valuation)}</div>
                      {item.purchasePrice && item.estimatedValue && item.purchasePrice !== item.estimatedValue && (
                        <div className="text-[10px] text-app-muted">Cost: {formatCurrency(item.purchasePrice)}</div>
                      )}
                    </td>
                    <td className="text-center font-mono text-xs text-app-muted">
                      {item.acquisitionDate ? format(new Date(item.acquisitionDate), 'dd/MM/yy') : '-'}
                    </td>
                    <td className="text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getConditionBadgeClass(item.condition)}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="max-w-[220px]">
                      {item.remarks ? (
                        <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={item.remarks}>
                          {item.remarks}
                        </div>
                      ) : (
                        <span className="text-xs text-app-muted italic">No remarks recorded</span>
                      )}
                    </td>
                    <td className="text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRemarksProperty(item);
                            setQuickRemarksText(item.remarks || '');
                          }}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Make / Edit Remarks"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-app-primary" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProperty(item)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Full Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded hover:bg-slate-700 text-app-primary hover:text-app-primary transition-colors"
                              title="Edit Property Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete Property Record"
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

              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-app-muted">
                    <Landmark className="w-10 h-10 mx-auto mb-2 opacity-30 text-app-primary" />
                    <p className="font-semibold text-sm">No group property records found.</p>
                    <p className="text-xs text-app-muted mt-1">
                      {groupProperties.length === 0 ? 'Click "Add Property" to record equipment, machinery, land, furniture, or assets.' : 'Try changing your search filter.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Property */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-app-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Group Property Record' : 'Add Group Property Record'}
                </h3>
                <p className="text-xs text-app-muted mt-0.5">Record property details, asset condition, and ongoing remarks</p>
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
                  <label className="label-small mb-1 block">Property / Asset Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Industrial Sewing Machines (5 units), Community Land"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bento-input w-full font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as PropertyCategory })}
                    className="bento-select w-full"
                    required
                  >
                    {PROPERTY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Location / Whereabouts *</label>
                  <input
                    type="text"
                    placeholder="e.g. Village SHG Office Room 1, Panchayat Bhavan"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="bento-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Custodian / Person in Charge</label>
                  <input
                    type="text"
                    placeholder="e.g. Secretary Sunita Devi"
                    value={formData.custodian}
                    onChange={e => setFormData({ ...formData, custodian: e.target.value })}
                    className="bento-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-small mb-1 block">Acquisition Date</label>
                  <DateInput
                    value={formData.acquisitionDate}
                    onChange={val => setFormData({ ...formData, acquisitionDate: val })}
                    className="bento-input w-full"
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="bento-input w-full font-mono"
                  />
                </div>

                <div>
                  <label className="label-small mb-1 block">Current Est. Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.estimatedValue}
                    onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })}
                    className="bento-input w-full font-mono font-bold text-app-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-small mb-1 block">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as PropertyCondition })}
                    className="bento-select w-full"
                  >
                    {PROPERTY_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label-small mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                    className="bento-select w-full"
                  >
                    {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label-small mb-1 block">Asset Tag / Serial No.</label>
                  <input
                    type="text"
                    placeholder="e.g. SHG-ASSET-004"
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="bento-input w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label-small mb-1 block flex items-center justify-between">
                  <span>Remarks of the Property</span>
                  <span className="text-[10px] text-app-muted">Maintenance, warranty, donor info, rental notes</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Make detailed remarks about the property (e.g. Purchased under NABARD grant, serviced on June 2026, rented out for village weddings at ₹500/day, warranty expires Dec 2027)..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="bento-input w-full text-sm leading-relaxed"
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
                  <span>{editingId ? 'Save Changes' : 'Record Property'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Remarks Edit */}
      {quickRemarksProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center pb-3 border-b border-app-border mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-app-primary" />
                  <span>Make Remarks of Property</span>
                </h3>
                <p className="text-xs text-app-muted mt-0.5 truncate max-w-xs">{quickRemarksProperty.name}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setQuickRemarksProperty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Property Remarks & History Log</label>
                <textarea
                  rows={4}
                  value={quickRemarksText}
                  onChange={e => setQuickRemarksText(e.target.value)}
                  placeholder="Record maintenance logs, condition notes, rental records, receipt details, or physical audit remarks..."
                  className="bento-input w-full text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setQuickRemarksProperty(null)}
                  className="bento-btn bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickRemarks}
                  className="bento-btn bento-btn-primary flex items-center gap-1.5 text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Remarks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Details */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-start pb-3 border-b border-app-border mb-4">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedProperty.category}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedProperty.name}</h3>
                {selectedProperty.serialNumber && (
                  <p className="text-xs font-mono text-app-muted mt-0.5">Asset Tag: {selectedProperty.serialNumber}</p>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-app-border/40">
                <div>
                  <div className="text-[11px] text-app-muted uppercase">Purchase Cost</div>
                  <div className="font-bold text-base text-slate-200 font-mono">
                    {selectedProperty.purchasePrice ? formatCurrency(selectedProperty.purchasePrice) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-app-muted uppercase">Estimated Value</div>
                  <div className="font-bold text-base text-app-primary font-mono">
                    {formatCurrency(selectedProperty.estimatedValue || selectedProperty.purchasePrice || 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-app-muted block">Location</span>
                  <span className="text-white flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-app-primary" />
                    <span>{selectedProperty.location}</span>
                  </span>
                </div>
                <div>
                  <span className="text-app-muted block">Custodian</span>
                  <span className="text-white flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-app-primary" />
                    <span>{selectedProperty.custodian || 'Unassigned'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-app-muted block">Condition</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] mt-1 ${getConditionBadgeClass(selectedProperty.condition)}`}>
                    {selectedProperty.condition}
                  </span>
                </div>
                <div>
                  <span className="text-app-muted block">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] mt-1 ${getStatusBadgeClass(selectedProperty.status)}`}>
                    {selectedProperty.status}
                  </span>
                </div>
                <div>
                  <span className="text-app-muted block">Acquisition Date</span>
                  <span className="font-mono text-white mt-0.5 block">
                    {selectedProperty.acquisitionDate ? format(new Date(selectedProperty.acquisitionDate), 'dd MMMM yyyy') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-app-border/40 text-xs">
                <span className="text-app-muted block font-semibold mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-app-primary" />
                  <span>Remarks of the Property:</span>
                </span>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedProperty.remarks || 'No remarks recorded yet.'}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-app-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
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
        title="Delete Property Record"
        message="Are you sure you want to delete this property record? This will remove the asset entry from the group register."
        onConfirm={() => {
          if (deletingId) {
            deleteProperty(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
