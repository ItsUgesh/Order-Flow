"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export default function MenuGrid({ onAddItem }: { onAddItem: (item: MenuItem) => void }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Beverages', 'Bakery', 'Food', 'Desserts'];

  useEffect(() => {
    const q = query(collection(db, 'menuItems'), where('available', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menuData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setItems(menuData);
    });
    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 overflow-hidden">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-fit">
            <TabsList className="bg-white border rounded-xl p-1 h-12">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="rounded-lg px-6 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
        {filteredItems.map(item => (
          <Card key={item.id} className="group overflow-hidden border-slate-200 rounded-2xl bg-white hover:shadow-lg transition-all border-none shadow-sm flex flex-col">
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                  {item.category}
                </Badge>
                <span className="font-bold text-orange-600">NPR {(item.price).toFixed(2)}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex-1 line-clamp-2">{item.name}</h3>
              <Button 
                onClick={() => onAddItem(item)}
                className="w-full bg-slate-900 hover:bg-orange-600 text-white rounded-xl transition-colors group-hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}