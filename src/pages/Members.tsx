import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';
import { Trash2, Edit2, Check, X, IdCard, Key, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { IdCardModal } from '../components/IdCardModal';
import { MemberLoginModal } from '../components/MemberLoginModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Members() {
  const { members, groups, activeGroupId, addMember, updateMember, deleteMember, currentUserRole, currentUserId, collections, loans, loanRepayments } = useAppContext();
  const [name, setName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', memberNumber: '', contact: '', address: '', aadharNumber: '' });
  const [selectedMemberForId, setSelectedMemberForId] = useState<any | null>(null);
  const [selectedMemberForLogin, setSelectedMemberForLogin] = useState<any | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const groupMembers = members.filter(m => m.groupId === activeGroupId);
  const activeGroup = groups.find(g => g.id === activeGroupId);

  const canAddMember = currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && activeGroup?.allowAdminEdit);

  const canEditMember = (memberId: string) => {
    if (currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && activeGroup?.allowAdminEdit)) return true;
    if (currentUserRole === 'MEMBER' && currentUserId === memberId) return true;
    return false;
  };

  const isActuallyOnline = (member: any) => {
    if (!member.isOnline) return false;
    if (!member.lastActive) return true;
    // Consider online if active within last 5 minutes
    const inactiveTime = new Date().getTime() - new Date(member.lastActive).getTime();
    return inactiveTime < 5 * 60 * 1000;
  };

  const checkEligibility = (memberId: string) => {
    const memberLoans = loans.filter(l => l.memberId === memberId && l.status === 'Active');
    const memberCollections = collections.filter(c => c.memberId === memberId).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    if (memberLoans.length > 0) {
      // Find total unpaid principal
      const unpaidPrincipal = memberLoans.reduce((sum, loan) => {
        const repayments = loanRepayments.filter(r => r.loanId === loan.id).reduce((rSum, r) => rSum + (Number(r.principalAmount) || 0), 0);
        return sum + (loan.principal - repayments);
      }, 0);
      
      if (unpaidPrincipal > 0) {
        return { status: 'Not Eligible', reason: 'Active Loan' };
      }
    }
    
    if (memberCollections === 0) {
      return { status: 'Not Eligible', reason: 'No Collections' };
    }
    
    return { status: 'Eligible', reason: 'Meets Criteria' };
  };

  const canDeleteMember = currentUserRole === 'SUPER_ADMIN';

  const exportToCSV = () => {
    if (!groupMembers.length) return;

    const headers = ['SL No.', 'Member ID', 'Name', 'Contact', 'Aadhar', 'Address', 'Join Date', 'Role', 'Eligibility'];
    const csvData = [
      headers.join(','),
      ...groupMembers.map((m, index) => {
        const eligibility = checkEligibility(m.id);
        return [
          index + 1,
          `"${m.memberNumber || ''}"`,
          `"${m.name.replace(/"/g, '""') || ''}"`,
          `"${m.contact || ''}"`,
          `"${m.aadharNumber || ''}"`,
          `"${(m.address || '').replace(/"/g, '""')}"`,
          `"${m.joinDate || ''}"`,
          `"${m.role || 'MEMBER'}"`,
          `"${eligibility.status}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `members-${activeGroup?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'group'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeGroupId || !memberNumber.trim() || !contact.trim() || !aadharNumber.trim()) return;
    
    addMember({
      id: generateId(),
      groupId: activeGroupId,
      memberNumber: memberNumber.trim(),
      name: name.trim(),
      contact: contact.trim(),
      address: address.trim(),
      aadharNumber: aadharNumber.trim(),
      joinDate: new Date().toISOString(),
    });
    setName('');
    setMemberNumber('');
    setContact('');
    setAddress('');
    setAadharNumber('');
  };

  const startEdit = (member: any) => {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      memberNumber: member.memberNumber || '',
      contact: member.contact || '',
      address: member.address || '',
      aadharNumber: member.aadharNumber || '',
    });
  };

  const saveEdit = (member: any) => {
    if (!editForm.name.trim() || !editForm.memberNumber.trim() || !editForm.contact.trim() || !editForm.aadharNumber.trim()) return;
    updateMember({
      ...member,
      name: editForm.name.trim(),
      memberNumber: editForm.memberNumber.trim(),
      contact: editForm.contact.trim(),
      address: editForm.address.trim(),
      aadharNumber: editForm.aadharNumber.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {canAddMember && (
        <div className="bento-card">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="card-header">ADD MEMBER</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Member ID No. *</label>
                <input
                  type="text"
                  required
                  value={memberNumber}
                  onChange={e => setMemberNumber(e.target.value)}
                  className="bento-input font-mono"
                  placeholder="ID Number"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bento-input"
                  placeholder="Name"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Contact No. *</label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="bento-input"
                  placeholder="Phone"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Identity/Aadhar No. *</label>
                <input
                  type="text"
                  required
                  value={aadharNumber}
                  onChange={e => setAadharNumber(e.target.value)}
                  className="bento-input font-mono"
                  placeholder="xxxx xxxx xxxx"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="bento-input"
                  placeholder="Address"
                />
              </div>
              <div className="lg:col-span-1">
                <button
                  type="submit"
                  className="bento-btn bento-btn-primary w-full"
                >
                  Add Member
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bento-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-app-border bg-slate-800/30 flex items-center justify-between">
          <div className="card-header !mb-0">MEMBER DIRECTORY ({groupMembers.length} TOTAL)</div>
          {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && groupMembers.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bento-btn bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 text-xs"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="bento-table">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="w-16">SL No.</th>
                <th>Member ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Aadhar</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Eligibility</th>
                {(canAddMember || currentUserRole === 'MEMBER') && <th className="w-24 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((member, idx) => (
                <tr key={member.id} className="hover:bg-slate-700/20">
                  <td className="text-app-muted font-mono">{idx + 1}</td>
                  {editingId === member.id ? (
                    <>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={editForm.memberNumber} 
                          onChange={e => setEditForm({...editForm, memberNumber: e.target.value})} 
                          className="bento-input py-1 px-2 text-sm w-full min-w-[80px]" 
                          placeholder="ID" 
                          disabled={currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN'}
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})} 
                          className="bento-input py-1 px-2 text-sm w-full min-w-[120px]" 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={editForm.contact} 
                          onChange={e => setEditForm({...editForm, contact: e.target.value})} 
                          className="bento-input py-1 px-2 text-sm w-full min-w-[100px]" 
                          disabled={currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN'}
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={editForm.aadharNumber} 
                          onChange={e => setEditForm({...editForm, aadharNumber: e.target.value})} 
                          className="bento-input py-1 px-2 text-sm font-mono w-full min-w-[120px]" 
                          disabled={currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN'}
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={editForm.address} 
                          onChange={e => setEditForm({...editForm, address: e.target.value})} 
                          className="bento-input py-1 px-2 text-sm w-full min-w-[140px]" 
                          disabled={currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN'}
                        />
                      </td>
                      <td className="text-sm text-app-muted">{format(new Date(member.joinDate), 'dd/MM/yy')}</td>
                      <td className="text-sm text-app-muted"></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => saveEdit(member)} className="text-app-accent hover:text-emerald-400 p-1" title="Save"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-app-muted hover:text-white p-1" title="Cancel"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-mono font-medium text-emerald-400">{member.memberNumber || '-'}</td>
                      <td className="font-bold">
                        <div className="flex items-center gap-2 flex-wrap">
                          {member.name}
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                            !member.role || member.role === 'MEMBER' 
                              ? "bg-slate-700/50 text-slate-300 border-slate-600/50"
                              : member.role === 'SUPER_ADMIN' 
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          )}>
                            {(member.role || 'MEMBER').replace('_', ' ')}
                          </span>
                          {isActuallyOnline(member) && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
                            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9px] uppercase tracking-wider font-bold">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              Online
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-sm">{member.contact || '-'}</td>
                      <td className="font-mono text-sm">{member.aadharNumber || '-'}</td>
                      <td className="text-sm">{member.address || '-'}</td>
                      <td className="text-sm text-app-muted">{format(new Date(member.joinDate), 'dd/MM/yy')}</td>
                      <td>
                         <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", checkEligibility(member.id).status === 'Eligible' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")} title={checkEligibility(member.id).reason}>
                           {checkEligibility(member.id).status}
                         </span>
                      </td>
                      {(canAddMember || currentUserRole === 'MEMBER') && (
                        <td className="text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {canAddMember && (
                              <button onClick={() => setSelectedMemberForLogin(member)} className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 px-2 py-1 rounded transition-colors" title="Manage Access">
                                <Key className="w-4 h-4" />
                                <span className="text-xs font-medium">Manage Access</span>
                              </button>
                            )}
                            {canEditMember(member.id) && (
                              <button onClick={() => startEdit(member)} className="text-app-primary hover:text-blue-400 p-1 transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => setSelectedMemberForId(member)} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-2 py-1 rounded transition-colors" title="Generate ID Card">
                              <IdCard className="w-4 h-4" />
                              <span className="text-xs font-medium">ID Card</span>
                            </button>
                            {canDeleteMember && (
                              <button onClick={() => setDeletingMemberId(member.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
              {groupMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-app-muted">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedMemberForId && activeGroup && (
        <IdCardModal
          member={selectedMemberForId}
          group={activeGroup}
          onClose={() => setSelectedMemberForId(null)}
        />
      )}
      
      {selectedMemberForLogin && (
        <MemberLoginModal
          member={selectedMemberForLogin}
          onClose={() => setSelectedMemberForLogin(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deletingMemberId !== null}
        title="Delete Member"
        message={`Are you sure you want to delete member "${members.find(m => m.id === deletingMemberId)?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deletingMemberId) {
            deleteMember(deletingMemberId);
            setDeletingMemberId(null);
          }
        }}
        onCancel={() => setDeletingMemberId(null)}
      />
    </div>
  );
}
