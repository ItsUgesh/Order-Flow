"use client";

import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/pos');
      }
    }
  }, [loading, user, profile, router]);

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-72">
      <AdminSidebar />
      {/* Top bar for mobile — gives space for hamburger button */}
      <div className="lg:hidden h-14 bg-white border-b flex items-center px-16 shadow-sm">
        <span className="font-bold text-slate-900">JP Foods and Bhansha Ghar</span>
      </div>
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}