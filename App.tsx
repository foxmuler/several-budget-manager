import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import BudgetDetailPage from './pages/BudgetDetailPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/layout/Layout';

// FIX: Removed React.FC from the App component. This resolves an issue where TypeScript incorrectly
// infers that child components like Layout and HomePage require a 'children' prop when they are nested
// within react-router's Routes.
const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/budget/:id" element={<BudgetDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
}

export default App;