'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry, Ewaste, Review } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import RepairTracker from '@/components/repair-tracker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Wrench, Clock, CircleCheck as CheckCircle, Package, Truck, Star, MessageSquare, Recycle, User, LogOut, Settings, History, CircleAlert as AlertCircle, Phone, Mail, Calendar, IndianRupee, TrendingUp, ChartBar as BarChart3 } from 'lucide-react';

type DashboardTab = 'active' | 'history' | 'ewaste' | 'analytics' | 'profile';

const sidebarNavItems: { key: DashboardTab; label: string; icon: React.ElementType }[] = [
  { key: 'active', label: 'Active Repairs', icon: Wrench },
  { key: 'history', label: 'Repair History', icon: History },
  { key: 'ewaste', label: 'E-Waste', icon: Recycle },
  { key: 'analytics', label: 'Spend Analytics', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: User },
];

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('active');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data state
  const [activeRepairs, setActiveRepairs] = useState<Repair[]>([]);
  const [historyRepairs, setHistoryRepairs] = useState<Repair[]>([]);
  const [timelineMap, setTimelineMap] = useState<Record<string, RepairTimelineEntry[]>>({});
  const [ewasteItems, setEwasteItems] = useState<Ewaste[]>([]);

  // Loading state
  const [fetchingRepairs, setFetchingRepairs] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [fetchingEwaste, setFetchingEwaste] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRepairId, setReviewRepairId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // E-waste form state
  const [ewasteDescription, setEwasteDescription] = useState('');
  const [submittingEwaste, setSubmittingEwaste] = useState(false);

  // ---- Auth guard ----
  // useEffect(() => {
  //   if (!authLoading && (!user || user.role !== 'customer')) {
  //     router.replace('/login');
  //   }
  // }, [authLoading, user, router]);
