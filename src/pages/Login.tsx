import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { useAppContext } from '../store/AppContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { members, setCurrentUserId, setCurrentUserRole } = useAppContext();

  // Auto-login if auth state changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onLogin();
      }
    });
    return unsub;
  }, [onLogin]);

  const getPseudoEmail = (phoneNum: string) => {
    return `${phoneNum.replace(/[^0-9]/g, '')}@shg.app.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Phone and password are required.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Find local member
        const rawPhone = phone.trim();
        const checkPhone = rawPhone.toLowerCase();
        const member = members.find(m => 
          (
            (m.loginId || '').trim().toLowerCase() === checkPhone || 
            (m.contact || '').trim() === rawPhone || 
            (m.memberNumber || '').trim().toLowerCase() === checkPhone
          ) && 
          m.loginPassword === password
        );

        if (member) {
          const memberRole = member.role || 'MEMBER';
          
          if (memberRole === 'SUPER_ADMIN') {
            const authIdentifier = member.contact || rawPhone;
            const pseudoEmail = getPseudoEmail(authIdentifier);
            try {
              await signInWithEmailAndPassword(auth, pseudoEmail, password);
            } catch (err) {
              // Ignore if Firebase fails but local check matched.
            }
          } else {
            try {
              await signInAnonymously(auth);
            } catch (err) {
              // Ignore
            }
          }
          
          setCurrentUserId(member.id);
          setCurrentUserRole(memberRole);
          onLogin();
        } else {
          // Fallback check Firebase (for initial super admins without a member record)
          const pseudoEmail = getPseudoEmail(rawPhone);
          await signInWithEmailAndPassword(auth, pseudoEmail, password);
          setCurrentUserId(null);
          setCurrentUserRole('SUPER_ADMIN');
          onLogin();
        }
      } else {
        const rawPhone = phone.trim();
        const pseudoEmail = getPseudoEmail(rawPhone);
        await createUserWithEmailAndPassword(auth, pseudoEmail, password);
        setCurrentUserId(null);
        setCurrentUserRole('SUPER_ADMIN');
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Wrong credentials');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this phone number already exists. Please log in.');
      } else {
        setError('Wrong credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bento-card max-w-md w-full">
        <div className="card-header text-center !mb-6 text-2xl">
          {isLogin ? 'SHG APP LOGIN' : 'CREATE ACCOUNT'}
        </div>

        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-small mb-1 block text-slate-300">Login ID (Member ID / Mobile Number)</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. SHG-001 or 9999999999"
              className="bento-input w-full"
              required
            />
          </div>
          <div>
            <label className="label-small mb-1 block text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="bento-input w-full"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="bento-btn bento-btn-primary w-full disabled:opacity-50">
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Sign Up as SUPER ADMIN')}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="mt-4 text-xs font-semibold text-slate-400 hover:text-white uppercase tracking-wider hover:underline w-full text-center block transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
