import React, { useState } from "react";
import { AppState, Product, OrderItem, PaymentMethod } from "../types";
import { 
  ShoppingBag, 
  Trash2, 
  Sparkles, 
  Gift, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  ShoppingBag as CartIcon, 
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Store,
  Flower,
  Minus,
  Plus
} from "lucide-react";

interface FlowerShopWebProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onBackToHub: () => void;
}

export default function FlowerShopWeb({ state, onUpdateState, onBackToHub }: FlowerShopWebProps) {
  const [activeCollection, setActiveCollection] = useState<string>("Bütün Kolleksiya");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"CATALOG" | "CHECKOUT" | "SUCCESS">("CATALOG");

  // Checkout form details
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDateTime, setDeliveryDateTime] = useState("");
  const [cardNote, setCardNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Card);

  const [toast, setToast] = useState<string | null>(null);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const products = state.flowerProducts || [];

  // Filter collections
  const collections = ["Bütün Kolleksiya", "Güllər", "Aksesuarlar"];

  const filteredProducts = products.filter(p => {
    if (activeCollection === "Bütün Kolleksiya") return true;
    return p.category === activeCollection;
  });

  const addToCart = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      triggerToast("Bu kolleksiya məhsulu hazırda bitib, tezliklə əlavə olunacaq!");
      return;
    }

    setCart(prev => {
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
    triggerToast(`${product.name} səbətə əlavə olundu!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
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
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cartSubtotal > 50 ? 0 : 5;
  const totalAmount = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !receiverPhone || !deliveryAddress) {
      triggerToast("Bütün çatdırılma xanalarını doldurun!");
      return;
    }

    const orderData = {
      orderType: "WEB",
      items: cart,
      paymentMethod,
      isDelivery: true,
      receiverName,
      receiverPhone,
      deliveryAddress,
      deliveryDateTime: deliveryDateTime || "İndi / Tezliklə",
      cardNote: cardNote || undefined
    };

    try {
      const response = await fetch("/api/flower/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setPlacedOrderDetails({
          id: "W-" + Math.floor(Math.random() * 9000 + 1000),
          receiverName,
          deliveryAddress,
          totalAmount
        });
        
        // Clear Web states
        setCart([]);
        setCheckoutStep("SUCCESS");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Sifariş tamamlanarkən xəta baş verdi.");
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/25 flex flex-col font-sans text-slate-800">
      
      {/* Client Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-rose-600 text-white font-semibold py-3 px-6 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce text-xs">
          <Heart className="w-4 h-4 fill-white" />
          <span>{toast}</span>
        </div>
      )}

      {/* Website Store Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="bg-gradient-to-tr from-rose-500 to-pink-500 p-2 rounded-xl text-white shadow-md shadow-rose-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 font-display block">Zərif Güllər</span>
            <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-bold">Onlayn Butik Saytı</span>
          </div>
        </div>

        {/* Catalog Categories Navigation */}
        {checkoutStep === "CATALOG" && (
          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-500">
            {collections.map(c => (
              <button
                key={c}
                onClick={() => setActiveCollection(c)}
                className={`transition-colors cursor-pointer ${activeCollection === c ? "text-rose-600 font-extrabold" : "hover:text-rose-500"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-3 pr-28 sm:pr-32">
          {/* Back to cash register */}
          <button
            onClick={onBackToHub}
            className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kassaya qayıt</span>
          </button>

          {/* Cart triggers */}
          {checkoutStep === "CATALOG" && (
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CartIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold">{cart.length}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Hero promo banner */}
      {checkoutStep === "CATALOG" && (
        <div className="bg-gradient-to-r from-rose-100 to-pink-50 via-rose-50 py-12 px-8 text-center max-w-7xl mx-auto w-full my-6 rounded-3xl border border-rose-100/40 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-200/30 rounded-full blur-2xl"></div>

          <div className="relative max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-rose-600 tracking-widest uppercase block">Həyatı Zərifləşdirin</span>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display leading-tight">Yaxınlarınıza Sevginizi Güllərlə Göstərin</h1>
            <p className="text-xs text-slate-500">Premium buketlər, peşəkar florist komandası və Bakı daxili sürətli hədiyyə çatdırılması.</p>
            <div className="pt-2">
              <span className="inline-flex items-center space-x-1.5 bg-rose-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full shadow-md shadow-rose-200">
                <span>50 AZN üzəri çatdırılma PULSUZDUR!</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-6 flex-1 pb-12">
        
        {/* CATALOG STEP */}
        {checkoutStep === "CATALOG" && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Catalog Grid */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between border-b border-rose-100/60 pb-3">
                <h2 className="text-lg font-bold font-display text-slate-900">{activeCollection}</h2>
                <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} məhsul</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.stock !== undefined && product.stock === 0;
                  return (
                    <div 
                      key={product.id}
                      className="bg-white rounded-3xl overflow-hidden border border-rose-100/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
                    >
                      {/* Flower visual card image */}
                      <div className="h-48 bg-rose-100/30 flex items-center justify-center relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-pink-500/5"></div>
                        {product.image ? (
                          <img src={product.image} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                        ) : (
                          <Flower className="w-16 h-16 text-rose-300 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                        )}
                        
                        {product.stock !== undefined && (
                          <div className={`absolute top-4 left-4 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm ${
                            isOutOfStock 
                              ? "bg-slate-900 text-white" 
                              : product.stock <= 5 
                                ? "bg-amber-500 text-white" 
                                : "bg-white/90 backdrop-blur-sm text-slate-700"
                          }`}>
                            {isOutOfStock ? "Tükənib" : product.stock <= 5 ? "Son Limit" : "Yüksək keyfiyyət"}
                          </div>
                        )}
                      </div>

                      {/* Info Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 mb-4">
                          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">{product.category}</span>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">{product.name}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal">Premium qablaşdırma və florist dizaynı ilə birlikdə.</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-rose-50/60 pt-3">
                          <span className="font-black text-rose-600 text-base">{product.price.toFixed(2)} ₼</span>
                          
                          <button
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                              isOutOfStock 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                            }`}
                          >
                            <span>Səbətə</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Shopping Cart overlay drawer styled panel */}
            {isCartOpen && (
              <div className="w-full lg:w-[360px] bg-white rounded-3xl border border-rose-100 shadow-xl p-6 space-y-6 shrink-0 sticky top-24">
                <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
                    <CartIcon className="w-4 h-4 text-rose-600" />
                    <span>Seçdiyiniz buketlər</span>
                  </h3>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs text-rose-600 hover:text-rose-500 font-bold"
                  >
                    Bağla
                  </button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between text-xs pb-3 border-b border-rose-50">
                      <div className="flex-1 mr-2">
                        <h5 className="font-bold text-slate-800 truncate">{item.name}</h5>
                        <span className="text-[10px] text-rose-500 font-bold">{(item.price).toFixed(2)} ₼</span>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-50 border border-rose-100 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:bg-white rounded text-slate-500 text-[10px]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-bold px-1 min-w-[14px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:bg-white rounded text-slate-500 text-[10px]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-slate-400 hover:text-red-500 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <Gift className="w-8 h-8 text-rose-200 mx-auto" />
                      <p className="text-xs">Səbətiniz hələ ki boşdur.</p>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-4 pt-3 border-t border-rose-50">
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Məhsul cəmi:</span>
                        <span className="font-bold text-slate-800">{cartSubtotal.toFixed(2)} ₼</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Çatdırılma:</span>
                        <span className="font-bold text-slate-800">{deliveryFee === 0 ? "PULSUZ" : `${deliveryFee.toFixed(2)} ₼`}</span>
                      </div>
                      <div className="flex justify-between border-t border-rose-50 pt-2 font-extrabold text-sm text-slate-900">
                        <span>Yekun Məbləğ:</span>
                        <span className="text-rose-600">{totalAmount.toFixed(2)} ₼</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep("CHECKOUT")}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg shadow-rose-200 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <span>Sifarişi rəsmiləşdir</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* CHECKOUT STEP */}
        {checkoutStep === "CHECKOUT" && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-rose-100 shadow-xl p-8 space-y-6">
            <div className="border-b border-rose-50 pb-4">
              <button 
                onClick={() => setCheckoutStep("CATALOG")}
                className="text-xs text-rose-600 hover:text-rose-500 font-bold mb-2 flex items-center space-x-1"
              >
                <span>&larr; Kataloqa qayıt</span>
              </button>
              <h2 className="text-xl font-extrabold text-slate-950 font-display">Çatdırılma & Ödəniş Məlumatları</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sifarişinizi qeydiyyata almaq üçün aşağıdakı xanaları doldurun.</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-5 text-xs">
              
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 border-l-2 border-rose-500 pl-2">Çatdırılma</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Hədiyyəni Qəbul edən (Ad, Soyad) *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                      <input
                        type="text"
                        required
                        placeholder="Məs, Aysel Məmmədova"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        className="bg-slate-50 border border-rose-100 focus:border-rose-500 focus:outline-none rounded-xl p-2.5 pl-9 w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Qəbul edənin telefonu *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                      <input
                        type="text"
                        required
                        placeholder="Məs, +994 50 123 45 67"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        className="bg-slate-50 border border-rose-100 focus:border-rose-500 focus:outline-none rounded-xl p-2.5 pl-9 w-full text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Çatdırılma Ünvanı *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                    <input
                      type="text"
                      required
                      placeholder="Məs, Nizami küçəsi 142, mənzil 4"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="bg-slate-50 border border-rose-100 focus:border-rose-500 focus:outline-none rounded-xl p-2.5 pl-9 w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Çatdırılma vaxtı (Seçin) *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                      <input
                        type="text"
                        required
                        placeholder="Məs, Sabah saat 15:00-da"
                        value={deliveryDateTime}
                        onChange={(e) => setDeliveryDateTime(e.target.value)}
                        className="bg-slate-50 border border-rose-100 focus:border-rose-500 focus:outline-none rounded-xl p-2.5 pl-9 w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Təbrik Kartı mətni (İstəyə bağlı)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                      <input
                        type="text"
                        placeholder="Kart mətni (məs: Ad günün mübarək!)"
                        value={cardNote}
                        onChange={(e) => setCardNote(e.target.value)}
                        className="bg-slate-50 border border-rose-100 focus:border-rose-500 focus:outline-none rounded-xl p-2.5 pl-9 w-full text-xs"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Payment Methods */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 border-l-2 border-rose-500 pl-2">Ödəniş Metodu</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod(PaymentMethod.Card)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 ${
                      paymentMethod === PaymentMethod.Card 
                        ? "bg-rose-50 border-rose-400 text-rose-700 font-bold" 
                        : "bg-slate-50 border-rose-50 hover:bg-rose-50/40 text-slate-600"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                      {paymentMethod === PaymentMethod.Card && <span className="w-2 h-2 bg-rose-600 rounded-full"></span>}
                    </span>
                    <span>Onlayn Kart Ödənişi</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod(PaymentMethod.Cash)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 ${
                      paymentMethod === PaymentMethod.Cash 
                        ? "bg-rose-50 border-rose-400 text-rose-700 font-bold" 
                        : "bg-slate-50 border-rose-50 hover:bg-rose-50/40 text-slate-600"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                      {paymentMethod === PaymentMethod.Cash && <span className="w-2 h-2 bg-rose-600 rounded-full"></span>}
                    </span>
                    <span>Qapıda Nağd Ödəniş</span>
                  </div>
                </div>
              </div>

              {/* Total checkout calculation summary */}
              <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100 text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Sifarişin cəmi:</span>
                  <span>{cartSubtotal.toFixed(2)} ₼</span>
                </div>
                <div className="flex justify-between">
                  <span>Çatdırılma:</span>
                  <span>{deliveryFee === 0 ? "PULSUZ" : `${deliveryFee.toFixed(2)} ₼`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-rose-100 pt-2 mt-2">
                  <span>Yekun Məbləğ:</span>
                  <span className="text-rose-600">{totalAmount.toFixed(2)} ₼</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs shadow-lg shadow-rose-200 cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Sifarişi Təsdiqlə (Ödəniş Et)</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* SUCCESS STEP */}
        {checkoutStep === "SUCCESS" && placedOrderDetails && (
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-5 my-12 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 font-display">Təşəkkür edirik! Sifarişiniz qəbul olundu.</h2>
              <p className="text-[11px] text-slate-400">Sifariş nömrəsi: <span className="font-bold text-rose-600">{placedOrderDetails.id}</span></p>
            </div>

            <div className="bg-[#faf8f5] p-4 rounded-2xl text-xs text-left space-y-2 border border-slate-50">
              <div className="font-bold text-slate-700 uppercase tracking-wide text-[9px] border-b border-slate-200 pb-1">Sifariş xülasəsi</div>
              <div>Qəbul edən: <span className="font-bold text-slate-900">{placedOrderDetails.receiverName}</span></div>
              <div>Çatdırılma ünvanı: <span className="font-bold text-slate-900 truncate block max-w-xs">{placedOrderDetails.deliveryAddress}</span></div>
              <div>Ödənilən məbləğ: <span className="font-extrabold text-rose-600">{placedOrderDetails.totalAmount.toFixed(2)} ₼</span></div>
            </div>

            <div className="text-[10px] text-slate-500 bg-rose-50/40 p-3 rounded-xl border border-rose-100 flex items-center space-x-2 justify-center">
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Sifarişiniz kassa sistemində avtomatik qeydiyyata alındı və hazırlanır.</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCheckoutStep("CATALOG")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Kataloqa Geri Qayıt
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
