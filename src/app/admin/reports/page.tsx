"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, IndianRupee, PieChart, TrendingUp } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function SalesReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (selectedDate: Date) => {
    setLoading(true);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      where('status', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    setReportData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  const stats = reportData.reduce((acc, curr) => {
    acc.total += curr.total;
    if (curr.paymentMethod === 'cash') acc.cash += curr.total;
    if (curr.paymentMethod === 'online') acc.online += curr.total;
    return acc;
  }, { total: 0, cash: 0, online: 0 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Sales Report</h1>
          <p className="text-slate-500">Detailed financial analysis for a specific day.</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start text-left font-bold rounded-xl h-12 border-slate-200">
              <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
              {format(date, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
              <span className="text-white/80 text-sm font-bold">Today's Revenue</span>
            </div>
            <h3 className="text-3xl font-black">NPR {stats.total.toFixed(2)}</h3>
            <p className="text-white/60 text-xs mt-2">{reportData.length} Completed Orders</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-slate-400 text-sm font-bold">Cash Collection</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900">NPR {stats.cash.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <PieChart className="w-6 h-6" />
              </div>
              <span className="text-slate-400 text-sm font-bold">Online Sales</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900">NPR {stats.online.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">No sales recorded for this day.</TableCell>
              </TableRow>
            ) : (
              reportData.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-900">{order.orderNumber}</TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 line-clamp-1">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {order.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    NPR {order.total.toFixed(2)}
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