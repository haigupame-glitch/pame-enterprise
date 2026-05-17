import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { useAppContext } from '../store/AppContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState<'MEMBER' | 'ADMIN' | 'SUPER_ADMIN'>('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { members, setCurrentUserId, setCurrentUserRole, activeGroupId, groups } = useAppContext();

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
        if (loginType === 'SUPER_ADMIN') {
          // Super Admin: uses Firebase Auth
          const pseudoEmail = getPseudoEmail(phone);
          try {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
            setCurrentUserRole('SUPER_ADMIN');
            onLogin();
          } catch (firebaseErr: any) {
             throw firebaseErr;
          }
        } else {
          // Member / Admin: uses Local Members list check
          const member = members.find(m => (m.loginId === phone || m.contact === phone) && m.loginPassword === password);
          if (member) {
            const memberRole = member.role || 'MEMBER';
            if (memberRole === loginType || memberRole === 'SUPER_ADMIN') {
              setCurrentUserId(member.id);
              setCurrentUserRole(memberRole);
              onLogin();
            } else {
              setError('Wrong credentials');
            }
          } else {
             setError('Wrong credentials');
          }
        }
      } else {
        if (loginType !== 'SUPER_ADMIN') {
           setError('Only Super Admins can sign up for new accounts.');
           setLoading(false);
           return;
        }
        const pseudoEmail = getPseudoEmail(phone);
        await createUserWithEmailAndPassword(auth, pseudoEmail, password);
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
        
        <div className="flex bg-slate-900 rounded-lg p-1 space-x-1 mb-6">
          {(['MEMBER', 'ADMIN', 'SUPER_ADMIN'] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => {
                 setLoginType(role);
                 setError('');
                 setIsLogin(true); // switch back to login mode if changing tab
              }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-[0.05em] py-2.5 rounded-md transition-colors ${loginType === role ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
               {role.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-small mb-1 block text-slate-300">Mobile Number (Login ID)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9999999999"
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
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? `Login as ${loginType.replace('_', ' ')}` : 'Sign Up as SUPER ADMIN')}
          </button>
          
          {loginType === 'SUPER_ADMIN' && (
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
          )}
        </form>
      </div>
    </div>
  );
}
