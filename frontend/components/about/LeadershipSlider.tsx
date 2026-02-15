"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const leadershipTeam = [
    {
        id: 1,
        name: "Sarah Mitchell",
        role: "Principal",
        email: "sarah.mitchell@edu.lb",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop",
    },
    {
        id: 2,
        name: "Dr. Ibrahim Kamara",
        role: "Principal",
        email: "i.kamara@edu.lb",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
    },
    {
        id: 3,
        name: "Ms. Emily Chen",
        role: "Vice Principal",
        email: "emily.chen@edu.lb",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
    },
    {
        id: 4,
        name: "Mr. David Smith",
        role: "Head of Academics",
        email: "d.smith@edu.lb",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
    },
];

export default function LeadershipSlider() {
    return (
        <section className="py-20 bg-background mb-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-black mb-2">Our Leadership</h2>
                    <p className="text-muted-foreground">
                        Meet the dedicated team guiding our institution.
                    </p>
                </div>

                <div className="relative px-12">
                    {/* Custom Navigation Buttons */}
                    <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#2857AE] hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#2857AE] flex items-center justify-center text-white hover:bg-[#15346F] transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={{
                            prevEl: '.swiper-button-prev-custom',
                            nextEl: '.swiper-button-next-custom',
                        }}
                        pagination={{
                            clickable: true,
                            el: '.swiper-pagination-custom',
                            type: 'progressbar'
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                            },
                            1024: {
                                slidesPerView: 3,
                            },
                        }}
                        className="w-full !pb-12"
                    >
                        {leadershipTeam.map((leader) => (
                            <SwiperSlide key={leader.id}>
                                <div className="relative group rounded-[20px] overflow-hidden h-[450px] shadow-md">
                                    <Image
                                        src={leader.image}
                                        alt={leader.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#2e2b4f]/90 via-[#2e2b4f]/40 to-transparent flex flex-col justify-end p-6 text-white">
                                        <h3 className="text-xl font-bold">{leader.name}</h3>
                                        <p className="font-medium text-white/90">{leader.role}</p>
                                        <p className="text-xs text-white/70 mt-1">Email: {leader.email}</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="swiper-pagination-custom w-full h-1 bg-gray-200 mt-8 rounded-full overflow-hidden"></div>
                </div>
            </div>
            <style jsx global>{`
        .swiper-pagination-progressbar-fill {
            background-color: #2857AE !important;
        }
      `}</style>
        </section>
    );
}
