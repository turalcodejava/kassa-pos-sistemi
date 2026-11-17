import React, { useState } from "react";
import { User } from "../types";
import { Lock, UserCheck, Key, Shield, HelpCircle, ArrowRight, Sparkles } from "lucide-react";

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onOpenDirectorLogin?: () => void;
}

export default function LoginScreen({ users, onLogin, onOpenDirectorLogin }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin("");
    setError("");
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const verifyPin = (enteredPin: string) => {
    if (!selectedUser) return;
    if (selectedUser.pin === enteredPin) {
      onLogin(selectedUser);
    } else {
      setError("Daxil edilən PİN şifrə yanlışdır!");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 select-none">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Kassa POS v2.0</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white font-display tracking-tight leading-none">
            Köz Xəzər Dönər POS
          </h1>
          <p className="text-slate-400 text-xs">
            Zəhmət olmasa daxil olmaq üçün istifadəçini seçin və PİN-i daxil edin.
          </p>
        </div>

        {/* STEP 1: Select User */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">İSTİFADƏÇİLƏR</span>
          <div className="grid grid-cols-1 gap-2">
            {users.map((user) => {
              const isSelected = selectedUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-950/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-850 text-slate-400"}`}>
                      {user.role === "ADMIN" ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">{user.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {user.role === "ADMIN" ? "Rəhbərlik / Admin" : "Kassir / Satıcı"}
                      </span>
                    </div>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: PIN Keypad */}
        {selectedUser && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="border-t border-slate-800 pt-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">PİN ŞİFRƏ (4 RƏQƏMLİ)</span>
              
              {/* PIN Display Dots */}
              <div className="flex justify-center space-x-3.5 my-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                      pin.length > index
                        ? "bg-indigo-500 border-indigo-400 scale-110 shadow-md shadow-indigo-950"
                        : "bg-slate-850 border-slate-800"
                    }`}
                  ></div>
                ))}
              </div>

              {error && (
                <p className="text-[10px] text-red-400 font-semibold my-1.5 animate-pulse bg-red-500/10 border border-red-500/20 py-1 px-3 rounded-lg inline-block">
                  {error}
                </p>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="bg-slate-850 hover:bg-slate-800 active:bg-indigo-600 border border-slate-800 active:border-indigo-500 text-white font-bold text-base h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="bg-slate-850/40 hover:bg-slate-800/80 border border-slate-800/60 text-slate-400 font-bold text-xs h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                Təmizlə
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="bg-slate-850 hover:bg-slate-800 active:bg-indigo-600 border border-slate-800 active:border-indigo-500 text-white font-bold text-base h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                0
              </button>
              <div className="h-11 rounded-xl flex items-center justify-center text-slate-700">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Security Note Footer & Director Portal Link */}
        <div className="space-y-3 pt-1">
          {onOpenDirectorLogin && (
            <button
              type="button"
              onClick={onOpenDirectorLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Rəhbərlik & Admin Portalı Girişi</span>
            </button>
          )}

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-850 text-[10px] text-slate-500 text-center">
            <span>Təhlükəsizlik üçün PİN kodunuzu gizli saxlayın.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
