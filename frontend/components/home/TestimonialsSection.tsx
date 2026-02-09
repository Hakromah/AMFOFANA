"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import 'swiper/css';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
    {
        id: 1,
        type: "PARENT",
        quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.",
        name: "Ms. Emily Chen",
        role: "Mother of Charles & Sophia",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 2,
        type: "STUDENT",
        quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.",
        name: "Ms. Emily Chen",
        role: "Mother of Charles & Sophia",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 3,
        type: "ALUMNI",
        quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.",
        name: "Ms. Emily Chen",
        role: "Mother of Charles & Sophia",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    },
];

export default function TestimonialsSection() {
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".testimonial-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".testimonial-card", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2, // Stagger effect for cards
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-[clamp(40px,5vw,100px)] bg-white overflow-hidden">
            <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

                {/* Header Section */}
                <div className="testimonial-header flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <div>
                        <h2 className="text-[clamp(30px,4vw,50px)] font-bold text-[#2857AE] mb-2">
                            Testimonials
                        </h2>
                        <h3 className="text-xl md:text-2xl text-black font-medium">
                            Voices of Our <br /> Distinguished Community
                        </h3>
                    </div>
                    <div className="lg:max-w-lg text-right lg:text-left">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Excellence in education is measured not by awards alone, but by the lives we touch and the futures we shape. Here are the stories that define our legacy.
                        </p>
                    </div>
                </div>

                {/* Marquee Swiper */}
                <div className="testimonial-swiper">
                    <Swiper
                        modules={[Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1.1} // Start small for mobile
                        centeredSlides={true} // Center active slide
                        loop={true} // Infinite loop
                        speed={5000} // Slow continuous speed
                        autoplay={{
                            delay: 0,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true // Stop on hover
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 1.5,
                                centeredSlides: false,
                            },
                            1024: {
                                slidesPerView: 2.5,
                                centeredSlides: false,
                            },
                            1280: {
                                slidesPerView: 3,
                                centeredSlides: false,
                            }
                        }}
                        className="!overflow-visible py-4 linear-swiper-transition" // Add class for linear easing override
                    >
                        {testimonials.map((testimonial) => (
                            <SwiperSlide key={testimonial.id} className="h-auto">
                                <div
                                    className="testimonial-card bg-[#2857AE] text-white rounded-3xl p-8 flex flex-col h-full shadow-lg transition-transform duration-300 hover:-translate-y-2"
                                >
                                    {/* Tag */}
                                    <div className="mb-6">
                                        <span className="bg-white text-[#2857AE] px-3 py-1 rounded text-sm font-bold uppercase tracking-wider inline-block">
                                            {testimonial.type}
                                        </span>
                                    </div>

                                    {/* Quote */}
                                    <blockquote className="text-white/90 text-sm leading-relaxed mb-8 flex-grow">
                                        &quot;{testimonial.quote}&quot;
                                    </blockquote>

                                    {/* Profile */}
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                                            <Image
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">{testimonial.name}</h4>
                                            <p className="text-white/70 text-sm">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                        {/* Duplicate data for smooth loop if needed, but Swiper 'loop' prop handles it if we have enough slides. 
                             If items < slidesPerView * 2, loop might jerk. We have 3 items and view 3. 
                             Let's triple the data to ensure smooth loop for now since we only have 3 real items. */}
                        {testimonials.map((testimonial) => (
                            <SwiperSlide key={`${testimonial.id}-duplicate-1`} className="h-auto">
                                <div
                                    className="testimonial-card bg-[#2857AE] text-white rounded-3xl p-8 flex flex-col h-full shadow-lg transition-transform duration-300 hover:-translate-y-2"
                                >
                                    <div className="mb-6">
                                        <span className="bg-white text-[#2857AE] px-3 py-1 rounded text-sm font-bold uppercase tracking-wider inline-block">
                                            {testimonial.type}
                                        </span>
                                    </div>
                                    <blockquote className="text-white/90 text-sm leading-relaxed mb-8 flex-grow">
                                        &quot;{testimonial.quote}&quot;
                                    </blockquote>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                                            <Image
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">{testimonial.name}</h4>
                                            <p className="text-white/70 text-sm">{testimonial.role}</p>
                                        </div>
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
