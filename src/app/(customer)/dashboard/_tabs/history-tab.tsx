'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Repair, Review, RcaReport } from '@/lib/types';
import RcaModal from '@/components/rca-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CircleCheck as CheckCircle, Star, Clock, IndianRupee, Calendar, ClipboardCheck, Download, History } from 'lucide-react';

function getWarrantyInfo(deliveredAt: string | null) {
  if (!deliveredAt) return { expired: true, days: 0, text: 'No delivery date', color: 'text-white/30' };
  const expiry = new Date(new Date(deliveredAt).getTime() + 90 * 24 * 60 * 60 * 1000);
  const diff = expiry.getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, text: 'Warranty expired', color: 'text-white/30' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const color = days > 30 ? 'text-[#00D084]' : days > 10 ? 'text-amber-400' : 'text-red-400';
  return { expired: false, days, text: `${days} day${days !== 1 ? 's' : ''} remaining`, color };
}

export default function HistoryTab({ userId }: { userId: string }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState(true);
  const [rcaReport, setRcaReport] = useState<RcaReport | null>(null);
  const [rcaOpen, setRcaOpen] = useState(false);
  const [confirmedRcaIds, setConfirmedRcaIds] = useState<Set<string>>(new Set());
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRepairId, setReviewRepairId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: repairData } = await supabase.from('repairs').select('*, device:devices(*)').eq('customer_id', userId).in('status', ['delivered', 'done']).order('created_at', { ascending: false });
    const reps = (repairData as Repair[]) || [];
    setRepairs(reps);
    if (reps.length > 0) {
      const { data: revData } = await supabase.from('reviews').select('*').eq('customer_id', userId).in('repair_id', reps.map(r => r.id));
      const revMap: Record<string, Review> = {};
      ((revData as Review[]) || []).forEach(r => { revMap[r.repair_id] = r; });
      setReviews(revMap);
      // Fetch confirmed RCAs
      const { data: rcas } = await supabase.from('rca_reports').select('repair_id').eq('admin_confirmed', true).in('repair_id', reps.map(r => r.id));
      console.debug('[HISTORY_TAB_RCAS]', rcas);
      setConfirmedRcaIds(new Set((rcas || []).map((r: any) => r.repair_id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewRca = async (repairId: string) => {
    console.debug('[CUSTOMER_VIEW_RCA_HISTORY]', { repairId, userId });
    const { data, error } = await supabase.from('rca_reports').select('*').eq('repair_id', repairId).eq('admin_confirmed', true).maybeSingle();
    console.debug('[CUSTOMER_VIEW_RCA_HISTORY_RESULT]', { data, error });
    if (error) { toast.error('Could not load RCA: ' + error.message); return; }
    if (data) { setRcaReport(data as RcaReport); setRcaOpen(true); }
    else toast.error('No confirmed RCA report found');
  };

  const handleSubmitReview = async () => {
    if (!reviewRepairId) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ repair_id: reviewRepairId, customer_id: userId, rating: reviewRating, comment: reviewComment.trim() || null });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Review submitted!');
    setReviewOpen(false);
    fetchData();
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 rounded-2xl bg-white/5" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">Repair History</h1>
      {repairs.length === 0 ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center text-center">
          <History className="w-10 h-10 text-white/20 mb-3" />
          <h3 className="text-xl font-semibold text-white mb-2">No repair history yet</h3>
          <p className="text-white/50 text-sm">Completed repairs will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {repairs.map((r, idx) => {
            const warranty = getWarrantyInfo(r.delivered_at);
            const review = reviews[r.id];
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="glass glass-hover rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{r.device ? `${r.device.brand} ${r.device.model_name}` : r.manual_model || 'Unknown'}</h3>
                    <p className="text-white/50 text-sm mt-0.5">{r.repair_type?.replace(/_/g, ' ') || r.issue_description}</p>
                  </div>
                  <Badge className="bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/25 shrink-0"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="glass rounded-xl p-3"><p className="text-white/40 text-xs flex items-center gap-1"><IndianRupee className="w-3 h-3" />Final Cost</p><p className="text-white font-semibold text-sm">{r.final_cost != null ? `₹${r.final_cost.toLocaleString('en-IN')}` : 'N/A'}</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-white/40 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Delivered</p><p className="text-white/70 text-sm">{r.delivered_at ? new Date(r.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-white/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Warranty</p><p className={`text-sm font-medium ${warranty.color}`}>{warranty.text}</p></div>
                </div>

                {/* Review */}
                {review ? (
                  <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-[#00D084] fill-[#00D084]' : 'text-white/20'}`} />)}</div>
                    {review.comment && <p className="text-white/50 text-sm ml-2 truncate">{review.comment}</p>}
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setReviewRepairId(r.id); setReviewRating(5); setReviewComment(''); setReviewOpen(true); }} className="border-[#00D084]/30 text-[#00D084] hover:bg-[#00D084]/10 mb-3"><Star className="w-3.5 h-3.5 mr-1.5" />Leave Review</Button>
                )}

                {confirmedRcaIds.has(r.id) && (
                  <button onClick={() => handleViewRca(r.id)} className="text-white/50 text-sm font-medium flex items-center gap-1 hover:text-white"><ClipboardCheck className="w-4 h-4" />View RCA</button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Leave a Review</DialogTitle>
            <DialogDescription className="text-white/50">Share your experience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/70">Rating</Label>
              <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <button key={i} onClick={() => setReviewRating(i + 1)} className="p-0.5 hover:scale-110 transition-transform"><Star className={`w-7 h-7 ${i < reviewRating ? 'text-[#00D084] fill-[#00D084]' : 'text-white/20'}`} /></button>)}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Comment (optional)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience?" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)} className="border-white/10 text-white/60">Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={submitting} className="gradient-green text-[#0A0A0A] font-semibold">{submitting ? 'Submitting...' : 'Submit Review'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RcaModal report={rcaReport} open={rcaOpen} onClose={() => setRcaOpen(false)} />
    </motion.div>
  );
}
