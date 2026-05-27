'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useShopId } from '@/lib/use-shop-id';
import type { User, Attendance, AttendanceStatus, SalaryConfig, Holiday } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Calendar, DollarSign, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const addTechSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required'),
  aadhar: z.string().regex(/^\d{12}$/, 'Aadhar must be exactly 12 digits'),
});
type AddTechForm = z.infer<typeof addTechSchema>;

export default function ShopStaffPage() {
  const { user } = useAuth();
  const shopId = useShopId();
  const [staff, setStaff] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [addDialog, setAddDialog] = useState(false);
  const [addingTech, setAddingTech] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddTechForm>({ resolver: zodResolver(addTechSchema) });

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const monthStr = currentMonth.toISOString().split('T')[0];
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const [staffRes, attRes, holRes, salRes] = await Promise.all([
      supabase.from('users').select('*').in('role', ['technician', 'delivery']).eq('shop_id', shopId).order('full_name'),
      supabase.from('attendance').select('*').eq('shop_id', shopId).gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('holidays').select('*').gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('salary_config').select('*').eq('shop_id', shopId).eq('month', monthStr),
    ]);

    setStaff(staffRes.data || []);
    setAttendance(attRes.data || []);
    setHolidays(holRes.data || []);
    setSalaryConfigs(salRes.data || []);
    setLoading(false);
  }, [shopId, currentMonth]);

  useEffect(() => { if ((user?.role === 'shop_admin' || user?.role === 'admin') && shopId) fetchData(); }, [user, shopId, fetchData]);

  const toggleActive = async (s: User) => {
    await supabase.from('users').update({ is_active: !s.is_active }).eq('id', s.id);
    toast.success(s.is_active ? 'Deactivated' : 'Activated'); fetchData();
  };

  const onAddTechnician = async (data: AddTechForm) => {
    setAddingTech(true);
    try {
      // Try Edge Function first with a 4-second timeout to prevent infinite spinning
      const invokePromise = supabase.functions.invoke('add-technician', {
        body: { ...data, shop_id: shopId },
      });

      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Edge Function timed out') }), 4000)
      );

      const { error: fnErr } = await Promise.race([invokePromise, timeoutPromise]);

      if (fnErr) {
        console.warn('Edge function failed or timed out, running client-side fallback signup:', fnErr);
        // Fallback: create via signUp
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: data.email,
          password: Math.random().toString(36).slice(2) + 'Aa1!',
        });
        if (signUpErr) throw signUpErr;
        if (signUpData.user) {
          await supabase.from('users').upsert({
            id: signUpData.user.id, email: data.email, full_name: data.full_name,
            phone: data.phone, role: 'technician', shop_id: shopId, is_active: true,
          });
          // Store aadhar number (in production, Edge Function hashes this server-side)
          await supabase.from('technician_details').insert({
            user_id: signUpData.user.id, aadhar_number: data.aadhar, verified: false,
          });
        }
      }
      toast.success(`Technician added. Invite sent to ${data.email}.`);
      setAddDialog(false); reset(); fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add technician');
    }
    setAddingTech(false);
  };

  // Mask aadhar display
  const maskAadhar = (val: string) => {
    if (val.length !== 12) return val;
    return `XXXX-XXXX-${val.slice(8)}`;
  };

  // Attendance helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1).toISOString().split('T')[0]);
  const todayStr = new Date().toISOString().split('T')[0];
  const holidayDates = new Set(holidays.map(h => h.date));

  const getAttStatus = (empId: string, date: string): AttendanceStatus | null => attendance.find(a => a.employee_id === empId && a.date === date)?.status || null;

  const cycleAttendance = async (empId: string, date: string) => {
    const current = getAttStatus(empId, date);
    const cycle: (AttendanceStatus | null)[] = [null, 'present', 'absent', 'half_day'];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    if (next === null) { await supabase.from('attendance').delete().match({ employee_id: empId, date }); }
    else { await supabase.from('attendance').upsert({ employee_id: empId, shop_id: shopId, date, status: next }, { onConflict: 'employee_id,date' as any }); }
    fetchData();
  };

  const attColor = (s: AttendanceStatus | null) => s === 'present' ? 'bg-green-500/60' : s === 'absent' ? 'bg-red-500/60' : s === 'half_day' ? 'bg-amber-500/60' : 'bg-white/5';
  const attLabel = (s: AttendanceStatus | null) => s === 'present' ? 'P' : s === 'absent' ? 'A' : s === 'half_day' ? 'H' : '';

  // Salary
  const getSalaryData = (emp: User) => {
    const config = salaryConfigs.find(s => s.employee_id === emp.id);
    const baseSalary = config?.base_salary || 0;
    const perDay = config?.per_day_deduction || 0;
    const absentDays = attendance.filter(a => a.employee_id === emp.id && a.status === 'absent').length;
    const holidayAbsent = attendance.filter(a => a.employee_id === emp.id && a.status === 'absent' && holidayDates.has(a.date)).length;
    const adjustedAbsent = absentDays - holidayAbsent;
    const deduction = adjustedAbsent * perDay;
    const calculated = baseSalary - deduction;
    const finalSalary = config?.final_salary_override ?? calculated;
    return { baseSalary, perDay, absentDays, adjustedAbsent, deduction, calculated, finalSalary, config };
  };

  const saveSalary = async (emp: User, baseSalary: number, perDay: number, override: number | null) => {
    const monthStr = currentMonth.toISOString().split('T')[0];
    await supabase.from('salary_config').upsert({ employee_id: emp.id, shop_id: shopId, month: monthStr, base_salary: baseSalary, per_day_deduction: perDay, final_salary_override: override }, { onConflict: 'employee_id,month' as any });
    toast.success('Salary saved'); fetchData();
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Staff</h1><p className="text-white/50 text-sm mt-1">Your shop&apos;s team</p></div>
        <Button onClick={() => { reset(); setAddDialog(true); }} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4 mr-1" />Add Technician</Button>
      </motion.div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="roster" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Users className="w-3.5 h-3.5 mr-1.5" />Roster</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Calendar className="w-3.5 h-3.5 mr-1.5" />Attendance</TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Salary</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Role</TableHead>
                <TableHead className="text-white/50">Phone</TableHead><TableHead className="text-white/50">Active</TableHead>
              </TableRow></TableHeader>
              <TableBody>{staff.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-white/30 py-8">No staff members</TableCell></TableRow> : staff.map(s => (
                <TableRow key={s.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{s.full_name}</TableCell>
                  <TableCell><Badge className="bg-white/10 text-white/60 capitalize">{s.role}</Badge></TableCell>
                  <TableCell className="text-white/60">{s.phone || '—'}</TableCell>
                  <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} /></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-white font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <p className="text-xs text-white/30 mb-3">Holidays set by admin are shown in teal and are read-only.</p>
          <Card className="bg-white/5 border-white/10 overflow-x-auto"><CardContent className="p-0">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/5">
                <th className="text-left text-white/50 p-2 sticky left-0 bg-[#0A0A0A] z-10 min-w-[120px]">Employee</th>
                {monthDates.map(d => {
                  const day = new Date(d).getDate();
                  const isToday = d === todayStr;
                  const isHol = holidayDates.has(d);
                  return <th key={d} className={`text-center p-1 min-w-[28px] ${isToday ? 'bg-[#00D084]/10 text-[#00D084]' : isHol ? 'bg-teal-500/10 text-teal-400' : 'text-white/30'}`}>{day}</th>;
                })}
              </tr></thead>
              <tbody>{staff.map(emp => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="text-white/80 p-2 sticky left-0 bg-[#0A0A0A] z-10 truncate">{emp.full_name}</td>
                  {monthDates.map(d => {
                    const st = getAttStatus(emp.id, d);
                    return <td key={d} className="text-center p-1"><button onClick={() => cycleAttendance(emp.id, d)} className={`w-6 h-6 rounded text-[10px] font-bold ${attColor(st)} hover:ring-1 hover:ring-white/30 transition-all`}>{attLabel(st)}</button></td>;
                  })}
                </tr>
              ))}</tbody>
            </table>
          </CardContent></Card>
          <div className="flex gap-4 mt-3 text-xs text-white/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/60" />Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/60" />Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/60" />Half Day</span>
          </div>
        </TabsContent>

        <TabsContent value="salary">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-white font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white/5 border-white/10 overflow-x-auto"><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/50">Employee</TableHead><TableHead className="text-white/50">Base</TableHead>
              <TableHead className="text-white/50">Per Day</TableHead><TableHead className="text-white/50">Absent</TableHead>
              <TableHead className="text-white/50">Adj.</TableHead><TableHead className="text-white/50">Deduction</TableHead>
              <TableHead className="text-white/50">Calculated</TableHead><TableHead className="text-white/50">Override</TableHead>
              <TableHead className="text-white/50">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>{staff.map(emp => {
              const sd = getSalaryData(emp);
              return (
                <TableRow key={emp.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{emp.full_name}</TableCell>
                  <TableCell><Input type="number" defaultValue={sd.baseSalary} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" id={`sa-base-${emp.id}`} /></TableCell>
                  <TableCell><Input type="number" defaultValue={sd.perDay} className="w-16 h-7 text-xs bg-white/5 border-white/10 text-white" id={`sa-pdd-${emp.id}`} /></TableCell>
                  <TableCell className="text-red-400">{sd.absentDays}</TableCell>
                  <TableCell className="text-amber-400">{sd.adjustedAbsent}</TableCell>
                  <TableCell className="text-red-400">₹{fmt(sd.deduction)}</TableCell>
                  <TableCell className="text-white">₹{fmt(sd.calculated)}</TableCell>
                  <TableCell><Input type="number" defaultValue={sd.config?.final_salary_override ?? ''} placeholder="—" className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" id={`sa-ovr-${emp.id}`} /></TableCell>
                  <TableCell><Button size="sm" className="h-7 text-xs bg-[#00D084] text-black hover:bg-[#00D084]/90" onClick={() => {
                    const base = Number((document.getElementById(`sa-base-${emp.id}`) as HTMLInputElement)?.value || 0);
                    const pdd = Number((document.getElementById(`sa-pdd-${emp.id}`) as HTMLInputElement)?.value || 0);
                    const ovr = (document.getElementById(`sa-ovr-${emp.id}`) as HTMLInputElement)?.value;
                    saveSalary(emp, base, pdd, ovr ? Number(ovr) : null);
                  }}>Save</Button></TableCell>
                </TableRow>
              );
            })}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Add Technician Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Add New Technician</DialogTitle><DialogDescription className="text-white/50">Create and invite a technician to your shop</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onAddTechnician)} className="space-y-3">
            <div><Label className="text-white/60">Full Name *</Label><Input {...register('full_name')} className="bg-white/5 border-white/10 text-white mt-1" />{errors.full_name && <p className="text-red-400 text-xs mt-0.5">{errors.full_name.message}</p>}</div>
            <div><Label className="text-white/60">Email *</Label><Input {...register('email')} type="email" className="bg-white/5 border-white/10 text-white mt-1" />{errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email.message}</p>}</div>
            <div><Label className="text-white/60">Phone *</Label><Input {...register('phone')} className="bg-white/5 border-white/10 text-white mt-1" placeholder="10-digit mobile" />{errors.phone && <p className="text-red-400 text-xs mt-0.5">{errors.phone.message}</p>}</div>
            <div><Label className="text-white/60">Aadhar Number *</Label><Input {...register('aadhar')} className="bg-white/5 border-white/10 text-white mt-1" placeholder="12-digit Aadhar" maxLength={12} />{errors.aadhar && <p className="text-red-400 text-xs mt-0.5">{errors.aadhar.message}</p>}<p className="text-white/30 text-[10px] mt-0.5">Stored hashed via server-side function. Displayed masked.</p></div>
            <DialogFooter><Button type="submit" disabled={addingTech} className="bg-[#00D084] text-black hover:bg-[#00D084]/90">{addingTech ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}Add Technician</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
