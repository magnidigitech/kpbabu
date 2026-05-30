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


export const INITIAL_PRODUCTS = [];
export const INITIAL_CUSTOMERS = [];
export const INITIAL_QUOTATIONS = [];

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
