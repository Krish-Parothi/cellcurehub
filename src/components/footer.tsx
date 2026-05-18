'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';

const footerLinks = {
  services: [
    { label: 'Smartphone Repair', href: '/book' },
    { label: 'Screen Replacement', href: '/book' },
    { label: 'Battery Replacement', href: '/book' },
    { label: 'Water Damage Repair', href: '/book' },
    { label: 'Laptop Repair', href: '/book' },
    { label: 'Data Recovery', href: '/book' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  support: [
    { label: 'Track Repair', href: '/track' },
    { label: 'Sell E-Waste', href: '/#go-green' },
    { label: 'Warranty Policy', href: '/warranty' },
    { label: 'FAQs', href: '/faq' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#00D084] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <span className="text-xl font-bold text-white">
                Cell<span className="text-[#00D084]">Cure</span>Hub
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Nagpur&apos;s most trusted gadget repair hub. Professional repairs with
              free pickup, 48hr turnaround, and 90-day warranty.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 gradient-green px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] hover:opacity-90 transition-opacity"
            >
              Book a Repair
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-[#00D084] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-[#00D084] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-[#00D084] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} CellCureHub. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
