'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import type { User, Attendance, AttendanceStatus, SalaryConfig, Holiday } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { deleteStaff } from '@/lib/actions/shop-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Calendar, DollarSign, ChevronLeft, ChevronRight, Plus, Loader2, Trash2 } from 'lucide-react';

const addStaffSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required'),
  aadhar: z.string().optional(),
});
type AddStaffForm = z.infer<typeof addStaffSchema>;

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function StaffPage() {

  const [staff, setStaff] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);

  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [shops, setShops] = useState<any[]>([]);

  // Add Staff
  const [addDialog, setAddDialog] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<'technician' | 'delivery'>('technician');
  const [selectedShop, setSelectedShop] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddStaffForm>({ resolver: zodResolver(addStaffSchema) });

  // Delete Staff
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {

    const monthStr = currentMonth.toISOString().split('T')[0];
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const [staffRes, attRes, holRes, salRes, shopRes] = await Promise.all([
      supabase.from('users').select('*').in('role', ['technician', 'delivery', 'shop_admin']).order('full_name'),
      supabase.from('attendance').select('*').gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('holidays').select('*').gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('salary_config').select('*').eq('month', monthStr),
      supabase.from('shops').select('id, name').eq('is_active', true),
    ]);

    setStaff(staffRes.data || []);
    setAttendance(attRes.data || []);
    setHolidays(holRes.data || []);
    setSalaryConfigs(salRes.data || []);
    setShops(shopRes.data || []);

  }, [currentMonth]);

  const { user, loading } = useAuthFetch(fetchData, { requiredRole: 'admin' });

  const toggleActive = async (staffMember: User) => {
    await supabase.from('users').update({ is_active: !staffMember.is_active }).eq('id', staffMember.id);
    toast.success(staffMember.is_active ? 'Deactivated' : 'Activated');
    fetchData();
  };

  const handleDelete = async (s: User) => {
    setDeleting(true);
    const result = await deleteStaff(s.id);
    if (!result.success) {
      toast.error(result.error || 'Failed to remove staff');
    } else {
      toast.success(`${s.full_name} removed permanently`);
    }
    setDeleting(false);
    setDeleteConfirm(null);
    fetchData();
  };

  const onAddStaff = async (data: AddStaffForm) => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }
    if (staffRole === 'technician' && (!data.aadhar || !/^\d{12}$/.test(data.aadhar))) {
      toast.error('Aadhar must be exactly 12 digits for technicians');
      return;
    }
    setAddingStaff(true);
    try {
      const { inviteStaff } = await import('@/lib/actions/admin');
      const result = await inviteStaff({
        email: data.email,
        fullName: data.full_name,
        role: staffRole,
        phone: data.phone,
        shopId: selectedShop,
        aadharNumber: data.aadhar,
      });

      if (!result.success) throw new Error(result.error);

      toast.success(`${staffRole === 'technician' ? 'Technician' : 'Delivery staff'} invited. They will receive an email to login.`);
      setAddDialog(false); reset(); setStaffRole('technician'); setSelectedShop(''); fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add staff');
    }
    setAddingStaff(false);
  };

  // Attendance helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    return d.toISOString().split('T')[0];
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const holidayDates = new Set(holidays.map(h => h.date));

  const getAttStatus = (empId: string, date: string): AttendanceStatus | null => {
    const entry = attendance.find(a => a.employee_id === empId && a.date === date);
    return entry?.status || null;
  };

  const cycleAttendance = async (empId: string, date: string) => {
    const current = getAttStatus(empId, date);
    const cycle: (AttendanceStatus | null)[] = [null, 'present', 'absent', 'half_day'];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    const next = cycle[nextIdx];

    if (next === null) {
      await supabase.from('attendance').delete().match({ employee_id: empId, date });
    } else {
      await supabase.from('attendance').upsert({ employee_id: empId, date, status: next }, { onConflict: 'employee_id,date' as any });
    }
    fetchData();
  };

  const attColor = (s: AttendanceStatus | null) => {
    if (s === 'present') return 'bg-green-100 text-green-800 border border-green-200';
    if (s === 'absent') return 'bg-red-100 text-red-800 border border-red-200';
    if (s === 'half_day') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-[#F7F7F5] border border-black/[0.03] text-[#1A1A1A]/60';
  };

  const attLabel = (s: AttendanceStatus | null) => {
    if (s === 'present') return 'P';
    if (s === 'absent') return 'A';
    if (s === 'half_day') return 'H';
    return '';
  };

  // Holiday toggle
  const toggleHoliday = async (date: string) => {
    if (holidayDates.has(date)) {
      await supabase.from('holidays').delete().eq('date', date);
    } else {
      const name = prompt('Holiday name:');
      if (!name) return;
      await supabase.from('holidays').insert({ date, name, created_by: user?.id });
    }
    fetchData();
  };

  // Salary calculation
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
    await supabase.from('salary_config').upsert({
      employee_id: emp.id, shop_id: emp.shop_id, month: monthStr,
      base_salary: baseSalary, per_day_deduction: perDay, final_salary_override: override,
    }, { onConflict: 'employee_id,month' as any });
    toast.success('Salary saved');
    fetchData();
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Staff Management</h1>
          <p className="text-[#1A1A1A]/50 text-sm mt-1">Manage employees, attendance, and salaries</p>
        </div>
        <Button onClick={() => { reset(); setStaffRole('technician'); setSelectedShop(''); setAddDialog(true); }} className="bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90"><Plus className="w-4 h-4 mr-1" />Add Staff</Button>
      </motion.div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="bg-black/5 border border-[#E8E4DF] mb-6">
          <TabsTrigger value="roster" className="data-[state=active]:bg-[#FF5C00]/15 data-[state=active]:text-[#FF5C00]"><Users className="w-3.5 h-3.5 mr-1.5" />Roster</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-[#FF5C00]/15 data-[state=active]:text-[#FF5C00]"><Calendar className="w-3.5 h-3.5 mr-1.5" />Attendance</TabsTrigger>
          <TabsTrigger value="holidays" className="data-[state=active]:bg-[#FF5C00]/15 data-[state=active]:text-[#FF5C00]"><Calendar className="w-3.5 h-3.5 mr-1.5" />Holidays</TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-[#FF5C00]/15 data-[state=active]:text-[#FF5C00]"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Salary</TabsTrigger>
        </TabsList>

        {/* Staff Roster */}
        <TabsContent value="roster">
          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-[#F7F7F5]" /></div> : (
              <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent bg-[#F7F7F5]/50">
                <TableHead className="text-[#1A1A1A]/50 font-medium">Name</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Role</TableHead>
                <TableHead className="text-[#1A1A1A]/50 font-medium">Phone</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Shop</TableHead>
                <TableHead className="text-[#1A1A1A]/50 font-medium">Active</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Actions</TableHead>
              </TableRow></TableHeader>
                <TableBody>{staff.map(s => (
                  <TableRow key={s.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]/40">
                    <TableCell className="text-[#1A1A1A] font-semibold">{s.full_name}</TableCell>
                    <TableCell><Badge className="bg-black/5 text-[#1A1A1A]/70 capitalize border-0 hover:bg-black/10">{s.role}</Badge></TableCell>
                    <TableCell className="text-[#1A1A1A]/70">{s.phone || '—'}</TableCell>
                    <TableCell className="text-[#1A1A1A]/70 text-xs">{shops.find(sh => sh.id === s.shop_id)?.name || '—'}</TableCell>
                    <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} className="data-[state=checked]:bg-[#FF5C00]" /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(s)} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs">
                        <Trash2 className="w-3 h-3 mr-1" />Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Attendance Grid */}
        <TabsContent value="attendance">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-[#1A1A1A] font-bold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white border-[#E8E4DF] shadow-sm overflow-x-auto"><CardContent className="p-0">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-[#E8E4DF]/60 bg-[#F7F7F5]/50">
                <th className="text-left text-[#1A1A1A]/50 p-2 sticky left-0 bg-white border-r border-[#E8E4DF]/60 z-10 min-w-[120px] font-medium">Employee</th>
                {monthDates.map(d => {
                  const day = new Date(d).getDate();
                  const isToday = d === todayStr;
                  const isHol = holidayDates.has(d);
                  return <th key={d} className={`text-center p-1 min-w-[28px] ${isToday ? 'bg-[#FF5C00]/10 text-[#FF5C00] font-bold' : isHol ? 'bg-teal-600/10 text-teal-700 font-bold' : 'text-[#1A1A1A]/40'}`}>{day}</th>;
                })}
              </tr></thead>
              <tbody>{staff.map(emp => (
                <tr key={emp.id} className="border-b border-[#E8E4DF]/60 hover:bg-[#F7F7F5]/40">
                  <td className="text-[#1A1A1A]/80 font-semibold p-2 sticky left-0 bg-white border-r border-[#E8E4DF]/60 z-10 truncate">{emp.full_name}</td>
                  {monthDates.map(d => {
                    const st = getAttStatus(emp.id, d);
                    return <td key={d} className="text-center p-1">
                      <button onClick={() => cycleAttendance(emp.id, d)} className={`w-6 h-6 rounded text-[10px] font-bold ${attColor(st)} hover:ring-1 hover:ring-[#1A1A1A]/30 transition-all`}>
                        {attLabel(st)}
                      </button>
                    </td>;
                  })}
                </tr>
              ))}</tbody>
            </table>
          </CardContent></Card>
          <div className="flex gap-4 mt-3 text-xs text-[#1A1A1A]/60">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" />Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />Half Day</span>
          </div>
        </TabsContent>

        {/* Holidays */}
        <TabsContent value="holidays">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-[#1A1A1A] font-bold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white border-[#E8E4DF] shadow-sm"><CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[#1A1A1A]/40 text-xs font-semibold py-1">{d}</div>)}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
              {monthDates.map(d => {
                const day = new Date(d).getDate();
                const isHol = holidayDates.has(d);
                const holName = holidays.find(h => h.date === d)?.name;
                return (
                  <button key={d} onClick={() => toggleHoliday(d)}
                    className={`p-2 rounded-lg text-center transition-all hover:ring-1 hover:ring-black/10 ${isHol ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-[#F7F7F5] border border-black/[0.03]'}`}>
                    <span className={`text-sm font-medium ${isHol ? 'text-teal-700 font-bold' : 'text-[#1A1A1A]/70'}`}>{day}</span>
                    {isHol && <p className="text-[9px] text-teal-700/80 truncate mt-0.5">{holName}</p>}
                  </button>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Salary */}
        <TabsContent value="salary">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-[#1A1A1A] font-bold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white border-[#E8E4DF] shadow-sm overflow-x-auto"><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-[#E8E4DF]/60 hover:bg-transparent bg-[#F7F7F5]/50">
              <TableHead className="text-[#1A1A1A]/50 font-medium">Employee</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Base</TableHead>
              <TableHead className="text-[#1A1A1A]/50 font-medium">Per Day Ded.</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Absent</TableHead>
              <TableHead className="text-[#1A1A1A]/50 font-medium">Adj. Absent</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Deduction</TableHead>
              <TableHead className="text-[#1A1A1A]/50 font-medium">Calculated</TableHead><TableHead className="text-[#1A1A1A]/50 font-medium">Override</TableHead>
              <TableHead className="text-[#1A1A1A]/50 font-medium">Action</TableHead>
            </TableRow></TableHeader>
              <TableBody>{staff.map(emp => {
                const sd = getSalaryData(emp);
                return (
                  <TableRow key={emp.id} className="border-[#E8E4DF]/60 hover:bg-[#F7F7F5]/40">
                    <TableCell className="text-[#1A1A1A] font-semibold">{emp.full_name}</TableCell>
                    <TableCell><Input type="number" defaultValue={sd.baseSalary} className="w-20 h-7 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" id={`base-${emp.id}`} /></TableCell>
                    <TableCell><Input type="number" defaultValue={sd.perDay} className="w-16 h-7 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" id={`pdd-${emp.id}`} /></TableCell>
                    <TableCell className="text-red-600 font-semibold">{sd.absentDays}</TableCell>
                    <TableCell className="text-amber-600 font-semibold">{sd.adjustedAbsent}</TableCell>
                    <TableCell className="text-red-600 font-semibold">₹{fmt(sd.deduction)}</TableCell>
                    <TableCell className="text-[#1A1A1A] font-semibold">₹{fmt(sd.calculated)}</TableCell>
                    <TableCell><Input type="number" defaultValue={sd.config?.final_salary_override ?? ''} placeholder="—" className="w-20 h-7 text-xs bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00]" id={`ovr-${emp.id}`} /></TableCell>
                    <TableCell><Button size="sm" className="h-7 text-xs bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90" onClick={() => {
                      const base = Number((document.getElementById(`base-${emp.id}`) as HTMLInputElement)?.value || 0);
                      const pdd = Number((document.getElementById(`pdd-${emp.id}`) as HTMLInputElement)?.value || 0);
                      const ovr = (document.getElementById(`ovr-${emp.id}`) as HTMLInputElement)?.value;
                      saveSalary(emp, base, pdd, ovr ? Number(ovr) : null);
                    }}>Save</Button></TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-sm">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">Add New Staff</DialogTitle><DialogDescription className="text-[#1A1A1A]/50">Add a staff member to any shop</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onAddStaff)} className="space-y-3">
            <div>
              <Label className="text-[#1A1A1A]/70">Role *</Label>
              <Select value={staffRole} onValueChange={(v) => setStaffRole(v as 'technician' | 'delivery')}>
                <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="delivery">Delivery Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#1A1A1A]/70">Shop *</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1"><SelectValue placeholder="Select shop..." /></SelectTrigger>
                <SelectContent className="bg-white border-[#E8E4DF] text-[#1A1A1A]">
                  {shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-[#1A1A1A]/70">Full Name *</Label><Input {...register('full_name')} className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" />{errors.full_name && <p className="text-red-600 text-xs mt-0.5">{errors.full_name.message}</p>}</div>
            <div><Label className="text-[#1A1A1A]/70">Email *</Label><Input {...register('email')} type="email" className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" />{errors.email && <p className="text-red-600 text-xs mt-0.5">{errors.email.message}</p>}</div>
            <div><Label className="text-[#1A1A1A]/70">Password *</Label><Input {...register('password')} type="text" className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" placeholder="Min 6 characters" />{errors.password && <p className="text-red-600 text-xs mt-0.5">{errors.password.message}</p>}</div>
            <div><Label className="text-[#1A1A1A]/70">Phone *</Label><Input {...register('phone')} className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" placeholder="10-digit mobile" />{errors.phone && <p className="text-red-600 text-xs mt-0.5">{errors.phone.message}</p>}</div>
            {staffRole === 'technician' && (
              <div><Label className="text-[#1A1A1A]/70">Aadhar Number *</Label><Input {...register('aadhar')} className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" placeholder="12-digit Aadhar" maxLength={12} />{errors.aadhar && <p className="text-red-600 text-xs mt-0.5">{errors.aadhar.message}</p>}</div>
            )}
            <DialogFooter><Button type="submit" disabled={addingStaff} className="bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90">{addingStaff ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}Add {staffRole === 'technician' ? 'Technician' : 'Delivery Staff'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-white border-[#E8E4DF]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A1A1A]">Permanently Remove Staff?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/60">
              This will permanently remove <span className="text-[#1A1A1A] font-bold">{deleteConfirm?.full_name}</span> and all their attendance/salary records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E8E4DF] text-[#1A1A1A]/60 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}Remove Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
