import React from "react";
import { OrderItem, PaymentMethod } from "../types";
import { Printer, X } from "lucide-react";

declare global {
  interface Window {
    electronAPI?: {
      silentPrint: (options?: { deviceName?: string; silent?: boolean; html?: string }) => Promise<{ success: boolean; failureReason?: string }>;
      getPrinters: () => Promise<any[]>;
    };
  }
}

export function toPrinterText(text: string = ""): string {
  if (!text) return "";
  return text
    .replace(/ə/g, "e")
    .replace(/Ə/g, "E")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/I/g, "I")
    .replace(/İ/g, "I");
}

interface ReceiptPrinterProps {
  key?: React.Key;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type: "CUSTOMER" | "KITCHEN";
  orderId?: string;
  tableNumber?: number;
  orderType: string;
  items: OrderItem[];
  subtotal: number;
  paymentMethod?: PaymentMethod;
  paymentNote?: string;
  createdAt?: string;
  deliveryDetails?: {
    receiverName?: string;
    receiverPhone?: string;
    deliveryAddress?: string;
    deliveryDateTime?: string;
    cardNote?: string;
    courierName?: string;
  };
}

export default function ReceiptPrinter({
  isOpen,
  onClose,
  type,
  orderId = "1",
  tableNumber,
  orderType,
  items,
  subtotal,
  paymentMethod = PaymentMethod.Cash,
  paymentNote,
  createdAt,
  deliveryDetails
}: ReceiptPrinterProps) {
  const hasPrintedRef = React.useRef(false);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!isOpen || hasPrintedRef.current) return;

    hasPrintedRef.current = true;
    let isMounted = true;

    const printTimer = setTimeout(async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.silentPrint === "function") {
          const el = document.getElementById("thermal-print-wrapper");
          const html = el ? el.outerHTML : "";
          
          // Determine target printer based on receipt type
          const targetPrinterName = type === "KITCHEN"
            ? (localStorage.getItem("kitchen_printer") || undefined)
            : (localStorage.getItem("cashier_printer") || undefined);

          await window.electronAPI.silentPrint({ 
            silent: true, 
            html, 
            deviceName: targetPrinterName || undefined 
          });
        } else {
          window.print();
        }
      } catch (e) {
        console.error("Silent print error:", e);
      }

      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            onCloseRef.current();
          }
        }, 500);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(printTimer);
    };
  }, [isOpen, type]);

  if (!isOpen) return null;

  const dateStr = createdAt 
    ? new Date(createdAt).toLocaleString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) 
    : new Date().toLocaleString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    [PaymentMethod.Cash]: "NAĞD",
    [PaymentMethod.PosTerminal]: "KART",
    [PaymentMethod.Card]: "KART",
    [PaymentMethod.Wolt]: "WOLT",
    [PaymentMethod.Bolt]: "BOLT",
    [PaymentMethod.Yango]: "YANGO",
    [PaymentMethod.CardTransfer]: "KÖÇÜRMƏ",
    [PaymentMethod.M10]: "m10"
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full">
        
        {/* Modal Header - Hidden on Print */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-orange-500" />
            <h3 className="text-white font-bold text-xs">
              {type === "KITCHEN" ? "👨‍🍳 Mətbəx Çeki" : "🧾 Müştəri Satış Qəbzi"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Container Preview */}
        <div className="p-4 bg-slate-800/80 flex-1 overflow-y-auto flex justify-center print:bg-white print:p-0 print:overflow-visible">
          
          {/* COMPACT 68MM THERMAL RECEIPT CONTAINER */}
          <div 
            id="thermal-print-wrapper"
            className="w-[280px] bg-white text-black px-2 py-3 font-mono text-[11px] leading-tight shadow-xl print:shadow-none print:p-0 print:w-[68mm]"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              color: "#000000",
              backgroundColor: "#ffffff",
              width: "68mm",
              maxWidth: "68mm",
              margin: "0 auto"
            }}
          >
            {/* -------------------------------------------------------------
                A. KITCHEN TICKET FORMAT
                ------------------------------------------------------------- */}
            {type === "KITCHEN" ? (
              <div className="space-y-3 text-black pb-8">
                <div className="text-center border-b-2 border-black pb-2">
                  <span className="text-[11px] font-black tracking-widest uppercase block">
                    *** METBEX SIFARISI ***
                  </span>
                  <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-1">
                    {tableNumber ? `MASA #${tableNumber}` : toPrinterText(orderType).toUpperCase()}
                  </h1>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold border-b border-black border-dashed pb-1">
                  <span>Qebz: #{orderId}</span>
                  <span>{dateStr}</span>
                </div>

                {deliveryDetails && (deliveryDetails.receiverName || deliveryDetails.deliveryAddress || deliveryDetails.courierName) && (
                  <div className="bg-neutral-100 p-1.5 border border-black text-[9.5px] space-y-0.5 font-bold">
                    <div className="text-[10px] font-black uppercase border-b border-black pb-0.5 mb-0.5 flex justify-between items-center">
                      <span>*** CATDIRILMA ***</span>
                      {deliveryDetails.courierName && (
                        <span className="text-[9px] font-bold">Kuryer: {toPrinterText(deliveryDetails.courierName)}</span>
                      )}
                    </div>
                    {deliveryDetails.receiverName && <div>Musteri: {toPrinterText(deliveryDetails.receiverName)}</div>}
                    {deliveryDetails.receiverPhone && <div>Tel: {deliveryDetails.receiverPhone}</div>}
                    {deliveryDetails.deliveryAddress && <div>Unvan: {toPrinterText(deliveryDetails.deliveryAddress)}</div>}
                  </div>
                )}

                {/* Items Table - Name on Left, Quantity directly on Right */}
                <table className="w-full border-collapse">
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-black border-dashed">
                        <td className="py-1.5 pr-2 align-top text-left">
                          <span className="font-black text-sm uppercase leading-tight block">
                            {toPrinterText(item.name)}
                          </span>
                          {item.removedIngredients && item.removedIngredients.length > 0 && (
                            <span className="text-[10px] font-bold text-black block mt-0.5">
                              ⚠️ {item.removedIngredients.map(i => `-${toPrinterText(i).toUpperCase()}SUZ`).join(", ")}
                            </span>
                          )}
                          {item.itemNote && (
                            <span className="text-[10px] font-black text-black bg-neutral-100 p-1 border border-black block mt-0.5">
                              💬 QEYD: {toPrinterText(item.itemNote).toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pl-1 align-top text-right whitespace-nowrap">
                          <span className="font-black text-sm border-2 border-black px-1.5 py-0.5 rounded inline-block">
                            {item.quantity} EDED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-center border-t-2 border-black pt-1.5 text-[10px] font-black uppercase">
                  *** KOZ XEZER DONER METBEX ***
                </div>

                {/* Feed whitespace so ticket is fully pushed out of printer blade */}
                <div className="pt-8 text-center text-[8px] text-neutral-400">
                  .
                </div>
              </div>
            ) : (
              /* -------------------------------------------------------------
                 B. CUSTOMER SALES RECEIPT
                 ------------------------------------------------------------- */
              <div className="space-y-2 text-black">
                <div className="text-center border-b-2 border-black pb-1.5">
                  <h1 className="text-base font-black uppercase tracking-wider">
                    KOZ XEZER DONER
                  </h1>
                  <p className="text-[10px] font-bold">DONER & FAST FOOD</p>
                  <p className="text-[10px] font-bold">Tel: +994 10 414 00 03</p>
                </div>

                <div className="text-[10px] space-y-0.5 border-b border-black border-dashed pb-1 font-bold">
                  <div className="flex justify-between">
                    <span>Qebz: #{orderId}</span>
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Xidmet: {toPrinterText(orderType)} {tableNumber ? `(Masa ${tableNumber})` : ""}</span>
                    <span>Odenis: {toPrinterText(paymentMethodLabels[paymentMethod]) || "NAGD"}</span>
                  </div>
                  {paymentNote && (
                    <div className="text-[9px]">
                      Qeyd: {toPrinterText(paymentNote)}
                    </div>
                  )}
                </div>

                {/* Delivery & Courier Details on Customer Sales Receipt */}
                {deliveryDetails && (deliveryDetails.receiverName || deliveryDetails.deliveryAddress || deliveryDetails.courierName) && (
                  <div className="bg-neutral-100 p-1.5 border border-black text-[9.5px] space-y-0.5 font-bold my-1 leading-tight">
                    <div className="text-[10px] font-black uppercase border-b border-black pb-0.5 mb-0.5 flex justify-between items-center">
                      <span>🛵 CATDIRILMA</span>
                      {deliveryDetails.courierName && (
                        <span className="text-[9px] font-black">
                          Kuryer: {toPrinterText(deliveryDetails.courierName)}
                        </span>
                      )}
                    </div>
                    {deliveryDetails.receiverName && (
                      <div className="flex justify-between">
                        <span>Musteri:</span>
                        <span className="font-black">{toPrinterText(deliveryDetails.receiverName)}</span>
                      </div>
                    )}
                    {deliveryDetails.receiverPhone && (
                      <div className="flex justify-between">
                        <span>Telefon:</span>
                        <span className="font-mono font-black">{deliveryDetails.receiverPhone}</span>
                      </div>
                    )}
                    {deliveryDetails.deliveryAddress && (
                      <div className="pt-0.5 border-t border-neutral-300">
                        <span className="text-neutral-700 block text-[8.5px]">Unvan:</span>
                        <span className="font-black block leading-tight">{toPrinterText(deliveryDetails.deliveryAddress)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between text-[10px] font-black border-b border-black pb-0.5">
                    <span className="w-[44%]">MEHSUL</span>
                    <span className="w-[16%] text-center">SAY</span>
                    <span className="w-[20%] text-right">QIYM</span>
                    <span className="w-[20%] text-right">CEM</span>
                  </div>

                  <div className="space-y-1 border-b border-black border-dashed pb-1.5">
                    {items.map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div key={idx} className="text-[10px] font-bold">
                          <div className="flex justify-between items-start">
                            <span className="w-[44%] pr-0.5 leading-tight">{toPrinterText(item.name)}</span>
                            <span className="w-[16%] text-center">x{item.quantity}</span>
                            <span className="w-[20%] text-right">{item.price.toFixed(2)}</span>
                            <span className="w-[20%] text-right font-black">{itemTotal.toFixed(2)}</span>
                          </div>

                          {item.removedIngredients && item.removedIngredients.length > 0 && (
                            <div className="text-[8px] text-neutral-700 pl-1">
                              (-{item.removedIngredients.map(i => `${toPrinterText(i)}suz`).join(", ")})
                            </div>
                          )}

                          {item.itemNote && (
                            <div className="text-[8.5px] text-neutral-800 font-bold pl-1 italic">
                              (Qeyd: {toPrinterText(item.itemNote)})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Box */}
                <div className="border border-black p-1.5 text-center bg-neutral-50 space-y-0.5">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span>CEMI MEBLEG:</span>
                    <span className="text-sm font-black">{subtotal.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex justify-between text-[9px] border-t border-neutral-300 pt-0.5 font-bold">
                    <span>EDV (0%):</span>
                    <span>0.00 AZN</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center border-t border-black border-dashed pt-1.5 text-[9px] font-bold">
                  <p className="uppercase">TESEKKUR EDIRIK!</p>
                  <p className="text-[8px]">YENE GOZLEYIRIK. NUS OLSUN!</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Bar - Hidden on Print */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Bağla
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-950/30 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Çap Et</span>
          </button>
        </div>

      </div>
    </div>
  );
}
