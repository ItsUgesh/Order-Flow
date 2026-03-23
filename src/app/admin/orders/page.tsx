"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import PrintableReceipt from '@/components/pos/PrintableReceipt';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    if (statusFilter !== 'all') {
      q = query(collection(db, 'orders'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [statusFilter]);

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="space-y-8">
      <PrintableReceipt order={printOrder} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order History</h1>
          <p className="text-slate-500">Track and review all processed transactions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white border-slate-200 rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400">No orders found matching criteria.</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">{order.orderNumber}</TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM dd, HH:mm') : 'Recently'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {order.type.replace('_', ' ')} {order.tableNumber && `(T${order.tableNumber})`}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="text-xs text-slate-600 line-clamp-1">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.paymentMethod ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        {order.paymentMethod}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-black text-slate-900">Rs {order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={order.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none'}>
                      {order.status === 'paid' ? 'Paid' : 'On Hold'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePrint(order)}
                        className="text-slate-400 hover:text-orange-600"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    )}
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
