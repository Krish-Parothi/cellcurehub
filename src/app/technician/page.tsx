'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Clock, CircleCheck as CheckCircle, Package, Camera, Mic, Plus, Search, ChevronRight, Timer, Smartphone, Battery, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry, Part, PartUsed } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type RepairWithJoins = Repair & {
  device: { brand: string; model_name: string; category: string } | null;
  customer: { full_name: string; phone: string | null } | null;
};

const KANBAN_COLUMNS: { label: string; statuses: string[]; color: string }[] = [
  { label: 'Assigned', statuses: ['booked', 'pickup_scheduled', 'device_received'], color: '#3B82F6' },
  { label: 'In Progress', statuses: ['diagnostic', 'repair_in_progress'], color: '#F59E0B' },
  { label: 'QA', statuses: ['qa_testing'], color: '#8B5CF6' },
  { label: 'Done', statuses: ['ready', 'delivered'], color: '#00D084' },
];

const RCA_CHECKS = [
  { key: 'screen', label: 'Screen', options: ['OK', 'Damaged'] },
  { key: 'battery', label: 'Battery', options: ['OK', 'Swollen', 'Dead'] },
  { key: 'charging', label: 'Charging', options: ['OK', 'Loose', 'Not working'] },
  { key: 'speaker', label: 'Speaker', options: ['OK', 'Muffled', 'Dead'] },
  { key: 'camera', label: 'Camera', options: ['OK', 'Cracked', 'Dead'] },
  { key: 'buttons', label: 'Buttons', options: ['OK', 'Stuck', 'Dead'] },
  { key: 'water', label: 'Water Damage', options: ['None', 'Minor', 'Severe'] },
  { key: 'software', label: 'Software', options: ['OK', 'Corrupt', 'Needs Reset'] },
];

const QA_CHECKS = [
  { key: 'faceid', label: 'FaceID/TouchID' },
  { key: 'charging', label: 'Charging' },
  { key: 'rear_camera', label: 'Rear Camera' },
  { key: 'front_camera', label: 'Front Camera' },
  { key: 'speaker', label: 'Speaker' },
  { key: 'microphone', label: 'Microphone' },
];

function getSlaTime(createdAt: string) {
  const deadline = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;
  if (remaining <= 0) return { hours: 0, minutes: 0, color: 'text-red-500', expired: true };
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const color = hours > 24 ? 'text-green-400' : hours >= 12 ? 'text-yellow-400' : 'text-red-500';
  return { hours, minutes, color, expired: false };
}

