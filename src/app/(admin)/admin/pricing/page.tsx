'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { REPAIR_TYPE_OPTIONS, DEVICE_BRANDS } from '@/lib/types';
import type { Device, Pricing, EwastePayoutRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, DollarSign, Save, Recycle, Smartphone, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const repairTypes = REPAIR_TYPE_OPTIONS.map(r => r.value);

export default function PricingPage() {
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [payoutRates, setPayoutRates] = useState<EwastePayoutRate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Repair Pricing State
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [devicePrices, setDevicePrices] = useState<Record<string, { estimated_cost: number, min: number, max: number }>>({});
  
  // Ewaste State
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

  const { user } = useAuthFetch(fetchData, { requiredRole: 'admin' });

  // Filter devices list
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (brandFilter !== 'All' && d.brand !== brandFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return d.brand.toLowerCase().includes(query) || d.model_name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [devices, brandFilter, searchQuery]);

  // Load prices when device selected
  useEffect(() => {
    if (!selectedDevice) return;
    const initialPrices: Record<string, any> = {};
    
    // Initialize with existing data or defaults
    repairTypes.forEach(rt => {
      const p = pricing.find(pr => pr.device_id === selectedDevice.id && pr.repair_type === rt);
      initialPrices[rt] = p ? { 
        estimated_cost: p.estimated_cost || 0,
        min: p.min_price || 0, 
        max: p.max_price || 0 
      } : { estimated_cost: 0, min: 0, max: 0 };
    });
    
    setDevicePrices(initialPrices);
  }, [selectedDevice, pricing]);

  const setPrice = (repairType: string, field: 'estimated_cost' | 'min' | 'max', value: number) => {
    setDevicePrices(prev => ({ 
      ...prev, 
      [repairType]: { ...prev[repairType], [field]: value } 
    }));
  };

  const savePricing = async () => {
    if (!selectedDevice) return;
    setSaving(true);
    
    const upserts = Object.entries(devicePrices).map(([rt, val]) => ({
      device_id: selectedDevice.id,
      repair_type: rt,
      estimated_cost: val.estimated_cost,
      min_price: val.min,
      max_price: val.max
    }));

    if (upserts.length > 0) {
      for (const u of upserts) {
        await supabase.from('pricing').upsert(u, { onConflict: 'device_id,repair_type' as any });
      }
    }
    
    toast.success(`Pricing saved for ${selectedDevice.brand} ${selectedDevice.model_name}`);
    setSaving(false);
    fetchData(); // refresh the master list
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
    <div className="space-y-8 text-[#1A1A1A]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Pricing Management</h1>
        <p className="text-[#1A1A1A]/60 text-sm mt-1">Set repair prices and e-waste payout rates</p>
      </motion.div>

      <Tabs defaultValue="repair" className="w-full">
        <TabsList className="bg-white border border-[#E8E4DF] shadow-sm mb-6 p-1">
          <TabsTrigger value="repair" className="data-[state=active]:bg-[#FF5C00]/10 data-[state=active]:text-[#FF5C00] font-semibold"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Repair Pricing</TabsTrigger>
          <TabsTrigger value="ewaste" className="data-[state=active]:bg-[#FF5C00]/10 data-[state=active]:text-[#FF5C00] font-semibold"><Recycle className="w-3.5 h-3.5 mr-1.5" />E-Waste Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="repair" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Device List */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-white border-[#E8E4DF] shadow-sm h-[calc(100vh-220px)] flex flex-col">
                <CardHeader className="border-b border-[#E8E4DF] pb-4 shrink-0">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40" />
                      <Input 
                        placeholder="Search devices..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[#F7F7F5] border-[#E8E4DF] focus-visible:ring-[#FF5C00]"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {['All', ...DEVICE_BRANDS].map(brand => (
                        <button
                          key={brand}
                          onClick={() => setBrandFilter(brand)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            brandFilter === brand ? 'bg-[#1A1A1A] text-white' : 'bg-[#F7F7F5] text-[#1A1A1A]/60 hover:bg-[#E8E4DF]'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 overflow-y-auto flex-1">
                  {loading ? (
                    <div className="p-4 space-y-2">
                      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-[#1A1A1A]/5" />)}
                    </div>
                  ) : filteredDevices.length === 0 ? (
                    <div className="p-8 text-center text-[#1A1A1A]/40 text-sm">No devices found.</div>
                  ) : (
                    <div className="divide-y divide-[#E8E4DF]/40">
                      {filteredDevices.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDevice(d)}
                          className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
                            selectedDevice?.id === d.id ? 'bg-[#FF5C00]/5 border-l-4 border-l-[#FF5C00]' : 'hover:bg-[#F7F7F5] border-l-4 border-l-transparent'
                          }`}
                        >
                          <div>
                            <p className={`font-semibold ${selectedDevice?.id === d.id ? 'text-[#FF5C00]' : 'text-[#1A1A1A]'}`}>{d.model_name}</p>
                            <p className="text-xs text-[#1A1A1A]/50">{d.brand}</p>
                          </div>
                          <ChevronRightIcon className={`w-4 h-4 ${selectedDevice?.id === d.id ? 'text-[#FF5C00]' : 'text-[#1A1A1A]/20'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Pricing Editor */}
            <div className="lg:col-span-8">
              {!selectedDevice ? (
                <div className="bg-white border border-dashed border-[#E8E4DF] rounded-2xl h-[calc(100vh-220px)] flex flex-col items-center justify-center p-8 text-center">
                  <Smartphone className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No Device Selected</h3>
                  <p className="text-[#1A1A1A]/50 text-sm max-w-sm">Select a device from the list on the left to set its repair prices.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={selectedDevice.id} className="space-y-4">
                  <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#FF5C00] uppercase tracking-wider mb-1">{selectedDevice.brand}</p>
                      <h2 className="text-2xl font-bold text-[#1A1A1A]">{selectedDevice.model_name}</h2>
                    </div>
                    <Button onClick={savePricing} disabled={saving} className="bg-[#FF5C00] text-white hover:bg-[#e05200] font-bold shrink-0">
                      {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Prices
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REPAIR_TYPE_OPTIONS.map(rt => (
                      <Card key={rt.value} className="bg-white border-[#E8E4DF] shadow-none hover:border-[#E8E4DF]/80 transition-colors">
                        <CardHeader className="py-4 border-b border-[#E8E4DF]/50 bg-[#F7F7F5]/50">
                          <CardTitle className="text-sm font-semibold text-[#1A1A1A]">{rt.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[#1A1A1A]/70 text-xs font-medium">Customer Facing Estimated Cost (₹)</Label>
                            <div className="relative">
                              <IndianRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40" />
                              <Input 
                                type="number" 
                                value={devicePrices[rt.value]?.estimated_cost || ''} 
                                onChange={e => setPrice(rt.value, 'estimated_cost', +e.target.value)} 
                                className="pl-9 bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] font-semibold text-lg h-12 focus-visible:ring-[#FF5C00]" 
                                placeholder="0" 
                              />
                            </div>
                            <p className="text-[10px] text-[#1A1A1A]/40 leading-tight">This is the single price shown to the customer. Leave 0 to say "Thanks, we will soon let you know the cost".</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E4DF]/40">
                            <div className="space-y-1">
                              <Label className="text-[#1A1A1A]/40 text-[10px] font-semibold uppercase tracking-wider">Internal Min (₹)</Label>
                              <Input 
                                type="number" 
                                value={devicePrices[rt.value]?.min || ''} 
                                onChange={e => setPrice(rt.value, 'min', +e.target.value)} 
                                className="bg-white border-[#E8E4DF] text-[#1A1A1A] h-8 text-xs focus-visible:ring-[#FF5C00]" 
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[#1A1A1A]/40 text-[10px] font-semibold uppercase tracking-wider">Internal Max (₹)</Label>
                              <Input 
                                type="number" 
                                value={devicePrices[rt.value]?.max || ''} 
                                onChange={e => setPrice(rt.value, 'max', +e.target.value)} 
                                className="bg-white border-[#E8E4DF] text-[#1A1A1A] h-8 text-xs focus-visible:ring-[#FF5C00]" 
                                placeholder="0" 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ewaste" className="m-0">
          <div className="flex justify-end mb-4">
            <Button onClick={savePayouts} disabled={saving || Object.keys(editedPayouts).length === 0} className="bg-[#FF5C00] text-white hover:bg-[#e05200] font-bold"><Save className="w-4 h-4 mr-1" />Save Changes</Button>
          </div>
          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div> : (
              <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/50">Brand</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Cash Min</TableHead><TableHead className="text-[#1A1A1A]/50">Cash Max</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Credit Min</TableHead><TableHead className="text-[#1A1A1A]/50">Credit Max</TableHead>
              </TableRow></TableHeader>
              <TableBody>{payoutRates.map(pr => {
                const edited = editedPayouts[pr.id] || pr;
                return (
                  <TableRow key={pr.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5] transition-colors">
                    <TableCell className="text-[#1A1A1A] font-semibold">{pr.brand}</TableCell>
                    <TableCell><Input type="number" value={edited.cash_min} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), cash_min: +e.target.value } }))} className="w-24 h-8 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" /></TableCell>
                    <TableCell><Input type="number" value={edited.cash_max} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), cash_max: +e.target.value } }))} className="w-24 h-8 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" /></TableCell>
                    <TableCell><Input type="number" value={edited.credit_min} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), credit_min: +e.target.value } }))} className="w-24 h-8 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" /></TableCell>
                    <TableCell><Input type="number" value={edited.credit_max} onChange={e => setEditedPayouts(p => ({ ...p, [pr.id]: { ...(p[pr.id] || pr), credit_max: +e.target.value } }))} className="w-24 h-8 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" /></TableCell>
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

// Icons
function ChevronRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IndianRupeeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}
