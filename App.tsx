import React, { useState, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { UserRole, UserContextType, UserContext, NavView } from './types';
import { canAccess } from './utils/rbac';
import { getViewConfig } from './routes/viewRegistry';

const App: React.FC = () => {
  // PP-010: View State
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  
  // EXT-BP-004: Runbook Context State
  const [activeRunbookId, setActiveRunbookId] = useState<string | null>(null);
  
  // BP-002: Dynamic Role State
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.SYSTEM_ADMIN);

  // Derive user identity based on role for demo purposes
  const userContextValue: UserContextType = useMemo(() => {
    return {
      id: `usr_${currentRole.toLowerCase().replace(/ /g, '_')}`,
      name: `${currentRole} User`, // Generic name based on role
      role: currentRole,
      isDemo: true,
      setRole: (role: UserRole) => setCurrentRole(role),
      checkAccess: (featureId: string) => canAccess(currentRole, featureId)
    };
  }, [currentRole]);

  // Handler for deep linking to runbooks
  const handleRunbookNavigation = (runbookId: string) => {
    setActiveRunbookId(runbookId);
    setCurrentView('runbook_detail');
  };

  // Helper for "Exceptions View" specific navigation
  const handleExceptionsNavigation = () => {
    setCurrentView('exceptions_view');
  };

  // Resolve Active View Component via Registry
  const renderActiveView = () => {
    const config = getViewConfig(currentView);

    if (!config) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          View not found: {currentView}
        </div>
      );
    }

    const { component: Component, props } = config;

    // Inject Common Navigation Props dynamically
    // Some components require specific handlers (like ControlTower)
    const commonProps = {
      onNavigate: setCurrentView,
      // Special props for ControlTower
      ...(currentView === 'control_tower' ? { 
          onNavigate: handleRunbookNavigation,
          onViewExceptions: handleExceptionsNavigation 
        } : {}),
      // Special props for RunbookDetail
      ...(currentView === 'runbook_detail' ? { 
          runbookId: activeRunbookId 
        } : {}),
      // Spread static config props (e.g. for GenericFlowScreen)
      ...props
    };

    return <Component {...commonProps} />;
  };

  return (
    <ErrorBoundary onNavigate={setCurrentView}>
      <UserContext.Provider value={userContextValue}>
        <Layout currentView={currentView} onNavigate={setCurrentView}>
          {renderActiveView()}
        </Layout>
      </UserContext.Provider>
    </ErrorBoundary>
  );
};

export default App;