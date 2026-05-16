import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { auth } from './lib/firebase';

// Placeholder Pages
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { Members } from './pages/Members';
import { Collections } from './pages/Collections';
import { Transactions } from './pages/Transactions';
import { Loans } from './pages/Loans';
import { Resolutions } from './pages/Resolutions';
import { Constitution } from './pages/Constitution';
import { Notices } from './pages/Notices';
import { Activities } from './pages/Activities';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="members" element={<Members />} />
            <Route path="collections" element={<Collections />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="loans" element={<Loans />} />
            <Route path="resolutions" element={<Resolutions />} />
            <Route path="constitution" element={<Constitution />} />
            <Route path="notices" element={<Notices />} />
            <Route path="activities" element={<Activities />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
