// // 'use client';

// // import React from 'react';
// // import { motion } from 'framer-motion';
// // import Link from 'next/link';
// // import { Navbar } from '@/components/navbar';
// // import { Footer } from '@/components/footer';
// // import {
// //   Smartphone,
// //   Monitor,
// //   Battery,
// //   Droplets,
// //   Laptop,
// //   HardDrive,
// //   Clock,
// //   Shield,
// //   Award,
// //   Truck,
// //   Star,
// //   ArrowRight,
// //   ChevronRight,
// //   Phone,
// //   Search,
// // } from 'lucide-react';
// // import { cn } from '@/lib/utils';

// // /* ──────────────── Animation Variants ──────────────── */

// // const easeOut = [0.16, 1, 0.3, 1] as const;

// // const fadeUp = {
// //   hidden: { opacity: 0, y: 30 },
// //   visible: (i: number = 0) => ({
// //     opacity: 1,
// //     y: 0,
// //     transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
// //   }),
// // };

// // const staggerContainer = {
// //   hidden: {},
// //   visible: {
// //     transition: { staggerChildren: 0.1 },
// //   },
// // };

// // const staggerItem = {
// //   hidden: { opacity: 0, y: 24 },
// //   visible: {
// //     opacity: 1,
// //     y: 0,
// //     transition: { duration: 0.5, ease: easeOut },
// //   },
// // };

// // /* ──────────────── Data ──────────────── */

// // const services = [
// //   { icon: Smartphone, title: 'Smartphone Repair', price: 'From ₹299', desc: 'Android & iOS expert fixes' },
// //   { icon: Monitor, title: 'Screen Replacement', price: 'From ₹599', desc: 'OEM-quality display swaps' },
// //   { icon: Battery, title: 'Battery Replacement', price: 'From ₹499', desc: 'Restore full-day battery life' },
// //   { icon: Droplets, title: 'Water Damage', price: 'From ₹799', desc: 'Advanced board-level repair' },
// //   { icon: Laptop, title: 'Laptop Repair', price: 'From ₹999', desc: 'Hardware & software solutions' },
// //   { icon: HardDrive, title: 'Data Recovery', price: 'From ₹1,499', desc: 'Recover files you thought were lost' },
// // ];

// // const steps = [
// //   { num: '1', title: 'Book', desc: 'Choose your device and issue online' },
// //   { num: '2', title: 'Pickup', desc: 'We collect your device from your doorstep' },
// //   { num: '3', title: 'Repair', desc: 'Certified technicians fix it with care' },
// //   { num: '4', title: 'Delivery', desc: 'Fully repaired device delivered back to you' },
// // ];

// // const trackerSteps = [
// //   { label: 'Booked', done: true },
// //   { label: 'Picked Up', done: true },
// //   { label: 'Repair In Progress', done: false, active: true },
// //   { label: 'Ready', done: false },
// //   { label: 'Delivered', done: false },
// // ];

// // const trustBadges = [
// //   { icon: Clock, title: '48hr Turnaround', desc: 'Most repairs completed within 48 hours, so you stay connected.' },
// //   { icon: Shield, title: '90-Day Warranty', desc: 'Every repair backed by a 90-day warranty on parts and labour.' },
// //   { icon: Award, title: 'Certified Technicians', desc: 'Trained professionals using genuine & OEM-grade components.' },
// //   { icon: Truck, title: 'Free Pickup', desc: 'We pick up and drop off your device anywhere in Nagpur at zero cost.' },
// // ];

// // const testimonials = [
// //   { name: 'Rahul P.', area: 'Dharampeth', rating: 5, comment: 'Got my iPhone screen fixed in 3 hours. Amazing quality!' },
// //   { name: 'Priya S.', area: 'Sitabuldi', rating: 5, comment: 'Free pickup and delivery made it so convenient. 5 stars!' },
// //   { name: 'Amit K.', area: 'Wardha Road', rating: 4, comment: 'Best repair shop in Nagpur. My Samsung works like new.' },
// // ];

// // /* ──────────────── Inline Section Components ──────────────── */

// // function HeroSection() {
// //   return (
// //     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
// //       {/* Dot grid background */}
// //       <div
// //         className="absolute inset-0 opacity-[0.07]"
// //         style={{
// //           backgroundImage:
// //             'radial-gradient(circle, #00D084 1px, transparent 1px)',
// //           backgroundSize: '40px 40px',
// //         }}
// //       />
      

// //       {/* Gradient orbs */}
// //       <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00D084]/10 rounded-full blur-[120px] pointer-events-none" />
// //       <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00D084]/5 rounded-full blur-[100px] pointer-events-none" />

// //       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 pt-24 pb-16">
// //         {/* Left content */}
// //         <div className="flex-1 text-center lg:text-left">
// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5 }}
// //             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-6"
// //           >
// //             <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
// //             Now serving all of Nagpur
// //           </motion.div>

// //           <motion.h1
// //             initial={{ opacity: 0, y: 30 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.6, delay: 0.1 }}
// //             className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
// //           >
// //             Nagpur&apos;s Most Trusted{' '}
// //             <span className="text-[#00D084]">Gadget Repair</span> Hub
// //           </motion.h1>

// //           <motion.p
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.6, delay: 0.25 }}
// //             className="mt-4 text-lg sm:text-xl text-white/50 font-medium"
// //           >
// //             Fix It. Track It. Trust It.
// //           </motion.p>

// //           <motion.p
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.6, delay: 0.35 }}
// //             className="mt-4 text-sm sm:text-base text-white/40 max-w-lg mx-auto lg:mx-0"
// //           >
// //             Professional smartphone, laptop &amp; gadget repairs with free doorstep
// //             pickup, real-time tracking, and a 90-day warranty across Nagpur.
// //           </motion.p>

// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.6, delay: 0.45 }}
// //             className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
// //           >
// //             <Link
// //               href="/book"
// //               className="gradient-green px-8 py-3.5 rounded-xl text-base font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity flex items-center gap-2"
// //             >
// //               Book a Repair
// //               <ArrowRight className="w-4 h-4" />
// //             </Link>
// //             <Link
// //               href="/track"
// //               className="px-8 py-3.5 rounded-xl text-base font-medium text-white border border-white/15 hover:border-[#00D084]/30 hover:bg-white/5 transition-all flex items-center gap-2"
// //             >
// //               <Search className="w-4 h-4" />
// //               Track My Repair
// //             </Link>
// //           </motion.div>
// //         </div>

// //         {/* Right - floating phone mockup */}
// //         <motion.div
// //           initial={{ opacity: 0, scale: 0.8 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           transition={{ duration: 0.8, delay: 0.3 }}
// //           className="flex-shrink-0 relative"
// //         >
// //           <div className="relative animate-float">
// //             {/* Glow */}
// //             <div className="absolute -inset-8 bg-[#00D084]/20 rounded-[60px] blur-[60px] pointer-events-none" />

// //             {/* Phone frame */}
// //             <div className="relative w-[240px] sm:w-[280px] h-[480px] sm:h-[560px] bg-[#111] rounded-[40px] border-2 border-white/10 overflow-hidden green-glow-strong">
// //               {/* Notch */}
// //               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0A0A0A] rounded-b-2xl" />

// //               {/* Screen content */}
// //               <div className="absolute inset-2 top-8 rounded-[32px] overflow-hidden bg-gradient-to-b from-[#0A0A0A] to-[#111]">
// //                 <div className="flex flex-col items-center justify-center h-full p-6">
// //                   <div className="w-14 h-14 rounded-2xl bg-[#00D084]/20 flex items-center justify-center mb-4">
// //                     <Phone className="w-7 h-7 text-[#00D084]" />
// //                   </div>
// //                   <p className="text-white text-sm font-semibold">CellCureHub</p>
// //                   <p className="text-white/40 text-xs mt-1">Repair in progress...</p>

// //                   {/* Mini tracker */}
// //                   <div className="mt-6 w-full space-y-3">
// //                     {['Booked', 'Picked Up', 'Repairing'].map((s, i) => (
// //                       <div key={s} className="flex items-center gap-2">
// //                         <div
// //                           className={cn(
// //                             'w-2.5 h-2.5 rounded-full',
// //                             i < 2 ? 'bg-[#00D084]' : 'bg-[#00D084] animate-pulse'
// //                           )}
// //                         />
// //                         <span
// //                           className={cn(
// //                             'text-xs',
// //                             i < 2 ? 'text-white/60' : 'text-[#00D084] font-medium'
// //                           )}
// //                         >
// //                           {s}
// //                         </span>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </motion.div>
// //       </div>

// //       {/* Bottom fade */}
// //       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
// //     </section>
// //   );
// // }

// // function ServicesGrid() {
// //   return (
// //     <section id="services" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-80px' }}
// //           variants={fadeUp}
// //           className="text-center mb-14"
// //         >
// //           <h2 className="text-3xl sm:text-4xl font-bold text-white">
// //             Our <span className="text-[#00D084]">Services</span>
// //           </h2>
// //           <p className="mt-3 text-white/50 max-w-xl mx-auto">
// //             From cracked screens to dead batteries, we fix it all with genuine parts
// //             and certified expertise.
// //           </p>
// //         </motion.div>

// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-60px' }}
// //           variants={staggerContainer}
// //           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
// //         >
// //           {services.map((s) => {
// //             const Icon = s.icon;
// //             return (
// //               <motion.div
// //                 key={s.title}
// //                 variants={staggerItem}
// //                 whileHover={{
// //                   rotateY: 5,
// //                   rotateX: -5,
// //                   scale: 1.03,
// //                   transition: { duration: 0.3 },
// //                 }}
// //                 style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
// //                 className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#00D084]/30 hover:shadow-[0_0_30px_rgba(0,208,132,0.08)] transition-all duration-300 cursor-pointer"
// //               >
// //                 <div className="w-12 h-12 rounded-xl bg-[#00D084]/10 flex items-center justify-center mb-5 group-hover:bg-[#00D084]/20 transition-colors">
// //                   <Icon className="w-6 h-6 text-[#00D084]" />
// //                 </div>
// //                 <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
// //                 <p className="text-sm text-white/40 mb-3">{s.desc}</p>
// //                 <p className="text-[#00D084] font-bold text-sm">{s.price}</p>
// //               </motion.div>
// //             );
// //           })}
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // }

// // function HowItWorks() {
// //   return (
// //     <section id="how-it-works" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       {/* Subtle gradient */}
// //       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D084]/[0.02] to-transparent pointer-events-none" />

// //       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-80px' }}
// //           variants={fadeUp}
// //           className="text-center mb-14"
// //         >
// //           <h2 className="text-3xl sm:text-4xl font-bold text-white">
// //             How It <span className="text-[#00D084]">Works</span>
// //           </h2>
// //           <p className="mt-3 text-white/50 max-w-xl mx-auto">
// //             Getting your device repaired has never been this simple.
// //           </p>
// //         </motion.div>

// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-60px' }}
// //           variants={staggerContainer}
// //           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6"
// //         >
// //           {steps.map((step, i) => (
// //             <motion.div
// //               key={step.num}
// //               variants={staggerItem}
// //               className="relative flex flex-col items-center text-center"
// //             >
// //               {/* Number circle */}
// //               <div className="w-14 h-14 rounded-full gradient-green flex items-center justify-center text-[#0A0A0A] text-xl font-bold mb-4 shadow-[0_0_20px_rgba(0,208,132,0.25)]">
// //                 {step.num}
// //               </div>

// //               {/* Connecting line (not on last) */}
// //               {i < steps.length - 1 && (
// //                 <motion.div
// //                   initial={{ scaleX: 0 }}
// //                   whileInView={{ scaleX: 1 }}
// //                   viewport={{ once: true }}
// //                   transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
// //                   className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#00D084]/40 to-[#00D084]/10 origin-left"
// //                 />
// //               )}

// //               <h3 className="text-lg font-semibold text-white mb-1">
// //                 {step.title}
// //               </h3>
// //               <p className="text-sm text-white/40 max-w-[200px]">{step.desc}</p>
// //             </motion.div>
// //           ))}
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // }

// // function LiveTrackerTeaser() {
// //   return (
// //     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 overflow-hidden">
// //           {/* Glow */}
// //           <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00D084]/10 rounded-full blur-[80px] pointer-events-none" />

// //           <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
// //             {/* Left */}
// //             <motion.div
// //               initial="hidden"
// //               whileInView="visible"
// //               viewport={{ once: true }}
// //               variants={fadeUp}
// //               className="flex-1"
// //             >
// //               <h2 className="text-3xl sm:text-4xl font-bold text-white">
// //                 Track Your Repair <span className="text-[#00D084]">Live</span>
// //               </h2>
// //               <p className="mt-3 text-white/50 max-w-md">
// //                 Know exactly where your device is in the repair pipeline. No more
// //                 wondering &mdash; just real-time updates, every step of the way.
// //               </p>
// //               <Link
// //                 href="/track"
// //                 className="mt-6 inline-flex items-center gap-2 gradient-green px-6 py-3 rounded-xl text-sm font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity"
// //               >
// //                 Track Your Repair
// //                 <ChevronRight className="w-4 h-4" />
// //               </Link>
// //             </motion.div>

// //             {/* Right - mini tracker mockup */}
// //             <motion.div
// //               initial={{ opacity: 0, x: 30 }}
// //               whileInView={{ opacity: 1, x: 0 }}
// //               viewport={{ once: true }}
// //               transition={{ duration: 0.6, delay: 0.2 }}
// //               className="flex-1 w-full max-w-md"
// //             >
// //               <div className="bg-[#0A0A0A]/80 border border-white/5 rounded-2xl p-6">
// //                 <div className="flex items-center justify-between mb-6">
// //                   <div>
// //                     <p className="text-xs text-white/40">Repair ID</p>
// //                     <p className="text-sm font-mono text-white">#CCH-20241087</p>
// //                   </div>
// //                   <span className="text-xs px-3 py-1 rounded-full bg-[#00D084]/10 text-[#00D084] font-medium">
// //                     In Progress
// //                   </span>
// //                 </div>

// //                 <p className="text-xs text-white/40 mb-1">Device</p>
// //                 <p className="text-sm text-white mb-5">iPhone 14 Pro &mdash; Screen Replacement</p>

// //                 {/* Tracker steps */}
// //                 <div className="space-y-4">
// //                   {trackerSteps.map((step, i) => (
// //                     <div key={step.label} className="flex items-start gap-3">
// //                       <div className="flex flex-col items-center">
// //                         <div
// //                           className={cn(
// //                             'w-3 h-3 rounded-full border-2',
// //                             step.done
// //                               ? 'bg-[#00D084] border-[#00D084]'
// //                               : step.active
// //                               ? 'bg-[#00D084] border-[#00D084] animate-pulse-green'
// //                               : 'bg-transparent border-white/20'
// //                           )}
// //                         />
// //                         {i < trackerSteps.length - 1 && (
// //                           <div
// //                             className={cn(
// //                               'w-px h-6',
// //                               step.done ? 'bg-[#00D084]/50' : 'bg-white/10'
// //                             )}
// //                           />
// //                         )}
// //                       </div>
// //                       <span
// //                         className={cn(
// //                           'text-sm -mt-0.5',
// //                           step.done
// //                             ? 'text-white/70'
// //                             : step.active
// //                             ? 'text-[#00D084] font-medium'
// //                             : 'text-white/30'
// //                         )}
// //                       >
// //                         {step.label}
// //                       </span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </motion.div>
// //           </div>
// //         </div>
// //       </div>
// //     </section>
// //   );
// // }

// // function WhyChooseUs() {
// //   return (
// //     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-80px' }}
// //           variants={fadeUp}
// //           className="text-center mb-14"
// //         >
// //           <h2 className="text-3xl sm:text-4xl font-bold text-white">
// //             Why Choose <span className="text-[#00D084]">CellCureHub</span>
// //           </h2>
// //           <p className="mt-3 text-white/50 max-w-xl mx-auto">
// //             We go the extra mile to earn your trust.
// //           </p>
// //         </motion.div>

// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-60px' }}
// //           variants={staggerContainer}
// //           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
// //         >
// //           {trustBadges.map((badge) => {
// //             const Icon = badge.icon;
// //             return (
// //               <motion.div
// //                 key={badge.title}
// //                 variants={staggerItem}
// //                 className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:border-[#00D084]/20 transition-colors"
// //               >
// //                 <div className="w-14 h-14 rounded-2xl bg-[#00D084]/10 flex items-center justify-center mx-auto mb-4">
// //                   <Icon className="w-7 h-7 text-[#00D084]" />
// //                 </div>
// //                 <h3 className="text-lg font-semibold text-white mb-2">
// //                   {badge.title}
// //                 </h3>
// //                 <p className="text-sm text-white/40 leading-relaxed">
// //                   {badge.desc}
// //                 </p>
// //               </motion.div>
// //             );
// //           })}
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // }

// // function Testimonials() {
// //   return (
// //     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D084]/[0.015] to-transparent pointer-events-none" />

// //       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-80px' }}
// //           variants={fadeUp}
// //           className="text-center mb-14"
// //         >
// //           <h2 className="text-3xl sm:text-4xl font-bold text-white">
// //             What Our <span className="text-[#00D084]">Customers Say</span>
// //           </h2>
// //           <p className="mt-3 text-white/50 max-w-xl mx-auto">
// //             Real reviews from real Nagpur residents.
// //           </p>
// //         </motion.div>

// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-60px' }}
// //           variants={staggerContainer}
// //           className="grid grid-cols-1 md:grid-cols-3 gap-6"
// //         >
// //           {testimonials.map((t) => (
// //             <motion.div
// //               key={t.name}
// //               variants={staggerItem}
// //               className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#00D084]/20 transition-colors"
// //             >
// //               {/* Stars */}
// //               <div className="flex gap-1 mb-4">
// //                 {Array.from({ length: 5 }).map((_, i) => (
// //                   <Star
// //                     key={i}
// //                     className={cn(
// //                       'w-4 h-4',
// //                       i < t.rating
// //                         ? 'text-[#00D084] fill-[#00D084]'
// //                         : 'text-white/20'
// //                     )}
// //                   />
// //                 ))}
// //               </div>

// //               <p className="text-white/80 text-sm leading-relaxed mb-6">
// //                 &ldquo;{t.comment}&rdquo;
// //               </p>

// //               <div className="flex items-center gap-3">
// //                 <div className="w-10 h-10 rounded-full bg-[#00D084]/10 flex items-center justify-center text-[#00D084] font-bold text-sm">
// //                   {t.name.charAt(0)}
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-semibold text-white">{t.name}</p>
// //                   <p className="text-xs text-white/40">{t.area}</p>
// //                 </div>
// //               </div>
// //             </motion.div>
// //           ))}
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // }

// // function GoGreenSection() {
// //   return (
// //     <section id="go-green" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <motion.div
// //           initial="hidden"
// //           whileInView="visible"
// //           viewport={{ once: true, margin: '-80px' }}
// //           variants={fadeUp}
// //           className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden text-center"
// //         >
// //           {/* Glow */}
// //           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#00D084]/10 rounded-full blur-[100px] pointer-events-none" />

// //           <div className="relative">
// //             <motion.div
// //               initial="hidden"
// //               whileInView="visible"
// //               viewport={{ once: true }}
// //               variants={fadeUp}
// //               custom={0}
// //             >
// //               <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-6">
// //                 Eco-Friendly Initiative
// //               </span>
// //             </motion.div>

// //             <motion.h2
// //               initial="hidden"
// //               whileInView="visible"
// //               viewport={{ once: true }}
// //               variants={fadeUp}
// //               custom={1}
// //               className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
// //             >
// //               Turn Your Dead Phone Into{' '}
// //               <span className="text-[#00D084]">Cash</span>
// //             </motion.h2>

// //             <motion.p
// //               initial="hidden"
// //               whileInView="visible"
// //               viewport={{ once: true }}
// //               variants={fadeUp}
// //               custom={2}
// //               className="mt-4 text-white/50 max-w-lg mx-auto"
// //             >
// //               Don&apos;t throw away broken devices. Sell your e-waste through our
// //               certified portal and get paid while saving the planet. Responsible
// //               recycling, fair value, zero hassle.
// //             </motion.p>

// //             <motion.div
// //               initial="hidden"
// //               whileInView="visible"
// //               viewport={{ once: true }}
// //               variants={fadeUp}
// //               custom={3}
// //             >
// //               <Link
// //                 href="/ewaste"
// //                 className="mt-8 inline-flex items-center gap-2 gradient-green px-8 py-3.5 rounded-xl text-base font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity"
// //               >
// //                 Sell E-Waste
// //                 <ArrowRight className="w-4 h-4" />
// //               </Link>
// //             </motion.div>
// //           </div>
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // }

// // /* ──────────────── Main Page ──────────────── */

// // export default function Home() {
// //   return (
// //     <main className="bg-[#0A0A0A] text-white">
// //       <Navbar />
// //       <HeroSection />
// //       <ServicesGrid />
// //       <HowItWorks />
// //       <LiveTrackerTeaser />
// //       <WhyChooseUs />
// //       <Testimonials />
// //       <GoGreenSection />
// //       <Footer />
// //     </main>
// //   );
// // }


// 'use client';

// import React from 'react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import { Navbar } from '@/components/navbar';
// import { Footer } from '@/components/footer';
// import {
//   Smartphone,
//   Monitor,
//   Battery,
//   Droplets,
//   Laptop,
//   HardDrive,
//   Clock,
//   Shield,
//   Award,
//   Truck,
//   Star,
//   ArrowRight,
//   ChevronRight,
//   Phone,
//   Search,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';

