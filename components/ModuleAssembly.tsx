
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { NavView } from '../types';
import { ModuleListing } from '../flows/module/ui/ModuleListing';
import { ModuleDetail } from '../flows/module/ui/ModuleDetail';

interface ModuleAssemblyProps {
  onNavigate?: (view: NavView) => void;
}

export const ModuleAssembly: React.FC<ModuleAssemblyProps> = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route index element={<ModuleListing />} />
      <Route path=":moduleId" element={<ModuleDetail />} />
    </Routes>
  );
};
