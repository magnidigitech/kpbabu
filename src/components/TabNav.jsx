import React from "react";
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Users, 
  Settings
} from "lucide-react";

export default function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "builder", name: "Build", icon: FilePlus2 },
    { id: "history", name: "History", icon: History },
    { id: "customers", name: "Clients", icon: Users },
    { id: "settings", name: "Config", icon: Settings },
  ];

  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
      <div className="flex items-center justify-around py-2 px-2 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-0.5 relative"
            >
              <div 
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-brand-blue-dark text-white scale-105 shadow-md shadow-blue-900/10" 
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className={`text-[9px] mt-0.5 font-bold transition-colors duration-150 ${
                isActive ? "text-brand-blue-dark" : "text-slate-500"
              }`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
