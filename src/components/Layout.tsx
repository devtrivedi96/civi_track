import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, MapPin, BarChart3, Plus, Shield, Bell, Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: MapPin, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10',
      textColor: 'text-blue-400',
      description: 'Community overview'
    },
    { 
      name: 'My Reports', 
      href: '/my-reports', 
      icon: BarChart3, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-r from-purple-500/10 to-purple-600/10',
      textColor: 'text-purple-400',
      description: 'Your submissions'
    },
    ...(profile?.role === 'admin' || profile?.role === 'agent'
      ? [{ 
          name: 'Admin', 
          href: '/admin', 
          icon: Settings, 
          color: 'from-orange-500 to-orange-600',
          bgColor: 'bg-gradient-to-r from-orange-500/10 to-orange-600/10',
          textColor: 'text-orange-400',
          description: 'System management'
        }]
      : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border-r border-slate-700">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CivicReport</h1>
                <p className="text-xs text-slate-400">Community First</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `${item.bgColor} border border-slate-600 shadow-lg`
                      : 'hover:bg-slate-700/50 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mr-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isActive ? item.textColor : 'text-slate-200'} group-hover:text-white`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center mb-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-200">
                  {profile?.fullName || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <Bell className="w-4 h-4 text-slate-400" />
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-slate-300 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors border border-slate-600"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl">
          {/* Desktop Header */}
          <div className="flex items-center justify-center p-6 border-b border-slate-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">CivicReport</h1>
              <p className="text-sm text-slate-400 flex items-center justify-center mt-1">
                <Heart className="w-3 h-3 mr-1 text-red-400" />
                Community First
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Navigation</p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `${item.bgColor} border border-slate-600 shadow-lg transform scale-[1.02]`
                      : 'hover:bg-slate-700/50 hover:scale-[1.01] border border-transparent'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-base ${isActive ? item.textColor : 'text-slate-200'} group-hover:text-white`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Desktop User menu */}
          <div className="p-6 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center mb-4 p-3 bg-slate-700/30 rounded-lg backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-200">
                  {profile?.fullName || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <Bell className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-slate-300 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 border border-slate-600 hover:border-red-500/50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">CivicReport</h1>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-gray-900">
          {children}
        </main>
      </div>

      {/* Enhanced Floating Action Button */}
      <Link
        to="/report"
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/25 transition-all duration-200 z-40 group hover:scale-110"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
      </Link>
    </div>
  );
}