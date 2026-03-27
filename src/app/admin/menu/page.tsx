"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Sparkles, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMenuDescription } from '@/ai/flows/generate-menu-description';
import { Textarea } from '@/components/ui/textarea';

export default function MenuManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    available: true,
    description: ''
  });

  useEffect(() => {
    const qItems = query(collection(db, 'menuItems'), orderBy('createdAt', 'desc'));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qCats = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribeItems(); unsubscribeCats(); };
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const exists = categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
    if (exists) {
      toast({ title: "Duplicate Category", description: "This category already exists.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, 'categories'), { name: newCategoryName.trim(), createdAt: serverTimestamp() });
      setNewCategoryName('');
      toast({ title: "Category Added", description: `"${newCategoryName}" created successfully.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (category: any) => {
    const isUsed = items.some(item => item.category === category.name);
    if (isUsed) {
      const count = items.filter(item => item.category === category.name).length;
      toast({ title: "Cannot Delete", description: `Cannot delete — ${count} menu items use this category.`, variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'categories', category.id));
        toast({ title: "Category Deleted" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
      }
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, category: item.category, price: item.price.toString(), available: item.available, description: item.description || '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: categories.length > 0 ? categories[0].name : '', price: '', available: true, description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, price: parseFloat(formData.price), updatedAt: serverTimestamp() };
      if (editingItem) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), data);
        toast({ title: "Updated", description: "Menu item updated successfully" });
      } else {
        await addDoc(collection(db, 'menuItems'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Created", description: "Menu item created successfully" });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteDoc(doc(db, 'menuItems', id));
      toast({ title: "Deleted", description: "Item removed from menu" });
    }
  };

  const handleAiDescription = async () => {
    if (!formData.name || !formData.category) {
      toast({ title: "Input Required", description: "Please fill name and category first", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateMenuDescription({ name: formData.name, category: formData.category });
      setFormData(prev => ({ ...prev, description: res.description }));
      toast({ title: "Description Generated" });
    } catch (err) {
      toast({ title: "AI Error", description: "Could not generate description", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 text-sm">Create and organize your cafe's offerings.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-4 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Menu Item
        </Button>
      </div>

      {/* Category Management */}
      <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-4 md:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge key={cat.id} variant="secondary" className="bg-slate-100 text-slate-600 py-1.5 pl-3 pr-2 flex items-center gap-1">
                {cat.name}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} className="bg-slate-900 text-white rounded-xl px-4 shrink-0">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-slate-200 rounded-xl"
        />
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card key={item.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-xs">
                  {item.category}
                </Badge>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h3>
              <p className="text-xl font-black text-orange-600 mb-3">Rs {item.price.toFixed(2)}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-xs font-medium text-slate-500">Status</span>
                <Badge className={item.available ? 'bg-green-100 text-green-700 border-none text-xs' : 'bg-red-100 text-red-700 border-none text-xs'}>
                  {item.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-5 bg-slate-900 text-white sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-5 space-y-5 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Item Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Price (Rs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="avail"
                    checked={formData.available}
                    onCheckedChange={v => setFormData({ ...formData, available: v })}
                  />
                  <Label htmlFor="avail" className="text-slate-700 text-sm">Available</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 text-sm">AI Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiDescription}
                  disabled={isGenerating}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 h-7 text-xs font-bold rounded-lg"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  Generate
                </Button>
              </div>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deliciously crafted..."
                className="rounded-xl border-slate-200 min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-4 border-t gap-2 flex-col sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-6 w-full sm:w-auto">
                {editingItem ? 'Update Item' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}