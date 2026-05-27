'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { REPAIR_TYPE_OPTIONS } from '@/lib/types';
import type { Device, Pricing, EwastePayoutRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DollarSign, Save, Recycle } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const repairTypes = REPAIR_TYPE_OPTIONS.map(r => r.value);

export default function PricingPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [payoutRates, setPayoutRates] = useState<EwastePayoutRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedPrices, setEditedPrices] = useState<Record<string, { min: number; max: number }>>({});
  const [editedPayouts, setEditedPayouts] = useState<Record<string, { cash_min: number; cash_max: number; credit_min: number; credit_max: number }>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [dRes, pRes, eRes] = await Promise.all([
      supabase.from('devices').select('*').eq('is_active', true).order('brand').order('model_name'),
      supabase.from('pricing').select('*'),
      supabase.from('ewaste_payout_rates').select('*'),
    ]);
    setDevices(dRes.data || []);
    setPricing(pRes.data || []);
    setPayoutRates(eRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  const getPrice = (deviceId: string, repairType: string) => {
    const key = `${deviceId}_${repairType}`;
    if (editedPrices[key]) return editedPrices[key];
    const p = pricing.find(pr => pr.device_id === deviceId && pr.repair_type === repairType);
    return p ? { min: p.min_price, max: p.max_price } : { min: 0, max: 0 };
  };

  const setPrice = (deviceId: string, repairType: string, field: 'min' | 'max', value: number) => {
    const key = `${deviceId}_${repairType}`;
    const current = getPrice(deviceId, repairType);
    setEditedPrices(prev => ({ ...prev, [key]: { ...current, [field]: value } }));
  };

  const savePricing = async () => {
    setSaving(true);
    const upserts = Object.entries(editedPrices).map(([key, val]) => {
      const [deviceId, repairType] = key.split('_');
      return { device_id: deviceId, repair_type: repairType, min_price: val.min, max_price: val.max };
    });
    if (upserts.length > 0) {
      for (const u of upserts) {
        await supabase.from('pricing').upsert(u, { onConflict: 'device_id,repair_type' as any });
      }
    }
    toast.success('Pricing saved');
    setEditedPrices({});
    setSaving(false);
    fetchData();
  };

  const savePayouts = async () => {
    setSaving(true);
    for (const [id, val] of Object.entries(editedPayouts)) {
      await supabase.from('ewaste_payout_rates').update(val).eq('id', id);
    }
    toast.success('Payout rates saved');
    setEditedPayouts({});
    setSaving(false);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Pricing Management</h1>
        <p className="text-white/50 text-sm mt-1">Set repair prices and e-waste payout rates</p>
      </motion.div>

      <Tabs defaultValue="repair" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="repair" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Repair Pricing</TabsTrigger>
          <TabsTrigger value="ewaste" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Recycle className="w-3.5 h-3.5 mr-1.5" />E-Waste Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="repair">
          <div className="flex justify-end mb-4">
            <Button onClick={savePricing} disabled={saving || Object.keys(editedPrices).length === 0} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Save className="w-4 h-4 mr-1" />Save Changes</Button>
          </div>
          <Card className="bg-white/5 border-white/10 overflow-x-auto"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-64 w-full bg-white/5" /></div> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/5">
                  <th className="text-left text-white/50 p-3 sticky left-0 bg-[#0A0A0A] z-10 min-w-[180px]">Device</th>
                  {repairTypes.map(rt => <th key={rt} className="text-center text-white/50 p-2 min-w-[120px]">{REPAIR_TYPE_OPTIONS.find(r => r.value === rt)?.label}</th>)}
                </tr></thead>
                <tbody>{devices.map(d => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="text-white/80 p-3 sticky left-0 bg-[#0A0A0A] z-10 font-medium">{d.brand} {d.model_name}</td>
                    {repairTypes.map(rt => {
                      const p = getPrice(d.id, rt);
                      return (
                        <td key={rt} className="p-1.5">
                          <div className="flex gap-1">
                            <Input type="number" value={p.min} onChange={e => setPrice(d.id, rt, 'min', +e.target.value)} className="w-14 h-6 text-[10px] bg-white/5 border-white/10 text-white text-center p-1" placeholder="Min" />
                            <Input type="number" value={p.max} onChange={e => setPrice(d.id, rt, 'max', +e.target.value)} className="w-14 h-6 text-[10px] bg-white/5 border-white/10 text-white text-center p-1" placeholder="Max" />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}</tbody>
              </table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="ewaste">
          <div className="flex justify-end mb-4">
            <Button onClick={savePayouts} disabled={saving || Object.keys(editedPayouts).length === 0} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Save className="w-4 h-4 mr-1" />Save Changes</Button>
          </div>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Brand</TableHead>
                <TableHead className="text-white/50">Cash Min</TableHead><TableHead className="text-white/50">Cash Max</TableHead>
                <TableHead className="text-white/50">Credit Min</TableHead><TableHead className="text-white/50">Credit Max</TableHead>
              </TableRow></TableHeader>
              <TableBody>{payoutRates.map(pr => {
                const edited = editedPayouts[pr.id] || pr;
                return (
                  <TableRow key={pr.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{pr.brand}</TableCell>
                    <TableCell><Input type="number" value={edited.cash_min} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), cash_min: +e.target.value } }))} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" /></TableCell>
                    <TableCell><Input type="number" value={edited.cash_max} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), cash_max: +e.target.value } }))} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" /></TableCell>
                    <TableCell><Input type="number" value={edited.credit_min} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), credit_min: +e.target.value } }))} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" /></TableCell>
                    <TableCell><Input type="number" value={edited.credit_max} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), credit_max: +e.target.value } }))} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" /></TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
