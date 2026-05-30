import React, { useState } from "react";
import { 
  Search, 
  Printer, 
  Copy, 
  Trash2, 
  Calendar,
  User,
  Filter,
  Share2,
  ChevronDown,
  FileText
} from "lucide-react";
import { buildShareLink } from "../utils/shareLink";

const formatIndianTotal = (num) => {
  const rounded = Math.round(num);
  const str = rounded.toString();
  if (str.length <= 3) return str;
  const lastThree = str.substring(str.length - 3);
  const others = str.substring(0, str.length - 3);
  return others.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
};

const formatPhone = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits || null;
};

const formatDateTimeIST = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const estString = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const localD = new Date(estString);
    const day = String(localD.getDate()).padStart(2, "0");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[localD.getMonth()];
    const year = localD.getFullYear();
    let hours = localD.getHours();
    const minutes = String(localD.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, "0");
    return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
  } catch (e) {
    return dateStr;
  }
};

const StatusBadge = ({ status, onClick }) => {
  const styles = {
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
    Pending:  "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
    Expired:  "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all shadow-sm ${styles[status] || styles.Pending}`}
    >
      <span>{status}</span>
      <ChevronDown className="h-2.5 w-2.5 ml-1 shrink-0 opacity-75" />
    </button>
  );
};

export default function QuotationHistory({ 
  quotations, 
  customers = [],
  onSelectQuotation, 
  onDuplicateQuotation, 
  onDeleteQuotation,
  onOpenStatusModal,
  settings
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleWhatsApp = (q) => {
    const viewLink = buildShareLink(q, settings, customers);
    const template = settings?.whatsappTemplate ||
      `Hi {clientName},\n\nPlease find your quotation (Ref: {quotationNumber}).\n\nView: {viewLink}\n\nTotal: ₹{grandTotal}/-\n\nBest regards,\nKP Babu Computers`;
    const message = template
      .replace(/\{clientName\}/g, q.customerName)
      .replace(/\{quotationNumber\}/g, q.quotationNumber)
      .replace(/\{viewLink\}/g, viewLink)
      .replace(/\{grandTotal\}/g, formatIndianTotal(q.grandTotal));
    const customer = customers.find(c => c.id === q.customerId);
    const phone = formatPhone(customer?.phone || "");
    const waUrl = phone
      ? `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 text-slate-700 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Quotation Logs &amp; Archives</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Review details of commercial offers, re-issue invoices, duplicate templates, and delete expired entries.</p>
      </div>

      {/* Search + Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by quote number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 rounded-xl text-xs w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {filteredQuotations.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400 font-bold text-xs bg-white border border-slate-150">
          No quotation documents match your active query.<br />
          Create new quotation offers using the Quotation Builder.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotations.map(q => {
            const statusColor = {
              Approved: { bar: "bg-emerald-500", bg: "from-emerald-50/60" },
              Pending:  { bar: "bg-amber-400",   bg: "from-amber-50/60" },
              Expired:  { bar: "bg-rose-400",    bg: "from-rose-50/60" },
            }[q.status] || { bar: "bg-slate-300", bg: "from-slate-50/60" };

            return (
              <div
                key={q.id}
                className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-brand-blue-dark/20 transition-all group`}
              >
                {/* Colored left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor.bar} rounded-l-2xl`} />

                {/* ── MOBILE CARD LAYOUT ── */}
                <div className="md:hidden pl-4 pr-4 pt-4 pb-3 space-y-3">
                  {/* Top row: Quote number + Status badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-brand-blue-dark shrink-0" />
                      <span className="text-sm font-extrabold text-slate-900 group-hover:text-brand-blue-dark transition-colors">
                        {q.quotationNumber}
                      </span>
                    </div>
                    <StatusBadge status={q.status} onClick={() => onOpenStatusModal(q)} />
                  </div>

                  {/* Customer + Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{q.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-500 truncate">{formatDateTimeIST(q.date)}</span>
                    </div>
                  </div>

                  {/* Grand Total + Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Grand Total</span>
                      <span className="text-base font-black text-slate-900">{formatCurrency(q.grandTotal)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleWhatsApp(q)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 transition-colors cursor-pointer shadow-sm"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectQuotation(q)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-blue-dark/5 hover:bg-brand-blue-dark text-brand-blue-dark hover:text-white border border-brand-blue-dark/10 hover:border-brand-blue-dark text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => onDuplicateQuotation(q)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 border border-slate-150 hover:border-blue-200 transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteQuotation(q.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 border border-slate-150 hover:border-rose-500/20 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── DESKTOP ROW LAYOUT ── */}
                <div className="hidden md:flex items-center justify-between gap-4 pl-5 pr-5 py-5">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-brand-blue-dark transition-colors">
                        {q.quotationNumber}
                      </h3>
                      <StatusBadge status={q.status} onClick={() => onOpenStatusModal(q)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{q.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold">{formatDateTimeIST(q.date)}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {q.items.length} line items | Bank: {q.bankDetails?.bankName}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Grand Total</span>
                      <span className="text-base font-black text-slate-900">{formatCurrency(q.grandTotal)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleWhatsApp(q)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 transition-colors cursor-pointer shadow-sm"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectQuotation(q)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-blue-dark/5 hover:bg-brand-blue-dark text-brand-blue-dark hover:text-white border border-brand-blue-dark/10 hover:border-brand-blue-dark text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>View A4 PDF</span>
                      </button>
                      <button
                        onClick={() => onDuplicateQuotation(q)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 border border-slate-150 hover:border-blue-200 transition-colors cursor-pointer"
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
