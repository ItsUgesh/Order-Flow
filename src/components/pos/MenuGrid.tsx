"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export default function MenuGrid({ onAddItem }: { onAddItem: (item: MenuItem) => void }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const qCats = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(['All', ...snapshot.docs.map(doc => doc.data().name)]);
    });

    const qItems = query(collection(db, 'menuItems'), where('available', '==', true));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
    });

    return () => { unsubscribeCats(); unsubscribeItems(); };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Category tabs + search */}
      <div className="p-3 md:p-4 space-y-3 bg-white border-b">
        {/* Category tabs — scrollable */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 w-max">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 rounded-xl border-slate-200 h-9 text-sm"
          />
        </div>
      </div>

      {/* Menu items grid */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400 text-sm">
              No items found.
            </div>
          ) : (
            filteredItems.map(item => (
              <Card
                key={item.id}
                className="group overflow-hidden border-none rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1.5">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {item.category}
                    </Badge>
                    <span className="font-bold text-orange-600 text-xs">Rs {item.price.toFixed(2)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex-1 line-clamp-2">{item.name}</h3>
                  <Button
                    onClick={() => onAddItem(item)}
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-orange-600 text-white rounded-xl transition-colors text-xs h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}