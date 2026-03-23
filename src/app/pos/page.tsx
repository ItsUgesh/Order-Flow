"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import POSHeader from '@/components/pos/POSHeader';
import MenuGrid, { MenuItem } from '@/components/pos/MenuGrid';
import CartPanel from '@/components/pos/CartPanel';
import { Loader2 } from 'lucide-react';

export default function POSPage() {
  const { profile, loading, user } = useAuth();
  const [cart, setCart] = useState<any[]>([]);
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

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <POSHeader profile={profile} />
      <main className="flex-1 overflow-hidden pos-grid">
        <MenuGrid onAddItem={handleAddItem} />
        <CartPanel 
          cart={cart} 
          onUpdateQuantity={handleUpdateQuantity} 
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          profile={profile}
        />
      </main>
    </div>
  );
}