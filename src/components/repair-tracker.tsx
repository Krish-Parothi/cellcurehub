'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REPAIR_STATUS_ORDER, REPAIR_STATUS_LABELS } from '@/lib/types';
import type { RepairStatus } from '@/lib/types';

interface RepairTrackerProps {
  currentStatus: RepairStatus;
}

export default function RepairTracker({ currentStatus }: RepairTrackerProps) {
  const currentIndex = REPAIR_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="w-full">
      {/* Desktop: horizontal timeline */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Connecting lines behind the nodes */}
        <div className="absolute top-4 left-0 right-0 flex items-center px-4">
          {REPAIR_STATUS_ORDER.map((status, i) => {
            if (i === REPAIR_STATUS_ORDER.length - 1) return null;
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={status} className="flex-1 flex items-center">
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors duration-500',
                    isPast ? 'bg-[#00D084]' : isCurrent ? 'bg-gradient-to-r from-[#00D084] to-zinc-700' : 'bg-zinc-700'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Status nodes */}
        {REPAIR_STATUS_ORDER.map((status, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={status} className="relative flex flex-col items-center z-10 flex-1">
              {/* Node circle */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-500',
                  isPast && 'bg-[#00D084] border-[#00D084]',
                  isCurrent && 'bg-[#0A0A0A] border-[#00D084]',
                  isFuture && 'bg-[#0A0A0A] border-zinc-700'
                )}
              >
                {/* Inner dot */}
                <div
                  className={cn(
                    'h-2.5 w-2.5 rounded-full transition-colors duration-500',
                    isPast && 'bg-black',
                    isCurrent && 'bg-[#00D084]',
                    isFuture && 'bg-zinc-700'
                  )}
                />

                {/* Active glow ring */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#00D084]"
                    animate={{
                      boxShadow: [
                        '0 0 0px 0 rgba(0, 208, 132, 0.4)',
                        '0 0 12px 4px rgba(0, 208, 132, 0.3)',
                        '0 0 0px 0 rgba(0, 208, 132, 0.4)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Pulse animation for active status */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#00D084]/20"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                initial={false}
                animate={{ opacity: isPast || isCurrent ? 1 : 0.4 }}
                className={cn(
                  'mt-2.5 text-[11px] font-medium text-center leading-tight max-w-[80px] transition-colors duration-500',
                  isPast && 'text-[#00D084]',
                  isCurrent && 'text-white',
                  isFuture && 'text-zinc-600'
                )}
              >
                {REPAIR_STATUS_LABELS[status]}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* Mobile: wrapped timeline */}
      <div className="md:hidden">
        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
          {REPAIR_STATUS_ORDER.map((status, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div key={status} className="flex flex-col items-center relative">
                {/* Node */}
                <motion.div
                  initial={false}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={cn(
                    'relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-500 z-10',
                    isPast && 'bg-[#00D084] border-[#00D084]',
                    isCurrent && 'bg-[#0A0A0A] border-[#00D084]',
                    isFuture && 'bg-[#0A0A0A] border-zinc-700'
                  )}
                >
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors duration-500',
                      isPast && 'bg-black',
                      isCurrent && 'bg-[#00D084]',
                      isFuture && 'bg-zinc-700'
                    )}
                  />

                  {/* Active glow + pulse */}
                  {isCurrent && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#00D084]"
                        animate={{
                          boxShadow: [
                            '0 0 0px 0 rgba(0, 208, 132, 0.4)',
                            '0 0 10px 3px rgba(0, 208, 132, 0.3)',
                            '0 0 0px 0 rgba(0, 208, 132, 0.4)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#00D084]/20"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  initial={false}
                  animate={{ opacity: isPast || isCurrent ? 1 : 0.4 }}
                  className={cn(
                    'mt-1.5 text-[10px] font-medium text-center leading-tight transition-colors duration-500',
                    isPast && 'text-[#00D084]',
                    isCurrent && 'text-white',
                    isFuture && 'text-zinc-600'
                  )}
                >
                  {REPAIR_STATUS_LABELS[status]}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
