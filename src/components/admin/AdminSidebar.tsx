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
  Wallet,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-1.5 bg-slate-800/70 text-slate-300 rounded-lg shadow-sm"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300",
        "w-72",
        // On mobile: slide in/out, on desktop: always visible
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl">
              <Coffee className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Cafe Compass</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                pathname === item.href
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-orange-400"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout System
          </button>
        </div>
      </div>
    </>
  );
}