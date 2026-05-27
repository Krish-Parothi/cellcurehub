'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ClipboardCheck, FileText, Camera } from 'lucide-react';
import type { RcaReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border border-white/10 rounded-2xl z-50 print:static print:inset-0 print:translate-x-0 print:translate-y-0 print:max-w-none print:max-h-none print:border-0 print:rounded-none">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00D084]/10 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-[#00D084]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">RCA Report</h2>
                    <p className="text-xs text-white/40">Root Cause Analysis</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white print:hidden"><X className="w-5 h-5" /></button>
              </div>

              {/* Diagnostic Checklist */}
              {checklistEntries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#00D084]" /> Diagnostic Checklist</h3>
                  <div className="space-y-2">
                    {checklistEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${value === true || value === 'pass' ? 'bg-[#00D084]/20 text-[#00D084]' : 'bg-red-500/20 text-red-400'}`}>
                          {value === true || value === 'pass' ? '✓' : '✗'}
                        </div>
                        <span className="text-sm text-white/70 capitalize">{key.replace(/_/g, ' ')}</span>
                        {typeof value === 'string' && value !== 'pass' && value !== 'fail' && (
                          <Badge variant="outline" className="ml-auto text-xs bg-white/5 border-white/10 text-white/50">{value}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Notes */}
              {report.technician_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Technician Notes</h3>
                  <p className="text-sm text-white/60 leading-relaxed bg-white/5 rounded-xl p-4 border border-white/5">{report.technician_notes}</p>
                </div>
              )}

              {/* Before Photos */}
              {report.before_photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[#00D084]" /> Before Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {report.before_photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group block">
                        <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* After Photos */}
              {report.after_photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[#00D084]" /> After Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {report.after_photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group block">
                        <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {report.admin_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Admin Notes</h3>
                  <p className="text-sm text-white/60 bg-white/5 rounded-xl p-4 border border-white/5">{report.admin_notes}</p>
                </div>
              )}

              {/* Download Button */}
              <div className="print:hidden">
                <Button onClick={handleDownloadPDF} className="w-full gradient-green text-[#0A0A0A] font-semibold">
                  <Download className="w-4 h-4 mr-2" /> Download RCA as PDF
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
