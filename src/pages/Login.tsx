import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const pseudoEmail = getPseudoEmail(phone);
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, pseudoEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, pseudoEmail, password);
      }
      onLogin(); // The effect will also trigger this, but just in case
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid phone number or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this phone number already exists. Please log in.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
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
            <label className="label-small mb-1 block text-slate-300">Mobile Number</label>
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
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Sign Up')}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="mt-2 text-sm text-app-primary hover:underline w-full text-center block"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
