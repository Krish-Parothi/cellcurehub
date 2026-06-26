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
import type { RcaReport, RepairStatus } from '@/lib/types';
import { Camera, Mic, MicOff, Plus, Search, Timer, Smartphone, CheckCircle, AlertTriangle, Package, Loader2, IndianRupee, Sparkles } from 'lucide-react';
import { submitRcaReport, markRepairComplete } from '@/lib/actions/technician';
import { enhanceTechnicianNotes } from '@/lib/actions/ai';
import { updateRepairStatus } from '@/lib/actions/repairs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { compressImage } from '@/lib/compress-image';

// Types passed from parent
type RepairWithJoins = any; // Will use the one from page.tsx

interface JobDetailSheetProps {
  repair: RepairWithJoins | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (repairId: string, newStatus: string) => void;
  fetchRepairs: () => void;
}

const rcaSchema = z.object({
  technician_notes: z.string().min(5, 'Notes required'),
});

export default function JobDetailSheet({ repair, open, onOpenChange, onStatusUpdate, fetchRepairs }: JobDetailSheetProps) {
  const { user } = useAuth();
  


  // Section D - RCA
  const [rcaReport, setRcaReport] = useState<RcaReport | null>(null);
  const [rcaLoading, setRcaLoading] = useState(false);
  const [diagnosticChecks, setDiagnosticChecks] = useState<Record<string, boolean>>({});
  const [prePhotos, setPrePhotos] = useState<File[]>([]);
  const [postPhotos, setPostPhotos] = useState<File[]>([]);
  const [submittingRca, setSubmittingRca] = useState(false);
  const [enhancingAi, setEnhancingAi] = useState(false);
  const rcaForm = useForm({ resolver: zodResolver(rcaSchema), defaultValues: { technician_notes: '' } });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const originalNotesRef = useRef('');
  // Section E - QA
  const [qaChecks, setQaChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (repair && open) {
      loadRcaReport();
      setDiagnosticChecks({}); setQaChecks({}); setPrePhotos([]); setPostPhotos([]);
      rcaForm.reset();
    }
  }, [repair, open]);

  const loadRcaReport = async () => {
    if (!repair) return;
    setRcaLoading(true);
    const { data } = await supabase.from('rca_reports').select('*').eq('repair_id', repair.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setRcaReport((data as RcaReport) || null);
    
    if (data && repair.status === 'diagnostic') {
      if (data.technician_notes) {
        rcaForm.setValue('technician_notes', data.technician_notes);
      }
      if (data.diagnostic_checklist) {
        setDiagnosticChecks(data.diagnostic_checklist);
      }
    }
    setRcaLoading(false);
  };




  // --- RCA Logic ---
  const toggleSpeech = () => {
    if (isRecording) {
      manualStopRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser'); return; }
    
    manualStopRef.current = false;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // For Hinglish
    
    recognition.onstart = () => { 
      setIsRecording(true); 
      originalNotesRef.current = rcaForm.getValues('technician_notes') || '';
      toast.success('Listening... click stop when done.'); 
    };
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        originalNotesRef.current = originalNotesRef.current ? `${originalNotesRef.current} ${finalTranscript}` : finalTranscript;
      }
      
      const displayTranscript = originalNotesRef.current 
        ? `${originalNotesRef.current} ${interimTranscript}` 
        : interimTranscript;
        
      rcaForm.setValue('technician_notes', displayTranscript.trim());
    };
    recognition.onerror = (e: any) => { 
      if (e.error !== 'no-speech') {
        setIsRecording(false); 
        toast.error('Speech recognition failed'); 
      }
    };
    recognition.onend = () => { 
      if (!manualStopRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsRecording(false);
        }
      } else {
        setIsRecording(false); 
      }
    };
    
    recognition.start();
  };

  const enhanceWithAi = async () => {
    const currentNotes = rcaForm.getValues('technician_notes');
    if (!currentNotes || currentNotes.trim().length < 5) {
      toast.error('Please write some notes first before enhancing');
      return;
    }
    setEnhancingAi(true);
    const result = await enhanceTechnicianNotes(currentNotes);
    if (result.success && result.text) {
      rcaForm.setValue('technician_notes', result.text);
      toast.success('Notes enhanced with AI!');
    } else {
      toast.error(result.error || 'Failed to enhance notes');
    }
    setEnhancingAi(false);
  };

  const submitRca = async (data: any) => {
    if (!repair || !user) return;
    const checkedCount = Object.values(diagnosticChecks).filter(Boolean).length;
    if (checkedCount < 3) { toast.error('Check at least 3 diagnostic items'); return; }

    setSubmittingRca(true);
    try {
      const uploadPhotos = async (files: File[], folder: string) => {
        if (files.length === 0) return [];
        const formData = new FormData();
        formData.append('folder', `${folder}/${repair.id}`);
        
        for (const file of files) {
          const compressed = await compressImage(file);
          formData.append('file', compressed);
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload photos');
        const uploadData = await uploadRes.json();
        return uploadData.urls;
      };

      const preUrls = await uploadPhotos(prePhotos, 'pre');
      const postUrls = await uploadPhotos(postPhotos, 'post');

      const result = await submitRcaReport({
        repairId: repair.id,
        diagnosticChecklist: diagnosticChecks,
        technicianNotes: data.technician_notes,
        beforePhotos: preUrls,
        afterPhotos: postUrls,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('RCA Report submitted');
      loadRcaReport();
    } catch (e) { 
      toast.error(e instanceof Error ? e.message : 'Failed to submit RCA'); 
    }
    setSubmittingRca(false);
  };

  // --- QA Logic ---
  const handleMarkDone = async () => {
    if (!repair || !rcaReport) return;
    
    const requiredQa = QA_CHECKLIST_ITEMS.filter(i => !(i as any).appleOnly || repair.device?.brand === 'Apple');
    const allChecked = requiredQa.every(i => qaChecks[i.key]);
    
    if (!allChecked) { toast.error('All QA items must be checked'); return; }
    
    console.debug('[TECH:MARK_DONE]', { repairId: repair.id });
    const result = await markRepairComplete(repair.id);
    
    if (!result.success) {
      console.error('[TECH:MARK_DONE_ERROR]', result.error);
      toast.error(result.error || 'Failed to mark as done');
      return;
    }
    
    console.debug('[TECH:MARK_DONE_OK]');
    toast.success('Job marked as done. Awaiting admin to send for delivery.');
    fetchRepairs();
    onOpenChange(false);
  };

  if (!repair) return null;

  const disableStatusChange = repair.status === 'done';

  const nextStatus = repair.status === 'booked' || repair.status === 'pickup_scheduled' ? 'device_received'
                   : repair.status === 'device_received' || repair.status === 'dropped_at_store' ? 'diagnostic'
                   : repair.status === 'diagnostic' || repair.status === 'wocr' || repair.status === 'pending_approval' ? 'repair_in_progress' 
                   : repair.status === 'repair_in_progress' ? 'qa_testing' : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full bg-white border-l border-[#E8E4DF] overflow-y-auto text-[#1A1A1A]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FF5C00]" />
            {repair.device ? `${repair.device.brand} ${repair.device.model_name}` : repair.manual_model}
          </SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/60">Repair #{repair.id.split('-')[0]}</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pb-12">
          {/* SECTION A: Job Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A]/80">Job Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg">
                <span className="text-[#1A1A1A]/40 text-xs block mb-1">Customer</span>
                <p className="text-[#1A1A1A] font-semibold">{repair.customer?.full_name}</p>
                <p className="text-[#1A1A1A]/60">{repair.customer?.phone}</p>
                {repair.contact_email && <p className="text-[#1A1A1A]/60 text-xs mt-1">{repair.contact_email}</p>}
              </div>
              <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg">
                <span className="text-[#1A1A1A]/40 text-xs block mb-1">Status</span>
                <div>
                  <Badge className="bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20 font-semibold">{REPAIR_STATUS_LABELS[repair.status as RepairStatus]}</Badge>
                </div>
              </div>
              <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg col-span-2">
                <span className="text-[#1A1A1A]/40 text-xs block mb-1">Issue / Repair Type</span>
                <p className="text-[#1A1A1A] font-semibold">{repair.repair_type === 'custom' ? repair.custom_repair_description : repair.repair_type?.replace(/_/g, ' ')}</p>
                {repair.issue_description && <p className="text-[#1A1A1A]/60 mt-1">{repair.issue_description}</p>}
              </div>
              <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg">
                <span className="text-[#1A1A1A]/40 text-xs block mb-1">IMEI</span>
                <p className="text-[#1A1A1A] font-mono font-semibold">{repair.imei_number}</p>
              </div>
              <div className="bg-[#F7F7F5] border border-[#E8E4DF] p-3 rounded-lg">
                <span className="text-[#1A1A1A]/40 text-xs block mb-1">Pickup</span>
                <p className="text-[#1A1A1A] font-semibold capitalize">{repair.pickup_type}</p>
              </div>
            </div>
          </section>

          <Separator className="bg-[#E8E4DF]" />

          {/* SECTION D: RCA Report */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A]/80 flex items-center gap-2"><Search className="w-4 h-4 text-[#FF5C00]"/> RCA Report</h3>
            
            {rcaLoading ? <Skeleton className="h-20 bg-[#1A1A1A]/5" /> : (rcaReport && repair.status !== 'diagnostic') ? (
              <div className="bg-[#F7F7F5] p-4 rounded-lg border border-[#E8E4DF]">
                <p className="text-emerald-600 font-semibold text-sm mb-2">{rcaReport.admin_confirmed ? 'RCA Confirmed by Admin' : 'RCA submitted — awaiting admin confirmation'}</p>
                <p className="text-[#1A1A1A]/60 text-xs mb-2">Technician Notes:</p>
                <p className="text-[#1A1A1A] text-sm font-medium">{rcaReport.technician_notes}</p>
              </div>
            ) : (
              !disableStatusChange && (
                <div className="space-y-4">
                  {rcaReport?.admin_notes && repair.status === 'diagnostic' && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-red-800 font-bold text-sm mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> RCA Revision Requested</p>
                      <p className="text-red-700 text-xs">Admin Note: {rcaReport.admin_notes}</p>
                    </div>
                  )}
                  <form onSubmit={rcaForm.handleSubmit(submitRca)} className="space-y-4">
                  <div className="bg-[#F7F7F5] p-4 rounded-lg border border-[#E8E4DF]">
                    <Label className="text-[#1A1A1A]/80 mb-2 block">Diagnostic Checklist (Min 3)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {DIAGNOSTIC_CHECKLIST_ITEMS.map(item => (
                        <label key={item.key} className="flex items-center gap-2 text-xs text-[#1A1A1A]/70 cursor-pointer">
                          <input type="checkbox" checked={!!diagnosticChecks[item.key]} onChange={e => setDiagnosticChecks(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded bg-white border-[#E8E4DF] text-[#FF5C00] focus:ring-[#FF5C00]" />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#1A1A1A]/80 text-xs block mb-1">Pre-Repair Photos *</Label>
                      <Input type="file" accept="image/*" multiple capture="environment" onChange={e => setPrePhotos(Array.from(e.target.files || []))} className="bg-white border-[#E8E4DF] text-[#1A1A1A] text-xs file:bg-[#F7F7F5] file:text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/80 text-xs block mb-1">Post-Repair Photos</Label>
                      <Input type="file" accept="image/*" multiple capture="environment" onChange={e => setPostPhotos(Array.from(e.target.files || []))} className="bg-white border-[#E8E4DF] text-[#1A1A1A] text-xs file:bg-[#F7F7F5] file:text-[#1A1A1A]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-[#1A1A1A]/80 text-xs">Technician Notes *</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={enhanceWithAi} disabled={enhancingAi} className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-600/10 px-2 font-semibold">
                          {enhancingAi ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} AI Enhance
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={toggleSpeech} className="h-6 text-xs text-[#FF5C00] hover:text-[#e05200] hover:bg-[#FF5C00]/10 px-2 font-semibold">
                          {isRecording ? <MicOff className="w-3 h-3 mr-1 animate-pulse text-red-500" /> : <Mic className="w-3 h-3 mr-1" />} 
                          {isRecording ? 'Stop' : 'Dictate'}
                        </Button>
                      </div>
                    </div>
                    <Textarea {...rcaForm.register('technician_notes')} className="bg-white border-[#E8E4DF] text-[#1A1A1A] min-h-[80px]" placeholder="Add your diagnostic notes here..." />
                  </div>
                  
                  <Button type="submit" disabled={submittingRca} className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
                    {submittingRca ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit RCA Report
                  </Button>
                </form>
                </div>
              )
            )}
          </section>

          {/* SECTION E: QA Testing */}
          {repair.status === 'qa_testing' && (
            <>
              <Separator className="bg-[#E8E4DF]" />
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1A1A1A]/80 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#FF5C00]"/> QA Checklist</h3>
                <div className="bg-[#F7F7F5] p-4 rounded-lg border border-[#E8E4DF] space-y-2">
                  {QA_CHECKLIST_ITEMS.filter(i => !(i as any).appleOnly || repair.device?.brand === 'Apple').map(item => (
                    <label key={item.key} className="flex items-center gap-2 text-xs text-[#1A1A1A]/70 cursor-pointer">
                      <input type="checkbox" checked={!!qaChecks[item.key]} onChange={e => setQaChecks(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded bg-white border-[#E8E4DF] text-[#FF5C00] focus:ring-[#FF5C00]" />
                      {item.label}
                    </label>
                  ))}
                </div>
                <Button onClick={handleMarkDone} disabled={!rcaReport} className="w-full bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Done
                </Button>
                {!rcaReport && <p className="text-xs text-amber-600 font-semibold text-center mt-1">RCA Report must be submitted first</p>}
              </section>
            </>
          )}

          {/* Status Transitions */}
          {nextStatus && repair.status !== 'qa_testing' && !disableStatusChange && (
            <>
              <Separator className="bg-[#E8E4DF]" />
              <div className="pt-2 flex justify-end">
                <Button onClick={() => { console.debug('[TECH_MOVE_STATUS]', { repairId: repair.id, from: repair.status, to: nextStatus }); onStatusUpdate(repair.id, nextStatus); }} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
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
