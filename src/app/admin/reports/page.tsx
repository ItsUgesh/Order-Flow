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

    // Fetch paid orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      where('status', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );
    const ordersSnap = await getDocs(ordersQuery);
    setReportData(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch expenses for that day
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

      // Header
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

      // Summary
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

      // Expenses Table
      if (expenses.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('EXPENSES', 15, 118);

        const expenseTableData = expenses.map(e => [
          e.name,
          e.category,
          e.createdAt?.seconds ? format(new Date(e.createdAt.seconds * 1000), 'hh:mm a') : '-',
          `Rs ${e.amount?.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: 124,
          head: [['Name', 'Category', 'Time', 'Amount']],
          body: expenseTableData,
          headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 15, right: 15 },
          styles: { fontSize: 9, cellPadding: 3 }
        });
      }

      // Orders Table
      const expenseTableEndY = (doc as any).lastAutoTable?.finalY || 124;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('ORDER DETAILS', 15, expenseTableEndY + 15);

      const tableData = reportData.map(order => [
        order.orderNumber,
        order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a') : '-',
        order.type.replace('_', ' ').toUpperCase(),
        `Rs ${order.total.toFixed(2)}`,
        order.paymentMethod ? order.paymentMethod.toUpperCase() : '-'
      ]);

      autoTable(doc, {
        startY: expenseTableEndY + 22,
        head: [['Order #', 'Time', 'Type', 'Amount', 'Payment']],
        body: tableData,
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Sales Report</h1>
          <p className="text-slate-500">Detailed financial analysis for a specific day.</p>
        </div>

        <div className="flex items-center gap-3">
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

          <Button
            onClick={handleDownloadPDF}
            disabled={loading || reportData.length === 0 || isExporting}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
              <span className="text-white/80 text-sm font-bold">Total Revenue</span>
            </div>
            <h3 className="text-3xl font-black">Rs {stats.total.toFixed(2)}</h3>
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
            <h3 className="text-3xl font-black text-slate-900">Rs {stats.cash.toFixed(2)}</h3>
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
            <h3 className="text-3xl font-black text-slate-900">Rs {stats.online.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Expenses + Profit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-2 border-red-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className="text-slate-400 text-sm font-bold">Total Expenses</span>
            </div>
            <h3 className="text-3xl font-black text-red-600">Rs {totalExpenses.toFixed(2)}</h3>
            <p className="text-slate-400 text-xs mt-2">{expenses.length} expense entries</p>
          </CardContent>
        </Card>

        <Card className={`rounded-2xl border-2 shadow-sm ${isProfit ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${isProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-slate-400 text-sm font-bold">Net Profit</span>
            </div>
            <h3 className={`text-3xl font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              Rs {profit.toFixed(2)}
            </h3>
            <p className={`text-xs mt-2 font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '✓ Profitable day' : '✗ Loss today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Expenses Breakdown</h2>
            <Badge className="bg-red-100 text-red-700 border-none">{expenses.length} Entries</Badge>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(expense => (
                <TableRow key={expense.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-900">{expense.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 capitalize">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {expense.createdAt?.seconds
                      ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-black text-red-600">
                    Rs {expense.amount?.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
          <Badge variant="secondary" className="bg-slate-100 text-slate-500">
            {reportData.length} Records Found
          </Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                  <p className="text-slate-400 mt-2">Loading report data...</p>
                </TableCell>
              </TableRow>
            ) : reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                  No sales recorded for this day.
                </TableCell>
              </TableRow>
            ) : (
              reportData.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-900">{order.orderNumber}</TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {order.createdAt?.seconds
                      ? format(new Date(order.createdAt.seconds * 1000), 'hh:mm a')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px] tracking-wide">
                      {order.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {order.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    Rs {order.total.toFixed(2)}
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