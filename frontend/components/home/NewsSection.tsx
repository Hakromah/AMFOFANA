"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
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

const newsItems = [
    {
        id: 1,
        date: "Jan 11, 2026",
        category: "Event",
        title: "Developing Critical Thinkers: The Annual Junior High Debate Cup",
        image: "https://images.unsplash.com/photo-1544531696-608eda5d6d8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "A display of brilliant minds as our Junior High students tackled complex global issues in our annual debate finals..."
    },
    {
        id: 2,
        date: "Jan 11, 2026",
        category: "Academics",
        title: "Scientific Breakthroughs: Students Present Research at State Fair",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Our young scientists showcased their innovative projects, earning top honors and recognition for their detailed research..."
    },
    {
        id: 3,
        date: "Jan 11, 2026",
        category: "Event",
        title: "Cultural Heritage Day: Celebrating Diversity on Campus",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Students and faculty came together to share traditions, food, and performances, fostering a deeper understanding of our global community..."
    },
    {
        id: 4,
        date: "Jan 11, 2026",
        category: "Sports",
        title: "Championship Victory: Soccer Team Takes the Trophy",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "In a thrilling final match, our varsity team demonstrated exceptional teamwork and determination to secure the regional championship..."
    },
     {
        id: 5,
        date: "Jan 11, 2026",
        category: "Event",
        title: "Developing Critical Thinkers: The Annual Junior High Debate Cup",
        image: "https://images.unsplash.com/photo-1544531696-608eda5d6d8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "A display of brilliant minds as our Junior High students tackled complex global issues in our annual debate finals..."
    },
    {
        id: 6,
        date: "Jan 11, 2026",
        category: "Academics",
        title: "Scientific Breakthroughs: Students Present Research at State Fair",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Our young scientists showcased their innovative projects, earning top honors and recognition for their detailed research..."
    },
    {
        id: 7,
        date: "Jan 11, 2026",
        category: "Event",
        title: "Cultural Heritage Day: Celebrating Diversity on Campus",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Students and faculty came together to share traditions, food, and performances, fostering a deeper understanding of our global community..."
    },
    {
        id: 8,
        date: "Jan 11, 2026",
        category: "Sports",
        title: "Championship Victory: Soccer Team Takes the Trophy",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "In a thrilling final match, our varsity team demonstrated exceptional teamwork and determination to secure the regional championship..."
    },
];

export default function NewsSection() {
    const containerRef = useRef<HTMLElement>(null);
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".news-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".news-swiper .swiper-slide", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-[clamp(40px,5vw,100px)] bg-white overflow-hidden">
            <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

                {/* Header Section */}
                <div className="news-header flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div>
                        <h2 className="text-[clamp(30px,4vw,50px)] font-bold text-black mb-4">
                            Latest from our Campus
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            Stay updated with academic milestones, spiritual growth, and student achievements across all levels.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                            <Button
                                ref={prevRef}
                                variant="outline"
                                size="icon"
                                className="rounded-full h-12 w-12 border-primary bg-primary text-white hover:bg-primary/90 hover:text-white border-0 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                ref={nextRef}
                                variant="outline"
                                size="icon"
                                className="rounded-full h-12 w-12 border-primary bg-primary text-white hover:bg-primary/90 hover:text-white border-0 transition-colors"
                            >
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/news" className="flex items-center gap-2 text-primary font-medium hover:underline">
                            All News <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Swiper */}
                <div className="news-swiper">
                    <Swiper
                        modules={[Navigation, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1.2}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onBeforeInit={(swiper) => {
                            // Assign refs to navigation params
                            if (typeof swiper.params.navigation !== 'boolean') {
                                const nav = swiper.params.navigation as any;
                                nav.prevEl = prevRef.current;
                                nav.nextEl = nextRef.current;
                            }
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2.2,
                            },
                            1024: {
                                slidesPerView: 3.2,
                            },
                            1280: {
                                slidesPerView: 4,
                            }
                        }}
                        className="!overflow-visible py-4"
                    >
                        {newsItems.map((item) => (
                            <SwiperSlide key={item.id} className="h-auto">
                                <div className="group cursor-pointer">
                                    {/* Image */}
                                    <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-6">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="text-gray-900">{item.date}</span>
                                            <span className="text-primary">•</span>
                                            <span className="text-primary">{item.category}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                            {item.title}
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                            {item.excerpt}
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

            </div>
        </section>
    );
}
