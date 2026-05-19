import React, { useState } from 'react';
import { X, Key } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { Member } from '../types';

interface Props {
  member: Member;
  onClose: () => void;
}

export function MemberLoginModal({ member, onClose }: Props) {
  const { updateMember } = useAppContext();
  const [loginId, setLoginId] = useState(member.loginId || member.memberNumber || member.contact || '');
  const [password, setPassword] = useState(member.loginPassword || '');
  const [role, setRole] = useState(member.role || 'MEMBER');
  const [showSaved, setShowSaved] = useState(false);

  const validatePassword = (pass: string) => {
    if (pass.length > 0 && pass.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }
    updateMember({
      ...member,
      loginId,
      loginPassword: password,
      role
    });
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bento-card max-w-sm w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-app-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">App Credentials</h2>
            <p className="text-[10px] text-app-muted uppercase tracking-wider">{member.name}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label-small mb-1 block">Login ID (ID No / Phone)</label>
            <input
              type="text"
              required
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              className="bento-input w-full"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label className="label-small mb-1 block">Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bento-input w-full font-mono"
              placeholder="Set password"
            />
          </div>
          
          <div>
            <label className="label-small mb-1 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="bento-select w-full disabled:opacity-75"
              disabled={member.role === 'SUPER_ADMIN'}
            >
              <option value="MEMBER">Member</option>
              <option value="TREASURER">Treasurer</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          
          <div className="pt-2">
            <button type="submit" className="bento-btn bento-btn-primary w-full bg-orange-500 hover:bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              {showSaved ? 'Saved Successfully!' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
