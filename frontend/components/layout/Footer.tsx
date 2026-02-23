"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const socialLinks = [
  { name: "facebook", href: "#" },
  { name: "instagram", href: "#" },
  { name: "x", href: "#" },
  { name: "youtube", href: "#" },
  { name: "tiktok", href: "#" },
  { name: "whatsapp", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#2857AE] text-white pt-[clamp(20px,3vw,60px)] pb-[clamp(20px,3vw,40px)]">
      <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

        {/* Top Section: Logo & Subscription */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-[clamp(20px,3vw,40px)] pb-[clamp(20px,3vw,25px)]">
          <div className="flex items-center gap-4">
            {/* Placeholder Logo */}
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <Image
                src="/logo/fofana.png" // User can replace
                alt="A.M. Fofana Logo"
                width={100}
                height={100}
                className="object-contain"
              />
              {/* Fallback if no logo: A simple text or icon */}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">A.M. FOFANA</h2>
              <p className="text-xs md:text-sm text-white/80 tracking-widest uppercase">Islamic & English High School</p>
            </div>
          </div>

          {/* Subscription Form */}
          <div className="w-full max-w-md bg-white rounded-lg p-2 flex">
            <Input
              type="email"
              placeholder="Enter Your E-mail"
              className="border-0 bg-transparent text-black focus-visible:ring-0 placeholder:text-gray-400"
            />
            <Button className="bg-[#2857AE] hover:bg-[#1e4287] text-white px-6 py-2 rounded-md">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2  max-lg:pb-4 lg:grid-cols-5 gap-[clamp(20px,3.5vw,50px)] lg:gap-8  border-t border-white/20">

          {/* Column 1: About */}
          <div className="space-y-6 lg:col-span-2 py-5">
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Serving the community of Monrovia since 1977. We believe that education is the ultimate key to unlocking a bright future. Serving the community of Monrovia since 1977. We believe that education is the ultimate key to unlocking a bright future.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-white/60">Follow us on Social Media</p>
              <div className="flex gap-2 max-md:gap-2 pt-1">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`icon icon-${social.name} text-white/80 lg:hover:text-white transition-all h-8 w-8 flex items-center justify-center rounded-full border border-transparent duration-500 lg:hover:border-white/50`}
                  >
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
      
          <div className="lg:col-span-1 lg:border-l max-xs:hidden border-white/20 lg:flex lg:justify-center">
          <div className="lg:py-5 lg:px-5">
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4 max-sm:space-y-2 text-white/80 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Admission Requirements</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Tuition & Fees</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">School News</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Opportunities</Link></li>
            </ul>
            </div>
          </div>

          {/* Column 3: Academics */}
          
          <div className="lg:col-span-1 lg:border-l max-xs:hidden border-white/20 lg:flex lg:justify-center">
          <div className="lg:py-5 lg:px-5">
            <h3 className="text-xl font-bold mb-6">Academics</h3>
            <ul className="space-y-4 max-sm:space-y-2 text-white/80 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Curriculum</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Academic Calendar</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Programs</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Scholarships</Link></li>
            </ul>
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:col-span-1 lg:border-l border-white/20 lg:flex lg:justify-center">
          <div className="lg:py-5 lg:px-5">
            <h3 className="text-xl font-bold mb-6">Contact Us</h3>
            <div className="space-y-4 max-sm:space-y-2 text-white/80 text-sm leading-relaxed">
              <p>Fish Market Monrovia,<br /> Liberia.</p>
              <a href="tel:+23105457503232" className="block text-xl font-bold text-white hover:text-white/80 transition-colors">+231 054 575 032 32</a>
              <a href="mailto:info@amfofana.com" className="block hover:text-white transition-colors">info@amfofana.com</a>
            </div>
          </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-[clamp(10px,3vw,32px)] border-t border-white/10 text-center">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} A.M. Fofana Islamic & English High School. All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
