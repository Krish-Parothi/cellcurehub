'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import RepairTracker from '@/components/repair-tracker';
import { REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Phone, Hash, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Package, Wrench, Truck, Camera, Loader as Loader2 } from 'lucide-react';

/* ──────────────── Animation Variants ──────────────── */

const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/* ──────────────── Status Icon Map ──────────────── */

function getStatusIcon(status: string) {
  switch (status) {
    case 'booked':
      return Hash;
    case 'pickup_scheduled':
      return Truck;
    case 'device_received':
      return Package;
    case 'diagnostic':
      return Wrench;
    case 'repair_in_progress':
      return Wrench;
    case 'qa_testing':
      return CheckCircle;
    case 'ready':
      return CheckCircle;
    case 'delivered':
      return Truck;
    default:
      return Clock;
  }
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['delivered', 'ready', 'qa_testing'].includes(status)) return 'default';
  if (['diagnostic', 'repair_in_progress'].includes(status))
    return 'secondary';
  return 'outline';
}

/* ──────────────── Page Component ──────────────── */

export default function TrackPage() {
  const [searchMode, setSearchMode] = useState<'id' | 'phone'>('id');
  const [repairId, setRepairId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [repair, setRepair] = useState<Repair | null>(null);
  const [timelines, setTimelines] = useState<RepairTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  /* ── Realtime subscription ── */
  useEffect(() => {
    if (!repair?.id) return;

    const channel = supabase
      .channel('repair-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'repair_timeline',
          filter: `repair_id=eq.${repair.id}`,
        },
        (payload) => {
          const newEntry = payload.new as RepairTimelineEntry;
          setTimelines((prev) => [newEntry, ...prev]);
          toast.success('Repair update received!', {
            description:
              REPAIR_STATUS_LABELS[newEntry.status as keyof typeof REPAIR_STATUS_LABELS] ||
              'New status update',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [repair?.id]);

  /* ── Fetch timeline entries ── */
  const fetchTimeline = useCallback(async (id: string) => {
    setTimelineLoading(true);
    const { data, error } = await supabase
      .from('repair_timeline')
      .select('*')
      .eq('repair_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTimelines(data as RepairTimelineEntry[]);
    }
    setTimelineLoading(false);
  }, []);

  /* ── Search by Repair ID ── */
  const searchById = useCallback(
    async (id: string) => {
      setLoading(true);
      setNotFound(false);
      setRepair(null);
      setTimelines([]);

      const { data, error } = await supabase
        .from('repairs')
        .select(
          '*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)'
        )
        .eq('id', id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRepair(data as Repair);
      setLoading(false);
      await fetchTimeline(id);
    },
    [fetchTimeline]
  );

  /* ── Search by Phone ── */
  const searchByPhone = useCallback(
    async (phone: string) => {
      setLoading(true);
      setNotFound(false);
      setRepair(null);
      setTimelines([]);

      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (userError || !userData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: repairData, error: repairError } = await supabase
        .from('repairs')
        .select(
          '*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)'
        )
        .eq('customer_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (repairError || !repairData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRepair(repairData as Repair);
      setLoading(false);
      await fetchTimeline(repairData.id);
    },
    [fetchTimeline]
  );

  /* ── Handle search submit ── */
  const handleSearch = () => {
    if (searchMode === 'id') {
      if (!repairId.trim()) {
        toast.error('Please enter a Repair ID');
        return;
      }
      searchById(repairId.trim());
    } else {
      if (!phoneNumber.trim()) {
        toast.error('Please enter a phone number');
        return;
      }
      searchByPhone(phoneNumber.trim());
    }
  };

  /* ── Approval Gateway ── */
  const latestTimeline = timelines[0];
  const showApprovalGateway =
    latestTimeline?.status === 'diagnostic' &&
    latestTimeline?.note &&
    (latestTimeline.note.toLowerCase().includes('additional') ||
      latestTimeline.note.toLowerCase().includes('extra') ||
      latestTimeline.note.toLowerCase().includes('damage') ||
      latestTimeline.note.toLowerCase().includes('found'));

  const handleApprove = async () => {
    if (!repair) return;
    setApprovalLoading(true);

    // Try to extract updated cost from the note
    const costMatch = latestTimeline?.note?.match(/(?:₹|Rs\.?|cost|price|quote)[:\s]*(\d+)/i);
    const updatedCost = costMatch ? parseInt(costMatch[1], 10) : null;

    if (updatedCost) {
      await supabase
        .from('repairs')
        .update({ estimated_cost: updatedCost })
        .eq('id', repair.id);
    }

    await supabase.from('repair_timeline').insert({
      repair_id: repair.id,
      status: 'diagnostic',
      note: 'Customer approved updated quote',
    });

    toast.success('Quote approved! Repair will proceed.');
    setApprovalLoading(false);
    await fetchTimeline(repair.id);
  };

  const handleReject = async () => {
    if (!repair) return;
    setApprovalLoading(true);

    await supabase.from('repair_timeline').insert({
      repair_id: repair.id,
      status: 'diagnostic',
      note: 'Customer rejected updated quote',
    });

    toast('Quote rejected. We will contact you shortly.');
    setApprovalLoading(false);
    await fetchTimeline(repair.id);
  };

  /* ── Format date ── */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#00D084]/5 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
        {/* ── Search Section ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center"
        >
          <motion.div variants={staggerItem} className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Track Your <span className="text-[#00D084]">Repair</span>
            </h1>
            <p className="mt-2 text-white/50 text-sm sm:text-base">
              Enter your Repair ID or phone number to get real-time status
              updates
            </p>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
          >
            {/* Mode toggle */}
            <div className="flex rounded-lg bg-white/5 p-1 mb-6">
              <button
                type="button"
                onClick={() => setSearchMode('id')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  searchMode === 'id'
                    ? 'bg-[#00D084] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                Repair ID
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  searchMode === 'phone'
                    ? 'bg-[#00D084] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone Number
              </button>
            </div>

            {/* ID input */}
            <AnimatePresence mode="wait">
              {searchMode === 'id' ? (
                <motion.div
                  key="id-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <Label htmlFor="repair-id" className="text-white/80 text-sm">
                    Repair ID
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      id="repair-id"
                      type="text"
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      value={repairId}
                      onChange={(e) => setRepairId(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] pl-10 font-mono text-sm"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="phone-input"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="phone-number"
                    className="text-white/80 text-sm"
                  >
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-3 text-white/60 text-sm shrink-0">
                      +91
                    </div>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Track button */}
            <Button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="mt-5 w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold h-11"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Track
                </span>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Not Found ── */}
        <AnimatePresence>
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] }}
              className="mt-8 text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No repair found
              </h3>
              <p className="text-sm text-white/50 max-w-sm mx-auto">
                We couldn&apos;t find a repair matching your search. Please
                double-check the Repair ID or phone number and try again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results Section ── */}
        <AnimatePresence>
          {repair && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="mt-8 space-y-6"
            >
              {/* Repair Info Card */}
              <motion.div variants={staggerItem}>
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-white">
                          Repair Details
                        </CardTitle>
                        <CardDescription className="text-white/40 text-xs mt-1 font-mono">
                          ID: {repair.id}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          repair.status === 'delivered'
                            ? 'bg-[#00D084] text-black hover:bg-[#00D084]/80'
                            : 'bg-[#00D084]/10 text-[#00D084] border-[#00D084]/20 hover:bg-[#00D084]/20'
                        }
                      >
                        {REPAIR_STATUS_LABELS[repair.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Device info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">Device</p>
                        <p className="text-sm font-medium text-white">
                          {repair.device?.brand} {repair.device?.model_name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">Category</p>
                        <p className="text-sm font-medium text-white capitalize">
                          {repair.device?.category}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">Issue</p>
                        <p className="text-sm text-white/80">
                          {repair.issue_description}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">
                          Estimated Cost
                        </p>
                        <p className="text-sm font-semibold text-[#00D084]">
                          {repair.estimated_cost
                            ? `\u20B9${repair.estimated_cost.toLocaleString('en-IN')}`
                            : 'Pending'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">Pickup Type</p>
                        <p className="text-sm text-white/80 capitalize">
                          {repair.pickup_type === 'home'
                            ? 'Home Pickup'
                            : 'Store Drop-off'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">Booked On</p>
                        <p className="text-sm text-white/80">
                          {formatDate(repair.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Customer info if available */}
                    {repair.customer && (
                      <>
                        <Separator className="bg-white/5" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-white/40">Customer</p>
                            <p className="text-sm text-white/80">
                              {repair.customer.full_name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-white/40">Phone</p>
                            <p className="text-sm text-white/80">
                              {repair.customer.phone}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* RepairTracker Component */}
              <motion.div variants={staggerItem}>
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Repair Progress
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      Current status:{' '}
                      <span className="text-[#00D084] font-medium">
                        {REPAIR_STATUS_LABELS[repair.status]}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RepairTracker currentStatus={repair.status} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Approval Gateway */}
              <AnimatePresence>
                {showApprovalGateway && (
                  <motion.div
                    variants={staggerItem}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="backdrop-blur-xl bg-amber-500/5 border-amber-500/20 shadow-2xl">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">
                              Additional Issue Found
                            </CardTitle>
                            <CardDescription className="text-white/40">
                              Our technician found something extra during
                              diagnostics
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {latestTimeline?.note && (
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-white/40 mb-1.5">
                              Technician&apos;s Note
                            </p>
                            <p className="text-sm text-white/80 leading-relaxed">
                              {latestTimeline.note}
                            </p>
                          </div>
                        )}

                        {/* Updated cost */}
                        {latestTimeline?.note &&
                          (latestTimeline.note.match(
                            /(?:₹|Rs\.?|cost|price|quote)[:\s]*(\d+)/i
                          ) ||
                            []) && (
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
                              <span className="text-sm text-white/50">
                                Updated Estimated Cost:
                              </span>
                              <span className="text-lg font-bold text-[#00D084]">
                                {(() => {
                                  const match =
                                    latestTimeline.note.match(
                                      /(?:₹|Rs\.?|cost|price|quote)[:\s]*(\d+)/i
                                    );
                                  return match
                                    ? `\u20B9${parseInt(match[1], 10).toLocaleString('en-IN')}`
                                    : 'See note for details';
                                })()}
                              </span>
                            </div>
                          )}

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={handleApprove}
                            disabled={approvalLoading}
                            className="flex-1 bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold h-11"
                          >
                            {approvalLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </span>
                            )}
                          </Button>
                          <Button
                            onClick={handleReject}
                            disabled={approvalLoading}
                            variant="outline"
                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 font-semibold h-11"
                          >
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timeline Details */}
              <motion.div variants={staggerItem}>
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Timeline Details
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      All status updates for this repair
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timelineLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-4">
                            <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32 bg-white/5" />
                              <Skeleton className="h-3 w-48 bg-white/5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : timelines.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40">
                          No timeline entries yet
                        </p>
                      </div>
                    ) : (
                      <div className="relative space-y-0">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />

                        {timelines.map((entry, i) => {
                          const StatusIcon = getStatusIcon(entry.status);
                          const isLatest = i === 0;
                          const statusIndex = REPAIR_STATUS_ORDER.indexOf(
                            entry.status
                          );
                          const isCurrentStatus =
                            entry.status === repair.status;

                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: i * 0.05,
                              }}
                              className="relative flex gap-4 py-4"
                            >
                              {/* Status icon node */}
                              <div
                                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                                  isCurrentStatus
                                    ? 'bg-[#00D084]/10 border-[#00D084]'
                                    : 'bg-white/5 border-white/10'
                                }`}
                              >
                                <StatusIcon
                                  className={`w-4 h-4 ${
                                    isCurrentStatus
                                      ? 'text-[#00D084]'
                                      : 'text-white/40'
                                  }`}
                                />
                                {/* Pulse on active */}
                                {isLatest && isCurrentStatus && (
                                  <motion.div
                                    className="absolute inset-0 rounded-full bg-[#00D084]/20"
                                    animate={{
                                      scale: [1, 1.5, 1],
                                      opacity: [0.4, 0, 0.4],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                    }}
                                  />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      entry.status
                                    )}
                                    className={
                                      isCurrentStatus
                                        ? 'bg-[#00D084]/10 text-[#00D084] border-[#00D084]/20 hover:bg-[#00D084]/20'
                                        : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                                    }
                                  >
                                    {REPAIR_STATUS_LABELS[entry.status]}
                                  </Badge>
                                  {isLatest && (
                                    <span className="text-[10px] font-medium text-[#00D084] bg-[#00D084]/10 px-2 py-0.5 rounded-full">
                                      Latest
                                    </span>
                                  )}
                                </div>

                                {entry.note && (
                                  <p className="mt-1.5 text-sm text-white/60 leading-relaxed">
                                    {entry.note}
                                  </p>
                                )}

                                {/* Photo */}
                                {entry.photo_url && (
                                  <div className="mt-2">
                                    <a
                                      href={entry.photo_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-[#00D084] hover:text-[#00D084]/80 transition-colors"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                      View photo
                                    </a>
                                  </div>
                                )}

                                {/* Timestamp */}
                                <p className="mt-1.5 text-xs text-white/30">
                                  {formatDate(entry.created_at)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
