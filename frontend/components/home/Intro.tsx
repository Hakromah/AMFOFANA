"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Autoplay, Navigation, Controller, Parallax } from 'swiper/modules';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = [
    {
        title: "HIGH SCHOOL",
        subtitle: "Shaping the Leaders of Tomorrow",
        description: "Our high school program offers a rigorous curriculum designed to prepare students for top universities and future careers. We focus on critical thinking, creativity, and character development.",
        image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        title: "MODERN FACILITIES",
        subtitle: "State-of-the-Art Learning Environments",
        description: "A legacy of excellence in education. We provide a world-class environment where students are empowered to achieve their highest potential through rigorous academics and character development.",
        image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        title: "SPORTS & ARTS",
        subtitle: "Nurturing Talent Beyond Academics",
        description: "From championship-winning sports teams to award-winning art programs, we believe in holistic development. Discover your passion in our diverse extracurricular activities.",
        image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=2029&auto=format&fit=crop&ixlib=rb-4.0.3"
    }
];

export default function Intro() {
    const [firstSwiper, setFirstSwiper] = useState<SwiperType | null>(null);
    const [secondSwiper, setSecondSwiper] = useState<SwiperType | null>(null);

    return (
        <section className="w-full h-screen relative overflow-hidden">
            {/* Image Swiper (Background) */}
            <div className="absolute inset-0 w-full h-full">
                <Swiper
                    onSwiper={setSecondSwiper}
                    controller={{ control: firstSwiper }}
                    modules={[Controller, Parallax]}
                    loop={true}
                    speed={1000}
                    parallax={true}
                    className="w-full h-full"
                >
                    {slides.map((slide, index) => (
                        <SwiperSlide key={index} className="overflow-hidden">
                            <div className="relative w-full h-full" data-swiper-parallax="-23%">
                                <Image
                                    alt={slide.title}
                                    className="object-cover"
                                    fill
                                    src={slide.image}
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 bg-black/50" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Text Swiper (Foreground) */}
            <div className="container relative z-10 h-full flex flex-col justify-center px-4 md:px-6">
                <div className="max-w-2xl">
                    <Swiper
                        onSwiper={setFirstSwiper}
                        controller={{ control: secondSwiper }}
                        modules={[Controller, Autoplay, Navigation]}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        loop={true}
                        speed={1000}
                        allowTouchMove={false} // Prevent users from swiping text independently
                        className="w-full"
                    >
                        {slides.map((slide, index) => (
                            <SwiperSlide key={index}>
                                <div className="space-y-4 pr-4 py-8">
                                    <div className="space-y-4">
                                        <h1
                                            className="text-[clamp(40px,5vw,80px)] font-semibold leading-[clamp(45px,6vw,90px)] font-sans bg-clip-text text-transparent bg-[linear-gradient(90deg,#FFF_54.33%,#2857AE_100%)] pb-2"
                                        >
                                            {slide.subtitle}
                                        </h1>

                                        <p className="max-w-[600px] text-[clamp(16px,2vw,20px)] leading-[clamp(24px,3vw,30px)] font-normal font-sans text-white/70">
                                            {slide.description}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 pt-8">
                                        <Button size="lg" className="rounded-full cursor-pointer bg-primary hover:bg-primary/90 text-white h-12 px-8 text-lg">
                                            Explore More
                                        </Button>
                                        <Button variant="outline" size="lg" className="cursor-pointer rounded-full bg-transparent text-white border-white hover:bg-white/20 hover:text-white h-12 px-8 text-lg">
                                            Admissions
                                        </Button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Navigation Controls */}
                    <div className="flex gap-4 pt-8">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-white/50 bg-transparent text-white hover:bg-primary cursor-pointer hover:text-white hover:border-white"
                            onClick={() => firstSwiper?.slidePrev()}
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-white/50 bg-transparent hover:bg-primary cursor-pointer text-white hover:text-white hover:border-white"
                            onClick={() => firstSwiper?.slideNext()}
                        >
                            <ArrowRight className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}