'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ClipboardCheck, FileText, Camera } from 'lucide-react';
import type { RcaReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RcaModalProps {
  report: RcaReport | null;
  open: boolean;
  onClose: () => void;
}

export default function RcaModal({ report, open, onClose }: RcaModalProps) {
  if (!report) return null;

  const checklist = report.diagnostic_checklist || {};
  const checklistEntries = Object.entries(checklist);

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-[#E8E4DF] text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#1A1A1A]">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5 text-[#FF5C00]" />
            </div>
            <div>
              <span className="text-lg font-bold">RCA Report</span>
              <p className="text-xs text-[#1A1A1A]/40 font-normal">Root Cause Analysis</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Diagnostic Checklist */}
          {checklistEntries.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#FF5C00]" /> Diagnostic Checklist</h3>
              <div className="space-y-2">
                {checklistEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E4DF]">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${value === true || value === 'pass' ? 'bg-[#FF5C00]/20 text-[#FF5C00]' : 'bg-red-500/20 text-red-500'}`}>
                      {value === true || value === 'pass' ? '✓' : '✗'}
                    </div>
                    <span className="text-sm text-[#1A1A1A]/70 capitalize">{key.replace(/_/g, ' ')}</span>
                    {typeof value === 'string' && value !== 'pass' && value !== 'fail' && (
                      <Badge variant="outline" className="ml-auto text-xs bg-white border-[#E8E4DF] text-[#1A1A1A]/60">{value}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Notes */}
          {report.technician_notes && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Technician Notes</h3>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed bg-[#F7F7F5] rounded-xl p-4 border border-[#E8E4DF]">{report.technician_notes}</p>
            </div>
          )}

          {/* Before Photos */}
          {report.before_photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[#FF5C00]" /> Before Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.before_photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-[#E8E4DF] relative group block">
                    <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* After Photos */}
          {report.after_photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[#FF5C00]" /> After Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.after_photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-[#E8E4DF] relative group block">
                    <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Admin Notes</h3>
              <p className="text-sm text-[#1A1A1A]/60 bg-[#F7F7F5] rounded-xl p-4 border border-[#E8E4DF]">{report.admin_notes}</p>
            </div>
          )}

          {/* Download Button */}
          <Button onClick={handleDownloadPDF} className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold print:hidden">
            <Download className="w-4 h-4 mr-2" /> Download RCA as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
