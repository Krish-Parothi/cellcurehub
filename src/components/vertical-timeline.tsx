'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { RepairStatus, RepairTimelineEntry } from '@/lib/types';
import { Hash, Truck, Package, Wrench, CircleCheck as CheckCircle, Clock, ShieldCheck, Send, AlertCircle } from 'lucide-react';

interface VerticalTimelineProps {
  entries: RepairTimelineEntry[];
  currentStatus: RepairStatus;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  booked: Hash, pickup_scheduled: Send, device_received: Package,
  diagnostic: AlertCircle, repair_in_progress: Wrench, qa_testing: ShieldCheck,
  ready: CheckCircle, out_for_delivery: Truck, delivered: CheckCircle, cancelled: AlertCircle,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VerticalTimeline({ entries, currentStatus }: VerticalTimelineProps) {
  const currentIndex = REPAIR_STATUS_ORDER.indexOf(currentStatus);
  const entryMap = new Map<string, RepairTimelineEntry>();
  entries.forEach((e) => {
    if (!entryMap.has(e.status) || new Date(e.created_at) > new Date(entryMap.get(e.status)!.created_at)) {
      entryMap.set(e.status, e);
    }
  });

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-[#FF5C00]/50 via-[#FF5C00]/20 to-gray-200/10" />
      {REPAIR_STATUS_ORDER.map((status, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;
        const entry = entryMap.get(status);
        const StatusIcon = STATUS_ICONS[status] || Clock;
        return (
          <motion.div key={status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className={cn('relative flex gap-4 py-3', isFuture && 'opacity-40')}>
            <div className="relative z-10 flex-shrink-0">
              <motion.div initial={false} animate={{ scale: isCurrent ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={cn('flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 transition-all duration-500', isPast && 'bg-[#FF5C00] border-[#FF5C00]', isCurrent && 'bg-white border-[#FF5C00]', isFuture && 'bg-white border-zinc-200')}>
                {isPast ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <StatusIcon className={cn('w-3.5 h-3.5', isCurrent ? 'text-[#FF5C00]' : 'text-zinc-400')} />}
                {isCurrent && (<><motion.div className="absolute inset-0 rounded-full border-2 border-[#FF5C00]" animate={{ boxShadow: ['0 0 0px 0 rgba(255,92,0,0.4)', '0 0 12px 4px rgba(255,92,0,0.3)', '0 0 0px 0 rgba(255,92,0,0.4)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} /><motion.div className="absolute inset-0 rounded-full bg-[#FF5C00]/20" animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} /></>)}
              </motion.div>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-sm font-semibold', isPast && 'text-[#FF5C00]', isCurrent && 'text-[#1A1A1A] font-bold', isFuture && 'text-zinc-400')}>{REPAIR_STATUS_LABELS[status]}</span>
                {isCurrent && <span className="text-[10px] font-medium text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded-full">Current</span>}
              </div>
              {entry?.note && (isPast || isCurrent) && <p className="mt-1 text-sm text-[#1A1A1A]/60 leading-relaxed">{entry.note}</p>}
              {entry?.photo_url && (isPast || isCurrent) && <a href={entry.photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-xs text-[#FF5C00] hover:underline font-medium font-medium">📷 View photo</a>}
              {entry && (isPast || isCurrent) && <p className="mt-1 text-xs text-[#1A1A1A]/40">{formatDate(entry.created_at)}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
