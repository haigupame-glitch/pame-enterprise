import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';
import { Trash2, Edit2, Check, X, IdCard, Key } from 'lucide-react';
import { IdCardModal } from '../components/IdCardModal';
import { MemberLoginModal } from '../components/MemberLoginModal';

export function Members() {
  const { members, groups, activeGroupId, addMember, updateMember, deleteMember, currentUserRole, currentUserId } = useAppContext();
  const [name, setName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', memberNumber: '', contact: '', address: '', aadharNumber: '' });
  const [selectedMemberForId, setSelectedMemberForId] = useState<any | null>(null);
  const [selectedMemberForLogin, setSelectedMemberForLogin] = useState<any | null>(null);

  const groupMembers = members.filter(m => m.groupId === activeGroupId);
  const activeGroup = groups.find(g => g.id === activeGroupId);

  const canAddMember = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const canEditMember = (memberId: string) => {
    if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') return true;
    if (currentUserRole === 'MEMBER' && currentUserId === memberId) return true;
    return false;
  };

  const canDeleteMember = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeGroupId) return;
    
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
    if (!editForm.name.trim()) return;
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

  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteMember(id);
    setDeletingMemberId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {canAddMember && (
        <div className="bento-card">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="card-header">ADD MEMBER</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Member ID No.</label>
                <input
                  type="text"
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
                <label className="label-small mb-1 block">Contact No.</label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="bento-input"
                  placeholder="Phone"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="label-small mb-1 block">Aadhar No.</label>
                <input
                  type="text"
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
        <div className="p-4 border-b border-app-border bg-slate-800/30">
          <div className="card-header !mb-0">MEMBER DIRECTORY ({groupMembers.length} TOTAL)</div>
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
                {(canAddMember || currentUserRole === 'MEMBER') && <th className="w-24 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((member, idx) => (
                <tr key={member.id} className="hover:bg-slate-700/20">
                  <td className="text-app-muted font-mono">{idx + 1}</td>
                  {editingId === member.id ? (
                    <>
                      <td className="p-2"><input type="text" value={editForm.memberNumber} onChange={e => setEditForm({...editForm, memberNumber: e.target.value})} className="bento-input py-1 px-2 text-sm w-full min-w-[80px]" placeholder="ID" /></td>
                      <td className="p-2"><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bento-input py-1 px-2 text-sm w-full min-w-[120px]" /></td>
                      <td className="p-2"><input type="text" value={editForm.contact} onChange={e => setEditForm({...editForm, contact: e.target.value})} className="bento-input py-1 px-2 text-sm w-full min-w-[100px]" /></td>
                      <td className="p-2"><input type="text" value={editForm.aadharNumber} onChange={e => setEditForm({...editForm, aadharNumber: e.target.value})} className="bento-input py-1 px-2 text-sm font-mono w-full min-w-[120px]" /></td>
                      <td className="p-2"><input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="bento-input py-1 px-2 text-sm w-full min-w-[140px]" /></td>
                      <td className="text-sm text-app-muted">{format(new Date(member.joinDate), 'dd/MM/yy')}</td>
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
                      <td className="font-bold">{member.name}</td>
                      <td className="font-mono text-sm">{member.contact || '-'}</td>
                      <td className="font-mono text-sm">{member.aadharNumber || '-'}</td>
                      <td className="text-sm">{member.address || '-'}</td>
                      <td className="text-sm text-app-muted">{format(new Date(member.joinDate), 'dd/MM/yy')}</td>
                      {(canAddMember || currentUserRole === 'MEMBER') && (
                        <td className="text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {currentUserRole === 'SUPER_ADMIN' && (
                              <button onClick={() => setSelectedMemberForLogin(member)} className="text-orange-400 hover:text-orange-300 p-1 transition-colors" title="Manage Login">
                                <Key className="w-4 h-4" />
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
                              deletingMemberId === member.id ? (
                                <div className="flex gap-1 items-center">
                                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Sure?</span>
                                  <button onClick={() => handleDelete(member.id)} className="text-red-400 hover:text-red-300 p-1" title="Yes"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setDeletingMemberId(null)} className="text-app-muted hover:text-white p-1" title="No"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingMemberId(member.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
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
    </div>
  );
}
