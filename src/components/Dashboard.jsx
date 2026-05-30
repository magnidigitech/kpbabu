import React, { useState } from "react";
import { 
  FileText, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search,
  Printer, 
  Copy, 
  Trash2,
  TrendingUp,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";

export default function Dashboard({ 
  quotations, 
  setActiveTab, 
  onSelectQuotation, 
  onDuplicateQuotation, 
  onDeleteQuotation,
  onUpdateQuotationStatus,
  onOpenStatusModal
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDateTimeIST = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const estString = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const localD = new Date(estString);

      const day = String(localD.getDate()).padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

  // Calculations for KPI Cards
  const totalCount = quotations.length;
  const approvedQuotes = quotations.filter(q => q.status === "Approved");
  const pendingQuotes = quotations.filter(q => q.status === "Pending");
  
  const totalSales = approvedQuotes.reduce((acc, q) => acc + q.grandTotal, 0);
  const pendingValue = pendingQuotes.reduce((acc, q) => acc + q.grandTotal, 0);
  
  const approvedPercentage = totalCount ? Math.round((approvedQuotes.length / totalCount) * 100) : 0;

  // Filtered quotations for the table
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || q.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Gorgeous SVG Sparkline/Chart Data setup
  const chartData = [1200000, 1850000, 2400000, 1950000, 3100000, totalSales];
  const chartMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const maxChartVal = Math.max(...chartData) * 1.15;
  
  // Convert chart data to SVG points (width 500, height 150)
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 25;
  const points = chartData.map((val, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / (chartData.length - 1);
    const y = svgHeight - padding - (val / maxChartVal) * (svgHeight - padding * 2);
    return { x, y, val };
  });
  
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  return (
    <div className="space-y-6 text-slate-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Store Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time sales insights, quotation metrics and quick builder actions.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab("builder")}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales (Approved Quotations) */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-brand-blue-dark/25">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Total Revenue</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 border border-emerald-500/10">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalSales)}
            </h3>
            <div className="flex items-center space-x-1.5 mt-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% monthly growth</span>
            </div>
          </div>
        </div>

        {/* Total Quotations count */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-brand-blue-dark/25">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-brand-blue/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Quotations Issued</span>
            <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue border border-brand-blue/10">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {totalCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 font-bold uppercase tracking-wider text-[10px]">
              Across all customer profiles
            </p>
          </div>
        </div>

        {/* Pending Value */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/25">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-brand-yellow/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Pending Value</span>
            <div className="p-2 bg-brand-yellow/10 rounded-xl text-brand-yellow border border-brand-yellow/10">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(pendingValue)}
            </h3>
            <div className="flex items-center space-x-1.5 mt-1 text-slate-500 text-xs font-bold">
              <span>{pendingQuotes.length} active pending offers</span>
            </div>
          </div>
        </div>

        {/* Approved Success Rate */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-brand-cyan/25">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Conversion Rate</span>
            <div className="p-2 bg-brand-cyan/10 rounded-xl text-brand-cyan border border-brand-cyan/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {approvedPercentage}%
            </h3>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div 
                className="bg-gradient-to-r from-brand-blue-dark to-brand-cyan h-1.5 rounded-full" 
                style={{ width: `${approvedPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: SVG Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gorgeous custom SVG Chart */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider text-[11px]">Monthly Sales Analytics</h3>
              <p className="text-[10px] text-slate-500 font-medium">Total quotation sales value tracked in INR (1st half 2026)</p>
            </div>
            <span className="text-[10px] bg-brand-blue-dark/5 border border-brand-blue-dark/10 text-brand-blue-dark px-2.5 py-1 rounded-lg flex items-center space-x-1 font-bold">
              <TrendingUp className="h-3 w-3" />
              <span>Axis: 1M - 4M</span>
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full h-40 flex items-end">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full text-brand-blue-dark overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1b3b6f" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1b3b6f" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#e2e8f0" strokeWidth="1" />

              {/* Area Under Path */}
              <path d={areaPath} fill="url(#chartGrad)" />

              {/* Stroke Path */}
              <path d={linePath} fill="none" stroke="#1b3b6f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Interactive nodes */}
              {points.map((p, idx) => (
                <g key={idx} className="group/node cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#ffffff" 
                    stroke="#1b3b6f" 
                    strokeWidth="2.5" 
                    className="transition-all duration-150 hover:r-5 hover:stroke-brand-red"
                  />
                  {/* Tooltip on Node */}
                  <text 
                    x={p.x} 
                    y={p.y - 12} 
                    textAnchor="middle" 
                    fill="#1b3b6f" 
                    fontSize="9" 
                    fontWeight="bold"
                    className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-150 font-sans"
                  >
                    {idx === 5 ? formatCurrency(p.val) : `${(p.val / 100000).toFixed(1)}L`}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Chart Months labels */}
          <div className="flex justify-between px-[20px] pt-2 text-[10px] font-bold text-slate-400">
            {chartMonths.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>

        {/* Quick Actions and Shortcut items */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider text-[11px]">Quick Actions</h3>
            <p className="text-[10px] text-slate-500 font-medium">Common actions for managing stationery & computers store.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setActiveTab("builder")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-brand-blue-dark/20 text-slate-600 hover:text-brand-blue-dark transition-all group text-center cursor-pointer"
            >
              <div className="p-2 bg-brand-blue-dark/5 rounded-lg text-brand-blue-dark mb-2 group-hover:scale-110">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">New PC Build</span>
            </button>

            <button 
              onClick={() => setActiveTab("customers")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-brand-cyan/20 text-slate-600 hover:text-brand-cyan transition-all group text-center cursor-pointer"
            >
              <div className="p-2 bg-brand-cyan/5 rounded-lg text-brand-cyan mb-2 group-hover:scale-110">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Add Client</span>
            </button>

            <button 
              onClick={() => setActiveTab("products")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-brand-yellow/20 text-slate-600 hover:text-brand-yellow transition-all group text-center cursor-pointer"
            >
              <div className="p-2 bg-brand-yellow/5 rounded-lg text-brand-yellow mb-2 group-hover:scale-110">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Add Product</span>
            </button>

            <button 
              onClick={() => setActiveTab("settings")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-400/20 text-slate-600 hover:text-slate-800 transition-all group text-center cursor-pointer"
            >
              <div className="p-2 bg-slate-500/5 rounded-lg text-slate-500 mb-2 group-hover:scale-110">
                <ArrowUpRight className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Bank Setup</span>
            </button>
          </div>

          <div className="p-3 bg-brand-blue-dark/5 border border-brand-blue-dark/10 rounded-xl flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-bold">Authorised Show Room:</span>
            <span className="text-brand-blue-dark font-black uppercase tracking-wider text-[9px]">HP · ASUS · ACER</span>
          </div>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="glass-card rounded-2xl overflow-hidden bg-white">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider text-[11px]">Recent Quotations</h3>
            <p className="text-[10px] text-slate-500 font-medium">Search and manage computer store quotation history.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search number or customer..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-9 pr-4 py-1.5 rounded-xl text-xs w-full sm:w-56"
              />
            </div>

            {/* Filter Dropdown */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-3 py-1.5 rounded-xl text-xs w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold tracking-widest uppercase">
                <th className="px-6 py-4">Quote Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-bold">
                    No quotations found matching your search.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors text-slate-700">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {q.quotationNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      {q.customerName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {formatDateTimeIST(q.date)}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(q.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenStatusModal(q)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all shadow-sm ${
                          q.status === "Approved" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" 
                            : q.status === "Pending"
                            ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                            : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        <span>{q.status}</span>
                        <ChevronDown className="h-2.5 w-2.5 ml-1 shrink-0 opacity-75" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onSelectQuotation(q)}
                          className="p-1.5 rounded-lg hover:bg-brand-blue-dark/10 text-brand-blue-dark transition-colors cursor-pointer"
                          title="View / Print PDF"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDuplicateQuotation(q)}
                          className="p-1.5 rounded-lg hover:bg-brand-cyan/10 text-brand-cyan transition-colors cursor-pointer"
                          title="Duplicate Quotation"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteQuotation(q.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          title="Delete Quotation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
