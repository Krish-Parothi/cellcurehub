'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
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

export default function AnalyticsPage() {
  
  const [range, setRange] = useState<DateRange>('month');
  const [repairs, setRepairs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  

  const getDateFilter = () => {
    const now = new Date();
    if (range === 'today') return now.toISOString().split('T')[0];
    if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (range === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    return '2020-01-01';
  };

  const fetchData = useCallback(async () => {
    
    const since = getDateFilter();
    const [rRes, iRes, revRes] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(*), technician:users!repairs_technician_id_fkey(full_name), shop:shops(name)').gte('created_at', since),
      supabase.from('invoices').select('*').gte('created_at', since),
      supabase.from('reviews').select('*, repair:repairs(technician_id)').gte('created_at', since),
    ]);
    setRepairs(rRes.data || []);
    setInvoices(iRes.data || []);
    setReviews(revRes.data || []);
    
  }, [range]);

  const { user, loading } = useAuthFetch(fetchData, { requiredRole: 'admin' });

  // 0. Total & Shop Earnings
  const totalEarnings = repairs.reduce((sum, r) => sum + (r.final_cost || r.estimated_cost || 0), 0);
  
  const shopEarningsMap: Record<string, number> = {};
  repairs.forEach(r => {
    const shopName = r.shop?.name || 'Unassigned/Platform';
    shopEarningsMap[shopName] = (shopEarningsMap[shopName] || 0) + (r.final_cost || r.estimated_cost || 0);
  });
  const shopEarningsData = Object.entries(shopEarningsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // 1. Revenue by brand
  const brandRevenue: Record<string, number> = {};
  repairs.forEach(r => { const b = r.device?.brand || 'Unknown'; brandRevenue[b] = (brandRevenue[b] || 0) + (r.final_cost || r.estimated_cost || 0); });
  const brandRevenueData = Object.entries(brandRevenue).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // 2. Daily revenue trend
  const dailyMap: Record<string, number> = {};
  invoices.filter(i => i.payment_status === 'paid').forEach(i => {
    const d = new Date(i.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dailyMap[d] = (dailyMap[d] || 0) + i.total;
  });
  const dailyTrend = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

  // 3. Repair types pie
  const typeMap: Record<string, number> = {};
  repairs.forEach(r => { const t = r.repair_type || 'other'; typeMap[t] = (typeMap[t] || 0) + 1; });
  const typePie = Object.entries(typeMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  // 4. Payment methods pie
  const pmMap: Record<string, number> = {};
  invoices.filter(i => i.payment_status === 'paid').forEach(i => { const m = i.payment_method || 'unknown'; pmMap[m] = (pmMap[m] || 0) + 1; });
  const pmPie = Object.entries(pmMap).map(([name, value]) => ({ name, value }));

  // 5. Technician performance
  const techMap: Record<string, { name: string; completed: number; totalHours: number; qaCount: number; doneCount: number; ratings: number[]; }> = {};
  repairs.forEach(r => {
    if (!r.technician_id || !r.technician?.full_name) return;
    const tid = r.technician_id;
    if (!techMap[tid]) techMap[tid] = { name: r.technician.full_name, completed: 0, totalHours: 0, qaCount: 0, doneCount: 0, ratings: [] };
    if (r.status === 'done' || r.status === 'delivered' || r.status === 'out_for_delivery' || r.status === 'ready') {
      techMap[tid].completed++;
      const hours = (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
      techMap[tid].totalHours += hours;
      techMap[tid].doneCount++;
    }
    if (r.status === 'qa_testing') techMap[tid].qaCount++;
  });
  reviews.forEach(rv => { const tid = rv.repair?.technician_id; if (tid && techMap[tid]) techMap[tid].ratings.push(rv.rating); });
  const techPerf = Object.values(techMap).map(t => ({
    name: t.name, completed: t.completed,
    avgTurnaround: t.completed > 0 ? Math.round(t.totalHours / t.completed) : 0,
    qaPassRate: t.doneCount + t.qaCount > 0 ? Math.round((t.doneCount / (t.doneCount + t.qaCount)) * 100) : 0,
    avgRating: t.ratings.length > 0 ? (t.ratings.reduce((s, r) => s + r, 0) / t.ratings.length).toFixed(1) : '—',
  }));

  // 6. Area heatmap
  const areaMap: Record<string, number> = {};
  repairs.forEach(r => {
    const area = r.address ? (NAGPUR_AREAS.find(a => r.address.toLowerCase().includes(a.toLowerCase())) || 'Other') : 'Other';
    areaMap[area] = (areaMap[area] || 0) + 1;
  });
  const areaData = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).map(([area, count]) => ({ area, count }));

  const ranges: { key: DateRange; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Business intelligence & insights</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {ranges.map(r => (
            <Button key={r.key} size="sm" variant={range === r.key ? 'default' : 'outline'}
              onClick={() => setRange(r.key)}
              className={range === r.key ? 'bg-[#FF5C00] text-white hover:bg-[#e05200]' : 'bg-white border-[#E8E4DF] text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'}>
              {r.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0,1,2,3].map(i => <Skeleton key={i} className="h-72 bg-[#1A1A1A]/5 rounded-xl" />)}</div>
      ) : (
        <>
          {/* Total Earnings Summary */}
          <div className="bg-gradient-to-r from-[#FF5C00] to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total Platform Earnings</h2>
            <div className="text-4xl font-bold">₹{fmt(totalEarnings)}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings by Shop */}
            <Card className="bg-white border-[#E8E4DF] shadow-sm col-span-1 lg:col-span-2">
              <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FF5C00]" />Earnings per Shop</CardTitle></CardHeader>
              <CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}>
                <BarChart data={shopEarningsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" /><XAxis dataKey="name" tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><YAxis tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /><Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Revenue by Brand */}
            <Card className="bg-white border-[#E8E4DF] shadow-sm">
              <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FF5C00]" />Revenue by Brand</CardTitle></CardHeader>
              <CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}>
                <BarChart data={brandRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" /><XAxis dataKey="name" tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><YAxis tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /><Bar dataKey="value" fill="#FF5C00" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Daily Revenue Trend */}
            <Card className="bg-white border-[#E8E4DF] shadow-sm">
              <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF5C00]" />Daily Revenue Trend</CardTitle></CardHeader>
              <CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" /><XAxis dataKey="date" tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><YAxis tick={{ fill: '#1A1A1A90', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /><Line type="monotone" dataKey="revenue" stroke="#FF5C00" strokeWidth={2} dot={{ fill: '#FF5C00', r: 3 }} /></LineChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Repair Types */}
            <Card className="bg-white border-[#E8E4DF] shadow-sm">
              <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm">Repair Types Distribution</CardTitle></CardHeader>
              <CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}>
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#1A1A1A40' }}>{typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /></PieChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-white border-[#E8E4DF] shadow-sm">
              <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm">Payment Methods</CardTitle></CardHeader>
              <CardContent className="pt-4"><ResponsiveContainer width="100%" height={250}>
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}><Pie data={pmPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#1A1A1A40' }}>{pmPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: 8, color: '#1A1A1A' }} /></PieChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>

          {/* Technician Performance */}
          <Card className="bg-white border-[#E8E4DF] shadow-sm">
            <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm">Technician Performance</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/50">Technician</TableHead><TableHead className="text-[#1A1A1A]/50">Completed</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Avg Turnaround (hrs)</TableHead><TableHead className="text-[#1A1A1A]/50">QA Pass Rate</TableHead>
                <TableHead className="text-[#1A1A1A]/50">Avg Rating</TableHead>
              </TableRow></TableHeader>
              <TableBody>{techPerf.map(t => (
                <TableRow key={t.name} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                  <TableCell className="text-[#1A1A1A] font-medium">{t.name}</TableCell>
                  <TableCell className="text-[#1A1A1A]">{t.completed}</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{t.avgTurnaround}h</TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{t.qaPassRate}%</TableCell>
                  <TableCell className="text-amber-600 font-medium">{t.avgRating} ★</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>

          {/* Area Heatmap */}
          <Card className="bg-white border-[#E8E4DF] shadow-sm">
            <CardHeader className="border-b border-[#E8E4DF] pb-3"><CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#FF5C00]" />Area Heatmap — Repairs by Location</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent">
                <TableHead className="text-[#1A1A1A]/50">Area</TableHead><TableHead className="text-[#1A1A1A]/50">Repairs</TableHead><TableHead className="text-[#1A1A1A]/50">Share</TableHead>
              </TableRow></TableHeader>
              <TableBody>{areaData.map(a => (
                <TableRow key={a.area} className="border-[#E8E4DF]/40 hover:bg-[#F7F7F5]">
                  <TableCell className="text-[#1A1A1A] font-medium">{a.area}</TableCell>
                  <TableCell className="text-[#1A1A1A]">{a.count}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-2 bg-[#FF5C00] rounded-full" style={{ width: `${(a.count / (areaData[0]?.count || 1)) * 100}%`, maxWidth: 120 }} /><span className="text-[#1A1A1A]/40 text-xs">{repairs.length > 0 ? Math.round((a.count / repairs.length) * 100) : 0}%</span></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
