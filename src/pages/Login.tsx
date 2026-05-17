import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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

  const getPseudoEmail = (phoneNum: string) => {
    const numbersOnly = phoneNum.replace(/[^0-9]/g, '');
    if (numbersOnly.length > 0) {
      return `${numbersOnly}@shg.app.local`;
    }
    const sanitized = phoneNum.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${sanitized || 'admin'}@shg.app.local`;
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
          
          const authIdentifier = member.contact || member.loginId || rawPhone;
          const pseudoEmail = getPseudoEmail(authIdentifier);
          try {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
              try {
                await createUserWithEmailAndPassword(auth, pseudoEmail, password);
              } catch (createErr) {
                console.error('Failed to create background auth', createErr);
              }
            } else {
              throw err;
            }
          }
          
          setCurrentUserId(member.id);
          setCurrentUserRole(memberRole);
          onLogin();
        } else {
          // Fallback check Firebase (if app storage was cleared but member exists in DB)
          const pseudoEmail = getPseudoEmail(rawPhone);
          
          try {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
              try {
                await createUserWithEmailAndPassword(auth, pseudoEmail, password);
              } catch (createErr) {
                console.error('Failed to create background auth', createErr);
                throw err;
              }
            } else {
              throw err;
            }
          }
          
          let resolvedId: string | null = null;
          let resolvedRole: any = 'MEMBER';

          try {
            const snapshot = await getDoc(doc(db, 'appStore', 'globalState'));
            if (snapshot.exists()) {
              const data = snapshot.data();
              const dbMembers = data.members || [];
              if (dbMembers.length === 0) {
                 resolvedRole = 'SUPER_ADMIN'; // First user recovery
              } else {
                const foundMember = dbMembers.find((m: any) => 
                  (m.loginId || '').trim().toLowerCase() === checkPhone || 
                  (m.contact || '').trim() === rawPhone || 
                  (m.memberNumber || '').trim().toLowerCase() === checkPhone
                );
                if (foundMember) {
                  resolvedId = foundMember.id;
                  resolvedRole = foundMember.role || 'MEMBER';
                } else {
                  throw new Error('Member not found in database');
                }
              }
            } else {
              resolvedRole = 'SUPER_ADMIN';
            }
          } catch(err) {
            console.error('Failed to resolve member from db', err);
            throw err; // cascade to error UI
          }

          setCurrentUserId(resolvedId);
          setCurrentUserRole(resolvedRole);
          onLogin();
        }
      } else {
        // Sign Up
        const rawPhone = phone.trim();
        const pseudoEmail = getPseudoEmail(rawPhone);
        
        // We only allow Sign Up to create a SUPER_ADMIN if the app is entirely empty.
        // Members must be created by Admin.
        await createUserWithEmailAndPassword(auth, pseudoEmail, password);

        let isFirstUser = false;
        try {
          const snapshot = await getDoc(doc(db, 'appStore', 'globalState'));
          if (!snapshot.exists() || !(snapshot.data()?.members?.length > 0)) {
            isFirstUser = true;
          }
        } catch(e) {
          // Ignore, fallback to first user if we can't read it
          isFirstUser = true;
        }

        if (!isFirstUser) {
           // We created an auth record, but they aren't the first user.
           // They are stuck now because sign up is closed.
           setError('Sign up is closed. Please ask an Admin to create your account, then Login.');
           setLoading(false);
           return;
        }

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
