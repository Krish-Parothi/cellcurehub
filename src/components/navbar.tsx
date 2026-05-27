'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Search, ChevronRight, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const COMING_SOON = '/coming-soon';

const navLinks = [
  { label: 'Services',     href: '/#services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Track Repair', href: COMING_SOON },
  { label: 'E-Waste',      href: '/#go-green' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#E8E4DF] shadow-sm'
          : 'bg-white/90 backdrop-blur-md border-b border-[#E8E4DF]/60'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center shadow-[0_2px_8px_rgba(255,92,0,0.3)]">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-[#1A1A1A]">
              Cell<span className="text-[#FF5C00]">Cure</span>Hub
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#1A1A1A]/60 hover:text-[#FF5C00] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={COMING_SOON}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A]/60 hover:text-[#FF5C00] transition-colors"
            >
              <Search className="w-4 h-4" />
              Track
            </Link>

            {user ? (
              <>
                <Link
                  href={COMING_SOON}
                  className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors px-3 py-2 rounded-xl hover:bg-[#F7F7F5]"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FF5C00]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#FF5C00]" />
                    </div>
                  )}
                  <span>{user.full_name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  title="Log Out"
                  className="flex items-center justify-center p-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href={COMING_SOON}
                className="bg-[#FF5C00] hover:bg-[#e05200] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-[0_4px_14px_rgba(255,92,0,0.25)] hover:shadow-[0_4px_20px_rgba(255,92,0,0.4)]"
              >
                Book Repair
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={cn('block w-6 h-0.5 bg-[#1A1A1A] transition-all duration-300', mobileOpen && 'rotate-45 translate-y-2')} />
            <span className={cn('block w-6 h-0.5 bg-[#1A1A1A] transition-all duration-300', mobileOpen && 'opacity-0')} />
            <span className={cn('block w-6 h-0.5 bg-[#1A1A1A] transition-all duration-300', mobileOpen && '-rotate-45 -translate-y-2')} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-[#E8E4DF] overflow-hidden shadow-lg"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3 px-4 rounded-xl text-[#1A1A1A]/70 hover:text-[#FF5C00] hover:bg-[#FF5C00]/5 transition-colors font-medium text-sm"
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ))}

              <div className="pt-3 space-y-2 border-t border-[#E8E4DF] mt-2">
                {user ? (
                  <>
                    <Link
                      href={COMING_SOON}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl border border-[#E8E4DF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:border-[#FF5C00]/30 transition-colors text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="block w-full text-center py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={COMING_SOON}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl border border-[#E8E4DF] text-[#1A1A1A]/70 hover:border-[#FF5C00]/30 hover:text-[#FF5C00] transition-colors text-sm font-medium"
                    >
                      Track Repair
                    </Link>
                    <Link
                      href={COMING_SOON}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold transition-colors text-sm shadow-[0_4px_14px_rgba(255,92,0,0.25)]"
                    >
                      Book Repair
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}