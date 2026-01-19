
import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { UserRole, UserContextType, UserContext, NavView } from './types';
import { canAccess } from './utils/rbac';
import { getViewConfig } from './routes/viewRegistry';
import { PATH_MAP, getNavViewFromPath } from './routes/pathRegistry';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // EXT-BP-004: Runbook Context State (Kept as local state for now, could be routed later)
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

  // Derived View State from URL
  const currentView = getNavViewFromPath(location.pathname);

  // Navigation Adapter: Bridges legacy onNavigate(NavView) calls to Router
  const handleNavigate = (view: NavView | string) => {
    // Check if it's a NavView key
    if (view in PATH_MAP) {
       const path = PATH_MAP[view as NavView];
       navigate(path);
       return;
    }
    // Fallback: assume it's a runbook ID from Control Tower
    if (typeof view === 'string' && !view.startsWith('/')) {
        setActiveRunbookId(view);
        navigate(PATH_MAP['runbook_detail'].replace(':id', view));
        return;
    }
    // Direct path
    navigate(view);
  };

  // Helper for "Exceptions View" specific navigation
  const handleExceptionsNavigation = () => {
    handleNavigate('exceptions_view');
  };

  // Construct Routes from Registry
  const appRoutes = Object.entries(PATH_MAP).map(([view, path]) => {
     const config = getViewConfig(view as NavView);
     if (!config) return null;

     const { component: Component, props } = config;
     
     // Clean path for Route definition (remove dynamic segments if they are handled by child routes or handled loosely here)
     // For inbound_receipt and batch_planning, we want to match /stores/inbound/* to allow nesting
     // V34-S4-SPA: Added batch_planning to nested route whitelist
     // V34-S5-SPA: Added module_assembly to nested route whitelist
     const routePath = (view === 'inbound_receipt' || view === 'batch_planning' || view === 'module_assembly') ? `${path}/*` : path;

     const commonProps = {
        onNavigate: handleNavigate,
        ...(view === 'control_tower' ? { 
            onNavigate: handleNavigate, // Override to handle runbook IDs
            onViewExceptions: handleExceptionsNavigation 
          } : {}),
        ...(view === 'runbook_detail' ? { 
            runbookId: activeRunbookId 
          } : {}),
        ...props
     };

     return (
        <Route 
          key={view} 
          path={routePath} 
          element={<Component {...commonProps} />} 
        />
     );
  });

  return (
    <ErrorBoundary onNavigate={handleNavigate}>
      <UserContext.Provider value={userContextValue}>
        <Layout currentView={currentView} onNavigate={handleNavigate}>
          <Routes>
             {appRoutes}
             {/* V34-FIX: Catch-all redirect to dashboard to prevent iframe 404s in Preview */}
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </UserContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
