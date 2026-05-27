'use client';

import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { DIAGNOSTIC_CHECKLIST_ITEMS, QA_CHECKLIST_ITEMS, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { Part, PartUsed, RcaReport, RepairStatus } from '@/lib/types';
import { Camera, Mic, Plus, Search, Timer, Smartphone, CheckCircle, AlertTriangle, Package, Loader2, IndianRupee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types passed from parent
type RepairWithJoins = any; // Will use the one from page.tsx

interface JobDetailSheetProps {
  repair: RepairWithJoins | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (repairId: string, newStatus: string) => void;
  fetchRepairs: () => void;
}

const approvalSchema = z.object({
  revised_estimate: z.number().positive('Must be positive'),
  note: z.string().min(5, 'Note required'),
});

const rcaSchema = z.object({
  technician_notes: z.string().min(5, 'Notes required'),
});

export default function JobDetailSheet({ repair, open, onOpenChange, onStatusUpdate, fetchRepairs }: JobDetailSheetProps) {
  const { user } = useAuth();
  
  // Section B - Parts
  const [partSearch, setPartSearch] = useState('');
  const [partResults, setPartResults] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partQty, setPartQty] = useState(1);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  // Section C - Approval
  const [approvalPhoto, setApprovalPhoto] = useState<File | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const approvalForm = useForm({ resolver: zodResolver(approvalSchema), defaultValues: { revised_estimate: 0, note: '' } });

  // Section D - RCA
  const [rcaReport, setRcaReport] = useState<RcaReport | null>(null);
  const [rcaLoading, setRcaLoading] = useState(false);
  const [diagnosticChecks, setDiagnosticChecks] = useState<Record<string, boolean>>({});
  const [prePhotos, setPrePhotos] = useState<File[]>([]);
  const [postPhotos, setPostPhotos] = useState<File[]>([]);
  const [submittingRca, setSubmittingRca] = useState(false);
  const rcaForm = useForm({ resolver: zodResolver(rcaSchema), defaultValues: { technician_notes: '' } });
  const isRecording = useRef(false);

  // Section E - QA
  const [qaChecks, setQaChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (repair && open) {
      loadPartsUsed();
      loadRcaReport();
      setPartSearch(''); setSelectedPart(null); setPartQty(1);
      setDiagnosticChecks({}); setQaChecks({}); setPrePhotos([]); setPostPhotos([]);
      approvalForm.reset(); rcaForm.reset();
    }
  }, [repair, open]);

  const loadPartsUsed = async () => {
    if (!repair) return;
    setPartsLoading(true);
    const { data } = await supabase.from('parts_used').select('*, part:parts(*)').eq('repair_id', repair.id);
    setPartsUsed((data as PartUsed[]) || []);
    setPartsLoading(false);
  };

  const loadRcaReport = async () => {
    if (!repair) return;
    setRcaLoading(true);
    const { data } = await supabase.from('rca_reports').select('*').eq('repair_id', repair.id).maybeSingle();
    setRcaReport((data as RcaReport) || null);
    setRcaLoading(false);
  };

  // --- Parts Logic ---
  const searchParts = async (query: string) => {
    setPartSearch(query);
    if (query.length < 2) { setPartResults([]); return; }
    const { data } = await supabase.from('parts').select('*').eq('shop_id', repair?.shop_id).ilike('name', `%${query}%`).limit(10);
    setPartResults((data as Part[]) || []);
  };

  const addPart = async () => {
    if (!repair || !selectedPart) return;
    if (partQty > selectedPart.quantity_in_stock) { toast.error('Not enough stock'); return; }
    
    const { error: insertError } = await supabase.from('parts_used').insert({
      repair_id: repair.id,
      part_id: selectedPart.id,
      quantity: partQty,
      cost_at_time: selectedPart.cost_price, // Use cost_price
    });
    
    if (insertError) { toast.error('Failed to add part'); return; }
    
    await supabase.from('parts').update({ quantity_in_stock: selectedPart.quantity_in_stock - partQty }).eq('id', selectedPart.id);
    
    toast.success('Part added');
    setPartSearch(''); setSelectedPart(null); setPartQty(1); setPartResults([]);
    loadPartsUsed();
  };

  // --- Approval Logic ---
  const submitApproval = async (data: any) => {
    if (!repair || !approvalPhoto) { toast.error('Photo is required'); return; }
    setSubmittingApproval(true);
    try {
      const path = `repair-photos/${repair.id}/approval/${Date.now()}_${approvalPhoto.name}`;
      await supabase.storage.from('repair-photos').upload(path, approvalPhoto);
      const { data: { publicUrl } } = supabase.storage.from('repair-photos').getPublicUrl(path);

      const noteJson = JSON.stringify({ revised_estimate: data.revised_estimate, note: data.note });
      
      await supabase.from('repairs').update({
        status: 'pending_approval',
        approval_status: 'pending',
        approval_photo_url: publicUrl,
        approval_note: noteJson
      }).eq('id', repair.id);

      await supabase.from('repair_timeline').insert({
        repair_id: repair.id, status: 'pending_approval', note: 'Awaiting customer approval for revised quote', updated_by: user?.id
      });
      
      toast.success('Approval requested');
      fetchRepairs();
      onOpenChange(false);
    } catch (e) { toast.error('Error requesting approval'); }
    setSubmittingApproval(false);
  };

  // --- RCA Logic ---
  const toggleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser'); return; }
    
    if (isRecording.current) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => { isRecording.current = true; toast.success('Listening...'); };
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const current = rcaForm.getValues('technician_notes');
      rcaForm.setValue('technician_notes', current ? `${current} ${text}` : text);
    };
    recognition.onerror = () => { isRecording.current = false; toast.error('Speech recognition failed'); };
    recognition.onend = () => { isRecording.current = false; };
    
    recognition.start();
  };

  const submitRca = async (data: any) => {
    if (!repair || !user) return;
    const checkedCount = Object.values(diagnosticChecks).filter(Boolean).length;
    if (checkedCount < 3) { toast.error('Check at least 3 diagnostic items'); return; }
    if (prePhotos.length < 1) { toast.error('At least 1 pre-repair photo required'); return; }
    if (['repair_in_progress', 'qa_testing', 'ready', 'done'].includes(repair.status) && postPhotos.length < 1) {
      toast.error('At least 1 post-repair photo required for current status'); return;
    }

    setSubmittingRca(true);
    try {
      const uploadPhotos = async (files: File[], folder: string) => {
        const urls = [];
        for (const file of files) {
          const path = `repair-photos/${repair.id}/${folder}/${Date.now()}_${file.name}`;
          await supabase.storage.from('repair-photos').upload(path, file);
          const { data: { publicUrl } } = supabase.storage.from('repair-photos').getPublicUrl(path);
          urls.push(publicUrl);
        }
        return urls;
      };

      const preUrls = await uploadPhotos(prePhotos, 'pre');
      const postUrls = await uploadPhotos(postPhotos, 'post');

      await supabase.from('rca_reports').insert({
        repair_id: repair.id,
        technician_id: user.id,
        diagnostic_checklist: diagnosticChecks,
        technician_notes: data.technician_notes,
        before_photos: preUrls,
        after_photos: postUrls,
        admin_confirmed: false
      });

      await supabase.from('repair_timeline').insert({
        repair_id: repair.id, status: repair.status, note: 'RCA submitted — pending admin review', updated_by: user.id
      });

      toast.success('RCA Report submitted');
      loadRcaReport();
    } catch (e) { toast.error('Failed to submit RCA'); }
    setSubmittingRca(false);
  };

  // --- QA Logic ---
  const handleMarkDone = async () => {
    if (!repair || !rcaReport) return;
    
    const requiredQa = QA_CHECKLIST_ITEMS.filter(i => !(i as any).appleOnly || repair.device?.brand === 'Apple');
    const allChecked = requiredQa.every(i => qaChecks[i.key]);
    
    if (!allChecked) { toast.error('All QA items must be checked'); return; }
    
    await supabase.from('repairs').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', repair.id);
    await supabase.from('repair_timeline').insert({
      repair_id: repair.id, status: 'done', note: 'QA passed — job complete. Awaiting admin dispatch.', updated_by: user?.id
    });
    
    toast.success('Job marked as done. Awaiting admin to send for delivery.');
    fetchRepairs();
    onOpenChange(false);
  };

  if (!repair) return null;

  const isPendingApproval = repair.approval_status === 'pending';
  const disableStatusChange = isPendingApproval || repair.status === 'done';

  const nextStatus = repair.status === 'booked' || repair.status === 'pickup_scheduled' ? 'device_received'
                   : repair.status === 'device_received' ? 'diagnostic'
                   : repair.status === 'diagnostic' ? 'repair_in_progress' 
                   : repair.status === 'repair_in_progress' ? 'qa_testing' : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full bg-[#0A0A0A] border-l border-white/10 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#00D084]" />
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </SheetTitle>
          <SheetDescription className="text-white/50">Repair #{repair.id.split('-')[0]}</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pb-12">
          {/* SECTION A: Job Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80">Job Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">Customer</span>
                <p className="text-white">{repair.customer?.full_name}</p>
                <p className="text-white/60">{repair.customer?.phone}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">Status</span>
                <Badge className="bg-[#00D084]/20 text-[#00D084]">{REPAIR_STATUS_LABELS[repair.status as RepairStatus]}</Badge>
              </div>
              <div className="bg-white/5 p-3 rounded-lg col-span-2">
                <span className="text-white/40 text-xs block mb-1">Issue / Repair Type</span>
                <p className="text-white">{repair.repair_type === 'custom' ? repair.custom_repair_description : repair.repair_type?.replace(/_/g, ' ')}</p>
                {repair.issue_description && <p className="text-white/60 mt-1">{repair.issue_description}</p>}
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">IMEI</span>
                <p className="text-white font-mono">{repair.imei_number}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">Pickup</span>
                <p className="text-white capitalize">{repair.pickup_type}</p>
              </div>
            </div>
          </section>

          <Separator className="bg-white/10" />

          {/* SECTION B: Parts Used */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2"><Package className="w-4 h-4 text-[#00D084]"/> Parts Used</h3>
            
            {partsLoading ? <Skeleton className="h-10 bg-white/5" /> : (
              partsUsed.length > 0 && (
                <div className="space-y-2">
                  {partsUsed.map(pu => (
                    <div key={pu.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                      <span className="text-white">{pu.part?.name} <span className="text-white/40">x{pu.quantity}</span></span>
                      <span className="text-[#00D084]">₹{(pu.quantity * pu.cost_at_time).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-2 text-sm font-bold border-t border-white/10 mt-2">
                    <span className="text-white">Total Parts Cost</span>
                    <span className="text-[#00D084]">₹{partsUsed.reduce((s, p) => s + (p.quantity * p.cost_at_time), 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            )}

            {!disableStatusChange && (
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Label className="text-xs text-white/60 mb-1 block">Search Part</Label>
                  <Search className="w-4 h-4 absolute left-3 top-7 text-white/40" />
                  <Input value={partSearch} onChange={e => searchParts(e.target.value)} placeholder="Type to search..." className="pl-9 bg-white/5 border-white/10 text-white" />
                  {partResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-1 z-50 shadow-xl max-h-40 overflow-y-auto">
                      {partResults.map(p => (
                        <div key={p.id} onClick={() => { setSelectedPart(p); setPartSearch(p.name); setPartResults([]); }} className="p-2 hover:bg-white/5 cursor-pointer rounded text-sm text-white">
                          {p.name} <span className="text-white/40 block text-xs">Stock: {p.quantity_in_stock} | Cost: ₹{p.cost_price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-20">
                  <Label className="text-xs text-white/60 mb-1 block">Qty</Label>
                  <Input type="number" min={1} value={partQty} onChange={e => setPartQty(Number(e.target.value))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <Button onClick={addPart} disabled={!selectedPart} className="bg-[#00D084] text-black hover:bg-[#00D084]/90"><Plus className="w-4 h-4" /></Button>
              </div>
            )}
          </section>

          <Separator className="bg-white/10" />

          {/* SECTION C: Approval Gateway */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/> Approval Gateway</h3>
            
            {repair.approval_status ? (
              <div className={`p-4 rounded-lg border ${repair.approval_status === 'pending' ? 'bg-amber-500/10 border-amber-500/20' : repair.approval_status === 'approved' ? 'bg-[#00D084]/10 border-[#00D084]/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className={`font-semibold ${repair.approval_status === 'pending' ? 'text-amber-500' : repair.approval_status === 'approved' ? 'text-[#00D084]' : 'text-red-500'}`}>
                  {repair.approval_status === 'pending' ? 'Waiting for customer...' : repair.approval_status === 'approved' ? 'Customer approved — you can continue' : 'Customer rejected — repair cancelled'}
                </p>
                {repair.approval_note && (
                  <p className="text-sm text-white/60 mt-2">Note: {JSON.parse(repair.approval_note).note}</p>
                )}
              </div>
            ) : (
              !disableStatusChange && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-xs text-white/60 mb-4">Request approval for additional damage not covered by original estimate.</p>
                  <form onSubmit={approvalForm.handleSubmit(submitApproval)} className="space-y-3">
                    <div>
                      <Label className="text-white/80 text-xs">Damage Photo *</Label>
                      <Input type="file" accept="image/*" onChange={e => setApprovalPhoto(e.target.files?.[0] || null)} className="bg-white/5 border-white/10 text-white mt-1 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white/80 text-xs">Original Est.</Label>
                        <Input readOnly value={`₹${repair.estimated_cost || 0}`} className="bg-white/10 border-transparent text-white/60 mt-1 cursor-not-allowed" />
                      </div>
                      <div>
                        <Label className="text-white/80 text-xs">Revised Est. *</Label>
                        <Input type="number" {...approvalForm.register('revised_estimate', { valueAsNumber: true })} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/80 text-xs">Note to Customer *</Label>
                      <Textarea {...approvalForm.register('note')} className="bg-white/5 border-white/10 text-white mt-1 min-h-[60px]" placeholder="Explain the additional damage..." />
                    </div>
                    <Button type="submit" disabled={submittingApproval} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium">
                      {submittingApproval ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />} Request Customer Approval
                    </Button>
                  </form>
                </div>
              )
            )}
          </section>

          <Separator className="bg-white/10" />

          {/* SECTION D: RCA Report */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2"><Search className="w-4 h-4 text-[#00D084]"/> RCA Report</h3>
            
            {rcaLoading ? <Skeleton className="h-20 bg-white/5" /> : rcaReport ? (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-[#00D084] font-semibold text-sm mb-2">{rcaReport.admin_confirmed ? 'RCA Confirmed by Admin' : 'RCA submitted — awaiting admin confirmation'}</p>
                <p className="text-white/60 text-xs mb-2">Technician Notes:</p>
                <p className="text-white text-sm">{rcaReport.technician_notes}</p>
              </div>
            ) : (
              !disableStatusChange && (
                <form onSubmit={rcaForm.handleSubmit(submitRca)} className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <Label className="text-white/80 mb-2 block">Diagnostic Checklist (Min 3)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {DIAGNOSTIC_CHECKLIST_ITEMS.map(item => (
                        <label key={item.key} className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                          <input type="checkbox" checked={!!diagnosticChecks[item.key]} onChange={e => setDiagnosticChecks(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded bg-white/10 border-white/20 text-[#00D084] focus:ring-[#00D084]" />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/80 text-xs block mb-1">Pre-Repair Photos *</Label>
                      <Input type="file" accept="image/*" multiple capture="environment" onChange={e => setPrePhotos(Array.from(e.target.files || []))} className="bg-white/5 border-white/10 text-white text-xs" />
                    </div>
                    <div>
                      <Label className="text-white/80 text-xs block mb-1">Post-Repair Photos</Label>
                      <Input type="file" accept="image/*" multiple capture="environment" onChange={e => setPostPhotos(Array.from(e.target.files || []))} className="bg-white/5 border-white/10 text-white text-xs" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white/80 text-xs">Technician Notes *</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={toggleSpeech} className="h-6 text-xs text-[#00D084] hover:text-[#00D084] hover:bg-white/5 px-2">
                        <Mic className="w-3 h-3 mr-1" /> Dictate
                      </Button>
                    </div>
                    <Textarea {...rcaForm.register('technician_notes')} className="bg-white/5 border-white/10 text-white min-h-[80px]" placeholder="Add your diagnostic notes here..." />
                  </div>
                  
                  <Button type="submit" disabled={submittingRca} className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black">
                    {submittingRca ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit RCA Report'}
                  </Button>
                </form>
              )
            )}
          </section>

          {/* SECTION E: QA Testing */}
          {repair.status === 'qa_testing' && (
            <>
              <Separator className="bg-white/10" />
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#00D084]"/> QA Checklist</h3>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2">
                  {QA_CHECKLIST_ITEMS.filter(i => !(i as any).appleOnly || repair.device?.brand === 'Apple').map(item => (
                    <label key={item.key} className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                      <input type="checkbox" checked={!!qaChecks[item.key]} onChange={e => setQaChecks(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded bg-white/10 border-white/20 text-[#00D084] focus:ring-[#00D084]" />
                      {item.label}
                    </label>
                  ))}
                </div>
                <Button onClick={handleMarkDone} disabled={!rcaReport} className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Done
                </Button>
                {!rcaReport && <p className="text-xs text-amber-500 text-center">RCA Report must be submitted first</p>}
              </section>
            </>
          )}

          {/* Status Transitions */}
          {nextStatus && repair.status !== 'qa_testing' && !disableStatusChange && (
            <>
              <Separator className="bg-white/10" />
              <div className="pt-2 flex justify-end">
                <Button onClick={() => { console.debug('[TECH_MOVE_STATUS]', { repairId: repair.id, from: repair.status, to: nextStatus }); onStatusUpdate(repair.id, nextStatus); }} className="bg-[#00D084] hover:bg-[#00D084]/90 text-black font-semibold">
                  Move to {REPAIR_STATUS_LABELS[nextStatus as RepairStatus]}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
