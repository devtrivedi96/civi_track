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
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Dashboard", href: "/", icon: MapPin },
    { name: "My Reports", href: "/my-reports", icon: BarChart3 },
    ...(profile?.role === "admin" ||
    profile?.role === "agent" ||
    profile?.role === "official"
      ? [{ name: "Admin", href: "/admin", icon: Settings }]
      : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-900/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">CivicReport</h1>
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
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium mb-1 ${
                    location.pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mr-4 shadow-lg">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
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
                  {profile?.fullName || "User"}
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center justify-center p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">CivicReport</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Navigation
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium mb-1 ${
                    location.pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold text-base ${
                        isActive ? "text-blue-700" : "text-slate-200"
                      } group-hover:text-white`}
                    >
                      {item.name}
                    </p>
                    {/* Removed item.description because it does not exist on type */}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {profile?.fullName || "User"}
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
          <h1 className="text-lg font-semibold text-gray-900">CivicReport</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
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
