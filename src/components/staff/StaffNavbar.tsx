"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, LogOut, User, ShoppingCart, History, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'POS', icon: ShoppingCart, href: '/pos' },
  { label: 'Orders', icon: History, href: '/staff/orders' },
  { label: 'Expenses', icon: Receipt, href: '/staff/expenses' },
];

export default function StaffNavbar({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      {/* Top row */}
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-500 rounded-lg text-white">
            <Coffee className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Cafe Compass</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>{profile?.name || 'Staff'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 px-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Logout</span>
          </Button>
        </div>
      </div>

      {/* Nav row */}
      <div className="px-4 pb-2 flex items-center gap-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              pathname === item.href
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}