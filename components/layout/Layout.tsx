import React, { ReactNode, useState } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/ToastContainer';

// FIX: Removed React.FC to align with modern React practices and explicitly typed the 'children' prop.
const Layout = ({ children }: { children?: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-gray-900 dark:text-gray-100">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-grow overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      <ToastContainer />
      <BottomNav />
    </div>
  );
};

export default Layout;