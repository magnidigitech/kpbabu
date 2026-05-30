import React from "react";
import { Printer } from "lucide-react";

export default function PublicQuotationView({ quotation, settings, customers = [] }) {
  if (!quotation || !settings) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white rounded-2xl p-10 shadow-xl max-w-md border border-slate-200">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-lg font-black text-slate-900 mb-2">Quotation Not Found</h1>
          <p className="text-sm text-slate-500 font-medium">
            This link may be invalid or the quotation has been removed. Please contact KP Babu Computers for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 840) {
        const factor = (window.innerWidth - 16) / 840;
        setScale(factor);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const customerDetails = customers.find(c => c.id === quotation.customerId) || {
    name: quotation.customerName,
    phone: quotation.customerPhone || "",
    email: quotation.customerEmail || "",
    address: quotation.customerAddress || "",
    gst: quotation.customerGst || ""
  };

  const formatIndianPrice = (num) => {
    const rounded = Math.round(num);
    const str = rounded.toString();
    if (str.length <= 3) return str + "/-";
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    return `${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}/-`;
  };

  const formatInvoiceDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  // Same pagination logic as QuotePreview
  const getRowWeight = (item) => {
    if (item.isDiscount) return 1.5;
    if (!item.description) return 1;
    return Math.max(1, item.description.split("\n").length);
  };

  const allItems = [...quotation.items];
  const discountRow = quotation.discount > 0 ? { isDiscount: true, totalPrice: -quotation.discount } : null;
  const tableRows = discountRow ? [...allItems, discountRow] : allItems;
  const totalWeight = tableRows.reduce((sum, item) => sum + getRowWeight(item), 0);

  const pages = [];
  if (totalWeight <= 5) {
    pages.push(tableRows);
  } else {
    let currentPage = [], currentWeight = 0, isFirst = true;
    for (let i = 0; i < tableRows.length; i++) {
      const item = tableRows[i];
      const weight = getRowWeight(item);
      const maxCapacity = isFirst ? 6 : 9;
      if (currentWeight + weight > maxCapacity && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [item];
        currentWeight = weight;
        isFirst = false;
      } else {
        currentPage.push(item);
        currentWeight += weight;
      }
    }
    if (currentPage.length > 0) pages.push(currentPage);
    if (pages.length === 1) pages.push([]);
  }
  const totalPages = pages.length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Minimal top bar — no close button, no back navigation */}
      <div className="no-print sticky top-0 z-50 w-full bg-slate-900 border-b border-white/5 shadow-xl px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: branding + ref */}
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src="/logo.jpeg"
              alt="KP Babu Computers"
              className="h-8 w-auto max-w-[80px] object-contain rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <p className="text-white font-black text-xs uppercase tracking-wider truncate">KP Babu Computers</p>
              <p className="text-slate-400 text-[10px] font-semibold truncate">
                Quotation · {quotation.quotationNumber} · {formatInvoiceDate(quotation.date)}
              </p>
            </div>
          </div>

          {/* Right: print only */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Pages */}
      <div 
        className="print-container max-w-4xl mx-auto space-y-8"
        style={scale < 1 ? {
          position: "relative",
          left: "50%",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
          width: "840px",
          minWidth: "840px",
          height: `${scale * 1188 * totalPages + (totalPages - 1) * 32 * scale}px`
        } : {}}
      >
        {pages.map((pageItems, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === totalPages - 1;
          let startNum = 0;
          for (let p = 0; p < pageIdx; p++) startNum += pages[p].length;

          return (
            <div
              key={pageIdx}
              className="print-page bg-white text-black w-full p-6 md:p-8 shadow-2xl rounded-sm border border-slate-200 font-serif leading-relaxed flex flex-col justify-between"
              style={{ fontFamily: "'Times New Roman', Times, serif", boxSizing: "border-box" }}
              data-last-page={isLastPage ? "true" : "false"}
            >
              <div>
                {/* HEADER (Side-by-side layout) */}
                {isFirstPage ? (
                  <div className="flex flex-row items-center justify-between pb-3 border-b-2 border-slate-800">
                    {/* Logo and established tag on the left */}
                    <div className="flex flex-col items-center select-none shrink-0">
                      <img 
                        src="/logo.jpeg" 
                        alt="Sri KP Babu Computers Logo" 
                        className="h-16 w-36 object-contain bg-white select-none" 
                        style={{ width: "136px", height: "60px" }} 
                      />
                      <div className="font-sans font-bold text-[8px] tracking-[4px] uppercase text-slate-600 select-none mt-1">
                        {settings.established}
                      </div>
                    </div>

                    {/* Store Details on the right */}
                    <div className="flex-1 text-right pl-6 font-sans">
                      <div className="text-blue-900 font-black tracking-wide uppercase print-text-blue leading-tight" style={{ fontSize: "18pt", fontWeight: "900" }}>
                        {settings.storeName}
                      </div>
                      <div className="font-bold text-black mt-1.5 leading-snug" style={{ fontSize: "9.5pt" }}>
                        {settings.address}
                      </div>
                      <div className="font-bold text-black mt-0.5" style={{ fontSize: "9.5pt" }}>
                        Ph: {settings.phone}
                      </div>
                      <div className="mt-1.5">
                        <span className="text-blue-800 font-extrabold border-b-2 border-blue-800 pb-0.5 tracking-wider uppercase print-text-blue" style={{ fontSize: "9.5pt" }}>
                          {settings.tagline}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pb-3 border-b border-slate-300 select-none mb-4">
                    <div className="flex items-center space-x-2">
                      <img src="/logo.jpeg" alt="Logo" className="h-8 w-16 object-contain bg-white" style={{ width: "64px", height: "32px" }} />
                      <span className="font-sans font-black text-sm uppercase tracking-wider text-blue-900 print-text-blue">{settings.storeName}</span>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-600 font-sans">
                      Quote Ref: {quotation.quotationNumber} | Date: {formatInvoiceDate(quotation.date)}
                    </div>
                  </div>
                )}

                {/* METADATA (page 1 only) */}
                {isFirstPage && (
                  <>
                    <div className="text-center text-red-600 font-extrabold tracking-[10px] uppercase mt-2 text-lg sm:text-xl print-text-red font-sans pt-3" style={{ fontSize: "17pt" }}>QUOTATION</div>
                    <div className="mt-2.5 pb-2.5 flex flex-col md:flex-row justify-between md:items-center text-[10pt] font-sans font-bold gap-2">
                      <div>GSTIN: {settings.gstin}</div>
                      <div className="text-left md:text-right">Email: <span className="text-blue-600 underline print-text-blue">{settings.email}</span></div>
                    </div>
                    <hr className="border-t-2 border-double border-slate-800" />
                    <div className="mt-4 grid grid-cols-2 gap-6 text-[10.5pt] font-sans">
                      <div className="space-y-1 font-bold">
                        <div className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider mb-1 select-none">Client Address:</div>
                        <div className="text-[11pt] text-black">To,</div>
                        <div className="text-[12pt] text-black pl-3 font-extrabold">{customerDetails.name}</div>
                        {customerDetails.phone && <div className="pl-3 font-normal text-slate-800 text-[10pt]"><span className="font-semibold text-black">Ph:</span> {customerDetails.phone}</div>}
                        {customerDetails.email && <div className="pl-3 font-normal text-slate-800 text-[10pt]"><span className="font-semibold text-black">Email:</span> {customerDetails.email}</div>}
                        {customerDetails.address && <div className="pl-3 font-normal text-slate-800 text-[10pt] leading-snug"><span className="font-semibold text-black">Address:</span> {customerDetails.address}</div>}
                        {customerDetails.gst && <div className="pl-3 font-normal text-slate-800 text-[10pt]"><span className="font-semibold text-black">GSTIN:</span> {customerDetails.gst}</div>}
                      </div>
                      <div className="text-right space-y-1.5 font-bold">
                        <div className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider mb-1 select-none">Quotation Ref:</div>
                        <div><span className="font-semibold text-slate-600">Quotation No:</span>{" "}<span className="text-black font-extrabold">{quotation.quotationNumber}</span></div>
                        <div><span className="font-semibold text-slate-600">Date:</span>{" "}<span className="text-black">{formatInvoiceDate(quotation.date)}</span></div>
                        {customerDetails.gst && <div><span className="font-semibold text-slate-600">Customer GSTIN:</span>{" "}<span className="text-black">{customerDetails.gst}</span></div>}
                      </div>
                    </div>
                    <p className="text-[10pt] font-sans text-justify mt-4 leading-normal text-slate-800">
                      Sir, With reference to your enquiry, we are giving the lowest quotation for the following mentioned Peripherals / Consumables / Stationery and etc., As follows:
                    </p>
                  </>
                )}

                {/* TABLE */}
                <div className="mt-4">
                  <table className="print-only-table w-full text-left text-[10pt]" style={{ borderCollapse: "collapse", border: "1.5px solid #555555" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid #555555" }}>
                        <th className="py-2 px-3 font-extrabold text-center uppercase font-sans border-r border-slate-700 w-12" style={{ backgroundColor: "#efefef", color: "#000000", borderRight: "1px solid #555555" }}>S.NO</th>
                        <th className="py-2 px-4 font-extrabold uppercase font-sans border-r border-slate-700" style={{ backgroundColor: "#efefef", color: "#000000", borderRight: "1px solid #555555" }}>Description</th>
                        <th className="py-2 px-3 font-extrabold text-center uppercase font-sans border-r border-slate-700 w-14" style={{ backgroundColor: "#efefef", color: "#000000", borderRight: "1px solid #555555" }}>Qty</th>
                        <th className="py-2 px-4 font-extrabold text-center uppercase font-sans w-48" style={{ backgroundColor: "#efefef", color: "#000000" }}>Total Price (Incl. GST 18%)</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans">
                      {pageItems.map((item, idx) => {
                        const sNo = startNum + idx + 1;
                        if (item.isDiscount) {
                          return (
                            <tr key="discount-row" style={{ borderBottom: "1px solid #555555" }}>
                              <td className="py-2.5 px-3 text-center border-r border-slate-600 font-bold" style={{ borderRight: "1px solid #555555" }} />
                              <td className="py-2.5 px-4 font-bold border-r border-slate-600 uppercase text-slate-700 italic" style={{ borderRight: "1px solid #555555" }}>Special Discount</td>
                              <td className="py-2.5 px-3 text-center border-r border-slate-600 font-bold" style={{ borderRight: "1px solid #555555" }}>1</td>
                              <td className="py-2.5 px-4 text-center font-bold text-red-600 print-text-red">-{formatIndianPrice(quotation.discount)}</td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={item.id} style={{ borderBottom: "1px solid #555555" }}>
                            <td className="py-2.5 px-3 text-center font-bold border-r border-slate-600 align-top" style={{ borderRight: "1px solid #555555" }}>{sNo}</td>
                            <td className="py-2.5 px-4 font-bold border-r border-slate-600 align-top whitespace-pre-line leading-relaxed text-slate-900" style={{ borderRight: "1px solid #555555" }}>{item.description}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-600 align-top font-bold" style={{ borderRight: "1px solid #555555" }}>{item.qty}</td>
                            <td className="py-2.5 px-4 text-center font-bold align-middle text-[11pt]" style={{ minWidth: "120px" }}>{formatIndianPrice(item.totalPrice)}</td>
                          </tr>
                        );
                      })}
                      {isLastPage && (
                        <tr className="font-extrabold uppercase">
                          <td className="py-3 px-3 text-center border-r border-slate-600" style={{ borderRight: "1px solid #555555" }} />
                          <td className="py-3 px-4 border-r border-slate-600 font-extrabold text-[11pt]" style={{ borderRight: "1px solid #555555" }}>GRAND TOTAL (NET BILL VALUE)</td>
                          <td className="py-3 px-3 text-center border-r border-slate-600 font-extrabold" style={{ borderRight: "1px solid #555555" }} />
                          <td className="py-3 px-4 text-center font-extrabold text-[12pt] text-blue-900 print-text-blue bg-slate-50">{formatIndianPrice(quotation.grandTotal)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="mobile-only-cards space-y-3.5">
                    {pageItems.map((item, idx) => {
                      const sNo = startNum + idx + 1;
                      if (item.isDiscount) {
                        return (
                          <div key="discount-card" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-600 flex justify-between items-center shadow-sm">
                            <span>Special Discount</span>
                            <span className="font-black text-sm">-{formatIndianPrice(quotation.discount)}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={item.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black flex items-center justify-center shrink-0">{sNo}</span>
                            <span className="font-bold text-slate-900 whitespace-pre-line text-sm leading-normal flex-1">{item.description}</span>
                          </div>
                          <hr className="border-slate-200" />
                          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold mb-0.5 uppercase tracking-wider">Quantity</span>
                              <span className="text-slate-800 font-extrabold text-xs bg-slate-200/60 px-2 py-0.5 rounded-md">{item.qty}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold mb-0.5 uppercase tracking-wider">Total (Incl. GST)</span>
                              <span className="text-slate-950 font-black text-sm bg-slate-200/40 px-2 py-0.5 rounded-md">{formatIndianPrice(item.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isLastPage && (
                      <div className="bg-brand-blue-dark/5 border border-brand-blue-dark/20 rounded-2xl p-4 flex justify-between items-center text-xs shadow-sm">
                        <span className="font-black text-brand-blue-dark uppercase tracking-wider text-[10px]">GRAND TOTAL (NET BILL VALUE)</span>
                        <span className="font-black text-brand-blue-dark text-sm bg-white px-3 py-1.5 rounded-xl border border-brand-blue-dark/15 shadow-sm">{formatIndianPrice(quotation.grandTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER TERMS + SIGNATURES (last page only) */}
                {isLastPage && (
                  <>
                    <p className="text-[10pt] font-sans text-justify mt-4 leading-normal font-semibold text-slate-800">
                      Hope our rates will match your requirement and will place the order for the same. Assuring our best services and prompt delivery at all times. Waiting for your earliest reply in this regard.
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-[9pt] border-t border-slate-350 pt-2 page-break-inside-avoid">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="font-extrabold uppercase tracking-wide text-slate-800 text-[10px] select-none">TERMS AND CONDITIONS:</div>
                          <ol className="space-y-0.5 font-bold pl-4 list-decimal leading-relaxed text-slate-900">
                            {quotation.terms.map((term, idx) => <li key={idx} className="pl-0.5">{term}</li>)}
                          </ol>
                        </div>
                        <div className="space-y-0.5 font-extrabold text-red-600 print-text-red leading-relaxed bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                          <div className="text-red-700 text-[9px] uppercase tracking-wider mb-0.5 select-none font-bold">Bank Payment Details:</div>
                          <div>Account No: {quotation.bankDetails?.accountNo || settings.bankAccountNo}</div>
                          <div>IFS Code: {quotation.bankDetails?.ifsc || settings.bankIfsc}</div>
                          <div>BANK: {quotation.bankDetails?.bankName || settings.bankName}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right py-2 relative">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800">Your faithfully,</div>
                          <div className="font-extrabold uppercase text-[10pt] text-black">For {settings.storeName}</div>
                        </div>
                        
                        {/* Absolute Overlapping Stamp and Signature */}
                        <div className="relative w-56 h-16 mt-2 select-none pointer-events-none">
                          {/* Stamp Image (positioned left-ish, slightly rotated for realism) */}
                          <img 
                            src="/STAMP.png" 
                            alt="Store Stamp" 
                            className="absolute left-4 -top-8 w-24 h-24 object-contain opacity-85" 
                            style={{ transform: "rotate(-8deg)" }}
                          />
                          {/* Signature Image (positioned right-ish, overlapping the stamp) */}
                          <img 
                            src="/Signature.png" 
                            alt="Authorized Signature" 
                            className="absolute right-6 top-2 w-28 h-12 object-contain" 
                          />
                        </div>

                        {/* Fixed signing gap — does not stretch to full column height */}
                        <div className="w-56 font-extrabold border-t border-slate-400 text-center tracking-wider text-black select-none pt-2" style={{ borderTop: "1px solid #555555" }}>
                          Authorized Signature
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* PAGE FOOTER */}
              <div className="pt-3 border-t border-slate-200 mt-auto">
                <div className="text-center font-bold text-[9pt] text-slate-500 font-sans flex items-center justify-between uppercase tracking-wider select-none">
                  <div>Quotation ID: <span className="font-black text-slate-800">{quotation.id}</span></div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-6 h-[1px] bg-slate-300 inline-block" />
                    <span>Page {pageIdx + 1} of {totalPages}</span>
                    <span className="w-6 h-[1px] bg-slate-300 inline-block" />
                  </div>
                  <div className="text-slate-400">SRI KP BABU COMPUTERS</div>
                </div>
                <div className="text-center font-extrabold text-[8pt] text-blue-900 font-sans mt-1.5 tracking-wider uppercase select-none print-text-blue">
                  HP Authorized Showroom | Custom PC Builds | Gaming Solutions
                </div>
              </div>
            </div>
          );
        })}

        {/* Secure portal footer */}
        <div className="no-print text-center text-xs text-slate-400 font-semibold pb-8 space-y-1">
          <p>🔒 This is a secure, read-only quotation link shared by KP Babu Computers.</p>
          <p>To discuss this quotation, contact us at <span className="text-brand-blue font-bold">{settings.phone}</span></p>
        </div>
      </div>
    </div>
  );
}
