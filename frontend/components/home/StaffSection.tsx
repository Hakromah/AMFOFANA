"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Navigation, Autoplay } from 'swiper/modules';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import 'swiper/css';
import 'swiper/css/navigation';

gsap.registerPlugin(ScrollTrigger);

const staffMembers = [
    {
        id: 1,
        name: "Sarah Mitchell",
        role: "Principal",
        email: "sarahmitchell@edu.lib",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Leading our institution with 15+ years of educational excellence. Committed to fostering innovation and academic achievement."
    },
    {
        id: 2,
        name: "Ms. Emily Chen",
        role: "Vice Principal",
        email: "emilychen@edu.lib",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Dedicated to student welfare and curriculum development. Ensuring a supportive and inclusive learning environment for all."
    },
    {
        id: 3,
        name: "Mr. David Ross",
        role: "Head of Science",
        email: "davidross@edu.lib",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Inspiring curiosity and scientific inquiry. Passionate about STEM education and hands-on learning experiences."
    },
    {
        id: 4,
        name: "Mrs. Lisa Wong",
        role: "Head of Arts",
        email: "lisawong@edu.lib",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Cultivating creativity and artistic expression. Believes in the power of arts to transform lives and perspectives."
    },
];

export default function StaffSection() {
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".staff-content > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".staff-swiper .swiper-slide", {
                x: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-[clamp(40px,5vw,100px)] bg-[#C7D4FF] text-white overflow-hidden">
            <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

                    {/* Left Content */}
                    <div className="staff-content w-full lg:w-1/3 flex flex-col items-start text-left">
                        <h2 className="text-[clamp(40px,5vw,60px)] font-bold mb-6 text-black">STAFF</h2>
                        <p className="text-white/90 text-lg leading-relaxed mb-10 max-w-md">
                            Stay updated with academic milestones, spiritual growth, and student achievements across all levels.
                        </p>

                        <div className="flex gap-4 mt-auto">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-14 w-14 bg-white/20 border-0 hover:bg-white text-white hover:text-black transition-colors"
                                onClick={() => swiperInstance?.slidePrev()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-14 w-14 bg-white text-black border-0 hover:bg-white/90 hover:scale-105 transition-transform"
                                onClick={() => swiperInstance?.slideNext()}
                            >
                                <ArrowRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Swiper */}
                    <div className="staff-swiper w-full lg:w-2/3 min-w-0">
                        <Swiper
                            onSwiper={setSwiperInstance}
                            modules={[Navigation, Autoplay]}
                            spaceBetween={30}
                            slidesPerView={1.2}
                            breakpoints={{
                                640: {
                                    slidesPerView: 2.2,
                                },
                                1024: {
                                    slidesPerView: 2.5, // See 2 full and a bit of 3rd
                                },
                                1280: {
                                    slidesPerView: 3,
                                }
                            }}
                            className="!overflow-visible py-10" // Padding for hover effects/shadows
                        >
                            {staffMembers.map((member) => (
                                <SwiperSlide key={member.id} className="h-auto">
                                    <div className="bg-gradient-to-b from-white via-[#8FACD8] to-[#2857AE] rounded-[30px] p-6 text-center h-full flex flex-col items-center group transition-transform duration-300 hover:-translate-y-2 shadow-lg">

                                        {/* Image Container */}
                                        <div className="relative w-32 h-32 mb-6 rounded-2xl overflow-hidden border-4 border-white/30 shadow-md">
                                            <Image
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                                        <div className="flex items-center justify-center gap-2 text-white/90 text-sm font-medium mb-1">
                                            <span className="w-4 h-[1px] bg-white/60"></span>
                                            {member.role}
                                        </div>
                                        <p className="text-white/70 text-xs mb-4">Email: {member.email}</p>

                                        <div className="w-full h-[1px] bg-white/20 mb-4"></div>

                                        <p className="text-white/90 text-sm leading-relaxed mb-4">
                                            {member.bio}
                                        </p>

                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                </div>
            </div>
        </section>
    );
}
