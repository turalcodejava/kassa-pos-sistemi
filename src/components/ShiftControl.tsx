import React, { useState } from "react";
import { User, Shift, AppState, Supplier } from "../types";
import { 
  Play, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  History,
  ShieldCheck,
  Check,
  Banknote,
  CreditCard,
  Building2,
  UserCheck,
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface ShiftControlProps {
  currentUser: User;
  activeShift: Shift | undefined;
  state?: AppState;
  onStartShift: (startingCash: number) => Promise<void>;
  onEndShift: (
    actualCash: number,
    cashHandover?: {
      amount: number;
      recipient: string;
      supplierId?: string;
      supplierName?: string;
      note?: string;
      adminPin?: string;
    },
    posAllocation?: {
      amount: number;
      allocatedTo: string;
      supplierId?: string;
      supplierName?: string;
      note?: string;
      adminPin?: string;
    },
    adminPin?: string
  ) => Promise<void>;
  onLogout: () => void;
  isLoading: boolean;
  onBackToHub?: () => void;
  onUpdateState?: (state: AppState) => void;
}

export default function ShiftControl({
  currentUser,
  activeShift,
  state,
  onStartShift,
  onEndShift,
  onLogout,
  isLoading,
  onBackToHub,
  onUpdateState
}: ShiftControlProps) {
  const [startingCash, setStartingCash] = useState<number>(50);
  const [actualCash, setActualCash] = useState<number>(50);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [localError, setLocalError] = useState("");

  // Cash Handover states (Kassa nağd pulunun sıfırlanması)
  const [handoverRecipient, setHandoverRecipient] = useState<string>("Rəhbərlik");
  const [handoverSupplierId, setHandoverSupplierId] = useState<string>("");
  const [handoverCustomRecipient, setHandoverCustomRecipient] = useState<string>("");
  const [handoverAmount, setHandoverAmount] = useState<number>(50);
  const [handoverNote, setHandoverNote] = useState<string>("Günün kassa nağd qalığı və qazancı təhvil verildi");

  // POS Allocation states (POS terminal vəsaitinin ətə ayrılması və sıfırlanması)
  const [posAllocAmount, setPosAllocAmount] = useState<number>(0);
  const [posAllocCategory, setPosAllocCategory] = useState<string>("Ət Tədarükü (Köz Ət Təchizat)");
  const [posAllocSupplierId, setPosAllocSupplierId] = useState<string>("");
  const [posAllocNote, setPosAllocNote] = useState<string>("Ət tədarükü üçün ayrılan POS terminal vəsaiti");

  // Mandatory Admin Approval PIN for closing shift
  const [adminPin, setAdminPin] = useState<string>("");

  // Management Cash Transaction states (shift içi mədaxil/məxaric)
  const [txType, setTxType] = useState<"IN" | "OUT">("OUT");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txNote, setTxNote] = useState<string>("");
  const [txError, setTxError] = useState<string>("");
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [isTxLoading, setIsTxLoading] = useState<boolean>(false);

  // Financial Calculations for Active Shift
  const expectedCash = activeShift
    ? (activeShift.startingCash || 0) +
      (activeShift.receivedCash || 0) +
      (activeShift.managementAdded || 0) -
      (activeShift.spentCash || 0) -
      (activeShift.managementWithdrawn || 0)
    : 0;

  const posTotal = activeShift
    ? ((activeShift.receivedPosTerminal || 0) > 0 ? (activeShift.receivedPosTerminal || 0) : (activeShift.receivedCard || 0))
    : 0;

  const appsTotal = activeShift
    ? (activeShift.receivedWolt || 0) + (activeShift.receivedBolt || 0) + (activeShift.receivedYango || 0)
    : 0;

  const transferTotal = activeShift
    ? (activeShift.receivedCardTransfer || 0) + (activeShift.receivedM10 || 0)
    : 0;

  const totalShiftRevenue = activeShift
    ? (activeShift.receivedCash || 0) + posTotal + appsTotal + transferTotal
    : 0;

  const totalShiftExpenses = activeShift ? (activeShift.spentCash || 0) : 0;
  const shiftNetProfit = totalShiftRevenue - totalShiftExpenses;
  const cashDifference = actualCash - expectedCash;

  // Zero-balance computations
  const remainingCash = Math.max(0, actualCash - (Number(handoverAmount) || 0));
  const isCashZeroed = Math.abs(actualCash - (Number(handoverAmount) || 0)) < 0.01;

  const remainingPos = Math.max(0, posTotal - (Number(posAllocAmount) || 0));
  const isPosZeroed = posTotal === 0 || Math.abs(posTotal - (Number(posAllocAmount) || 0)) < 0.01;

  const isAllZeroed = isCashZeroed && isPosZeroed;

  const canCloseShift = isAllZeroed;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startingCash < 0) {
      setLocalError("İlkin kassa qalığı mənfi ola bilməz!");
      return;
    }
    setLocalError("");
    await onStartShift(startingCash);
  };

  const openEndShiftModal = () => {
    const exp = Math.max(0, expectedCash);
    setActualCash(exp);
    setHandoverAmount(exp); // Auto-zero cash drawer
    setHandoverRecipient("Rəhbərlik");
    setHandoverSupplierId("");
    setHandoverCustomRecipient("");
    setHandoverNote("Günün kassa nağd qalığı və qazancı təhvil verildi");

    // Find default meat supplier in state
    const suppliers = state?.suppliers || [];
    const meatSupplier = suppliers.find(
      s => s.name?.toLowerCase().includes("ət") || s.category?.toLowerCase().includes("ət")
    ) || suppliers[0];

    if (meatSupplier) {
      setPosAllocSupplierId(meatSupplier.id);
      setPosAllocCategory(`Ət Tədarükü (${meatSupplier.name})`);
    } else {
      setPosAllocSupplierId("");
      setPosAllocCategory("Ət Tədarükü (Köz Ət Təchizat)");
    }
    setPosAllocAmount(posTotal); // Auto-zero POS terminal
    setPosAllocNote(posTotal > 0 ? `Terminaldakı ${posTotal.toFixed(2)} AZN ətə ödənildi` : "");
    setAdminPin("");
    setLocalError("");
    setShowEndConfirm(true);
  };

  const handleEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash < 0) {
      setLocalError("Kassadakı real nəğd pul mənfi ola bilməz!");
      return;
    }

    if (!isCashZeroed) {
      setLocalError(`Kassa sıfırlanmayıb! Kassada qalan ${remainingCash.toFixed(2)} ₼ məbləğ kiməsə təhvil verilməlidir ki, qalıq 0.00 ₼ olsun.`);
      return;
    }

    if (!isPosZeroed) {
      setLocalError(`POS Terminal sıfırlanmayıb! Terminalda qalan ${remainingPos.toFixed(2)} ₼ məbləğ təyinatına (məsələn: Ət tədarükünə) ayrılmalıdır ki, qalıq 0.00 ₼ olsun.`);
      return;
    }

    const suppliers = state?.suppliers || [];
    const isHandoverSupplier = handoverRecipient === "🥩 Təchizatçı" || handoverRecipient === "Təchizatçı";
    const selectedHandoverSupplier = isHandoverSupplier 
      ? suppliers.find(s => s.id === handoverSupplierId)
      : undefined;

    if (isHandoverSupplier && !handoverSupplierId) {
      setLocalError("Zəhmət olmasa təchizatçını siyahıdan seçin!");
      return;
    }

    const finalRecipient = isHandoverSupplier
      ? (selectedHandoverSupplier ? selectedHandoverSupplier.name : "Təchizatçı")
      : (handoverRecipient === "Digər" ? handoverCustomRecipient.trim() : handoverRecipient);

    if (!finalRecipient) {
      setLocalError("Nağd pulun kimə təhvil verildiyi mütləq qeyd olunmalıdır!");
      return;
    }

    const handoverNum = Number(handoverAmount);
    const targetSupplier = suppliers.find(s => s.id === posAllocSupplierId);

    setLocalError("");

    const handoverPayload = {
      amount: handoverNum,
      recipient: finalRecipient,
      supplierId: isHandoverSupplier ? handoverSupplierId : undefined,
      supplierName: isHandoverSupplier && selectedHandoverSupplier ? selectedHandoverSupplier.name : undefined,
      note: handoverNote.trim(),
      adminPin: adminPin.trim()
    };

    const posPayload = {
      amount: posTotal > 0 ? Number(posAllocAmount) : 0,
      allocatedTo: posAllocCategory.trim(),
      supplierId: posAllocSupplierId || undefined,
      supplierName: targetSupplier ? targetSupplier.name : undefined,
      note: posAllocNote.trim(),
      adminPin: adminPin.trim()
    };

    await onEndShift(actualCash, handoverPayload, posPayload, adminPin.trim());
    setShowEndConfirm(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError("");
    setTxSuccess(false);
    const amountNum = Number(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxError("Məbləğ 0-dan böyük olmalıdır!");
      return;
    }
    setIsTxLoading(true);
    try {
      const res = await fetch("/api/shift/cash-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: txType, amount: amountNum, note: txNote })
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateState) {
          onUpdateState(data.state);
        }
        setTxAmount("");
        setTxNote("");
        setTxSuccess(true);
        setTimeout(() => setTxSuccess(false), 3000);
      } else {
        setTxError(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      setTxError("Serverlə əlaqə kəsildi");
    } finally {
      setIsTxLoading(false);
    }
  };

  // If there's an active shift belonging to someone else
  const otherCashierActive = activeShift && activeShift.userId !== currentUser.id;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6">
      
      {/* Decorative Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`${activeShift && !otherCashierActive ? "max-w-4xl" : "max-w-md"} w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10 space-y-6 transition-all duration-300`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase">İŞ NÖVBƏSİ VƏ KASSA HESABLAŞMASI</span>
            <h2 className="text-white font-black text-sm">{currentUser.name} ({currentUser.role === "ADMIN" ? "Rəhbərlik" : "Kassir"})</h2>
          </div>
          <div className="flex items-center space-x-2">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl px-3 py-1.5 transition-colors cursor-pointer border border-indigo-500/30"
              >
                Geri (Hub-a)
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıxış</span>
            </button>
          </div>
        </div>

        {otherCashierActive ? (
          /* Case 1: Someone else's shift is active */
          <div className="space-y-4 text-center">
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="w-10 h-10 text-orange-500" />
              <h3 className="font-bold text-white text-xs">Sistemdə aktiv iş növbəsi var!</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs">
                Hal-hazırda <strong>{activeShift?.userName}</strong> tərəfindən açılmış aktiv növbə mövcuddur. 
                Siz öz növbənizi başlatmaq üçün öncə o növbənin tamamlanmasını gözləməli və ya həmin istifadəçi hesabı ilə növbəni bağlamalısınız.
              </p>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Geri qayıt və digər hesaba daxil ol
            </button>
          </div>
        ) : !activeShift ? (
          /* Case 2: No active shift, start shift form */
          <form onSubmit={handleStart} className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-xs">Yeni Növbəni Başlat</h3>
              <p className="text-slate-400 text-[11px]">
                Növbəni başlatmazdan öncə kassa yeşiyindəki (kassa drawer) başlanğıc nəğd pul miqdarını qeyd edin.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İLKİN KASSA QALIĞI (₼)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold">
                  ₼
                </div>
                <input
                  type="number"
                  required
                  step={0.1}
                  min={0}
                  value={startingCash}
                  onChange={(e) => setStartingCash(Number(e.target.value))}
                  className="bg-slate-950 text-white border border-slate-800 rounded-xl py-3 pl-8 pr-4 w-full text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Bu məbləğ günün əvvəlində kassanızda olan xırdalamaq üçün ayrılmış nəğd pul fondudur (məs. 50 AZN).
              </p>
            </div>

            {localError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-[11px] rounded-xl text-center">
                {localError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/20 hover:shadow-indigo-600/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? "Növbə açılır..." : "İş Növbəsini Başlat"}</span>
            </button>
          </form>
        ) : showEndConfirm ? (
          /* Case 3B: FULL SCREEN SHIFT CLOSING & DAILY SETTLEMENT (Hesablaşma və Sıfırlanma) */
          <form onSubmit={handleEnd} className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header / Intro Banner */}
            <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-950/40 border border-red-500/20 rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>Gündəlik Hesablaşma və Növbənin Bağlanması</span>
                    <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Məcburidir</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kassa qazancını sıfırlamaq üçün nağd pulun təhvilini və POS terminal ödənişinin təyinatını (məs. Ət tədarükü) qeyd edin.
                  </p>
                </div>
              </div>

              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Cəmi Satış Dövriyyəsi</span>
                  <span className="text-sm font-black text-white font-mono">{totalShiftRevenue.toFixed(2)} ₼</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Nağd: {(activeShift.receivedCash || 0).toFixed(2)} ₼</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-blue-400 font-bold uppercase block">POS Terminal (Kart)</span>
                  <span className="text-sm font-black text-blue-400 font-mono">{posTotal.toFixed(2)} ₼</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Ayrılacaq vəsait</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-red-400 font-bold uppercase block">Kassa Xərcləri (-)</span>
                  <span className="text-sm font-black text-red-400 font-mono">{(activeShift.spentCash || 0).toFixed(2)} ₼</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Götürülən: {(activeShift.managementWithdrawn || 0).toFixed(2)} ₼</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase block">Xalis Qazanc</span>
                  <span className={`text-sm font-black font-mono ${shiftNetProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {shiftNetProfit.toFixed(2)} ₼
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Dövriyyə - Xərc</span>
                </div>
              </div>
            </div>

            {/* Step 1: Real Cash Count */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                  <h4 className="text-white font-bold text-xs">Kassada Olan Real Nağd Pulun Sayımı</h4>
                </div>
                <div className="text-[11px] text-slate-400">
                  Gözlənilən Kassa: <strong className="text-indigo-400 font-mono font-black">{expectedCash.toFixed(2)} ₼</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₼</span>
                  <input
                    type="number"
                    required
                    step={0.1}
                    min={0}
                    value={actualCash}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setActualCash(val);
                      setHandoverAmount(val); // By default update handover amount
                    }}
                    placeholder="0.00"
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 w-full text-sm font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="p-2.5 rounded-xl border text-center font-semibold text-xs">
                  {cashDifference < 0 ? (
                    <div className="text-red-400 bg-red-500/10 border border-red-500/20 py-1 px-2 rounded-lg">
                      ⚠️ Kəsir (Defisit): <span className="font-mono font-bold">{Math.abs(cashDifference).toFixed(2)} ₼</span>
                    </div>
                  ) : cashDifference > 0 ? (
                    <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1 px-2 rounded-lg">
                      ❇️ Artıq: <span className="font-mono font-bold">+{cashDifference.toFixed(2)} ₼</span>
                    </div>
                  ) : (
                    <div className="text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 py-1 px-2 rounded-lg">
                      ✅ Kassa Tamamdır (0.00 ₼)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Cash Handover to Management */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span>Nağd Pulun Təhvili (Kimə verildi?)</span>
                  </h4>
                </div>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Məcburi</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Recipient buttons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Təhvil Verilən Tərəf / Şəxs:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Rəhbərlik", "🥩 Təchizatçı", "Seyf / Müdiriyyət", "Digər"].map((rec) => (
                      <button
                        key={rec}
                        type="button"
                        onClick={() => {
                          setHandoverRecipient(rec);
                          if (rec !== "🥩 Təchizatçı") {
                            setHandoverSupplierId("");
                            if (rec === "Rəhbərlik") {
                              setHandoverNote("Günün kassa nağd qalığı və qazancı təhvil verildi");
                            } else if (rec === "Seyf / Müdiriyyət") {
                              setHandoverNote("Kassa nağd qalığı seyfə təhvil verildi");
                            }
                          }
                        }}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                          handoverRecipient === rec
                            ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {rec}
                      </button>
                    ))}
                  </div>

                  {/* Supplier Dropdown if Təchizatçı is selected */}
                  {(handoverRecipient === "🥩 Təchizatçı" || handoverRecipient === "Təchizatçı") && (
                    <div className="space-y-1.5 mt-2 bg-slate-900/90 border border-amber-500/30 p-3 rounded-xl">
                      <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Təchizatçı Seçin (Avtomatik Siyahıdan):
                      </label>
                      <select
                        value={handoverSupplierId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setHandoverSupplierId(sId);
                          const sup = (state?.suppliers || []).find(s => s.id === sId);
                          if (sup) {
                            setHandoverNote(`${sup.name} Borc Ödənişi (Nağd Kassa)`);
                          }
                        }}
                        className="bg-slate-950 text-white border border-amber-500/50 rounded-xl py-2 px-3 w-full text-xs focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
                      >
                        <option value="">-- Təchizatçı Seçin --</option>
                        {(state?.suppliers || []).map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name} ({sup.category || "Təchizatçı"}) — Borc: {(sup.debtBalance || 0).toFixed(2)} ₼
                          </option>
                        ))}
                      </select>

                      {handoverSupplierId ? (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>💡 Qaydalar:</strong> Kassa dərhal <strong>0.00 ₼</strong> olaraq sıfırlanacaq. Lakin təchizatçının borcundan <strong>ANCAQ Rəhbərlik Admin Panelində təsdiqlədikdən sonra</strong> silinəcəkdir (Gözləmədə qalacaq).
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          ℹ️ Siyahıdan təchizatçını seçin ki, ödəniş rəsmi olaraq həmin təchizatçıya bağlansın.
                        </p>
                      )}
                    </div>
                  )}

                  {handoverRecipient === "Digər" && (
                    <input
                      type="text"
                      required
                      value={handoverCustomRecipient}
                      onChange={(e) => setHandoverCustomRecipient(e.target.value)}
                      placeholder="Məs. Elnur bəy (Rəhbər) və ya Təhvil alan şəxs"
                      className="bg-slate-900 text-white border border-slate-800 rounded-xl py-2 px-3 w-full text-xs mt-2 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* Handover Amount & Quick suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Təhvil Verilən Məbləğ (₼):</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">₼</span>
                      <input
                        type="number"
                        required
                        step={0.1}
                        min={0}
                        value={handoverAmount}
                        onChange={(e) => setHandoverAmount(Number(e.target.value))}
                        className={`bg-slate-900 text-white border rounded-xl py-2 pl-7 pr-3 w-full text-xs font-mono font-bold focus:outline-none ${
                          isCashZeroed ? "border-emerald-500/50" : "border-amber-500/50"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <span className="text-[10px] text-slate-500 font-bold block">Kassa Qalığı Vəziyyəti:</span>
                    {isCashZeroed ? (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span>✅ Kassa Qalığı: 0.00 ₼</span>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">Sıfırlandı</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-red-400 text-[11px] font-bold">
                          Qalan: {remainingCash.toFixed(2)} ₼
                        </div>
                        <button
                          type="button"
                          onClick={() => setHandoverAmount(actualCash)}
                          className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow transition-all"
                        >
                          Tam Sıfırla ({actualCash.toFixed(2)} ₼)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Handover Note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qeyd / Təyinat:</label>
                  <input
                    type="text"
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    placeholder="Məs. Günlük kassa gəliri təhvil verildi"
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl py-2 px-3 w-full text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: POS Terminal Revenue Allocation (Ət Tədarükü və s.) */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>POS Terminal Qalığının Təyinatı (Ət və s. Xərclərə Ayrılması)</span>
                  </h4>
                </div>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">Məcburi</span>
              </div>

              {posTotal <= 0 ? (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
                  ℹ️ Bu növbə ərzində POS Terminal ilə qeyri-nağd ödəniş toplanmayıb (0.00 ₼).
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-slate-300">POS Terminalda Toplanan Cəmi Vəsait:</span>
                    <span className="font-mono font-black text-blue-400 text-sm">{posTotal.toFixed(2)} ₼</span>
                  </div>

                  {/* Preset Allocation suggestions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ayrılma Təyinatı:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        "Ət Tədarükü (Köz Ət Təchizat)",
                        "Çörək və Lavaş Tədarükü",
                        "Sərinləşdirici İçkilər",
                        "Kommunal / İcarə",
                        "Digər Xərc Təyinatı"
                      ].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setPosAllocCategory(cat);
                            if (cat.includes("Ət")) {
                              const sup = (state?.suppliers || []).find(s => s.name?.includes("Ət") || s.category?.includes("Ət"));
                              if (sup) setPosAllocSupplierId(sup.id);
                            } else if (cat.includes("Çörək")) {
                              const sup = (state?.suppliers || []).find(s => s.name?.includes("Çörək") || s.category?.includes("Çörək"));
                              if (sup) setPosAllocSupplierId(sup.id);
                            } else if (cat.includes("İçki")) {
                              const sup = (state?.suppliers || []).find(s => s.name?.includes("Cola") || s.category?.includes("İçki"));
                              if (sup) setPosAllocSupplierId(sup.id);
                            } else {
                              setPosAllocSupplierId("");
                            }
                          }}
                          className={`py-1.5 px-2.5 rounded-xl font-bold border transition-all text-left truncate cursor-pointer ${
                            posAllocCategory === cat
                              ? "bg-blue-500/15 border-blue-500 text-blue-300 shadow-sm"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Supplier & Amount fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Təchizatçı (Seçim):</label>
                      <select
                        value={posAllocSupplierId}
                        onChange={(e) => {
                          setPosAllocSupplierId(e.target.value);
                          const sup = (state?.suppliers || []).find(s => s.id === e.target.value);
                          if (sup) setPosAllocCategory(`${sup.name} Borc Ödənişi`);
                        }}
                        className="bg-slate-900 text-white border border-slate-800 rounded-xl py-2 px-3 w-full text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">-- Ümumi Xərc (Təchizatçı Yoxdur) --</option>
                        {(state?.suppliers || []).map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name} ({sup.category || "Təchizatçı"}) - Borc: {(sup.debtBalance || 0).toFixed(2)} ₼
                          </option>
                        ))}
                      </select>

                      {posAllocSupplierId && (
                        <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5 mt-1">
                          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>💡 Qaydalar:</strong> Terminal <strong>0.00 ₼</strong> olacaq. Lakin təchizatçının borcundan <strong>ANCAQ Rəhbərlik Admin Panelində təsdiqlədikdən sonra</strong> silinəcəkdir (Gözləmədə qalacaq).
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ayrılan Məbləğ (₼):</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">₼</span>
                        <input
                          type="number"
                          required
                          step={0.01}
                          min={0.01}
                          value={posAllocAmount}
                          onChange={(e) => setPosAllocAmount(Number(e.target.value))}
                          className={`bg-slate-900 text-white border rounded-xl py-2 pl-7 pr-3 w-full text-xs font-mono font-bold focus:outline-none ${
                            isPosZeroed ? "border-emerald-500/50" : "border-blue-500/50"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* POS Terminal Zero Status */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Terminal Qalığı Vəziyyəti:</span>
                    {isPosZeroed ? (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span>✅ Terminal Qalığı: 0.00 ₼</span>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">Sıfırlandı</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-red-400 text-[11px] font-bold">
                          Qalan: {remainingPos.toFixed(2)} ₼
                        </div>
                        <button
                          type="button"
                          onClick={() => setPosAllocAmount(posTotal)}
                          className="py-1.5 px-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black cursor-pointer shadow transition-all"
                        >
                          Tam Ətə/Xərcə Ayır ({posTotal.toFixed(2)} ₼)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* POS Allocation Note */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Təyinat Qeydi:</label>
                    <input
                      type="text"
                      value={posAllocNote}
                      onChange={(e) => setPosAllocNote(e.target.value)}
                      placeholder="Məs. Ət tədarükü üçün ayrılan POS vəsaiti"
                      className="bg-slate-900 text-white border border-slate-800 rounded-xl py-2 px-3 w-full text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Online Apps & Transfers (if any) */}
            {(appsTotal > 0 || transferTotal > 0) && (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">4</span>
                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Onlayn Tətbiqlər və Kart/M10 Köçürmələri</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {appsTotal > 0 && (
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Wolt / Bolt / Yango:</span>
                        <span className="font-bold text-white font-mono">{appsTotal.toFixed(2)} ₼</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        Şirkət Hesabına Qəbul Edildi ✔️
                      </span>
                    </div>
                  )}
                  {transferTotal > 0 && (
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kart Köçürməsi / M10:</span>
                        <span className="font-bold text-white font-mono">{transferTotal.toFixed(2)} ₼</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        Rəhbərlik Hesabına Mədaxil Edildi ✔️
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Təhvil və Ödənişlərin Rəhbərlik (Admin) Panelində Təsdiqi */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/30 space-y-2.5 shadow-lg shadow-indigo-950/20">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs flex items-center gap-2">
                    <span>Admin Panelində Təsdiq</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                      RƏHBƏRLİK PANELİNDƏ TƏSDİQLƏNƏCƏK
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Kassa və terminal sıfırlanaraq növbə bağlanır. Təhvil verilən nağd vəsait və terminaldan ayrılan ödəniş Admin Panelində <strong>"Təsdiq Gözləyən"</strong> olaraq qeyd ediləcək və Rəhbərlik tərəfindən öz panelində təsdiqlənəcəkdir.
                  </p>
                </div>
              </div>
            </div>

            {/* Zero-Balance & Status Box */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              canCloseShift 
                ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300" 
                : "bg-slate-950 border-amber-500/30 text-slate-300"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Növbə Bağlanış Vəziyyəti:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold">
                <div className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  isCashZeroed
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  <span>{isCashZeroed ? "✅" : "❌"}</span>
                  <span>Kassa Nağd: {isCashZeroed ? "0.00 ₼ (Təhvil Verildi)" : `${remainingCash.toFixed(2)} ₼ qalıb`}</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  isPosZeroed
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  <span>{isPosZeroed ? "✅" : "❌"}</span>
                  <span>Terminal: {isPosZeroed ? "0.00 ₼ (Təyinatına Ayrıldı)" : `${remainingPos.toFixed(2)} ₼ qalıb`}</span>
                </div>

                <div className="p-2 rounded-xl border flex items-center space-x-1.5 bg-indigo-500/15 border-indigo-500/30 text-indigo-300">
                  <span>⏳</span>
                  <span>Rəhbərlik Təsdiqi: Admin Panelində</span>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {localError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-[11px] rounded-xl text-center">
                {localError}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                Geri Qayıt (Hesabatı Yoxla)
              </button>
              <button
                type="submit"
                disabled={!canCloseShift || isLoading}
                className={`py-3 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 ${
                  canCloseShift
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {isLoading 
                    ? "Növbə bağlanır və təhvil verilir..." 
                    : canCloseShift 
                    ? "✅ Növbəni Bağla və Təhvil Ver (Kassa Sıfırlandı)" 
                    : !isCashZeroed
                    ? "⚠️ Kassa nağd pulu tam təhvil verilməlidir"
                    : "⚠️ Terminal vəsaiti təyinatına ayrılmalıdır"}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* Case 3A: Active shift dashboard - stats on left, management transactions on right */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: Shift Stats & End Shift Trigger */}
            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-semibold text-emerald-400">Hal-hazırda növbəniz aktivdir</p>
              </div>

              {/* Quick stats of active shift */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-850 p-4 space-y-3.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">NÖVBƏ DETALLARI</span>
                
                <div className="grid grid-cols-2 gap-3 font-medium">
                  <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-slate-500 text-[10px] block">Başlama Vaxtı</span>
                    <span className="text-slate-300 text-xs font-bold font-mono">
                      {new Date(activeShift.startTime).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-slate-500 text-[10px] block">İlkin Kassa Qalığı</span>
                    <span className="text-slate-300 text-xs font-bold font-mono">{activeShift.startingCash?.toFixed(2)} ₼</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-850 pt-3">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Satışdan Nağd Pul (+)</span>
                    <span className="font-mono text-white font-bold">{(activeShift.receivedCash || 0).toFixed(2)} ₼</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-emerald-400 font-semibold">Rəhbərlik Mədaxil (+)</span>
                    <span className="font-mono text-emerald-400 font-bold">+{(activeShift.managementAdded || 0).toFixed(2)} ₼</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-orange-400 font-semibold">Rəhbərlik Məxaric (-)</span>
                    <span className="font-mono text-orange-400 font-bold">-{(activeShift.managementWithdrawn || 0).toFixed(2)} ₼</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Xərclənən Nağd Pul (-)</span>
                    <span className="font-mono text-red-400 font-bold">{(activeShift.spentCash || 0).toFixed(2)} ₼</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-850 pt-2 font-semibold">
                    <span className="text-indigo-400">Gözlənilən Nağd Pul</span>
                    <span className="font-mono text-indigo-400 text-sm font-black">
                      {expectedCash.toFixed(2)} ₼
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-850 pt-3 text-[10px] text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">QEYRİ-NAĞD ÖDƏNİŞLƏR</span>
                  <div className="flex justify-between">
                    <span>POS Terminal (Kart):</span>
                    <span className="font-mono font-semibold text-slate-400">{posTotal.toFixed(2)} ₼</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tətbiqlər (Wolt / Bolt / Yango):</span>
                    <span className="font-mono font-semibold text-slate-400">{appsTotal.toFixed(2)} ₼</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Köçürmələr (Debet Kart / m10):</span>
                    <span className="font-mono font-semibold text-slate-400">{transferTotal.toFixed(2)} ₼</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openEndShiftModal}
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/20 hover:shadow-red-600/10 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>İş Növbəsini Bağla & Hesablaşmanı Aç</span>
                </button>
                <p className="text-center text-[10px] text-slate-500 leading-normal">
                  Növbəni bağlayarkən kassa sayımı, nağd pulun təhvili və POS ödənişinin təyinatı tələb olunacaq.
                </p>
              </div>
            </div>

            {/* Right Column: Management Transactions Form & History */}
            <div className="space-y-5 bg-slate-950/40 p-4 md:p-5 rounded-2xl border border-slate-850 text-xs">
              <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h4 className="text-white font-bold text-xs">Rəhbərlik Mədaxil / Məxaric Qeydiyyatı</h4>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("OUT")}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                      txType === "OUT"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Məxaric (Götürülən)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("IN")}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                      txType === "IN"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Mədaxil (Qoyulan)</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Məbləğ (₼)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">₼</span>
                    <input
                      type="number"
                      required
                      step={0.01}
                      min={0.01}
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-slate-950 text-white border border-slate-850 rounded-xl py-2 pl-7 pr-3 w-full text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Təyinat / Qeyd</label>
                  <input
                    type="text"
                    required
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="Məs. Rəhbər pul götürdü, Seyfdən pul qoyuldu"
                    className="bg-slate-950 text-white border border-slate-850 rounded-xl py-2 px-3 w-full text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {txError && (
                  <p className="text-red-400 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center">
                    {txError}
                  </p>
                )}

                {txSuccess && (
                  <p className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                    Əməliyyat uğurla qeydə alındı!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isTxLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-950/25 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{isTxLoading ? "Yadda saxlanılır..." : "Əməliyyatı Qeyd Et"}</span>
                </button>
              </form>

              {/* Transactions History */}
              <div className="space-y-2 border-t border-slate-850 pt-3">
                <div className="flex items-center space-x-1 text-slate-400 font-bold text-[10px] tracking-wider uppercase">
                  <History className="w-3.5 h-3.5" />
                  <span>NÖVBƏ İÇİ KASSA ƏMƏLİYYATLARI</span>
                </div>

                {(!activeShift.cashTransactions || activeShift.cashTransactions.length === 0) ? (
                  <p className="text-slate-600 text-[10px] italic py-1">Bu növbə üzrə hələ rəhbərlik əməliyyatı qeydə alınmayıb.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeShift.cashTransactions.slice().reverse().map((tx) => (
                      <div key={tx.id} className="bg-slate-950/50 p-2 rounded-lg border border-slate-900 flex justify-between items-start space-x-2 text-[11px]">
                        <div className="space-y-0.5">
                          <span className={`font-bold px-1 py-0.5 rounded text-[8px] uppercase ${
                            tx.type === "IN" ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"
                          }`}>
                            {tx.type === "IN" ? "Mədaxil" : "Məxaric"}
                          </span>
                          <span className="text-slate-300 block font-medium mt-0.5 text-left">{tx.note}</span>
                          <span className="text-slate-600 text-[9px] block">
                            {new Date(tx.timestamp).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <span className={`font-mono font-bold whitespace-nowrap ${tx.type === "IN" ? "text-emerald-400" : "text-orange-400"}`}>
                          {tx.type === "IN" ? "+" : "-"}{tx.amount.toFixed(2)} ₼
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
