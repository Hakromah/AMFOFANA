"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { BookOpen, HandHeart, Home } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function WhyChooseUs() {
    const containerRef = useRef<HTMLElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=2500", // Drag out the animation duration
                scrub: 1,
                pin: true,
                anticipatePin: 1,
            }
        });

        // Initial States
        gsap.set(bgRef.current, { opacity: 0.05, scale: 0.8 });
        gsap.set([".section-title", ".section-subtitle"], { opacity: 0, y: 30 });
        gsap.set(".feature-card", { opacity: 0, y: 50 });

        tl
            // 1. Background Logo Scales up and fades in slightly
            .to(bgRef.current, { opacity: 0.1, scale: 1, duration: 1 })

            // 2. Title & Subtitle Fade In
            .to([".section-title", ".section-subtitle"], { opacity: 1, y: 0, stagger: 0.2, duration: 1 }, "-=0.5")

            // 3. Cards Stagger In
            .to(".feature-card", { opacity: 1, y: 0, stagger: 0.2, duration: 2 }, "-=0.5")

            // 4. Hold Phase (Animation pauses here while user scrolls a bit)
            .to({}, { duration: 2 })

            // 5. Content Fades OUT (Logo becomes fully visible)
            .to([".section-title", ".section-subtitle", ".feature-card"], { opacity: 0, y: -30, stagger: 0.1, duration: 2 })

            // Make logo full opacity as content leaves
            .to(bgRef.current, { opacity: 1, scale: 1.1, duration: 1.5 }, "-=1.5")

            // Hold the logo for a moment so user sees it clearly
            .to({}, { duration: 1.5 })

        // 6. Finally, Logo Fades OUT before unpinning 
        // .to(bgRef.current, { opacity: 0, scale: 1.2, duration: 1.5 });

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative h-screen w-full bg-[#EBF3FF] flex flex-col justify-center items-center overflow-hidden">

            {/* Background Logo (Fixed/Sticky Effect within Container) */}
            <div ref={bgRef} className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="relative w-[300px] h-[300px] md:w-[600px] md:h-[600px]">
                    <Image
                        src="/logo/fofana.png"
                        alt="A.M. Fofana Seal"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Content Container */}
            <div ref={contentRef} className="relative z-10 container mx-auto px-5 md:px-[clamp(20px,5vw,60px)] flex flex-col items-center text-center">

                {/* Header */}
                <div className="mb-12 space-y-4">
                    <span className="section-subtitle text-primary font-semibold tracking-wider uppercase text-sm md:text-base">Our Core Philosophy</span>
                    <h2 className="section-title text-[clamp(30px,4vw,50px)] font-bold text-[#021A4A] leading-tight">
                        Why Choose A.M. Fofana?
                    </h2>
                    <p className="section-subtitle text-[#4B5563] text-lg max-w-2xl mx-auto mt-4">
                        We focus on academic <span className="text-primary font-medium">excellence</span>, <span className="text-primary font-medium">strong discipline</span>, and <span className="text-primary font-medium">spiritual development</span> to shape the leaders of tomorrow.
                    </p>
                </div>

                {/* Cards Grid */}
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">

                    {/* Card 1 */}
                    <div className="feature-card bg-white/60 backdrop-blur-md border border-white/50 p-8 rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2857AE] to-[#1e4287] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-[#021A4A] mb-3">Dual Curriculum</h3>
                        <p className="text-[#4B5563] leading-relaxed text-sm">
                            A unique English academic system perfectly combined with a strong, deep-rooted Islamic education for a balanced life.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="feature-card bg-white/60 backdrop-blur-md border border-white/50 p-8 rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2857AE] to-[#1e4287] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <HandHeart className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-[#021A4A] mb-3">Discipline & Values</h3>
                        <p className="text-[#4B5563] leading-relaxed text-sm">
                            We nurture respect, responsibility, and leadership. Our students are taught to be upstanding citizens with strong moral character.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="feature-card bg-white/60 backdrop-blur-md border border-white/50 p-8 rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2857AE] to-[#1e4287] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Home className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-[#021A4A] mb-3">Safe Learning Environment</h3>
                        <p className="text-[#4B5563] leading-relaxed text-sm">
                            A supportive and secure campus where every student feels seen, heard, and valued. We prioritize mental and physical well-being.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
}
