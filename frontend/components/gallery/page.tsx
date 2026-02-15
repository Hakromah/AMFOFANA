"use client"
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { galleryItems } from '@/data/gallery';
import { Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

export default function GalleryPage() {
    const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
    const [activeCategory, setActiveCategory] = useState<'All' | 'Campus' | 'Events' | 'Sports'>('All');
    const [visibleGridCount, setVisibleGridCount] = useState(6);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = galleryItems.filter(item =>
        (activeMediaType === 'video' ? item.type === 'video' : item.type === 'image') &&
        (activeCategory === 'All' || item.category === activeCategory)
    );

    // Filter items for the grid (only images)
    const gridItems = galleryItems.filter(item => item.type === 'image');

    useEffect(() => {
        const container = containerRef.current;
        const delegate = "[data-fancybox]";
        const options = {
            Carousel: {
                infinite: false,
            },
        };

        Fancybox.bind(container, delegate, options);

        return () => {
            Fancybox.unbind(container);
            Fancybox.close();
        };
    }, [filteredItems, visibleGridCount]);

    return (
        <div className="w-full min-h-screen bg-white py-20" ref={containerRef}>
            <div className="container mx-auto px-4">

                {/* Header Text */}
                <div className="text-center mb-12">
                    <p className="text-lg md:text-xl text-gray-800 font-medium max-w-3xl mx-auto leading-relaxed">
                        Capturing moments of excellence, creativity, and community across
                        our elementary, junior, and high school campus.
                    </p>
                </div>

                {/* 1. Toggle Switch (Segmented Control) */}
                <div className="flex justify-center mb-8">
                    <div className="bg-[#F8F9FA] p-1.5 rounded-full inline-flex items-center gap-1">
                        <button
                            onClick={() => setActiveMediaType('image')}
                            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeMediaType === 'image'
                                    ? 'bg-white text-[#2857AE] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                                }`}
                        >
                            Image Gallery
                        </button>
                        <button
                            onClick={() => setActiveMediaType('video')}
                            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeMediaType === 'video'
                                    ? 'bg-[#2857AE] text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                                }`}
                        >
                            Video Gallery
                        </button>
                    </div>
                </div>

                {/* 2. Filter Buttons (Pills) */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {['All', 'Campus', 'Events', 'Sports'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat as any)}
                            className={`min-w-[80px] px-6 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-[#2857AE] text-white border-[#2857AE]'
                                    : 'bg-white text-[#2857AE] border-[#2857AE] hover:bg-blue-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* 3. Slider Section */}
                <div className="relative max-w-[1200px] mx-auto">
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={24}
                        slidesPerView={1.2}
                        centeredSlides={false}
                        navigation={{
                            nextEl: '.custom-next',
                            prevEl: '.custom-prev',
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2.2 },
                            768: { slidesPerView: 3.2 },
                            1024: { slidesPerView: 4 },
                        }}
                        className="w-full pb-10 !overflow-visible"
                    >
                        {filteredItems.map((item) => (
                            <SwiperSlide key={item.id} className="h-auto">
                                <a
                                    data-fancybox="gallery-slider"
                                    href={item.src}
                                    data-caption={item.title}
                                    className="relative group cursor-pointer overflow-hidden rounded-[24px] aspect-[4/5] w-full bg-gray-100 block"
                                >
                                    <Image
                                        src={item.type === 'video' ? (item.thumbnail || '') : item.src}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* Video Play Icon Overlay */}
                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Play className="w-5 h-5 text-[#2857AE] fill-current ml-0.5" />
                                            </div>
                                        </div>
                                    )}
                                </a>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* 4. Custom Navigation Buttons (Centered Below) */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button className="custom-prev w-10 h-10 rounded-full bg-[#DCE4F2] text-[#2857AE] flex items-center justify-center hover:bg-[#2857AE] hover:text-white transition-colors duration-300 disabled:opacity-50">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button className="custom-next w-10 h-10 rounded-full bg-[#2857AE] text-white flex items-center justify-center hover:bg-[#1e408a] transition-colors duration-300 disabled:opacity-50">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            No media found for the selected category.
                        </div>
                    )}
                </div>

                {/* 5. Past Events Grid Section */}
                <div className="mt-24 max-w-[1200px] mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">From our past events</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {gridItems
                            .slice(0, visibleGridCount)
                            .map((item) => (
                                <a
                                    key={`grid-${item.id}`}
                                    data-fancybox="gallery-grid"
                                    href={item.src}
                                    data-caption={item.title}
                                    className="relative h-[400px] rounded-2xl overflow-hidden group cursor-pointer block"
                                >
                                    <Image
                                        src={item.src}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Optional: Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <span className="text-white font-medium">{item.title}</span>
                                    </div>
                                </a>
                            ))}
                    </div>

                    {visibleGridCount < gridItems.length && (
                        <Button
                            onClick={() => setVisibleGridCount(prev => prev + 6)}
                            className="px-8 py-6 rounded-full bg-[#2857AE] hover:bg-[#1e408a] text-white text-lg"
                        >
                            Load More
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
