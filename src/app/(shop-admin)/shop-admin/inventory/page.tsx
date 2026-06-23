'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { useShopId } from '@/lib/use-shop-id';
import type { ShopItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ShoppingBag, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function ShopInventoryPage() {
  const shopId = useShopId();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: ShopItem | null }>({ open: false, item: null });
  const [itemForm, setItemForm] = useState({ name: '', category: '', price: 0, stock_qty: 0, image: null as File | null });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    const { data } = await supabase.from('shop_items').select('*').eq('shop_id', shopId).order('name');
    setShopItems(data || []);
  }, [shopId]);

  const { user, loading } = useAuthFetch(fetchData, {
    requiredRole: ['shop_admin', 'admin'],
    deps: [shopId],
    realtimeTable: 'shop_items',
  });


  const saveShopItem = async () => {
    setUploading(true);
    let imageUrl = itemDialog.item?.image_url || null;
    if (itemForm.image) {
      const compressed = await compressImage(itemForm.image);
      const path = `shop-items/${shopId}/${Date.now()}_${compressed.name}`;
      await supabase.storage.from('shop-items').upload(path, compressed);
      const { data: { publicUrl } } = supabase.storage.from('shop-items').getPublicUrl(path);
      imageUrl = publicUrl;
    }
    const payload = { name: itemForm.name, category: itemForm.category || null, price: Number(itemForm.price), stock_qty: Number(itemForm.stock_qty), shop_id: shopId, image_url: imageUrl };
    if (itemDialog.item) { await supabase.from('shop_items').update(payload).eq('id', itemDialog.item.id); toast.success('Updated'); }
    else { await supabase.from('shop_items').insert(payload); toast.success('Added'); }
    setItemDialog({ open: false, item: null }); setUploading(false); fetchData();
  };

  const deleteShopItem = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('shop_items').delete().eq('id', id); toast.success('Deleted'); fetchData(); };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Shop Items</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Manage items sold in your shop</p>
        </div>
        <Button onClick={() => { setItemForm({ name: '', category: '', price: 0, stock_qty: 0, image: null }); setItemDialog({ open: true, item: null }); }} className="bg-[#FF5C00] text-white hover:bg-[#e05200] font-semibold"><Plus className="w-4 h-4 mr-1" />Add Item</Button>
      </motion.div>
          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div> : (
              <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/55">Image</TableHead><TableHead className="text-[#1A1A1A]/55">Name</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Category</TableHead><TableHead className="text-[#1A1A1A]/55">Price</TableHead>
                <TableHead className="text-[#1A1A1A]/55">Stock</TableHead><TableHead className="text-[#1A1A1A]/55">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{shopItems.map(si => (
                <TableRow key={si.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]">
                  <TableCell>{si.image_url ? <img src={si.image_url} alt={si.name} className="w-10 h-10 rounded object-cover border border-[#E8E4DF]" /> : <div className="w-10 h-10 rounded bg-[#F7F7F5] border border-[#E8E4DF] flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-[#1A1A1A]/20" /></div>}</TableCell>
                  <TableCell className="text-[#1A1A1A] font-medium">{si.name}</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{si.category || '—'}</TableCell>
                  <TableCell className="text-[#1A1A1A]">₹{fmt(si.price)}</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{si.stock_qty}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-[#1A1A1A]/60 hover:text-[#FF5C00]" onClick={() => { setItemForm({ name: si.name, category: si.category || '', price: si.price, stock_qty: si.stock_qty, image: null }); setItemDialog({ open: true, item: si }); }}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-[#1A1A1A]/60 hover:text-red-600" onClick={() => deleteShopItem(si.id)}><Trash2 className="w-3 h-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
            )}
          </CardContent></Card>


      {/* Shop Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={o => setItemDialog({ open: o, item: null })}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-md">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">{itemDialog.item ? 'Edit' : 'Add'} Shop Item</DialogTitle><DialogDescription className="text-[#1A1A1A]/60">For your shop only</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-[#1A1A1A]/70">Name</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[#1A1A1A]/70">Category</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label className="text-[#1A1A1A]/70">Price</Label><Input type="number" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: +e.target.value }))} /></div>
            </div>
            <div><Label className="text-[#1A1A1A]/70">Stock Qty</Label><Input type="number" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" value={itemForm.stock_qty} onChange={e => setItemForm(f => ({ ...f, stock_qty: +e.target.value }))} /></div>
            <div><Label className="text-[#1A1A1A]/70">Image</Label><Input type="file" accept="image/*" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1" onChange={e => setItemForm(f => ({ ...f, image: e.target.files?.[0] || null }))} /></div>
          </div>
          <DialogFooter><Button onClick={saveShopItem} disabled={uploading} className="bg-[#FF5C00] text-white hover:bg-[#e05200]">{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{itemDialog.item ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
