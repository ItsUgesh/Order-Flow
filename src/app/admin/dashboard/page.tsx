"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Receipt, 
  IndianRupee, 
  Timer, 
  Utensils,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import PrintableReceipt from '@/components/pos/PrintableReceipt';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    onHold: 0,
    totalItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

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
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid') revenue += data.total;
        if (data.status === 'on_hold') holdCount++;
      });
      setStats(prev => ({ ...prev, totalOrders: snapshot.size, revenue, onHold: holdCount }));
      setRecentOrders(snapshot.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() })));
    });

    const qItems = query(collection(db, 'menuItems'));
    getDocs(qItems).then(snap => {
      setStats(prev => ({ ...prev, totalItems: snap.size }));
    });

    return () => unsubscribeOrders();
  }, []);

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const statCards = [
    { label: 'Total Orders Today', value: stats.totalOrders, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Total Revenue Today', value: `Rs ${stats.revenue.toFixed(2)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'On-Hold Orders', value: stats.onHold, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Total Menu Items', value: stats.totalItems, icon: Utensils, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="space-y-8">
      <PrintableReceipt order={printOrder} />
      
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, manager. Here is your daily summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className={`rounded-2xl border-2 ${stat.border} shadow-sm overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-400">
                  Daily
                </Badge>
              </div>
              <p className="text-slate-500 font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
          <Badge variant="outline" className="text-slate-500">Last 10 orders</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400">No orders recorded yet today.</TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">{order.orderNumber}</TableCell>
                  <TableCell className="text-slate-500">
                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : 'Just now'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize bg-slate-100">
                      {order.type.replace('_', ' ')} {order.tableNumber && `(T${order.tableNumber})`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">Rs {order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={order.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none'}>
                      {order.status === 'paid' ? 'Paid' : 'On Hold'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button 
                      onClick={() => handlePrint(order)}
                      className="text-orange-600 hover:text-orange-800 font-bold text-sm flex items-center gap-1 ml-auto"
                    >
                      Print <Printer className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
