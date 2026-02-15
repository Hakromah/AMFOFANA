"use client"
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, Download, ArrowRight, CheckCircle } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

const academicSections = [
    {
        id: 'elementary',
        title: 'Elementary (K-5)',
        content: 'Core focus on Literacy, Math, and Social-Emotional development using inquiry-based learning.',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
        details: [
            "Inquiry-based learning approach",
            "Strong focus on literacy and numeracy",
            "Safe and nurturing environment"
        ]
    },
    {
        id: 'junior',
        title: 'Junior High (6-8)',
        content: 'Introduction to specialized subjects, lab sciences, and organizational skills for independence.',
        image: 'https://images.unsplash.com/photo-1427504746696-ea3093607dbe?q=80&w=2053&auto=format&fit=crop',
        details: [
            "Specialized subject teachers",
            "Introduction to lab sciences",
            "Development of organizational skills"
        ]
    },
    {
        id: 'highschool',
        title: 'High School (9-12)',
        content: 'Advanced Placement (AP) courses, Honors tracks, and College & Career Readiness programs.',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop',
        details: [
            "Advanced Placement (AP) courses",
            "College & Career Readiness programs",
            "Leadership opportunities"
        ]
    }
];

export default function AcademicPage() {
    const [activeSection, setActiveSection] = useState(academicSections[0].id);
    const observerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.5
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        Object.values(observerRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const activeImage = academicSections.find(s => s.id === activeSection)?.image || academicSections[0].image;

    return (
        <div className="w-full min-h-screen bg-background">
            <Breadcrumb
                title="Academic Excellence"
                description="Empowering students with comprehensive education and innovative learning approaches"
                image="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                alt="Academic Excellence"
            />

            <section className="py-20">
                <div className="container mx-auto px-4">

                    {/* Intro */}
                    <div className="max-w-4xl mb-16">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-1 bg-[#2857AE]"></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Academic Excellence</h2>
                        </div>
                        <h3 className="text-xl font-semibold mb-4">Empowering students with comprehensive education and innovative learning approaches</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Our curriculum is designed to meet national education standards and global best practices. We connect outstanding
                            students with local and international scholarship opportunities. Students receive mentorship and guidance to help them
                            choose future careers and university paths. Selected students participate in national and international exchange
                            programs to broaden their global perspective.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
                        {/* Left Column: Scrollable Content */}
                        <div className="w-full lg:w-1/2 space-y-24">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4 inline-block">Learning Pathways</h2>

                            {academicSections.map((section) => (
                                <div
                                    key={section.id}
                                    id={section.id}
                                    ref={el => { if (el) observerRefs.current[section.id] = el; }}
                                    className="scroll-mt-32 min-h-[50vh] flex flex-col justify-center"
                                >
                                    <div className="border-l-4 border-[#2857AE] pl-6 py-2 transition-all duration-300">
                                        <h3 className={`text-2xl font-bold mb-3 ${activeSection === section.id ? 'text-[#2857AE]' : 'text-gray-900'}`}>{section.title}</h3>
                                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                            {section.content}
                                        </p>
                                        <ul className="space-y-3">
                                            {section.details.map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-700">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Sticky Image */}
                        <div className="hidden lg:block w-1/2 relative">
                            <div className="sticky top-32 h-[500px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out">
                                <Image
                                    src={activeImage}
                                    alt="Academic Level"
                                    fill
                                    className="object-cover transition-opacity duration-500"
                                    priority
                                />
                                {/* Optional Overlay/Decoration resembling the book stack in the user request */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Calendar Section */}
            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg text-[#2857AE] font-bold text-xl">
                                2026/2027
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">School Calendar</h3>
                        </div>
                        <Button variant="outline" className="gap-2 border-gray-300 hover:border-[#2857AE] hover:text-[#2857AE]">
                            Download <FileText className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-[#f0f4f8] p-10 rounded-[30px]">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Useful Academic Resources</h2>
                        <div className="space-y-1">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex items-center justify-between py-6 border-b border-gray-200 last:border-0 hover:bg-white/50 px-4 rounded-lg transition-colors cursor-pointer group">
                                    <span className="text-gray-700 font-medium">Resources document -{item}</span>
                                    <div className="flex items-center gap-2 text-[#2857AE] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-semibold">Download</span>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
