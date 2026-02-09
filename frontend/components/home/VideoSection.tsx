"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
    const containerRef = useRef<HTMLElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top", // Start when section hits top of viewport
                end: "+=2000", // Scroll distance for the animation
                pin: true, // Pin the section
                scrub: 1, // Smooth scrubbing
                anticipatePin: 1
            }
        });

        // 0. Initial Title Animation (happens as we arrive or instantly if stuck)
        // Since we are pinning, let's make sure the title is visible/animated
        tl.fromTo(".video-title",
            { y: 50, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }
        );

        // 1. Scale Video from 75% to 100%
        tl.fromTo(videoContainerRef.current,
            {
                width: "75%",
                borderRadius: "2rem",
                height: "60%" // Start height
            },
            {
                width: "100%",
                height: "100%", // Grow to full screen height
                borderRadius: "0rem",
                duration: 4, // More scroll distance/duration
                ease: "power2.inOut"
            }
        );

        // 2. Reveal Text Overlay (after video is full width)
        tl.fromTo(".video-overlay-text",
            { y: 100, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 2, ease: "power2.out" }
        );

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="bg-white h-screen flex flex-col justify-center items-center relative overflow-hidden">
          

            <div className="w-full flex justify-center mb-8">
                <h2 className="video-title text-[clamp(30px,4vw,60px)] font-bold text-primary text-center">
                    The Excellence School
                </h2>
            </div>

            {/* Video Container */}
            <div
                ref={videoContainerRef}
                className="relative w-full  overflow-hidden mx-auto"
            >
                <video
                    src="/video/school-video.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="object-cover w-full h-full"
                />

                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Text Content Overlay */}
                <div className="absolute bottom-0 right-0 p-[clamp(20px,5vw,80px)] max-w-2xl text-white video-overlay-text">
                    <p className="text-sm md:text-base font-semibold uppercase tracking-widest mb-4 opacity-80">
                        A Message from the Leadership
                    </p>
                    <blockquote className="text-[clamp(18px,2vw,30px)] font-bold leading-tight mb-6">
                        &quot;Our mission is to ensure every student leaves our halls with both knowledge and wisdom.&quot;
                    </blockquote>
                    <p className="text-lg md:text-xl font-medium italic">
                        — Office of the Principal
                    </p>
                </div>
            </div>
        </section>
    );
}
