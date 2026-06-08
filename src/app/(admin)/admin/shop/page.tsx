'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import type { ShopItem, Shop } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Recycle, Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function AdminShopPage() {
  
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Shop item form
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: ShopItem | null }>({ open: false, item: null });
  const [itemForm, setItemForm] = useState({ name: '', price: 0, stock_qty: 0, shop_id: '', image: null as File | null });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [siRes, shRes] = await Promise.all([
      supabase.from('shop_items').select('*').eq('category', 'shop').order('name'),
      supabase.from('shops').select('*').order('name'),
    ]);
    setShopItems(siRes.data || []);
    setShops(shRes.data || []);
    setLoading(false);
  }, []);

  const { user } = useAuthFetch(fetchData, { requiredRole: 'admin' });

  const saveShopItem = async () => {
    setUploading(true);
    try {
      let imageUrl = itemDialog.item?.image_url || null;
      if (itemForm.image) {
        const path = `shop/${itemForm.shop_id}/${Date.now()}_${itemForm.image.name}`;
        const { error: uploadError } = await supabase.storage.from('shop-items').upload(path, itemForm.image);
        if (uploadError) {
          console.error('[SHOP] Image upload error:', uploadError);
          toast.error(`Image upload failed: ${uploadError.message}`);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('shop-items').getPublicUrl(path);
        imageUrl = publicUrl;
      }
      const payload = { 
        name: itemForm.name, 
        category: 'shop', 
        price: Number(itemForm.price), 
        stock_qty: Number(itemForm.stock_qty), 
        shop_id: itemForm.shop_id, 
        image_url: imageUrl 
      };
      if (itemDialog.item) {
        const { error: updateError } = await supabase.from('shop_items').update(payload).eq('id', itemDialog.item.id);
        if (updateError) {
          console.error('[SHOP] Database update error:', updateError);
          toast.error(`Failed to update product: ${updateError.message}`);
          return;
        }
        toast.success('Product updated');
      } else {
        const { error: insertError } = await supabase.from('shop_items').insert(payload);
        if (insertError) {
          console.error('[SHOP] Database insert error:', insertError);
          toast.error(`Failed to add product: ${insertError.message}`);
          return;
        }
        toast.success('Product added');
      }
      setItemDialog({ open: false, item: null });
      fetchData();
    } catch (err: any) {
      console.error('[SHOP] Unexpected error in saveShopItem:', err);
      toast.error(`An unexpected error occurred: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteShopItem = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('shop_items').delete().eq('id', id);
    toast.success('Product deleted');
    fetchData();
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Store</h1>
        <p className="text-[#1A1A1A]/50 text-sm mt-1">Manage products available in the store</p>
      </motion.div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => { setItemForm({ name: '', price: 0, stock_qty: 0, shop_id: '', image: null }); setItemDialog({ open: true, item: null }); }} className="bg-[#FF5C00] text-white hover:bg-[#e05200]"><Plus className="w-4 h-4 mr-1" />Add Product</Button>
      </div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
        {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div> : shopItems.length === 0 ? (
           <div className="p-12 flex flex-col items-center text-center">
             <Recycle className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
             <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No products found</h3>
             <p className="text-[#1A1A1A]/50 text-sm">Add some products to start selling.</p>
           </div>
        ) : (
          <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent">
            <TableHead className="text-[#1A1A1A]/50 font-medium">Image</TableHead>
            <TableHead className="text-[#1A1A1A]/50 font-medium">Name</TableHead>
            <TableHead className="text-[#1A1A1A]/50 font-medium">Store</TableHead>
            <TableHead className="text-[#1A1A1A]/50 font-medium">Price</TableHead>
            <TableHead className="text-[#1A1A1A]/50 font-medium">Stock</TableHead>
            <TableHead className="text-[#1A1A1A]/50 font-medium">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>{shopItems.map(si => (
            <TableRow key={si.id} className="border-[#E8E4DF] hover:bg-[#F7F7F5]">
              <TableCell>{si.image_url ? <img src={si.image_url} alt={si.name} className="w-10 h-10 rounded object-cover border border-[#E8E4DF]" /> : <div className="w-10 h-10 rounded bg-[#F7F7F5] flex items-center justify-center border border-[#E8E4DF]"><ImageIcon className="w-4 h-4 text-[#1A1A1A]/20" /></div>}</TableCell>
              <TableCell className="text-[#1A1A1A] font-medium">{si.name}</TableCell>
              <TableCell className="text-[#1A1A1A]/60">{shops.find(s => s.id === si.shop_id)?.name || '—'}</TableCell>
              <TableCell className="text-[#1A1A1A] font-semibold">₹{fmt(si.price)}</TableCell>
              <TableCell className="text-[#1A1A1A]/60">{si.stock_qty}</TableCell>
              <TableCell className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#1A1A1A]/60 hover:text-[#FF5C00] hover:bg-[#FF5C00]/10" onClick={() => { setItemForm({ name: si.name, price: si.price, stock_qty: si.stock_qty, shop_id: si.shop_id || '', image: null }); setItemDialog({ open: true, item: si }); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#1A1A1A]/60 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteShopItem(si.id)}><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent></Card>

      {/* Shop Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={o => setItemDialog({ open: o, item: null })}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-md shadow-lg">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">{itemDialog.item ? 'Edit' : 'Add'} Product</DialogTitle><DialogDescription className="text-[#1A1A1A]/60">Manage details for this product.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-[#1A1A1A]/80 font-medium">Name / Description</Label><Input className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1.5 focus:border-[#FF5C00] focus:ring-[#FF5C00]" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Refurbished iPhone X 64GB" /></div>
            
            <div><Label className="text-[#1A1A1A]/80 font-medium">Store Location</Label>
              <Select value={itemForm.shop_id} onValueChange={v => setItemForm(f => ({ ...f, shop_id: v }))}>
                <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1.5 focus:ring-[#FF5C00]"><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">{shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-[#1A1A1A]/80 font-medium">Price (₹)</Label><Input type="number" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1.5 focus:border-[#FF5C00] focus:ring-[#FF5C00]" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: +e.target.value }))} /></div>
              <div><Label className="text-[#1A1A1A]/80 font-medium">Stock Qty</Label><Input type="number" className="bg-white border-[#E8E4DF] text-[#1A1A1A] mt-1.5 focus:border-[#FF5C00] focus:ring-[#FF5C00]" value={itemForm.stock_qty} onChange={e => setItemForm(f => ({ ...f, stock_qty: +e.target.value }))} /></div>
            </div>
            <div>
              <Label className="text-[#1A1A1A]/80 font-medium block mb-1.5">Product Image {itemDialog.item && "(leave blank to keep current)"}</Label>
              <Input type="file" accept="image/*" className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] file:bg-white file:text-[#1A1A1A] file:border-r file:border-[#E8E4DF] file:px-4 file:mr-4 file:py-2 text-sm h-auto p-0 rounded-lg overflow-hidden cursor-pointer" onChange={e => setItemForm(f => ({ ...f, image: e.target.files?.[0] || null }))} />
            </div>
          </div>
          <DialogFooter className="mt-6 border-t border-[#E8E4DF] pt-4"><Button onClick={saveShopItem} disabled={uploading || !itemForm.name || !itemForm.shop_id} className="bg-[#FF5C00] text-white hover:bg-[#e05200] px-6">{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}{itemDialog.item ? 'Update Product' : 'Add Product'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
