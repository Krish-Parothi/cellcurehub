
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
   ROUTES
───────────────────────────────────────── */
const COMING_SOON  = '/coming-soon'; // fallback for unimplemented links
const ROUTE_BOOK   = '/book';
const ROUTE_TRACK  = '/track';
const ROUTE_EWASTE = '/ewaste';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const TOTAL_FRAMES = 22;

const services = [
  { icon: Smartphone, title: 'Smartphone Repair',   price: 'From ₹299',   desc: 'Android & iOS expert fixes' },
  { icon: Monitor,    title: 'Screen Replacement',  price: 'From ₹599',   desc: 'OEM-quality display swaps' },
  { icon: Battery,    title: 'Battery Replacement', price: 'From ₹499',   desc: 'Restore full-day battery life' },
  { icon: Droplets,   title: 'Water Damage',        price: 'From ₹799',   desc: 'Advanced board-level repair' },
  { icon: Laptop,     title: 'Laptop Repair',       price: 'From ₹999',   desc: 'Hardware & software solutions' },
  { icon: HardDrive,  title: 'Data Recovery',       price: 'From ₹1,499', desc: 'Recover files you thought were lost' },
];

const steps = [
  { num: '01', title: 'Book',     desc: 'Choose your device and issue online in minutes' },
  { num: '02', title: 'Pickup',   desc: 'We collect from your doorstep — completely free' },
  { num: '03', title: 'Repair',   desc: 'Certified technicians fix it with genuine parts' },
  { num: '04', title: 'Delivery', desc: 'Device returned fully repaired, same-day possible' },
];

