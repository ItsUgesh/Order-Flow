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
  { label: 'Order History', icon: History, href: '/staff/orders' },
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
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg text-white">
            <Coffee className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Cafe Compass</h1>
        </div>

        {profile?.role === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            <Link href="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        )}

        {profile?.role === 'staff' && (
          <nav className="flex items-center gap-1">
            {staffNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span>{profile?.name || 'Staff'} ({profile?.role})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
