"use client";

import { Coffee, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/auth-store';

export default function POSHeader({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500 rounded-lg text-white">
          <Coffee className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Cafe Compass</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span>{profile?.name || 'Staff'}</span>
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