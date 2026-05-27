'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { NAGPUR_AREAS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const COLORS = ['#00D084', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

type DateRange = 'today' | 'week' | 'month' | 'all';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange>('month');
  const [repairs, setRepairs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateFilter = () => {
    const now = new Date();
    if (range === 'today') return now.toISOString().split('T')[0];
    if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (range === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    return '2020-01-01';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = getDateFilter();
    const [rRes, iRes, revRes] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(brand, model_name), technician:users!repairs_technician_id_fkey(full_name)').gte('created_at', since),
      supabase.from('invoices').select('*').gte('created_at', since),
      supabase.from('reviews').select('*, repair:repairs(technician_id)').gte('created_at', since),
    ]);
    setRepairs(rRes.data || []);
    setInvoices(iRes.data || []);
    setReviews(revRes.data || []);
    setLoading(false);
  }, [range]);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

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
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Business intelligence & insights</p>
        </div>
        <div className="flex gap-2">
          {ranges.map(r => (
            <Button key={r.key} size="sm" variant={range === r.key ? 'default' : 'outline'}
              onClick={() => setRange(r.key)}
              className={range === r.key ? 'bg-[#00D084] text-black' : 'border-white/10 text-white/60 hover:text-white'}>
              {r.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0,1,2,3].map(i => <Skeleton key={i} className="h-72 bg-white/5 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Brand */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00D084]" />Revenue by Brand</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}>
                <BarChart data={brandRevenueData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }} /><YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: 8 }} /><Bar dataKey="value" fill="#00D084" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Daily Revenue Trend */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#00D084]" />Daily Revenue Trend</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} /><YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: 8 }} /><Line type="monotone" dataKey="revenue" stroke="#00D084" strokeWidth={2} dot={{ fill: '#00D084', r: 3 }} /></LineChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Repair Types */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-white text-sm">Repair Types Distribution</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#ffffff30' }}>{typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: 8 }} /></PieChart>
              </ResponsiveContainer></CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-white text-sm">Payment Methods</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={pmPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#ffffff30' }}>{pmPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: 8 }} /></PieChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>

          {/* Technician Performance */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-white text-sm">Technician Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Technician</TableHead><TableHead className="text-white/50">Completed</TableHead>
                <TableHead className="text-white/50">Avg Turnaround (hrs)</TableHead><TableHead className="text-white/50">QA Pass Rate</TableHead>
                <TableHead className="text-white/50">Avg Rating</TableHead>
              </TableRow></TableHeader>
              <TableBody>{techPerf.map(t => (
                <TableRow key={t.name} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{t.name}</TableCell>
                  <TableCell className="text-white">{t.completed}</TableCell>
                  <TableCell className="text-white/60">{t.avgTurnaround}h</TableCell>
                  <TableCell className="text-white/60">{t.qaPassRate}%</TableCell>
                  <TableCell className="text-amber-400">{t.avgRating} ★</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>

          {/* Area Heatmap */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#00D084]" />Area Heatmap — Repairs by Location</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Area</TableHead><TableHead className="text-white/50">Repairs</TableHead><TableHead className="text-white/50">Share</TableHead>
              </TableRow></TableHeader>
              <TableBody>{areaData.map(a => (
                <TableRow key={a.area} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{a.area}</TableCell>
                  <TableCell className="text-white">{a.count}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-2 bg-[#00D084] rounded-full" style={{ width: `${(a.count / (areaData[0]?.count || 1)) * 100}%`, maxWidth: 120 }} /><span className="text-white/40 text-xs">{repairs.length > 0 ? Math.round((a.count / repairs.length) * 100) : 0}%</span></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
