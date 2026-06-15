import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  Menu,
  X,
  Sparkle,
  Sparkles,
} from 'lucide-react';
import AIAssistantPanel from './AIAssistantPanel';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/segments', icon: Target, label: 'Segments' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
];

function getPageTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/customers')) return 'Customers';
  if (pathname.startsWith('/segments')) return 'Segments';
  if (pathname.startsWith('/campaigns')) return 'Campaigns';
  return '';
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-700">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-600/20">
              <Sparkle className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-900 tracking-tight leading-none">Aura</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">CRM</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent'
                }`
              }
            >
              <item.icon className={`w-5 h-5`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium text-slate-600">AI-Powered CRM</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen bg-slate-50 lg:ml-64">
        <header className="sticky top-0 z-20 flex items-center px-4 lg:px-8 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-900 mr-4 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 tracking-wide">
              {getPageTitle(location.pathname)}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <AIAssistantPanel />
    </div>
  );
}
