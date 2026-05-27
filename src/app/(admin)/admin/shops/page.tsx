'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { setAdminShopOverride } from '@/lib/use-shop-id';
import { NAGPUR_AREAS } from '@/lib/types';
import type { Shop, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Store, Plus, Trash2, UserPlus, Loader2, ExternalLink } from 'lucide-react';

export default function ShopsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopAdmins, setShopAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({ name: '', address: '', area: '', phone: '' });
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', phone: '' });
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [shRes, saRes] = await Promise.all([
      supabase.from('shops').select('*').order('name'),
      supabase.from('users').select('*').eq('role', 'shop_admin'),
    ]);
    setShops(shRes.data || []);
    setShopAdmins(saRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  const getShopAdmin = (shopId: string) => shopAdmins.find(sa => sa.shop_id === shopId);

  const addShop = async () => {
    if (!shopForm.name.trim()) { toast.error('Name required'); return; }
    await supabase.from('shops').insert({ name: shopForm.name, address: shopForm.address || null, area: shopForm.area || null, phone: shopForm.phone || null, is_active: true });
    toast.success('Shop added');
    setAddDialog(false);
    setShopForm({ name: '', address: '', area: '', phone: '' });
    fetchData();
  };

  const deleteShop = async (shop: Shop) => {
    const { count } = await supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).not('status', 'in', '("delivered","cancelled")');
    if (count && count > 0) {
      toast.error(`Cannot delete — ${count} active repair(s) exist`);
      return;
    }
    if (!confirm(`Delete "${shop.name}"?`)) return;
    await supabase.from('shops').delete().eq('id', shop.id);
    toast.success('Shop deleted');
    fetchData();
  };

  const assignShopAdmin = async (shopId: string, adminId: string) => {
    await supabase.from('users').update({ shop_id: shopId }).eq('id', adminId);
    toast.success('Shop admin assigned');
    fetchData();
  };

  const inviteShopAdmin = async () => {
    if (!inviteDialog || !inviteForm.full_name || !inviteForm.email) { toast.error('Name and email required'); return; }
    setInviting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: inviteForm.email,
        email_confirm: true,
        user_metadata: { full_name: inviteForm.full_name },
      });
      if (authErr) {
        // Fallback: use signUp
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: inviteForm.email,
          password: Math.random().toString(36).slice(2) + 'Aa1!',
        });
        if (signUpErr) throw signUpErr;
        if (signUpData.user) {
          await supabase.from('users').upsert({
            id: signUpData.user.id,
            email: inviteForm.email,
            full_name: inviteForm.full_name,
            phone: inviteForm.phone,
            role: 'shop_admin',
            shop_id: inviteDialog.id,
            is_active: true,
          });
        }
      } else if (authData.user) {
        await supabase.from('users').upsert({
          id: authData.user.id,
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          phone: inviteForm.phone,
          role: 'shop_admin',
          shop_id: inviteDialog.id,
          is_active: true,
        });
      }
      toast.success('Shop admin invited — they will receive an email');
      setInviteDialog(null);
      setInviteForm({ full_name: '', email: '', phone: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to invite');
    }
    setInviting(false);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shops</h1>
          <p className="text-white/50 text-sm mt-1">Manage shop locations</p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4 mr-1" />Add Shop</Button>
      </motion.div>

      <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
          <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Address</TableHead>
            <TableHead className="text-white/50">Area</TableHead><TableHead className="text-white/50">Phone</TableHead>
            <TableHead className="text-white/50">Shop Admin</TableHead><TableHead className="text-white/50">Active</TableHead>
            <TableHead className="text-white/50">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>{shops.map(shop => {
            const admin = getShopAdmin(shop.id);
            return (
              <TableRow key={shop.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white font-medium flex items-center gap-2"><Store className="w-4 h-4 text-[#00D084]" />{shop.name}</TableCell>
                <TableCell className="text-white/60 text-xs max-w-[160px] truncate">{shop.address || '—'}</TableCell>
                <TableCell><Badge className="bg-white/10 text-white/60 text-[10px]">{shop.area || '—'}</Badge></TableCell>
                <TableCell className="text-white/60">{shop.phone || '—'}</TableCell>
                <TableCell>{admin ? (
                  <span className="text-[#00D084] text-xs">{admin.full_name}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={v => assignShopAdmin(shop.id, v)}>
                      <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white w-32"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-white/10">
                        {shopAdmins.filter(sa => !sa.shop_id).map(sa => <SelectItem key={sa.id} value={sa.id}>{sa.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => setInviteDialog(shop)} className="text-amber-400 hover:bg-amber-500/10 text-xs h-7"><UserPlus className="w-3 h-3 mr-1" />Invite</Button>
                  </div>
                )}</TableCell>
                <TableCell><Switch checked={shop.is_active} onCheckedChange={async () => { await supabase.from('shops').update({ is_active: !shop.is_active }).eq('id', shop.id); fetchData(); }} /></TableCell>
                <TableCell className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-[#00D084] hover:bg-[#00D084]/10 text-xs" onClick={() => { setAdminShopOverride(shop.id); router.push('/shop-admin'); }}><ExternalLink className="w-3 h-3 mr-1" />Manage</Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={() => deleteShop(shop)}><Trash2 className="w-3 h-3" /></Button>
                </TableCell>
              </TableRow>
            );
          })}</TableBody></Table>
        )}
      </CardContent></Card>

      {/* Add Shop Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Add Shop</DialogTitle><DialogDescription className="text-white/50">Create a new shop location</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/60">Name *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-white/60">Address</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={shopForm.address} onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label className="text-white/60">Area</Label>
              <Select value={shopForm.area} onValueChange={v => setShopForm(f => ({ ...f, area: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">{NAGPUR_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/60">Phone</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={shopForm.phone} onChange={e => setShopForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addShop} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">Add Shop</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Shop Admin Dialog */}
      <Dialog open={!!inviteDialog} onOpenChange={() => setInviteDialog(null)}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Invite Shop Admin</DialogTitle><DialogDescription className="text-white/50">For: {inviteDialog?.name}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/60">Full Name *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={inviteForm.full_name} onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div><Label className="text-white/60">Email *</Label><Input type="email" className="bg-white/5 border-white/10 text-white mt-1" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-white/60">Phone</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={inviteShopAdmin} disabled={inviting} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">{inviting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}Invite</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
