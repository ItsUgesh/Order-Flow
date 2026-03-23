"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { profile, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile) {
        if (profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/pos');
        }
      }
    }
  }, [loading, user, profile, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-8 bg-slate-950">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-3/4 mx-auto bg-slate-800" />
        <Skeleton className="h-4 w-full bg-slate-800" />
        <Skeleton className="h-4 w-5/6 bg-slate-800" />
      </div>
    </div>
  );
}