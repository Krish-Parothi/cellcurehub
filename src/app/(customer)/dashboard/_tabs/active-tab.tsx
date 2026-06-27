'use client';

import { useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
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
import { Wrench, Calendar, IndianRupee, CircleCheck as CheckCircle, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';

export default function ActiveTab({ userId }: { userId: string }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, RepairTimelineEntry[]>>({});
  const [rcaReport, setRcaReport] = useState<RcaReport | null>(null);
  const [rcaOpen, setRcaOpen] = useState(false);
  const [confirmedRcaIds, setConfirmedRcaIds] = useState<Set<string>>(new Set());

  const fetchRepairs = useCallback(async () => {
    const { data } = await supabase.from('repairs').select('*, device:devices(*)').eq('customer_id', userId).not('status', 'in', '("delivered","cancelled","done")').order('created_at', { ascending: false });
    const reps = (data as Repair[]) || [];
    setRepairs(reps);
    // Fetch which repairs have admin-confirmed RCAs
    if (reps.length > 0) {
      const { data: rcas } = await supabase.from('rca_reports').select('repair_id').eq('admin_confirmed', true).in('repair_id', reps.map(r => r.id));
      console.debug('[ACTIVE_TAB_RCAS]', rcas);
      setConfirmedRcaIds(new Set((rcas || []).map((r: any) => r.repair_id)));
    } else {
      setConfirmedRcaIds(new Set());
    }
  }, [userId]);

  const { loading } = useAuthFetch(fetchRepairs, {
    realtimeTable: 'repairs',
    realtimeFilter: `customer_id=eq.${userId}`
  });

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



  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl bg-[#1A1A1A]/5" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] hidden lg:block">Active Repairs</h1>
        <Link href="/book"><Button className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold"><Wrench className="w-4 h-4 mr-2" />Book a Repair</Button></Link>
      </div>

      {repairs.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-12 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FF5C00]/10 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-[#FF5C00]" /></div>
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No active repairs</h3>
          <p className="text-[#1A1A1A]/60 text-sm mb-6 max-w-sm">Book a repair to get started.</p>
          <Link href="/book"><Button className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold px-6">Book a Repair</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {repairs.map((r, idx) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="bg-white border border-[#E8E4DF] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-[#1A1A1A] font-semibold text-lg">{r.manual_model || (r.device ? `${r.device.brand} ${r.device.model_name}` : 'Unknown')}</h3>
                  <p className="text-[#1A1A1A]/60 text-sm mt-0.5">{r.repair_type?.replace(/_/g, ' ') || r.issue_description}</p>
                </div>
                <Badge className="bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20 shrink-0 self-start">{REPAIR_STATUS_LABELS[r.status]}</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-[#1A1A1A]/60 mb-3">
                {r.estimated_cost != null && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />Est. {r.estimated_cost.toLocaleString('en-IN')}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleExpand(r.id)} className="text-[#FF5C00] text-sm font-medium flex items-center gap-1 hover:underline">
                  {expandedId === r.id ? <><ChevronUp className="w-4 h-4" />Hide Timeline</> : <><ChevronDown className="w-4 h-4" />Show Timeline</>}
                </button>
                {confirmedRcaIds.has(r.id) && (
                  <button onClick={() => handleViewRca(r.id)} className="text-[#1A1A1A]/60 text-sm font-medium flex items-center gap-1 hover:text-[#1A1A1A]"><ClipboardCheck className="w-4 h-4" />View RCA</button>
                )}
              </div>

              {expandedId === r.id && timelines[r.id] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-[#E8E4DF]">
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
