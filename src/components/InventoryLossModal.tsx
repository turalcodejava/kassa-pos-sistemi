import React, { useState } from "react";
import { Product, InventoryItem } from "../types";
import { X, AlertTriangle, Check, Package } from "lucide-react";

interface InventoryLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  donerProducts: Product[];
  flowerProducts: Product[];
  onRecordLoss: (itemId: string, name: string, quantity: number, unit: string, reason: string) => Promise<boolean>;
}

export default function InventoryLossModal({
  isOpen,
  onClose,
  inventoryItems,
  donerProducts,
  flowerProducts,
  onRecordLoss
}: InventoryLossModalProps) {
  const [selectedType, setSelectedType] = useState<"WAREHOUSE" | "DONER" | "FLOWER">("WAREHOUSE");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Compile list of choices based on selectedType
  const getChoices = () => {
    if (selectedType === "WAREHOUSE") {
      return inventoryItems.map(i => ({ id: i.id, name: `${i.name} (${i.stock} ${i.unit})`, rawName: i.name, unit: i.unit }));
    } else if (selectedType === "DONER") {
      return donerProducts
        .filter(p => p.stock !== undefined)
        .map(p => ({ id: p.id, name: `${p.name} (Anbar: ${p.stock} ədəd)`, rawName: p.name, unit: "ədəd" }));
    } else {
      return flowerProducts
        .filter(p => p.stock !== undefined)
        .map(p => ({ id: p.id, name: `${p.name} (Anbar: ${p.stock} ədəd)`, rawName: p.name, unit: "ədəd" }));
    }
  };

  const choices = getChoices();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedItemId) {
      setErrorMsg("Zəhmət olmasa məhsulu seçin!");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("Miqdar 0-dan böyük olmalıdır!");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("Zəhmət olmasa itki səbəbini qeyd edin!");
      return;
    }

    const selectedChoice = choices.find(c => c.id === selectedItemId);
    if (!selectedChoice) {
      setErrorMsg("Seçilmiş məhsul tapılmadı!");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onRecordLoss(
        selectedItemId,
        selectedChoice.rawName,
        quantity,
        selectedChoice.unit,
        reason.trim()
      );

      if (success) {
        setSuccessMsg("İtki uğurla qeydə alındı və anbardan silindi!");
        setSelectedItemId("");
        setQuantity(1);
        setReason("");
        setTimeout(() => {
          setSuccessMsg("");
          onClose();
        }, 1500);
      } else {
        setErrorMsg("İtki qeydiyyatı zamanı xəta baş verdi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Şəbəkə xətası baş verdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-white font-bold text-xs">
              Anbar İtkisi Qeydiyyatı
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          
          {/* Subtitle / Tip */}
          <p className="text-[11px] text-slate-400 leading-normal">
            Növbə zamanı xarab olan, sınan, çürüyən və ya itkiyə gedən malları bura daxil edin. Bu məlumatlar növbə hesabatınızda saxlanılacaq.
          </p>

          {/* Type Selector Tabs */}
          <div className="space-y-1">
            <label className="text-slate-400 block mb-1 font-semibold">Kateqoriya növü</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => { setSelectedType("WAREHOUSE"); setSelectedItemId(""); }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                  selectedType === "WAREHOUSE"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Xammal / Depo
              </button>
              <button
                type="button"
                onClick={() => { setSelectedType("DONER"); setSelectedItemId(""); }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                  selectedType === "DONER"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Dönər POS
              </button>
              <button
                type="button"
                onClick={() => { setSelectedType("FLOWER"); setSelectedItemId(""); }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                  selectedType === "FLOWER"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Gül POS
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Məhsul / Mal seçimi *</label>
            <select
              required
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-red-500 transition-colors font-medium text-xs"
            >
              <option value="">-- Siyahıdan seçin --</option>
              {choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">İtki miqdarı *</label>
            <input
              type="number"
              required
              min={0.1}
              step={0.1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-red-500 transition-colors font-mono"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">İtkinin səbəbi *</label>
            <textarea
              required
              rows={2}
              placeholder="Məs. Güllər soldu / Kolanın vaxtı keçdi / Yerə tökülərək zay oldu"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-red-500 transition-colors resize-none text-xs"
            />
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-center flex items-center justify-center space-x-1.5">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Yadda saxlanılır..." : "İtkini Qeyd Et"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