// ---- Auth guard ----
useEffect(() => {
  if (authLoading) return;
  if (!user) { router.replace('/login'); return; }
  if (user.role === 'admin') router.replace('/admin');
  else if (user.role === 'technician') router.replace('/technician');
  else if (user.role === 'delivery') router.replace('/delivery');
  // customer yahi rehga ✅
}, [authLoading, user, router]);

  // ---- Sync profile fields ----
  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // ---- Fetch active repairs ----
  const fetchActiveRepairs = useCallback(async () => {
    if (!user) return;
    setFetchingRepairs(true);
    const { data, error } = await supabase
      .from('repairs')
      .select('*, device:devices(*), technician:users!repairs_technician_id_fkey(full_name)')
      .eq('customer_id', user.id)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load active repairs');
    } else {
      setActiveRepairs((data as Repair[]) || []);
    }
    setFetchingRepairs(false);
  }, [user]);

  // ---- Fetch history repairs ----
  const fetchHistoryRepairs = useCallback(async () => {
    if (!user) return;
    setFetchingHistory(true);
    const { data, error } = await supabase
      .from('repairs')
      .select('*, device:devices(*), technician:users!repairs_technician_id_fkey(full_name)')
      .eq('customer_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load repair history');
    } else {
      const repairs = (data as Repair[]) || [];
      setHistoryRepairs(repairs);

      // Batch fetch timelines for all history repairs
      if (repairs.length > 0) {
        const ids = repairs.map((r) => r.id);
        const { data: td } = await supabase
          .from('repair_timeline')
          .select('*')
          .in('repair_id', ids)
          .order('created_at');
        const map: Record<string, RepairTimelineEntry[]> = {};
        ((td as RepairTimelineEntry[]) || []).forEach((t) => {
          (map[t.repair_id] ??= []).push(t);
        });
        setTimelineMap(map);
      }
    }
    setFetchingHistory(false);
  }, [user]);

  // ---- Fetch e-waste ----
  const fetchEwaste = useCallback(async () => {
    if (!user) return;
    setFetchingEwaste(true);
    const { data, error } = await supabase
      .from('ewaste')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load e-waste submissions');
    } else {
      setEwasteItems((data as Ewaste[]) || []);
    }
    setFetchingEwaste(false);
  }, [user]);

  // ---- Data fetching on mount and tab change ----
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    if (activeTab === 'active') fetchActiveRepairs();
    else if (activeTab === 'history') fetchHistoryRepairs();
    else if (activeTab === 'ewaste') fetchEwaste();
    else if (activeTab === 'analytics') { fetchActiveRepairs(); fetchHistoryRepairs(); }
  }, [activeTab, user, fetchActiveRepairs, fetchHistoryRepairs, fetchEwaste]);

  // ---- Handlers ----
  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: editName.trim(), phone: editPhone.trim() || null })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewRepairId) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      repair_id: reviewRepairId,
      customer_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) {
      toast.error(error.message || 'Failed to submit review');
    } else {
      toast.success('Review submitted');
      setReviewDialogOpen(false);
      setReviewRepairId(null);
      setReviewRating(5);
      setReviewComment('');
    }
  };

  const handleSubmitEwaste = async () => {
    if (!user) return;
    if (!ewasteDescription.trim()) {
      toast.error('Please describe the device');
      return;
    }
    setSubmittingEwaste(true);
    const { error } = await supabase.from('ewaste').insert({
      customer_id: user.id,
      device_description: ewasteDescription.trim(),
    });
    setSubmittingEwaste(false);
    if (error) {
      toast.error('Failed to submit e-waste');
    } else {
      toast.success('E-waste submission received');
      setEwasteDescription('');
      fetchEwaste();
    }
  };

  // ---- Warranty countdown ----
  const getWarrantyInfo = (deliveredAt: string) => {
    const delivered = new Date(deliveredAt);
    const expiry = new Date(delivered.getTime() + 90 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return { expired: true, text: 'Warranty expired' };
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return { expired: false, text: `${days} day${days !== 1 ? 's' : ''} remaining` };
  };

  // ---- E-waste status badge ----
  const ewasteStatusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    valued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    picked_up: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    credited: 'bg-[#00D084]/20 text-[#00D084] border-[#00D084]/30',
  };

  // ---- Loading guard ----
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#00D084] border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') return null;

  /* ================================================================ */
  /*  SIDEBAR                                                         */
  /* ================================================================ */

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="p-6 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 border-2 border-[#00D084]/30 mb-3">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
          ) : null}
          <AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xl font-bold">
            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-white font-semibold text-sm">{user.full_name}</h3>
        <p className="text-white/40 text-xs mt-0.5">{user.email}</p>
      </div>

      <Separator className="bg-white/10" />

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1">
        {sidebarNavItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setMobileDrawerOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === key
                ? 'bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/20'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  SKELETON HELPERS                                                */
  /* ================================================================ */

  const RepairCardSkeleton = () => (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-32 bg-white/10" />
        <Skeleton className="h-5 w-20 bg-white/10 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 bg-white/10" />
      <Skeleton className="h-24 w-full bg-white/10 rounded-xl" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20 bg-white/10" />
        <Skeleton className="h-8 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );

  const EwasteCardSkeleton = () => (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-3/4 bg-white/10" />
      <Skeleton className="h-5 w-24 bg-white/10 rounded-full" />
      <Skeleton className="h-3 w-32 bg-white/10" />
    </div>
  );

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#00D084]/5 blur-[100px]" />
      </div>

      <div className="flex flex-1 pt-20 relative z-10">
        {/* ---- Desktop Sidebar ---- */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md h-[calc(100vh-5rem)] sticky top-20">
          <SidebarContent />
        </aside>

        {/* ---- Mobile Drawer ---- */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-[#0A0A0A] border-r border-white/10 z-50 lg:hidden"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ---- Main Content ---- */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Menu</span>
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">
              {activeTab === 'active' && 'Active Repairs'}
              {activeTab === 'history' && 'Repair History'}
              {activeTab === 'ewaste' && 'E-Waste'}
              {activeTab === 'analytics' && 'Spend Analytics'}
              {activeTab === 'profile' && 'Profile'}
            </h2>
            <div className="w-16" />
          </div>

          {/* ============== ACTIVE REPAIRS TAB ============== */}
          {activeTab === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white hidden lg:block">
                  Active Repairs
                </h1>
                <Link href="/book">
                  <Button className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold">
                    <Wrench className="w-4 h-4 mr-2" />
                    Book a Repair
                  </Button>
                </Link>
              </div>

              {fetchingRepairs ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RepairCardSkeleton key={i} />
                  ))}
                </div>
              ) : activeRepairs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-12 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#00D084]/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-[#00D084]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No active repairs
                  </h3>
                  <p className="text-white/50 text-sm mb-6 max-w-sm">
                    All your repairs are completed or you haven&apos;t booked one yet.
                    Get started by booking a repair.
                  </p>
                  <Link href="/book">
                    <Button className="gradient-green text-[#0A0A0A] font-semibold px-6">
                      Book a Repair
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {activeRepairs.map((repair, idx) => (
                    <motion.div
                      key={repair.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="glass glass-hover rounded-2xl p-6 transition-all duration-300"
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {repair.device?.brand} {repair.device?.model_name}
                          </h3>
                          <p className="text-white/50 text-sm mt-0.5 line-clamp-2">
                            {repair.issue_description}
                          </p>
                        </div>
                        <Badge className="bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/25 shrink-0 self-start">
                          {REPAIR_STATUS_LABELS[repair.status]}
                        </Badge>
                      </div>

                      {/* Repair Tracker */}
                      <div className="mb-4 py-2">
                        <RepairTracker currentStatus={repair.status} />
                      </div>

                      {/* Footer row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          {repair.estimated_cost != null && (
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3.5 h-3.5" />
                              Est. {repair.estimated_cost.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(repair.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <Link
                          href={`/track?id=${repair.id}`}
                          className="text-[#00D084] text-sm font-medium hover:underline underline-offset-4"
                        >
                          View Details
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============== REPAIR HISTORY TAB ============== */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">
                Repair History
              </h1>

              {fetchingHistory ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <RepairCardSkeleton key={i} />
                  ))}
                </div>
              ) : historyRepairs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-12 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-white/30" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No repair history yet
                  </h3>
                  <p className="text-white/50 text-sm max-w-sm">
                    Completed repairs will appear here once delivered.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {historyRepairs.map((repair, idx) => {
                    const timeline = timelineMap[repair.id] || [];
                    const lastEntry = timeline[timeline.length - 1];
                    const warranty = getWarrantyInfo(repair.updated_at);
                    const deliveredEntry = timeline.find(
                      (t) => t.status === 'delivered'
                    );

                    return (
                      <motion.div
                        key={repair.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.08 }}
                        className="glass glass-hover rounded-2xl p-6 transition-all duration-300"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {repair.device?.brand} {repair.device?.model_name}
                            </h3>
                            <p className="text-white/50 text-sm mt-0.5 line-clamp-2">
                              {repair.issue_description}
                            </p>
                          </div>
                          <Badge className="bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/25 shrink-0 self-start">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Delivered
                          </Badge>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {/* Final cost */}
                          <div className="glass rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" /> Final Cost
                            </p>
                            <p className="text-white font-semibold">
                              {repair.final_cost != null
                                ? `Rs. ${repair.final_cost.toLocaleString('en-IN')}`
                                : 'N/A'}
                            </p>
                          </div>

                          {/* Technician notes */}
                          <div className="glass rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Technician Notes
                            </p>
                            <p className="text-white/70 text-sm">
                              {lastEntry?.note || 'No notes available'}
                            </p>
                          </div>
                        </div>

                        {/* Before/After photos */}
                        <div className="mb-4">
                          <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Photos
                          </p>
                          <div className="flex gap-3">
                            {/* Before */}
                            <div className="flex-1">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                                Before
                              </p>
                              <div className="aspect-[4/3] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {timeline.find((t) => t.photo_url) ? (
                                  <Image
                                    src={
                                      timeline.find((t) => t.photo_url)!.photo_url!
                                    }
                                    alt="Before"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <AlertCircle className="w-5 h-5 text-white/20 mx-auto mb-1" />
                                    <span className="text-[10px] text-white/20">
                                      No photo
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* After */}
                            <div className="flex-1">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                                After
                              </p>
                              <div className="aspect-[4/3] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {deliveredEntry?.photo_url ? (
                                  <Image
                                    src={deliveredEntry.photo_url}
                                    alt="After"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <CheckCircle className="w-5 h-5 text-white/20 mx-auto mb-1" />
                                    <span className="text-[10px] text-white/20">
                                      No photo
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Warranty & Review row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-white/40" />
                            <span
                              className={`text-sm font-medium ${
                                warranty.expired
                                  ? 'text-white/30'
                                  : 'text-[#00D084]'
                              }`}
                            >
                              Warranty: {warranty.text}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#00D084]/30 text-[#00D084] hover:bg-[#00D084]/10 hover:text-[#00D084]"
                            onClick={() => {
                              setReviewRepairId(repair.id);
                              setReviewRating(5);
                              setReviewComment('');
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Star className="w-3.5 h-3.5 mr-1.5" />
                            Leave Review
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ============== E-WASTE TAB ============== */}
          {activeTab === 'ewaste' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">
                E-Waste
              </h1>

              {/* Submit form */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-2xl p-6 mb-6"
              >
                <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-[#00D084]" />
                  Submit E-Waste
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Describe your old or broken device and get a valuation for
                  responsible recycling.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ewaste-desc" className="text-white/70">
                      Device Description
                    </Label>
                    <Textarea
                      id="ewaste-desc"
                      placeholder="e.g. Samsung Galaxy S20, cracked screen, not turning on..."
                      value={ewasteDescription}
                      onChange={(e) => setEwasteDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[100px]"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitEwaste}
                    disabled={submittingEwaste}
                    className="gradient-green text-[#0A0A0A] font-semibold"
                  >
                    {submittingEwaste ? 'Submitting...' : 'Get Valuation'}
                  </Button>
                </div>
              </motion.div>

              {/* Past submissions */}
              <h3 className="text-white font-semibold mb-4">Past Submissions</h3>
              {fetchingEwaste ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <EwasteCardSkeleton key={i} />
                  ))}
                </div>
              ) : ewasteItems.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <Recycle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">
                    No e-waste submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ewasteItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.06 }}
                      className="glass glass-hover rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-300"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {item.device_description}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.estimated_value != null && (
                          <span className="text-[#00D084] text-sm font-semibold flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {item.estimated_value.toLocaleString('en-IN')}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            ewasteStatusColor[item.status] ||
                            'bg-white/10 text-white/50 border-white/20'
                          }
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============== ANALYTICS TAB ============== */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">
                Spend Analytics
              </h1>

              {(() => {
                const allRepairs = [...activeRepairs, ...historyRepairs];
                const totalSpent = historyRepairs.reduce((s, r) => s + (r.final_cost || 0), 0);
                const totalEstimated = activeRepairs.reduce((s, r) => s + (r.estimated_cost || 0), 0);
                const repairCount = allRepairs.length;
                const deviceCounts: Record<string, number> = {};
                allRepairs.forEach((r) => {
                  const key = `${r.device?.brand} ${r.device?.model_name}`;
                  deviceCounts[key] = (deviceCounts[key] || 0) + 1;
                });
                const favoriteDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0];
                const avgCost = historyRepairs.length > 0 ? totalSpent / historyRepairs.length : 0;
                const brandCounts: Record<string, number> = {};
                allRepairs.forEach((r) => {
                  if (r.device?.brand) brandCounts[r.device.brand] = (brandCounts[r.device.brand] || 0) + 1;
                });
                const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                return (
                  <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="glass rounded-2xl p-5 text-center">
                        <IndianRupee className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{totalSpent > 0 ? `Rs. ${totalSpent.toLocaleString('en-IN')}` : 'Rs. 0'}</p>
                        <p className="text-white/40 text-xs mt-1">Total Spent</p>
                      </div>
                      <div className="glass rounded-2xl p-5 text-center">
                        <TrendingUp className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{repairCount}</p>
                        <p className="text-white/40 text-xs mt-1">Total Repairs</p>
                      </div>
                      <div className="glass rounded-2xl p-5 text-center">
                        <BarChart3 className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{avgCost > 0 ? `Rs. ${Math.round(avgCost).toLocaleString('en-IN')}` : 'N/A'}</p>
                        <p className="text-white/40 text-xs mt-1">Avg. Repair Cost</p>
                      </div>
                      <div className="glass rounded-2xl p-5 text-center">
                        <Wrench className="w-5 h-5 text-[#00D084] mx-auto mb-2" />
                        <p className="text-lg font-bold text-white truncate">{favoriteDevice ? favoriteDevice[0] : 'N/A'}</p>
                        <p className="text-white/40 text-xs mt-1">Most Repaired Device</p>
                      </div>
                    </div>

                    {/* Pending estimated costs */}
                    {totalEstimated > 0 && (
                      <div className="glass rounded-2xl p-5">
                        <p className="text-white/40 text-xs mb-1">Pending Estimated Costs</p>
                        <p className="text-white text-xl font-bold">Rs. {totalEstimated.toLocaleString('en-IN')}</p>
                        <p className="text-white/30 text-xs mt-1">Across {activeRepairs.length} active repair{activeRepairs.length !== 1 ? 's' : ''}</p>
                      </div>
                    )}

                    {/* Top brands */}
                    {topBrands.length > 0 && (
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#00D084]" /> Repairs by Brand
                        </h3>
                        <div className="space-y-3">
                          {topBrands.map(([brand, count]) => {
                            const pct = Math.round((count / repairCount) * 100);
                            return (
                              <div key={brand}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/70 text-sm">{brand}</span>
                                  <span className="text-white/40 text-xs">{count} repair{count !== 1 ? 's' : ''} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full gradient-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent spending */}
                    {historyRepairs.length > 0 && (
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-[#00D084]" /> Recent Completed Repairs
                        </h3>
                        <div className="space-y-3">
                          {historyRepairs.slice(0, 5).map((r) => (
                            <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <div>
                                <p className="text-white text-sm font-medium">{r.device?.brand} {r.device?.model_name}</p>
                                <p className="text-white/40 text-xs">{new Date(r.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <span className="text-[#00D084] font-semibold text-sm">
                                {r.final_cost != null ? `Rs. ${r.final_cost.toLocaleString('en-IN')}` : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {allRepairs.length === 0 && (
                      <div className="glass rounded-2xl p-12 text-center">
                        <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-white/50 text-sm">No repair data yet. Book a repair to see analytics.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ============== PROFILE TAB ============== */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">
                Profile
              </h1>

              <div className="glass rounded-2xl p-6 max-w-xl">
                {/* Avatar section */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <Avatar className="h-16 w-16 border-2 border-[#00D084]/30">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-[#00D084]/20 text-[#00D084] text-xl font-bold">
                      {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-semibold">{user.full_name}</h3>
                    <p className="text-white/40 text-sm">{user.role}</p>
                  </div>
                </div>

                {/* Read-only fields */}
                <div className="space-y-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-white/40 text-xs flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email
                    </Label>
                    <p className="text-white/70 text-sm pl-0.5">{user.email || 'Not set'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/40 text-xs flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Role
                    </Label>
                    <p className="text-white/70 text-sm pl-0.5 capitalize">{user.role}</p>
                  </div>
                </div>

                <Separator className="bg-white/10 mb-6" />

                {/* Editable fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-white/70">
                      Full Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-white/70">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Phone
                    </Label>
                    <Input
                      id="edit-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="gradient-green text-[#0A0A0A] font-semibold mt-2"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Leave a Review</DialogTitle>
            <DialogDescription className="text-white/50">
              Share your experience with this repair
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Star rating */}
            <div className="space-y-2">
              <Label className="text-white/70">Rating</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        i < reviewRating
                          ? 'text-[#00D084] fill-[#00D084]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment" className="text-white/70">
                Comment (optional)
              </Label>
              <Textarea
                id="review-comment"
                placeholder="How was your experience?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="gradient-green text-[#0A0A0A] font-semibold"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
