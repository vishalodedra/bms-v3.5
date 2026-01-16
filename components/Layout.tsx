import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SystemHUD } from './SystemHUD';
import { NavView } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-industrial-bg overflow-hidden relative">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onNavigate={onNavigate} />
        <main className="flex-1 overflow-auto relative p-6">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             {children}
          </div>
        </main>
      </div>
      <SystemHUD onNavigate={onNavigate} />
    </div>
  );
};