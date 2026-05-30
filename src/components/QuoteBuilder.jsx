import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Plus,
  Trash2,
  Cpu,
  Percent,
  IndianRupee,
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCheck,
  UserPlus
} from "lucide-react";

// Reusable keyboard-searchable autocomplete selector with click outside
function SearchableDropdown({
  label,
  placeholder,
  list,
  selectedValue,
  onSelect
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Sync search input state with selected value from parent
  useEffect(() => {
    if (selectedValue === "") {
      setSearch("");
    } else if (selectedValue === "custom") {
      setSearch("-- Custom Write-In --");
    } else {
      const selected = list.find(item => item.id === selectedValue);
      if (selected) {
        setSearch(`${selected.name} (${formatCurrency(selected.price)})`);
      }
    }
  }, [selectedValue, list]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isSelectedFocused = selectedValue !== "" && selectedValue !== "custom" && (() => {
    const selected = list.find(item => item.id === selectedValue);
    return selected ? (search === `${selected.name} (${formatCurrency(selected.price)})`) : false;
  })();

  const showSearchHint = !isSelectedFocused && search !== "-- Custom Write-In --" && search.trim().length < 3;

  const filtered = list.filter(item => {
    const q = search.toLowerCase().trim();
    if (q === "") return true;
    if (q === "-- custom write-in --") return true;

    // Check if search text matches the selected item exactly
    if (selectedValue !== "" && selectedValue !== "custom") {
      const currentSelected = list.find(x => x.id === selectedValue);
      if (currentSelected && search === `${currentSelected.name} (${formatCurrency(currentSelected.price)})`) {
        return true;
      }
    }
    return item.name.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className="space-y-1.5 relative searchable-dropdown-container">
      <label className="block text-[11px] font-bold text-slate-500">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") {
              onSelect("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full font-semibold text-slate-800"
        />
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => {
                onSelect("custom");
                setSearch("-- Custom Write-In --");
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-brand-red italic transition-colors"
            >
              -- Custom Write-In --
            </button>
            {showSearchHint ? (
              <div className="p-3 text-[11.5px] text-slate-400 text-center font-semibold italic">
                Please type at least 3 characters to search...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center font-bold">
                No matching products found.
              </div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setSearch(`${item.name} (${formatCurrency(item.price)})`);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors flex justify-between items-center"
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{formatCurrency(item.price)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuoteBuilder({
  customers,
  settings,
  quotations = [],
  onSaveQuotation,
  setActiveTab,
  editingQuotationDraft,
  clearEditingDraft,
  showToast,
  showConfirm
}) {

  // Core Quote Builder States
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerContainerRef = React.useRef(null);

  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [addedItems, setAddedItems] = useState([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedTerms, setSelectedTerms] = useState([...(settings?.terms || [])]);
  const [customTermInput, setCustomTermInput] = useState("");

  // Customer Inline Registration Panel
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "", phone: "", email: "", address: "", gst: ""
  });

  const [toast, setToast] = useState(null);

  const [customWriteIn, setCustomWriteIn] = useState({
    description: "",
    specs: "",
    price: "",
    gst: "18",
    qty: 1
  });

  // Click outside listener for customer dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Generate unique Quote Number
  useEffect(() => {
    if (editingQuotationDraft) {
      setSelectedCustomerId(editingQuotationDraft.customerId);
      const cust = customers.find(c => c.id === editingQuotationDraft.customerId);
      if (cust) {
        setCustomerSearchQuery(`${cust.name} (${cust.phone || "No Phone"})`);
      } else {
        setCustomerSearchQuery(editingQuotationDraft.customerName);
      }
      setQuoteDate(editingQuotationDraft.date);
      setAddedItems(editingQuotationDraft.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice,
        qty: item.qty,
        totalPrice: item.totalPrice
      })));
      setDiscountValue(editingQuotationDraft.discount || 0);
      setSelectedTerms(editingQuotationDraft.terms || [...(settings?.terms || [])]);
      setQuoteNumber(editingQuotationDraft.quotationNumber);
    } else {
      const preselected = window.localStorage.getItem("kpb_preselected_customer");
      if (preselected) {
        try {
          const parsed = JSON.parse(preselected);
          setSelectedCustomerId(parsed.id);
          setCustomerSearchQuery(`${parsed.name} (${parsed.phone || "No Phone"})`);
        } catch (e) {
          console.error("Error parsing preselected customer:", e);
        }
        window.localStorage.removeItem("kpb_preselected_customer");
      } else {
        setSelectedCustomerId("");
        setCustomerSearchQuery("");
      }

      // Generate the sequential date prefix KPB-DDMMYY-XX pattern
      const loadedQuotations = quotations || [];

      const generateNewQuoteNumber = (dateStr) => {
        const d = dateStr ? new Date(dateStr) : new Date();
        const DD = String(d.getDate()).padStart(2, "0");
        const MM = String(d.getMonth() + 1).padStart(2, "0");
        const YY = String(d.getFullYear()).slice(-2);
        const datePrefix = `KPB-${DD}${MM}${YY}-`;
        const matchingQuotes = (loadedQuotations || []).filter(q => q.quotationNumber && q.quotationNumber.startsWith(datePrefix));
        let nextSeq = 1;
        if (matchingQuotes.length > 0) {
          const suffixes = matchingQuotes.map(q => {
            const parts = q.quotationNumber.split("-");
            const suffix = parts[parts.length - 1];
            const num = parseInt(suffix, 10);
            return isNaN(num) ? 0 : num;
          });
          nextSeq = Math.max(...suffixes, 0) + 1;
        }
        const XX = String(nextSeq).padStart(2, "0");
        return `${datePrefix}${XX}`;
      };

      setQuoteNumber(generateNewQuoteNumber(quoteDate));
      setAddedItems([]);
      setDiscountValue(0);
      setSelectedTerms([...(settings?.terms || [])]);
    }
  }, [editingQuotationDraft, customers, quoteDate, quotations]);



  // Filter clients based on query patterns
  const filteredCustomers = customers.filter(c => {
    const query = customerSearchQuery.toLowerCase().trim();
    if (selectedCustomerId && customerSearchQuery === `${customers.find(x => x.id === selectedCustomerId)?.name} (${customers.find(x => x.id === selectedCustomerId)?.phone || "No Phone"})`) {
      return true;
    }
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.gst && c.gst.toLowerCase().includes(query))
    );
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };



  const handleUpdateItemQty = (id, newQty) => {
    const qty = Math.max(1, newQty);
    setAddedItems(addedItems.map(item => item.id === id ? {
      ...item,
      qty,
      totalPrice: qty * item.unitPrice
    } : item));
  };

  const handleUpdateItemPrice = (id, newPrice) => {
    const unitPrice = Math.max(0, newPrice);
    setAddedItems(addedItems.map(item => item.id === id ? {
      ...item,
      unitPrice,
      totalPrice: item.qty * unitPrice
    } : item));
  };

  const handleRemoveItem = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleClearBuilder = () => {
    showConfirm({
      title: "Clear Quotation Draft",
      message: "Are you sure you want to clear all current quotation draft fields and start fresh?",
      onConfirm: () => {
        setSelectedCustomerId("");
        setCustomerSearchQuery("");
        setAddedItems([]);
        setDiscountValue(0);

        const loadedQuotations = quotations || [];
        const generateNewQuoteNumber = (dateStr) => {
          const d = dateStr ? new Date(dateStr) : new Date();
          const DD = String(d.getDate()).padStart(2, "0");
          const MM = String(d.getMonth() + 1).padStart(2, "0");
          const YY = String(d.getFullYear()).slice(-2);
          const datePrefix = `KPB-${DD}${MM}${YY}-`;
          const matchingQuotes = loadedQuotations.filter(q => q.quotationNumber && q.quotationNumber.startsWith(datePrefix));
          let nextSeq = 1;
          if (matchingQuotes.length > 0) {
            const suffixes = matchingQuotes.map(q => {
              const parts = q.quotationNumber.split("-");
              const suffix = parts[parts.length - 1];
              const num = parseInt(suffix, 10);
              return isNaN(num) ? 0 : num;
            });
            nextSeq = Math.max(...suffixes, 0) + 1;
          }
          const XX = String(nextSeq).padStart(2, "0");
          return `${datePrefix}${XX}`;
        };

        setQuoteNumber(generateNewQuoteNumber(quoteDate));
        if (editingQuotationDraft) {
          clearEditingDraft();
        }
        showToast("Quotation draft fields cleared.", "success");
      }
    });
  };

  const handleFinalSaveQuotation = (statusValue) => {
    if (!selectedCustomerId) {
      showToast("Please select a customer for this quotation.", "error");
      return;
    }
    if (addedItems.length === 0) {
      showToast("Quotation must have at least one line item.", "error");
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomerId);
    const grandTotalBeforeDiscount = addedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const rawSubtotal = addedItems.reduce((acc, item) => {
      const rate = item.gstRate || 18;
      return acc + (item.totalPrice / (1 + rate / 100));
    }, 0);
    const subtotal = Math.round(rawSubtotal);
    const gstTotal = Math.round(grandTotalBeforeDiscount - rawSubtotal);
    const grandTotal = Math.max(0, grandTotalBeforeDiscount - discountValue);

    const todayStr = new Date().toISOString().split("T")[0];
    const finalDateStr = (quoteDate === todayStr) 
      ? new Date().toISOString() 
      : `${quoteDate}T12:00:00.000Z`;

    const quotationPayload = {
      id: editingQuotationDraft?.id || `q-${Date.now()}`,
      quotationNumber: quoteNumber,
      customerId: selectedCustomerId,
      customerName: customer ? customer.name : "Unknown",
      date: finalDateStr,
      items: addedItems,
      discount: discountValue,
      subtotal: subtotal,
      gstTotal: gstTotal,
      grandTotal: grandTotal,
      status: statusValue,
      terms: selectedTerms,
      bankDetails: {
        accountNo: settings.bankAccountNo,
        ifsc: settings.bankIfsc,
        bankName: settings.bankName
      }
    };
    onSaveQuotation("quotation", quotationPayload);
    if (editingQuotationDraft) {
      clearEditingDraft();
    }
    setSelectedCustomerId("");
    setCustomerSearchQuery("");
    setAddedItems([]);
    setDiscountValue(0);
    setActiveTab("history");
  };

  const handleInlineCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;
    const saved = await onSaveQuotation("customer_inline", newCustomerForm);
    if (saved) {
      setSelectedCustomerId(saved.id);
      setCustomerSearchQuery(`${saved.name} (${saved.phone || "No Phone"})`);
      setShowCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", address: "", gst: "" });
    }
  };

  const handleAddWriteIn = () => {
    if (!selectedCustomerId) {
      showToast("Please select the customer first", "warning");
      return;
    }
    const desc = customWriteIn.description;
    const specs = customWriteIn.specs || "";
    const qty = parseInt(customWriteIn.qty) || 1;
    const price = parseFloat(customWriteIn.price) || 0;
    const gstRate = parseInt(customWriteIn.gst) || 18;

    if (!desc.trim()) {
      showToast("Please enter an Item Title / Name.", "warning");
      return;
    }

    const fullDescription = specs.trim()
      ? `${desc.trim()}\n${specs.trim()}`
      : desc.trim();

    const payload = {
      id: `custom-line-${Date.now()}`,
      productId: "custom-write-in",
      description: fullDescription,
      qty,
      unitPrice: price,
      gstRate,
      totalPrice: price * qty
    };

    setAddedItems([...addedItems, payload]);
    setCustomWriteIn({
      description: "",
      specs: "",
      price: "",
      gst: "18",
      qty: 1
    });
  };

  const handleUpdateUnitPrice = (id, value) => {
    handleUpdateItemPrice(id, parseFloat(value) || 0);
  };

  const handleUpdateQty = (id, delta) => {
    const item = addedItems.find(x => x.id === id);
    if (item) {
      handleUpdateItemQty(id, item.qty + delta);
    }
  };

  const handleTermCheckboxToggle = (term) => {
    if (selectedTerms.includes(term)) {
      setSelectedTerms(selectedTerms.filter(t => t !== term));
    } else {
      setSelectedTerms([...selectedTerms, term]);
    }
  };

  const handleAddCustomTerm = () => {
    if (!customTermInput.trim()) return;
    if (!selectedTerms.includes(customTermInput.trim())) {
      setSelectedTerms([...selectedTerms, customTermInput.trim()]);
    }
    setCustomTermInput("");
  };

  const handleSaveInvoice = () => {
    handleFinalSaveQuotation(editingQuotationDraft?.status || "Pending");
  };

  const handleCreateCustomerInline = (e) => {
    handleInlineCustomerSubmit(e);
  };

  // Consistent inclusive calculation matching seed data and showroom terms
  const grandTotalBeforeDiscount = addedItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const rawSubtotal = addedItems.reduce((acc, item) => {
    const rate = item.gstRate || 18;
    return acc + (item.totalPrice / (1 + rate / 100));
  }, 0);
  const subtotal = Math.round(rawSubtotal);
  const gstTotal = Math.round(grandTotalBeforeDiscount - rawSubtotal);
  const grandTotal = Math.max(0, grandTotalBeforeDiscount - discountValue);

  return (
    <div className="space-y-6 text-slate-700">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            {editingQuotationDraft ? `Edit Quotation ${quoteNumber}` : "Quotation Constructor"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Draft, customize multi-line PC presets, calculate taxes and save quotations instantly.
          </p>
        </div>

        {editingQuotationDraft && (
          <button
            onClick={() => {
              clearEditingDraft();
              setSelectedCustomerId("");
              setCustomerSearchQuery("");
              setAddedItems([]);
              setDiscountValue(0);
              setActiveTab("history");
            }}
            className="flex items-center justify-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Core panel inputs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Customer Info & Meta details */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <Users className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Customer Address & Commercial Metadata</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700">

              {/* Customer Selector with Autocomplete Search ("Ajax on Typing") */}
              <div ref={customerContainerRef} className="sm:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-500 mb-1">Select Customer *</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type name, phone or email..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setShowCustomerDropdown(true);
                        if (e.target.value === "") {
                          setSelectedCustomerId("");
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full font-bold text-slate-800"
                    />
                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100">
                        {customerSearchQuery.trim().length < 3 && !selectedCustomerId ? (
                          <div className="p-3 text-[11.5px] text-slate-400 text-center font-semibold italic">
                            Please type at least 3 characters to search...
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center font-bold">
                            No customers found. Click + to add.
                          </div>
                        ) : (
                          filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setCustomerSearchQuery(`${c.name} (${c.phone || "No Phone"})`);
                                setShowCustomerDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <span className="font-extrabold text-slate-900">{c.name}</span>
                                {c.phone && <span className="text-[10px] text-slate-400 font-bold ml-2">Ph: {c.phone}</span>}
                              </div>
                              {c.gst && <span className="text-[9px] bg-brand-blue-dark/5 text-brand-blue-dark border border-brand-blue-dark/10 px-1.5 py-0.5 rounded font-black">GST</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Customer Inline trigger */}
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                    title="Quick Add Customer"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quote Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quotation Date *</label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full font-semibold text-slate-800"
                />
              </div>

              {/* Quote number (readonly) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quote Number</label>
                <input
                  type="text"
                  readOnly
                  value={quoteNumber}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full opacity-65 bg-slate-50 font-bold"
                />
              </div>

              {/* Bank Account info (Informative) */}
              <div className="sm:col-span-2 flex items-center p-2.5 bg-brand-blue-dark/5 border border-brand-blue-dark/10 rounded-xl text-[11px] text-slate-500">
                <span className="font-bold mr-1.5">Selected Bank:</span>
                <span className="font-semibold text-brand-blue-dark">{settings.bankName} (A/C: {settings.bankAccountNo}, IFS: {settings.bankIfsc})</span>
              </div>
            </div>
          </div>

          {/* Section 3: Add Items Control Panel (Custom write-in only) */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <ShoppingBag className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Add Items to Quotation</span>
            </h3>

            <div className="w-full space-y-3.5 max-w-3xl mx-auto">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1">Item Title / Name *</label>
                <input
                  type="text"
                  placeholder="Item Name (e.g. HP Pavilion Laptop)"
                  value={customWriteIn.description}
                  onChange={(e) => {
                    if (!selectedCustomerId) {
                      showToast("Please select the customer first", "warning");
                      return;
                    }
                    setCustomWriteIn({ ...customWriteIn, description: e.target.value });
                  }}
                  onFocus={() => {
                    if (!selectedCustomerId) {
                      showToast("Please select the customer first", "warning");
                    }
                  }}
                  className="glass-input px-4 py-3 rounded-xl text-xs w-full font-bold focus:border-brand-blue-dark transition-all duration-200 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1">Specifications / Subtext (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Specifications / Subtext (e.g. Core i5, 16GB RAM, 512GB SSD)..."
                  value={customWriteIn.specs || ""}
                  onChange={(e) => {
                    if (!selectedCustomerId) {
                      showToast("Please select the customer first", "warning");
                      return;
                    }
                    setCustomWriteIn({ ...customWriteIn, specs: e.target.value });
                  }}
                  onFocus={() => {
                    if (!selectedCustomerId) {
                      showToast("Please select the customer first", "warning");
                    }
                  }}
                  className="glass-input px-4 py-2.5 rounded-xl text-xs w-full resize-none font-semibold text-slate-600 focus:border-brand-blue-dark transition-all duration-200 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1">PRICE (INR) *</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      placeholder="Price"
                      value={customWriteIn.price || ""}
                      onChange={(e) => {
                        if (!selectedCustomerId) {
                          showToast("Please select the customer first", "warning");
                          return;
                        }
                        setCustomWriteIn({ ...customWriteIn, price: e.target.value });
                      }}
                      onFocus={() => {
                        if (!selectedCustomerId) {
                          showToast("Please select the customer first", "warning");
                        }
                      }}
                      className="glass-input px-3.5 rounded-xl text-xs w-full font-bold focus:border-brand-blue-dark transition-all duration-200 shadow-sm h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1">GST Rate</label>
                  <select
                    value={customWriteIn.gst}
                    onChange={(e) => {
                      if (!selectedCustomerId) {
                        showToast("Please select the customer first", "warning");
                        return;
                      }
                      setCustomWriteIn({ ...customWriteIn, gst: e.target.value });
                    }}
                    onFocus={() => {
                      if (!selectedCustomerId) {
                        showToast("Please select the customer first", "warning");
                      }
                    }}
                    className="glass-input px-3.5 rounded-xl text-xs w-full font-bold focus:border-brand-blue-dark transition-all duration-200 shadow-sm mt-1 h-11"
                  >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="28">28%</option>
                    <option value="0">0%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={customWriteIn.qty}
                    onChange={(e) => {
                      if (!selectedCustomerId) {
                        showToast("Please select the customer first", "warning");
                        return;
                      }
                      setCustomWriteIn({ ...customWriteIn, qty: e.target.value });
                    }}
                    onFocus={() => {
                      if (!selectedCustomerId) {
                        showToast("Please select the customer first", "warning");
                      }
                    }}
                    className="glass-input px-3.5 rounded-xl text-xs w-full font-bold focus:border-brand-blue-dark transition-all duration-200 shadow-sm mt-1 h-11 text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddWriteIn}
                className="w-full flex items-center justify-center bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-extrabold py-3.5 rounded-xl shadow-md text-xs cursor-pointer transition-all duration-200 transform active:scale-[0.99] mt-3 animate-fadeIn"
              >
                <Plus className="h-4.5 w-4.5 mr-1.5" /> Add Item
              </button>
            </div>
          </div>

          {/* Section 4: Line Items Table list */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center justify-between border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <span>Quotation Line Items</span>
              <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{addedItems.length} items bundled</span>
            </h3>

            {addedItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs leading-relaxed bg-slate-50/50 border border-slate-100 rounded-2xl">
                No items have been added to this quotation yet.<br />
                Fill in the details above and click "Add Item" to begin building this quotation!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-2 text-center w-24">Base Unit (INR)</th>
                      <th className="py-2.5 px-2 text-center w-24">GST</th>
                      <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                      <th className="py-2.5 px-3 text-right w-28">Total (Incl)</th>
                      <th className="py-2.5 pl-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {addedItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 text-slate-700">
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-pre-line leading-relaxed max-w-xs md:max-w-md">
                          {item.description}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateUnitPrice(item.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-xs text-center w-20 text-slate-800 font-bold focus:outline-none focus:border-brand-blue-dark"
                          />
                        </td>
                        <td className="py-3 px-2 text-center text-slate-500 font-bold">
                          {item.gstRate}%
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200 font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-800 px-1.5 text-center w-6">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="py-3 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove Line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Summary Calculations and Terms conditions */}
        <div className="space-y-6">

          {/* Summary calculations */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <Percent className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Quotation Summary & Totals</span>
            </h3>

            <div className="space-y-3.5 text-xs text-slate-500 font-semibold">

              <div className="flex justify-between items-center">
                <span>Subtotal (Pre-tax Base)</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>GST Total (18% Cumulative)</span>
                <span className="font-bold text-slate-800">{formatCurrency(gstTotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Discount Override (INR)</span>
                <div className="relative w-32">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="glass-input pl-7 pr-2 py-1.5 rounded-xl text-xs w-full text-right font-black text-slate-900"
                    placeholder="INR discount"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3.5 border-t border-slate-100 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Grand Total (Net)</span>
                <span className="font-black text-brand-blue text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms conditions checklist */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <FileCheck className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Validate Quotation Terms</span>
            </h3>

            {/* Checkboxes list of terms */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {settings.terms.map((term, idx) => (
                <label key={idx} className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-100/50">
                  <input
                    type="checkbox"
                    checked={selectedTerms.includes(term)}
                    onChange={() => handleTermCheckboxToggle(term)}
                    className="mt-0.5 rounded border-slate-350 bg-white text-brand-blue-dark focus:ring-brand-blue-dark"
                  />
                  <span className="leading-tight select-none font-semibold">{term}</span>
                </label>
              ))}

              {/* Display dynamic local terms that might not be in settings */}
              {selectedTerms.filter(t => !settings.terms.includes(t)).map((t, idx) => (
                <label key={idx + 100} className="flex items-start space-x-2.5 p-2 rounded-xl bg-brand-blue-dark/5 border border-brand-blue-dark/10 text-brand-blue-dark text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleTermCheckboxToggle(t)}
                    className="mt-0.5 rounded border-slate-350 bg-white text-brand-blue-dark focus:ring-brand-blue-dark"
                  />
                  <span className="leading-tight select-none font-bold">{t}</span>
                </label>
              ))}
            </div>

            {/* Add term input inline for this quote */}
            <div className="flex space-x-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Custom spec note..."
                value={customTermInput}
                onChange={(e) => setCustomTermInput(e.target.value)}
                className="glass-input px-3 py-1.5 rounded-xl text-[11px] flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTerm();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTerm}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="glass-card rounded-2xl p-5 space-y-3 bg-white border border-slate-200">
            <button
              type="button"
              onClick={handleSaveInvoice}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{editingQuotationDraft ? "Save Modified Quotation" : "Construct & Save Quotation"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearEditingDraft();
                setActiveTab("dashboard");
              }}
              className="w-full py-2.5 text-center text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold"
            >
              Cancel Draft
            </button>
          </div>
        </div>
      </div>

      {/* Customer Quick Add Modal Dialog Inline */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Create New Customer Profile</h3>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCustomerInline} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Customer Name *</label>
                <input
                  type="text" required placeholder="e.g. Kranthi Kumar Garu"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Mobile Phone *</label>
                <input
                  type="tel" required placeholder="e.g. +91 9988776655"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Email Address</label>
                <input
                  type="email" placeholder="e.g. kranthi.kumar@gmail.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">GSTIN Number (optional)</label>
                <input
                  type="text" placeholder="e.g. 37ACHPB2370B1Z7"
                  value={newCustomerForm.gst}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gst: e.target.value })}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Billing Address</label>
                <textarea
                  rows="2" placeholder="e.g. Brodipet 4th line, Guntur"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center bg-brand-blue-dark hover:bg-brand-blue text-white font-bold py-2.5 rounded-xl shadow-md text-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Save Client & Select</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification at Bottom Center */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between space-x-4 animate-slideUp pointer-events-auto"
        >
          <div className="flex-1 flex items-start space-x-3 text-white">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Save className="h-4 w-4" />
            </div>
            <div className="text-xs leading-relaxed">
              {toast.isUndone ? (
                <span className="font-black text-emerald-450">Undo done successfully!</span>
              ) : (
                <>
                  <span className="font-extrabold text-slate-450 uppercase tracking-wider block text-[9px] mb-0.5">Master Price Catalog Updated</span>
                  <span className="font-extrabold text-white block truncate max-w-[220px] md:max-w-xs">{toast.itemName}</span>
                  <span className="text-[11px] text-slate-300 mt-1 block font-semibold">
                    Price Update: <span className="line-through text-slate-500 mr-1.5 font-medium">{formatCurrency(toast.prevPrice)}</span>
                    - <strong className="text-white font-black">{formatCurrency(toast.newPrice)}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!toast.isUndone && (
              <button
                type="button"
                onClick={() => handleUndoPriceUpdate(toast)}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
