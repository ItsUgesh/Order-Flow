"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import PrintableReceipt from '@/components/pos/PrintableReceipt';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(all.filter((o: any) => o.status !== 'cancelled'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let dateLimit: Date | null = null;
    if (dateFilter === 'today') dateLimit = startOfDay(now);
    else if (dateFilter === 'week') dateLimit = startOfWeek(now, { weekStartsOn: 1 });
    else if (dateFilter === 'month') dateLimit = startOfMonth(now);

    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (dateLimit) {
        if (!order.createdAt?.seconds) return true;
        const orderDate = new Date(order.createdAt.seconds * 1000);
        return isAfter(orderDate, dateLimit) || orderDate.getTime() === dateLimit.getTime();
      }
      return true;
    });
  }, [orders, dateFilter, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => window.print(), 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-xs">Paid</Badge>;
      case 'on_hold': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-xs">On Hold</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 border-none capitalize text-xs">{status}</Badge>;
    }
  };

  const DateFilterButton = ({ value, label }: { value: string; label: string }) => (
    <Button
      variant={dateFilter === value ? 'default' : 'outline'}
      onClick={() => setDateFilter(value)}
      size="sm"
      className={cn(
        "rounded-xl font-bold px-3 md:px-5 text-xs",
        dateFilter === value
          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-orange-500/20"
          : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
      )}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-5">
      <PrintableReceipt order={printOrder} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Order History</h1>
            <p className="text-slate-500 text-sm">View and print all orders.</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white border-slate-200 rounded-xl h-10 font-bold text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-1.5 bg-slate-200/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto">
          <DateFilterButton value="today" label="Today" />
          <DateFilterButton value="week" label="This Week" />
          <DateFilterButton value="month" label="This Month" />
          <DateFilterButton value="all" label="All Time" />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Order #</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Date & Time</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Type</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Items</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Payment</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Total</th>
              <th className="text-left p-3 text-slate-500 font-bold text-xs">Status</th>
              <th className="text-right p-3 text-slate-500 font-bold text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-slate-400 text-sm">
                  No orders found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{order.orderNumber}</td>
                  <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM dd, HH:mm') : 'Recently'}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize text-xs">
                      {order.type?.replace('_', ' ')} {order.tableNumber && `(T${order.tableNumber})`}
                    </Badge>
                  </td>
                  <td className="p-3 max-w-[180px]">
                    <span className="text-xs text-slate-600 line-clamp-1">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </td>
                  <td className="p-3">
                    {order.paymentMethod ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        {order.paymentMethod}
                      </Badge>
                    ) : '-'}
                  </td>
                  <td className="p-3 font-black text-slate-900">Rs {order.total?.toFixed(2)}</td>
                  <td className="p-3">{getStatusBadge(order.status)}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(order)} className="text-slate-400 hover:text-orange-600 h-8 w-8">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No orders found matching criteria.
          </div>
        ) : (
          paginatedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM dd, HH:mm') : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <Button variant="ghost" size="icon" onClick={() => handlePrint(order)} className="text-slate-400 hover:text-orange-600 h-8 w-8">
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-600 mb-2 line-clamp-2">
                {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {order.type?.replace('_', ' ')} {order.tableNumber && `T${order.tableNumber}`}
                  </Badge>
                  {order.paymentMethod && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black">
                      {order.paymentMethod}
                    </Badge>
                  )}
                </div>
                <p className="font-black text-slate-900 text-sm">Rs {order.total?.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium order-2 sm:order-1">
            Showing{' '}
            <span className="text-slate-900 font-bold">{Math.min(filteredOrders.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span>
            {' '}-{' '}
            <span className="text-slate-900 font-bold">{Math.min(filteredOrders.length, currentPage * ITEMS_PER_PAGE)}</span>
            {' '}of{' '}
            <span className="text-slate-900 font-bold">{filteredOrders.length}</span>
          </p>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg h-8 w-8 border-slate-200 bg-white">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 text-xs">...</span>}
                    <Button
                      variant={currentPage === p ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage(p)}
                      className={cn("h-8 w-8 p-0 rounded-lg font-bold text-xs transition-all",
                        currentPage === p ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" : "text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg h-8 w-8 border-slate-200 bg-white">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}