// /* ──────────────── Animation Variants ──────────────── */

// const easeOut = [0.16, 1, 0.3, 1] as const;

// const fadeUp = {
//   hidden: { opacity: 0, y: 30 },
//   visible: (i: number = 0) => ({
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
//   }),
// };

// const staggerContainer = {
//   hidden: {},
//   visible: {
//     transition: { staggerChildren: 0.1 },
//   },
// };

// const staggerItem = {
//   hidden: { opacity: 0, y: 24 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.5, ease: easeOut },
//   },
// };

// /* ──────────────── Data ──────────────── */

// // ✅ ALL hrefs changed to /coming-soon
// const COMING_SOON = '/coming-soon';

// const services = [
//   { icon: Smartphone, title: 'Smartphone Repair', price: 'From ₹299', desc: 'Android & iOS expert fixes' },
//   { icon: Monitor, title: 'Screen Replacement', price: 'From ₹599', desc: 'OEM-quality display swaps' },
//   { icon: Battery, title: 'Battery Replacement', price: 'From ₹499', desc: 'Restore full-day battery life' },
//   { icon: Droplets, title: 'Water Damage', price: 'From ₹799', desc: 'Advanced board-level repair' },
//   { icon: Laptop, title: 'Laptop Repair', price: 'From ₹999', desc: 'Hardware & software solutions' },
//   { icon: HardDrive, title: 'Data Recovery', price: 'From ₹1,499', desc: 'Recover files you thought were lost' },
// ];

// const steps = [
//   { num: '1', title: 'Book', desc: 'Choose your device and issue online' },
//   { num: '2', title: 'Pickup', desc: 'We collect your device from your doorstep' },
//   { num: '3', title: 'Repair', desc: 'Certified technicians fix it with care' },
//   { num: '4', title: 'Delivery', desc: 'Fully repaired device delivered back to you' },
// ];

// const trackerSteps = [
//   { label: 'Booked', done: true },
//   { label: 'Picked Up', done: true },
//   { label: 'Repair In Progress', done: false, active: true },
//   { label: 'Ready', done: false },
//   { label: 'Delivered', done: false },
// ];

// const trustBadges = [
//   { icon: Clock, title: '48hr Turnaround', desc: 'Most repairs completed within 48 hours, so you stay connected.' },
//   { icon: Shield, title: '90-Day Warranty', desc: 'Every repair backed by a 90-day warranty on parts and labour.' },
//   { icon: Award, title: 'Certified Technicians', desc: 'Trained professionals using genuine & OEM-grade components.' },
//   { icon: Truck, title: 'Free Pickup', desc: 'We pick up and drop off your device anywhere in Nagpur at zero cost.' },
// ];

// const testimonials = [
//   { name: 'Rahul P.', area: 'Dharampeth', rating: 5, comment: 'Got my iPhone screen fixed in 3 hours. Amazing quality!' },
//   { name: 'Priya S.', area: 'Sitabuldi', rating: 5, comment: 'Free pickup and delivery made it so convenient. 5 stars!' },
//   { name: 'Amit K.', area: 'Wardha Road', rating: 4, comment: 'Best repair shop in Nagpur. My Samsung works like new.' },
// ];

// // ✅ Footer links — all pointing to /coming-soon
// const footerLinks = {
//   Services: ['Smartphone Repair', 'Screen Replacement', 'Battery Replacement', 'Water Damage Repair', 'Laptop Repair'],
//   Company: ['About Us', 'How It Works', 'Careers', 'Contact'],
//   Support: ['Track Repair', 'Sell E-Waste', 'Warranty Policy', 'FAQs'],
// };

// /* ──────────────── Section Components ──────────────── */

// function HeroSection() {
//   return (
//     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
//       <div
//         className="absolute inset-0 opacity-[0.07]"
//         style={{
//           backgroundImage: 'radial-gradient(circle, #00D084 1px, transparent 1px)',
//           backgroundSize: '40px 40px',
//         }}
//       />
//       <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00D084]/10 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00D084]/5 rounded-full blur-[100px] pointer-events-none" />

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 pt-24 pb-16">
//         <div className="flex-1 text-center lg:text-left">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-6"
//           >
//             <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
//             Now serving all of Nagpur
//           </motion.div>

//           <motion.h1
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
//           >
//             Nagpur&apos;s Most Trusted{' '}
//             <span className="text-[#00D084]">Gadget Repair</span> Hub
//           </motion.h1>

//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.25 }}
//             className="mt-4 text-lg sm:text-xl text-white/50 font-medium"
//           >
//             Fix It. Track It. Trust It.
//           </motion.p>

//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.35 }}
//             className="mt-4 text-sm sm:text-base text-white/40 max-w-lg mx-auto lg:mx-0"
//           >
//             Professional smartphone, laptop &amp; gadget repairs with free doorstep
//             pickup, real-time tracking, and a 90-day warranty across Nagpur.
//           </motion.p>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.45 }}
//             className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
//           >
//             {/* ✅ /book → /coming-soon */}
//             <Link
//               href={COMING_SOON}
//               className="gradient-green px-8 py-3.5 rounded-xl text-base font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity flex items-center gap-2"
//             >
//               Book a Repair
//               <ArrowRight className="w-4 h-4" />
//             </Link>
//             {/* ✅ /track → /coming-soon */}
//             <Link
//               href={COMING_SOON}
//               className="px-8 py-3.5 rounded-xl text-base font-medium text-white border border-white/15 hover:border-[#00D084]/30 hover:bg-white/5 transition-all flex items-center gap-2"
//             >
//               <Search className="w-4 h-4" />
//               Track My Repair
//             </Link>
//           </motion.div>
//         </div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           className="flex-shrink-0 relative"
//         >
//           <div className="relative animate-float">
//             <div className="absolute -inset-8 bg-[#00D084]/20 rounded-[60px] blur-[60px] pointer-events-none" />
//             <div className="relative w-[240px] sm:w-[280px] h-[480px] sm:h-[560px] bg-[#111] rounded-[40px] border-2 border-white/10 overflow-hidden green-glow-strong">
//               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0A0A0A] rounded-b-2xl" />
//               <div className="absolute inset-2 top-8 rounded-[32px] overflow-hidden bg-gradient-to-b from-[#0A0A0A] to-[#111]">
//                 <div className="flex flex-col items-center justify-center h-full p-6">
//                   <div className="w-14 h-14 rounded-2xl bg-[#00D084]/20 flex items-center justify-center mb-4">
//                     <Phone className="w-7 h-7 text-[#00D084]" />
//                   </div>
//                   <p className="text-white text-sm font-semibold">CellCureHub</p>
//                   <p className="text-white/40 text-xs mt-1">Repair in progress...</p>
//                   <div className="mt-6 w-full space-y-3">
//                     {['Booked', 'Picked Up', 'Repairing'].map((s, i) => (
//                       <div key={s} className="flex items-center gap-2">
//                         <div className={cn('w-2.5 h-2.5 rounded-full', i < 2 ? 'bg-[#00D084]' : 'bg-[#00D084] animate-pulse')} />
//                         <span className={cn('text-xs', i < 2 ? 'text-white/60' : 'text-[#00D084] font-medium')}>{s}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
//     </section>
//   );
// }

// function ServicesGrid() {
//   return (
//     <section id="services" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-14">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white">Our <span className="text-[#00D084]">Services</span></h2>
//           <p className="mt-3 text-white/50 max-w-xl mx-auto">From cracked screens to dead batteries, we fix it all with genuine parts and certified expertise.</p>
//         </motion.div>

//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {services.map((s) => {
//             const Icon = s.icon;
//             return (
//               // ✅ Each service card → /coming-soon
//               <Link href={COMING_SOON} key={s.title}>
//                 <motion.div
//                   variants={staggerItem}
//                   whileHover={{ rotateY: 5, rotateX: -5, scale: 1.03, transition: { duration: 0.3 } }}
//                   style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
//                   className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#00D084]/30 hover:shadow-[0_0_30px_rgba(0,208,132,0.08)] transition-all duration-300 cursor-pointer h-full"
//                 >
//                   <div className="w-12 h-12 rounded-xl bg-[#00D084]/10 flex items-center justify-center mb-5 group-hover:bg-[#00D084]/20 transition-colors">
//                     <Icon className="w-6 h-6 text-[#00D084]" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
//                   <p className="text-sm text-white/40 mb-3">{s.desc}</p>
//                   <p className="text-[#00D084] font-bold text-sm">{s.price}</p>
//                 </motion.div>
//               </Link>
//             );
//           })}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function HowItWorks() {
//   return (
//     <section id="how-it-works" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D084]/[0.02] to-transparent pointer-events-none" />
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-14">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white">How It <span className="text-[#00D084]">Works</span></h2>
//           <p className="mt-3 text-white/50 max-w-xl mx-auto">Getting your device repaired has never been this simple.</p>
//         </motion.div>

//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
//           {steps.map((step, i) => (
//             <motion.div key={step.num} variants={staggerItem} className="relative flex flex-col items-center text-center">
//               <div className="w-14 h-14 rounded-full gradient-green flex items-center justify-center text-[#0A0A0A] text-xl font-bold mb-4 shadow-[0_0_20px_rgba(0,208,132,0.25)]">
//                 {step.num}
//               </div>
//               {i < steps.length - 1 && (
//                 <motion.div
//                   initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
//                   transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
//                   className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#00D084]/40 to-[#00D084]/10 origin-left"
//                 />
//               )}
//               <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
//               <p className="text-sm text-white/40 max-w-[200px]">{step.desc}</p>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function LiveTrackerTeaser() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 overflow-hidden">
//           <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00D084]/10 rounded-full blur-[80px] pointer-events-none" />
//           <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
//             <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex-1">
//               <h2 className="text-3xl sm:text-4xl font-bold text-white">Track Your Repair <span className="text-[#00D084]">Live</span></h2>
//               <p className="mt-3 text-white/50 max-w-md">Know exactly where your device is in the repair pipeline. No more wondering &mdash; just real-time updates, every step of the way.</p>
//               {/* ✅ /track → /coming-soon */}
//               <Link href={COMING_SOON} className="mt-6 inline-flex items-center gap-2 gradient-green px-6 py-3 rounded-xl text-sm font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity">
//                 Track Your Repair
//                 <ChevronRight className="w-4 h-4" />
//               </Link>
//             </motion.div>

