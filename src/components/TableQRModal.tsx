import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { TableState } from "../types";
import { 
  X, 
  Printer, 
  Copy, 
  ExternalLink, 
  Check, 
  ChefHat, 
  QrCode, 
  Sparkles,
  Smartphone,
  ShieldCheck
} from "lucide-react";

interface TableQRModalProps {
  initialTableNumber?: number | "ALL" | null;
  tables?: TableState[];
  onClose: () => void;
}

export default function TableQRModal({ onClose }: TableQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [menuUrl, setMenuUrl] = useState<string>(() => {
    try {
      return localStorage.getItem("custom_qr_menu_url") || "https://koz-xezer-doner.netlify.app";
    } catch {
      return "https://koz-xezer-doner.netlify.app";
    }
  });

  const handleUrlChange = (newVal: string) => {
    setMenuUrl(newVal);
    try {
      localStorage.setItem("custom_qr_menu_url", newVal);
    } catch {}
  };

  const effectiveUrl = menuUrl.includes("?") 
    ? menuUrl 
    : `${menuUrl.replace(/\/$/, "")}/?menu=1`;

  const handleCopy = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Modal Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Modal Header - Hidden when printing */}
        <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/70 print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600/20 text-orange-500 p-2.5 rounded-2xl border border-orange-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white font-display">Masalar Üçün QR Menyu</h3>
              <p className="text-xs text-slate-400">İstənilən mobil internetlə (Azercell, Bakcell, Nar) birbaşa açılır</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-orange-950/30 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Çap Et</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Link Info Bar - Hidden when printing */}
        <div className="px-6 py-3 border-b border-slate-850 bg-slate-900/50 print:hidden flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
          <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white shrink-0">Menyu Linki:</span>
            <input
              type="text"
              value={menuUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://koz-xezer-doner.netlify.app"
              className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs px-2.5 py-1 rounded-xl focus:outline-none focus:border-orange-500 font-semibold"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                copied 
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Kopyalandı!" : "Linki Kopyala"}</span>
            </button>

            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 flex items-center space-x-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Baxış</span>
            </a>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/50 print:bg-white print:p-0 print:overflow-visible flex justify-center items-center">
          
          <div className="w-full max-w-sm print:max-w-md print:mx-auto flex justify-center">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 print:p-10 w-full max-w-sm flex flex-col items-center text-center relative shadow-xl print:bg-white print:border-2 print:border-black print:text-black print:rounded-3xl print:break-inside-avoid print:shadow-none">
              
              {/* Card Header Brand */}
              <div className="flex items-center space-x-2 text-orange-500 mb-1 print:text-black">
                <ChefHat className="w-8 h-8" />
                <span className="font-black text-lg tracking-wide uppercase font-display">
                  Köz Xəzər Dönər
                </span>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-1 rounded-full text-orange-400 font-extrabold text-xs mb-6 print:bg-gray-100 print:border-black print:text-black">
                ELEKTRON MENYU
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-5 rounded-2xl shadow-inner border-4 border-orange-500/20 print:border-black mb-6 flex items-center justify-center">
                <QRCodeSVG
                  value={effectiveUrl}
                  size={210}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <p className="font-bold text-slate-200 text-sm print:text-black flex items-center justify-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-orange-400 print:text-black" />
                  <span>Kameranızı QR koda tutun</span>
                </p>
                <p className="text-[11px] text-slate-400 print:text-gray-600 leading-normal max-w-xs">
                  Qiymətlər, şəkillər və çeşidlərlə telefonunuzda tanış olun
                </p>
              </div>

              {/* Footer note on card */}
              <div className="mt-6 pt-3 border-t border-slate-800 print:border-gray-300 w-full flex items-center justify-center space-x-1 text-[10px] text-slate-500 print:text-gray-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Xoş İstirahətlər və Nuş Olsun!</span>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400 print:hidden shrink-0">
          <span>Bu vahid QR kod istənilən mobil internetlə (4G / 5G) problemsiz açılır.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Bağla
          </button>
        </div>

      </div>
    </div>
  );
}

