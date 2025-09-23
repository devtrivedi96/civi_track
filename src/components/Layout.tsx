import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  MapPin,
  BarChart3,
  Plus,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: MapPin,
      description: "Overview & Analytics"
    },
    { 
      name: "My Reports", 
      href: "/my-reports", 
      icon: BarChart3,
      description: "Track your submissions"
    },
    ...(profile?.role === "admin" ||
    profile?.role === "agent" ||
    profile?.role === "official"
      ? [{ 
          name: "Admin", 
          href: "/admin", 
          icon: Settings,
          description: "System management"
        }]
      : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle responsive collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 w-80 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                CivicReport
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
                Navigation
              </p>
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-2 relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mr-4 transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25" 
                        : "bg-slate-800 group-hover:bg-slate-700"
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="p-6 border-t border-slate-800/50 bg-gradient-to-t from-slate-800/50">
            <div className="flex items-center mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.fullName || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
              <Bell className="w-5 h-5 text-slate-400" />
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-slate-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-slate-700/50 hover:border-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-40 ${
        isCollapsed ? "lg:w-20" : "lg:w-80"
      }`}>
        <div className="flex flex-col flex-grow bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50">
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  CivicReport
                </h1>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200 ml-auto"
            >
              <Menu className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
                  Navigation
                </p>
              )}
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-2 relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center ${isCollapsed ? 'mr-0' : 'mr-4'} transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25" 
                        : "bg-slate-800 group-hover:bg-slate-700"
                    }`}>
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                    )}
                    {!isCollapsed && isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    )}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Desktop User Section */}
          <div className="p-6 border-t border-slate-800/50 bg-gradient-to-t from-slate-800/30">
            {!isCollapsed ? (
              <>
                <div className="flex items-center mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile?.fullName || "User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-emerald-400">Online</span>
                    </div>
                  </div>
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-3 text-slate-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-slate-700/50 hover:border-red-500/30"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                  <User className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-3 text-slate-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-slate-700/50 hover:border-red-500/30 mx-auto"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-28' : 'lg:pl-80'}`}>
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            CivicReport
          </h1>
          <div className="w-11" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-slate-950">{children}</main>
      </div>

      {/* Enhanced Floating Action Button */}
      <Link
        to="/report"
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-2xl p-4 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 z-50 group hover:scale-110 border border-blue-500/20"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
      </Link>
    </div>
  );
}