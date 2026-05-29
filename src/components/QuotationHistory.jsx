import React, { useState } from "react";
import { 
  Search, 
  Printer, 
  Copy, 
  Trash2, 
  Calendar,
  User,
  Filter,
  Share2
} from "lucide-react";
import { buildShareLink, generateShareHash } from "../utils/shareLink";

const formatIndianTotal = (num) => {
  const rounded = Math.round(num);
  const str = rounded.toString();
  if (str.length <= 3) return str;
  const lastThree = str.substring(str.length - 3);
  const others = str.substring(0, str.length - 3);
  return others.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
};

// Format phone: strip non-digits, ensure 91 prefix
const formatPhone = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits || null;
};

export default function QuotationHistory({ 
  quotations, 
  customers = [],
  onSelectQuotation, 
  onDuplicateQuotation, 
  onDeleteQuotation,
  settings
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleWhatsApp = (q) => {
    // Build self-contained link with full snapshot embedded
    const viewLink = buildShareLink(q, settings, customers);
    const template = settings?.whatsappTemplate ||
      `Hi {clientName},\n\nPlease find your quotation (Ref: {quotationNumber}).\n\nView: {viewLink}\n\nTotal: ₹{grandTotal}/-\n\nBest regards,\nKP Babu Computers`;

    const message = template
      .replace(/\{clientName\}/g, q.customerName)
      .replace(/\{quotationNumber\}/g, q.quotationNumber)
      .replace(/\{viewLink\}/g, viewLink)
      .replace(/\{grandTotal\}/g, formatIndianTotal(q.grandTotal));

    // Look up customer phone from customers array
    const customer = customers.find(c => c.id === q.customerId);
    const rawPhone = customer?.phone || "";
    const phone = formatPhone(rawPhone);

    let waUrl;
    if (phone) {
      waUrl = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    } else {
      waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 text-slate-700 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Quotation Logs & Archives</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Review details of commercial offers, re-issue invoices, duplicate templates, and delete expired entries.</p>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search quotations by quote reference number or customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 rounded-xl text-xs w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Quotations</option>
            <option value="approved">Approved Status</option>
            <option value="pending">Pending Status</option>
            <option value="expired">Expired Status</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuotations.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center text-slate-400 font-bold text-xs bg-white border border-slate-150">
            No quotation documents match your active query.<br />
            Create new quotation offers using the Quotation Builder.
          </div>
        ) : (
          filteredQuotations.map(q => (
            <div 
              key={q.id}
              className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-brand-blue-dark/25 bg-white group border border-slate-200"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-brand-blue transition-colors">{q.quotationNumber}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                    q.status === "Approved" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : q.status === "Pending"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {q.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{q.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">
                      {new Date(q.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Contains {q.items.length} line items | Bank: {q.bankDetails?.bankName}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0">
                <div className="text-left md:text-right">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Grand Total</span>
                  <span className="text-base font-black text-slate-900">{formatCurrency(q.grandTotal)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => onSelectQuotation(q)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-blue-dark/5 hover:bg-brand-blue-dark text-brand-blue-dark hover:text-white border border-brand-blue-dark/10 hover:border-brand-blue-dark text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View A4 PDF</span>
                  </button>

                  {/* WhatsApp Share */}
                  <button 
                    onClick={() => handleWhatsApp(q)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 transition-colors cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>

                  <button 
                    onClick={() => onDuplicateQuotation(q)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-brand-cyan/10 text-slate-400 hover:text-brand-cyan border border-slate-150 hover:border-brand-cyan/20 transition-colors cursor-pointer"
                    title="Duplicate Quotation Draft"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => onDeleteQuotation(q.id)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 border border-slate-150 hover:border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
