// Seed Data for Sri KP Babu Computer Stationerymart Quotation Builder App

export const DEFAULT_SETTINGS = {
  storeName: "SRI KP BABU COMPUTER STATIONERYMART",
  tagline: "HP ASUS ACER AUTHORISED SHOW ROOM",
  established: "SINCE 1995",
  address: "H.O: Near Sai Baba Temple, 3/7 Brodipet, Opp. AXIS BANK, Guntur - 522 002.",
  phone: "+91 9597553232, 9951644777",
  email: "srikpbabucomputersm@gmail.com",
  gstin: "37ACHPB2370B1Z7",
  bankAccountNo: "924030067132830",
  bankIfsc: "UTIB0000070",
  bankName: "AXIS BANK, GUNTUR",
  terms: [
    "The above quoted price is Inclusive of GST 18%.",
    "100% Advance Payment on the date of Delivery.",
    "PRICE VALID FOR 4 DAYS ONLY"
  ],
  whatsappTemplate: `Hi {clientName},

Please find attached the quotation (Ref: {quotationNumber}) for the requested items/services.

👉 View Quotation: {viewLink}

Here is a quick summary of the details:

💰 Total Amount: ₹{grandTotal}/- (Inclusive of 18% GST)

📋 Payment Terms: 100% advance payment on the date of delivery.

📅 Validity: Pricing is valid for 7 days.

Our bank account details for the transfer are conveniently located at the bottom left of the attached document.

Please review the breakdown, and let me know if you would like to proceed with the order or if you have any questions!

Best regards,
KP Babu Computers

📸 Instagram: https://www.instagram.com/sri_kp_babu_computers/
🏪 Our Store: https://share.google/xlLdYEzLI2HYEzM9n`
};


export const INITIAL_PRODUCTS = [
  // High-End Components (as seen in the custom build image)
  { id: "p1", name: "AMD THREADRIPPER 9995WX Processor", sku: "CPU-TR-9995WX", brand: "AMD", category: "Processors", price: 1800000, gst: 18, stock: 3, warranty: "3 Years" },
  { id: "p2", name: "ASROCK WRX90 MotherBoard", sku: "MB-ASR-WRX90", brand: "ASRock", category: "Motherboards", price: 120000, gst: 18, stock: 5, warranty: "3 Years" },
  { id: "p3", name: "ADATA 64GB DDR5 REG ECC 5600 MHZ RAM", sku: "RAM-AD-64G-D5", brand: "ADATA", category: "RAM", price: 35000, gst: 18, stock: 24, warranty: "5 Years" },
  { id: "p4", name: "ACER PREDATOR SSD 2TB GM9 GEN5 NVME Storage", sku: "SSD-AC-PRED-2T", brand: "Acer", category: "Storage", price: 28000, gst: 18, stock: 12, warranty: "5 Years" },
  { id: "p5", name: "Adata 1TB SSD NvMe Storage", sku: "SSD-AD-1T", brand: "ADATA", category: "Storage", price: 8500, gst: 18, stock: 20, warranty: "3 Years" },
  { id: "p6", name: "THERMALTAKE VIEW51 Cabinet", sku: "CAB-TT-V51", brand: "Thermaltake", category: "Cabinets", price: 22000, gst: 18, stock: 8, warranty: "1 Year" },
  { id: "p7", name: "Toughpower GF3 1350W 80Plus Gold SMPS", sku: "PSU-TT-GF3-1350", brand: "Thermaltake", category: "SMPS", price: 25000, gst: 18, stock: 7, warranty: "10 Years" },
  { id: "p8", name: "THERMALTAKE TOUGH LIQUID 360 ARGB TRX 40 LQ Cooler", sku: "LQ-TT-TL360", brand: "Thermaltake", category: "Coolers", price: 18000, gst: 18, stock: 4, warranty: "2 Years" },
  { id: "p9", name: "Zotac 32GB RTX5090 Extreme Infinity Graphics Card", sku: "GPU-ZT-5090-32G", brand: "Zotac", category: "Graphics Cards", price: 350000, gst: 18, stock: 6, warranty: "3+2 Years" },
  
  // Standard Systems and Peripherals
  { id: "p10", name: "ASUS ROG Zephyrus G16 Laptop", sku: "LAP-AS-G16", brand: "ASUS", category: "Laptops", price: 185000, gst: 18, stock: 10, warranty: "2 Years" },
  { id: "p11", name: "HP Pavilion 24 All-in-One Desktop", sku: "DK-HP-PAV24", brand: "HP", category: "Desktops", price: 78000, gst: 18, stock: 8, warranty: "1 Year" },
  { id: "p12", name: "LG 34-Inch UltraWide IPS Monitor", sku: "MON-LG-34UW", brand: "LG", category: "Monitors", price: 38000, gst: 18, stock: 15, warranty: "3 Years" },
  { id: "p13", name: "Logitech MX Master 3S Wireless Mouse", sku: "PER-LOG-MX3S", brand: "Logitech", category: "Accessories", price: 9500, gst: 18, stock: 35, warranty: "1 Year" },
  { id: "p14", name: "HP LaserJet Pro MFP M428fdw Printer", sku: "PR-HP-M428", brand: "HP", category: "Printers", price: 42000, gst: 18, stock: 12, warranty: "1 Year" },
  { id: "p15", name: "A4 Paper Bundle (75 GSM, 500 Sheets)", sku: "ST-A4-75G", brand: "Century", category: "Accessories", price: 320, gst: 18, stock: 150, warranty: "None" }
];

