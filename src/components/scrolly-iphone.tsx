'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const TOTAL_FRAMES = 40;

export function ScrollyIphone() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Load images
  useEffect(() => {
    let loadedCount = 0;
    const imgs: HTMLImageElement[] = [];
    
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = i.toString().padStart(3, '0');
      img.src = `/iphone-animated/ezgif-frame-${num}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setImages(imgs);
          setLoaded(true);
        }
      };
      imgs.push(img);
    }
  }, []);

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  const drawFrame = useCallback((index: number) => {
    if (!canvasRef.current || !images[index]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = images[index];
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio); // Cover
    
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000'; // Match JPG black background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(img, 0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  }, [images]);

  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (loaded) {
      drawFrame(Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(latest))));
    }
  });

  // Handle Resize & Initial Draw
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        if (loaded) {
          drawFrame(Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(frameIndex.get()))));
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded, drawFrame, frameIndex]);

  // Opacity transforms for text overlays
  const opacityHero = useTransform(scrollYProgress, [0, 0.05, 0.15], [1, 1, 0]);
  const opacityFeat1 = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], [0, 1, 1, 0]);
  const opacityFeat2 = useTransform(scrollYProgress, [0.45, 0.55, 0.65, 0.75], [0, 1, 1, 0]);
  const opacityFeat3 = useTransform(scrollYProgress, [0.70, 0.80, 0.90, 0.95], [0, 1, 1, 0]);
  const opacityFinal = useTransform(scrollYProgress, [0.90, 0.95, 1], [0, 1, 1]);

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#0A0A0A]">
      {!loaded && (
        <div className="sticky top-0 h-screen w-full bg-[#0A0A0A] flex flex-col items-center justify-center z-50">
          <Loader2 className="w-8 h-8 text-[#00D084] animate-spin mb-4" />
          <p className="text-white/60">Loading Experience...</p>
        </div>
      )}

      {loaded && (
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          {/* We use mix-blend-screen to make the black background of the JPG transparent against our dark theme */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-[#0A0A0A] pointer-events-none" />

          {/* 0% - Hero */}
          <motion.div 
            style={{ opacity: opacityHero }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-xs font-medium mb-6 pointer-events-auto"
            >
              <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
              Now serving all of Nagpur
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              Nagpur&apos;s Most Trusted <br />
              <span className="text-[#00D084]">Gadget Repair</span> Hub
            </h1>
            <p className="mt-4 text-lg text-white/50 font-medium">Fix It. Track It. Trust It.</p>
            <div className="pointer-events-auto">
              <Link
                href="/coming-soon"
                className="mt-8 inline-flex items-center gap-2 gradient-green px-8 py-3.5 rounded-xl text-base font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity"
              >
                Book Now
              </Link>
            </div>
          </motion.div>

          {/* 25% - Left aligned */}
          <motion.div
            style={{ opacity: opacityFeat1 }}
            className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-24 w-full md:w-1/2 pointer-events-none"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Expert <span className="text-[#00D084]">Precision</span>
            </h2>
            <p className="text-white/60 text-lg max-w-md">
              Every component is carefully examined. We disassemble, diagnose, and rebuild your device with OEM-grade accuracy to ensure a flawless experience.
            </p>
          </motion.div>

          {/* 50% - Right aligned */}
          <motion.div
            style={{ opacity: opacityFeat2 }}
            className="absolute inset-y-0 right-0 flex flex-col justify-center text-left md:text-right px-8 md:px-24 w-full md:w-1/2 items-start md:items-end pointer-events-none"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Genuine <span className="text-[#00D084]">Parts</span>
            </h2>
            <p className="text-white/60 text-lg max-w-md">
              No compromises on quality. Your gadget&apos;s internal architecture is restored with only the best components available in the market.
            </p>
          </motion.div>

          {/* 75% - Left aligned */}
          <motion.div
            style={{ opacity: opacityFeat3 }}
            className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-24 w-full md:w-1/2 pointer-events-none"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Power <span className="text-[#00D084]">Restored</span>
            </h2>
            <p className="text-white/60 text-lg max-w-md">
              From battery replacements to logic board micro-soldering, we ensure your device performs exactly like it did on day one.
            </p>
          </motion.div>

          {/* 90% - Center aligned CTA */}
          <motion.div
            style={{ opacity: opacityFinal }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
             <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Ready for a <span className="text-[#00D084]">Revival?</span>
            </h2>
            <div className="pointer-events-auto">
              <Link
                href="/coming-soon"
                className="gradient-green px-10 py-4 rounded-xl text-lg font-bold text-[#0A0A0A] hover:opacity-90 transition-opacity inline-block"
              >
                Book Your Repair Now
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
