'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
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
  
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopAdmins, setShopAdmins] = useState<User[]>([]);
  
  const [addDialog, setAddDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({ name: '', address: '', area: '', phone: '' });
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    console.log('[ADMIN_SHOPS] fetchData started', new Date().toISOString());
    const [shopsRes, adminsRes] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'shop_admin')
    ]);
    
    if (shopsRes.error) console.error('[ADMIN_SHOPS] error fetching shops:', shopsRes.error);
    if (adminsRes.error) console.error('[ADMIN_SHOPS] error fetching admins:', adminsRes.error);

    console.log('[ADMIN_SHOPS] fetchData success, shops:', shopsRes.data?.length, 'admins:', adminsRes.data?.length, 'shopsData:', shopsRes.data);
    setShops(shopsRes.data || []);
    setShopAdmins(adminsRes.data || []);
  }, []);

  const { user, loading } = useAuthFetch(fetchData, { requiredRole: 'admin' });

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
    const { count, error: countErr } = await supabase.from('repairs')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .neq('status', 'delivered')
      .neq('status', 'cancelled');
      
    if (countErr) {
      toast.error('Failed to check repairs');
      return;
    }
      
    if (count && count > 0) {
      toast.error(`Cannot delete — ${count} active repair(s) exist. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete "${shop.name}"? This will unassign all staff and preserve historical data.`)) return;
    
    toast.loading('Deleting shop and updating records...', { id: 'deleteShop' });

    // Sever foreign keys manually to bypass constraint errors and preserve history
    await Promise.all([
      supabase.from('users').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('repairs').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('delivery_assignments').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('attendance').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('salary_config').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('parts').update({ shop_id: null }).eq('shop_id', shop.id),
      supabase.from('shop_items').update({ shop_id: null }).eq('shop_id', shop.id)
    ]);

    const { error } = await supabase.from('shops').delete().eq('id', shop.id);
    
    if (error) {
      toast.error(`Cannot delete shop: ${error.message}`, { id: 'deleteShop' });
      return;
    }
    
    toast.success('Shop deleted successfully', { id: 'deleteShop' });
    fetchData();
  };

  const assignShopAdmin = async (shopId: string, adminId: string) => {
    await supabase.from('users').update({ shop_id: shopId }).eq('id', adminId);
    toast.success('Shop admin assigned');
    fetchData();
  };

  const inviteShopAdmin = async () => {
    if (!inviteDialog || !inviteForm.full_name || !inviteForm.email || !inviteForm.password) { toast.error('Name, email, and password required'); return; }
    setInviting(true);
    try {
      const { inviteStaff } = await import('@/lib/actions/admin');
      const result = await inviteStaff({
        email: inviteForm.email,
        fullName: inviteForm.full_name,
        password: inviteForm.password,
        phone: inviteForm.phone || undefined,
        role: 'shop_admin',
        shopId: inviteDialog.id,
      });
      
      if (!result.success) throw new Error(result.error);

      toast.success('Shop admin added successfully');
      setInviteDialog(null);
      setInviteForm({ full_name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add shop admin');
    }
    setInviting(false);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Shops</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Manage shop locations</p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="bg-[#FF5C00] text-white hover:bg-[#e05200]"><Plus className="w-4 h-4 mr-1" />Add Shop</Button>
      </motion.div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div> : (
          <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
            <TableHead className="text-[#1A1A1A]/55">Name</TableHead><TableHead className="text-[#1A1A1A]/55">Address</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Area</TableHead><TableHead className="text-[#1A1A1A]/55">Phone</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Shop Admin</TableHead><TableHead className="text-[#1A1A1A]/55">Active</TableHead>
            <TableHead className="text-[#1A1A1A]/55">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>{shops.map(shop => {
            const admin = getShopAdmin(shop.id);
            return (
              <TableRow key={shop.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]">
                <TableCell className="text-[#1A1A1A] font-medium flex items-center gap-2"><Store className="w-4 h-4 text-[#FF5C00]" />{shop.name}</TableCell>
                <TableCell className="text-[#1A1A1A]/70 text-xs max-w-[160px] truncate">{shop.address || '—'}</TableCell>
                <TableCell><Badge className="bg-[#F7F7F5] border border-[#E8E4DF] text-[#1A1A1A]/70 text-[10px]">{shop.area || '—'}</Badge></TableCell>
                <TableCell className="text-[#1A1A1A]/70">{shop.phone || '—'}</TableCell>
                <TableCell>{admin ? (
                  <span className="text-[#FF5C00] font-semibold text-xs">{admin.full_name}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={v => assignShopAdmin(shop.id, v)}>
                      <SelectTrigger className="h-7 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] w-32"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E8E4DF]">
                        {shopAdmins.filter(sa => !sa.shop_id).map(sa => <SelectItem key={sa.id} value={sa.id} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{sa.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => setInviteDialog(shop)} className="text-amber-600 hover:bg-amber-500/10 text-xs h-7 font-semibold"><UserPlus className="w-3 h-3 mr-1" />Add</Button>
                  </div>
                )}</TableCell>
                <TableCell><Switch checked={shop.is_active} onCheckedChange={async () => { await supabase.from('shops').update({ is_active: !shop.is_active }).eq('id', shop.id); fetchData(); }} /></TableCell>
                <TableCell className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-[#FF5C00] hover:bg-[#FF5C00]/10 text-xs font-semibold" onClick={() => { setAdminShopOverride(shop.id); router.push('/shop-admin'); }}><ExternalLink className="w-3 h-3 mr-1" />Manage</Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-[#1A1A1A]/40 hover:text-red-600" onClick={() => deleteShop(shop)}><Trash2 className="w-3 h-3" /></Button>
                </TableCell>
              </TableRow>
            );
          })}</TableBody></Table>
        )}
      </CardContent></Card>

      {/* Add Shop Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-sm">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">Add Shop</DialogTitle><DialogDescription className="text-[#1A1A1A]/60">Create a new shop location</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-[#1A1A1A]/70">Name *</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Address</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={shopForm.address} onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Area</Label>
              <Select value={shopForm.area} onValueChange={v => setShopForm(f => ({ ...f, area: v }))}>
                <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent className="bg-white border-[#E8E4DF]">{NAGPUR_AREAS.map(a => <SelectItem key={a} value={a} className="text-[#1A1A1A] hover:bg-[#F7F7F5]">{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[#1A1A1A]/70">Phone</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={shopForm.phone} onChange={e => setShopForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addShop} className="bg-[#FF5C00] text-white hover:bg-[#e05200]">Add Shop</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shop Admin Dialog */}
      <Dialog open={!!inviteDialog} onOpenChange={() => setInviteDialog(null)}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-sm">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">Add Shop Admin</DialogTitle><DialogDescription className="text-[#1A1A1A]/60">For: {inviteDialog?.name}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-[#1A1A1A]/70">Full Name *</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={inviteForm.full_name} onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Email *</Label><Input type="email" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Password *</Label><Input type="text" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" placeholder="Min 6 characters" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Phone</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={inviteShopAdmin} disabled={inviting} className="bg-[#FF5C00] text-white hover:bg-[#e05200]">{inviting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
