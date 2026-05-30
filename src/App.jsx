import React, { useState, useEffect } from "react";
import { 
  getLocalStorageData, 
  setLocalStorageData,
  DEFAULT_SETTINGS
} from "./data/seedData";

// Components
import Sidebar from "./components/Sidebar";
import TabNav from "./components/TabNav";
import Dashboard from "./components/Dashboard";
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

  // Toast & Confirmation Dialog States
  const [toast, setToast] = useState(null); // { message, type }
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, requireInput, expectedInputs, inputPlaceholder, onConfirm, onCancel }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const showConfirm = (options) => {
    setConfirmDialog(options);
  };

  // Toast Auto-Dismiss
  useEffect(() => {
    if (!toast) return;
    const duration = toast.type === "error" ? 6000 : 4000;
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initialize DB and load states on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, productsRes, customersRes, quotationsRes] = await Promise.all([
          fetch('/api/settings').then(res => res.json()).catch(err => ({ error: true })),
          fetch('/api/products').then(res => res.json()).catch(err => ({ error: true })),
          fetch('/api/customers').then(res => res.json()).catch(err => ({ error: true })),
          fetch('/api/quotations').then(res => res.json()).catch(err => ({ error: true }))
        ]);

        // Resilient DB Settings load
        if (settingsRes && !settingsRes.error) {
          if (settingsRes.tagline === "HP ASUS ACER AUTHORISED SHOW ROOM" || settingsRes.tagline.includes("ASUS")) {
            settingsRes.tagline = "HP AUTHORISED SHOWROOM";
            fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settingsRes)
            }).catch(e => console.error("Error updating settings:", e));
          }
          setSettings(settingsRes);
        } else {
          console.warn("DB settings failed, falling back to local/default.");
          const fallback = getLocalStorageData("kpb_settings", DEFAULT_SETTINGS);
          if (fallback.tagline === "HP ASUS ACER AUTHORISED SHOW ROOM" || fallback.tagline.includes("ASUS")) {
            fallback.tagline = "HP AUTHORISED SHOWROOM";
            setLocalStorageData("kpb_settings", fallback);
          }
          setSettings(fallback);
        }

        // Resilient DB Products load
        if (Array.isArray(productsRes) && productsRes.length > 0) {
          setProducts(productsRes);
        } else {
          console.warn("DB products failed, falling back to local.");
          setProducts(getLocalStorageData("kpb_products", []));
        }

        // Resilient DB Customers load
        if (Array.isArray(customersRes) && customersRes.length > 0) {
          setCustomers(customersRes);
        } else {
          console.warn("DB customers failed, falling back to local.");
          setCustomers(getLocalStorageData("kpb_customers", []));
        }

        // Resilient DB Quotations load
        if (Array.isArray(quotationsRes) && quotationsRes.length > 0) {
          setQuotations(quotationsRes);
        } else {
          console.warn("DB quotations failed, falling back to local.");
          setQuotations(getLocalStorageData("kpb_quotations", []));
        }

        const sessionUser = getLocalStorageData("kpb_session_user", null);
        if (sessionUser) {
          setUser(sessionUser);
          setIsLoggedIn(true);
        }

        // ── Deep link routing: /quotation/{ref}#{snapshot-or-hash} ─────────────────────
        const path = window.location.pathname;
        const match = path.match(/^\/quotation\/([^/]+)/);
        if (match) {
          const shareHash = decodeURIComponent(match[1]);
          const publicRes = await fetch(`/api/public-quotation/${shareHash}`).then(res => res.json()).catch(err => null);
          if (publicRes && !publicRes.error) {
            setPublicViewData(publicRes);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading fullstack database, using complete client fallbacks:", error);
        const fallback = getLocalStorageData("kpb_settings", DEFAULT_SETTINGS);
        if (fallback.tagline === "HP ASUS ACER AUTHORISED SHOW ROOM" || fallback.tagline.includes("ASUS")) {
          fallback.tagline = "HP AUTHORISED SHOWROOM";
          setLocalStorageData("kpb_settings", fallback);
        }
        setSettings(fallback);
        setProducts(getLocalStorageData("kpb_products", []));
        setCustomers(getLocalStorageData("kpb_customers", []));
        setQuotations(getLocalStorageData("kpb_quotations", []));
        setIsInitialized(true);
      }
    }

    loadData();
  }, []);

  // Hardcoded credential store (role-based)
  const CREDENTIALS = [
    { username: "kpbabu",      password: "Kali@1965P",      role: "admin",  displayName: "KP Babu" },
    { username: "kpbabustaff", password: "Kali.staff@1965", role: "staff",  displayName: "Staff" },
  ];

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = loginForm;

    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password.");
      return;
    }

    const match = CREDENTIALS.find(
      (c) => c.username === username.trim() && c.password === password
    );

    if (!match) {
      setLoginError("Invalid username or password. Please try again.");
      return;
    }

    const successfulUser = {
      name: match.displayName,
      role: match.role,
    };

    setUser(successfulUser);
    setIsLoggedIn(true);
    setLoginError("");
    // Staff lands on builder tab only
    if (match.role === "staff") setActiveTab("builder");
    setLocalStorageData("kpb_session_user", successfulUser);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    window.localStorage.removeItem("kpb_session_user");
  };

  const saveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data && data.error) {
        showToast(`Failed to save settings: ${data.error}`, "error");
        return;
      }
      setSettings(data);
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings.", "error");
    }
  };

  // PRODUCT MUTATORS (CRUD)
  const handleAddProduct = async (newProd) => {
    try {
      if (Array.isArray(newProd)) {
        const payloads = newProd.map((prod, idx) => ({
          id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
          ...prod
        }));
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads)
        });
        const data = await res.json();
        if (data && data.error) {
          showToast(`Failed to add products: ${data.error}`, "error");
          return;
        }
        setProducts([...products, ...data]);
        showToast("Products added successfully!", "success");
      } else {
        const payload = {
          id: `prod-${Date.now()}`,
          ...newProd
        };
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.error) {
          showToast(`Failed to add product: ${data.error}`, "error");
          return;
        }
        setProducts([...products, data]);
        showToast("Product added successfully!", "success");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      showToast("Failed to add product.", "error");
    }
  };

  const handleUpdateProduct = async (id, updatedFields) => {
    try {
      const currentProd = products.find(p => p.id === id);
      const payload = { ...currentProd, ...updatedFields };
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.error) {
        showToast(`Failed to update product: ${data.error}`, "error");
        return;
      }
      setProducts(products.map(p => p.id === id ? data : p));
      showToast("Product updated successfully!", "success");
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("Failed to update product.", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    showConfirm({
      title: "Delete Product Catalog Item",
      message: `Are you sure you want to permanently delete product "${p.name}"? This action cannot be undone.`,
      requireInput: true,
      expectedInputs: [p.name, p.name],
      inputPlaceholder: `Type "${p.name}" here to authorize...`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data && data.error) {
            showToast(`Failed to delete product: ${data.error}`, "error");
            return;
          }
          setProducts(products.filter(p => p.id !== id));
          showToast("Product deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting product:", error);
          showToast("Failed to delete product.", "error");
        }
      }
    });
  };

  // CUSTOMER MUTATORS (CRUD)
  const handleAddCustomer = async (newCust) => {
    try {
      const payload = {
        id: `cust-${Date.now()}`,
        ...newCust
      };
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.error) {
        showToast(`Failed to add customer: ${data.error}`, "error");
        return null;
      }
      setCustomers([...customers, data]);
      showToast("Customer added successfully!", "success");
      return data;
    } catch (error) {
      console.error("Error adding customer:", error);
      showToast("Failed to add customer.", "error");
      return null;
    }
  };

  const handleUpdateCustomer = async (id, updatedFields) => {
    try {
      const currentCust = customers.find(c => c.id === id);
      const payload = { ...currentCust, ...updatedFields };
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.error) {
        showToast(`Failed to update customer: ${data.error}`, "error");
        return;
      }
      setCustomers(customers.map(c => c.id === id ? data : c));
      showToast("Customer updated successfully!", "success");
    } catch (error) {
      console.error("Error updating customer:", error);
      showToast("Failed to update customer.", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    const c = customers.find(item => item.id === id);
    if (!c) return;

    showConfirm({
      title: "Delete Customer Record",
      message: `Are you sure you want to permanently delete customer "${c.name}"? This action cannot be undone.`,
      requireInput: true,
      expectedInputs: [c.name, c.name],
      inputPlaceholder: `Type "${c.name}" here to authorize...`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            let errMsg = `Server error ${res.status}`;
            try {
              const errData = await res.json();
              if (errData?.error) errMsg = errData.error;
            } catch (_) {}
            showToast(`Failed to delete customer: ${errMsg}`, "error");
            return;
          }
          setCustomers(customers.filter(x => x.id !== id));
          showToast("Customer record deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting customer:", error);
          showToast("Failed to delete customer. Check network connection.", "error");
        }
      }
    });
  };

  // QUOTATION MUTATORS (Create, Edit, Duplicate, Delete)
  const handleSaveQuotation = async (type, payload) => {
    if (type === "customer_inline") {
      return await handleAddCustomer(payload);
    }

    try {
      const payloadWithHash = payload.shareHash
        ? payload
        : { ...payload, shareHash: generateShareHash(payload.id) };

      const exists = quotations.some(q => q.id === payloadWithHash.id);
      const oldStatus = exists ? quotations.find(q => q.id === payloadWithHash.id).status : null;

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithHash)
      });
      const savedData = await res.json();
      if (savedData && savedData.error) {
        showToast(`Failed to save quotation record: ${savedData.error}`, "error");
        return;
      }

      let updated;
      if (exists) {
        updated = quotations.map(q => q.id === savedData.id ? savedData : q);
      } else {
        updated = [savedData, ...quotations];
      }
      setQuotations(updated);
      showToast("Quotation saved successfully!", "success");
      
      // Stock sync: if transitioning to Approved, sync products stock
      if (savedData.status === "Approved" && oldStatus !== "Approved") {
        const updatedProducts = await fetch('/api/products').then(res => res.json()).catch(err => []);
        if (Array.isArray(updatedProducts)) setProducts(updatedProducts);
      }
    } catch (error) {
      console.error("Error saving quotation:", error);
      showToast("Failed to save quotation record.", "error");
    }
  };

  const handleDuplicateQuotation = (q) => {
    const today = new Date().toISOString().split("T")[0];
    
    const d = new Date(today);
    const DD = String(d.getDate()).padStart(2, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const YY = String(d.getFullYear()).slice(-2);
    const datePrefix = `KPB-${DD}${MM}${YY}-`;
    
    const matchingQuotes = quotations.filter(x => x.quotationNumber && x.quotationNumber.startsWith(datePrefix));
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

  const handleDeleteQuotation = async (id) => {
    const q = quotations.find(item => item.id === id);
    if (!q) return;

    showConfirm({
      title: "Confirm Deletion",
      message: `Are you sure you want to permanently delete quotation "${q.quotationNumber}"? This action is irreversible.`,
      requireInput: true,
      expectedInputs: [q.quotationNumber, q.quotationNumber],
      inputPlaceholder: `Type "${q.quotationNumber}" here to confirm...`,
      onConfirm: async () => {
        try {
          await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
          setQuotations(quotations.filter(x => x.id !== id));
          showToast("Quotation deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting quotation:", error);
          showToast("Failed to delete quotation record.", "error");
        }
      }
    });
  };

  const handleUpdateQuotationStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data && data.error) {
        showToast(`Failed to update status: ${data.error}`, "error");
        return;
      }
      setQuotations(quotations.map(q => q.id === id ? data : q));
      showToast(`Quotation status updated to "${newStatus}"!`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update quotation status.", "error");
    }
  };

  const [statusModalQuotation, setStatusModalQuotation] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [confirmInputValid, setConfirmInputValid] = useState(false);


  const handleOpenStatusModal = (q) => {
    setStatusModalQuotation(q);
    setSelectedStatus(q.status);
  };

  // Render correct panel
  const renderTabContent = () => {
    const isStaff = user?.role === "staff";

    // Staff can ONLY access the Quote Builder
    if (isStaff && activeTab !== "builder") {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
            Your staff account only has access to the <strong className="text-slate-600">Create Quotation</strong> section.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            quotations={quotations}
            setActiveTab={setActiveTab}
            onSelectQuotation={setSelectedQuotation}
            onDuplicateQuotation={handleDuplicateQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onUpdateQuotationStatus={handleUpdateQuotationStatus}
            onOpenStatusModal={handleOpenStatusModal}
          />
        );
      case "builder":
        return (
          <QuoteBuilder 
            customers={customers}
            settings={settings}
            quotations={quotations}
            onSaveQuotation={handleSaveQuotation}
            setActiveTab={setActiveTab}
            editingQuotationDraft={editingQuotationDraft}
            clearEditingDraft={() => setEditingQuotationDraft(null)}
            showToast={showToast}
            showConfirm={showConfirm}
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
            onUpdateQuotationStatus={handleUpdateQuotationStatus}
            onOpenStatusModal={handleOpenStatusModal}
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

      case "settings":
        return (
          <Settings 
            settings={settings}
            onUpdateSettings={saveSettings}
            onResetDatabase={() => {
              window.localStorage.removeItem("kpb_session_user");
            }}
            showConfirm={showConfirm}
            showToast={showToast}
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
            Contact your administrator for login credentials.
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
        userRole={user?.role}
      />

      {/* Main Panel Content Container */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderTabContent()}
        </div>
      </main>

      {/* Tab Nav - Mobile */}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />

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

      {/* Premium Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm bg-white/85 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center space-x-3.5 animate-slideUp">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            toast.type === "success" 
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
              : toast.type === "error"
              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
          }`}>
            {toast.type === "success" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {toast.type === "success" ? "Success" : toast.type === "error" ? "System Error" : "Attention"}
            </p>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Premium Custom Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950">{confirmDialog.title || "Confirm Action"}</h3>
            </div>

            <p className="text-xs text-slate-500 font-bold leading-relaxed">{confirmDialog.message}</p>

            {confirmDialog.requireInput && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Type Confirmation Phrase to Authorize
                </label>
                <input
                  type="text"
                  placeholder={confirmDialog.inputPlaceholder || "Type exactly to confirm..."}
                  className="glass-input px-4 py-2.5 rounded-xl text-xs w-full font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 shadow-sm"
                  onChange={(e) => {
                    const typed = e.target.value.trim().toLowerCase();
                    const matched = confirmDialog.expectedInputs.some(
                      (expected) => expected.trim().toLowerCase() === typed
                    );
                    setConfirmInputValid(matched);
                  }}
                />
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Required: <span className="font-extrabold text-slate-700 select-all">"{confirmDialog.expectedInputs[0]}"</span>
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                  setConfirmInputValid(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmDialog.requireInput && !confirmInputValid}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                  setConfirmInputValid(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-md shadow-rose-900/10 transition-all ${
                  confirmDialog.requireInput && !confirmInputValid
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:from-rose-600 hover:to-rose-700"
                }`}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Custom Status Update Modal */}
      {statusModalQuotation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950">Update Quotation Status</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Change state of the selected document entry</p>
              </div>
              <button 
                type="button" 
                onClick={() => setStatusModalQuotation(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content: Show Quotation Info */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold">Quotation Number</span>
                <span className="text-slate-900 font-extrabold">{statusModalQuotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold">Customer Name</span>
                <span className="text-slate-900 font-black">{statusModalQuotation.customerName}</span>
              </div>
            </div>

            {/* Radio Card Buttons Selection */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Select Active Status Offer
              </label>

              {/* Option: Pending */}
              <div
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedStatus === "Pending"
                    ? "border-amber-500 bg-amber-50/30 text-amber-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
                onClick={() => setSelectedStatus("Pending")}
              >
                <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  selectedStatus === "Pending" ? "border-amber-500 bg-white" : "border-slate-300 bg-white"
                }`}>
                  {selectedStatus === "Pending" && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Pending</span>
              </div>

              {/* Option: Approved */}
              <div
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedStatus === "Approved"
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
                onClick={() => setSelectedStatus("Approved")}
              >
                <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  selectedStatus === "Approved" ? "border-emerald-500 bg-white" : "border-slate-300 bg-white"
                }`}>
                  {selectedStatus === "Approved" && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Approved</span>
              </div>

              {/* Option: Expired */}
              <div
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedStatus === "Expired"
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
                onClick={() => setSelectedStatus("Expired")}
              >
                <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  selectedStatus === "Expired" ? "border-rose-500 bg-white" : "border-slate-300 bg-white"
                }`}>
                  {selectedStatus === "Expired" && <div className="h-2 w-2 rounded-full bg-rose-500" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Expired</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalQuotation(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateQuotationStatus(statusModalQuotation.id, selectedStatus);
                  setStatusModalQuotation(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-brand-blue-dark to-brand-blue shadow-md shadow-blue-900/10 cursor-pointer text-center hover:from-brand-blue hover:to-brand-blue-dark transition-all"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
