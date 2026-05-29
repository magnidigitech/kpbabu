import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  FileCheck,
  Briefcase
} from "lucide-react";

export default function CustomerList({ 
  customers, 
  quotations, 
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer,
  setActiveTab,
  onSelectQuotation
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);
  
  // Slide drawers states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "", gst: ""
  });

  // Filtered Customers
  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gst && c.gst.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    setFormData({ name: "", phone: "", email: "", address: "", gst: "" });
    setEditingCustomer(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (c, e) => {
    e.stopPropagation(); // Avoid selecting customer for history
    setEditingCustomer(c);
    setFormData({
      name: c.name, phone: c.phone, email: c.email, address: c.address, gst: c.gst || ""
    });
    setShowAddForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, formData);
    } else {
      onAddCustomer(formData);
    }
    setShowAddForm(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); // Avoid selecting customer for history
    onDeleteCustomer(id);
    if (selectedCustomerForHistory?.id === id) {
      setSelectedCustomerForHistory(null);
    }
  };

  // Find quotation history for a selected customer
  const getQuotationHistory = (customerId) => {
    return quotations.filter(q => q.customerId === customerId);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 text-slate-700 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Maintain customer directories, contact numbers, GST credentials, and review past commercial quotation history.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Grid: Left Column Customer List, Right Column Quotation History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Profiles List */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider text-[11px]">Registered Customer Accounts</h3>
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{filteredCustomers.length} clients</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search clients by name, GSTIN, mobile..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 pr-4 py-2 rounded-xl text-xs w-full"
            />
          </div>

          {/* Customer list container */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold text-xs bg-slate-50 border border-slate-100 rounded-2xl">
                No customer accounts found matching your query.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const history = getQuotationHistory(c.id);
                const isSelected = selectedCustomerForHistory?.id === c.id;
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCustomerForHistory(c)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 bg-white ${
                      isSelected 
                        ? "bg-brand-blue-dark/5 border-brand-blue-dark/30 shadow-sm" 
                        : "border-slate-150 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                            {c.gst ? `GSTIN: ${c.gst}` : "No GST Profile"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="p-1.5 rounded-lg hover:bg-brand-blue/5 text-slate-400 hover:text-brand-blue border border-slate-100 hover:border-brand-blue/20 transition-colors cursor-pointer bg-white"
                          title="Edit Customer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(c.id, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/5 text-slate-400 hover:text-rose-500 border border-slate-100 hover:border-rose-500/20 transition-colors cursor-pointer bg-white"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta contact grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 truncate" />
                        <span className="truncate">{c.email || "No Email"}</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.address || "No Address Added"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold pt-1">
                      <span className="text-slate-400 uppercase tracking-wider">History Records:</span>
                      <span className={`px-2 py-0.5 rounded-lg border font-bold ${history.length > 0 ? "bg-brand-blue-dark/5 text-brand-blue-dark border-brand-blue-dark/10" : "bg-slate-50 text-slate-400 border-slate-150"}`}>
                        {history.length} {history.length === 1 ? "Quotation" : "Quotations"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Invoice History panel */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-full min-h-[400px] bg-white">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider text-[11px] flex items-center space-x-2">
                <Briefcase className="h-4.5 w-4.5 text-brand-blue-dark" />
                <span>Quotation History</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Select a client profile on the left to inspect past commercial histories.</p>
            </div>

            {!selectedCustomerForHistory ? (
              <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold">No client profile selected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-900">{selectedCustomerForHistory.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">Phone: {selectedCustomerForHistory.phone}</p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {getQuotationHistory(selectedCustomerForHistory.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-xl">
                      This customer has no past commercial quotations.
                    </div>
                  ) : (
                    getQuotationHistory(selectedCustomerForHistory.id).map(q => (
                      <div 
                        key={q.id}
                        onClick={() => {
                          onSelectQuotation(q);
                        }}
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex items-center justify-between group cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors">
                            {q.quotationNumber}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                            {new Date(q.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-slate-900">{formatCurrency(q.grandTotal)}</p>
                          <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 border uppercase tracking-wider ${
                            q.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedCustomerForHistory && (
            <button 
              onClick={() => {
                // Set builder custom customer and switch tab
                window.localStorage.setItem("kpb_preselected_customer", JSON.stringify(selectedCustomerForHistory));
                setActiveTab("builder");
              }}
              className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold py-2.5 rounded-xl shadow-md text-xs mt-4 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Quote for Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Drawer Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-[12px]">
                  {editingCustomer ? "Edit Customer Record" : "Add New Customer Account"}
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs py-1 px-2.5 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Customer Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Customer / Enterprise Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Kranthi Kumar Garu"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Mobile / Telephone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. +91 9988776655"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. kranthi.kumar@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">GSTIN Number (State Code 37 for AP)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 37ACHPB2370B1Z7"
                    value={formData.gst}
                    onChange={(e) => setFormData({...formData, gst: e.target.value})}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Billing / Delivery Address</label>
                  <textarea 
                    rows="3"
                    placeholder="e.g. Brodipet 4th line, Guntur"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-brand-blue-dark hover:bg-brand-blue text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs mt-6 cursor-pointer"
                >
                  <FileCheck className="h-4.5 w-4.5" />
                  <span>{editingCustomer ? "Save Changes" : "Save Customer"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
