import React from 'react';
import { cn } from '../lib/utils';
import { Plus, Library, Clock, Settings, HelpCircle, Activity } from 'lucide-react';

export default function Sidebar({ onNewChat }) {
  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col pt-6 pb-4">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 mb-8">
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
          <Activity size={18} />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 leading-tight">Intelligent Clarity</h1>
          <p className="text-xs text-slate-500">RAG AI Assistant</p>
        </div>
      </div>

      {/* Main Action */}
      <div className="px-4 mb-6">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm shadow-primary-600/20"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem icon={<Library size={18} />} label="Library" active />
        <NavItem icon={<Clock size={18} />} label="History" />
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pt-4 border-t border-slate-200 space-y-1">
        <NavItem icon={<Settings size={18} />} label="Settings" />
        <NavItem icon={<HelpCircle size={18} />} label="Support" />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active 
          ? "bg-slate-200/50 text-slate-900" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span className={cn("text-slate-400", active && "text-primary-600")}>
        {icon}
      </span>
      {label}
    </button>
  );
}
