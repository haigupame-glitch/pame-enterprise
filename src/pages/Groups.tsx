import React from 'react';
import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import QRCode from 'react-qr-code';

export function Groups() {
  const { groups, activeGroupId, setActiveGroup, addGroup, updateGroup, deleteGroup, updateConstitution, updateGroupLogo, currentUserRole } = useAppContext();
  const [name, setName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  
  const [switchingGroupId, setSwitchingGroupId] = useState<string | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const canEdit = currentUserRole === 'SUPER_ADMIN' || !activeGroup;
  const canEditGroupDetails = currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && activeGroup?.allowAdminEdit);

  const [constitutionText, setConstitutionText] = useState('');
  const [contactText, setContactText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [switchPasswordValue, setSwitchPasswordValue] = useState('');
  const [allowAdminEdit, setAllowAdminEdit] = useState(false);
  const [allowTreasurerEdit, setAllowTreasurerEdit] = useState(false);
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [cropModalData, setCropModalData] = useState<{ src: string; isLogo: boolean } | null>(null);

  useEffect(() => {
    if (activeGroup) {
      setConstitutionText(activeGroup.constitution || '');
      setContactText(activeGroup.contact || '');
      setEmailText(activeGroup.email || '');
      setBankName(activeGroup.bankName || '');
      setAccountName(activeGroup.accountName || '');
      setAccountNumber(activeGroup.accountNumber || '');
      setIfscCode(activeGroup.ifscCode || '');
      setUpiId(activeGroup.upiId || '');
      setSwitchPasswordValue(activeGroup.switchPassword || '');
      setAllowAdminEdit(!!activeGroup.allowAdminEdit);
      setAllowTreasurerEdit(!!activeGroup.allowTreasurerEdit);
    }
  }, [activeGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    addGroup({
      id: generateId(),
      name: name.trim(),
      createdDate: new Date().toISOString(),
      constitution: '',
      switchPassword: newGroupPassword
    });
    setName('');
    setNewGroupPassword('');
  };

  const handleUpdateConstitution = () => {
    if (activeGroupId) {
      updateConstitution(activeGroupId, constitutionText);
      alert('Constitution saved successfully!');
    }
  };

  const handleUpdateContactInfo = () => {
    if (activeGroupId) {
      updateGroup(activeGroupId, { 
        contact: contactText, 
        email: emailText,
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        upiId,
        switchPassword: switchPasswordValue,
        allowAdminEdit,
        allowTreasurerEdit
      });
      alert('Group information saved successfully!');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isLogo: boolean) => {
    const file = e.target.files?.[0];
    if (file && activeGroupId) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller image.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropModalData({ src: reader.result as string, isLogo });
      };
      reader.readAsDataURL(file);
      e.target.value = ''; 
    }
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    if (activeGroupId && cropModalData) {
      if (cropModalData.isLogo) {
        updateGroupLogo(activeGroupId, croppedImageBase64);
      }
    }
    setCropModalData(null);
  };

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (switchingGroupId) {
      const targetGroup = groups.find(g => g.id === switchingGroupId);
      if (targetGroup?.switchPassword && targetGroup.switchPassword !== switchPasswordInput) {
        alert('Incorrect group password!');
        return;
      }
      setActiveGroup(switchingGroupId);
      setSwitchingGroupId(null);
      setSwitchPasswordInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {cropModalData && (
        <ImageCropperModal
          imageSrc={cropModalData.src}
          aspectRatio={cropModalData.isLogo ? 1 : 21/9}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropModalData(null)}
        />
      )}
      
      {canEdit && (
        <div className="bento-card">
          <div className="card-header">CREATE NEW SHG GROUP</div>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Group Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="bento-input w-full py-2" placeholder="My SHG Group" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Group Switch Password</label>
              <input type="password" value={newGroupPassword} onChange={e => setNewGroupPassword(e.target.value)} className="bento-input w-full py-2" placeholder="Optional security password" />
            </div>
            <button type="submit" className="bento-btn py-2 px-6 h-fit shrink-0 w-full sm:w-auto">Create Group</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">

          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-4 border-b-2 border-app-border">
              <div className="card-header !mb-0">{currentUserRole === 'SUPER_ADMIN' ? 'ALL GROUPS' : 'MY GROUP'}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Created Date</th>
                    {canEdit && <th className="w-20">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {groups.filter(g => currentUserRole === 'SUPER_ADMIN' || g.id === activeGroupId).map((group) => (
                    <tr key={group.id}>
                      <td className="font-bold">
                        {editingGroupId === group.id ? (
                          <textarea
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="bento-input py-1 px-2 text-sm w-full min-w-[200px] resize-y"
                            autoFocus
                            rows={2}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                updateGroup(group.id, { name: editName });
                                setEditingGroupId(null);
                              } else if (e.key === 'Escape') {
                                setEditingGroupId(null);
                              }
                            }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{group.name}</div>
                        )}
                      </td>
                      <td>{format(new Date(group.createdDate), 'dd MMM yyyy')}</td>
                      {canEdit && (
                        <td>
                          {editingGroupId === group.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateGroup(group.id, { name: editName });
                                  setEditingGroupId(null);
                                }}
                                className="text-xs font-bold text-app-accent hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingGroupId(null)}
                                className="text-xs font-bold text-app-muted hover:text-white hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              {group.id !== activeGroupId && (
                                <button
                                  onClick={() => {
                                    if (!group.switchPassword) {
                                      setActiveGroup(group.id);
                                    } else {
                                      setSwitchingGroupId(group.id);
                                    }
                                  }}
                                  className="text-xs font-bold text-app-accent hover:underline"
                                >
                                  Switch
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingGroupId(group.id);
                                  setEditName(group.name);
                                }}
                                className="text-xs font-bold text-app-primary hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingGroupId(group.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {groups.filter(g => currentUserRole === 'SUPER_ADMIN' || g.id === activeGroupId).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-app-muted">
                        No groups available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {activeGroup && (
          <div className="space-y-8">
            <div className="bento-card">
              <div className="card-header">GROUP LOGO / ICON</div>
              <div className="flex items-center gap-6">
                {activeGroup.logo ? (
                  <img src={activeGroup.logo} alt={`${activeGroup.name} Logo`} className="w-20 h-20 object-contain rounded-lg border border-app-border bg-app-card shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-dashed border-app-border bg-app-card flex items-center justify-center text-xs text-app-muted font-medium shrink-0">No Logo</div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, true)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-2 file:border-app-border
                      file:text-sm file:font-semibold
                      file:bg-white file:text-app-text file:cursor-pointer
                      hover:file:bg-gray-50 file:transition-colors"
                  />
                  <p className="text-xs text-app-muted">Recommended: Square image, max 2MB.</p>
                </div>
              </div>
            </div>

            <div className="bento-card flex-col flex">
              <div className="flex justify-between items-center mb-4">
                <div className="card-header !mb-0">GROUP CONTACT & BANK INFO</div>
                {canEditGroupDetails && (
                  <button
                    onClick={handleUpdateContactInfo}
                    className="bento-btn py-1 px-3 text-xs"
                  >
                    Save
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-app-border">
                <div>
                  <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={contactText}
                    onChange={(e) => setContactText(e.target.value)}
                    className="bento-input w-full py-1.5 disabled:opacity-50"
                    placeholder="e.g. +91 98765 43210"
                    disabled={!canEditGroupDetails}
                  />
                </div>
                <div>
                  <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="bento-input w-full py-1.5 disabled:opacity-50"
                    placeholder="e.g. contact@shg.com"
                    disabled={!canEditGroupDetails}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="bento-input w-full py-1.5 disabled:opacity-50"
                        placeholder="e.g. State Bank of India"
                        disabled={!canEditGroupDetails}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Account Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="bento-input w-full py-1.5 disabled:opacity-50"
                        placeholder="e.g. SHG Name"
                        disabled={!canEditGroupDetails}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="bento-input w-full py-1.5 disabled:opacity-50"
                          placeholder="e.g. 1234567890"
                          disabled={!canEditGroupDetails}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          className="bento-input w-full py-1.5 disabled:opacity-50"
                          placeholder="e.g. SBIN0001234"
                          disabled={!canEditGroupDetails}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="bento-input w-full py-1.5 disabled:opacity-50"
                        placeholder="e.g. shgname@okbank"
                        disabled={!canEditGroupDetails}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-app-muted uppercase tracking-wider block mb-1">Group Password (For Switching)</label>
                      <input
                        type="password"
                        value={switchPasswordValue}
                        onChange={(e) => setSwitchPasswordValue(e.target.value)}
                        className="bento-input w-full py-1.5 disabled:opacity-50"
                        placeholder="Leave blank to allow any user to join"
                        disabled={!canEditGroupDetails}
                      />
                    </div>
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <div className="flex gap-4 p-4 mt-2 border border-app-border rounded-xl">
                        <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowAdminEdit}
                            onChange={(e) => setAllowAdminEdit(e.target.checked)}
                            className="rounded border-app-border text-app-primary focus:ring-app-primary focus:ring-offset-0 bg-transparent"
                          />
                          Allow Admins to edit Group settings
                        </label>
                        <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowTreasurerEdit}
                            onChange={(e) => setAllowTreasurerEdit(e.target.checked)}
                            className="rounded border-app-border text-app-primary focus:ring-app-primary focus:ring-offset-0 bg-transparent"
                          />
                          Allow Treasurers to edit finances
                        </label>
                      </div>
                    )}
                 </div>
                 <div className="flex flex-col items-center justify-center p-4 bg-app-card rounded-xl border-2 border-dashed border-app-border h-full min-h-[200px]">
                    {upiId ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <QRCode 
                            value={`upi://pay?pa=${upiId}&pn=${accountName || activeGroup.name}`} 
                            size={160} 
                            fgColor="#030712"
                            bgColor="#ffffff"
                          />
                        </div>
                        <div className="text-xs font-semibold text-app-text text-center">Scan to Pay</div>
                      </div>
                    ) : (
                      <div className="text-center text-app-muted text-xs">
                        Enter UPI ID<br/>to generate QR Code
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="bento-card flex-col h-[500px] !p-0 overflow-hidden flex">
              <div className="p-4 border-b-2 border-app-border bg-gray-50 flex justify-between items-center shrink-0">
                <div className="card-header !mb-0">GROUP CONSTITUTION</div>
                {canEditGroupDetails && (
                  <button
                    onClick={handleUpdateConstitution}
                    className="bento-btn py-1 px-3 text-xs"
                  >
                    Save
                  </button>
                )}
              </div>
              <div className="p-4 bg-app-card shrink-0 border-b border-gray-200">
                <p className="text-xs text-app-muted">Draft rules and regulations for <strong>{activeGroup.name}</strong></p>
              </div>
              <textarea
                className="flex-1 w-full border-0 py-4 px-6 text-app-text focus:ring-0 resize-none font-mono text-sm leading-relaxed disabled:opacity-50 bg-transparent"
                placeholder="1. Name of the group...&#10;2. Aims and objectives...&#10;3. Membership criteria..."
                value={constitutionText}
                onChange={(e) => setConstitutionText(e.target.value)}
                disabled={!canEditGroupDetails}
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deletingGroupId !== null}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${groups.find(g => g.id === deletingGroupId)?.name}"? This action cannot be undone and will permanently remove all data associated with this group.`}
        onConfirm={() => {
          if (deletingGroupId) {
            deleteGroup(deletingGroupId);
            setDeletingGroupId(null);
          }
        }}
        onCancel={() => setDeletingGroupId(null)}
      />

      {switchingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-app-card border border-app-border rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Switch Group Security</h3>
            <p className="text-sm text-app-muted mb-4">This group requires a password to enter.</p>
            <form onSubmit={handleSwitchSubmit}>
              <input 
                type="password" 
                value={switchPasswordInput}
                onChange={e => setSwitchPasswordInput(e.target.value)}
                placeholder="Group Password" 
                className="bento-input mb-4" 
                autoFocus
                required 
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setSwitchingGroupId(null); setSwitchPasswordInput(''); }} className="bento-btn bg-slate-800 text-white hover:bg-slate-700">Cancel</button>
                <button type="submit" className="bento-btn bento-btn-primary">Unlock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
