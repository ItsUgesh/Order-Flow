"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import POSHeader from '@/components/pos/POSHeader';
import MenuGrid, { MenuItem } from '@/components/pos/MenuGrid';
import CartPanel from '@/components/pos/CartPanel';
import { Loader2, ShoppingCart } from 'lucide-react';

export default function POSPage() {
  const { profile, loading, user } = useAuth();
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const handleAddItem = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleClearCart = () => setCart([]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <POSHeader profile={profile} />

      {/* Desktop layout — side by side */}
      <main className="flex-1 overflow-hidden hidden md:grid md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px]">
        <MenuGrid onAddItem={handleAddItem} />
        <CartPanel
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          profile={profile}
        />
      </main>

      {/* Mobile layout */}
      <main className="flex-1 overflow-hidden md:hidden relative flex flex-col">
        {!showCart ? (
          <>
            <MenuGrid onAddItem={handleAddItem} />
            {/* Floating cart button */}
            <button
              onClick={() => setShowCart(true)}
              className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30 px-5 py-3 flex items-center gap-2 font-bold text-sm z-50"
            >
              <ShoppingCart className="w-4 h-4" />
              View Cart
              {cartItemCount > 0 && (
                <span className="bg-white text-orange-500 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <div className="flex flex-col h-full">
            {/* Back to menu bar */}
            <div className="px-4 py-2.5 bg-white border-b flex-shrink-0 shadow-sm">
              <button
                onClick={() => setShowCart(false)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors"
              >
                <span>←</span>
                <span>Back to Menu</span>
                {cartItemCount > 0 && (
                  <span className="ml-1 bg-orange-100 text-orange-600 text-xs font-black rounded-full px-2 py-0.5">
                    {cartItemCount} items
                  </span>
                )}
              </button>
            </div>
            {/* Cart panel */}
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                profile={profile}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}