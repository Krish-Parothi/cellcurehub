'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, History, Wrench, Smartphone, Recycle, IndianRupee } from 'lucide-react';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { RepairStatus } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const ewasteStatusColor = (s: string) => {
  const m: Record<string, string> = {
    rejected: 'bg-red-500/10 text-red-600',
    picked_up: 'bg-purple-500/10 text-purple-600',
    credited: 'bg-[#FF5C00]/10 text-[#FF5C00]',
  };
  return m[s] || 'bg-gray-500/10 text-gray-600';
};

const repairStatusColor = (s: string) => {
  if (s === 'delivered') return 'bg-emerald-500/10 text-emerald-600';
  if (s === 'cancelled') return 'bg-red-500/10 text-red-600';
  if (s === 'done') return 'bg-green-500/10 text-green-600';
  return 'bg-gray-500/10 text-gray-600';
};

export default function AdminHistoryPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [ewaste, setEwaste] = useState<any[]>([]);
  const [resell, setResell] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    // 1. Fetch Repairs (delivered or cancelled)
    const { data: repairsData } = await supabase
      .from('repairs')
      .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name)')
      .in('status', ['delivered', 'cancelled', 'done'])
      .order('created_at', { ascending: false });
    
    setRepairs(repairsData || []);

    // 2. Fetch E-Waste & Resell (terminal states: picked_up, credited, rejected)
    const { data: ewasteData } = await supabase
      .from('ewaste')
      .select('*, customer:users!ewaste_customer_id_fkey(full_name), ewaste_category:ewaste_categories(name)')
      .in('status', ['picked_up', 'credited', 'rejected'])
      .order('created_at', { ascending: false });

    const allEwaste = ewasteData || [];
    setEwaste(allEwaste.filter(e => e.category === 'ewaste'));
    setResell(allEwaste.filter(e => e.category === 'resell'));
  }, []);

  const { loading } = useAuthFetch(fetchData, {
    requiredRole: 'admin',
    deps: [],
  });

  const filterData = (data: any[]) => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(item => item.customer?.full_name?.toLowerCase().includes(s));
  };

  const filteredRepairs = filterData(repairs);
  const filteredEwaste = filterData(ewaste);
  const filteredResell = filterData(resell);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <History className="w-6 h-6 text-[#FF5C00]" /> History
          </h1>
          <p className="text-[#1A1A1A]/50 text-sm mt-1">View fully completed or cancelled orders</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#1A1A1A]/40" />
          <Input 
            className="pl-9 bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 w-full" 
            placeholder="Search by customer name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </motion.div>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="bg-[#E8E4DF]/50 border border-[#E8E4DF] p-1 rounded-xl mb-6">
          <TabsTrigger value="repairs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#FF5C00] data-[state=active]:shadow-sm px-6 py-2 text-sm font-semibold transition-all">
            <Wrench className="w-4 h-4 mr-2" /> Repairs ({filteredRepairs.length})
          </TabsTrigger>
          <TabsTrigger value="resell" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#FF5C00] data-[state=active]:shadow-sm px-6 py-2 text-sm font-semibold transition-all">
            <Smartphone className="w-4 h-4 mr-2" /> Reselling ({filteredResell.length})
          </TabsTrigger>
          <TabsTrigger value="ewaste" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#FF5C00] data-[state=active]:shadow-sm px-6 py-2 text-sm font-semibold transition-all">
            <Recycle className="w-4 h-4 mr-2" /> E-Waste ({filteredEwaste.length})
          </TabsTrigger>
        </TabsList>

        <Card className="bg-white border-[#E8E4DF] shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6"><Skeleton className="h-64 w-full bg-[#1A1A1A]/5" /></div>
            ) : (
              <>
                <TabsContent value="repairs" className="m-0">
                  {filteredRepairs.length === 0 ? (
                    <div className="p-12 text-center text-[#1A1A1A]/50">No completed repairs found.</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="border-[#E8E4DF]/60">
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Device / Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Final Cost</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredRepairs.map(r => (
                          <TableRow key={r.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                            <TableCell className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-medium text-[#1A1A1A]">{r.customer?.full_name}</TableCell>
                            <TableCell>
                              <p className="text-[#1A1A1A] font-medium">{r.device ? `${r.device.brand} ${r.device.model_name}` : r.manual_model || 'Unknown'}</p>
                              <p className="text-[#1A1A1A]/60 text-xs truncate max-w-xs">{r.repair_type?.replace(/_/g, ' ') || r.issue_description}</p>
                            </TableCell>
                            <TableCell><Badge className={repairStatusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status as RepairStatus]}</Badge></TableCell>
                            <TableCell className="text-right font-semibold text-[#1A1A1A]">
                              {r.final_cost != null ? `₹${fmt(r.final_cost)}` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="resell" className="m-0">
                  {filteredResell.length === 0 ? (
                    <div className="p-12 text-center text-[#1A1A1A]/50">No resell history found.</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="border-[#E8E4DF]/60">
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Device Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Payout</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredResell.map(e => (
                          <TableRow key={e.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                            <TableCell className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">
                              {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-medium text-[#1A1A1A]">{e.customer?.full_name}</TableCell>
                            <TableCell>
                              <p className="text-[#1A1A1A] font-medium">{e.device_description}</p>
                              <p className="text-[#1A1A1A]/60 text-xs">Condition: {e.condition?.replace(/_/g, ' ')}</p>
                            </TableCell>
                            <TableCell><Badge className={`${ewasteStatusColor(e.status)} capitalize`}>{e.status.replace(/_/g, ' ')}</Badge></TableCell>
                            <TableCell className="text-right font-semibold text-[#FF5C00]">
                              {e.admin_offer != null ? `₹${fmt(e.admin_offer)}` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="ewaste" className="m-0">
                  {filteredEwaste.length === 0 ? (
                    <div className="p-12 text-center text-[#1A1A1A]/50">No e-waste history found.</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="border-[#E8E4DF]/60">
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Item Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Offer</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredEwaste.map(e => (
                          <TableRow key={e.id} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                            <TableCell className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">
                              {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-medium text-[#1A1A1A]">{e.customer?.full_name}</TableCell>
                            <TableCell>
                              <p className="text-[#1A1A1A] font-medium">{e.device_description}</p>
                              <p className="text-[#1A1A1A]/60 text-xs">{e.ewaste_category?.name || 'Other'}</p>
                            </TableCell>
                            <TableCell><Badge className={`${ewasteStatusColor(e.status)} capitalize`}>{e.status.replace(/_/g, ' ')}</Badge></TableCell>
                            <TableCell className="text-right font-semibold text-[#FF5C00]">
                              {e.admin_offer != null ? `₹${fmt(e.admin_offer)}` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
