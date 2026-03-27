"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, IndianRupee, PieChart, TrendingUp, Download, Loader2, TrendingDown, Wallet } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SalesReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = async (selectedDate: Date) => {
    setLoading(true);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      where('status', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );
    const ordersSnap = await getDocs(ordersQuery);
    setReportData(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc')
    );
    const expensesSnap = await getDocs(expensesQuery);
    setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = stats.total - totalExpenses;
  const isProfit = profit >= 0;

  const handleDownloadPDF = async () => {
    if (reportData.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(22);
      doc.setTextColor(249, 115, 22);
      doc.text('JP Food and Tandoori', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(100);
      doc.text('Daily Sales Report', pageWidth / 2, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Date: ${format(date, 'dd/MM/yyyy')}`, pageWidth / 2, 38, { align: 'center' });
      doc.setDrawColor(200);
      doc.line(15, 45, pageWidth - 15, 45);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 15, 55);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Orders:', 15, 65);
      doc.text(`${reportData.length}`, 80, 65);
      doc.text('Total Revenue:', 15, 72);
      doc.text(`Rs ${stats.total.toFixed(2)}`, 80, 72);
      doc.text('Cash Revenue:', 15, 79);
      doc.text(`Rs ${stats.cash.toFixed(2)}`, 80, 79);
      doc.text('Online Revenue:', 15, 86);
      doc.text(`Rs ${stats.online.toFixed(2)}`, 80, 86);
      doc.text('Total Expenses:', 15, 93);
      doc.text(`Rs ${totalExpenses.toFixed(2)}`, 80, 93);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isProfit ? 0 : 200, isProfit ? 150 : 0, 0);
      doc.text('Net Profit:', 15, 100);
      doc.text(`Rs ${profit.toFixed(2)}`, 80, 100);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      doc.line(15, 108, pageWidth - 15, 108);

      if (expenses.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('EXPENSES', 15, 118);
        autoTable(doc, {
          startY: 124,
          head: [['Name', 'Category', 'Time', 'Amount']],
          body: expenses.map(e => [e.name, e.category, e.createdAt?.seconds ? format(new Date(e.createdAt.seconds * 1000), 'hh:mm a') : '-', `Rs ${e.amount?.toFixed(2)}`]),
          headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 15, right: 15 },
          styles: { fontSize: 9, cellPadding: 3 }
        });
      }

      const expenseTableEndY = (doc as any).lastAutoTable?.finalY || 124;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('ORDER DETAILS', 15, expenseTableEndY + 15);
      autoTable(doc, {
        startY: expenseTableEndY + 22,
        head: [['Order #', 'Time', 'Type', 'Amount', 'Payment']],
        body: reportData.map(order => [order.orderNumber, order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : '-', order.type.replace('_', ' ').toUpperCase(), `Rs ${order.total.toFixed(2)}`, order.paymentMethod ? order.paymentMethod.toUpperCase() : '-']),
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, finalY + 20, { align: 'center' });
      doc.save(`sales-report-${format(date, 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Daily Sales Report</h1>
          <p className="text-slate-500 text-sm">Detailed financial analysis for a specific day.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-bold rounded-xl h-10 border-slate-200 text-sm">
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleDownloadPDF}
            disabled={loading || reportData.length === 0 || isExporting}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-10 px-4 text-sm shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Revenue Stats — 2 col on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-none shadow-sm bg-orange-500 text-white col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-white/80 text-xs font-bold">Total Revenue</span>
            </div>
            <h3 className="text-2xl font-black">Rs {stats.total.toFixed(2)}</h3>
            <p className="text-white/60 text-xs mt-1">{reportData.length} Orders</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-slate-400 text-xs font-bold">Cash</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">Rs {stats.cash.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <PieChart className="w-4 h-4" />
              </div>
              <span className="text-slate-400 text-xs font-bold">Online</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">Rs {stats.online.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Expenses + Profit — 2 col on mobile too */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-2 border-red-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-slate-400 text-xs font-bold">Expenses</span>
            </div>
            <h3 className="text-xl font-black text-red-600">Rs {totalExpenses.toFixed(2)}</h3>
            <p className="text-slate-400 text-xs mt-1">{expenses.length} entries</p>
          </CardContent>
        </Card>

        <Card className={`rounded-2xl border-2 shadow-sm ${isProfit ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${isProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-slate-400 text-xs font-bold">Net Profit</span>
            </div>
            <h3 className={`text-xl font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              Rs {profit.toFixed(2)}
            </h3>
            <p className={`text-xs mt-1 font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '✓ Profitable' : '✗ Loss'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Breakdown */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Expenses Breakdown</h2>
            <Badge className="bg-red-100 text-red-700 border-none text-xs">{expenses.length} Entries</Badge>
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-slate-500 font-bold text-xs">Name</th>
                  <th className="text-left p-3 text-slate-500 font-bold text-xs">Category</th>
                  <th className="text-left p-3 text-slate-500 font-bold text-xs">Time</th>
                  <th className="text-right p-3 text-slate-500 font-bold text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{expense.name}</td>
                    <td className="p-3"><Badge variant="secondary" className="bg-slate-100 capitalize text-xs">{expense.category}</Badge></td>
                    <td className="p-3 text-slate-500 text-xs">{expense.createdAt?.seconds ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a') : '-'}</td>
                    <td className="p-3 text-right font-black text-red-600">Rs {expense.amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-slate-50">
            {expenses.map(expense => (
              <div key={expense.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{expense.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="bg-slate-100 capitalize text-[10px]">{expense.category}</Badge>
                    <span className="text-xs text-slate-400">{expense.createdAt?.seconds ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a') : '-'}</span>
                  </div>
                </div>
                <p className="font-black text-red-600 text-sm">Rs {expense.amount?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Order Details</h2>
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">{reportData.length} Records</Badge>
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Order #</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Time</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Type</th>
                <th className="text-left p-3 text-slate-500 font-bold text-xs">Payment</th>
                <th className="text-right p-3 text-slate-500 font-bold text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No sales recorded for this day.</td></tr>
              ) : (
                reportData.map((order) => (
                  <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="p-3 text-slate-500 text-xs">{order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : '-'}</td>
                    <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{order.type.replace('_', ' ')}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className="capitalize text-[10px]">{order.paymentMethod}</Badge></td>
                    <td className="p-3 text-right font-black text-slate-900">Rs {order.total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></div>
          ) : reportData.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No sales recorded for this day.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {reportData.map((order) => (
                <div key={order.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{order.orderNumber}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="capitalize text-[10px]">{order.type.replace('_', ' ')}</Badge>
                      <Badge variant="secondary" className="capitalize text-[10px]">{order.paymentMethod}</Badge>
                      <span className="text-xs text-slate-400">{order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : '-'}</span>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 text-sm">Rs {order.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}