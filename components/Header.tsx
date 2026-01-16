import React, { useContext } from 'react';
import { UserContext, APP_NAME, UserRole } from '../types';
import { UserCircle, Bell, Settings, ChevronDown, RefreshCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const user = useContext(UserContext);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    user.setRole(e.target.value as UserRole);
  };

  return (
    <header className="h-16 bg-white border-b border-industrial-border flex items-center justify-between px-6 shrink-0 z-10">
      {/* Left: Branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-brand-700 rounded flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <span className="font-bold text-xl text-brand-900 tracking-tight">{APP_NAME}</span>
        </div>
      </div>

      {/* Right: User & Actions */}
      <div className="flex items-center space-x-4">
        {/* Role Switcher (Retained as functional control) */}
        <div className="relative hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <RefreshCcw size={14} className="text-slate-400 mr-2" />
          <label htmlFor="role-select" className="sr-only">Switch Role</label>
          <select 
            id="role-select"
            value={user.role} 
            onChange={handleRoleChange}
            className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        {/* Placeholder Actions */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <Settings size={20} />
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        {/* Role Context Display */}
        <div className="flex items-center space-x-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-700">{user.name}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</div>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};