"use client";

import { Coffee, LogOut, User, ArrowLeft, ShoppingCart, History, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@/lib/auth-store';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const staffNavItems = [
  { label: 'POS', icon: ShoppingCart, href: '/pos' },
  { label: 'Orders', icon: History, href: '/staff/orders' },
  { label: 'Expenses', icon: Receipt, href: '/staff/expenses' },
];

export default function POSHeader({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      {/* Main top row */}
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
         <img src="/favicon.svg" alt="Order Flow Logo" className="w-10 h-10" />
          <h1 className="text-lg font-bold text-slate-900">Order Flow</h1>
        </div>

        {/* Right side — user + logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">{profile?.name || 'Staff'} ({profile?.role})</span>
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

      {/* Second row — admin back button OR staff nav */}
      {profile?.role === 'admin' && (
        <div className="px-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-8 text-xs"
          >
            <Link href="/admin/dashboard">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      )}

      {profile?.role === 'staff' && (
        <div className="px-4 pb-2 flex items-center gap-1">
          {staffNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
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
      )}
    </header>
  );
}