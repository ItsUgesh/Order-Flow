"use client";

import { useState, useEffect } from 'react';
import { MenuItem } from './MenuGrid';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, ShoppingCart, Trash2, Wallet, Banknote, Timer, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/auth-store';
import PrintableReceipt from './PrintableReceipt';
import { format } from 'date-fns';

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CartPanel({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem,
  onClearCart,
  profile
}: { 
  cart: CartItem[]; 
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  profile: UserProfile | null;
}) {
  const [activeTab, setActiveTab] = useState('current');
  const [isDineIn, setIsDineIn] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [chargingOrder, setChargingOrder] = useState<any | null>(null);
  const [lastProcessedOrder, setLastProcessedOrder] = useState<any | null>(null);
  const { toast } = useToast();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', 'on_hold'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHeldOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleCharge = (order: any = null) => {
    if (order) {
      setChargingOrder(order);
      setIsPaymentModalOpen(true);
    } else {
      if (cart.length === 0) return;
      if (isDineIn && selectedTable === null) {
        toast({ title: "Select Table", description: "Please select a table for dine-in", variant: "destructive" });
        return;
      }
      setChargingOrder(null);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCompleteOrder = async (method: 'cash' | 'online' | null, status: 'paid' | 'on_hold') => {
    try {
      let finalOrderData;

      if (chargingOrder) {
        // Completing a HELD order
        finalOrderData = {
          ...chargingOrder,
          status,
          paymentMethod: method,
          paidAt: status === 'paid' ? serverTimestamp() : null
        };
        await updateDoc(doc(db, 'orders', chargingOrder.id), {
          status,
          paymentMethod: method,
          paidAt: status === 'paid' ? serverTimestamp() : null
        });
      } else {
        // Creating a NEW order
        finalOrderData = {
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          type: isDineIn ? 'dine_in' : 'takeaway',
          tableNumber: isDineIn ? selectedTable : null,
          items: cart.map(item => ({
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal,
          total,
          status,
          paymentMethod: method,
          createdBy: profile?.uid || 'anonymous',
          createdAt: serverTimestamp(),
          paidAt: status === 'paid' ? serverTimestamp() : null
        };
        const docRef = await addDoc(collection(db, 'orders'), finalOrderData);
        finalOrderData.id = docRef.id;
      }

      setLastProcessedOrder(finalOrderData);
      
      toast({ 
        title: status === 'paid' ? "Order Completed" : "Order Held", 
        description: `Order ${finalOrderData.orderNumber} ${status === 'paid' ? 'paid via ' + method : 'saved as hold'}` 
      });

      if (!chargingOrder) onClearCart();
      setIsPaymentModalOpen(false);
      setChargingOrder(null);
      setSelectedTable(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to process order", variant: "destructive" });
    }
  };

  return (
    <aside className="bg-white border-l flex flex-col h-full shadow-xl relative z-10">
      <PrintableReceipt order={lastProcessedOrder} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 border-b bg-slate-50">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="current" className="font-bold">Active Cart</TabsTrigger>
            <TabsTrigger value="held" className="font-bold">Held ({heldOrders.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              Current Order
            </h2>
            <Button variant="ghost" size="icon" onClick={onClearCart} className="text-slate-400 hover:text-red-500">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 border-b space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-700">Order Type</Label>
              <div className="flex items-center gap-2">
                <span className={!isDineIn ? "text-orange-600 font-bold text-xs" : "text-slate-400 text-xs"}>Takeaway</span>
                <Switch checked={isDineIn} onCheckedChange={setIsDineIn} />
                <span className={isDineIn ? "text-orange-600 font-bold text-xs" : "text-slate-400 text-xs"}>Dine-In</span>
              </div>
            </div>

            {isDineIn && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Select Table</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setSelectedTable(num)}
                      className={`h-10 text-xs font-bold rounded-lg border transition-all ${
                        selectedTable === num 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                      }`}
                    >
                      T{num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 flex-1">{item.name}</span>
                      <span className="font-bold text-slate-900 ml-4">Rs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:bg-white"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:bg-white"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => onRemoveItem(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-slate-50 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                <span>Total</span>
                <span className="text-orange-600">Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-14 rounded-xl border-slate-300 font-bold"
                onClick={() => handleCompleteOrder(null, 'on_hold')}
                disabled={cart.length === 0}
              >
                Hold Order
              </Button>
              <Button 
                className="h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
                onClick={() => handleCharge()}
                disabled={cart.length === 0}
              >
                Charge Order
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="held" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-500" />
              Held Orders
            </h2>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {heldOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Timer className="w-12 h-12 mb-4 opacity-20" />
                  <p>No orders on hold</p>
                </div>
              ) : (
                heldOrders.map(order => (
                  <div key={order.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900">{order.orderNumber}</span>
                      <span className="text-orange-600 font-black">Rs {order.total.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-4">
                      {order.type === 'dine_in' ? `Dine-In (Table ${order.tableNumber})` : 'Takeaway'} • {order.items?.length} items
                    </div>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                      onClick={() => handleCharge(order)}
                    >
                      Charge Order
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden border-none p-0">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-2xl font-bold">Checkout</DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center bg-white">
            <p className="text-slate-500 mb-2 font-medium">Payable Amount</p>
            <h3 className="text-5xl font-black text-slate-900 mb-8">Rs {(chargingOrder ? chargingOrder.total : total).toFixed(2)}</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={() => handleCompleteOrder('cash', 'paid')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <div className="p-4 bg-green-100 text-green-600 rounded-full group-hover:bg-orange-100 group-hover:text-orange-600">
                  <Banknote className="w-8 h-8" />
                </div>
                <span className="font-bold text-slate-700">Cash Payment</span>
              </button>
              
              <button 
                onClick={() => handleCompleteOrder('online', 'paid')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:bg-orange-100 group-hover:text-orange-600">
                  <Wallet className="w-8 h-8" />
                </div>
                <span className="font-bold text-slate-700">Online/Card</span>
              </button>
            </div>

            {lastProcessedOrder && lastProcessedOrder.status === 'paid' && (
              <Button 
                variant="outline" 
                className="mt-8 w-full h-12 rounded-xl border-slate-200 font-bold flex items-center justify-center gap-2"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
            )}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
            <Button variant="ghost" onClick={() => {
              setIsPaymentModalOpen(false);
              setChargingOrder(null);
            }} className="w-full text-slate-500">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
