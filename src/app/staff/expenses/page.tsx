"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Receipt } from 'lucide-react';
import { format, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Ingredients', 'Utilities', 'Staff', 'Rent', 'Equipment', 'Other'];

export default function StaffExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredExpenses = expenses.filter(expense => {
    if (!expense.createdAt?.seconds) return false;
    const expenseDate = new Date(expense.createdAt.seconds * 1000);
    const start = startOfDay(new Date(selectedDate));
    const end = endOfDay(new Date(selectedDate));
    return (isAfter(expenseDate, start) || expenseDate.getTime() === start.getTime()) &&
           (isBefore(expenseDate, end) || expenseDate.getTime() === end.getTime());
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: "Missing Name", description: "Please enter an expense name.", variant: "destructive" });
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        name: name.trim(),
        amount: Number(amount),
        category,
        createdAt: serverTimestamp()
      });
      setName('');
      setAmount('');
      setCategory('Ingredients');
      toast({ title: "Expense Added", description: `${name} — Rs ${amount} recorded.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
    }
    setLoading(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Ingredients': return 'bg-green-100 text-green-700';
      case 'Utilities': return 'bg-blue-100 text-blue-700';
      case 'Staff': return 'bg-purple-100 text-purple-700';
      case 'Rent': return 'bg-orange-100 text-orange-700';
      case 'Equipment': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Expenses</h1>
        <p className="text-slate-500">Record daily expenses.</p>
      </div>

      {/* Add Expense Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-orange-500" />
          Add Expense
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Expense name (e.g. Milk)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-xl border-slate-200 h-11"
          />
          <Input
            placeholder="Amount (Rs)"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="rounded-xl border-slate-200 h-11"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-slate-200 h-11 font-medium">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Date Picker + Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="font-bold text-slate-700">View Date:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border-slate-200 h-11 w-48 font-medium"
          />
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-6 py-3 flex items-center gap-3">
          <Receipt className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-black text-red-600">Rs {totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Expense Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                  No expenses recorded for this date.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map(expense => (
                <TableRow key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">{expense.name}</TableCell>
                  <TableCell>
                    <Badge className={`${getCategoryColor(expense.category)} border-none`}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {expense.createdAt?.seconds
                      ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a')
                      : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    Rs {expense.amount?.toFixed(2)}
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