'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { DEVICE_BRANDS } from '@/lib/types';
import type { Device } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Smartphone, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState({ brand: '', model_name: '', category: 'smartphone' as string });
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('devices').select('*').order('brand').order('model_name');
    setDevices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchDevices(); }, [user, fetchDevices]);

  const brandGroups = devices.reduce((acc, d) => { (acc[d.brand] ??= []).push(d); return acc; }, {} as Record<string, Device[]>);

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => { const n = new Set(prev); n.has(brand) ? n.delete(brand) : n.add(brand); return n; });
  };

  const addDevice = async () => {
    if (!form.brand || !form.model_name) { toast.error('Brand and model required'); return; }
    await supabase.from('devices').insert({ brand: form.brand, model_name: form.model_name, category: form.category, is_active: true });
    toast.success('Model added');
    setAddDialog(false);
    setForm({ brand: '', model_name: '', category: 'smartphone' });
    fetchDevices();
  };

  const toggleActive = async (d: Device) => {
    await supabase.from('devices').update({ is_active: !d.is_active }).eq('id', d.id);
    toast.success(d.is_active ? 'Deactivated' : 'Activated');
    fetchDevices();
  };

  const deleteDevice = async (d: Device) => {
    const { count } = await supabase.from('repairs').select('id', { count: 'exact', head: true }).eq('device_id', d.id);
    if (count && count > 0) {
      toast.error(`Cannot delete — ${count} repair(s) use this device`);
      return;
    }
    if (!confirm(`Delete ${d.brand} ${d.model_name}?`)) return;
    await supabase.from('devices').delete().eq('id', d.id);
    toast.success('Device deleted');
    fetchDevices();
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Device Models</h1>
          <p className="text-white/50 text-sm mt-1">Manage supported devices</p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4 mr-1" />Add Model</Button>
      </motion.div>

      {loading ? <div className="space-y-4">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />)}</div> : (
        <div className="space-y-3">
          {Object.entries(brandGroups).sort(([a], [b]) => a.localeCompare(b)).map(([brand, models]) => (
            <Collapsible key={brand} open={expandedBrands.has(brand)} onOpenChange={() => toggleBrand(brand)}>
              <Card className="bg-white/5 border-white/10">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-[#00D084]" />
                      <span className="text-white font-semibold">{brand}</span>
                      <Badge variant="outline" className="border-white/20 text-white/40 text-xs">{models.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedBrands.has(brand) ? 'rotate-180' : ''}`} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-white/5">
                    {models.map(d => (
                      <div key={d.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${d.is_active ? 'text-white' : 'text-white/30 line-through'}`}>{d.model_name}</span>
                          <Badge className="bg-white/10 text-white/40 text-[10px] capitalize">{d.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} />
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={() => deleteDevice(d)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Add Device Model</DialogTitle><DialogDescription className="text-white/50">Add a new device to the catalog</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-white/60">Brand</Label>
              <Select value={form.brand} onValueChange={v => setForm(f => ({ ...f, brand: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  {DEVICE_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/60">Model Name</Label><Input className="bg-white/5 border-white/10 text-white mt-1" value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} placeholder="e.g. iPhone 15 Pro" /></div>
            <div><Label className="text-white/60">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  <SelectItem value="smartphone">Smartphone</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={addDevice} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">Add Model</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
