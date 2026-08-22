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
  X,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleNavClick = () => setIsOpen(false);

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Too Short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "New password and confirm password must match.", variant: "destructive" });
      return;
    }

    setIsChanging(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user logged in");

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Then update password
      await updatePassword(user, newPassword);

      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast({ title: "Wrong Password", description: "Your current password is incorrect.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to change password. Try again.", variant: "destructive" });
      }
    } finally {
      setIsChanging(false);
    }
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

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 w-72",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl">
              <img src="/favicon.svg" alt="Order Flow Logo" className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold tracking-tight">Order Flow Management</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
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

        <div className="p-4 border-t border-slate-900 space-y-1">
          {/* Change Password button */}
          <button
            onClick={() => { setIsPasswordModalOpen(true); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <KeyRound className="w-5 h-5" />
            Change Password
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout System
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-400" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              Enter your current password then choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-400">Minimum 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="rounded-xl border-slate-200"
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                onClick={handleChangePassword}
                disabled={isChanging}
              >
                {isChanging ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}