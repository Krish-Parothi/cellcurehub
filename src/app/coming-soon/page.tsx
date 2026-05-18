// 'use client';

// import React from 'react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import { Phone, ArrowLeft } from 'lucide-react';

// export default function ComingSoon() {
//   return (
//     <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden px-4">

//       {/* Dot grid background */}
//       <div
//         className="absolute inset-0 opacity-[0.07]"
//         style={{
//           backgroundImage: 'radial-gradient(circle, #00D084 1px, transparent 1px)',
//           backgroundSize: '40px 40px',
//         }}
//       />

//       {/* Gradient orbs */}
//       <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00D084]/10 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00D084]/5 rounded-full blur-[100px] pointer-events-none" />

//       {/* Logo top-left */}
//       <div className="absolute top-6 left-6 sm:top-8 sm:left-10 flex items-center gap-2">
//         <div className="w-9 h-9 rounded-xl bg-[#00D084] flex items-center justify-center">
//           <Phone className="w-5 h-5 text-[#0A0A0A]" />
//         </div>
//         <span className="text-white font-bold text-lg">
//           Cell<span className="text-[#00D084]">Cure</span>Hub
//         </span>
//       </div>

//       {/* Back to home */}
//       <div className="absolute top-6 right-6 sm:top-8 sm:right-10">
//         <Link
//           href="/"
//           className="flex items-center gap-2 text-white/40 hover:text-[#00D084] text-sm transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to Home
//         </Link>
//       </div>

//       {/* Main content */}
//       <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">

//         {/* Badge */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-8"
//         >
//           <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
//           We&apos;re building something great
//         </motion.div>

//         {/* Heading */}
//         <motion.h1
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//           className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-4"
//         >
//           Coming <span className="text-[#00D084]">Soon</span>
//         </motion.h1>

//         <motion.p
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//           className="text-white/40 text-base sm:text-lg max-w-md mx-auto"
//         >
//           This feature is under construction. We&apos;re working hard to bring you
//           the best repair experience in Nagpur. Stay tuned!
//         </motion.p>
//       </div>

//       {/* Bottom fade */}
//       <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
//     </main>
//   );
// }

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';

export default function ComingSoon() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #FF6B00 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Orange glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-400/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo top-left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <span className="text-gray-900 font-bold text-lg">
          Cell<span className="text-orange-500">Cure</span>Hub
        </span>
      </div>

      {/* Back to home */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-orange-500 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-500 text-xs font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          We're building something great
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-4"
        >
          Coming <span className="text-orange-500">Soon</span>
        </motion.h1>

        {/* Animated dashes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex gap-2 mb-6"
        >
          {[28, 14, 20].map((w, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-orange-500"
              style={{
                width: w,
                animation: `dashPulse 2s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-gray-400 text-base sm:text-lg max-w-md mx-auto"
        >
          This feature is under construction. We're working hard to bring you
          the best repair experience in Nagpur. Stay tuned!
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      <style>{`
        @keyframes dashPulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.15); }
        }
      `}</style>
    </main>
  );
}