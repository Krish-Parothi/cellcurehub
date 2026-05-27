'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { User, Attendance, AttendanceStatus, SalaryConfig, Holiday } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const monthStr = currentMonth.toISOString().split('T')[0];
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const [staffRes, attRes, holRes, salRes] = await Promise.all([
      supabase.from('users').select('*').in('role', ['technician', 'delivery', 'shop_admin']).order('full_name'),
      supabase.from('attendance').select('*').gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('holidays').select('*').gte('date', monthStr).lte('date', endOfMonth),
      supabase.from('salary_config').select('*').eq('month', monthStr),
    ]);

    setStaff(staffRes.data || []);
    setAttendance(attRes.data || []);
    setHolidays(holRes.data || []);
    setSalaryConfigs(salRes.data || []);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  const toggleActive = async (staffMember: User) => {
    await supabase.from('users').update({ is_active: !staffMember.is_active }).eq('id', staffMember.id);
    toast.success(staffMember.is_active ? 'Deactivated' : 'Activated');
    fetchData();
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
    if (s === 'present') return 'bg-green-500/60';
    if (s === 'absent') return 'bg-red-500/60';
    if (s === 'half_day') return 'bg-amber-500/60';
    return 'bg-white/5';
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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Staff Management</h1>
        <p className="text-white/50 text-sm mt-1">Manage employees, attendance, and salaries</p>
      </motion.div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="roster" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Users className="w-3.5 h-3.5 mr-1.5" />Roster</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Calendar className="w-3.5 h-3.5 mr-1.5" />Attendance</TabsTrigger>
          <TabsTrigger value="holidays" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><Calendar className="w-3.5 h-3.5 mr-1.5" />Holidays</TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Salary</TabsTrigger>
        </TabsList>

        {/* Staff Roster */}
        <TabsContent value="roster">
          <Card className="bg-white/5 border-white/10"><CardContent className="p-0">
            {loading ? <div className="p-6"><Skeleton className="h-48 w-full bg-white/5" /></div> : (
              <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50">Name</TableHead><TableHead className="text-white/50">Role</TableHead>
                <TableHead className="text-white/50">Phone</TableHead><TableHead className="text-white/50">Active</TableHead>
              </TableRow></TableHeader>
              <TableBody>{staff.map(s => (
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

        {/* Attendance Grid */}
        <TabsContent value="attendance">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-white font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
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
                    return <td key={d} className="text-center p-1">
                      <button onClick={() => cycleAttendance(emp.id, d)} className={`w-6 h-6 rounded text-[10px] font-bold ${attColor(st)} hover:ring-1 hover:ring-white/30 transition-all`}>
                        {attLabel(st)}
                      </button>
                    </td>;
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

        {/* Holidays */}
        <TabsContent value="holidays">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-white font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-white/30 text-xs font-semibold py-1">{d}</div>)}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
              {monthDates.map(d => {
                const day = new Date(d).getDate();
                const isHol = holidayDates.has(d);
                const holName = holidays.find(h => h.date === d)?.name;
                return (
                  <button key={d} onClick={() => toggleHoliday(d)}
                    className={`p-2 rounded-lg text-center transition-all hover:ring-1 hover:ring-white/20 ${isHol ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-white/5 border border-white/5'}`}>
                    <span className={`text-sm font-medium ${isHol ? 'text-teal-400' : 'text-white/70'}`}>{day}</span>
                    {isHol && <p className="text-[9px] text-teal-400/70 truncate mt-0.5">{holName}</p>}
                  </button>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Salary */}
        <TabsContent value="salary">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-white font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Card className="bg-white/5 border-white/10 overflow-x-auto"><CardContent className="p-0">
            <Table><TableHeader><TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/50">Employee</TableHead><TableHead className="text-white/50">Base</TableHead>
              <TableHead className="text-white/50">Per Day Ded.</TableHead><TableHead className="text-white/50">Absent</TableHead>
              <TableHead className="text-white/50">Adj. Absent</TableHead><TableHead className="text-white/50">Deduction</TableHead>
              <TableHead className="text-white/50">Calculated</TableHead><TableHead className="text-white/50">Override</TableHead>
              <TableHead className="text-white/50">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>{staff.map(emp => {
              const sd = getSalaryData(emp);
              return (
                <TableRow key={emp.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{emp.full_name}</TableCell>
                  <TableCell><Input type="number" defaultValue={sd.baseSalary} className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" id={`base-${emp.id}`} /></TableCell>
                  <TableCell><Input type="number" defaultValue={sd.perDay} className="w-16 h-7 text-xs bg-white/5 border-white/10 text-white" id={`pdd-${emp.id}`} /></TableCell>
                  <TableCell className="text-red-400">{sd.absentDays}</TableCell>
                  <TableCell className="text-amber-400">{sd.adjustedAbsent}</TableCell>
                  <TableCell className="text-red-400">₹{fmt(sd.deduction)}</TableCell>
                  <TableCell className="text-white">₹{fmt(sd.calculated)}</TableCell>
                  <TableCell><Input type="number" defaultValue={sd.config?.final_salary_override ?? ''} placeholder="—" className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white" id={`ovr-${emp.id}`} /></TableCell>
                  <TableCell><Button size="sm" className="h-7 text-xs bg-[#00D084] text-black hover:bg-[#00D084]/90" onClick={() => {
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
    </div>
  );
}
