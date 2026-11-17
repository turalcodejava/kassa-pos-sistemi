import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Shield, Lock, Key, ArrowRight, AlertCircle, Sparkles, Store } from "lucide-react";

interface DirectorLoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onBackToHub?: () => void;
}

export default function DirectorLogin({ users, onLogin, onBackToHub }: DirectorLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Filter admin users
  const adminUsers = users.filter(u => u.role === "ADMIN");

  const verifyPin = (enteredPin: string) => {
    // Check if entered pin matches any ADMIN user, or master fallback "0000"
    const matchedAdmin = adminUsers.find(u => u.pin === enteredPin) ||
      (enteredPin === "0000" ? adminUsers[0] : null);

    if (matchedAdmin) {
      onLogin(matchedAdmin);
    } else {
      setError("Daxil edilən PİN şifrə yanlışdır! Giriş qadağandır.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin("");
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 select-none relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6 ${isShaking ? "animate-shake" : ""}`}>
        
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Məxfi • Rəhbərlik Girişi</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white font-display tracking-tight leading-none">
            Rəhbərlik Portalı
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
            Bu link yalnız rəhbər və sahibkar üçündür. Maliyyə və kassa hesabatlarına baxmaq üçün <strong>Admin PİN şifrənizi</strong> daxil edin.
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 shadow-inner">
          <div className="flex space-x-4">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? "bg-indigo-500 shadow-md shadow-indigo-500/50 scale-110"
                      : "bg-slate-800 border border-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium">4 rəqəmli şifrəni yığın</span>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="py-3.5 bg-slate-800/80 hover:bg-slate-750 active:bg-indigo-600 text-white font-bold text-lg rounded-2xl transition-all border border-slate-750 cursor-pointer active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="py-3.5 bg-slate-850 hover:bg-slate-800 text-rose-400 font-bold text-xs rounded-2xl transition-all border border-slate-750 cursor-pointer active:scale-95"
            title="Təmizlə"
          >
            Təmizlə
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="py-3.5 bg-slate-800/80 hover:bg-slate-750 active:bg-indigo-600 text-white font-bold text-lg rounded-2xl transition-all border border-slate-750 cursor-pointer active:scale-95 shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="py-3.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl transition-all border border-slate-750 cursor-pointer active:scale-95 flex items-center justify-center"
            title="Sil"
          >
            ⌫ Sil
          </button>
        </div>

        {/* Footer info / Back */}
        {onBackToHub && (
          <div className="pt-2 text-center border-t border-slate-800">
            <button
              type="button"
              onClick={onBackToHub}
              className="text-xs text-slate-400 hover:text-indigo-400 font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ümumi Kassa Portalı Ekranına Keç</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
