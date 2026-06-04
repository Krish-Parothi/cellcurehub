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

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-[#1A1A1A]/5" />)}</div>;

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
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Spend Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 text-center shadow-sm">
          <IndianRupee className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#1A1A1A]">₹{totalSpent.toLocaleString('en-IN')}</p>
          <p className="text-[#1A1A1A]/60 text-xs mt-1">Total Spent</p>
        </div>
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 text-center shadow-sm">
          <TrendingUp className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalRepairs}</p>
          <p className="text-[#1A1A1A]/60 text-xs mt-1">Total Repairs</p>
        </div>
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 text-center shadow-sm">
          <BarChart3 className="w-5 h-5 text-[#FF5C00] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#1A1A1A]">₹{Math.round(avgCost).toLocaleString('en-IN')}</p>
          <p className="text-[#1A1A1A]/60 text-xs mt-1">Avg Cost/Repair</p>
        </div>
      </div>

      {/* Bar Chart - Spend by Brand */}
      {brandData.length > 0 && (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-[#1A1A1A] font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FF5C00]" />Spend by Device Brand</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData}>
                <XAxis dataKey="name" tick={{ fill: '#1A1A1A80', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#1A1A1A40', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: '12px', color: '#1A1A1A' }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
                <Bar dataKey="total" fill="#FF5C00" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Line Chart - Monthly Spend */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[#1A1A1A] font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF5C00]" />Monthly Spend (Last 12 Months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#1A1A1A60', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#1A1A1A40', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #E8E4DF', borderRadius: '12px', color: '#1A1A1A' }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
              <Line type="monotone" dataKey="total" stroke="#FF5C00" strokeWidth={2} dot={{ fill: '#FF5C00', r: 4 }} activeDot={{ r: 6, fill: '#FF5C00' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {totalRepairs === 0 && (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 text-center mt-6 shadow-sm">
          <BarChart3 className="w-10 h-10 text-[#1A1A1A]/20 mx-auto mb-3" />
          <p className="text-[#1A1A1A]/60 text-sm">No repair data yet. Book a repair to see analytics.</p>
        </div>
      )}
    </motion.div>
  );
}
