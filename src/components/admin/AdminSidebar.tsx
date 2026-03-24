"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  History, 
  BarChart3, 
  Users, 
  LogOut,
  Coffee,
  Calculator,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'POS / New Order', icon: Calculator, href: '/pos' },
  { label: 'Menu Items', icon: UtensilsCrossed, href: '/admin/menu' },
  { label: 'Order History', icon: History, href: '/admin/orders' },
  { label: 'Sales Report', icon: BarChart3, href: '/admin/reports' },
  { label: 'Expenses', icon: Wallet, href: '/admin/expenses' },
  { label: 'Staff Management', icon: Users, href: '/admin/staff' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="w-72 bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="p-2 bg-orange-500 rounded-xl">
          <Coffee className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">Cafe Compass</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              pathname === item.href
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-orange-400"
            )} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout System
        </button>
      </div>
    </div>
  );
}