const trackerSteps = [
  { label: 'Booked',             done: true  },
  { label: 'Picked Up',          done: true  },
  { label: 'Repair In Progress', done: false, active: true },
  { label: 'Ready',              done: false },
  { label: 'Delivered',          done: false },
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
   PART LABEL SUB-COMPONENTS
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

    drawFrame(0);

    const unsubscribe = scrollYProgress.on('change', (v) => {
      const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(v * TOTAL_FRAMES));
      if (idx !== frameRef.current) {
        frameRef.current = idx;
        drawFrame(idx);
      }
    });

    return () => unsubscribe();
  }, [loaded, scrollYProgress]);

  const labelOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const labelY       = useTransform(scrollYProgress, [0, 0.15], [20, 0]);
  const ctaOpacity   = useTransform(scrollYProgress, [0.8, 0.95], [0, 1]);
  const ctaY         = useTransform(scrollYProgress, [0.8, 0.95], [20, 0]);

  const partLabels = [
    { pct: 0.15, text: 'Titanium Frame',       side: 'left'  },
    { pct: 0.30, text: 'Ceramic Shield Glass', side: 'right' },
    { pct: 0.45, text: 'A19 Bionic Chip',      side: 'left'  },
    { pct: 0.60, text: 'MagSafe Battery',      side: 'right' },
    { pct: 0.75, text: 'Pro Camera System',    side: 'left'  },
    { pct: 0.90, text: 'Logic Board',          side: 'right' },
  ];

  return (
    <div ref={containerRef} className="relative" style={{ height: `${TOTAL_FRAMES * 120}px` }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0F0F0F] flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255,92,0,0.12) 0%, transparent 70%)' }}
        />

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

        {partLabels.filter(l => l.side === 'left').map((label) => (
          <PartLabelLeft key={label.text} scrollYProgress={scrollYProgress} pct={label.pct} text={label.text} />
        ))}
        {partLabels.filter(l => l.side === 'right').map((label) => (
          <PartLabelRight key={label.text} scrollYProgress={scrollYProgress} pct={label.pct} text={label.text} />
        ))}

        <div className="relative w-full max-w-xl px-4 flex items-center justify-center">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5C00] rounded-full transition-all duration-300" style={{ width: `${loadPct}%` }} />
              </div>
              <p className="text-white/40 text-xs mt-3">Loading {loadPct}%</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-auto object-contain"
            style={{ maxHeight: '75vh', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        </div>

        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none"
        >
          <p className="text-white/50 text-sm">Every component. Certified repair.</p>
        </motion.div>

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
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#fff7f2] to-[#fff1e8]" />
      <div className="absolute top-[-120px] right-[-120px] w-[420px] h-[420px] bg-[#FF5C00]/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16 pt-28 pb-20 w-full">
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold tracking-[0.2em] uppercase mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
            Now Serving All Of Nagpur
          </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            {/* ✅ /book */}
            <Link
              href={ROUTE_BOOK}
              className="w-full sm:w-auto justify-center bg-[#FF5C00] hover:bg-[#e05200] px-9 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 flex items-center gap-2 shadow-[0_10px_40px_rgba(255,92,0,0.35)]"
            >
              Book A Repair
              <ArrowRight className="w-4 h-4" />
            </Link>
            {/* ✅ /track */}
            <Link
              href={ROUTE_TRACK}
              className="w-full sm:w-auto justify-center px-9 py-4 rounded-2xl text-base font-semibold text-[#1A1A1A] border border-[#1A1A1A]/10 bg-white hover:border-[#FF5C00]/40 hover:text-[#FF5C00] transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              Track My Repair
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-14 flex flex-wrap items-center gap-10 justify-center lg:justify-start"
          >
            {[
              { value: '5000+',  label: 'Repairs Done' },
              { value: '48hr',   label: 'Avg Turnaround' },
              { value: '90-Day', label: 'Warranty' },
            ].map((item) => (
              <div key={item.value}>
                <div className="text-3xl font-black text-[#FF5C00]">{item.value}</div>
                <div className="text-sm text-[#1A1A1A]/45 mt-1 font-medium">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          <div className="relative w-full max-w-[560px]">
            <div className="absolute -inset-5 bg-[#FF5C00]/20 blur-[70px] rounded-[40px]" />
            <div className="relative overflow-hidden rounded-[36px] shadow-[0_30px_80px_rgba(0,0,0,0.18)] border border-white/50">
              <img
                src="/store-image.jpg"
                alt="CellCureHub Store"
                className="w-full h-[620px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/40">
                <p className="text-[#FF5C00] text-xs font-bold tracking-widest uppercase">CellCureHub</p>
                <p className="text-[#111111] text-sm font-semibold mt-1">Repair • Accessories • Trust</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

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
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
        >
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <Link href={COMING_SOON} key={s.title}>
                <motion.div
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white border border-[#E8E4DF] rounded-2xl p-4 sm:p-8 hover:border-[#FF5C00]/40 hover:shadow-[0_8px_30px_rgba(255,92,0,0.08)] transition-all duration-300 cursor-pointer h-full flex flex-col"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mb-3 sm:mb-5 group-hover:bg-[#FF5C00] transition-colors duration-300">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF5C00] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] mb-1 leading-tight">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#1A1A1A]/40 mb-3 sm:mb-4 flex-1">{s.desc}</p>
                  <p className="text-[#FF5C00] font-black text-xs sm:text-sm">{s.price}</p>
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
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8"
        >
          {steps.map((step, i) => (
            <motion.div key={step.num} variants={staggerItem} className="relative flex flex-col">
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
                  className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#FF5C00]/40 to-[#FF5C00]/10 origin-left"
                />
              )}
              <div className="text-3xl sm:text-4xl font-black text-[#FF5C00]/15 mb-2 sm:mb-3">{step.num}</div>
              <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] mb-1 sm:mb-2 leading-tight">{step.title}</h3>
              <p className="text-xs sm:text-sm text-[#1A1A1A]/40 leading-relaxed flex-1">{step.desc}</p>
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
              {/* ✅ /track */}
              <Link
                href={ROUTE_TRACK}
                className="mt-6 inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-[#FF5C00] hover:bg-[#e05200] px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
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
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
        >
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.title} variants={staggerItem}
                className={cn(
                  'rounded-2xl p-4 sm:p-8 flex flex-col h-full',
                  i === 0
                    ? 'bg-[#FF5C00] text-white'
                    : 'bg-[#F7F7F5] border border-[#E8E4DF]'
                )}
              >
                <div className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-5',
                  i === 0 ? 'bg-white/20' : 'bg-[#FF5C00]/10'
                )}>
                  <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', i === 0 ? 'text-white' : 'text-[#FF5C00]')} />
                </div>
                <h3 className={cn('text-sm sm:text-base font-black mb-1 sm:mb-2 leading-tight', i === 0 ? 'text-white' : 'text-[#1A1A1A]')}>
                  {badge.title}
                </h3>
                <p className={cn('text-xs sm:text-sm leading-relaxed flex-1', i === 0 ? 'text-white/80' : 'text-[#1A1A1A]/50')}>
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
            {/* ✅ /ewaste */}
            <Link
              href={ROUTE_EWASTE}
              className="mt-8 inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-white px-8 py-3.5 rounded-xl text-base font-black text-[#FF5C00] hover:bg-[#F7F7F5] transition-colors"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-10 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FF5C00] flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-lg">Cell<span className="text-[#FF5C00]">Cure</span>Hub</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed mb-6">
              Nagpur&apos;s most trusted gadget repair hub. Free pickup, 48hr turnaround, 90-day warranty.
            </p>
            {/* ✅ /book */}
            <Link
              href={ROUTE_BOOK}
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