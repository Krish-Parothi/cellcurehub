'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, TrendingUp, ChartBar as BarChart3, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

interface RepairWithInvoice {
  id: string;
  device: { brand: string; model_name: string } | null;
  created_at: string;
  invoices: Invoice[];
}

export default function AnalyticsTab({ userId }: { userId: string }) {
  const [data, setData] = useState<RepairWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: repairs } = await supabase.from('repairs').select('id, created_at, device:devices(brand, model_name), invoices(*)').eq('customer_id', userId);
      setData((repairs as unknown as RepairWithInvoice[]) || []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />)}</div>;

  // Calculations
  const paidInvoices = data.flatMap(r => r.invoices.filter(inv => inv.payment_status === 'paid'));
  const totalSpent = paidInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalRepairs = data.length;
  const avgCost = paidInvoices.length > 0 ? totalSpent / paidInvoices.length : 0;

  // Spend by brand
  const brandSpend: Record<string, number> = {};
  data.forEach(r => {
    const brand = r.device?.brand || 'Other';
    const spend = r.invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.total, 0);
    brandSpend[brand] = (brandSpend[brand] || 0) + spend;
  });
  const brandData = Object.entries(brandSpend).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));

  // Monthly spend (last 12 months)
  const monthlySpend: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthlySpend[key] = 0;
  }
  paidInvoices.forEach(inv => {
    const d = new Date(inv.created_at);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (key in monthlySpend) monthlySpend[key] += inv.total;
  });
  const monthlyData = Object.entries(monthlySpend).map(([month, total]) => ({ month, total }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">Spend Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 text-center">
          <IndianRupee className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">₹{totalSpent.toLocaleString('en-IN')}</p>
          <p className="text-white/40 text-xs mt-1">Total Spent</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <TrendingUp className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalRepairs}</p>
          <p className="text-white/40 text-xs mt-1">Total Repairs</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <BarChart3 className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">₹{Math.round(avgCost).toLocaleString('en-IN')}</p>
          <p className="text-white/40 text-xs mt-1">Avg Cost/Repair</p>
        </div>
      </div>

      {/* Bar Chart - Spend by Brand */}
      {brandData.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00D084]" />Spend by Device Brand</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData}>
                <XAxis dataKey="name" tick={{ fill: '#ffffff80', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
                <Bar dataKey="total" fill="#00D084" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Line Chart - Monthly Spend */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#00D084]" />Monthly Spend (Last 12 Months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
              <Line type="monotone" dataKey="total" stroke="#00D084" strokeWidth={2} dot={{ fill: '#00D084', r: 4 }} activeDot={{ r: 6, fill: '#00D084' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {totalRepairs === 0 && (
        <div className="glass rounded-2xl p-12 text-center mt-6">
          <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No repair data yet. Book a repair to see analytics.</p>
        </div>
      )}
    </motion.div>
  );
}
