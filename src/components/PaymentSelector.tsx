import React, { useState, useEffect } from "react";
import { PaymentMethod } from "../types";
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  ArrowRightLeft, 
  Check, 
  Flame, 
  Truck, 
  PhoneCall, 
  Hash, 
  Building2 
} from "lucide-react";

interface PaymentSelectorProps {
  value: PaymentMethod;
  note?: string;
  onChange: (method: PaymentMethod, note?: string) => void;
  theme?: "dark" | "light";
  className?: string;
}

type MainCategory = "CASH" | "POS" | "APPS" | "TRANSFER";

export default function PaymentSelector({
  value,
  note = "",
  onChange,
  theme = "dark",
  className = ""
}: PaymentSelectorProps) {
  // Determine initial main category based on value
  const getMainCategory = (method: PaymentMethod): MainCategory => {
    if (method === PaymentMethod.Cash) return "CASH";
    if (method === PaymentMethod.PosTerminal || method === PaymentMethod.Card) return "POS";
    if (method === PaymentMethod.Wolt || method === PaymentMethod.Bolt || method === PaymentMethod.Yango) return "APPS";
    if (method === PaymentMethod.CardTransfer || method === PaymentMethod.M10) return "TRANSFER";
    return "CASH";
  };

  const [activeCategory, setActiveCategory] = useState<MainCategory>(() => getMainCategory(value));
  const [paymentNote, setPaymentNote] = useState<string>(note || "");

  // Synchronize when value changes externally
  useEffect(() => {
    setActiveCategory(getMainCategory(value));
  }, [value]);

  useEffect(() => {
    setPaymentNote(note || "");
  }, [note]);

  const handleSelectCategory = (cat: MainCategory) => {
    setActiveCategory(cat);
    if (cat === "CASH") {
      onChange(PaymentMethod.Cash, "");
    } else if (cat === "POS") {
      onChange(PaymentMethod.PosTerminal, "");
    } else if (cat === "APPS") {
      // Default to Wolt or keep existing app method
      const currentApp = (value === PaymentMethod.Bolt || value === PaymentMethod.Yango) ? value : PaymentMethod.Wolt;
      onChange(currentApp, "");
    } else if (cat === "TRANSFER") {
      // Default to CardTransfer or keep existing transfer method
      const currentTransfer = (value === PaymentMethod.M10) ? PaymentMethod.M10 : PaymentMethod.CardTransfer;
      onChange(currentTransfer, paymentNote);
    }
  };

  const handleSelectApp = (appMethod: PaymentMethod.Wolt | PaymentMethod.Bolt | PaymentMethod.Yango) => {
    onChange(appMethod, "");
  };

  const handleSelectTransferType = (transferMethod: PaymentMethod.CardTransfer | PaymentMethod.M10) => {
    onChange(transferMethod, paymentNote);
  };

  const handleNoteChange = (text: string) => {
    setPaymentNote(text);
    onChange(value, text);
  };

  const isDark = theme === "dark";

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Ödəniş Qaydası (Yerində)
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isDark ? "bg-slate-800 text-indigo-300" : "bg-slate-100 text-slate-700"
        }`}>
          {value === PaymentMethod.Cash && "Nağd"}
          {(value === PaymentMethod.PosTerminal || value === PaymentMethod.Card) && "POS Terminal"}
          {value === PaymentMethod.Wolt && "Wolt"}
          {value === PaymentMethod.Bolt && "Bolt Food"}
          {value === PaymentMethod.Yango && "Yango"}
          {value === PaymentMethod.CardTransfer && "Debet Kart Köçürməsi"}
          {value === PaymentMethod.M10 && "m10 ilə Ödəniş"}
        </span>
      </div>

      {/* 4 Main Payment Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        
        {/* 1. NAĞD */}
        <button
          type="button"
          onClick={() => handleSelectCategory("CASH")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer border ${
            activeCategory === "CASH"
              ? isDark 
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-sm" 
                : "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
              : isDark
                ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span className="text-[11px] leading-tight">Nağd</span>
        </button>

        {/* 2. POS TERMINAL */}
        <button
          type="button"
          onClick={() => handleSelectCategory("POS")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer border ${
            activeCategory === "POS"
              ? isDark 
                ? "bg-blue-600/20 text-blue-400 border-blue-500 shadow-sm" 
                : "bg-blue-50 text-blue-700 border-blue-500 shadow-sm ring-1 ring-blue-500"
              : isDark
                ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[11px] leading-tight">POS Terminal</span>
        </button>

        {/* 3. WOLT / BOLT / YANGO */}
        <button
          type="button"
          onClick={() => handleSelectCategory("APPS")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer border ${
            activeCategory === "APPS"
              ? isDark 
                ? "bg-cyan-600/20 text-cyan-400 border-cyan-500 shadow-sm" 
                : "bg-cyan-50 text-cyan-700 border-cyan-500 shadow-sm ring-1 ring-cyan-500"
              : isDark
                ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="text-[11px] leading-tight">Wolt / Bolt / Yango</span>
        </button>

        {/* 4. DEBET KART / m10 */}
        <button
          type="button"
          onClick={() => handleSelectCategory("TRANSFER")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer border ${
            activeCategory === "TRANSFER"
              ? isDark 
                ? "bg-purple-600/20 text-purple-400 border-purple-500 shadow-sm" 
                : "bg-purple-50 text-purple-700 border-purple-500 shadow-sm ring-1 ring-purple-500"
              : isDark
                ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span className="text-[11px] leading-tight">Debet Kart / m10</span>
        </button>

      </div>

      {/* SUB-SECTION: Wolt / Bolt / Yango Specific Chooser */}
      {activeCategory === "APPS" && (
        <div className={`p-2.5 rounded-xl border animate-fadeIn space-y-2 ${
          isDark ? "bg-slate-900/90 border-cyan-900/50" : "bg-cyan-50/60 border-cyan-200"
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-cyan-400" : "text-cyan-800"}`}>
            🛵 Çatdırılma Tətbiqi Seçin:
          </span>
          <div className="grid grid-cols-3 gap-2">
            
            {/* Wolt */}
            <button
              type="button"
              onClick={() => handleSelectApp(PaymentMethod.Wolt)}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                value === PaymentMethod.Wolt
                  ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-950/30 font-black"
                  : isDark 
                    ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Wolt</span>
              {value === PaymentMethod.Wolt && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Bolt Food */}
            <button
              type="button"
              onClick={() => handleSelectApp(PaymentMethod.Bolt)}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                value === PaymentMethod.Bolt
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950/30 font-black"
                  : isDark 
                    ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Bolt Food</span>
              {value === PaymentMethod.Bolt && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Yango */}
            <button
              type="button"
              onClick={() => handleSelectApp(PaymentMethod.Yango)}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                value === PaymentMethod.Yango
                  ? "bg-red-500 text-white border-red-400 shadow-md shadow-red-950/30 font-black"
                  : isDark 
                    ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Yango</span>
              {value === PaymentMethod.Yango && <Check className="w-3.5 h-3.5" />}
            </button>

          </div>
        </div>
      )}

      {/* SUB-SECTION: Debet Kart / m10 Details and Note Input */}
      {activeCategory === "TRANSFER" && (
        <div className={`p-3 rounded-xl border animate-fadeIn space-y-2.5 ${
          isDark ? "bg-slate-900/90 border-purple-900/50" : "bg-purple-50/60 border-purple-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-purple-400" : "text-purple-800"}`}>
              💳 Köçürmə Kanalını Seçin:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectTransferType(PaymentMethod.CardTransfer)}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                value === PaymentMethod.CardTransfer
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/30"
                  : isDark 
                    ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Debet Kart Köçürməsi</span>
              {value === PaymentMethod.CardTransfer && <Check className="w-3.5 h-3.5 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectTransferType(PaymentMethod.M10)}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                value === PaymentMethod.M10
                  ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-950/30"
                  : isDark 
                    ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>m10 ilə Ödəniş</span>
              {value === PaymentMethod.M10 && <Check className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>

          {/* Note Input for Card number or phone/m10 number */}
          <div className="space-y-1.5 pt-1">
            <label className={`text-[10px] font-semibold flex items-center space-x-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              <Hash className="w-3 h-3 text-purple-400" />
              <span>{value === PaymentMethod.M10 ? "Hansı nömrəyə m10 ödənildi? (Qeyd / Nömrə)" : "Hansı nömrəli karta köçürüldü? (Qeyd / Kart nömrəsi)"}</span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={value === PaymentMethod.M10 ? "Məs: 050 123 45 67 (Kassa m10)" : "Məs: Kapital Bank *1234 və ya 4169..."}
                className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none transition-colors font-mono ${
                  isDark 
                    ? "bg-slate-950 text-white border-slate-800 focus:border-purple-500" 
                    : "bg-white text-slate-900 border-slate-200 focus:border-purple-500"
                }`}
              />
            </div>

            {/* Quick Helper Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {(value === PaymentMethod.M10 
                ? ["m10: 050-123-45-67", "m10: 055-987-65-43", "m10: 070-456-78-90"]
                : ["Kapital: *1234", "ABB: *5678", "Paşa Bank: *9012", "Leobank: *3456"]
              ).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleNoteChange(chip)}
                  className={`text-[9px] px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    isDark 
                      ? "bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700" 
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