//             <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="flex-1 w-full max-w-md">
//               <div className="bg-[#0A0A0A]/80 border border-white/5 rounded-2xl p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <p className="text-xs text-white/40">Repair ID</p>
//                     <p className="text-sm font-mono text-white">#CCH-20241087</p>
//                   </div>
//                   <span className="text-xs px-3 py-1 rounded-full bg-[#00D084]/10 text-[#00D084] font-medium">In Progress</span>
//                 </div>
//                 <p className="text-xs text-white/40 mb-1">Device</p>
//                 <p className="text-sm text-white mb-5">iPhone 14 Pro &mdash; Screen Replacement</p>
//                 <div className="space-y-4">
//                   {trackerSteps.map((step, i) => (
//                     <div key={step.label} className="flex items-start gap-3">
//                       <div className="flex flex-col items-center">
//                         <div className={cn('w-3 h-3 rounded-full border-2', step.done ? 'bg-[#00D084] border-[#00D084]' : step.active ? 'bg-[#00D084] border-[#00D084] animate-pulse-green' : 'bg-transparent border-white/20')} />
//                         {i < trackerSteps.length - 1 && <div className={cn('w-px h-6', step.done ? 'bg-[#00D084]/50' : 'bg-white/10')} />}
//                       </div>
//                       <span className={cn('text-sm -mt-0.5', step.done ? 'text-white/70' : step.active ? 'text-[#00D084] font-medium' : 'text-white/30')}>{step.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function WhyChooseUs() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-14">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white">Why Choose <span className="text-[#00D084]">CellCureHub</span></h2>
//           <p className="mt-3 text-white/50 max-w-xl mx-auto">We go the extra mile to earn your trust.</p>
//         </motion.div>
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {trustBadges.map((badge) => {
//             const Icon = badge.icon;
//             return (
//               <motion.div key={badge.title} variants={staggerItem} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:border-[#00D084]/20 transition-colors">
//                 <div className="w-14 h-14 rounded-2xl bg-[#00D084]/10 flex items-center justify-center mx-auto mb-4">
//                   <Icon className="w-7 h-7 text-[#00D084]" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-white mb-2">{badge.title}</h3>
//                 <p className="text-sm text-white/40 leading-relaxed">{badge.desc}</p>
//               </motion.div>
//             );
//           })}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function Testimonials() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D084]/[0.015] to-transparent pointer-events-none" />
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-14">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white">What Our <span className="text-[#00D084]">Customers Say</span></h2>
//           <p className="mt-3 text-white/50 max-w-xl mx-auto">Real reviews from real Nagpur residents.</p>
//         </motion.div>
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {testimonials.map((t) => (
//             <motion.div key={t.name} variants={staggerItem} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#00D084]/20 transition-colors">
//               <div className="flex gap-1 mb-4">
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-[#00D084] fill-[#00D084]' : 'text-white/20')} />
//                 ))}
//               </div>
//               <p className="text-white/80 text-sm leading-relaxed mb-6">&ldquo;{t.comment}&rdquo;</p>
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-full bg-[#00D084]/10 flex items-center justify-center text-[#00D084] font-bold text-sm">{t.name.charAt(0)}</div>
//                 <div>
//                   <p className="text-sm font-semibold text-white">{t.name}</p>
//                   <p className="text-xs text-white/40">{t.area}</p>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function GoGreenSection() {
//   return (
//     <section id="go-green" className="relative py-20 sm:py-28 bg-[#0A0A0A]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden text-center">
//           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#00D084]/10 rounded-full blur-[100px] pointer-events-none" />
//           <div className="relative">
//             <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
//               <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-6">Eco-Friendly Initiative</span>
//             </motion.div>
//             <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
//               Turn Your Dead Phone Into <span className="text-[#00D084]">Cash</span>
//             </motion.h2>
//             <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="mt-4 text-white/50 max-w-lg mx-auto">
//               Don&apos;t throw away broken devices. Sell your e-waste through our certified portal and get paid while saving the planet. Responsible recycling, fair value, zero hassle.
//             </motion.p>
//             <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
//               {/* ✅ /ewaste → /coming-soon */}
//               <Link href={COMING_SOON} className="mt-8 inline-flex items-center gap-2 gradient-green px-8 py-3.5 rounded-xl text-base font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity">
//                 Sell E-Waste
//                 <ArrowRight className="w-4 h-4" />
//               </Link>
//             </motion.div>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ──────────────── Updated Footer with /coming-soon links ──────────────── */
// function UpdatedFooter() {
//   return (
//     <footer className="bg-[#0A0A0A] border-t border-white/5 pt-16 pb-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
//           {/* Brand */}
//           <div>
//             <div className="flex items-center gap-2 mb-4">
//               <div className="w-9 h-9 rounded-xl bg-[#00D084] flex items-center justify-center">
//                 <Phone className="w-5 h-5 text-[#0A0A0A]" />
//               </div>
//               <span className="text-white font-bold text-lg">Cell<span className="text-[#00D084]">Cure</span>Hub</span>
//             </div>
//             <p className="text-white/40 text-sm leading-relaxed mb-6">Nagpur&apos;s most trusted gadget repair hub. Professional repairs with free pickup, 48hr turnaround, and 90-day warranty.</p>
//             {/* ✅ Footer CTA → /coming-soon */}
//             <Link href={COMING_SOON} className="inline-flex items-center gap-2 gradient-green px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity">
//               Book a Repair <ArrowRight className="w-4 h-4" />
//             </Link>
//           </div>

//           {/* Footer link columns — all → /coming-soon */}
//           {Object.entries(footerLinks).map(([heading, links]) => (
//             <div key={heading}>
//               <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
//               <ul className="space-y-2.5">
//                 {links.map((link) => (
//                   <li key={link}>
//                     <Link href={COMING_SOON} className="text-white/40 hover:text-[#00D084] text-sm transition-colors">
//                       {link}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
//           <p className="text-white/30 text-xs">© 2024 CellCureHub. All rights reserved.</p>
//           <div className="flex gap-6">
//             {['Privacy Policy', 'Terms of Service'].map((item) => (
//               <Link key={item} href={COMING_SOON} className="text-white/30 hover:text-white/60 text-xs transition-colors">{item}</Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }

// /* ──────────────── Main Page ──────────────── */

// export default function Home() {
//   return (
//     <main className="bg-[#0A0A0A] text-white">
//       <Navbar />
//       <HeroSection />
//       <ServicesGrid />
//       <HowItWorks />
//       <LiveTrackerTeaser />
//       <WhyChooseUs />
//       <Testimonials />
//       <GoGreenSection />
//       <UpdatedFooter />
//     </main>
//   );
// }

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ScrollyIphone } from '@/components/scrolly-iphone';
import {
  Smartphone,
  Monitor,
  Battery,
  Droplets,
  Laptop,
  HardDrive,
  Clock,
  Shield,
  Award,
  Truck,
  Star,
  ArrowRight,
  ChevronRight,
  Phone,
  Search,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────── */
// Primary:  #FF5C00  (bold orange)
// Accent:   #FF8C42  (light orange)
// Dark:     #1A1A1A
// Surface:  #F7F7F5  (warm off-white)
// Border:   #E8E4DF

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const COMING_SOON = '/coming-soon';
const TOTAL_FRAMES = 22;

const services = [
  { icon: Smartphone, title: 'Smartphone Repair', price: 'From ₹299', desc: 'Android & iOS expert fixes' },
  { icon: Monitor,    title: 'Screen Replacement', price: 'From ₹599', desc: 'OEM-quality display swaps' },
  { icon: Battery,    title: 'Battery Replacement', price: 'From ₹499', desc: 'Restore full-day battery life' },
  { icon: Droplets,   title: 'Water Damage',        price: 'From ₹799', desc: 'Advanced board-level repair' },
  { icon: Laptop,     title: 'Laptop Repair',       price: 'From ₹999', desc: 'Hardware & software solutions' },
  { icon: HardDrive,  title: 'Data Recovery',       price: 'From ₹1,499', desc: 'Recover files you thought were lost' },
];

const steps = [
  { num: '01', title: 'Book',     desc: 'Choose your device and issue online in minutes' },
  { num: '02', title: 'Pickup',   desc: 'We collect from your doorstep — completely free' },
  { num: '03', title: 'Repair',   desc: 'Certified technicians fix it with genuine parts' },
  { num: '04', title: 'Delivery', desc: 'Device returned fully repaired, same-day possible' },
];

const trackerSteps = [
  { label: 'Booked',            done: true  },
  { label: 'Picked Up',         done: true  },
  { label: 'Repair In Progress',done: false, active: true },
  { label: 'Ready',             done: false },
  { label: 'Delivered',         done: false },
];

const trustBadges = [
  { icon: Clock,  title: '48hr Turnaround',      desc: 'Most repairs done within 48 hours.' },
  { icon: Shield, title: '90-Day Warranty',       desc: '90-day warranty on every part & job.' },
  { icon: Award,  title: 'Certified Technicians', desc: 'OEM-grade components, trained hands.' },
  { icon: Truck,  title: 'Free Pickup',           desc: 'Zero-cost doorstep pickup & delivery.' },
];

const testimonials = [
  { name: 'Rahul P.',  area: 'Dharampeth',  rating: 5, comment: 'Got my iPhone screen fixed in 3 hours. Amazing quality!' },
  { name: 'Priya S.',  area: 'Sitabuldi',   rating: 5, comment: 'Free pickup and delivery made it so convenient. 5 stars!' },
  { name: 'Amit K.',   area: 'Wardha Road', rating: 4, comment: 'Best repair shop in Nagpur. My Samsung works like new.' },
];

const footerLinks = {
  Services: ['Smartphone Repair', 'Screen Replacement', 'Battery Replacement', 'Water Damage Repair', 'Laptop Repair'],
  Company:  ['About Us', 'How It Works', 'Careers', 'Contact'],
  Support:  ['Track Repair', 'Sell E-Waste', 'Warranty Policy', 'FAQs'],
};

/* ─────────────────────────────────────────
   PART LABEL SUB-COMPONENTS (hooks-safe)
───────────────────────────────────────── */
function PartLabelLeft({
  scrollYProgress,
  pct,
  text,
}: {
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
  pct: number;
  text: string;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, pct - 0.08), pct, Math.min(1, pct + 0.08), Math.min(1, pct + 0.16)],
    [0, 1, 1, 0]
  );
  return (
    <motion.div
      style={{ opacity }}
      className="absolute left-4 sm:left-12 lg:left-24 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
        <div className="h-px w-8 sm:w-16 bg-[#FF5C00]/50" />
        <span className="text-white text-sm sm:text-base font-semibold whitespace-nowrap">{text}</span>
      </div>
    </motion.div>
  );
}

function PartLabelRight({
  scrollYProgress,
  pct,
  text,
}: {
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
  pct: number;
  text: string;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, pct - 0.08), pct, Math.min(1, pct + 0.08), Math.min(1, pct + 0.16)],
    [0, 1, 1, 0]
  );
  return (
    <motion.div
      style={{ opacity }}
      className="absolute right-4 sm:right-12 lg:right-24 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
    >
      <div className="flex items-center gap-3 justify-end">
        <span className="text-white text-sm sm:text-base font-semibold whitespace-nowrap">{text}</span>
        <div className="h-px w-8 sm:w-16 bg-[#FF5C00]/50" />
        <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   SCROLL-DRIVEN FRAME ANIMATION
───────────────────────────────────────── */
function PhoneTeardownSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const imagesRef    = useRef<HTMLImageElement[]>([]);
  const frameRef     = useRef(0);
  const [loaded, setLoaded]   = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Preload all frames
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let done = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const num  = String(i).padStart(3, '0');
      img.src    = `/iphone-frames/ezgif-frame-${num}.jpg`;
      img.onload = () => {
        done++;
        setLoadPct(Math.round((done / TOTAL_FRAMES) * 100));
        if (done === TOTAL_FRAMES) setLoaded(true);
      };
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;
  }, []);

  // Draw frame on canvas based on scroll
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (!img) return;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    // Draw first frame immediately
    drawFrame(0);

    const unsubscribe = scrollYProgress.on('change', (v) => {
      const idx = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(v * TOTAL_FRAMES)
      );
      if (idx !== frameRef.current) {
        frameRef.current = idx;
        drawFrame(idx);
      }
    });

    return () => unsubscribe();
  }, [loaded, scrollYProgress]);

  // Label that fades in with scroll progress
  const labelOpacity  = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const labelY        = useTransform(scrollYProgress, [0, 0.15], [20, 0]);
  const ctaOpacity    = useTransform(scrollYProgress, [0.8, 0.95], [0, 1]);
  const ctaY          = useTransform(scrollYProgress, [0.8, 0.95], [20, 0]);

  // Floating text labels for parts
  const partLabels = [
    { pct: 0.15, text: 'Titanium Frame',        side: 'left'  },
    { pct: 0.30, text: 'Ceramic Shield Glass',  side: 'right' },
    { pct: 0.45, text: 'A19 Bionic Chip',       side: 'left'  },
    { pct: 0.60, text: 'MagSafe Battery',       side: 'right' },
    { pct: 0.75, text: 'Pro Camera System',     side: 'left'  },
    { pct: 0.90, text: 'Logic Board',           side: 'right' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${TOTAL_FRAMES * 120}px` }}  // scroll distance
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0F0F0F] flex items-center justify-center">

        {/* Background grain texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px',
          }}
        />

        {/* Orange radial glow behind phone */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255,92,0,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Section heading */}
        <motion.div
          style={{ opacity: labelOpacity, y: labelY }}
          className="absolute top-10 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-semibold tracking-widest uppercase mb-3">
            Inside Every Repair
          </span>
          <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight">
            We Know Your Phone<br />
            <span className="text-[#FF5C00]">Inside Out</span>
          </h2>
          <p className="text-white/40 text-sm mt-2">Scroll to explore every component we service</p>
        </motion.div>

        {/* Part labels - left side */}
        {partLabels.filter(l => l.side === 'left').map((label) => (
          <PartLabelLeft
            key={label.text}
            scrollYProgress={scrollYProgress}
            pct={label.pct}
            text={label.text}
          />
        ))}

        {/* Part labels - right side */}
        {partLabels.filter(l => l.side === 'right').map((label) => (
          <PartLabelRight
            key={label.text}
            scrollYProgress={scrollYProgress}
            pct={label.pct}
            text={label.text}
          />
        ))}

        {/* Canvas */}
        <div className="relative w-full max-w-xl px-4 flex items-center justify-center">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5C00] rounded-full transition-all duration-300"
                  style={{ width: `${loadPct}%` }}
                />
              </div>
              <p className="text-white/40 text-xs mt-3">Loading {loadPct}%</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-auto object-contain"
            style={{
              maxHeight: '75vh',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        </div>

        {/* Bottom CTA */}
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none"
        >
          <p className="text-white/50 text-sm">Every component. Certified repair.</p>
        </motion.div>

        {/* Scroll progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-[3px] bg-[#FF5C00] origin-left"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────── */
// function HeroSection() {
//   return (
//     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
//       {/* Diagonal orange accent block */}
//       <div
//         className="absolute top-0 right-0 w-[55%] h-full bg-[#FF5C00] pointer-events-none"
//         style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
//       />

//       {/* Dot grid overlay on orange */}
//       <div
//         className="absolute top-0 right-0 w-[55%] h-full opacity-[0.06] pointer-events-none"
//         style={{
//           clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
//           backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
//           backgroundSize: '28px 28px',
//         }}
//       />

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-0 pt-24 pb-16 w-full">
//         {/* Left content */}
//         <div className="flex-1 text-center lg:text-left pr-0 lg:pr-12">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/25 text-[#FF5C00] text-xs font-bold tracking-widest uppercase mb-6"
//           >
//             <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
//             Now serving all of Nagpur
//           </motion.div>

//           <motion.h1
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[#1A1A1A] leading-[1.0] tracking-tight"
//           >
//             Nagpur&apos;s<br />
//             Most <span className="text-[#FF5C00]">Trusted</span><br />
//             Repair Hub
//           </motion.h1>

//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.3 }}
//             className="mt-6 text-sm sm:text-base text-[#1A1A1A]/50 max-w-md mx-auto lg:mx-0 leading-relaxed"
//           >
//             Professional smartphone, laptop &amp; gadget repairs with free doorstep
//             pickup, real-time tracking, and a 90-day warranty across Nagpur.
//           </motion.p>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.45 }}
//             className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
//           >
//             <Link
//               href={COMING_SOON}
//               className="bg-[#FF5C00] hover:bg-[#e05200] px-8 py-4 rounded-xl text-base font-bold text-white transition-colors flex items-center gap-2 shadow-[0_8px_30px_rgba(255,92,0,0.3)]"
//             >
//               Book a Repair
//               <ArrowRight className="w-4 h-4" />
//             </Link>
//             <Link
//               href={COMING_SOON}
//               className="px-8 py-4 rounded-xl text-base font-semibold text-[#1A1A1A] border-2 border-[#1A1A1A]/15 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all flex items-center gap-2"
//             >
//               <Search className="w-4 h-4" />
//               Track My Repair
//             </Link>
//           </motion.div>

//           {/* Stats row */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.6, delay: 0.6 }}
//             className="mt-12 flex items-center gap-8 justify-center lg:justify-start"
//           >
//             {[
//               { val: '5000+', label: 'Repairs Done' },
//               { val: '48hr',  label: 'Avg Turnaround' },
//               { val: '90-Day', label: 'Warranty' },
//             ].map((s) => (
//               <div key={s.val} className="text-center lg:text-left">
//                 <div className="text-2xl font-black text-[#FF5C00]">{s.val}</div>
//                 <div className="text-xs text-[#1A1A1A]/40 font-medium mt-0.5">{s.label}</div>
//               </div>
//             ))}
//           </motion.div>
//         </div>

//         {/* Right - phone mockup on orange */}
//         <motion.div
//           initial={{ opacity: 0, x: 40 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           className="flex-shrink-0 relative z-10"
//         >
//           <div className="relative animate-float">
//             {/* Shadow */}
//             <div className="absolute -inset-4 bg-black/10 rounded-[50px] blur-[40px]" />

//             {/* Phone frame */}
//             <div className="relative w-[220px] sm:w-[260px] h-[440px] sm:h-[520px] bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-2xl">
//               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#F7F7F5] rounded-b-2xl z-10" />
//               <div className="absolute inset-2 top-8 rounded-[32px] overflow-hidden bg-[#F7F7F5] flex flex-col">
//                 {/* Orange top bar */}
//                 <div className="bg-[#FF5C00] p-4 flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
//                     <Wrench className="w-4 h-4 text-white" />
//                   </div>
//                   <div>
//                     <p className="text-white text-xs font-bold">CellCureHub</p>
//                     <p className="text-white/70 text-[10px]">Repair in progress</p>
//                   </div>
//                 </div>
//                 <div className="flex-1 p-4 space-y-3">
//                   <div className="bg-white rounded-xl p-3 border border-[#E8E4DF]">
//                     <p className="text-[10px] text-[#1A1A1A]/40 mb-1">iPhone 14 Pro • Screen</p>
//                     <div className="w-full h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
//                       <div className="h-full w-[60%] bg-[#FF5C00] rounded-full" />
//                     </div>
//                     <p className="text-[10px] text-[#FF5C00] font-bold mt-1">60% Complete</p>
//                   </div>
//                   {['Booked', 'Picked Up', 'Repairing'].map((s, i) => (
//                     <div key={s} className="flex items-center gap-2">
//                       <div className={cn(
//                         'w-2.5 h-2.5 rounded-full',
//                         i < 2 ? 'bg-[#FF5C00]' : 'bg-[#FF5C00] animate-pulse'
//                       )} />
//                       <span className={cn(
//                         'text-xs',
//                         i < 2 ? 'text-[#1A1A1A]/50' : 'text-[#FF5C00] font-semibold'
//                       )}>{s}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* Bottom fade */}
//       <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
//     </section>
//   );
// }

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">

      {/* Premium soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#fff7f2] to-[#fff1e8]" />

      {/* Glow blob */}
      <div className="absolute top-[-120px] right-[-120px] w-[420px] h-[420px] bg-[#FF5C00]/10 rounded-full blur-[120px]" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16 pt-28 pb-20 w-full">

        {/* LEFT SIDE */}
        <div className="flex-1 text-center lg:text-left">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold tracking-[0.2em] uppercase mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
            Now Serving All Of Nagpur
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[92px] font-black text-[#111111] leading-[0.95] tracking-tight"
          >
            Nagpur&apos;s
            <br />
            Most
            <span className="text-[#FF5C00]"> Trusted</span>
            <br />
            Repair Hub
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-7 text-base sm:text-lg text-[#1A1A1A]/60 max-w-xl leading-relaxed"
          >
            Professional smartphone, laptop & gadget repairs with free
            doorstep pickup, real-time tracking, and a 90-day warranty
            across Nagpur.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link
              href={COMING_SOON}
              className="bg-[#FF5C00] hover:bg-[#e05200] px-9 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 flex items-center gap-2 shadow-[0_10px_40px_rgba(255,92,0,0.35)]"
            >
              Book A Repair
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={COMING_SOON}
              className="px-9 py-4 rounded-2xl text-base font-semibold text-[#1A1A1A] border border-[#1A1A1A]/10 bg-white hover:border-[#FF5C00]/40 hover:text-[#FF5C00] transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              Track My Repair
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-14 flex flex-wrap items-center gap-10 justify-center lg:justify-start"
          >
            {[
              { value: '5000+', label: 'Repairs Done' },
              { value: '48hr', label: 'Avg Turnaround' },
              { value: '90-Day', label: 'Warranty' },
            ].map((item) => (
              <div key={item.value}>
                <div className="text-3xl font-black text-[#FF5C00]">
                  {item.value}
                </div>
                <div className="text-sm text-[#1A1A1A]/45 mt-1 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT SIDE STORE IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          <div className="relative w-full max-w-[560px]">

            {/* Glow */}
            <div className="absolute -inset-5 bg-[#FF5C00]/20 blur-[70px] rounded-[40px]" />

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-[36px] shadow-[0_30px_80px_rgba(0,0,0,0.18)] border border-white/50">

              <img
                src="/store-image.jpg"
                alt="CellCureHub Store"
                className="w-full h-[620px] object-cover"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* Floating Tag */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/40">
                <p className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">
                  CellCureHub
                </p>

                <p className="text-[#111111] text-sm font-semibold mt-1">
                  Repair • Accessories • Trust
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

/* ─────────────────────────────────────────
   SERVICES
───────────────────────────────────────── */
function ServicesGrid() {
  return (
    <section id="services" className="relative py-20 sm:py-28 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="mb-14"
        >
          <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">What we fix</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
            Our <span className="text-[#FF5C00]">Services</span>
          </h2>
          <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">
            From cracked screens to dead batteries — fixed with genuine parts and certified expertise.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <Link href={COMING_SOON} key={s.title}>
                <motion.div
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white border border-[#E8E4DF] rounded-2xl p-6 sm:p-8 hover:border-[#FF5C00]/40 hover:shadow-[0_8px_30px_rgba(255,92,0,0.08)] transition-all duration-300 cursor-pointer h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mb-5 group-hover:bg-[#FF5C00] transition-colors duration-300">
                    <Icon className="w-6 h-6 text-[#FF5C00] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{s.title}</h3>
                  <p className="text-sm text-[#1A1A1A]/40 mb-4">{s.desc}</p>
                  <p className="text-[#FF5C00] font-black text-sm">{s.price}</p>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* Big orange number watermark */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-[280px] font-black text-[#FF5C00]/[0.04] leading-none select-none pointer-events-none">
        HOW
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="mb-14"
        >
          <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Simple process</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
            How It <span className="text-[#FF5C00]">Works</span>
          </h2>
          <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">Getting your device repaired has never been this simple.</p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, i) => (
            <motion.div key={step.num} variants={staggerItem} className="relative">
              {/* Connector */}
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
                  className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#FF5C00]/40 to-[#FF5C00]/10 origin-left"
                />
              )}
              <div className="text-4xl font-black text-[#FF5C00]/15 mb-3">{step.num}</div>
              <h3 className="text-lg font-black text-[#1A1A1A] mb-2">{step.title}</h3>
              <p className="text-sm text-[#1A1A1A]/40 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   LIVE TRACKER TEASER
───────────────────────────────────────── */
function LiveTrackerTeaser() {
  return (
    <section className="relative py-20 sm:py-28 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#1A1A1A] rounded-3xl p-8 sm:p-12 overflow-hidden">
          {/* Orange glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF5C00]/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true }} variants={fadeUp}
              className="flex-1"
            >
              <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Real-time</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                Track Your Repair <span className="text-[#FF5C00]">Live</span>
              </h2>
              <p className="mt-3 text-white/40 max-w-md text-sm leading-relaxed">
                Know exactly where your device is in the repair pipeline — real-time updates, every step of the way.
              </p>
              <Link
                href={COMING_SOON}
                className="mt-6 inline-flex items-center gap-2 bg-[#FF5C00] hover:bg-[#e05200] px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
              >
                Track Your Repair
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 w-full max-w-md"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/30">Repair ID</p>
                    <p className="text-sm font-mono text-white">#CCH-20241087</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#FF5C00]/15 text-[#FF5C00] font-bold">In Progress</span>
                </div>
                <p className="text-xs text-white/30 mb-1">Device</p>
                <p className="text-sm text-white mb-5">iPhone 14 Pro — Screen Replacement</p>
                <div className="space-y-4">
                  {trackerSteps.map((step, i) => (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-3 h-3 rounded-full border-2',
                          step.done   ? 'bg-[#FF5C00] border-[#FF5C00]' :
                          step.active ? 'bg-[#FF5C00] border-[#FF5C00] animate-pulse' :
                                        'bg-transparent border-white/20'
                        )} />
                        {i < trackerSteps.length - 1 && (
                          <div className={cn('w-px h-6', step.done ? 'bg-[#FF5C00]/50' : 'bg-white/10')} />
                        )}
                      </div>
                      <span className={cn(
                        'text-sm -mt-0.5',
                        step.done   ? 'text-white/60' :
                        step.active ? 'text-[#FF5C00] font-semibold' :
                                      'text-white/25'
                      )}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   WHY CHOOSE US
───────────────────────────────────────── */
function WhyChooseUs() {
  return (
    <section className="relative py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="mb-14"
        >
          <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Our promise</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
            Why Choose <span className="text-[#FF5C00]">CellCureHub</span>
          </h2>
          <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">We go the extra mile to earn your trust.</p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.title} variants={staggerItem}
                className={cn(
                  'rounded-2xl p-6 sm:p-8',
                  i === 0
                    ? 'bg-[#FF5C00] text-white'
                    : 'bg-[#F7F7F5] border border-[#E8E4DF]'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
                  i === 0 ? 'bg-white/20' : 'bg-[#FF5C00]/10'
                )}>
                  <Icon className={cn('w-6 h-6', i === 0 ? 'text-white' : 'text-[#FF5C00]')} />
                </div>
                <h3 className={cn('text-base font-black mb-2', i === 0 ? 'text-white' : 'text-[#1A1A1A]')}>
                  {badge.title}
                </h3>
                <p className={cn('text-sm leading-relaxed', i === 0 ? 'text-white/80' : 'text-[#1A1A1A]/50')}>
                  {badge.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────── */
function Testimonials() {
  return (
    <section className="relative py-20 sm:py-28 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="mb-14"
        >
          <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Reviews</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
            What Our <span className="text-[#FF5C00]">Customers Say</span>
          </h2>
          <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">Real reviews from real Nagpur residents.</p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name} variants={staggerItem}
              className="bg-white border border-[#E8E4DF] rounded-2xl p-6 sm:p-8 hover:border-[#FF5C00]/30 hover:shadow-[0_8px_30px_rgba(255,92,0,0.06)] transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-[#FF5C00] fill-[#FF5C00]' : 'text-[#E8E4DF]')} />
                ))}
              </div>
              <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-6">&ldquo;{t.comment}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF5C00]/10 flex items-center justify-center text-[#FF5C00] font-black text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{t.name}</p>
                  <p className="text-xs text-[#1A1A1A]/40">{t.area}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   GO GREEN
───────────────────────────────────────── */
function GoGreenSection() {
  return (
    <section id="go-green" className="relative py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="relative bg-[#FF5C00] rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden text-center"
        >
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6">
              Eco-Friendly Initiative
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Turn Your Dead Phone<br />Into <span className="underline decoration-white/40">Cash</span>
            </h2>
            <p className="mt-4 text-white/80 max-w-lg mx-auto text-sm leading-relaxed">
              Don&apos;t throw away broken devices. Sell your e-waste through our certified portal —
              responsible recycling, fair value, zero hassle.
            </p>
            <Link
              href={COMING_SOON}
              className="mt-8 inline-flex items-center gap-2 bg-white px-8 py-3.5 rounded-xl text-base font-black text-[#FF5C00] hover:bg-[#F7F7F5] transition-colors"
            >
              Sell E-Waste
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function UpdatedFooter() {
  return (
    <footer className="bg-[#1A1A1A] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FF5C00] flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-lg">Cell<span className="text-[#FF5C00]">Cure</span>Hub</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed mb-6">
              Nagpur&apos;s most trusted gadget repair hub. Free pickup, 48hr turnaround, 90-day warranty.
            </p>
            <Link
              href={COMING_SOON}
              className="inline-flex items-center gap-2 bg-[#FF5C00] hover:bg-[#e05200] px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            >
              Book a Repair <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-black text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link href={COMING_SOON} className="text-white/30 hover:text-[#FF5C00] text-sm transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">© 2024 CellCureHub. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <Link key={item} href={COMING_SOON} className="text-white/20 hover:text-white/50 text-xs transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-white">
      <Navbar />
      <HeroSection />
      <ServicesGrid />
      <HowItWorks />
      <LiveTrackerTeaser />
      <WhyChooseUs />
      <Testimonials />
      <GoGreenSection />
      <UpdatedFooter />
    </main>
  );
}

// 'use client';

// import React, { useEffect, useRef, useState } from 'react';
// import { motion, useScroll, useTransform } from 'framer-motion';
// import Link from 'next/link';
// import { Navbar } from '@/components/navbar';
// import {
//   Smartphone,
//   Monitor,
//   Battery,
//   Droplets,
//   Laptop,
//   HardDrive,
//   Clock,
//   Shield,
//   Award,
//   Truck,
//   Star,
//   ArrowRight,
//   ChevronRight,
//   Phone,
//   Search,
//   Wrench,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';

// /* ─────────────────────────────────────────
//    THEME TOKENS
// ───────────────────────────────────────── */
// // Primary:  #FF5C00  (bold orange)
// // Accent:   #FF8C42  (light orange)
// // Dark:     #1A1A1A
// // Surface:  #F7F7F5  (warm off-white)
// // Border:   #E8E4DF

// /* ─────────────────────────────────────────
//    ANIMATION VARIANTS
// ───────────────────────────────────────── */
// const easeOut = [0.16, 1, 0.3, 1] as const;

// const fadeUp = {
//   hidden: { opacity: 0, y: 32 },
//   visible: (i: number = 0) => ({
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
//   }),
// };

// const staggerContainer = {
//   hidden: {},
//   visible: { transition: { staggerChildren: 0.08 } },
// };

// const staggerItem = {
//   hidden: { opacity: 0, y: 24 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
// };

// /* ─────────────────────────────────────────
//    DATA
// ───────────────────────────────────────── */
// const COMING_SOON = '/coming-soon';
// const TOTAL_FRAMES = 22;

// const services = [
//   { icon: Smartphone, title: 'Smartphone Repair',   price: 'From ₹299',   desc: 'Android & iOS expert fixes' },
//   { icon: Monitor,    title: 'Screen Replacement',  price: 'From ₹599',   desc: 'OEM-quality display swaps' },
//   { icon: Battery,    title: 'Battery Replacement', price: 'From ₹499',   desc: 'Restore full-day battery life' },
//   { icon: Droplets,   title: 'Water Damage',        price: 'From ₹799',   desc: 'Advanced board-level repair' },
//   { icon: Laptop,     title: 'Laptop Repair',       price: 'From ₹999',   desc: 'Hardware & software solutions' },
//   { icon: HardDrive,  title: 'Data Recovery',       price: 'From ₹1,499', desc: 'Recover files you thought were lost' },
// ];

// const steps = [
//   { num: '01', title: 'Book',     desc: 'Choose your device and issue online in minutes' },
//   { num: '02', title: 'Pickup',   desc: 'We collect from your doorstep — completely free' },
//   { num: '03', title: 'Repair',   desc: 'Certified technicians fix it with genuine parts' },
//   { num: '04', title: 'Delivery', desc: 'Device returned fully repaired, same-day possible' },
// ];

// const trackerSteps = [
//   { label: 'Booked',             done: true  },
//   { label: 'Picked Up',          done: true  },
//   { label: 'Repair In Progress', done: false, active: true },
//   { label: 'Ready',              done: false },
//   { label: 'Delivered',          done: false },
// ];

// const trustBadges = [
//   { icon: Clock,  title: '48hr Turnaround',      desc: '90-day warranty on every part & job.' },
//   { icon: Shield, title: '90-Day Warranty',       desc: '90-day warranty on every part & job.' },
//   { icon: Award,  title: 'Certified Technicians', desc: 'OEM-grade components, trained hands.' },
//   { icon: Truck,  title: 'Free Pickup',           desc: 'Zero-cost doorstep pickup & delivery.' },
// ];

// const testimonials = [
//   { name: 'Rahul P.',  area: 'Dharampeth',  rating: 5, comment: 'Got my iPhone screen fixed in 3 hours. Amazing quality!' },
//   { name: 'Priya S.',  area: 'Sitabuldi',   rating: 5, comment: 'Free pickup and delivery made it so convenient. 5 stars!' },
//   { name: 'Amit K.',   area: 'Wardha Road', rating: 4, comment: 'Best repair shop in Nagpur. My Samsung works like new.' },
// ];

// const footerLinks = {
//   Services: ['Smartphone Repair', 'Screen Replacement', 'Battery Replacement', 'Water Damage Repair', 'Laptop Repair'],
//   Company:  ['About Us', 'How It Works', 'Careers', 'Contact'],
//   Support:  ['Track Repair', 'Sell E-Waste', 'Warranty Policy', 'FAQs'],
// };

// /* ─────────────────────────────────────────
//    GLOBAL BACKGROUND PHONE ANIMATION
//    Sticky behind the ENTIRE page content.
//    Canvas sits in a fixed layer, faded out.
// ───────────────────────────────────────── */
// function GlobalPhoneBackground() {
//   const canvasRef  = useRef<HTMLCanvasElement>(null);
//   const imagesRef  = useRef<HTMLImageElement[]>([]);
//   const frameRef   = useRef(0);
//   const [loaded, setLoaded] = useState(false);

//   // Use whole-page scroll progress
//   const { scrollYProgress } = useScroll();

//   // Preload frames
//   useEffect(() => {
//     const imgs: HTMLImageElement[] = [];
//     let done = 0;
//     for (let i = 1; i <= TOTAL_FRAMES; i++) {
//       const img = new Image();
//       img.src   = `/iphone-frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
//       img.onload = () => {
//         done++;
//         if (done === TOTAL_FRAMES) setLoaded(true);
//       };
//       imgs[i - 1] = img;
//     }
//     imagesRef.current = imgs;
//   }, []);

//   // Draw on scroll
//   useEffect(() => {
//     if (!loaded) return;
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const draw = (idx: number) => {
//       const img = imagesRef.current[idx];
//       if (!img) return;
//       canvas.width  = img.naturalWidth;
//       canvas.height = img.naturalHeight;
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(img, 0, 0);
//     };

//     draw(0);

//     const unsub = scrollYProgress.on('change', (v) => {
//       const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(v * TOTAL_FRAMES));
//       if (idx !== frameRef.current) {
//         frameRef.current = idx;
//         draw(idx);
//       }
//     });
//     return () => unsub();
//   }, [loaded, scrollYProgress]);

//   return (
//     /*
//       fixed layer — sits behind everything (z-0).
//       pointer-events: none so it never blocks clicks.
//     */
//     <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
//       <canvas
//         ref={canvasRef}
//         style={{
//           height: '90vh',
//           width: 'auto',
//           maxWidth: '100vw',
//           objectFit: 'contain',
//           opacity: loaded ? 1 : 0,
//           transition: 'opacity 0.6s ease',
//         }}
//       />
//     </div>
//   );
// }

// /* ─────────────────────────────────────────
//    HERO SECTION
// ───────────────────────────────────────── */
// function HeroSection() {
//   return (
//     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent">
//       {/* Diagonal orange accent block */}
//       <div
//         className="absolute top-0 right-0 w-[55%] h-full bg-[#FF5C00] pointer-events-none"
//         style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
//       />

//       {/* Dot grid overlay on orange */}
//       <div
//         className="absolute top-0 right-0 w-[55%] h-full opacity-[0.06] pointer-events-none"
//         style={{
//           clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
//           backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
//           backgroundSize: '28px 28px',
//         }}
//       />

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-0 pt-24 pb-16 w-full">
//         {/* Left content */}
//         <div className="flex-1 text-center lg:text-left pr-0 lg:pr-12">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/25 text-[#FF5C00] text-xs font-bold tracking-widest uppercase mb-6"
//           >
//             <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
//             Now serving all of Nagpur
//           </motion.div>

//           <motion.h1
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[#1A1A1A] leading-[1.0] tracking-tight"
//           >
//             Nagpur&apos;s<br />
//             Most <span className="text-[#FF5C00]">Trusted</span><br />
//             Repair Hub
//           </motion.h1>

//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.3 }}
//             className="mt-6 text-sm sm:text-base text-[#1A1A1A]/50 max-w-md mx-auto lg:mx-0 leading-relaxed"
//           >
//             Professional smartphone, laptop &amp; gadget repairs with free doorstep
//             pickup, real-time tracking, and a 90-day warranty across Nagpur.
//           </motion.p>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.45 }}
//             className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
//           >
//             <Link
//               href={COMING_SOON}
//               className="bg-[#FF5C00] hover:bg-[#e05200] px-8 py-4 rounded-xl text-base font-bold text-white transition-colors flex items-center gap-2 shadow-[0_8px_30px_rgba(255,92,0,0.3)]"
//             >
//               Book a Repair
//               <ArrowRight className="w-4 h-4" />
//             </Link>
//             <Link
//               href={COMING_SOON}
//               className="px-8 py-4 rounded-xl text-base font-semibold text-[#1A1A1A] border-2 border-[#1A1A1A]/15 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all flex items-center gap-2"
//             >
//               <Search className="w-4 h-4" />
//               Track My Repair
//             </Link>
//           </motion.div>

//           {/* Stats row */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.6, delay: 0.6 }}
//             className="mt-12 flex items-center gap-8 justify-center lg:justify-start"
//           >
//             {[
//               { val: '5000+',  label: 'Repairs Done' },
//               { val: '48hr',   label: 'Avg Turnaround' },
//               { val: '90-Day', label: 'Warranty' },
//             ].map((s) => (
//               <div key={s.val} className="text-center lg:text-left">
//                 <div className="text-2xl font-black text-[#FF5C00]">{s.val}</div>
//                 <div className="text-xs text-[#1A1A1A]/40 font-medium mt-0.5">{s.label}</div>
//               </div>
//             ))}
//           </motion.div>
//         </div>

//         {/* Right - phone mockup */}
//         <motion.div
//           initial={{ opacity: 0, x: 40 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           className="flex-shrink-0 relative z-10"
//         >
//           <div className="relative animate-float">
//             <div className="absolute -inset-4 bg-black/10 rounded-[50px] blur-[40px]" />
//             <div className="relative w-[220px] sm:w-[260px] h-[440px] sm:h-[520px] bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-2xl">
//               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#F7F7F5] rounded-b-2xl z-10" />
//               <div className="absolute inset-2 top-8 rounded-[32px] overflow-hidden bg-[#F7F7F5] flex flex-col">
//                 <div className="bg-[#FF5C00] p-4 flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
//                     <Wrench className="w-4 h-4 text-white" />
//                   </div>
//                   <div>
//                     <p className="text-white text-xs font-bold">CellCureHub</p>
//                     <p className="text-white/70 text-[10px]">Repair in progress</p>
//                   </div>
//                 </div>
//                 <div className="flex-1 p-4 space-y-3">
//                   <div className="bg-white rounded-xl p-3 border border-[#E8E4DF]">
//                     <p className="text-[10px] text-[#1A1A1A]/40 mb-1">iPhone 14 Pro • Screen</p>
//                     <div className="w-full h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
//                       <div className="h-full w-[60%] bg-[#FF5C00] rounded-full" />
//                     </div>
//                     <p className="text-[10px] text-[#FF5C00] font-bold mt-1">60% Complete</p>
//                   </div>
//                   {['Booked', 'Picked Up', 'Repairing'].map((s, i) => (
//                     <div key={s} className="flex items-center gap-2">
//                       <div className={cn(
//                         'w-2.5 h-2.5 rounded-full',
//                         i < 2 ? 'bg-[#FF5C00]' : 'bg-[#FF5C00] animate-pulse'
//                       )} />
//                       <span className={cn(
//                         'text-xs',
//                         i < 2 ? 'text-[#1A1A1A]/50' : 'text-[#FF5C00] font-semibold'
//                       )}>{s}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    SERVICES
// ───────────────────────────────────────── */
// function ServicesGrid() {
//   return (
//     <section id="services" className="relative py-20 sm:py-28 bg-[#F7F7F5]/20 backdrop-blur-[2px]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
//           className="mb-14"
//         >
//           <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">What we fix</span>
//           <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
//             Our <span className="text-[#FF5C00]">Services</span>
//           </h2>
//           <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">
//             From cracked screens to dead batteries — fixed with genuine parts and certified expertise.
//           </p>
//         </motion.div>

//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
//           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
//         >
//           {services.map((s) => {
//             const Icon = s.icon;
//             return (
//               <Link href={COMING_SOON} key={s.title}>
//                 <motion.div
//                   variants={staggerItem}
//                   whileHover={{ y: -4, transition: { duration: 0.2 } }}
//                   className="group bg-white/20 backdrop-blur-[2px] border border-[#E8E4DF] rounded-2xl p-6 sm:p-8 hover:border-[#FF5C00]/40 hover:shadow-[0_8px_30px_rgba(255,92,0,0.08)] transition-all duration-300 cursor-pointer h-full"
//                 >
//                   <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mb-5 group-hover:bg-[#FF5C00] transition-colors duration-300">
//                     <Icon className="w-6 h-6 text-[#FF5C00] group-hover:text-white transition-colors duration-300" />
//                   </div>
//                   <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{s.title}</h3>
//                   <p className="text-sm text-[#1A1A1A]/40 mb-4">{s.desc}</p>
//                   <p className="text-[#FF5C00] font-black text-sm">{s.price}</p>
//                 </motion.div>
//               </Link>
//             );
//           })}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    HOW IT WORKS
// ───────────────────────────────────────── */
// function HowItWorks() {
//   return (
//     <section id="how-it-works" className="relative py-20 sm:py-28 bg-white/20 backdrop-blur-[2px] overflow-hidden">
//       <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-[280px] font-black text-[#FF5C00]/[0.04] leading-none select-none pointer-events-none">
//         HOW
//       </div>
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
//           className="mb-14"
//         >
//           <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Simple process</span>
//           <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
//             How It <span className="text-[#FF5C00]">Works</span>
//           </h2>
//           <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">Getting your device repaired has never been this simple.</p>
//         </motion.div>

//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
//           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
//         >
//           {steps.map((step, i) => (
//             <motion.div key={step.num} variants={staggerItem} className="relative">
//               {i < steps.length - 1 && (
//                 <motion.div
//                   initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
//                   viewport={{ once: true }}
//                   transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
//                   className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#FF5C00]/40 to-[#FF5C00]/10 origin-left"
//                 />
//               )}
//               <div className="text-4xl font-black text-[#FF5C00]/15 mb-3">{step.num}</div>
//               <h3 className="text-lg font-black text-[#1A1A1A] mb-2">{step.title}</h3>
//               <p className="text-sm text-[#1A1A1A]/40 leading-relaxed">{step.desc}</p>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    LIVE TRACKER TEASER
// ───────────────────────────────────────── */
// function LiveTrackerTeaser() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-[#F7F7F5]/20 backdrop-blur-[2px]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="relative bg-[#1A1A1A] rounded-3xl p-8 sm:p-12 overflow-hidden">
//           <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF5C00]/20 rounded-full blur-[80px] pointer-events-none" />
//           <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
//             <motion.div
//               initial="hidden" whileInView="visible"
//               viewport={{ once: true }} variants={fadeUp}
//               className="flex-1"
//             >
//               <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Real-time</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
//                 Track Your Repair <span className="text-[#FF5C00]">Live</span>
//               </h2>
//               <p className="mt-3 text-white/40 max-w-md text-sm leading-relaxed">
//                 Know exactly where your device is in the repair pipeline — real-time updates, every step of the way.
//               </p>
//               <Link
//                 href={COMING_SOON}
//                 className="mt-6 inline-flex items-center gap-2 bg-[#FF5C00] hover:bg-[#e05200] px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
//               >
//                 Track Your Repair
//                 <ChevronRight className="w-4 h-4" />
//               </Link>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
//               viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
//               className="flex-1 w-full max-w-md"
//             >
//               <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <p className="text-xs text-white/30">Repair ID</p>
//                     <p className="text-sm font-mono text-white">#CCH-20241087</p>
//                   </div>
//                   <span className="text-xs px-3 py-1 rounded-full bg-[#FF5C00]/15 text-[#FF5C00] font-bold">In Progress</span>
//                 </div>
//                 <p className="text-xs text-white/30 mb-1">Device</p>
//                 <p className="text-sm text-white mb-5">iPhone 14 Pro — Screen Replacement</p>
//                 <div className="space-y-4">
//                   {trackerSteps.map((step, i) => (
//                     <div key={step.label} className="flex items-start gap-3">
//                       <div className="flex flex-col items-center">
//                         <div className={cn(
//                           'w-3 h-3 rounded-full border-2',
//                           step.done   ? 'bg-[#FF5C00] border-[#FF5C00]' :
//                           step.active ? 'bg-[#FF5C00] border-[#FF5C00] animate-pulse' :
//                                         'bg-transparent border-white/20'
//                         )} />
//                         {i < trackerSteps.length - 1 && (
//                           <div className={cn('w-px h-6', step.done ? 'bg-[#FF5C00]/50' : 'bg-white/10')} />
//                         )}
//                       </div>
//                       <span className={cn(
//                         'text-sm -mt-0.5',
//                         step.done   ? 'text-white/60' :
//                         step.active ? 'text-[#FF5C00] font-semibold' :
//                                       'text-white/25'
//                       )}>{step.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    WHY CHOOSE US
// ───────────────────────────────────────── */
// function WhyChooseUs() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-white/20 backdrop-blur-[2px]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
//           className="mb-14"
//         >
//           <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Our promise</span>
//           <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
//             Why Choose <span className="text-[#FF5C00]">CellCureHub</span>
//           </h2>
//           <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">We go the extra mile to earn your trust.</p>
//         </motion.div>

//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
//           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
//         >
//           {trustBadges.map((badge, i) => {
//             const Icon = badge.icon;
//             return (
//               <motion.div
//                 key={badge.title} variants={staggerItem}
//                 className={cn(
//                   'rounded-2xl p-6 sm:p-8',
//                   i === 0
//                     ? 'bg-[#FF5C00] text-white'
//                     : 'bg-white/15 backdrop-blur-[2px] border border-[#E8E4DF]'
//                 )}
//               >
//                 <div className={cn(
//                   'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
//                   i === 0 ? 'bg-white/20' : 'bg-[#FF5C00]/10'
//                 )}>
//                   <Icon className={cn('w-6 h-6', i === 0 ? 'text-white' : 'text-[#FF5C00]')} />
//                 </div>
//                 <h3 className={cn('text-base font-black mb-2', i === 0 ? 'text-white' : 'text-[#1A1A1A]')}>
//                   {badge.title}
//                 </h3>
//                 <p className={cn('text-sm leading-relaxed', i === 0 ? 'text-white/80' : 'text-[#1A1A1A]/50')}>
//                   {badge.desc}
//                 </p>
//               </motion.div>
//             );
//           })}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    TESTIMONIALS
// ───────────────────────────────────────── */
// function Testimonials() {
//   return (
//     <section className="relative py-20 sm:py-28 bg-[#F7F7F5]/20 backdrop-blur-[2px]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
//           className="mb-14"
//         >
//           <span className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">Reviews</span>
//           <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mt-2">
//             What Our <span className="text-[#FF5C00]">Customers Say</span>
//           </h2>
//           <p className="mt-3 text-[#1A1A1A]/50 max-w-xl">Real reviews from real Nagpur residents.</p>
//         </motion.div>

//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}
//           className="grid grid-cols-1 md:grid-cols-3 gap-5"
//         >
//           {testimonials.map((t) => (
//             <motion.div
//               key={t.name} variants={staggerItem}
//               className="bg-white/20 backdrop-blur-[2px] border border-[#E8E4DF] rounded-2xl p-6 sm:p-8 hover:border-[#FF5C00]/30 hover:shadow-[0_8px_30px_rgba(255,92,0,0.06)] transition-all"
//             >
//               <div className="flex gap-1 mb-4">
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-[#FF5C00] fill-[#FF5C00]' : 'text-[#E8E4DF]')} />
//                 ))}
//               </div>
//               <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-6">&ldquo;{t.comment}&rdquo;</p>
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-full bg-[#FF5C00]/10 flex items-center justify-center text-[#FF5C00] font-black text-sm">
//                   {t.name.charAt(0)}
//                 </div>
//                 <div>
//                   <p className="text-sm font-bold text-[#1A1A1A]">{t.name}</p>
//                   <p className="text-xs text-[#1A1A1A]/40">{t.area}</p>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    GO GREEN
// ───────────────────────────────────────── */
// function GoGreenSection() {
//   return (
//     <section id="go-green" className="relative py-20 sm:py-28 bg-white/20 backdrop-blur-[2px]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           initial="hidden" whileInView="visible"
//           viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
//           className="relative bg-[#FF5C00] rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden text-center"
//         >
//           <div
//             className="absolute inset-0 opacity-[0.08] pointer-events-none"
//             style={{
//               backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
//               backgroundSize: '24px 24px',
//             }}
//           />
//           <div className="relative">
//             <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6">
//               Eco-Friendly Initiative
//             </span>
//             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
//               Turn Your Dead Phone<br />Into <span className="underline decoration-white/40">Cash</span>
//             </h2>
//             <p className="mt-4 text-white/80 max-w-lg mx-auto text-sm leading-relaxed">
//               Don&apos;t throw away broken devices. Sell your e-waste through our certified portal —
//               responsible recycling, fair value, zero hassle.
//             </p>
//             <Link
//               href={COMING_SOON}
//               className="mt-8 inline-flex items-center gap-2 bg-white px-8 py-3.5 rounded-xl text-base font-black text-[#FF5C00] hover:bg-[#F7F7F5] transition-colors"
//             >
//               Sell E-Waste
//               <ArrowRight className="w-4 h-4" />
//             </Link>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ─────────────────────────────────────────
//    FOOTER
// ───────────────────────────────────────── */
// function UpdatedFooter() {
//   return (
//     <footer className="bg-[#1A1A1A] pt-16 pb-8 relative z-10">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
//           <div>
//             <div className="flex items-center gap-2 mb-4">
//               <div className="w-9 h-9 rounded-xl bg-[#FF5C00] flex items-center justify-center">
//                 <Phone className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-white font-black text-lg">Cell<span className="text-[#FF5C00]">Cure</span>Hub</span>
//             </div>
//             <p className="text-white/30 text-sm leading-relaxed mb-6">
//               Nagpur&apos;s most trusted gadget repair hub. Free pickup, 48hr turnaround, 90-day warranty.
//             </p>
//             <Link
//               href={COMING_SOON}
//               className="inline-flex items-center gap-2 bg-[#FF5C00] hover:bg-[#e05200] px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
//             >
//               Book a Repair <ArrowRight className="w-4 h-4" />
//             </Link>
//           </div>

//           {Object.entries(footerLinks).map(([heading, links]) => (
//             <div key={heading}>
//               <h4 className="text-white font-black text-sm mb-4">{heading}</h4>
//               <ul className="space-y-2.5">
//                 {links.map((link) => (
//                   <li key={link}>
//                     <Link href={COMING_SOON} className="text-white/30 hover:text-[#FF5C00] text-sm transition-colors">
//                       {link}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
//           <p className="text-white/20 text-xs">© 2024 CellCureHub. All rights reserved.</p>
//           <div className="flex gap-6">
//             {['Privacy Policy', 'Terms of Service'].map((item) => (
//               <Link key={item} href={COMING_SOON} className="text-white/20 hover:text-white/50 text-xs transition-colors">{item}</Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }

// /* ─────────────────────────────────────────
//    MAIN PAGE
// ───────────────────────────────────────── */
// export default function Home() {
//   return (
//     <>
//       {/*
//         Phone animation fixed in background — z-0.
//         Renders once, updates frame on page scroll.
//         All page sections sit above it with z-10.
//       */}
//       <GlobalPhoneBackground />

//       <main className="relative z-10 bg-transparent text-[#1A1A1A]">
//         <Navbar />
//         <HeroSection />
//         <ServicesGrid />
//         <HowItWorks />
//         <LiveTrackerTeaser />
//         <WhyChooseUs />
//         <Testimonials />
//         <GoGreenSection />
//         <UpdatedFooter />
//       </main>
//     </>
//   );
// }