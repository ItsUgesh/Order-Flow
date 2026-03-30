"use client";

import { useState, useEffect } from 'react';
import { MenuItem } from './MenuGrid';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, ShoppingCart, Trash2, Wallet, Banknote, Timer, Printer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/auth-store';

interface CartItem extends MenuItem {
  quantity: number;
}

const printReceipt = (order: any) => {
  const items = order.items?.map((item: any) =>
    `<tr>
      <td style="padding:3px 0">${item.name}</td>
      <td style="text-align:center;padding:3px 0">${item.quantity}</td>
      <td style="text-align:right;padding:3px 0">Rs ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('') || '';

  const receiptHTML = `<!DOCTYPE html><html><head><title>Receipt</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:88mm; font-family:'Courier New',Courier,monospace; font-size:12px; line-height:1.4; color:#000; background:#fff; padding:16px; }
      @page { size:88mm auto; margin:0; }
      table { width:100%; border-collapse:collapse; }
      .center { text-align:center; }
      .bold { font-weight:bold; }
      .row { display:flex; justify-content:space-between; }
    </style></head><body>
    <div class="center" style="margin-bottom:16px">
      <p class="bold" style="font-size:14px;text-transform:uppercase">JP Food And Tandoori</p>
      <p>Tel: 000-000-0000</p>
      <p style="border-bottom:1px dashed black;margin-bottom:8px;padding-bottom:8px">================================</p>
    </div>
    <div style="margin-bottom:12px">
      <div class="row">
        <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
        <span>Time: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p>Order #: ${order.orderNumber}</p>
      <p>Type: ${order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</p>
      ${order.tableNumber ? `<p>Table: ${order.tableNumber}</p>` : ''}
      <p style="border-bottom:1px dashed black;margin:8px 0">--------------------------------</p>
    </div>
    <table style="margin-bottom:12px">
      <thead><tr style="border-bottom:1px dashed black">
        <th style="text-align:left;padding-bottom:4px">Item Name</th>
        <th style="text-align:center;padding-bottom:4px">Qty</th>
        <th style="text-align:right;padding-bottom:4px">Price</th>
      </tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div style="border-top:1px dashed black;padding-top:8px;margin-bottom:12px">
      <div class="row"><span>Subtotal:</span><span>Rs ${(order.subtotal ?? order.total)?.toFixed(2)}</span></div>
      <div class="row bold"><span>Total:</span><span>Rs ${order.total?.toFixed(2)}</span></div>
      <div class="row" style="text-transform:capitalize"><span>Payment:</span><span>${order.paymentMethod || 'N/A'}</span></div>
      <p style="border-bottom:1px dashed black;margin:8px 0">--------------------------------</p>
    </div>
    <div class="center">
      <p>Thank you for your visit!</p>
      <p>Please come again :)</p>
      <p style="margin-top:8px">================================</p>
    </div>
    </body></html>`;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  }
};

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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [chargingOrder, setChargingOrder] = useState<any | null>(null);
  const [lastProcessedOrder, setLastProcessedOrder] = useState<any | null>(null);
  const [existingTableOrder, setExistingTableOrder] = useState<any | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
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

  useEffect(() => {
    if (isDineIn && selectedTable) {
      const order = heldOrders.find(o => o.tableNumber === selectedTable && o.status === 'on_hold');
      setExistingTableOrder(order || null);
    } else {
      setExistingTableOrder(null);
    }
  }, [selectedTable, isDineIn, heldOrders]);

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

  const handleCompleteOrder = async (method: 'cash' | 'online' | null, status: 'paid' | 'on_hold') => {
    try {
      let finalOrderData;

      if (chargingOrder) {
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
      } else if (existingTableOrder) {
        const mergedItems = [...existingTableOrder.items];
        cart.forEach(cartItem => {
          const index = mergedItems.findIndex(i => i.menuItemId === cartItem.id);
          if (index > -1) {
            mergedItems[index].quantity += cartItem.quantity;
          } else {
            mergedItems.push({
              menuItemId: cartItem.id,
              name: cartItem.name,
              quantity: cartItem.quantity,
              price: cartItem.price
            });
          }
        });
        const newTotal = mergedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        finalOrderData = {
          ...existingTableOrder,
          items: mergedItems,
          total: newTotal,
          status,
          paymentMethod: method,
          paidAt: status === 'paid' ? serverTimestamp() : null,
          updatedAt: serverTimestamp()
        };
        await updateDoc(doc(db, 'orders', existingTableOrder.id), {
          items: mergedItems,
          total: newTotal,
          status,
          paymentMethod: method,
          paidAt: status === 'paid' ? serverTimestamp() : null,
          updatedAt: serverTimestamp()
        });
      } else {
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

      if (status === 'paid') {
        setIsSuccessModalOpen(true);
      } else {
        toast({ title: "Order Held", description: `Order ${finalOrderData.orderNumber} saved as hold` });
      }

      if (!chargingOrder) {
        onClearCart();
        setSelectedTable(null);
        setExistingTableOrder(null);
      }
      setIsPaymentModalOpen(false);
      setChargingOrder(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to process order", variant: "destructive" });
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    toast({ title: "Order Processed", description: `Order #${lastProcessedOrder?.orderNumber} complete.` });
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      await updateDoc(doc(db, 'orders', cancellingOrder.id), { status: 'cancelled' });
      setCancellingOrder(null);
      toast({ title: "Order Cancelled", description: `Order ${cancellingOrder.orderNumber} has been cancelled.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    }
  };

  return (
    <aside className="bg-white border-l flex flex-col h-full shadow-xl relative overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="px-6 pt-6 border-b bg-slate-50 flex-shrink-0">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="current" className="font-bold">Active Cart</TabsTrigger>
            <TabsTrigger value="held" className="font-bold">Held ({heldOrders.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <div className="flex-shrink-0 z-20 bg-white">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Current Order
              </h2>
              <Button variant="ghost" size="icon" onClick={onClearCart} className="text-slate-400 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            {existingTableOrder && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Table {selectedTable} has an active order</p>
                    <p className="text-xs text-amber-700">Items will merge into {existingTableOrder.orderNumber}</p>
                  </div>
                </div>
              </div>
            )}

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
                  <div className="max-h-[120px] overflow-y-auto p-1 border rounded-xl bg-slate-50">
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <button
                          key={num}
                          onClick={() => setSelectedTable(num)}
                          className={`h-9 text-xs font-bold rounded-lg border transition-all ${
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
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 relative z-10 bg-white">
            <div className="p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 flex-1">{item.name}</span>
                      <span className="font-bold text-slate-900 ml-4">Rs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-50" onClick={() => onUpdateQuantity(item.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-50" onClick={() => onUpdateQuantity(item.id, 1)}>
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
          </div>

          <div className="flex-shrink-0 p-6 bg-slate-50 border-t space-y-4 z-20">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-500 text-sm">
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
                disabled={cart.length === 0 || (isDineIn && !selectedTable)}
              >
                Hold Order
              </Button>
              <Button
                className="h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
                onClick={() => handleCharge()}
                disabled={cart.length === 0 || (isDineIn && !selectedTable)}
              >
                Charge Order
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="held" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <div className="p-6 border-b flex items-center justify-between flex-shrink-0 bg-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-500" />
              Held Orders
            </h2>
          </div>
          <ScrollArea className="flex-1 p-6 bg-white">
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
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl"
                        onClick={() => setCancellingOrder(order)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                        onClick={() => handleCharge(order)}
                      >
                        Charge
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
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
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
            <Button variant="ghost" onClick={() => { setIsPaymentModalOpen(false); setChargingOrder(null); }} className="w-full text-slate-500">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Order Complete</DialogTitle>
            <DialogDescription>Your order has been processed successfully.</DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center bg-white">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Order Complete!</h2>
            <p className="text-slate-500 mb-6 font-medium">
              Order <span className="text-slate-900 font-bold">#{lastProcessedOrder?.orderNumber}</span> has been processed successfully.
            </p>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Total Amount</p>
              <h3 className="text-4xl font-black text-orange-600">Rs {lastProcessedOrder?.total.toFixed(2)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-14 rounded-xl border-slate-200 font-bold text-slate-600"
                onClick={closeSuccessModal}
              >
                Done
              </Button>
              <Button
                className="h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                onClick={() => {
                  if (lastProcessedOrder) printReceipt(lastProcessedOrder);
                  closeSuccessModal();
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={!!cancellingOrder} onOpenChange={() => setCancellingOrder(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-red-500 text-white">
            <DialogTitle className="text-xl font-bold">Cancel Order?</DialogTitle>
            <DialogDescription className="text-red-100">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="text-slate-600 mb-2">You are about to cancel:</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="font-bold text-slate-900">{cancellingOrder?.orderNumber}</p>
              <p className="text-sm text-slate-500">
                {cancellingOrder?.type === 'dine_in' ? `Dine-In (Table ${cancellingOrder?.tableNumber})` : 'Takeaway'} • {cancellingOrder?.items?.length} items
              </p>
              <p className="font-bold text-orange-600 mt-1">Rs {cancellingOrder?.total?.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 rounded-xl font-bold" onClick={() => setCancellingOrder(null)}>Keep Order</Button>
              <Button className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold" onClick={handleCancelOrder}>Yes, Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}