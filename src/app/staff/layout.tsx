"use client";

import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import StaffNavbar from '@/components/staff/StaffNavbar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (profile && profile.role !== 'staff') router.push('/admin/dashboard');
    }
  }, [loading, user, profile, router]);

  if (loading || !profile || profile.role !== 'staff') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StaffNavbar profile={profile} />
      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}