'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { useShopId } from '@/lib/use-shop-id';
import { NAGPUR_AREAS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const COLORS = ['#FF5C00', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

type DateRange = 'today' | 'week' | 'month' | 'all';

export default function ShopAnalyticsPage() {
  const shopId = useShopId();
  const [range, setRange] = useState<DateRange>('month');
  const [repairs, setRepairs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const getDateFilter = () => {
    const now = new Date();
    if (range === 'today') return now.toISOString().split('T')[0];
    if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (range === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    return '2020-01-01';
  };

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    const since = getDateFilter();
    const [rRes, revRes] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(brand, model_name), technician:users!repairs_technician_id_fkey(full_name)').eq('shop_id', shopId).gte('created_at', since),
      supabase.from('reviews').select('*, repair:repairs!inner(technician_id, shop_id)').eq('repair.shop_id', shopId).gte('created_at', since),
    ]);
    setRepairs(rRes.data || []); setReviews(revRes.data || []);
  }, [range, shopId]);

  const { user, loading } = useAuthFetch(fetchData, {
    requiredRole: ['shop_admin', 'admin'],
    deps: [shopId],
    realtimeTable: 'repairs',
  });

  // Charts data — same calculations as admin
  const brandRevenue: Record<string, number> = {};
  repairs.forEach(r => { const b = r.device?.brand || r.manual_model?.split(' ')[0] || 'Unknown'; brandRevenue[b] = (brandRevenue[b] || 0) + (r.final_cost || r.estimated_cost || 0); });
  const brandRevenueData = Object.entries(brandRevenue).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const dailyMap: Record<string, number> = {};
  repairs.forEach(r => {
    const d = r.created_at.split('T')[0];
    dailyMap[d] = (dailyMap[d] || 0) + (r.final_cost || r.estimated_cost || 0);
  });
  const dailyTrend = Object.keys(dailyMap).sort().map(dateStr => ({
    date: new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: dailyMap[dateStr]
  }));

  const typeMap: Record<string, number> = {};
  repairs.forEach(r => { const t = r.repair_type || 'other'; typeMap[t] = (typeMap[t] || 0) + 1; });
  const typePie = Object.entries(typeMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const techMap: Record<string, { name: string; completed: number; totalHours: number; qaCount: number; doneCount: number; ratings: number[] }> = {};
  repairs.forEach(r => {
    if (!r.technician_id || !r.technician?.full_name) return;
    const tid = r.technician_id;
    if (!techMap[tid]) techMap[tid] = { name: r.technician.full_name, completed: 0, totalHours: 0, qaCount: 0, doneCount: 0, ratings: [] };
    if (['done', 'delivered', 'out_for_delivery', 'ready'].includes(r.status)) {
      techMap[tid].completed++;
      techMap[tid].totalHours += (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
      techMap[tid].doneCount++;
    }
    if (r.status === 'qa_testing') techMap[tid].qaCount++;
  });
  reviews.forEach(rv => { const tid = rv.repair?.technician_id; if (tid && techMap[tid]) techMap[tid].ratings.push(rv.rating); });
  const techPerf = Object.values(techMap).map(t => ({ name: t.name, completed: t.completed, avgTurnaround: t.completed > 0 ? Math.round(t.totalHours / t.completed) : 0, qaPassRate: t.doneCount + t.qaCount > 0 ? Math.round((t.doneCount / (t.doneCount + t.qaCount)) * 100) : 0, avgRating: t.ratings.length > 0 ? (t.ratings.reduce((s, r) => s + r, 0) / t.ratings.length).toFixed(1) : '—' }));

  const areaMap: Record<string, number> = {};
  repairs.forEach(r => { const area = r.address ? (NAGPUR_AREAS.find(a => r.address.toLowerCase().includes(a.toLowerCase())) || 'Other') : 'Other'; areaMap[area] = (areaMap[area] || 0) + 1; });
  const areaData = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).map(([area, count]) => ({ area, count }));

  const ranges: { key: DateRange; label: string }[] = [{ key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'all', label: 'All' }];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics</h1><p className="text-[#1A1A1A]/60 text-sm mt-1">Your shop&apos;s performance</p></div>
        <div className="flex gap-2">{ranges.map(r => (
          <Button key={r.key} size="sm" variant={range === r.key ? 'default' : 'outline'} onClick={() => setRange(r.key)} className={range === r.key ? 'bg-[#FF5C00] text-white hover:bg-[#e05200] font-semibold' : 'border-[#E8E4DF] text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5'}>{r.label}</Button>
        ))}</div>
      </motion.div>

      {loading ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0,1,2,3].map(i => <Skeleton key={i} className="h-72 bg-[#1A1A1A]/5 rounded-xl" />)}</div> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardHeader className="border-b border-[#E8E4DF]/60"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FF5C00]" />Revenue by Brand</CardTitle></CardHeader><CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}><BarChart data={brandRevenueData}><CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" /><XAxis dataKey="name" tick={{ fill: '#1A1A1A60', fontSize: 10 }} /><YAxis tick={{ fill: '#1A1A1A60', fontSize: 10 }} /><Tooltip contentStyle={{ background: 'white', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /><Bar dataKey="value" fill="#FF5C00" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>

            <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardHeader className="border-b border-[#E8E4DF]/60"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF5C00]" />Daily Revenue</CardTitle></CardHeader><CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}><LineChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" /><XAxis dataKey="date" tick={{ fill: '#1A1A1A60', fontSize: 10 }} /><YAxis tick={{ fill: '#1A1A1A60', fontSize: 10 }} /><Tooltip contentStyle={{ background: 'white', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /><Line type="monotone" dataKey="revenue" stroke="#FF5C00" strokeWidth={2} dot={{ fill: '#FF5C00', r: 3 }} /></LineChart></ResponsiveContainer></CardContent></Card>

            <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardHeader className="border-b border-[#E8E4DF]/60"><CardTitle className="text-[#1A1A1A] text-sm">Repair Types</CardTitle></CardHeader><CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#1A1A1A30' }}>{typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: 'white', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /></PieChart></ResponsiveContainer></CardContent></Card>

          </div>

          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardHeader className="border-b border-[#E8E4DF]/60"><CardTitle className="text-[#1A1A1A] text-sm">Technician Performance</CardTitle></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent"><TableHead className="text-[#1A1A1A]/55">Technician</TableHead><TableHead className="text-[#1A1A1A]/55">Completed</TableHead><TableHead className="text-[#1A1A1A]/55">Avg Hours</TableHead><TableHead className="text-[#1A1A1A]/55">QA Pass</TableHead><TableHead className="text-[#1A1A1A]/55">Rating</TableHead></TableRow></TableHeader>
            <TableBody>{techPerf.map(t => (<TableRow key={t.name} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]"><TableCell className="text-[#1A1A1A] font-medium">{t.name}</TableCell><TableCell className="text-[#1A1A1A]/70">{t.completed}</TableCell><TableCell className="text-[#1A1A1A]/60">{t.avgTurnaround}h</TableCell><TableCell className="text-[#1A1A1A]/60">{t.qaPassRate}%</TableCell><TableCell className="text-amber-500 font-semibold">{t.avgRating} ★</TableCell></TableRow>))}</TableBody></Table>
          </CardContent></Card>

          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardHeader className="border-b border-[#E8E4DF]/60"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#FF5C00]" />Area Heatmap</CardTitle></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-[#E8E4DF] hover:bg-transparent"><TableHead className="text-[#1A1A1A]/55">Area</TableHead><TableHead className="text-[#1A1A1A]/55">Repairs</TableHead><TableHead className="text-[#1A1A1A]/55">Share</TableHead></TableRow></TableHeader>
            <TableBody>{areaData.map(a => (<TableRow key={a.area} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]"><TableCell className="text-[#1A1A1A] font-medium">{a.area}</TableCell><TableCell className="text-[#1A1A1A]/70">{a.count}</TableCell><TableCell><div className="flex items-center gap-2"><div className="h-2 bg-[#FF5C00] rounded-full" style={{ width: `${(a.count / (areaData[0]?.count || 1)) * 100}%`, maxWidth: 120 }} /><span className="text-[#1A1A1A]/40 text-xs">{repairs.length > 0 ? Math.round((a.count / repairs.length) * 100) : 0}%</span></div></TableCell></TableRow>))}</TableBody></Table>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