export const INITIAL_CUSTOMERS = [
  { id: "c1", name: "Kranthi Kumar Garu", phone: "+91 9848523456", email: "kranthi.kumar@gmail.com", address: "Plot 42, Brodipet 4th Line, Guntur", gst: "37AAAAA1111A1Z1" },
  { id: "c2", name: "Dr. K. Srinivasa Rao", phone: "+91 9908612345", email: "srini.rao@yahoo.com", address: "Vidyaranya Residency, Lakshmipuram, Guntur", gst: "" },
  { id: "c3", name: "Sai Krishna Technologies", phone: "+91 8632233445", email: "info@saikrishnatech.com", address: "D.No 5-82-1, Kanna Vari Thota, Guntur", gst: "37BCDEF2222B2Z2" }
];

export const INITIAL_QUOTATIONS = [
  {
    id: "q-1001",
    quotationNumber: "KPB-2026-001",
    date: "2026-05-01",
    customerId: "c1",
    customerName: "Kranthi Kumar Garu",
    status: "Approved",
    items: [
      {
        id: "qi1",
        description: `Custom Build PC:\nProcessor: AMD THREADRIPPER 9995WX\nMotherBoard: ASROCK WRX90\nRAM: 2 x ADATA 64GB DDR5 REG ECC 5600 MHZ\nStorage: ACER PREDATOR SSD 2TB GM9 GEN5 NVME\nSecondary Storage: Adata 1TB SSD NvMe\nCabinet: THERMALTAKE VIEW51\nSMPS: Toughpower GF3 1350W 80Plus Gold\nLQ: THERMALTAKE TOUGH LIQUID 360 ARGB TRX 40\nGraphics: 2 x Zotac 32GB RTX5090 Extreme Infinity`,
        qty: 1,
        unitPrice: 2881356, // Inclusive of 18% GST -> 34,00,000/-
        gstRate: 18,
        totalPrice: 3400000
      }
    ],
    subtotal: 2881356,
    gstTotal: 518644,
    discount: 0,
    grandTotal: 3400000,
    terms: DEFAULT_SETTINGS.terms,
    bankDetails: {
      accountNo: DEFAULT_SETTINGS.bankAccountNo,
      ifsc: DEFAULT_SETTINGS.bankIfsc,
      bankName: DEFAULT_SETTINGS.bankName
    }
  },
  {
    id: "q-1002",
    quotationNumber: "KPB-2026-002",
    date: "2026-05-15",
    customerId: "c2",
    customerName: "Dr. K. Srinivasa Rao",
    status: "Pending",
    items: [
      {
        id: "qi2",
        description: "ASUS ROG Zephyrus G16 Laptop",
        qty: 1,
        unitPrice: 156780, // Inclusive of 18% GST -> 1,85,000
        gstRate: 18,
        totalPrice: 185000
      },
      {
        id: "qi3",
        description: "Logitech MX Master 3S Wireless Mouse",
        qty: 1,
        unitPrice: 8051, // Inclusive of 18% -> 9,500
        gstRate: 18,
        totalPrice: 9500
      }
    ],
    subtotal: 164831,
    gstTotal: 29669,
    discount: 0,
    grandTotal: 194500,
    terms: DEFAULT_SETTINGS.terms,
    bankDetails: {
      accountNo: DEFAULT_SETTINGS.bankAccountNo,
      ifsc: DEFAULT_SETTINGS.bankIfsc,
      bankName: DEFAULT_SETTINGS.bankName
    }
  },
  {
    id: "q-1003",
    quotationNumber: "KPB-2026-003",
    date: "2026-05-20",
    customerId: "c3",
    customerName: "Sai Krishna Technologies",
    status: "Expired",
    items: [
      {
        id: "qi4",
        description: "HP LaserJet Pro MFP M428fdw Printer",
        qty: 3,
        unitPrice: 35593, // Inclusive of 18% -> 42,000
        gstRate: 18,
        totalPrice: 126000
      },
      {
        id: "qi5",
        description: "A4 Paper Bundle (75 GSM, 500 Sheets)",
        qty: 10,
        unitPrice: 271, // Inclusive of 18% -> 320
        gstRate: 18,
        totalPrice: 3200
      }
    ],
    subtotal: 109491,
    gstTotal: 19709,
    discount: 1000,
    grandTotal: 128200,
    terms: DEFAULT_SETTINGS.terms,
    bankDetails: {
      accountNo: DEFAULT_SETTINGS.bankAccountNo,
      ifsc: DEFAULT_SETTINGS.bankIfsc,
      bankName: DEFAULT_SETTINGS.bankName
    }
  }
];

export const getLocalStorageData = (key, initialValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error("Error reading localStorage key:", key, error);
    return initialValue;
  }
};

export const setLocalStorageData = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing localStorage key:", key, error);
  }
};

export const initializeDatabase = () => {
  if (!window.localStorage.getItem("kpb_initialized")) {
    setLocalStorageData("kpb_settings", DEFAULT_SETTINGS);
    setLocalStorageData("kpb_products", INITIAL_PRODUCTS);
    setLocalStorageData("kpb_customers", INITIAL_CUSTOMERS);
    setLocalStorageData("kpb_quotations", INITIAL_QUOTATIONS);
    window.localStorage.setItem("kpb_initialized", "true");
    console.log("Database seeded successfully!");
  }
};
