'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Part, ShopItem, Shop } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Package, ShoppingBag, Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function InventoryPage() {
  const { user } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [burnRates, setBurnRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Part form
  const [partDialog, setPartDialog] = useState<{ open: boolean; part: Part | null }>({ open: false, part: null });
  const [partForm, setPartForm] = useState({ name: '', brand: '', model_compatible: '', quantity_in_stock: 0, cost_price: 0, selling_price: 0, low_stock_threshold: 5, shop_id: '' });

  // Shop item form
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: ShopItem | null }>({ open: false, item: null });
  const [itemForm, setItemForm] = useState({ name: '', category: '', price: 0, stock_qty: 0, shop_id: '', image: null as File | null });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [pRes, siRes, shRes, buRes] = await Promise.all([
      supabase.from('parts').select('*').order('name'),
      supabase.from('shop_items').select('*').order('name'),
      supabase.from('shops').select('*').order('name'),
      supabase.from('parts_used').select('part_id, quantity, repair:repairs!inner(created_at)').gte('repair.created_at', thirtyDaysAgo),
    ]);
    setParts(pRes.data || []);
    setShopItems(siRes.data || []);
    setShops(shRes.data || []);
    // Calculate burn rates
    const rates: Record<string, number> = {};
    (buRes.data || []).forEach((pu: any) => { rates[pu.part_id] = (rates[pu.part_id] || 0) + pu.quantity; });
    setBurnRates(rates);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  const savePart = async () => {
    const payload = { ...partForm, quantity_in_stock: Number(partForm.quantity_in_stock), cost_price: Number(partForm.cost_price), selling_price: Number(partForm.selling_price), low_stock_threshold: Number(partForm.low_stock_threshold), shop_id: partForm.shop_id || null };
    if (partDialog.part) {
      await supabase.from('parts').update(payload).eq('id', partDialog.part.id);
      toast.success('Part updated');
    } else {
      await supabase.from('parts').insert(payload);
      toast.success('Part added');
    }
    setPartDialog({ open: false, part: null });
    fetchData();
  };

  const deletePart = async (id: string) => {
    if (!confirm('Delete this part?')) return;
    await supabase.from('parts').delete().eq('id', id);
    toast.success('Part deleted');
    fetchData();
  };

  const saveShopItem = async () => {
    setUploading(true);
    let imageUrl = itemDialog.item?.image_url || null;
    if (itemForm.image) {
      const path = `shop-items/${itemForm.shop_id}/${Date.now()}_${itemForm.image.name}`;
      await supabase.storage.from('shop-items').upload(path, itemForm.image);
      const { data: { publicUrl } } = supabase.storage.from('shop-items').getPublicUrl(path);
      imageUrl = publicUrl;
    }
    const payload = { name: itemForm.name, category: itemForm.category || null, price: Number(itemForm.price), stock_qty: Number(itemForm.stock_qty), shop_id: itemForm.shop_id, image_url: imageUrl };
    if (itemDialog.item) {
      await supabase.from('shop_items').update(payload).eq('id', itemDialog.item.id);
      toast.success('Item updated');
    } else {
      await supabase.from('shop_items').insert(payload);
      toast.success('Item added');
    }
    setItemDialog({ open: false, item: null });
    setUploading(false);
    fetchData();
  };

  const deleteShopItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await supabase.from('shop_items').delete().eq('id', id);
    toast.success('Item deleted');
    fetchData();
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="text-white/50 text-sm mt-1">Manage parts and shop items</p>
      </motion.div>

      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="parts" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Package className="w-3.5 h-3.5 mr-1.5" />Parts ({parts.length})</TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><ShoppingBag className="w-3.5 h-3.5 mr-1.5" />Shop Items ({shopItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setPartForm({ name: '', brand: '', model_compatible: '', quantity_in_stock: 0, cost_price: 0, selling_price: 0, low_stock_threshold: 5, shop_id: '' }); setPartDialog({ open: true, part: null }); }} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4 mr-1" />Add Part</Button>
          </div>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Brand</TableHead>
                <TableHead className="text-white/50">Stock</TableHead><TableHead className="text-white/50">Burn/30d</TableHead>
                <TableHead className="text-white/50">Cost</TableHead><TableHead className="text-white/50">Selling</TableHead>
                <TableHead className="text-white/50">Status</TableHead><TableHead className="text-white/50">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{parts.map(p => {
                const low = p.quantity_in_stock <= p.low_stock_threshold;
                return (
                  <TableRow key={p.id} className={`border-white/5 ${low ? 'bg-red-500/5' : 'hover:bg-white/5'}`}>
                    <TableCell className="text-white font-medium">{p.name}</TableCell>
                    <TableCell className="text-white/60">{p.brand}</TableCell>
                    <TableCell className={low ? 'text-red-400 font-bold' : 'text-white'}>{p.quantity_in_stock}</TableCell>
                    <TableCell className="text-white/60">{burnRates[p.id] || 0}</TableCell>
                    <TableCell className="text-white/60">₹{fmt(p.cost_price)}</TableCell>
                    <TableCell className="text-white/60">₹{fmt(p.selling_price)}</TableCell>
                    <TableCell>{low ? <Badge className="bg-red-500/20 text-red-400 text-[10px]"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Low</Badge> : <Badge className="bg-green-500/20 text-green-400 text-[10px]"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />OK</Badge>}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-[#00D084]" onClick={() => { setPartForm({ name: p.name, brand: p.brand, model_compatible: p.model_compatible, quantity_in_stock: p.quantity_in_stock, cost_price: p.cost_price, selling_price: p.selling_price, low_stock_threshold: p.low_stock_threshold, shop_id: p.shop_id || '' }); setPartDialog({ open: true, part: p }); }}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-red-400" onClick={() => deletePart(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="items">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setItemForm({ name: '', category: '', price: 0, stock_qty: 0, shop_id: '', image: null }); setItemDialog({ open: true, item: null }); }} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4 mr-1" />Add Item</Button>
          </div>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Image</TableHead><TableHead className="text-white/50">Name</TableHead>
                <TableHead className="text-white/50">Category</TableHead><TableHead className="text-white/50">Price</TableHead>
                <TableHead className="text-white/50">Stock</TableHead><TableHead className="text-white/50">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{shopItems.map(si => (
                <TableRow key={si.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>{si.image_url ? <img src={si.image_url} alt={si.name} className="w-10 h-10 rounded object-cover border border-white/10" /> : <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-white/20" /></div>}</TableCell>
                  <TableCell className="text-white font-medium">{si.name}</TableCell>
                  <TableCell className="text-white/60">{si.category || '—'}</TableCell>
                  <TableCell className="text-white">₹{fmt(si.price)}</TableCell>
                  <TableCell className="text-white/60">{si.stock_qty}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-[#00D084]" onClick={() => { setItemForm({ name: si.name, category: si.category || '', price: si.price, stock_qty: si.stock_qty, shop_id: si.shop_id, image: null }); setItemDialog({ open: true, item: si }); }}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-red-400" onClick={() => deleteShopItem(si.id)}><Trash2 className="w-3 h-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Part Dialog */}
      <Dialog open={partDialog.open} onOpenChange={o => setPartDialog({ open: o, part: null })}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">{partDialog.part ? 'Edit' : 'Add'} Part</DialogTitle><DialogDescription className="text-white/50">Fill in part details</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/60">Name</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={partForm.name} onChange={e => setPartForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-white/60">Brand</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={partForm.brand} onChange={e => setPartForm(f => ({ ...f, brand: e.target.value }))} /></div>
              <div><Label className="text-white/60">Model</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={partForm.model_compatible} onChange={e => setPartForm(f => ({ ...f, model_compatible: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-white/60">Stock</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={partForm.quantity_in_stock} onChange={e => setPartForm(f => ({ ...f, quantity_in_stock: +e.target.value }))} /></div>
              <div><Label className="text-white/60">Cost</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={partForm.cost_price} onChange={e => setPartForm(f => ({ ...f, cost_price: +e.target.value }))} /></div>
              <div><Label className="text-white/60">Selling</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={partForm.selling_price} onChange={e => setPartForm(f => ({ ...f, selling_price: +e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-white/60">Low Threshold</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={partForm.low_stock_threshold} onChange={e => setPartForm(f => ({ ...f, low_stock_threshold: +e.target.value }))} /></div>
              <div><Label className="text-white/60">Shop</Label>
                <Select value={partForm.shop_id} onValueChange={v => setPartForm(f => ({ ...f, shop_id: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Select shop" /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">{shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={savePart} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">{partDialog.part ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shop Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={o => setItemDialog({ open: o, item: null })}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">{itemDialog.item ? 'Edit' : 'Add'} Shop Item</DialogTitle><DialogDescription className="text-white/50">Fill in item details</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/60">Name</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-white/60">Category</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label className="text-white/60">Shop</Label>
                <Select value={itemForm.shop_id} onValueChange={v => setItemForm(f => ({ ...f, shop_id: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Select shop" /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">{shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-white/60">Price</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: +e.target.value }))} /></div>
              <div><Label className="text-white/60">Stock Qty</Label><Input type="number" className="bg-white/5 border-white/10 text-white mt-1" value={itemForm.stock_qty} onChange={e => setItemForm(f => ({ ...f, stock_qty: +e.target.value }))} /></div>
            </div>
            <div><Label className="text-white/60">Image</Label><Input type="file" accept="image/*" className="bg-white/5 border-white/10 text-white mt-1" onChange={e => setItemForm(f => ({ ...f, image: e.target.files?.[0] || null }))} /></div>
          </div>
          <DialogFooter><Button onClick={saveShopItem} disabled={uploading} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{itemDialog.item ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
