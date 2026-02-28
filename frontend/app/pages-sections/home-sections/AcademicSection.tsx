"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
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

const programs = [
    {
        id: 1,
        category: 'Kindergarten',
        title: 'Kindergarten',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Placeholder
        description: 'Global education system has become one of our early childhood program focuses on "Learning through Play." We prioritize...'
    },
    {
        id: 2,
        category: 'Elementary',
        title: 'Elementary',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Placeholder
        description: 'Global education system has become one of our early childhood program focuses on "Learning through Play." We prioritize...'
    },
    {
        id: 3,
        category: 'Junior High',
        title: 'Junior High',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Placeholder
        description: 'Global education system has become one of our early childhood program focuses on "Learning through Play." We prioritize...'
    },
    {
        id: 4,
        category: 'Vocational Training',
        title: 'Vocational Training',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Placeholder
        description: 'Global education system has become one of our early childhood program focuses on "Learning through Play." We prioritize...'
    },
    {
        id: 5,
        category: 'Senior High',
        title: 'Senior High',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Placeholder
        description: 'Preparing students for higher education and career success with rigorous academic programs.'
    }
];

const categories = ["All Programs", "Kindergarten", "Elementary", "Junior High", "Senior High", "Vocational Training"];

export default function AcademicSection() {
    const [activeTab, setActiveTab] = useState("All Programs");
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const containerRef = useRef<HTMLElement>(null);

    const filteredPrograms = activeTab === "All Programs"
        ? programs
        : programs.filter(p => p.category === activeTab);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".academic-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .fromTo(".academic-tabs .button",
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" },
                "-=0.4"
            )
            .fromTo(".academic-swiper .swiper-slide",
                { y: 50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 1, stagger: 0.2, ease: "power3.out" },
                "-=0.4"
            );

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="overflow-clip py-[clamp(20px,5vw,80px)] bg-primary h-full text-white overflow-hidden">
            <div className="container mx-auto h-full max-w-1920 px-5 md:px-[clamp(20px,3vw,60px)]">
                {/* Header */}
                <div className='w-full h-full mb-14 max-md:mb-6'>
                    <div className="academic-header flex flex-col md:flex-row justify-between items-start md:items-end pb-5 md:mb-12 gap-8">
                        <div className="md:max-w-2xl">
                            <h2 className="text-[clamp(22px,4vw,50px)] font-bold mb-6">Our Academic Programs</h2>
                            <p className="text-[#E6ECFFB2] text-[clamp(18px,2vw,20px)] leading-relaxed">
                                From the first steps in our Kindergarten to the specialized skills of Vocational Training, our school provides a holistic and continuous learning journey. We are dedicated to nurturing academic excellence, character development, and practical expertise to prepare students for the challenges of the 21st century.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="group/prev rounded-full cursor-pointer h-12 w-12 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white border-0"
                                    onClick={() => swiperInstance?.slidePrev()}
                                >
                                    <ArrowLeft className="h-5 w-5 group-hover/prev:-translate-x-1 transition-all duration-500" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="group/next rounded-full cursor-pointer h-12 w-12 border-white/30 bg-white text-primary hover:bg-white/90 hover:text-primary border-0"
                                    onClick={() => swiperInstance?.slideNext()}
                                >
                                    <ArrowRight className="h-5 w-5 group-hover/next:translate-x-1 transition-all duration-500" />
                                </Button>
                            </div>
                            <Link href="/academic" className="group/all relative flex lg:hover:text-white items-center gap-2 text-white/80 duration-500 font-medium lg:before:absolute lg:before:w-0 lg:before:h-[1px] lg:before:bottom-[-2px] lg:before:left-0 lg:hover:before:w-full lg:before:bg-white lg:before:transition-all lg:before:duration-500 ml-4">
                                All Programs <ArrowUpRight className="h-4 w-4 lg:group-hover/all:rotate-45 transition-all  lg:group-hover/all:text-white text-white/80 duration-500" />
                            </Link>
                        </div>
                    </div>

                    {/* Tabs */}

                    <div className="academic-tabs flex items-center justify-start gap-x-8 border-b border-white/20 overflow-x-auto [-webkit-overflow-scrolling:touch] scrollbar-thin pb-2 sm:pb-[17px]">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`button text-nowrap h-fit cursor-pointer text-base h-full font-medium transition-all duration-500 relative py-2 after:duration-500 sm:after:absolute sm:after:bottom-[-17px] after:left-0 after:w-0 after:h-[2px] after:bg-white 
                                ${activeTab === cat ? 'text-white opacity-100  sm:after:w-full duration-500 after:duration-500' : 'text-white/60 lg:hover:text-white'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>


                {/* Swiper */}
                <Swiper
                    onSwiper={setSwiperInstance}
                    modules={[Navigation, Autoplay]}
                    spaceBetween={24}
                    slidesPerView={1.1}
                    breakpoints={{
                        640: {
                            slidesPerView: 2.1,
                        },
                        1024: {
                            slidesPerView: 2.5,
                        },
                        1300: {
                            slidesPerView: 4,
                        },
                    }}
                    className="academic-swiper w-full !overflow-visible"
                >
                    {filteredPrograms.map((program) => (
                        <SwiperSlide key={program.id} className="h-full">
                            <a href='/academic' className='block w-full h-full'>
                            <div className="group/card bg-white rounded-[15px] p-3 overflow-hidden h-[501px] max-sm:h-[400px] flex flex-col group cursor-pointer transition-transform duration-300">
                                <div className=" relative h-60 max-xs:h-[220px] w-full overflow-hidden rounded-[12px]">
                                    <Image
                                        src={program.image}
                                        alt={program.title}
                                        fill
                                        className="object-cover transition-transform duration-500 lg:group-hover/card:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                                </div>

                                <div className="pb-6  pt-3 flex flex-col flex-grow text-primary">
                                    <h3 className="text-[clamp(20px,2vw,25px)] font-semibold mb-3 line-clamp-2">{program.title}</h3>
                                    <p className="text-[#4B5563] text-[clamp(16px,1.5vw,18px)] line-clamp-3 leading-relaxed mb-6 flex-grow">
                                        {program.description}
                                    </p>

                                    <div className="mt-auto">
                                        <Button className="w-full rounded-full font-bold bg-[#2857AE]/10 lg:hover:bg-primary lg:hover:text-white text-primary text-[clamp(16px,1.5vw,18px)] italic font-bold transition-all duration-500 border border-primary">
                                            Explore Curriculum
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            </a>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
