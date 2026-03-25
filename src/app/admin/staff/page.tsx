"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        role: 'staff',
        inactive: false,
        createdAt: serverTimestamp()
      });
      toast({ title: "Staff Created", description: "Account created successfully" });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        inactive: !user.inactive
      });
      toast({ title: "Status Updated", description: `${user.name} is now ${!user.inactive ? 'inactive' : 'active'}` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 text-sm">Manage access control and staff permissions.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-4 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold text-slate-900">{member.name}</TableCell>
                <TableCell className="text-slate-500 text-sm">{member.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {member.createdAt?.seconds ? format(new Date(member.createdAt.seconds * 1000), 'MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={!member.inactive ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'}>
                    {!member.inactive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(member)}
                    className={member.inactive ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}
                  >
                    {member.inactive ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldAlert className="w-4 h-4 mr-1" />}
                    {member.inactive ? 'Activate' : 'Deactivate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
              </div>
              <Badge className={!member.inactive ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'}>
                {!member.inactive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                <span className="text-xs text-slate-400">
                  {member.createdAt?.seconds ? format(new Date(member.createdAt.seconds * 1000), 'MMM dd, yyyy') : '-'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatus(member)}
                className={`text-xs h-8 px-3 ${member.inactive ? "text-green-600 hover:text-green-800 hover:bg-green-50" : "text-red-600 hover:text-red-800 hover:bg-red-50"}`}
              >
                {member.inactive ? <ShieldCheck className="w-3.5 h-3.5 mr-1" /> : <ShieldAlert className="w-3.5 h-3.5 mr-1" />}
                {member.inactive ? 'Activate' : 'Deactivate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl mx-4">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-400" />
              New Staff Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="p-6 space-y-4 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Full Name</Label>
                <Input
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  required
                  placeholder="john@cafe.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Initial Password</Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-2 flex-col sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-8 w-full sm:w-auto">
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}