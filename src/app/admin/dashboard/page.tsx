"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, IndianRupee, Timer, Utensils, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
      <p>Tel: 15927873</p>
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
      ${order.discountPercent > 0 ? `<div class="row"><span>Discount (${order.discountPercent}%):</span><span>- Rs ${order.discountAmount?.toFixed(2)}</span></div>` : ''}
      <div class="row bold" style="margin-top:4px"><span>Net Total:</span><span>Rs ${order.total?.toFixed(2)}</span></div>
      <div class="row" style="text-transform:capitalize;margin-top:4px"><span>Payment:</span><span>${order.paymentMethod || 'N/A'}</span></div>
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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    onHold: 0,
    totalItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const qOrders = query(
      collection(db, 'orders'),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      let revenue = 0;
      let holdCount = 0;
      let orderCount = 0;

      const allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

      allOrders.forEach(data => {
        if (data.status === 'cancelled') return;
        orderCount++;
        if (data.status === 'paid') revenue += data.total;
        if (data.status === 'on_hold') holdCount++;
      });

      setStats(prev => ({ ...prev, totalOrders: orderCount, revenue, onHold: holdCount }));

      const filtered = allOrders
        .filter(o => o.status !== 'cancelled')
        .slice(0, 10);
      setRecentOrders(filtered);
    });

    getDocs(query(collection(db, 'menuItems'))).then(snap => {
      setStats(prev => ({ ...prev, totalItems: snap.size }));
    });

    return () => unsubscribeOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-xs">Paid</Badge>;
      case 'on_hold': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-xs">On Hold</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-xs">Cancelled</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 border-none text-xs">{status}</Badge>;
    }
  };

  const statCards = [
    { label: 'Total Orders Today', value: stats.totalOrders, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Total Revenue Today', value: `Rs ${stats.revenue.toFixed(2)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'On-Hold Orders', value: stats.onHold, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Total Menu Items', value: stats.totalItems, icon: Utensils, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">Welcome back. Here is your daily summary.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className={`rounded-2xl border-2 ${stat.border} shadow-sm overflow-hidden`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[10px]">Daily</Badge>
              </div>
              <p className="text-slate-500 font-medium text-xs mb-1">{stat.label}</p>
              <h3 className="text-lg md:text-xl font-black text-slate-900">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
          <Badge variant="outline" className="text-slate-500 text-xs">Last 10 orders</Badge>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Order #</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Time</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Type</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Amount</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Status</th>
                <th className="text-right p-3 text-slate-500 font-bold text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    No orders recorded yet today.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="p-3 text-slate-500 text-xs">
                      {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : 'Just now'}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="capitalize bg-slate-100 text-xs">
                        {order.type?.replace('_', ' ')} {order.tableNumber && `(T${order.tableNumber})`}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold text-slate-900 text-sm">Rs {order.total?.toFixed(2)}</td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => printReceipt(order)}
                        className="text-orange-600 hover:text-orange-800 font-bold text-xs flex items-center gap-1 ml-auto"
                      >
                        Print <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No orders recorded yet today.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{order.orderNumber}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="capitalize bg-slate-100 text-[10px]">
                        {order.type?.replace('_', ' ')} {order.tableNumber && `T${order.tableNumber}`}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="font-black text-slate-900 text-sm">Rs {order.total?.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <button
                        onClick={() => printReceipt(order)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
