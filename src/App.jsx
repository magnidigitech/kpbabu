import React, { useState, useEffect } from "react";
import { 
  initializeDatabase, 
  getLocalStorageData, 
  setLocalStorageData 
} from "./data/seedData";

// Components
import Sidebar from "./components/Sidebar";
import TabNav from "./components/TabNav";
import Dashboard from "./components/Dashboard";
import ProductList from "./components/ProductList";
import CustomerList from "./components/CustomerList";
import Settings from "./components/Settings";
import QuoteBuilder from "./components/QuoteBuilder";
import QuotePreview from "./components/QuotePreview";
import QuotationHistory from "./components/QuotationHistory";
import PublicQuotationView from "./components/PublicQuotationView";

// Icons for login
import { Monitor, Lock, User as UserIcon, ShieldAlert } from "lucide-react";

import { decodeShareLink, generateShareHash } from "./utils/shareLink";

export default function App() {
  // App Core States
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Database States
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // Selection states
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [editingQuotationDraft, setEditingQuotationDraft] = useState(null);

  // Public view state (no auth required — set when URL is /quotation/...)
  const [publicViewData, setPublicViewData] = useState(null); // { quotation, settings, customers }

  // Login form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "", role: "admin" });
  const [loginError, setLoginError] = useState("");

  // Initialize DB and load states on mount
  useEffect(() => {
    initializeDatabase();
    
    const loadedSettings = getLocalStorageData("kpb_settings", null);
    const loadedProducts = getLocalStorageData("kpb_products", []);
    const loadedCustomers = getLocalStorageData("kpb_customers", []);
    const loadedQuotations = getLocalStorageData("kpb_quotations", []);
    const sessionUser = getLocalStorageData("kpb_session_user", null);

    if (loadedSettings) setSettings(loadedSettings);
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setQuotations(loadedQuotations);
    
    if (sessionUser) {
      setUser(sessionUser);
      setIsLoggedIn(true);
    }
    
    setIsInitialized(true);

    // ── Deep link routing: /quotation/{ref}#{snapshot-or-hash} ─────────────────────
    // This renders a PUBLIC view — no login required.
    // New format: hash is base64-encoded JSON snapshot (self-contained, any device).
    // Old format: short hash needing localStorage lookup (fallback, same device).
    const path = window.location.pathname;
    const match = path.match(/^\/quotation\/([^/]+)/);
    if (match) {
      const ref = decodeURIComponent(match[1]);
      const hashInUrl = window.location.hash.replace("#", "");
      const decoded = decodeShareLink(
        hashInUrl, ref, loadedQuotations, loadedSettings, loadedCustomers
      );
      if (decoded) {
        setPublicViewData(decoded);
      }
      // If null — invalid/expired link, fall through to normal login flow
    }
  }, []);

  // Sync state to local storage when database state changes
  const saveProducts = (newProds) => {
    setProducts(newProds);
    setLocalStorageData("kpb_products", newProds);
  };

  const saveCustomers = (newCusts) => {
    setCustomers(newCusts);
    setLocalStorageData("kpb_customers", newCusts);
  };

  const saveQuotations = (newQuotes) => {
    setQuotations(newQuotes);
    setLocalStorageData("kpb_quotations", newQuotes);
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    setLocalStorageData("kpb_settings", newSettings);
  };

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password, role } = loginForm;

    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password.");
      return;
    }

    // Standard Mock validation: admin/admin, staff/staff, or any credentials for easy local access
    const successfulUser = {
      name: username.charAt(0).toUpperCase() + username.slice(1),
      role: role
    };

    setUser(successfulUser);
    setIsLoggedIn(true);
    setLoginError("");
    setLocalStorageData("kpb_session_user", successfulUser);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    window.localStorage.removeItem("kpb_session_user");
  };

  // PRODUCT MUTATORS (CRUD)
  const handleAddProduct = (newProd) => {
    if (Array.isArray(newProd)) {
      const payloads = newProd.map((prod, idx) => ({
        id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
        ...prod
      }));
      saveProducts([...products, ...payloads]);
    } else {
      const payload = {
        id: `prod-${Date.now()}`,
        ...newProd
      };
      saveProducts([...products, payload]);
    }
  };

  const handleUpdateProduct = (id, updatedFields) => {
    saveProducts(products.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  // CUSTOMER MUTATORS (CRUD)
  const handleAddCustomer = (newCust) => {
    const payload = {
      id: `cust-${Date.now()}`,
      ...newCust
    };
    saveCustomers([...customers, payload]);
    return payload; // return for inline selectors
  };

  const handleUpdateCustomer = (id, updatedFields) => {
    saveCustomers(customers.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm("Are you sure you want to delete this customer record?")) {
      saveCustomers(customers.filter(c => c.id !== id));
    }
  };

  // QUOTATION MUTATORS (Create, Edit, Duplicate, Delete)
  const handleSaveQuotation = (type, payload) => {
    if (type === "customer_inline") {
      return handleAddCustomer(payload);
    }

    // Attach secure share hash if not already present
    const payloadWithHash = payload.shareHash
      ? payload
      : { ...payload, shareHash: generateShareHash(payload.id) };

    const exists = quotations.some(q => q.id === payloadWithHash.id);
    let updated;
    if (exists) {
      updated = quotations.map(q => q.id === payloadWithHash.id ? payloadWithHash : q);
    } else {
      updated = [payloadWithHash, ...quotations];
    }
    saveQuotations(updated);
    
    if (payloadWithHash.status === "Approved" && !exists) {
      const updatedProducts = products.map(prod => {
        const matchingItem = payloadWithHash.items.find(item => item.productId === prod.id);
        if (matchingItem) {
          return { ...prod, stock: Math.max(0, prod.stock - matchingItem.qty) };
        }
        return prod;
      });
      saveProducts(updatedProducts);
    }
  };

  const handleDuplicateQuotation = (q) => {
    const today = new Date().toISOString().split("T")[0];
    const loadedQuotations = JSON.parse(window.localStorage.getItem("kpb_quotations")) || [];
    
    const d = new Date(today);
    const DD = String(d.getDate()).padStart(2, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const YY = String(d.getFullYear()).slice(-2);
    const datePrefix = `KPB-${DD}${MM}${YY}-`;
    
    const matchingQuotes = loadedQuotations.filter(x => x.quotationNumber && x.quotationNumber.startsWith(datePrefix));
    let nextSeq = 1;
    
    if (matchingQuotes.length > 0) {
      const suffixes = matchingQuotes.map(x => {
        const parts = x.quotationNumber.split("-");
        const suffix = parts[parts.length - 1];
        const num = parseInt(suffix, 10);
        return isNaN(num) ? 0 : num;
      });
      nextSeq = Math.max(...suffixes, 0) + 1;
    }
    
    const XX = String(nextSeq).padStart(2, "0");
    const newQuoteNum = `${datePrefix}${XX}`;

    const dupDraft = {
      ...q,
      id: `q-${Date.now()}`,
      quotationNumber: newQuoteNum,
      date: today,
      status: "Pending"
    };
    setEditingQuotationDraft(dupDraft);
    setActiveTab("builder");
  };

  const handleDeleteQuotation = (id) => {
    if (window.confirm("Are you sure you want to delete this quotation entry?")) {
      saveQuotations(quotations.filter(q => q.id !== id));
    }
  };

  // Render correct panel
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            quotations={quotations}
            setActiveTab={setActiveTab}
            onSelectQuotation={setSelectedQuotation}
            onDuplicateQuotation={handleDuplicateQuotation}
            onDeleteQuotation={handleDeleteQuotation}
          />
        );
      case "builder":
        return (
          <QuoteBuilder 
            products={products}
            customers={customers}
            settings={settings}
            onSaveQuotation={handleSaveQuotation}
            onUpdateProduct={handleUpdateProduct}
            setActiveTab={setActiveTab}
            editingQuotationDraft={editingQuotationDraft}
            clearEditingDraft={() => setEditingQuotationDraft(null)}
          />
        );
      case "history":
        return (
          <QuotationHistory 
            quotations={quotations}
            customers={customers}
            onSelectQuotation={setSelectedQuotation}
            onDuplicateQuotation={handleDuplicateQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            settings={settings}
          />
        );
      case "customers":
        return (
          <CustomerList 
            customers={customers}
            quotations={quotations}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            setActiveTab={setActiveTab}
            onSelectQuotation={setSelectedQuotation}
          />
        );
      case "products":
        return (
          <ProductList 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case "settings":
        return (
          <Settings 
            settings={settings}
            onUpdateSettings={saveSettings}
            onResetDatabase={() => {
              window.localStorage.removeItem("kpb_initialized");
              window.localStorage.removeItem("kpb_settings");
              window.localStorage.removeItem("kpb_products");
              window.localStorage.removeItem("kpb_customers");
              window.localStorage.removeItem("kpb_quotations");
            }}
          />
        );
      default:
        return <div className="text-center py-20">View not found.</div>;
    }
  };

  if (!isInitialized || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] text-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue-dark mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-500">Loading Store Database...</p>
      </div>
    );
  }

  // PUBLIC QUOTATION VIEW — no auth required, renders before login wall
  if (publicViewData) {
    return (
      <PublicQuotationView
        quotation={publicViewData.quotation}
        settings={publicViewData.settings}
        customers={publicViewData.customers}
      />
    );
  }
  // RENDER LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 text-slate-700 font-sans">
        <div className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-2xl relative overflow-hidden bg-white">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-blue-dark/5 rounded-full blur-3xl" />
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl" />

          {/* Form Header with uncropped brand logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/logo.jpeg" 
              alt="Sri KP Babu Computers Logo" 
              className="h-16 w-36 rounded-2xl object-contain bg-white p-1 border border-slate-200 shadow-md mb-4"
            />
            <h1 className="text-lg font-black text-slate-900 text-center leading-tight uppercase tracking-wider">
              Sri KP Babu Computers
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-extrabold">
              Quotation Builder Hub
            </p>
          </div>

          {/* Error */}
          {loginError && (
            <div className="mb-5 p-3.5 bg-brand-red/5 border border-brand-red/20 rounded-xl flex items-center space-x-2 text-xs text-brand-red font-bold animate-shake">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Profile Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, role: "admin" })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    loginForm.role === "admin"
                      ? "bg-brand-blue-dark border-brand-blue-dark text-white shadow-md shadow-blue-900/10"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, role: "staff" })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    loginForm.role === "staff"
                      ? "bg-brand-blue-dark border-brand-blue-dark text-white shadow-md shadow-blue-900/10"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  Sales Staff
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Profile Username *</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter username (e.g. admin)"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Access Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  required
                  placeholder="Enter password (e.g. admin)"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-900/5 active:scale-95 transition-all text-xs cursor-pointer"
            >
              Sign In to Hub
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-6 font-semibold">
            For testing: type <strong className="text-slate-600 font-bold">admin</strong> / <strong className="text-slate-600 font-bold">admin</strong> to access.
          </p>
        </div>
      </div>
    );
  }

  // RENDER APP SHELL
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-700 antialiased font-sans">
      
      {/* Sidebar - Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Panel Content Container */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderTabContent()}
        </div>
      </main>

      {/* Tab Nav - Mobile */}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Live Pixel-Perfect A4 Print overlay */}
      {selectedQuotation && (
        <QuotePreview 
          quotation={selectedQuotation} 
          onClose={() => {
            setSelectedQuotation(null);
            // Restore clean URL if we came from a deep link
            if (window.location.pathname.startsWith("/quotation/")) {
              window.history.replaceState(null, "", "/");
            }
          }}
          settings={settings}
          customers={customers}
        />
      )}
    </div>
  );
}
