import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppContext } from './store/AppContext';
import { Layout } from './components/Layout';
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
import { Feedback } from './pages/Feedback';

import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

export default function App() {
  const { currentUserId, currentUserRole } = useAppContext();

  const isAuthenticated = !!currentUserId || currentUserRole === 'SUPER_ADMIN';

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        {/* APP ROUTES */}
        {!isAuthenticated ? (
          <Route path="*" element={<Login onLogin={() => {}} />} />
        ) : (
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
            <Route path="feedback" element={<Feedback />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
