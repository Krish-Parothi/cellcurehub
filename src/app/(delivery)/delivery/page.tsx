'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { NAGPUR_AREAS, DELIVERY_STATUS_LABELS } from '@/lib/types';
import type { DeliveryAssignment, DeliveryStatus } from '@/lib/types';
import RoleGuard from '@/components/role-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Truck, Package, CheckCircle, Phone, MapPin, Smartphone, Clock, ChevronRight } from 'lucide-react';
import PickupFlow from './_components/pickup-flow';
import DropoffFlow from './_components/dropoff-flow';

type AssignmentWithJoins = DeliveryAssignment & {
  repair: any;
  invoice: any;
};

const ASSIGNMENT_SELECT = `*, repair:repairs(*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone), invoices(*))`;

const getArea = (address: string | null | undefined) => {
  if (!address) return 'Other';
  return NAGPUR_AREAS.find(a => address.toLowerCase().includes(a.toLowerCase())) || 'Other';
};

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [todayJobs, setTodayJobs] = useState<AssignmentWithJoins[]>([]);
  const [completedJobs, setCompletedJobs] = useState<AssignmentWithJoins[]>([]);
  const [loading, setLoading] = useState(true);

  // Flow sheets
  const [pickupOpen, setPickupOpen] = useState(false);
  const [dropoffOpen, setDropoffOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AssignmentWithJoins | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const [todayRes, completedRes] = await Promise.all([
      supabase
        .from('delivery_assignments')
        .select(ASSIGNMENT_SELECT)
        .eq('delivery_boy_id', user.id)
        .eq('scheduled_date', today)
        .neq('status', 'delivered')
        .neq('status', 'returned')
        .order('created_at', { ascending: true }),
      supabase
        .from('delivery_assignments')
        .select(ASSIGNMENT_SELECT)
        .eq('delivery_boy_id', user.id)
        .in('status', ['delivered', 'returned'])
        .order('scheduled_date', { ascending: false })
        .limit(50),
    ]);

    if (todayRes.error) toast.error('Failed to load today\'s jobs');
    if (completedRes.error) toast.error('Failed to load completed jobs');

    setTodayJobs((todayRes.data as AssignmentWithJoins[]) || []);
    setCompletedJobs((completedRes.data as AssignmentWithJoins[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'delivery' || user.role === 'admin' || user.role === 'shop_admin')) {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  const openJob = (job: AssignmentWithJoins) => {
    setSelectedJob(job);
    if (job.job_type === 'pickup') setPickupOpen(true);
    else setDropoffOpen(true);
  };

  // Group today's jobs by area
  const groupByArea = (jobs: AssignmentWithJoins[]) => {
    const groups: Record<string, AssignmentWithJoins[]> = {};
    jobs.forEach(j => {
      const area = getArea(j.repair?.address);
      (groups[area] ??= []).push(j);
    });
    return groups;
  };

  // Group completed by date
  const groupByDate = (jobs: AssignmentWithJoins[]) => {
    const groups: Record<string, AssignmentWithJoins[]> = {};
    jobs.forEach(j => {
      const date = j.scheduled_date || 'Unknown';
      (groups[date] ??= []).push(j);
    });
    return groups;
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const pickupCount = todayJobs.filter(j => j.job_type === 'pickup').length;
  const dropoffCount = todayJobs.filter(j => j.job_type === 'dropoff').length;
  const areaCount = new Set(todayJobs.map(j => getArea(j.repair?.address))).size;

  const stats = [
    { icon: Truck, color: 'text-[#00D084]', count: pickupCount, label: 'Pickups' },
    { icon: Package, color: 'text-blue-400', count: dropoffCount, label: 'Drop-offs' },
    { icon: CheckCircle, color: 'text-purple-400', count: completedJobs.length, label: 'Completed' },
    { icon: MapPin, color: 'text-amber-400', count: areaCount, label: 'Areas' },
  ];

  return (
    <RoleGuard allowedRoles={['delivery', 'admin', 'shop_admin']}>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px]" />
        </div>

        <main className="relative z-10 flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Top Bar */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Truck className="w-7 h-7 text-[#00D084]" /> Delivery Dashboard
              </h1>
              <p className="text-white/50 text-sm mt-1">Welcome, {user?.full_name}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-[#00D084]" />
              <span className="text-white/70 text-sm">{today}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <Card key={s.label} className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <p className="text-2xl font-bold text-white">{s.count}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 mb-6">
              <TabsTrigger value="today" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]">
                <Truck className="w-4 h-4 mr-2" /> Today&apos;s Jobs ({todayJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#00D084]/15 data-[state=active]:text-[#00D084]">
                <CheckCircle className="w-4 h-4 mr-2" /> Completed ({completedJobs.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Today's Jobs */}
            <TabsContent value="today">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between"><Skeleton className="h-5 w-28 bg-white/10" /><Skeleton className="h-5 w-16 bg-white/10 rounded-full" /></div>
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                      <Skeleton className="h-4 w-1/2 bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : todayJobs.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No jobs scheduled today</h3>
                  <p className="text-white/50 text-sm">Check back later for new assignments</p>
                </motion.div>
              ) : (
                Object.entries(groupByArea(todayJobs))
                  .sort(([a], [b]) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b))
                  .map(([area, jobs]) => (
                    <div key={area} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-[#00D084]" />
                        <h3 className="text-white font-semibold text-lg">{area}</h3>
                        <Badge variant="outline" className="border-white/20 text-white/50 text-xs">{jobs.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.map((job, i) => (
                          <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => openJob(job)}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-[#00D084]/40 transition-all backdrop-blur-sm group">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <h4 className="text-white font-semibold truncate">{job.repair?.customer?.full_name}</h4>
                                <a href={`tel:${job.repair?.customer?.phone}`} onClick={e => e.stopPropagation()}
                                  className="text-[#00D084] text-sm flex items-center gap-1.5 mt-0.5 hover:underline">
                                  <Phone className="w-3 h-3" />{job.repair?.customer?.phone || 'N/A'}
                                </a>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <Badge className={`${job.job_type === 'pickup' ? 'bg-[#00D084]/15 text-[#00D084] border-[#00D084]/25' : 'bg-blue-500/15 text-blue-400 border-blue-500/25'}`}>
                                  {job.job_type === 'pickup' ? 'PICKUP' : 'DROP-OFF'}
                                </Badge>
                                <Badge variant="outline" className="border-white/20 text-white/40 text-[10px]">
                                  {DELIVERY_STATUS_LABELS[job.status as DeliveryStatus]}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-white/60 mb-3">
                              <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{job.repair?.address || 'No address'}</span></p>
                              <p className="flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5" />
                                {job.repair?.device ? `${job.repair.device.brand} ${job.repair.device.model_name}` : job.repair?.manual_model}
                                {job.repair?.repair_type && <span className="text-white/30 ml-1">• {job.repair.repair_type.replace(/_/g, ' ')}</span>}
                              </p>
                            </div>
                            {job.special_instructions && (
                              <p className="text-amber-400/80 text-xs mb-3 bg-amber-500/5 px-2 py-1 rounded">⚠ {job.special_instructions}</p>
                            )}
                            <div className="flex items-center justify-end text-[#00D084] text-xs font-medium group-hover:translate-x-0.5 transition-transform">
                              Open Job <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>

            {/* TAB 2: Completed */}
            <TabsContent value="completed">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map(i => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                      <Skeleton className="h-5 w-32 bg-white/10" />
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : completedJobs.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center backdrop-blur-sm">
                  <CheckCircle className="w-12 h-12 text-white/20 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No completed jobs yet</h3>
                  <p className="text-white/50 text-sm">Your delivered and returned jobs will appear here</p>
                </motion.div>
              ) : (
                Object.entries(groupByDate(completedJobs)).map(([date, jobs]) => (
                  <div key={date} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-white/40" />
                      <h3 className="text-white/60 font-medium text-sm">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </h3>
                      <Badge variant="outline" className="border-white/10 text-white/30 text-xs">{jobs.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobs.map(job => (
                        <div key={job.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 opacity-70">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/80 font-medium text-sm">{job.repair?.customer?.full_name}</span>
                            <Badge className={`text-[10px] ${job.status === 'delivered' ? 'bg-[#00D084]/10 text-[#00D084]' : 'bg-red-500/10 text-red-400'}`}>
                              {DELIVERY_STATUS_LABELS[job.status as DeliveryStatus]}
                            </Badge>
                          </div>
                          <p className="text-white/40 text-xs">
                            {job.repair?.device ? `${job.repair.device.brand} ${job.repair.device.model_name}` : job.repair?.manual_model}
                            <span className="mx-1">•</span>
                            {job.job_type === 'pickup' ? 'Pickup' : 'Drop-off'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Flow Sheets */}
        <PickupFlow assignment={selectedJob} open={pickupOpen} onOpenChange={setPickupOpen} onComplete={fetchJobs} />
        <DropoffFlow assignment={selectedJob} open={dropoffOpen} onOpenChange={setDropoffOpen} onComplete={fetchJobs} />

        <Footer />
      </div>
    </RoleGuard>
  );
}
