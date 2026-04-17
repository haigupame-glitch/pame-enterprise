import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';

// Placeholder Pages
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { Members } from './pages/Members';
import { Collections } from './pages/Collections';
import { Transactions } from './pages/Transactions';
import { Loans } from './pages/Loans';
import { Resolutions } from './pages/Resolutions';
import { Notices } from './pages/Notices';
import { Activities } from './pages/Activities';

export default function App() {
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
            <Route path="notices" element={<Notices />} />
            <Route path="activities" element={<Activities />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