function getNextStatus(current: string): string | null {
  const idx = REPAIR_STATUS_ORDER.indexOf(current as typeof REPAIR_STATUS_ORDER[number]);
  if (idx < 0 || idx >= REPAIR_STATUS_ORDER.length - 1) return null;
  return REPAIR_STATUS_ORDER[idx + 1];
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [repairs, setRepairs] = useState<RepairWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<RepairWithJoins | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rcaChecks, setRcaChecks] = useState<Record<string, string>>({});
  const [qaChecks, setQaChecks] = useState<Record<string, string>>({});
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [partResults, setPartResults] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partQty, setPartQty] = useState(1);
  const [statusNote, setStatusNote] = useState('');
  const [partsUsedList, setPartsUsedList] = useState<PartUsed[]>([]);

  const fetchRepairs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('repairs')
      .select('*, device:devices(*), customer:users!repairs_customer_id_fkey(full_name, phone)')
      .eq('technician_id', user.id);
    if (error) { toast.error('Failed to fetch repairs'); return; }
    setRepairs((data || []) as unknown as RepairWithJoins[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'technician')) {
      router.replace('/login');
      return;
    }
    if (user) fetchRepairs();
  }, [user, authLoading, router, fetchRepairs]);

  const fetchPartsForRepair = useCallback(async (repairId: string) => {
    const { data } = await supabase
      .from('parts_used')
      .select('*, part:parts(*)')
      .eq('repair_id', repairId);
    setPartsUsedList((data || []) as PartUsed[]);
  }, []);

  const openDetail = (repair: RepairWithJoins) => {
    setSelectedRepair(repair);
    setDialogOpen(true);
    setRcaChecks({});
    setQaChecks({});
    setStatusNote('');
    setPartSearch('');
    setSelectedPart(null);
    setPartQty(1);
    setPartResults([]);
    fetchPartsForRepair(repair.id);
  };

  const searchParts = async (query: string) => {
    setPartSearch(query);
    if (query.length < 2) { setPartResults([]); return; }
    const { data } = await supabase
      .from('parts')
      .select('*')
      .ilike('name', '%' + query + '%');
    setPartResults((data || []) as Part[]);
  };

  const addPart = async () => {
    if (!selectedRepair || !selectedPart) return;
    if (partQty > selectedPart.quantity_in_stock) {
      toast.error('Not enough stock'); return;
    }
    const { error } = await supabase.from('parts_used').insert({
      repair_id: selectedRepair.id,
      part_id: selectedPart.id,
      quantity: partQty,
      cost_at_time: selectedPart.selling_price,
    });
    if (error) { toast.error('Failed to add part'); return; }
    await supabase.from('parts')
      .update({ quantity_in_stock: selectedPart.quantity_in_stock - partQty })
      .eq('id', selectedPart.id);
    toast.success('Part added');
    setPartSearch('');
    setSelectedPart(null);
    setPartQty(1);
    setPartResults([]);
    fetchPartsForRepair(selectedRepair.id);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedRepair) return;
    if (newStatus === 'ready' && selectedRepair.status === 'qa_testing') {
      const allPassed = QA_CHECKS.every(c => qaChecks[c.key] === 'Pass');
      if (!allPassed) { toast.error('All QA checks must pass'); return; }
    }
    const { error } = await supabase
      .from('repairs')
      .update({ status: newStatus })
      .eq('id', selectedRepair.id);
    if (error) { toast.error('Failed to update status'); return; }
    await supabase.from('repair_timeline').insert({
      repair_id: selectedRepair.id,
      status: newStatus,
      note: statusNote || `Status updated to ${REPAIR_STATUS_LABELS[newStatus as keyof typeof REPAIR_STATUS_LABELS]}`,
      updated_by: user!.id,
    });
    toast.success('Status updated');
    setDialogOpen(false);
    fetchRepairs();
  };

  const activeCount = repairs.filter(r =>
    !['ready', 'delivered'].includes(r.status)
  ).length;
  const completedToday = repairs.filter(r => {
    if (!['ready', 'delivered'].includes(r.status)) return false;
    const updated = new Date(r.updated_at);
    const now = new Date();
    return updated.toDateString() === now.toDateString();
  }).length;

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              Technician Dashboard
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Welcome, {user?.full_name}
            </p>
          </div>
          <div className="flex gap-4">
            <Card className="glass px-4 py-3 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-[#00D084]" />
              <div>
                <p className="text-xs text-white/50">Active Jobs</p>
                <p className="text-lg font-bold text-white">{activeCount}</p>
              </div>
            </Card>
            <Card className="glass px-4 py-3 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#00D084]" />
              <div>
                <p className="text-xs text-white/50">Done Today</p>
                <p className="text-lg font-bold text-white">{completedToday}</p>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Kanban Board */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-32" />
                {[0, 1, 2].map(j => (
                  <Skeleton key={j} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory">
            {KANBAN_COLUMNS.map((col, ci) => {
              const colRepairs = repairs.filter(r => col.statuses.includes(r.status));
              return (
                <motion.div
                  key={col.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.1 }}
                  className="min-w-[280px] md:min-w-0 snap-start"
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <h2 className="text-sm font-semibold text-white/80">{col.label}</h2>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {colRepairs.length}
                    </Badge>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {colRepairs.map((repair, ri) => {
                      const sla = getSlaTime(repair.created_at);
                      return (
                        <motion.div
                          key={repair.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ri * 0.05 }}
                          onClick={() => openDetail(repair)}
                          className="glass glass-hover rounded-xl p-4 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">
                              {repair.device?.brand} {repair.device?.model_name}
                            </span>
                            <Badge
                              className="text-[10px]"
                              style={{
                                background: `${col.color}20`,
                                color: col.color,
                                border: `1px solid ${col.color}40`,
                              }}
                            >
                              {REPAIR_STATUS_LABELS[repair.status as keyof typeof REPAIR_STATUS_LABELS]}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/50 mb-2">
                            {repair.customer?.full_name}
                          </p>
                          <p className="text-xs text-white/40 line-clamp-2 mb-3">
                            {repair.issue_description}
                          </p>
                          <div className={`flex items-center gap-1.5 text-xs ${sla.color}`}>
                            <Timer className="w-3.5 h-3.5" />
                            {sla.expired ? 'SLA Expired' : `${sla.hours}h ${sla.minutes}m left`}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Job Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass max-h-[90vh] overflow-y-auto max-w-2xl bg-[#0A0A0A] border-white/10">
            {selectedRepair && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#00D084]" />
                    {selectedRepair.device?.brand} {selectedRepair.device?.model_name}
                  </DialogTitle>
                  <DialogDescription className="text-white/50">
                    Repair #{selectedRepair.id.slice(0, 8)}
                  </DialogDescription>
                </DialogHeader>

                {/* Customer & Device Info */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-white/50 mb-1">Customer</p>
                    <p className="text-sm font-medium text-white">
                      {selectedRepair.customer?.full_name}
                    </p>
                    <p className="text-xs text-white/50">
                      {selectedRepair.customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-white/50 mb-1">SLA Timer</p>
                    {(() => {
                      const sla = getSlaTime(selectedRepair.created_at);
                      return (
                        <p className={`text-2xl font-bold ${sla.color}`}>
                          {sla.expired ? 'EXPIRED' : `${sla.hours}h ${sla.minutes}m`}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="glass rounded-lg p-3 mt-2">
                  <p className="text-xs text-white/50 mb-1">Issue</p>
                  <p className="text-sm text-white/80">
                    {selectedRepair.issue_description}
                  </p>
                </div>

                <Separator className="my-4 bg-white/10" />

                {/* RCA Generator */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#00D084]" />
                    Diagnostic Checklist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RCA_CHECKS.map(check => (
                      <div key={check.key} className="flex items-center gap-2">
                        <Label className="text-xs text-white/60 w-24 shrink-0">
                          {check.label}
                        </Label>
                        <div className="flex gap-1">
                          {check.options.map(opt => (
                            <Button
                              key={opt}
                              size="sm"
                              variant={rcaChecks[check.key] === opt ? 'default' : 'outline'}
                              className={`text-[10px] px-2 h-7 ${
                                rcaChecks[check.key] === opt
                                  ? 'bg-[#00D084] text-[#0A0A0A] hover:bg-[#00D084]'
                                  : 'border-white/20 text-white/50 hover:text-white'
                              }`}
                              onClick={() =>
                                setRcaChecks(prev => ({
                                  ...prev,
                                  [check.key]: prev[check.key] === opt ? '' : opt,
                                }))
                              }
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Camera & Voice Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="glass border-white/10 text-white/70 flex-1"
                    onClick={() => toast.info('Camera feature coming soon')}
                  >
                    <Camera className="w-4 h-4 mr-2" /> Camera
                  </Button>
                  <Button
                    variant="outline"
                    className="glass border-white/10 text-white/70 flex-1"
                    onClick={() => toast.info('Voice notes coming soon')}
                  >
                    <Mic className="w-4 h-4 mr-2" /> Voice Notes
                  </Button>
                </div>

                <Separator className="my-4 bg-white/10" />

                {/* Part Requisition */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#00D084]" />
                    Part Requisition
                  </h3>
                  {partsUsedList.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {partsUsedList.map(pu => (
                        <div key={pu.id} className="flex items-center justify-between text-xs glass rounded px-3 py-2">
                          <span className="text-white/70">{pu.part?.name}</span>
                          <span className="text-white/50">x{pu.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        placeholder="Search parts..."
                        value={partSearch}
                        onChange={e => searchParts(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white"
                      />
                      {partResults.length > 0 && (
                        <div className="absolute top-full mt-1 w-full glass rounded-lg p-2 z-50 max-h-40 overflow-y-auto">
                          {partResults.map(part => (
                            <button
                              key={part.id}
                              className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm text-white/80"
                              onClick={() => {
                                setSelectedPart(part);
                                setPartSearch(part.name);
                                setPartResults([]);
                              }}
                            >
                              {part.name} <span className="text-white/40 text-xs">(Stock: {part.quantity_in_stock})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={e => setPartQty(Number(e.target.value))}
                      className="w-16 bg-white/5 border-white/10 text-white text-center"
                    />
                    <Button
                      onClick={addPart}
                      disabled={!selectedPart}
                      className="bg-[#00D084] text-[#0A0A0A] hover:bg-[#00B870]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedPart && (
                    <p className="text-xs text-[#00D084] mt-1">
                      Selected: {selectedPart.name} (Rs.{selectedPart.selling_price})
                    </p>
                  )}
                </div>

                {/* QA Checklist */}
                {selectedRepair.status === 'qa_testing' && (
                  <>
                    <Separator className="my-4 bg-white/10" />
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#00D084]" />
                        QA Checklist
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {QA_CHECKS.map(check => (
                          <div key={check.key} className="flex items-center gap-2">
                            <Label className="text-xs text-white/60 w-28 shrink-0">
                              {check.label}
                            </Label>
                            <div className="flex gap-1">
                              {['Pass', 'Fail'].map(opt => (
                                <Button
                                  key={opt}
                                  size="sm"
                                  variant={qaChecks[check.key] === opt ? 'default' : 'outline'}
                                  className={`text-[10px] px-3 h-7 ${
                                    qaChecks[check.key] === opt
                                      ? opt === 'Pass'
                                        ? 'bg-[#00D084] text-[#0A0A0A] hover:bg-[#00D084]'
                                        : 'bg-red-500 text-white hover:bg-red-500'
                                      : 'border-white/20 text-white/50 hover:text-white'
                                  }`}
                                  onClick={() =>
                                    setQaChecks(prev => ({ ...prev, [check.key]: opt }))
                                  }
                                >
                                  {opt}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4 bg-white/10" />

                {/* Status Update */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#00D084]" />
                    Update Status
                  </h3>
                  {(() => {
                    const next = getNextStatus(selectedRepair.status);
                    return next ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/10 text-white/70">
                            {REPAIR_STATUS_LABELS[selectedRepair.status as keyof typeof REPAIR_STATUS_LABELS]}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                          <Badge className="bg-[#00D084]/20 text-[#00D084]">
                            {REPAIR_STATUS_LABELS[next as keyof typeof REPAIR_STATUS_LABELS]}
                          </Badge>
                        </div>
                        <Textarea
                          placeholder="Add a note (optional)"
                          value={statusNote}
                          onChange={e => setStatusNote(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-sm"
                          rows={2}
                        />
                        <Button
                          onClick={() => updateStatus(next)}
                          className="gradient-green text-[#0A0A0A] font-semibold self-end"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as {REPAIR_STATUS_LABELS[next as keyof typeof REPAIR_STATUS_LABELS]}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-white/50 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#00D084]" />
                        Repair is complete
                      </p>
                    );
                  })()}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
