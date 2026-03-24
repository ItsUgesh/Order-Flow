"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import PrintableReceipt from '@/components/pos/PrintableReceipt';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  useEffect(() => {
    // Fetch all orders except cancelled — filter client side for flexibility
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Remove cancelled orders completely from order history
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
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Date filter
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
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Paid</Badge>;
      case 'on_hold':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">On Hold</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none capitalize">{status}</Badge>;
    }
  };

  const DateFilterButton = ({ value, label }: { value: string; label: string }) => (
    <Button
      variant={dateFilter === value ? 'default' : 'outline'}
      onClick={() => setDateFilter(value)}
      className={cn(
        "rounded-xl font-bold px-6",
        dateFilter === value
          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-orange-500/20"
          : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
      )}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-8">
      <PrintableReceipt order={printOrder} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order History</h1>
            <p className="text-slate-500">Track and review all processed transactions.</p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white border-slate-200 rounded-xl h-11 font-bold">
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

        <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <DateFilterButton value="today" label="Today" />
          <DateFilterButton value="week" label="This Week" />
          <DateFilterButton value="month" label="This Month" />
          <DateFilterButton value="all" label="All Time" />
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
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400">
                  No orders found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">{order.orderNumber}</TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {order.createdAt?.seconds
                      ? format(new Date(order.createdAt.seconds * 1000), 'MMM dd, HH:mm')
                      : 'Recently'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {order.type?.replace('_', ' ')} {order.tableNumber && `(T${order.tableNumber})`}
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
                  <TableCell className="font-black text-slate-900">
                    Rs {order.total?.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(order)}
                      className="text-slate-400 hover:text-orange-600"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredOrders.length > 0 && (
          <div className="p-6 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-medium order-2 sm:order-1">
              Showing{' '}
              <span className="text-slate-900 font-bold">
                {Math.min(filteredOrders.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}
              </span>{' '}
              -{' '}
              <span className="text-slate-900 font-bold">
                {Math.min(filteredOrders.length, currentPage * ITEMS_PER_PAGE)}
              </span>{' '}
              of{' '}
              <span className="text-slate-900 font-bold">{filteredOrders.length}</span> orders
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg h-9 w-9 border-slate-200 bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-slate-300 px-1">...</span>
                      )}
                      <Button
                        variant={currentPage === p ? 'default' : 'ghost'}
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          "h-9 w-9 p-0 rounded-lg font-bold transition-all",
                          currentPage === p
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                            : "text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {p}
                      </Button>
                    </div>
                  ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-lg h-9 w-9 border-slate-200 bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}