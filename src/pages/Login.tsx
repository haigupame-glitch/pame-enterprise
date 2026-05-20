import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAppContext } from '../store/AppContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { members, setCurrentUserId, setCurrentUserRole, addMember, addGroup } = useAppContext();

  const getPseudoEmail = (phoneNum: string, version?: number) => {
    const numbersOnly = phoneNum.replace(/[^0-9]/g, '');
    if (numbersOnly.length > 0) {
      return `${numbersOnly}${version ? '-v' + version : ''}@shg.app.local`;
    }
    const sanitized = phoneNum.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${sanitized || 'admin'}${version ? '-v' + version : ''}@shg.app.local`;
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      let resolvedId: string | null = null;
      let resolvedRole: any = 'MEMBER';

      try {
        const snapshot = await getDoc(doc(db, 'appStore', 'globalState'));
        if (snapshot.exists()) {
          const data = snapshot.data();
          const dbMembers = data.members || [];
          if (dbMembers.length === 0) {
             resolvedRole = 'SUPER_ADMIN'; // First user
          } else {
            const foundMember = dbMembers.find((m: any) => 
               m.loginId === user.uid || m.contact === user.email || m.contact === user.phoneNumber
            );
            if (foundMember) {
              resolvedId = foundMember.id;
              resolvedRole = foundMember.role || 'MEMBER';
            } else {
              // Not matched strictly, but let's just make them a member if the app is open
              resolvedRole = 'MEMBER';
            }
          }
        } else {
          resolvedRole = 'SUPER_ADMIN';
        }
      } catch(err) {
        console.error('Failed to resolve member from db', err);
        // We'll just continue as local SUPER_ADMIN if DB is blank and fails
        resolvedRole = 'SUPER_ADMIN'; 
      }

      setCurrentUserId(resolvedId || user.uid);
      setCurrentUserRole(resolvedRole);
      onLogin();

    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
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
        const member = (members || []).find(m => 
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
          const pseudoEmail = getPseudoEmail(authIdentifier, member.authVersion);
          try {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
          } catch (err: any) {
            console.warn("Firebase sign in failed, tracking locally:", err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
              try {
                await createUserWithEmailAndPassword(auth, pseudoEmail, password);
              } catch (createErr: any) {
                if (createErr.code === 'auth/email-already-in-use') {
                  console.warn('Background auth sync skipped: Email already in use');
                } else {
                  console.error('Failed to create background auth', createErr);
                }
              }
            } else if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
               // Ignore and proceed locally
            } else {
              throw err;
            }
          }
          
          setCurrentUserId(member.id);
          setCurrentUserRole(memberRole);
          onLogin();
        } else {
          // Fallback check Firebase (if app storage was cleared but member exists in DB)
          let dbMembers: any[] = [];
          try {
            // Log in anonymously to bypass firestore rule (if enabled) or try to use pseudoEmail
            try {
               await signInAnonymously(auth);
            } catch (anonErr) {
               console.warn("Anonymous auth failed, trying direct email auth...", anonErr);
               const pseudoEmail = getPseudoEmail(rawPhone);
               await signInWithEmailAndPassword(auth, pseudoEmail, password);
            }
          } catch (err: any) {
             if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
                 console.warn("Bypassing Firebase Auth (disabled)");
             } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
                 const pseudoEmail = getPseudoEmail(rawPhone);
                 try {
                     await createUserWithEmailAndPassword(auth, pseudoEmail, password);
                 } catch (createErr: any) {
                     if (createErr.code === 'auth/email-already-in-use') {
                         console.warn('Background auth sync skipped: Email already in use');
                     } else {
                         throw createErr;
                     }
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
                  if (foundMember.loginPassword !== password) {
                     auth.signOut();
                     throw new Error('Wrong credentials');
                  }
                  resolvedId = foundMember.id;
                  resolvedRole = foundMember.role || 'MEMBER';
                } else {
                  // Legacy SUPER_ADMIN recovery: they have an auth account but no Member struct
                  resolvedId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                  resolvedRole = 'SUPER_ADMIN';
                }
              }
            } else {
              resolvedRole = 'SUPER_ADMIN';
            }
          } catch(err: any) {
            console.error('Failed to resolve member from db', err);
            if (err.code === 'permission-denied') {
               throw new Error('Account not found locally, and database access is restricted. Are you sure you have an account? Try signing up.');
            }
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

        if (!adminName) {
           setError('Admin Name is required for new accounts.');
           setLoading(false);
           return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        // We allow Sign Up to create a new group and SUPER_ADMIN.
        try {
          await createUserWithEmailAndPassword(auth, pseudoEmail, password);
        } catch (err: any) {
           if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
              console.warn("Bypassing Firebase Sign Up (Auth disabled), created locally.");
           } else {
              throw err;
           }
        }

        const adminId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        
        // Setup initial role so addGroup/addMember doesn't block
        setCurrentUserRole('SUPER_ADMIN');
        setCurrentUserId(adminId);

        // Create the admin member
        addMember({
          id: adminId,
          groupId: 'PENDING',
          name: adminName,
          contact: rawPhone,
          loginId: rawPhone,
          loginPassword: password,
          role: 'SUPER_ADMIN',
          joinDate: new Date().toISOString(),
          memberNumber: 'ADMIN-01'
        });

        onLogin();
      }
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        console.warn('Login failed:', err.message);
        setError('Wrong credentials');
      } else if (err.code === 'auth/email-already-in-use') {
        console.warn('Login failed:', err.message);
        setError('An account with this phone number already exists. Please log in.');
      } else {
        console.error('Firebase Auth Error:', err);
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const rawPhone = phone.trim();
    const checkName = adminName.trim().toLowerCase(); // using adminName for checking the name

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'appStore', 'globalState'));
      if (!snapshot.exists()) {
        throw new Error('Database not initialized');
      }
      
      const data = snapshot.data();
      const dbMembers = data.members || [];
      
      const memberIndex = dbMembers.findIndex((m: any) => 
        ((m.contact || '').trim() === rawPhone || (m.loginId || '').trim() === rawPhone) &&
        (m.name || '').trim().toLowerCase() === checkName
      );
      
      if (memberIndex === -1) {
         throw new Error('Could not find an account matching that phone number and full name. Please check your spelling.');
      }
      
      dbMembers[memberIndex].loginPassword = password;
      dbMembers[memberIndex].authVersion = (dbMembers[memberIndex].authVersion || 0) + 1;
      
      await setDoc(doc(db, 'appStore', 'globalState'), { members: dbMembers }, { merge: true });
      
      alert("Password reset successfully! Please log in with your new password.");
      setIsForgotPassword(false);
      setIsLogin(true);
      setPassword('');
      setAdminName('');
    } catch(err: any) {
       setError(err.message || 'Failed to reset password');
    } finally {
       setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bento-card max-w-md w-full">
          <div className="card-header text-center !mb-6 text-xl">
            RESET PASSWORD
          </div>
          {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="label-small mb-1 block text-slate-300">Registered Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Your registered phone or Login ID"
                className="bento-input w-full"
                required
              />
            </div>
            <div>
              <label className="label-small mb-1 block text-slate-300">Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="Your full name as registered"
                className="bento-input w-full"
                required
              />
            </div>
            <div>
              <label className="label-small mb-1 block text-slate-300">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bento-input w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="bento-btn bento-btn-primary w-full disabled:opacity-50 mt-4">
              {loading ? 'Processing...' : 'Reset Password'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setAdminName('');
              }} 
              className="mt-4 text-xs font-semibold text-slate-400 hover:text-white uppercase tracking-wider hover:underline w-full text-center block transition-colors"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bento-card max-w-md w-full">
        <div className="card-header text-center !mb-6 text-2xl">
          {isLogin ? 'SHG APP LOGIN' : 'CREATE ACCOUNT'}
        </div>

        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="label-small mb-1 block text-slate-300">Your Full Name (Admin)</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="Enter your name"
                  className="bento-input w-full"
                  required
                />
              </div>
            </>
          )}
          <div>
            <label className="label-small mb-1 block text-slate-300">Login ID / Username</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. SHG-001, john123, or 9999999999"
              className="bento-input w-full"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-small block text-slate-300">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="bento-input w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="bento-btn bento-btn-primary w-full disabled:opacity-50">
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Create SHG Group & Admin Account')}
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
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950 px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full form-input flex items-center justify-center space-x-2 bg-slate-900 border-slate-700 hover:bg-slate-800 text-white rounded-lg py-2 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
