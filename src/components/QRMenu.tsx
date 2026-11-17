import React, { useState, useMemo } from "react";
import { AppState, Product } from "../types";
import { 
  ChefHat, 
  Search, 
  Sparkles, 
  Utensils, 
  Info,
  X,
  Flame,
  Phone,
  Clock,
  CheckCircle2,
  Share2
} from "lucide-react";


interface QRMenuProps {
  tableNumber?: number;
  state: AppState;
  onUpdateState?: (newState: AppState) => void;
}

export default function QRMenu({ tableNumber, state }: QRMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState("Hamısı");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const products = state.donerProducts || [];
  
  // Aggregate sales per product
  const productSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    (state.donerOrders || []).forEach(order => {
      if (order.status !== "CANCELLED") {
        (order.items || []).forEach(item => {
          map[item.productId] = (map[item.productId] || 0) + (item.quantity || 1);
        });
      }
    });
    (state.donerProducts || []).forEach(p => {
      map[p.id] = Math.max(map[p.id] || 0, p.totalSold || 0);
    });
    return map;
  }, [state.donerOrders, state.donerProducts]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const distinct = Array.from(new Set(products.map(p => p.category)));
    return ["Hamısı", "🔥 Ən Çox Satılanlar", ...distinct];
  }, [products]);

  // Filter products by category and search query, sorted by sales count descending
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = products.filter(p => {
      if (selectedCategory === "🔥 Ən Çox Satılanlar") {
        return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      const matchesCategory = selectedCategory === "Hamısı" || p.category === selectedCategory;
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.some(ing => ing.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });

    if (selectedCategory === "🔥 Ən Çox Satılanlar") {
      const topSold = list.filter(p => (productSalesMap[p.id] || 0) > 0);
      list = topSold.length > 0 ? topSold : list.slice(0, 8);
    }

    // Sort descending by sales count: highest sold items appear first!
    return list.slice().sort((a, b) => {
      const salesA = productSalesMap[a.id] || 0;
      const salesB = productSalesMap[b.id] || 0;
      if (salesB !== salesA) {
        return salesB - salesA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [products, selectedCategory, searchQuery, productSalesMap]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-lg mx-auto relative shadow-2xl border-l border-r border-slate-900 pb-16">
      
      {/* Hero Header */}
      <header className="bg-gradient-to-b from-orange-600/30 via-slate-900/60 to-slate-950 p-6 text-center space-y-3 relative overflow-hidden shrink-0 border-b border-slate-900">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-950/60 border-2 border-orange-400/30">
            <ChefHat className="w-9 h-9 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-black font-display text-white tracking-tight">Köz Xəzər Dönər</h1>
            <p className="text-xs text-orange-400 font-semibold flex items-center justify-center space-x-1 pt-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Təbii KÖZ Dönəri & Fast Food</span>
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-slate-800 py-1 px-4 rounded-full text-[11px] text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rəqəmsal Menyu • Xoş Gəlmisiniz!</span>
          </div>

          {tableNumber && (
            <div className="inline-block ml-2 bg-orange-500/20 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-orange-400">
              Masa #{tableNumber}
            </div>
          )}
        </div>
      </header>

      {/* Search & Categories Bar */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-4 py-3 space-y-2.5">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Yemək, dönər və ya içki axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Horizontal Pills */}
        <div className="overflow-x-auto flex space-x-1.5 scrollbar-none pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat 
                  ? "bg-orange-600 text-white shadow-md shadow-orange-950/40 scale-102" 
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Products Grid / List */}
      <div className="p-4 space-y-3 flex-1">
        
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold">{selectedCategory} ({filteredProducts.length} çeşid)</span>
          <span className="text-[10px] text-slate-500">Təfərrüat üçün məhsula toxunun</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map(p => {
            const salesCount = productSalesMap[p.id] || 0;
            const isTopSeller = salesCount > 0;

            return (
              <div 
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between space-x-3 group shadow-sm active:scale-[0.99] ${
                  isTopSeller
                    ? "bg-slate-900/90 hover:bg-slate-900 border-amber-500/35 hover:border-amber-400/60 shadow-amber-950/10"
                    : "bg-slate-900/80 hover:bg-slate-900 border-slate-850 hover:border-orange-500/40"
                }`}
              >
                {/* Product Image */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                  {p.image ? (
                    <img 
                      src={p.image} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={p.name} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                      <Utensils className="w-6 h-6 opacity-40" />
                      <span className="text-[8px] mt-1 font-bold text-slate-600 uppercase">Köz</span>
                    </div>
                  )}
                </div>


                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    <span className="text-[9px] font-extrabold text-orange-400 uppercase tracking-wider block">{p.category}</span>
                    {p.category.toLowerCase().includes("dönər") && (
                      <span className="text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Közdə</span>
                      </span>
                    )}
                    {isTopSeller && (
                      <span className="text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        <span>Top Satış ({salesCount})</span>
                      </span>
                    )}
                  </div>
                
                <h3 className="font-extrabold text-sm text-white truncate group-hover:text-orange-400 transition-colors">
                  {p.name}
                </h3>
                
                {p.ingredients && p.ingredients.length > 0 ? (
                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-snug">
                    {p.ingredients.join(" • ")}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Xüsusi reseptlə təzə hazırlanır</p>
                )}

                <div className="pt-0.5">
                  <span className="text-sm font-black text-orange-400 font-display">
                    {Number(p.price || 0).toFixed(2)} ₼
                  </span>
                </div>
              </div>

              {/* Action arrow */}
              <div className="p-2 rounded-xl bg-slate-950/60 text-slate-400 group-hover:text-white group-hover:bg-orange-600/20 transition-all shrink-0">
                <Info className="w-4 h-4" />
              </div>
            </div>
          );
        })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Utensils className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-xs text-slate-400">Axtarışa uyğun yemək tapılmadı.</p>
            <button
              onClick={() => { setSelectedCategory("Hamısı"); setSearchQuery(""); }}
              className="text-xs text-orange-400 font-bold underline cursor-pointer"
            >
              Bütün menyunu göstər
            </button>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <footer className="p-6 text-center space-y-2 border-t border-slate-900 bg-slate-950 mt-8">
        <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-300">
          <ChefHat className="w-4 h-4 text-orange-500" />
          <span>Köz Xəzər Dönər</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Hər gün saat 09:00 - 23:00 xidmətinizdəyik. Nuş olsun!
        </p>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-950 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp flex flex-col max-h-[85vh]">
            
            {/* Modal Product Image Header */}
            <div className="relative h-56 w-full bg-slate-900 border-b border-slate-850">
              {selectedProduct.image ? (
                <img 
                  src={selectedProduct.image} 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-cover" 
                  alt={selectedProduct.name} 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-slate-950">
                  <Utensils className="w-12 h-12 opacity-30" />
                  <span className="text-xs mt-2 font-bold text-slate-500 uppercase">Köz Xəzər Dönər</span>
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Price Tag Overlay */}
              <div className="absolute bottom-4 left-4 bg-orange-600 text-white font-black text-base px-4 py-1.5 rounded-2xl shadow-lg font-display">
                {Number(selectedProduct.price || 0).toFixed(2)} ₼
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block mb-1">
                  {selectedProduct.category}
                </span>
                <h2 className="text-xl font-black text-white font-display">
                  {selectedProduct.name}
                </h2>
              </div>

              {/* Ingredients Details */}
              {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Tərkibi və İnqrediyentlər:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.ingredients.map(ing => (
                      <span
                        key={ing}
                        className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{ing}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlight Box */}
              <div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-2xl flex items-center space-x-3 text-xs text-orange-300">
                <Flame className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Təbii kömür alovunda təzə ətlə bişirilir. Keyfiyyətə tam zəmanət verilir.</span>
              </div>

              {/* Action */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer border border-slate-800"
              >
                Menyuya Qayıt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
