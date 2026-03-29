"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Expenses</h1>
        <p className="text-slate-500 text-sm">Record daily expenses.</p>
      </div>

      {/* Add Expense Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-500" />
          Add Expense
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Expense name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl border-slate-200 h-10 text-sm col-span-2 sm:col-span-1"
            />
            <Input
              placeholder="Amount (Rs)"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="rounded-xl border-slate-200 h-10 text-sm col-span-2 sm:col-span-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl border-slate-200 h-10 font-medium text-sm">
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
              className="h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 text-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Date + Total */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-700 text-sm whitespace-nowrap">View Date:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border-slate-200 h-10 font-medium text-sm flex-1 sm:w-44"
          />
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-black text-red-600">Rs {totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400 text-sm">
                    No expenses recorded for this date.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{expense.name}</td>
                    <td className="p-3">
                      <Badge className={`${getCategoryColor(expense.category)} border-none text-xs`}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {expense.createdAt?.seconds ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a') : 'Just now'}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      Rs {expense.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden">
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No expenses recorded for this date.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredExpenses.map(expense => (
                <div key={expense.id} className="p-3 pb-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{expense.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge className={`${getCategoryColor(expense.category)} border-none text-[10px]`}>
                        {expense.category}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {expense.createdAt?.seconds
                          ? format(new Date(expense.createdAt.seconds * 1000), 'hh:mm a')
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 text-sm">Rs {expense.amount?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}