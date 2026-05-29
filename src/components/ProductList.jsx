import React, { useState, useRef } from "react";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  FileCheck,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";

export default function ProductList({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [importToast, setImportToast] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "", sku: "", brand: "", category: "Accessories", price: "", gst: 18, stock: "", warranty: "None"
  });

  const categories = [
    "all", "Processors", "Motherboards", "RAM", "Storage", "Cabinets", "SMPS", "Coolers", "Graphics Cards", "Laptops", "Desktops", "Monitors", "Printers", "Accessories"
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setFormData({ name: "", sku: "", brand: "", category: "Accessories", price: "", gst: 18, stock: "", warranty: "None" });
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({ name: p.name, sku: p.sku, brand: p.brand, category: p.category, price: p.price, gst: p.gst, stock: p.stock, warranty: p.warranty });
    setShowAddForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      gst: parseInt(formData.gst) || 18
    };
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }
    setShowAddForm(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const showToast = (type, message) => {
    setImportToast({ type, message });
    setTimeout(() => setImportToast(null), 4000);
  };

  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const skuSet = new Set(products.map(p => p.sku?.toLowerCase()));
        let added = 0, skipped = 0;
        const productsToAdd = [];

        rows.forEach(row => {
          const r = {};
          Object.keys(row).forEach(k => { r[k.toLowerCase().trim()] = row[k]; });

          const name = String(r.name || "").trim();
          const brand = String(r.brand || "").trim();
          if (!name || !brand) { skipped++; return; }

          const sku = String(r.sku || "").trim();
          if (sku && skuSet.has(sku.toLowerCase())) { skipped++; return; }

          productsToAdd.push({
            name,
            sku,
            brand,
            category: String(r.category || "Accessories").trim(),
            price: parseFloat(r.price) || 0,
            gst: parseInt(r.gst) || 18,
            stock: parseInt(r.stock) || 0,
            warranty: String(r.warranty || "None").trim(),
          });
          if (sku) skuSet.add(sku.toLowerCase());
          added++;
        });

        if (productsToAdd.length > 0) {
          onAddProduct(productsToAdd);
        }

        if (added > 0) {
          showToast("success", `Imported ${added} product${added > 1 ? "s" : ""}${skipped > 0 ? ` · ${skipped} skipped (missing fields / duplicate SKU)` : ""}`);
        } else {
          showToast("error", `No products imported. ${skipped > 0 ? `${skipped} row${skipped > 1 ? "s" : ""} skipped.` : "Check file format."}`);
        }
      } catch {
        showToast("error", "Failed to read file. Upload a valid .xlsx or .csv.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { name: "Example Product Name", sku: "SKU-001", brand: "BrandName", category: "Accessories", price: 5000, gst: 18, stock: 10, warranty: "1 Year" },
      { name: "Another Product", sku: "SKU-002", brand: "AnotherBrand", category: "Processors", price: 25000, gst: 18, stock: 5, warranty: "3 Years" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "KPB_Product_Import_Template.xlsx");
  };

  return (
    <div className="space-y-6 text-slate-700">
      {/* Import Toast */}
      {importToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold ${
          importToast.type === "success" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
        }`}>
          {importToast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{importToast.message}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Product Inventory</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Browse and manage catalog details, retail pricing, hardware categories and warranties.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer shadow-sm"
            title="Download sample Excel template"
          >
            <Download className="h-4 w-4" />
            <span>Template</span>
          </button>

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all cursor-pointer shadow-sm"
            title="Import products from Excel / CSV"
          >
            <Upload className="h-4 w-4" />
            <span>Import Excel</span>
          </button>

          <button 
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search products by brand, SKU, title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input pl-10 pr-4 py-2 rounded-xl text-sm w-full" />
        </div>
        <div className="flex items-center space-x-2">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="glass-input px-4 py-2 rounded-xl text-xs">
            {categories.map((c) => (<option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center md:col-span-2 lg:col-span-3 text-slate-400 font-bold text-sm bg-white">
            No products match the selected criteria. Add new products or import an Excel file.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl overflow-hidden hover:border-brand-blue-dark/20 transition-all duration-300 flex flex-col justify-between p-5 space-y-4 group bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200">{p.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-tight group-hover:text-brand-blue transition-colors">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">SKU: {p.sku || "N/A"}</p>
                </div>
                <span className="text-slate-600 font-bold text-[10px] uppercase tracking-wider px-2 py-1 bg-slate-50 border border-slate-150 rounded-lg">{p.brand}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-widest">Unit Price</span>
                  <span className="text-sm font-black text-slate-800">{formatCurrency(p.price)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-widest">GST</span>
                  <span className="font-extrabold text-emerald-600">{p.gst}% Incl</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${p.stock > 5 ? "bg-emerald-500" : p.stock > 0 ? "bg-amber-500" : "bg-rose-500"}`} />
                  <span>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
                </span>
                <span>Warranty: {p.warranty}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button onClick={() => handleOpenEdit(p)} className="flex items-center space-x-1 px-2.5 py-1 text-slate-500 hover:text-brand-blue hover:bg-brand-blue/5 border border-slate-200 hover:border-brand-blue/20 rounded-lg text-xs font-semibold cursor-pointer">
                  <Edit3 className="h-3.5 w-3.5" /><span>Edit</span>
                </button>
                <button onClick={() => onDeleteProduct(p.id)} className="flex items-center space-x-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-500/5 border border-slate-200 hover:border-rose-500/20 rounded-lg text-xs font-semibold cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" /><span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Drawer */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-[12px]">
                  {editingProduct ? "Modify Product Details" : "Register New Product"}
                </h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700 text-xs py-1 px-2.5 hover:bg-slate-100 rounded-lg font-bold">Cancel</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 font-sans">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Product Title / Spec Description *</label>
                  <input type="text" required placeholder="e.g. AMD Ryzen 9 7900X Processor" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">SKU Number</label>
                    <input type="text" placeholder="e.g. CPU-RY-7900" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Brand Name *</label>
                    <input type="text" required placeholder="e.g. AMD, ASUS" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Category *</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="glass-input px-3 py-2.5 rounded-xl text-xs w-full font-bold">
                      {categories.filter(c => c !== "all").map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Warranty Term</label>
                    <input type="text" placeholder="e.g. 3 Years" value={formData.warranty} onChange={(e) => setFormData({...formData, warranty: e.target.value})} className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Price (Incl. GST) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input type="number" required placeholder="Price in INR" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="glass-input pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">GST Rate *</label>
                    <select value={formData.gst} onChange={(e) => setFormData({...formData, gst: e.target.value})} className="glass-input px-2 py-2.5 rounded-xl text-xs w-full font-bold">
                      <option value="18">18%</option><option value="12">12%</option><option value="5">5%</option><option value="28">28%</option><option value="0">0%</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Current Stock Quantity *</label>
                  <input type="number" required placeholder="e.g. 15" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-brand-blue-dark hover:bg-brand-blue text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs mt-6 cursor-pointer">
                  <FileCheck className="h-4 w-4" />
                  <span>{editingProduct ? "Save Changes" : "Register Product"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
