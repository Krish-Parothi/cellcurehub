'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Mail, Phone, MapPin, Shield, Wrench } from 'lucide-react';

export default function ProfileTab({ user }: { user: User }) {
  const [editName, setEditName] = useState(user.full_name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    const saved = localStorage.getItem('cellcurehub_default_address');
    if (saved) setEditAddress(saved);
  }, []);



  const handleSave = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const updates: Record<string, unknown> = { full_name: editName.trim() };
    if (editPhone.trim()) updates.phone = editPhone.trim();
    if (editEmail.trim()) updates.email = editEmail.trim();
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (error) toast.error('Failed to update profile');
    else {
      localStorage.setItem('cellcurehub_default_address', editAddress);
      toast.success('Profile updated!');
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Profile & Settings</h1>

      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 max-w-xl shadow-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E8E4DF]">
          <Avatar className="h-16 w-16 border-2 border-[#FF5C00]/30">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
            <AvatarFallback className="bg-[#FF5C00]/10 text-[#FF5C00] text-xl font-bold">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[#1A1A1A] font-semibold">{user.full_name}</h3>
            <p className="text-[#1A1A1A]/60 text-sm capitalize">{user.role}</p>
          </div>
        </div>



        <Separator className="bg-[#E8E4DF] mb-6" />

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname" className="text-[#1A1A1A]/70 flex items-center gap-1"><UserIcon className="w-3. h-3" /> Full Name</Label>
            <Input id="pname" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pphone" className="text-[#1A1A1A]/70 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
            <Input id="pphone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" className="bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pemail" className="text-[#1A1A1A]/70 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
            <Input id="pemail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paddr" className="text-[#1A1A1A]/70 flex items-center gap-1"><MapPin className="w-3 h-3" /> Default Address</Label>
            <Textarea id="paddr" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Your default pickup address..." className="bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[70px]" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold mt-2 w-full sm:w-auto">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </motion.div>
  );
}
