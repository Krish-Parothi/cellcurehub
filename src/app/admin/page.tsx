'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS, NAGPUR_AREAS,
} from '@/lib/types';
import type { Repair, User, Part, Invoice } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { LayoutDashboard, Wrench, Users, Package, ChartBar as BarChart3, Phone, Search, Plus, Pencil, Trash2, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, IndianRupee, MessageSquare, Send } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const shortId = (id: string) => id.slice(0, 8);
const today = () => new Date().toISOString().slice(0, 10);
const COLORS = ['#00D084','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#F97316'];
const statusColor = (s: string) => {
  const m: Record<string,string> = {
    booked:'bg-blue-500/20 text-blue-400', pickup_scheduled:'bg-cyan-500/20 text-cyan-400',
    device_received:'bg-indigo-500/20 text-indigo-400', diagnostic:'bg-yellow-500/20 text-yellow-400',
    repair_in_progress:'bg-orange-500/20 text-orange-400', qa_testing:'bg-purple-500/20 text-purple-400',
    ready:'bg-green-500/20 text-green-400', delivered:'bg-emerald-500/20 text-emerald-400',
  };
  return m[s] || 'bg-gray-500/20 text-gray-400';
};

// ── Page ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [repairFilter, setRepairFilter] = useState({ status: 'all', search: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [partDialog, setPartDialog] = useState<{ open: boolean; part: Part | null }>({ open: false, part: null });
  const [partForm, setPartForm] = useState({ name:'', brand:'', model_compatible:'', quantity_in_stock:0, cost_price:0, selling_price:0, low_stock_threshold:5 });

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.replace('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [r, u, p, i] = await Promise.all([
      supabase.from('repairs').select('*, device:devices(*), customer:users!repairs_customer_id_fkey(*), technician:users!repairs_technician_id_fkey(full_name)').order('created_at',{ascending:false}),
      supabase.from('users').select('*'),
      supabase.from('parts').select('*'),
      supabase.from('invoices').select('*, repair:repairs(id)'),
    ]);
    if (r.data) setRepairs(r.data as Repair[]);
    if (u.data) setCustomers(u.data as User[]);
    if (p.data) setParts(p.data as Part[]);
    if (i.data) setInvoices(i.data as Invoice[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  // ── Derived data ─────────────────────────────────────────────────
  const openRepairs = repairs.filter(r => r.status !== 'delivered');
  const outForDelivery = repairs.filter(r => r.status === 'ready');
  const todayInvoices = invoices.filter(i => i.created_at?.startsWith(today()));
  const todayRevenue = todayInvoices.reduce((s, i) => s + i.total, 0);
  const pendingPayments = invoices.filter(i => i.payment_status === 'pending');

  // ── Analytics data ───────────────────────────────────────────────
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().slice(0, 10);
    return { date: d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}), count: repairs.filter(r => r.created_at?.startsWith(ds)).length };
  });
  const last12Weeks = Array.from({ length: 12 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    const wk = `W${12 - i}`;
    const rev = invoices.filter(inv => { const cd = new Date(inv.created_at); return cd >= start && cd < end; }).reduce((s, i) => s + i.total, 0);
    return { week: wk, revenue: rev };
  }).reverse();
  const deviceCounts: Record<string, number> = {};
  repairs.forEach(r => { const d = r.device?.model_name || r.device?.brand || 'Unknown'; deviceCounts[d] = (deviceCounts[d]||0)+1; });
  const topDevices = Object.entries(deviceCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value}));
  const statusDist = REPAIR_STATUS_ORDER.map(s => ({ name: REPAIR_STATUS_LABELS[s], value: repairs.filter(r=>r.status===s).length })).filter(d=>d.value>0);

  // ── Follow-ups ───────────────────────────────────────────────────
  const followUps = repairs.filter(r => {
    if (r.status !== 'delivered') return false;
    const delivered = new Date(r.updated_at);
    return (Date.now() - delivered.getTime()) > 48*60*60*1000;
  });

  // ── Actions ─────────────────────────────────────────────────────
  const updateStatus = async (repairId: string, status: string) => {
    const { error } = await supabase.from('repairs').update({ status }).eq('id', repairId);
    if (error) { toast.error('Failed to update status'); return; }
    await supabase.from('repair_timeline').insert({ repair_id: repairId, status, note: `Status updated to ${REPAIR_STATUS_LABELS[status as keyof typeof REPAIR_STATUS_LABELS]}` });
    toast.success('Status updated');
    fetchData();
  };

  const savePart = async () => {
    const p = partDialog.part;
    const payload = { ...partForm, quantity_in_stock: Number(partForm.quantity_in_stock), cost_price: Number(partForm.cost_price), selling_price: Number(partForm.selling_price), low_stock_threshold: Number(partForm.low_stock_threshold) };
    if (p) {
      const { error } = await supabase.from('parts').update(payload).eq('id', p.id);
      if (error) { toast.error('Update failed'); return; }
      toast.success('Part updated');
    } else {
      const { error } = await supabase.from('parts').insert(payload);
      if (error) { toast.error('Add failed'); return; }
      toast.success('Part added');
    }
    setPartDialog({ open: false, part: null });
    fetchData();
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else { toast.success('Part deleted'); fetchData(); }
  };

  // ── Filtered lists ──────────────────────────────────────────────
  const filteredRepairs = repairs.filter(r => {
    if (repairFilter.status !== 'all' && r.status !== repairFilter.status) return false;
    if (repairFilter.search) {
      const s = repairFilter.search.toLowerCase();
      return r.customer?.full_name?.toLowerCase().includes(s) || r.device?.model_name?.toLowerCase().includes(s) || r.id.startsWith(s);
    }
    return true;
  });
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(s);
  });

  // ── Render ──────────────────────────────────────────────────────
  if (authLoading || !user || user.role !== 'admin') return null;

  const sidebarItems = [
    { key:'overview', icon:LayoutDashboard, label:'Overview' },
    { key:'repairs', icon:Wrench, label:'Repairs' },
    { key:'customers', icon:Users, label:'Customers' },
    { key:'inventory', icon:Package, label:'Inventory' },
    { key:'analytics', icon:BarChart3, label:'Analytics' },
    { key:'followups', icon:Phone, label:'Follow-ups' },
  ];

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string|number; sub?: string }) => (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#00D084]/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-white/50">{label}</p><p className="text-3xl font-bold text-white mt-1">{value}</p>{sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}</div>
            <div className="w-12 h-12 rounded-xl bg-[#00D084]/10 flex items-center justify-center"><Icon className="w-6 h-6 text-[#00D084]" /></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <div className="pt-20 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-5rem)] border-r border-white/5 bg-white/[0.02] p-4 gap-1 sticky top-20">
          {sidebarItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${tab===item.key ? 'bg-[#00D084]/10 text-[#00D084] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap lg:hidden">
              {sidebarItems.map(i => <TabsTrigger key={i.key} value={i.key} className="text-xs">{i.label}</TabsTrigger>)}
            </TabsList>

            {/* ── OVERVIEW ─────────────────────────────────────── */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Wrench} label="Open Repairs" value={openRepairs.length} />
                <StatCard icon={Send} label="Out for Delivery" value={outForDelivery.length} />
                <StatCard icon={IndianRupee} label="Today Revenue" value={`₹${fmt(todayRevenue)}`} />
                <StatCard icon={Clock} label="Pending Payments" value={pendingPayments.length} />
              </div>
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardHeader><CardTitle className="text-white">Recent Repairs</CardTitle></CardHeader>
                <CardContent>
                  {loading ? Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full mb-2" />) : (
                    <Table>
                      <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">ID</TableHead><TableHead className="text-white/50">Customer</TableHead>
                        <TableHead className="text-white/50">Device</TableHead><TableHead className="text-white/50">Status</TableHead>
                        <TableHead className="text-white/50">Cost</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{repairs.slice(0,10).map(r=>(
                        <TableRow key={r.id} className="border-white/5 hover:bg-white/5 cursor-pointer" onClick={()=>setSelectedRepair(r)}>
                          <TableCell className="font-mono text-[#00D084]">{shortId(r.id)}</TableCell>
                          <TableCell>{r.customer?.full_name||'—'}</TableCell>
                          <TableCell>{r.device?.model_name||'—'}</TableCell>
                          <TableCell><Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status]}</Badge></TableCell>
                          <TableCell>₹{fmt(r.final_cost||r.estimated_cost||0)}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── REPAIRS ─────────────────────────────────────── */}
            <TabsContent value="repairs">
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={repairFilter.status} onValueChange={v=>setRepairFilter(f=>({...f,status:v}))}>
                  <SelectTrigger className="w-44 bg-white/5 border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">
                    <SelectItem value="all">All Status</SelectItem>
                    {REPAIR_STATUS_ORDER.map(s=><SelectItem key={s} value={s}>{REPAIR_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" /><Input className="pl-9 bg-white/5 border-white/10" placeholder="Search repairs..." value={repairFilter.search} onChange={e=>setRepairFilter(f=>({...f,search:e.target.value}))} /></div>
              </div>
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardContent className="p-0">
                  {loading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
                    <Table>
                      <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">ID</TableHead><TableHead className="text-white/50">Customer</TableHead>
                        <TableHead className="text-white/50">Device</TableHead><TableHead className="text-white/50">Status</TableHead>
                        <TableHead className="text-white/50">Technician</TableHead><TableHead className="text-white/50">Cost</TableHead>
                        <TableHead className="text-white/50">Date</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{filteredRepairs.map(r=>(
                        <TableRow key={r.id} className="border-white/5 hover:bg-white/5 cursor-pointer" onClick={()=>setSelectedRepair(r)}>
                          <TableCell className="font-mono text-[#00D084]">{shortId(r.id)}</TableCell>
                          <TableCell>{r.customer?.full_name||'—'}</TableCell>
                          <TableCell>{r.device?.model_name||'—'}</TableCell>
                          <TableCell><Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status]}</Badge></TableCell>
                          <TableCell>{r.technician?.full_name||'—'}</TableCell>
                          <TableCell>₹{fmt(r.final_cost||r.estimated_cost||0)}</TableCell>
                          <TableCell className="text-white/50 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CUSTOMERS ───────────────────────────────────── */}
            <TabsContent value="customers">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" /><Input className="pl-9 bg-white/5 border-white/10" placeholder="Search customers..." value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} /></div>
              </div>
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardContent className="p-0">
                  {loading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
                    <Table>
                      <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Email</TableHead>
                        <TableHead className="text-white/50">Phone</TableHead><TableHead className="text-white/50">Repairs</TableHead>
                        <TableHead className="text-white/50">Total Spent</TableHead><TableHead className="text-white/50">Joined</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{filteredCustomers.map(c=>{
                        const cRepairs = repairs.filter(r=>r.customer_id===c.id);
                        const spent = cRepairs.reduce((s,r)=>s+(r.final_cost||0),0);
                        return (
                          <TableRow key={c.id} className="border-white/5 hover:bg-white/5 cursor-pointer" onClick={()=>setSelectedCustomer(c)}>
                            <TableCell className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xs">{c.full_name?.[0]||'?'}</AvatarFallback></Avatar>{c.full_name}</TableCell>
                            <TableCell className="text-white/60">{c.email||'—'}</TableCell>
                            <TableCell className="text-white/60">{c.phone||'—'}</TableCell>
                            <TableCell>{cRepairs.length}</TableCell>
                            <TableCell>₹{fmt(spent)}</TableCell>
                            <TableCell className="text-white/50 text-xs">{new Date(c.created_at).toLocaleDateString('en-IN')}</TableCell>
                          </TableRow>
                        );
                      })}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── INVENTORY ───────────────────────────────────── */}
            <TabsContent value="inventory">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Parts Inventory</h2>
                <Button className="bg-[#00D084] text-[#0A0A0A] hover:bg-[#00D084]/80" onClick={()=>{setPartForm({name:'',brand:'',model_compatible:'',quantity_in_stock:0,cost_price:0,selling_price:0,low_stock_threshold:5});setPartDialog({open:true,part:null});}}>
                  <Plus className="w-4 h-4 mr-1" />Add Part
                </Button>
              </div>
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardContent className="p-0">
                  {loading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
                    <Table>
                      <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Brand</TableHead>
                        <TableHead className="text-white/50">Model</TableHead><TableHead className="text-white/50">Stock</TableHead>
                        <TableHead className="text-white/50">Cost</TableHead><TableHead className="text-white/50">Selling</TableHead>
                        <TableHead className="text-white/50">Status</TableHead><TableHead className="text-white/50">Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{parts.map(p=>{
                        const low = p.quantity_in_stock <= p.low_stock_threshold;
                        return (
                          <TableRow key={p.id} className={`border-white/5 ${low ? 'bg-red-500/5' : 'hover:bg-white/5'}`}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-white/60">{p.brand}</TableCell>
                            <TableCell className="text-white/60">{p.model_compatible}</TableCell>
                            <TableCell className={low ? 'text-red-400 font-bold' : ''}>{p.quantity_in_stock}</TableCell>
                            <TableCell>₹{fmt(p.cost_price)}</TableCell>
                            <TableCell>₹{fmt(p.selling_price)}</TableCell>
                            <TableCell>{low ? <Badge className="bg-red-500/20 text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge> : <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>}</TableCell>
                            <TableCell className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/60 hover:text-[#00D084]" onClick={()=>{setPartForm({name:p.name,brand:p.brand,model_compatible:p.model_compatible,quantity_in_stock:p.quantity_in_stock,cost_price:p.cost_price,selling_price:p.selling_price,low_stock_threshold:p.low_stock_threshold});setPartDialog({open:true,part:p});}}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/60 hover:text-red-400" onClick={()=>deletePart(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── ANALYTICS ───────────────────────────────────── */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader><CardTitle className="text-white text-sm">Repairs / Day (30d)</CardTitle></CardHeader>
                  <CardContent><ResponsiveContainer width="100%" height={250}>
                    <BarChart data={last30}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="date" tick={{fill:'#ffffff60',fontSize:10}} /><YAxis tick={{fill:'#ffffff60',fontSize:10}} /><Tooltip contentStyle={{background:'#1A1A1A',border:'1px solid #ffffff10',borderRadius:8}} /><Bar dataKey="count" fill="#00D084" radius={[4,4,0,0]} /></BarChart>
                  </ResponsiveContainer></CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader><CardTitle className="text-white text-sm">Revenue / Week (12w)</CardTitle></CardHeader>
                  <CardContent><ResponsiveContainer width="100%" height={250}>
                    <LineChart data={last12Weeks}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="week" tick={{fill:'#ffffff60',fontSize:10}} /><YAxis tick={{fill:'#ffffff60',fontSize:10}} /><Tooltip contentStyle={{background:'#1A1A1A',border:'1px solid #ffffff10',borderRadius:8}} /><Line type="monotone" dataKey="revenue" stroke="#00D084" strokeWidth={2} dot={{fill:'#00D084',r:3}} /></LineChart>
                  </ResponsiveContainer></CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader><CardTitle className="text-white text-sm">Top Repaired Devices</CardTitle></CardHeader>
                  <CardContent><ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={topDevices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{stroke:'#ffffff30'}}>{topDevices.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip contentStyle={{background:'#1A1A1A',border:'1px solid #ffffff10',borderRadius:8}} /></PieChart>
                  </ResponsiveContainer></CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader><CardTitle className="text-white text-sm">Status Distribution</CardTitle></CardHeader>
                  <CardContent><ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({name,percent})=>`${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{stroke:'#ffffff30'}}>{statusDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip contentStyle={{background:'#1A1A1A',border:'1px solid #ffffff10',borderRadius:8}} /><Legend wrapperStyle={{color:'#ffffff80',fontSize:11}} /></PieChart>
                  </ResponsiveContainer></CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── FOLLOW-UPS ──────────────────────────────────── */}
            <TabsContent value="followups">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardHeader><CardTitle className="text-white">Pending Follow-ups</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {followUps.length === 0 ? <p className="text-white/40 p-6 text-center">No pending follow-ups</p> : (
                    <Table>
                      <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Repair</TableHead><TableHead className="text-white/50">Customer</TableHead>
                        <TableHead className="text-white/50">Phone</TableHead><TableHead className="text-white/50">Device</TableHead>
                        <TableHead className="text-white/50">Delivered</TableHead><TableHead className="text-white/50">Action</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{followUps.map(r=>(
                        <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-mono text-[#00D084]">{shortId(r.id)}</TableCell>
                          <TableCell>{r.customer?.full_name||'—'}</TableCell>
                          <TableCell className="text-white/60">{r.customer?.phone||'—'}</TableCell>
                          <TableCell>{r.device?.model_name||'—'}</TableCell>
                          <TableCell className="text-white/50 text-xs">{new Date(r.updated_at).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={()=>toast.success(`WhatsApp reminder sent to +91 ${r.customer?.phone||'XXXXX'}`)}><MessageSquare className="w-3 h-3 mr-1" />Send WhatsApp</Button></TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ── REPAIR DETAIL DIALOG ──────────────────────────── */}
          <Dialog open={!!selectedRepair} onOpenChange={()=>setSelectedRepair(null)}>
            <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-lg">
              <DialogHeader><DialogTitle className="text-white">Repair {selectedRepair?.id?.slice(0,8)}</DialogTitle><DialogDescription className="text-white/50">{selectedRepair?.issue_description}</DialogDescription></DialogHeader>
              {selectedRepair && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-white/40">Customer:</span> {selectedRepair.customer?.full_name}</div>
                    <div><span className="text-white/40">Device:</span> {selectedRepair.device?.model_name}</div>
                    <div><span className="text-white/40">Technician:</span> {selectedRepair.technician?.full_name||'Unassigned'}</div>
                    <div><span className="text-white/40">Cost:</span> ₹{fmt(selectedRepair.final_cost||selectedRepair.estimated_cost||0)}</div>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">Status:</span>
                    <Select value={selectedRepair.status} onValueChange={v=>updateStatus(selectedRepair.id,v)}>
                      <SelectTrigger className="w-48 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-white/10">
                        {REPAIR_STATUS_ORDER.map(s=><SelectItem key={s} value={s}>{REPAIR_STATUS_LABELS[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-white/40 text-xs">Created: {new Date(selectedRepair.created_at).toLocaleString('en-IN')}</div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── CUSTOMER DETAIL DIALOG ────────────────────────── */}
          <Dialog open={!!selectedCustomer} onOpenChange={()=>setSelectedCustomer(null)}>
            <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-lg">
              <DialogHeader><DialogTitle className="text-white">{selectedCustomer?.full_name}</DialogTitle><DialogDescription className="text-white/50">{selectedCustomer?.email} | {selectedCustomer?.phone}</DialogDescription></DialogHeader>
              {selectedCustomer && (
                <div className="space-y-3 text-sm">
                  <p className="text-white/40">Repair History</p>
                  {repairs.filter(r=>r.customer_id===selectedCustomer.id).map(r=>(
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="font-mono text-[#00D084]">{shortId(r.id)}</span>
                      <span>{r.device?.model_name}</span>
                      <Badge className={statusColor(r.status)}>{REPAIR_STATUS_LABELS[r.status]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── PART DIALOG ──────────────────────────────────── */}
          <Dialog open={partDialog.open} onOpenChange={o=>setPartDialog({open:o,part:null})}>
            <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-md">
              <DialogHeader><DialogTitle className="text-white">{partDialog.part ? 'Edit' : 'Add'} Part</DialogTitle><DialogDescription className="text-white/50">Fill in part details</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-white/60">Name</Label><Input className="bg-white/5 border-white/10 mt-1" value={partForm.name} onChange={e=>setPartForm(f=>({...f,name:e.target.value}))} /></div>
                <div><Label className="text-white/60">Brand</Label><Input className="bg-white/5 border-white/10 mt-1" value={partForm.brand} onChange={e=>setPartForm(f=>({...f,brand:e.target.value}))} /></div>
                <div><Label className="text-white/60">Compatible Model</Label><Input className="bg-white/5 border-white/10 mt-1" value={partForm.model_compatible} onChange={e=>setPartForm(f=>({...f,model_compatible:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-white/60">Stock</Label><Input type="number" className="bg-white/5 border-white/10 mt-1" value={partForm.quantity_in_stock} onChange={e=>setPartForm(f=>({...f,quantity_in_stock:+e.target.value}))} /></div>
                  <div><Label className="text-white/60">Low Threshold</Label><Input type="number" className="bg-white/5 border-white/10 mt-1" value={partForm.low_stock_threshold} onChange={e=>setPartForm(f=>({...f,low_stock_threshold:+e.target.value}))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-white/60">Cost Price</Label><Input type="number" className="bg-white/5 border-white/10 mt-1" value={partForm.cost_price} onChange={e=>setPartForm(f=>({...f,cost_price:+e.target.value}))} /></div>
                  <div><Label className="text-white/60">Selling Price</Label><Input type="number" className="bg-white/5 border-white/10 mt-1" value={partForm.selling_price} onChange={e=>setPartForm(f=>({...f,selling_price:+e.target.value}))} /></div>
                </div>
              </div>
              <DialogFooter><Button className="bg-[#00D084] text-[#0A0A0A] hover:bg-[#00D084]/80" onClick={savePart}>{partDialog.part ? 'Update' : 'Add'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
      <Footer />
    </div>
  );
}
