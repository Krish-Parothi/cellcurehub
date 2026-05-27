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
  const [warranties, setWarranties] = useState(0);
  const [totalRepairs, setTotalRepairs] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('cellcurehub_default_address');
    if (saved) setEditAddress(saved);
  }, []);

  useEffect(() => {
    (async () => {
      // Active warranties: delivered within last 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { count: wCount } = await supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).in('status', ['delivered', 'done']).gte('delivered_at', ninetyDaysAgo);
      setWarranties(wCount || 0);
      // Total repairs
      const { count: tCount } = await supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('customer_id', user.id);
      setTotalRepairs(tCount || 0);
    })();
  }, [user.id]);

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
      <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">Profile & Settings</h1>

      <div className="glass rounded-2xl p-6 max-w-xl">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <Avatar className="h-16 w-16 border-2 border-[#00D084]/30">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
            <AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xl font-bold">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold">{user.full_name}</h3>
            <p className="text-white/40 text-sm capitalize">{user.role}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <Shield className="w-5 h-5 text-[#00D084] mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{warranties}</p>
            <p className="text-white/40 text-xs">Active Warranties</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Wrench className="w-5 h-5 text-[#00D084] mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{totalRepairs}</p>
            <p className="text-white/40 text-xs">Total Repairs</p>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname" className="text-white/70 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Full Name</Label>
            <Input id="pname" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-white/5 border-white/10 text-white focus-visible:ring-[#00D084]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pphone" className="text-white/70 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
            <Input id="pphone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pemail" className="text-white/70 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
            <Input id="pemail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-white/5 border-white/10 text-white focus-visible:ring-[#00D084]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paddr" className="text-white/70 flex items-center gap-1"><MapPin className="w-3 h-3" /> Default Address</Label>
            <Textarea id="paddr" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Your default pickup address..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[70px]" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gradient-green text-[#0A0A0A] font-semibold mt-2">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </motion.div>
  );
}
