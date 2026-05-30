import React from "react";
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Users, 
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, onLogout, user, userRole }) {
  const isStaff = userRole === "staff";

  const allMenuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, staffAllowed: false },
    { id: "builder", name: "Create Quotation", icon: FilePlus2, staffAllowed: true },
    { id: "history", name: "Quotations History", icon: History, staffAllowed: false },
    { id: "customers", name: "Customers", icon: Users, staffAllowed: false },
    { id: "settings", name: "Settings", icon: SettingsIcon, staffAllowed: false },
  ];

  const menuItems = isStaff
    ? allMenuItems.filter((item) => item.staffAllowed)
    : allMenuItems;

  return (
    <aside className="no-print hidden md:flex flex-col w-64 glass-panel h-screen sticky top-0 left-0 border-r border-slate-200 text-slate-700 bg-white">
      {/* Header / Logo — full logo image only */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-center bg-slate-50/50">
        <img 
          src="/logo.jpeg" 
          alt="Sri KP Babu Computers Logo" 
          className="h-14 w-auto max-w-[160px] object-contain rounded-xl"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? "bg-brand-blue-dark text-white shadow-md shadow-blue-900/10" 
                  : "hover:bg-slate-100 hover:text-slate-900 text-slate-500"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-blue-dark to-brand-blue flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="truncate w-28">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || "Administrator"}</p>
              <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">{user?.role || "Admin"}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
