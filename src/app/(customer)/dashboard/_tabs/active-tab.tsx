'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Repair, RepairTimelineEntry, RcaReport } from '@/lib/types';
import VerticalTimeline from '@/components/vertical-timeline';
import RcaModal from '@/components/rca-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, Calendar, IndianRupee, CircleCheck as CheckCircle, ChevronDown, ChevronUp, ClipboardCheck, AlertTriangle, Loader as Loader2 } from 'lucide-react';

export default function ActiveTab({ userId }: { userId: string }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, RepairTimelineEntry[]>>({});
  const [rcaReport, setRcaReport] = useState<RcaReport | null>(null);
  const [rcaOpen, setRcaOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [confirmedRcaIds, setConfirmedRcaIds] = useState<Set<string>>(new Set());

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('repairs').select('*, device:devices(*)').eq('customer_id', userId).not('status', 'in', '("delivered","cancelled","done")').order('created_at', { ascending: false });
    const reps = (data as Repair[]) || [];
    setRepairs(reps);
    // Fetch which repairs have admin-confirmed RCAs
    if (reps.length > 0) {
      const { data: rcas } = await supabase.from('rca_reports').select('repair_id').eq('admin_confirmed', true).in('repair_id', reps.map(r => r.id));
      console.debug('[ACTIVE_TAB_RCAS]', rcas);
      setConfirmedRcaIds(new Set((rcas || []).map((r: any) => r.repair_id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  const fetchTimeline = async (repairId: string) => {
    if (timelines[repairId]) return;
    const { data } = await supabase.from('repair_timeline').select('*').eq('repair_id', repairId).order('created_at');
    if (data) setTimelines(prev => ({ ...prev, [repairId]: data as RepairTimelineEntry[] }));
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchTimeline(id);
  };

  const handleViewRca = async (repairId: string) => {
    console.debug('[CUSTOMER_VIEW_RCA]', { repairId, userId });
    const { data, error } = await supabase.from('rca_reports').select('*').eq('repair_id', repairId).eq('admin_confirmed', true).maybeSingle();
    console.debug('[CUSTOMER_VIEW_RCA_RESULT]', { data, error });
    if (error) { toast.error('Could not load RCA: ' + error.message); return; }
    if (data) { setRcaReport(data as RcaReport); setRcaOpen(true); }
    else toast.error('No confirmed RCA report found');
  };

  const handleApprove = async (repairId: string) => {
    setApprovalLoading(repairId);
    await supabase.from('repairs').update({ approval_status: 'approved' }).eq('id', repairId);
    await supabase.from('repair_timeline').insert({ repair_id: repairId, status: 'diagnostic', note: 'Customer approved revised quote', updated_by: userId });
    toast.success('Quote approved!');
    setApprovalLoading(null);
    fetchRepairs();
  };

  const handleReject = async (repairId: string) => {
    setApprovalLoading(repairId);
    await supabase.from('repairs').update({ approval_status: 'rejected', status: 'cancelled' }).eq('id', repairId);
    await supabase.from('repair_timeline').insert({ repair_id: repairId, status: 'cancelled', note: 'Customer rejected revised quote', updated_by: userId });
    toast('Repair cancelled.');
    setApprovalLoading(null);
    fetchRepairs();
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl bg-white/5" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white hidden lg:block">Active Repairs</h1>
        <Link href="/book"><Button className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold"><Wrench className="w-4 h-4 mr-2" />Book a Repair</Button></Link>
      </div>

      {repairs.length === 0 ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#00D084]/10 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-[#00D084]" /></div>
          <h3 className="text-xl font-semibold text-white mb-2">No active repairs</h3>
          <p className="text-white/50 text-sm mb-6 max-w-sm">Book a repair to get started.</p>
          <Link href="/book"><Button className="gradient-green text-[#0A0A0A] font-semibold px-6">Book a Repair</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {repairs.map((r, idx) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="glass glass-hover rounded-2xl p-6">
              {/* Approval Gateway */}
              {r.approval_status === 'pending' && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-amber-400">⚠️ Action Required</span></div>
                  {r.approval_note && <p className="text-sm text-white/60 mb-3">{r.approval_note}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approvalLoading === r.id} className="bg-[#00D084] hover:bg-[#00D084]/90 text-black text-xs">{approvalLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓ Approve'}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} disabled={approvalLoading === r.id} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">✗ Reject</Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{r.device ? `${r.device.brand} ${r.device.model_name}` : r.manual_model || 'Unknown'}</h3>
                  <p className="text-white/50 text-sm mt-0.5">{r.repair_type?.replace(/_/g, ' ') || r.issue_description}</p>
                </div>
                <Badge className="bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/25 shrink-0 self-start">{REPAIR_STATUS_LABELS[r.status]}</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/50 mb-3">
                {r.estimated_cost != null && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />Est. {r.estimated_cost.toLocaleString('en-IN')}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleExpand(r.id)} className="text-[#00D084] text-sm font-medium flex items-center gap-1 hover:underline">
                  {expandedId === r.id ? <><ChevronUp className="w-4 h-4" />Hide Timeline</> : <><ChevronDown className="w-4 h-4" />Show Timeline</>}
                </button>
                {confirmedRcaIds.has(r.id) && (
                  <button onClick={() => handleViewRca(r.id)} className="text-white/50 text-sm font-medium flex items-center gap-1 hover:text-white"><ClipboardCheck className="w-4 h-4" />View RCA</button>
                )}
              </div>

              {expandedId === r.id && timelines[r.id] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/5">
                  <VerticalTimeline entries={timelines[r.id]} currentStatus={r.status} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <RcaModal report={rcaReport} open={rcaOpen} onClose={() => setRcaOpen(false)} />
    </motion.div>
  );
}
