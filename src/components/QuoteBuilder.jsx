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
  products, 
  customers, 
  settings, 
  quotations = [],
  onSaveQuotation, 
  onUpdateProduct,
  setActiveTab,
  editingQuotationDraft,
  clearEditingDraft
}) {
  
  // Custom PC components categorizations for the builder preset
  const cpuList = products.filter(p => p.category === "Processors");
  const mbList = products.filter(p => p.category === "Motherboards");
  const ramList = products.filter(p => p.category === "RAM");
  const ssdList = products.filter(p => p.category === "Storage");
  const cabList = products.filter(p => p.category === "Cabinets");
  const smpsList = products.filter(p => p.category === "SMPS");
  const lqList = products.filter(p => p.category === "Coolers");
  const gpuList = products.filter(p => p.category === "Graphics Cards");

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

  // Custom Build PC Preset Panel states
  const [showPcBuilder, setShowPcBuilder] = useState(false);
  const [pcConfig, setPcConfig] = useState({
    cpuId: "", cpuPrice: 0, cpuCustomName: "",
    mbId: "", mbPrice: 0, mbCustomName: "",
    ramId: "", ramPrice: 0, ramQty: 2, ramCustomName: "",
    ssd1Id: "", ssd1Price: 0, ssd1CustomName: "",
    ssd2Id: "", ssd2Price: 0, ssd2CustomName: "",
    cabId: "", cabPrice: 0, cabCustomName: "",
    smpsId: "", smpsPrice: 0, smpsCustomName: "",
    lqId: "", lqPrice: 0, lqCustomName: "",
    gpuId: "", gpuPrice: 0, gpuQty: 2, gpuCustomName: ""
  });

  const [toast, setToast] = useState(null);

  // Product Selection Modal/States for Standard Items
  const [standardSearch, setStandardSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const [customWriteIn, setCustomWriteIn] = useState({
    description: "",
    specs: "",
    price: "",
    gst: "18",
    qty: 1
  });

  const searchedProducts = standardSearch.toLowerCase().trim() === ""
    ? []
    : products
        .filter(p => !p.category.includes("Processors") && !p.category.includes("Motherboards"))
        .filter(p => p.name.toLowerCase().includes(standardSearch.toLowerCase().trim()));

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

  // Handle component selection price updates
  const handlePcComponentChange = (field, id) => {
    let price = 0;
    let customName = "";

    if (id && id !== "custom") {
      const prod = products.find(p => p.id === id);
      if (prod) {
        price = prod.price;
        customName = prod.name;
      }
    }

    setPcConfig(prev => ({
      ...prev,
      [`${field}Id`]: id,
      [`${field}Price`]: price,
      [`${field}CustomName`]: customName
    }));
  };

  // Compile Custom PC config into a single Line Item
  const handleCompileCustomPc = () => {
    const lines = ["Custom Build PC:"];
    let totalPcCost = 0;

    const addLine = (label, configId, configName, configPrice, qty = 1) => {
      let name = "";
      let price = parseFloat(configPrice) || 0;

      if (configId === "custom") {
        name = configName;
      } else if (configId) {
        const prod = products.find(p => p.id === configId);
        name = prod ? prod.name : "";
      }

      if (name) {
        const formattedLabel = label ? `${label}: ` : "";
        const formattedQty = qty > 1 ? `${qty} x ` : "";
        lines.push(`${formattedLabel}${formattedQty}${name}`);
        totalPcCost += price * qty;
      }
    };

    addLine("Processor", pcConfig.cpuId, pcConfig.cpuCustomName, pcConfig.cpuPrice);
    addLine("MotherBoard", pcConfig.mbId, pcConfig.mbCustomName, pcConfig.mbPrice);
    addLine("RAM", pcConfig.ramId, pcConfig.ramCustomName, pcConfig.ramPrice, pcConfig.ramQty);
    addLine("Storage", pcConfig.ssd1Id, pcConfig.ssd1CustomName, pcConfig.ssd1Price);
    addLine("Secondary Storage", pcConfig.ssd2Id, pcConfig.ssd2CustomName, pcConfig.ssd2Price);
    addLine("Cabinet", pcConfig.cabId, pcConfig.cabCustomName, pcConfig.cabPrice);
    addLine("SMPS", pcConfig.smpsId, pcConfig.smpsCustomName, pcConfig.smpsPrice);
    addLine("LQ", pcConfig.lqId, pcConfig.lqCustomName, pcConfig.lqPrice);
    addLine("Graphics", pcConfig.gpuId, pcConfig.gpuCustomName, pcConfig.gpuPrice, pcConfig.gpuQty);

    if (lines.length === 1) {
      alert("Please select or write in at least one computer component to package a Custom Build PC.");
      return;
    }

    const compiledPayload = {
      id: `compiled-${Date.now()}`,
      productId: "custom-build-pc",
      description: lines.join("\n"),
      qty: 1,
      unitPrice: totalPcCost,
      gstRate: 18,
      totalPrice: totalPcCost
    };

    setAddedItems([...addedItems, compiledPayload]);

    // Reset Builder inputs
    setPcConfig({
      cpuId: "", cpuPrice: 0, cpuCustomName: "",
      mbId: "", mbPrice: 0, mbCustomName: "",
      ramId: "", ramPrice: 0, ramQty: 2, ramCustomName: "",
      ssd1Id: "", ssd1Price: 0, ssd1CustomName: "",
      ssd2Id: "", ssd2Price: 0, ssd2CustomName: "",
      cabId: "", cabPrice: 0, cabCustomName: "",
      smpsId: "", smpsPrice: 0, smpsCustomName: "",
      lqId: "", lqPrice: 0, lqCustomName: "",
      gpuId: "", gpuPrice: 0, gpuQty: 2, gpuCustomName: ""
    });
    setShowPcBuilder(false);
  };

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

  const isComponentPriceOverridden = (field, id, currentPrice) => {
    if (!id || id === "custom") return false;
    const prod = products.find(p => p.id === id);
    if (!prod) return false;
    return prod.price !== currentPrice;
  };

  const isLineItemPriceOverridden = (item) => {
    if (!item.productId || item.productId === "custom-write-in" || item.productId === "custom-build-pc") return false;
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return false;
    return prod.price !== item.unitPrice;
  };

  const handleSaveComponentPriceToCatalog = (id, newPrice) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const previousPrice = prod.price;

    if (!onUpdateProduct) {
      alert("Unable to update master catalog: onUpdateProduct callback is missing.");
      return;
    }

    onUpdateProduct(id, { price: newPrice });

    // Show custom toast at bottom center with Undo option
    setToast({
      id: `toast-${Date.now()}`,
      productId: id,
      itemName: prod.name,
      prevPrice: previousPrice,
      newPrice: newPrice,
      isUndone: false
    });
  };

  const handleUndoPriceUpdate = (toastItem) => {
    if (!onUpdateProduct) return;
    
    // Revert the price back in the master catalog
    onUpdateProduct(toastItem.productId, { price: toastItem.prevPrice });

    // Revert the active spec builder price in QuoteBuilder state
    setPcConfig(prev => {
      let updated = { ...prev };
      if (prev.cpuId === toastItem.productId) updated.cpuPrice = toastItem.prevPrice;
      if (prev.mbId === toastItem.productId) updated.mbPrice = toastItem.prevPrice;
      if (prev.ramId === toastItem.productId) updated.ramPrice = toastItem.prevPrice;
      if (prev.ssd1Id === toastItem.productId) updated.ssd1Price = toastItem.prevPrice;
      if (prev.ssd2Id === toastItem.productId) updated.ssd2Price = toastItem.prevPrice;
      if (prev.cabId === toastItem.productId) updated.cabPrice = toastItem.prevPrice;
      if (prev.smpsId === toastItem.productId) updated.smpsPrice = toastItem.prevPrice;
      if (prev.lqId === toastItem.productId) updated.lqPrice = toastItem.prevPrice;
      if (prev.gpuId === toastItem.productId) updated.gpuPrice = toastItem.prevPrice;
      return updated;
    });

    // Revert the active line items unitPrice in QuoteBuilder draft
    setAddedItems(prev => prev.map(item => {
      if (item.productId === toastItem.productId) {
        return {
          ...item,
          unitPrice: toastItem.prevPrice,
          totalPrice: item.qty * toastItem.prevPrice
        };
      }
      return item;
    }));

    // Update toast status to show Undo success
    setToast(prev => ({
      ...prev,
      isUndone: true
    }));
  };

  // Toast Auto-Dismiss Lifecycle
  useEffect(() => {
    if (!toast) return;
    const duration = toast.isUndone ? 3000 : 7000;
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAddCustomLineItem = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const desc = fd.get("description");
    const qty = parseInt(fd.get("qty")) || 1;
    const price = parseFloat(fd.get("price")) || 0;

    if (!desc.trim()) return;

    const payload = {
      id: `custom-line-${Date.now()}`,
      productId: "custom-write-in",
      description: desc,
      qty,
      unitPrice: price,
      totalPrice: price * qty
    };

    setAddedItems([...addedItems, payload]);
    e.target.reset();
  };

  const handleSelectProductItem = (id) => {
    if (!id) return;
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    // Check if already added
    const existsIdx = addedItems.findIndex(item => item.productId === id);
    if (existsIdx > -1) {
      const updated = [...addedItems];
      updated[existsIdx].qty += 1;
      updated[existsIdx].totalPrice = updated[existsIdx].qty * updated[existsIdx].unitPrice;
      setAddedItems(updated);
    } else {
      const payload = {
        id: `item-${Date.now()}`,
        productId: prod.id,
        description: prod.name,
        qty: 1,
        unitPrice: prod.price,
        gstRate: prod.gst || 18,
        totalPrice: prod.price
      };
      setAddedItems([...addedItems, payload]);
    }
    setSelectedProductId("");
    setStandardSearch("");
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
    if (window.confirm("Clear all quotation draft fields?")) {
      setSelectedCustomerId("");
      setCustomerSearchQuery("");
      setAddedItems([]);
      setDiscountValue(0);
      setPcConfig({
        cpuId: "", cpuPrice: 0, cpuCustomName: "",
        mbId: "", mbPrice: 0, mbCustomName: "",
        ramId: "", ramPrice: 0, ramQty: 2, ramCustomName: "",
        ssd1Id: "", ssd1Price: 0, ssd1CustomName: "",
        ssd2Id: "", ssd2Price: 0, ssd2CustomName: "",
        cabId: "", cabPrice: 0, cabCustomName: "",
        smpsId: "", smpsPrice: 0, smpsCustomName: "",
        lqId: "", lqPrice: 0, lqCustomName: "",
        gpuId: "", gpuPrice: 0, gpuQty: 2, gpuCustomName: ""
      });
      
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
    }
  };

  const handleFinalSaveQuotation = (statusValue) => {
    if (!selectedCustomerId) {
      alert("Please select a customer for this quotation.");
      return;
    }
    if (addedItems.length === 0) {
      alert("Quotation must have at least one line item.");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    
    // Consistent inclusive calculation matching seed data and showroom terms
    const grandTotalBeforeDiscount = addedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const rawSubtotal = addedItems.reduce((acc, item) => {
      const rate = item.gstRate || 18;
      return acc + (item.totalPrice / (1 + rate / 100));
    }, 0);
    const subtotal = Math.round(rawSubtotal);
    const gstTotal = Math.round(grandTotalBeforeDiscount - rawSubtotal);
    const grandTotal = Math.max(0, grandTotalBeforeDiscount - discountValue);

    const quotationPayload = {
      id: editingQuotationDraft?.id || `q-${Date.now()}`,
      quotationNumber: quoteNumber,
      customerId: selectedCustomerId,
      customerName: customer ? customer.name : "Unknown",
      date: quoteDate,
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

    onSaveQuotation(" quotation", quotationPayload);
    
    // Clear and go to history
    if (editingQuotationDraft) {
      clearEditingDraft();
    }
    setSelectedCustomerId("");
    setCustomerSearchQuery("");
    setAddedItems([]);
    setDiscountValue(0);
    setActiveTab("history");
  };

  const handleInlineCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;

    const saved = onSaveQuotation("customer_inline", newCustomerForm);
    if (saved) {
      setSelectedCustomerId(saved.id);
      setCustomerSearchQuery(`${saved.name} (${saved.phone || "No Phone"})`);
      setShowCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", address: "", gst: "" });
    }
  };

  const handleAddStandardProduct = () => {
    if (!selectedProductId) {
      alert("Please select a product first.");
      return;
    }
    handleSelectProductItem(selectedProductId);
  };

  const handleAddWriteIn = () => {
    const desc = customWriteIn.description;
    const specs = customWriteIn.specs || "";
    const qty = parseInt(customWriteIn.qty) || 1;
    const price = parseFloat(customWriteIn.price) || 0;
    const gstRate = parseInt(customWriteIn.gst) || 18;

    if (!desc.trim()) {
      alert("Please enter a description for the custom item.");
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

          {/* Section 2: Custom PC presets engine */}
          <div className="glass-card rounded-2xl overflow-hidden bg-white border border-slate-200">
            <button
              type="button"
              onClick={() => setShowPcBuilder(!showPcBuilder)}
              className="w-full p-5 flex items-center justify-between text-left font-extrabold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Cpu className="h-4.5 w-4.5 text-brand-blue-dark" />
                <span>Custom PC Builder Tool</span>
              </span>
              {showPcBuilder ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
            </button>

            {showPcBuilder && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-4">
                <div className="p-3 bg-brand-blue-dark/5 border border-brand-blue-dark/10 rounded-xl text-[10px] text-brand-blue-dark leading-relaxed mb-2 font-semibold">
                  Configure custom hardware specs. Price feeds are pulled from inventory catalog. Custom components or prices can be entered manually by selecting "Custom Write-In".
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-700">
                  {/* CPU Searchable autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="CPU Processor" 
                      placeholder="-- Select CPU --" 
                      list={cpuList} 
                      selectedValue={pcConfig.cpuId} 
                      onSelect={(id) => handlePcComponentChange("cpu", id)}
                    />
                    
                    {pcConfig.cpuId !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.cpuId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.cpuCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, cpuCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.cpuPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, cpuPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("cpu", pcConfig.cpuId, pcConfig.cpuPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.cpuId, pcConfig.cpuPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Motherboard Searchable Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="Motherboard" 
                      placeholder="-- Select Board --" 
                      list={mbList} 
                      selectedValue={pcConfig.mbId} 
                      onSelect={(id) => handlePcComponentChange("mb", id)}
                    />
                    
                    {pcConfig.mbId !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.mbId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.mbCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, mbCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.mbPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, mbPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("mb", pcConfig.mbId, pcConfig.mbPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.mbId, pcConfig.mbPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RAM Searchable Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="RAM Memory" 
                      placeholder="-- Select RAM --" 
                      list={ramList} 
                      selectedValue={pcConfig.ramId} 
                      onSelect={(id) => handlePcComponentChange("ram", id)}
                    />
                    
                    {pcConfig.ramId !== "" && (
                      <div className="flex space-x-2 items-center animate-fadeIn mt-2">
                        {pcConfig.ramId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.ramCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, ramCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        
                        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Qty</span>
                          <input 
                            type="number" value={pcConfig.ramQty}
                            onChange={(e) => setPcConfig({...pcConfig, ramQty: parseInt(e.target.value) || 1})}
                            className="bg-transparent text-xs w-8 text-center font-bold text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.ramPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, ramPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("ram", pcConfig.ramId, pcConfig.ramPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.ramId, pcConfig.ramPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Storage Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="Primary Storage (SSD)" 
                      placeholder="-- Select Storage --" 
                      list={ssdList} 
                      selectedValue={pcConfig.ssd1Id} 
                      onSelect={(id) => handlePcComponentChange("ssd1", id)}
                    />
                    
                    {pcConfig.ssd1Id !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.ssd1Id === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.ssd1CustomName}
                            onChange={(e) => setPcConfig({...pcConfig, ssd1CustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.ssd1Price || ""}
                              onChange={(e) => setPcConfig({...pcConfig, ssd1Price: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("ssd1", pcConfig.ssd1Id, pcConfig.ssd1Price) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.ssd1Id, pcConfig.ssd1Price)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary Storage Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="Secondary Storage (Optional)" 
                      placeholder="-- Select Secondary --" 
                      list={ssdList} 
                      selectedValue={pcConfig.ssd2Id} 
                      onSelect={(id) => handlePcComponentChange("ssd2", id)}
                    />
                    
                    {pcConfig.ssd2Id !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.ssd2Id === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.ssd2CustomName}
                            onChange={(e) => setPcConfig({...pcConfig, ssd2CustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.ssd2Price || ""}
                              onChange={(e) => setPcConfig({...pcConfig, ssd2Price: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("ssd2", pcConfig.ssd2Id, pcConfig.ssd2Price) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.ssd2Id, pcConfig.ssd2Price)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PC Cabinet Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="PC Cabinet" 
                      placeholder="-- Select Cabinet --" 
                      list={cabList} 
                      selectedValue={pcConfig.cabId} 
                      onSelect={(id) => handlePcComponentChange("cab", id)}
                    />
                    
                    {pcConfig.cabId !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.cabId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.cabCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, cabCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.cabPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, cabPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("cab", pcConfig.cabId, pcConfig.cabPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.cabId, pcConfig.cabPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SMPS Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="SMPS Power Supply" 
                      placeholder="-- Select SMPS --" 
                      list={smpsList} 
                      selectedValue={pcConfig.smpsId} 
                      onSelect={(id) => handlePcComponentChange("smps", id)}
                    />
                    
                    {pcConfig.smpsId !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.smpsId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.smpsCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, smpsCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.smpsPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, smpsPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("smps", pcConfig.smpsId, pcConfig.smpsPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.smpsId, pcConfig.smpsPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liquid Cooler Autocomplete */}
                  <div className="space-y-1.5">
                    <SearchableDropdown 
                      label="Liquid / LQ Cooler" 
                      placeholder="-- Select Cooler --" 
                      list={lqList} 
                      selectedValue={pcConfig.lqId} 
                      onSelect={(id) => handlePcComponentChange("lq", id)}
                    />
                    
                    {pcConfig.lqId !== "" && (
                      <div className="flex space-x-2 animate-fadeIn mt-2">
                        {pcConfig.lqId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.lqCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, lqCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.lqPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, lqPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("lq", pcConfig.lqId, pcConfig.lqPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.lqId, pcConfig.lqPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GPU Autocomplete */}
                  <div className="md:col-span-2 space-y-1.5">
                    <SearchableDropdown 
                      label="Graphics / GPU Unit" 
                      placeholder="-- Select Graphics --" 
                      list={gpuList} 
                      selectedValue={pcConfig.gpuId} 
                      onSelect={(id) => handlePcComponentChange("gpu", id)}
                    />
                    
                    {pcConfig.gpuId !== "" && (
                      <div className="flex space-x-2 items-center animate-fadeIn mt-2">
                        {pcConfig.gpuId === "custom" && (
                          <input 
                            type="text" placeholder="Custom Spec Title" value={pcConfig.gpuCustomName}
                            onChange={(e) => setPcConfig({...pcConfig, gpuCustomName: e.target.value})}
                            className="glass-input px-3 py-2 rounded-xl text-xs flex-1 animate-fadeIn"
                          />
                        )}
                        
                        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Qty</span>
                          <input 
                            type="number" value={pcConfig.gpuQty}
                            onChange={(e) => setPcConfig({...pcConfig, gpuQty: parseInt(e.target.value) || 1})}
                            className="bg-transparent text-xs w-8 text-center font-bold text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">INR</span>
                            <input 
                              type="number" placeholder="Price" value={pcConfig.gpuPrice || ""}
                              onChange={(e) => setPcConfig({...pcConfig, gpuPrice: parseFloat(e.target.value) || 0})}
                              className="glass-input pl-10 pr-3 py-2 rounded-xl text-xs w-full text-right font-bold focus:border-brand-blue-dark"
                            />
                          </div>
                          {isComponentPriceOverridden("gpu", pcConfig.gpuId, pcConfig.gpuPrice) && (
                            <button
                              type="button"
                              onClick={() => handleSaveComponentPriceToCatalog(pcConfig.gpuId, pcConfig.gpuPrice)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                              title="Update Master Catalog Price"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleCompileCustomPc}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold py-2.5 rounded-xl shadow-md text-xs mt-3 cursor-pointer"
                >
                  <Cpu className="h-4 w-4" />
                  <span>Compile & Package Custom PC Build</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Add Items Control Panel (Inventory select vs Custom write-in) */}
          <div className="glass-card rounded-2xl p-5 space-y-4 bg-white border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3 uppercase tracking-wider text-[11px]">
              <ShoppingBag className="h-4.5 w-4.5 text-brand-blue-dark" />
              <span>Add Items to Quotation</span>
            </h3>

            {/* Split layout: Catalog search (Left), Custom Write-in (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product catalog picker */}
              <div className="space-y-3.5 border-r border-slate-150 pr-0 md:pr-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Search Store Catalog</h4>
                  
                  {/* Search text input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type brand or item title..." 
                      value={standardSearch}
                      onChange={(e) => setStandardSearch(e.target.value)}
                      className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full"
                    />
                    
                    {/* searched popup catalog drop list */}
                    {searchedProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {searchedProducts.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setStandardSearch(p.name);
                            }}
                            className="p-2.5 text-[11px] text-slate-700 hover:text-slate-950 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="truncate pr-2 font-medium">{p.name}</span>
                            <span className="font-bold text-slate-500 shrink-0">{formatCurrency(p.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full font-bold"
                  >
                    <option value="">-- Selected Product --</option>
                    {products.filter(p => !p.category.includes("Processors") && !p.category.includes("Motherboards")).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                  
                  <button 
                    type="button"
                    onClick={handleAddStandardProduct}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-semibold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Catalog Product
                  </button>
                </div>
              </div>

              {/* Custom item write-in */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Write-In Line Item</h4>
                
                <input 
                  type="text" 
                  placeholder="Item Name (e.g. HP Pavilion Laptop)" 
                  value={customWriteIn.description}
                  onChange={(e) => setCustomWriteIn({...customWriteIn, description: e.target.value})}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs w-full font-bold"
                />

                <textarea 
                  rows="2"
                  placeholder="Specifications / Subtext (e.g. Core i5, 16GB RAM, 512GB SSD)..." 
                  value={customWriteIn.specs || ""}
                  onChange={(e) => setCustomWriteIn({...customWriteIn, specs: e.target.value})}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full resize-none font-semibold text-slate-600"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="number" 
                    placeholder="Full Price (INR)" 
                    value={customWriteIn.price || ""}
                    onChange={(e) => setCustomWriteIn({...customWriteIn, price: e.target.value})}
                    className="glass-input px-2.5 py-2.5 rounded-xl text-xs w-full font-bold"
                  />
                  
                  <select 
                    value={customWriteIn.gst}
                    onChange={(e) => setCustomWriteIn({...customWriteIn, gst: e.target.value})}
                    className="glass-input px-1.5 py-2.5 rounded-xl text-xs w-full font-bold"
                  >
                    <option value="18">18% GST</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="28">28% GST</option>
                    <option value="0">0% GST</option>
                  </select>

                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={customWriteIn.qty}
                    onChange={(e) => setCustomWriteIn({...customWriteIn, qty: parseInt(e.target.value) || 1})}
                    className="glass-input px-1.5 py-2.5 rounded-xl text-xs w-full text-center font-bold"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleAddWriteIn}
                  className="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-semibold py-2 rounded-xl text-xs cursor-pointer animate-fadeIn"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Write-In Item
                </button>
              </div>
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
                Use the search catalog picker, write-in form, or build a custom PC to add items!
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
                          <div className="inline-flex items-center space-x-1">
                            <input 
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateUnitPrice(item.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-xs text-center w-20 text-slate-800 font-bold focus:outline-none focus:border-brand-blue-dark"
                            />
                            {isLineItemPriceOverridden(item) && (
                              <button
                                type="button"
                                onClick={() => handleSaveComponentPriceToCatalog(item.productId, item.unitPrice)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-sm shrink-0"
                                title="Update Master Catalog Price"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
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
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Mobile Phone *</label>
                <input 
                  type="tel" required placeholder="e.g. +91 9988776655"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Email Address</label>
                <input 
                  type="email" placeholder="e.g. kranthi.kumar@gmail.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">GSTIN Number (optional)</label>
                <input 
                  type="text" placeholder="e.g. 37ACHPB2370B1Z7"
                  value={newCustomerForm.gst}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, gst: e.target.value})}
                  className="glass-input px-3.5 py-2 rounded-xl text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Billing Address</label>
                <textarea 
                  rows="2" placeholder="e.g. Brodipet 4th line, Guntur"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
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
