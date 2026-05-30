import React, { useState } from "react";
import { 
  Store, 
  CreditCard, 
  FileText, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw,
  Info,
  MessageSquare
} from "lucide-react";

export default function Settings({ settings, onUpdateSettings, onResetDatabase, showConfirm, showToast }) {
  const [formData, setFormData] = useState({ ...settings });
  const [newTerm, setNewTerm] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setFormData(prev => ({
      ...prev,
      terms: [...prev.terms, newTerm.trim()]
    }));
    setNewTerm("");
  };

  const handleRemoveTerm = (index) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const triggerReset = () => {
    showConfirm({
      title: "Restore Seed Database",
      message: "Are you sure you want to restore the default seed database? This will clear all custom quotations, products, and customer directories. Type 'RESTORE' to authorize reset.",
      requireInput: true,
      expectedInputs: ["RESTORE", "RESTORE"],
      inputPlaceholder: "Type 'RESTORE' here...",
      onConfirm: () => {
        onResetDatabase();
        showToast("Database reset successfully!", "success");
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  return (
    <div className="space-y-6 text-slate-700 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          App Configurations
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Customize computer store parameters, default invoice tax rules, bank transactions and standard terms.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Store Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <Store className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Store Letterhead Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Company / Store Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.storeName}
                  onChange={(e) => handleChange("storeName", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tagline / Sub-header *</label>
                <input 
                  type="text" 
                  required
                  value={formData.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Established Sub-header *</label>
                <input 
                  type="text" 
                  required
                  value={formData.established}
                  onChange={(e) => handleChange("established", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Head Office Address *</label>
                <textarea 
                  rows="2"
                  required
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full resize-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mobile / Phone Numbers *</label>
                <input 
                  type="text" 
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Contact Email *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Store GSTIN *</label>
                <input 
                  type="text" 
                  required
                  value={formData.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <CreditCard className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Default Billing Bank Accounts</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bank Name & Branch *</label>
                <input 
                  type="text" 
                  required
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Account Number *</label>
                <input 
                  type="text" 
                  required
                  value={formData.bankAccountNo}
                  onChange={(e) => handleChange("bankAccountNo", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">IFS Code *</label>
                <input 
                  type="text" 
                  required
                  value={formData.bankIfsc}
                  onChange={(e) => handleChange("bankIfsc", e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                />
              </div>
            </div>
          </div>
          {/* WhatsApp Message Template */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp Share Message Template</span>
            </h3>
            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
              Customize the message sent when sharing a quotation on WhatsApp. Use these placeholders:
              <span className="ml-1 font-bold text-slate-700">{`{clientName}`}</span>,
              <span className="ml-1 font-bold text-slate-700">{`{quotationNumber}`}</span>,
              <span className="ml-1 font-bold text-slate-700">{`{viewLink}`}</span>,
              <span className="ml-1 font-bold text-slate-700">{`{grandTotal}`}</span>
            </p>
            <textarea
              rows={14}
              value={formData.whatsappTemplate || ""}
              onChange={(e) => handleChange("whatsappTemplate", e.target.value)}
              className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full resize-y font-mono text-slate-800 leading-relaxed"
              placeholder="Enter WhatsApp message template..."
            />
          </div>
        </div>

        {/* Right Columns - Terms & Reset */}
        <div className="space-y-6">
          
          {/* Terms & Conditions list */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <FileText className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Default Quotation Terms</span>
            </h3>

            {/* List terms */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {formData.terms.map((term, index) => (
                <div key={index} className="flex items-start justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <p className="text-slate-700 pr-2 leading-relaxed font-semibold">{index + 1}. {term}</p>
                  <button 
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-1 text-slate-400 hover:text-brand-red transition-colors cursor-pointer shrink-0"
                    title="Remove Term"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add term input */}
            <div className="flex space-x-2 pt-2 border-t border-slate-100">
              <input 
                type="text" 
                placeholder="Add new terms detail..." 
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="glass-input px-3 py-2 rounded-xl text-[11px] flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
              />
              <button 
                type="button"
                onClick={handleAddTerm}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="glass-card rounded-2xl p-5 space-y-3 bg-white border border-slate-200">
            <button 
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" />
              <span>Save Configuration</span>
            </button>

            {savedSuccess && (
              <p className="text-emerald-600 text-center text-xs font-bold animate-pulse flex items-center justify-center space-x-1">
                <Info className="h-3.5 w-3.5" />
                <span>Store configurations updated successfully!</span>
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 mt-3">
              <button 
                type="button"
                onClick={triggerReset}
                className="w-full flex items-center justify-center space-x-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 text-rose-600 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Restore Seed Database</span>
              </button>
              <p className="text-[9.5px] text-slate-400 text-center mt-2 leading-normal font-semibold">
                Caution: Restoring will revert all products, customers and history logs back to baseline values.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
