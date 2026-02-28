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
        const mm = gsap.matchMedia();

        mm.add("(min-width: 769px)", () => {
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
        });

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="overflow-clip relative min-h-screen md:h-screen w-full bg-[#EBF3FF] flex flex-col justify-center items-center overflow-hidden py-[clamp(20px,3vw,40px)] md:py-0">

            {/* Background Logo (Fixed/Sticky Effect within Container) */}
            <div ref={bgRef} className="absolute max-sm:hidden inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 md:opacity-100">
                <div className="relative w-[300px] h-[300px] md:w-[600px] md:h-[600px]">
                    <Image
                        src="/logo/fofana.png"
                        alt="A.M. Fofana Seal"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* Content Container */}
            <div ref={contentRef} className="relative z-10 container max-w-[1920px] mx-auto px-5 md:px-[clamp(20px,5vw,60px)] flex flex-col items-center text-center">

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
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-6 w-full md:max-w-6xl">

                    {/* Card 1 */}
                    <div className="feature-card w-full flex flex-col gap-5 bg-gradient-to-t from-primary to-white backdrop-blur-md p-8 h-[354px] rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-[10px] bg-[radial-gradient(50%_50%_at_50%_50%,_#FFF_0%,_#2857AE_100%)] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="h-7 w-7 text-black" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[calmp(20px,3vw,25px)] font-bold line-clamp-2 text-black mb-3">Dual Curriculum</h3>
                            <div className="border-t border-white">
                                <p className="text-white pt-2 line-clamp-5 leading-relaxed text-sm">
                                    A unique English academic system perfectly combined with a strong, deep-rooted Islamic education for a balanced life.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Card 2 */}

                    <div className="feature-card flex w-full flex-col gap-5 bg-gradient-to-t from-primary to-white backdrop-blur-md p-8 h-[354px] rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-[10px] bg-[radial-gradient(50%_50%_at_50%_50%,_#FFF_0%,_#2857AE_100%)] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <HandHeart className="h-7 w-7 text-black" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[calmp(20px,3vw,25px)] font-bold line-clamp-2 text-black mb-3">Dual Curriculum</h3>
                            <div className="border-t border-white">
                                <p className="text-white pt-2 line-clamp-5 leading-relaxed text-sm">
                                    A unique English academic system perfectly combined with a strong, deep-rooted Islamic education for a balanced life.
                                </p>
                            </div>
                        </div>

                    </div>
                    {/* Card 3 */}
                    <div className="feature-card flex w-full flex-col gap-5 bg-gradient-to-t from-primary to-white backdrop-blur-md p-8 h-[354px] rounded-[20px] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-start text-left group">
                        <div className="w-14 h-14 rounded-[10px] bg-[radial-gradient(50%_50%_at_50%_50%,_#FFF_0%,_#2857AE_100%)] flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Home className="h-7 w-7 text-black" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[calmp(20px,3vw,25px)] font-bold line-clamp-2 text-black mb-3">Dual Curriculum</h3>
                            <div className="border-t border-white">
                                <p className="text-white pt-2 line-clamp-5 leading-relaxed text-sm">
                                    A unique English academic system perfectly combined with a strong, deep-rooted Islamic education for a balanced life.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
