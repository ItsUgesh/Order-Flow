"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Coffee, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.inactive) {
          await auth.signOut();
          toast({
            title: "Access Denied",
            description: "Account deactivated. Contact admin.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Logged in as ${userData.name}`,
        });

        if (userData.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/pos');
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-500 rounded-full text-white shadow-lg shadow-orange-500/20">
              <img src="/favicon.svg" alt="Order Flow Logo" className="w-10 h-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Order Flow</CardTitle>
          <CardDescription className="text-slate-500">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Try admin123" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 rounded-xl transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
         <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-center text-slate-600">
  <p className="text-slate-500 mb-2 text-xs">This is a demo site. Feel free to explore!</p>
  <div className="space-y-1">
    <p className="text-xs text-slate-400 font-semibold">Admin</p>
    <p>Email: <span className="font-mono font-medium">admin@orderflow.com</span></p>
    <p>Password: <span className="font-mono font-medium">admin123</span></p>
  </div>
  <div className="space-y-1 mt-2 pt-2 border-t border-orange-200">
    <p className="text-xs text-slate-400 font-semibold">Staff</p>
    <p>Email: <span className="font-mono font-medium">staff@orderflow.com</span></p>
    <p>Password: <span className="font-mono font-medium">staff123</span></p>
  </div>
</div>
        </CardContent>
      </Card>
    </div>
  );
}