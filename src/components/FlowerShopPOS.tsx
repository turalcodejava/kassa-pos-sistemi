import React, { useState } from "react";
import { AppState, Product, PaymentMethod, OrderItem, BusinessType } from "../types";
import { 
  Flower, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign, 
  Printer, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  MessageSquare,
  Sparkles,
  Search,
  ArrowLeft
} from "lucide-react";
import ReceiptPrinter from "./ReceiptPrinter";
import PaymentSelector from "./PaymentSelector";

interface FlowerShopPOSProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onBackToHub: () => void;
}

export default function FlowerShopPOS({ state, onUpdateState, onBackToHub }: FlowerShopPOSProps) {
  const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Hamısı");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [paymentNote, setPaymentNote] = useState<string>("");
  
  // Delivery details state
  const [isDelivery, setIsDelivery] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDateTime, setDeliveryDateTime] = useState("");
  const [cardNote, setCardNote] = useState("");

  // Receipt modal state
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [activeReceiptProps, setActiveReceiptProps] = useState<any>(null);

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const products = state.flowerProducts || [];
  const categories = ["Hamısı", "Güllər", "Aksesuarlar"];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "Hamısı" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    // Check stock if applicable
    if (product.stock !== undefined && product.stock <= 0) {
      triggerToast(`Xəbərdarlıq: ${product.name} anbarda tükənib!`);
    }

    setCurrentCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCurrentCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is OrderItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCurrentCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartSubtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCompleteSale = async () => {
    if (currentCart.length === 0) {
      triggerToast("Səbət boşdur!");
      return;
    }

    if (isDelivery) {
      if (!receiverName || !receiverPhone || !deliveryAddress) {
        triggerToast("Zəhmət olmasa çatdırılma məlumatlarını tam doldurun!");
        return;
      }
    }

    const receiptProps = {
      title: "ZƏRİF GÜLLƏR",
      orderType: isDelivery ? "Hədiyyə Çatdırılma" : "Mağazadan Satış",
      items: currentCart,
      subtotal: cartSubtotal,
      paymentMethod,
      paymentNote: paymentNote || undefined,
      createdAt: new Date().toISOString(),
      deliveryDetails: isDelivery ? {
        receiverName,
        receiverPhone,
        deliveryAddress,
        deliveryDateTime,
        cardNote
      } : undefined
    };

    try {
      const response = await fetch("/api/flower/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "POS",
          items: currentCart,
          paymentMethod,
          paymentNote: paymentNote || undefined,
          isDelivery,
          receiverName: isDelivery ? receiverName : undefined,
          receiverPhone: isDelivery ? receiverPhone : undefined,
          deliveryAddress: isDelivery ? deliveryAddress : undefined,
          deliveryDateTime: isDelivery ? deliveryDateTime : undefined,
          cardNote: isDelivery ? cardNote : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Gül satışı uğurla tamamlandı! Qəbz çap olunur...");
        
        // Reset state
        setCurrentCart([]);
        setIsDelivery(false);
        setReceiverName("");
        setReceiverPhone("");
        setDeliveryAddress("");
        setDeliveryDateTime("");
        setCardNote("");
        setPaymentNote("");

        // Open Receipt Print Preview
        setActiveReceiptProps(receiptProps);
        setPrintReceiptOpen(true);
      }
    } catch (e) {
      console.error(e);
      triggerToast("Satışı qeyd edərkən xəta baş verdi.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5] text-slate-850 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* POS Top Navigation Bar */}
      <header className="bg-white border-b border-emerald-100/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-950/10 text-white">
            <Flower className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-emerald-900 flex items-center space-x-2">
              <span>Zərif Güllər POS</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">Gül & Aksesuar</span>
            </h1>
            <p className="text-xs text-slate-500">Satış qeydiyyatı, anbar balansı və hədiyyə çatdırılması</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-28 sm:pr-32">
          <button
            onClick={onBackToHub}
            className="bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-850 border border-slate-200 hover:border-emerald-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri qayıt</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Pane: Items Browser */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          
          {/* Filters & Categories */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex space-x-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Gül və ya aksesuar axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 text-xs text-slate-800 px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none w-full sm:w-56"
              />
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {filteredProducts.map(product => {
              const inCart = currentCart.find(i => i.productId === product.id)?.quantity || 0;
              const isLowStock = product.stock !== undefined && product.stock <= 5;
              const isOutOfStock = product.stock !== undefined && product.stock === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white border p-4 rounded-2xl flex flex-col justify-between transition-all relative group shadow-sm hover:shadow-md ${
                    isOutOfStock 
                      ? "opacity-60 border-slate-100 cursor-not-allowed" 
                      : "border-slate-100 hover:border-emerald-200 cursor-pointer"
                  }`}
                >
                  {inCart > 0 && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10">
                      {inCart}
                    </span>
                  )}

                  {product.image && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-slate-100 bg-slate-50 shrink-0">
                      <img src={product.image} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={product.name} />
                    </div>
                  )}

                  <div className="mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      {product.category}
                    </span>
                    <h4 className="font-semibold text-xs text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {product.name}
                    </h4>
                    
                    {/* Stock level indicator */}
                    {product.stock !== undefined && (
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${
                        isOutOfStock 
                          ? "bg-red-50 text-red-600" 
                          : isLowStock 
                            ? "bg-amber-50 text-amber-600" 
                            : "bg-slate-50 text-slate-500"
                      }`}>
                        {isOutOfStock ? "Tükənib" : `Anbarda: ${product.stock} ədəd`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                    <span className="font-black text-slate-900 text-base">
                      {product.price.toFixed(2)} ₼
                    </span>
                    <div className={`p-1.5 rounded-lg transition-all ${
                      isOutOfStock 
                        ? "bg-slate-100 text-slate-400" 
                        : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12">
                <p className="text-sm">Məhsul tapılmadı.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Pane: Checkout sidebar */}
        <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col overflow-hidden shadow-sm">
          
          {/* Header Cart */}
          <div className="p-4 border-b border-slate-100 bg-[#faf8f5]/60">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Səbət və Çatdırılma</span>
            </h3>
          </div>

          {/* Delivery Configuration Switch */}
          <div className="p-4 border-b border-slate-100 bg-[#faf8f5]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Çatdırılma Xidməti var?</span>
              <button
                type="button"
                onClick={() => setIsDelivery(!isDelivery)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDelivery ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isDelivery ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Delivery subform */}
            {isDelivery && (
              <div className="space-y-2.5 pt-2 animate-fadeIn text-xs">
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Qəbul edənin adı, soyadı"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Telefon nömrəsi"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Çatdırılma ünvanı"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tarix və Saat (məs, Sabah 14:00)"
                      value={deliveryDateTime}
                      onChange={(e) => setDeliveryDateTime(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <textarea
                    placeholder="Təbrik kartı mətni (Aksesuar)"
                    value={cardNote}
                    onChange={(e) => setCardNote(e.target.value)}
                    rows={2}
                    className="bg-white border border-slate-200 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentCart.map(item => (
              <div 
                key={item.productId}
                className="flex items-center justify-between p-3 bg-[#faf8f5] rounded-xl border border-slate-100"
              >
                <div className="flex-1 mr-2">
                  <h5 className="font-semibold text-xs text-slate-800 truncate">{item.name}</h5>
                  <span className="text-[10px] text-slate-500">{item.price.toFixed(2)} ₼</span>
                </div>

                {/* Counter */}
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 px-1 min-w-[16px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[65px] ml-3 font-black text-xs text-slate-900">
                  {(item.price * item.quantity).toFixed(2)} ₼
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {currentCart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 space-y-2">
                <Flower className="w-8 h-8 text-slate-200" />
                <p className="text-xs text-slate-500">Səbətiniz boşdur.</p>
              </div>
            )}
          </div>

          {/* Pricing totals & Checkout execution */}
          <div className="p-4 border-t border-slate-100 bg-[#faf8f5]/40 space-y-4">
            
            <div className="flex justify-between items-center text-slate-900">
              <span className="text-xs font-bold text-slate-500 uppercase">Cəm məbləğ:</span>
              <span className="font-extrabold text-2xl text-emerald-800">{cartSubtotal.toFixed(2)} ₼</span>
            </div>

            {/* Payment Selector */}
            <PaymentSelector
              value={paymentMethod}
              note={paymentNote}
              onChange={(method, note) => {
                setPaymentMethod(method);
                setPaymentNote(note || "");
              }}
              theme="light"
            />

            {/* Confirm buttons */}
            <button
              onClick={handleCompleteSale}
              disabled={currentCart.length === 0}
              className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white transition-all flex items-center justify-center space-x-2 shadow-md ${
                currentCart.length > 0
                  ? "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] shadow-emerald-950/10 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Sifarişi Çap et və Bitir (1 XP Printer)</span>
            </button>

          </div>

        </div>

      </main>

      {/* Printer overlay popup */}
      {printReceiptOpen && activeReceiptProps && (
        <ReceiptPrinter
          isOpen={printReceiptOpen}
          onClose={() => setPrintReceiptOpen(false)}
          title="ZƏRİF GÜLLƏR"
          type="CUSTOMER" // Flowers always print standard billing customer receipt
          orderType={activeReceiptProps.orderType}
          items={activeReceiptProps.items}
          subtotal={activeReceiptProps.subtotal}
          paymentMethod={activeReceiptProps.paymentMethod}
          createdAt={activeReceiptProps.createdAt}
          deliveryDetails={activeReceiptProps.deliveryDetails}
        />
      )}

    </div>
  );
}
