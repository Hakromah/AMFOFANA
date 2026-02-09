"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import Breadcrumb from '@/components/Breadcrumb';

const galleryImages = [
    { id: 1, src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop", category: "Campus", alt: "Main Building" },
    { id: 2, src: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop", category: "Events", alt: "Art Exhibition" },
    { id: 3, src: "https://images.unsplash.com/photo-1576678927484-9918154f4ea9?q=80&w=1978&auto=format&fit=crop", category: "Sports", alt: "Sports Day" },
    { id: 4, src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop", category: "Academics", alt: "Classroom" },
    { id: 5, src: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1974&auto=format&fit=crop", category: "Academics", alt: "Science Lab" },
    { id: 6, src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop", category: "Students", alt: "Graduation" },
    { id: 7, src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop&bg=f3f4f6", category: "Staff", alt: "Teacher" },
    { id: 8, src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop", category: "Community", alt: "Volunteering" },
    { id: 9, src: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop", category: "Campus", alt: "Library" },
];

const categories = ["All", "Campus", "Academics", "Sports", "Events", "Students"];

export default function GalleryPage() {
    const [filter, setFilter] = useState("All");

    const filteredImages = filter === "All"
        ? galleryImages
        : galleryImages.filter(img => img.category === filter);

    return (
        <div className="w-full min-h-screen bg-background">
            {/* Header */}
            <Breadcrumb
                title="Our Gallery"
                description="A glimpse into the vibrant life at AMFOFANA High School."
                image="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop"
                alt="Gallery Header"
            />

            {/* Gallery Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    {/* Filters */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                variant={filter === cat ? "default" : "outline"}
                                onClick={() => setFilter(cat)}
                                className={`rounded-full ${filter === cat ? "bg-[#2857AE] text-white" : ""}`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                        {filteredImages.map((image) => (
                            <div key={image.id} className="relative group break-inside-avoid overflow-hidden rounded-xl cursor-pointer">
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    width={600}
                                    height={400}
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-semibold text-lg">{image.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
