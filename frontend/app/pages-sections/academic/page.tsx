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
        content: 'Core focus on Literacy, Math, and Social-Emotional development using inquiry-based learning. Core focus on Literacy, Math, and Social-Emotional development using inquiry-based learning.',
        image: '/home/classmate.jpg',
        details: [
            "Inquiry-based learning approach",
            "Strong focus on literacy and numeracy",
            "Safe and nurturing environment"
        ]
    },
    {
        id: 'junior',
        title: 'Junior High (6-8)',
        content: 'Introduction to specialized subjects, lab sciences, and organizational skills for independence. Introduction to specialized subjects, lab sciences, and organizational skills for independence.',
        image: '/home/intro2.png',
        details: [
            "Specialized subject teachers",
            "Introduction to lab sciences",
            "Development of organizational skills"
        ]
    },
    {
        id: 'highschool',
        title: 'High School (9-12)',
        content: 'Advanced Placement (AP) courses, Honors tracks, and College & Career Readiness programs. Advanced Placement (AP) courses, Honors tracks, and College & Career Readiness programs.',
        image: '/home/am1.png',
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
            rootMargin: '-40% 0px -40% 0px',
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

            <section className="py-[clamp(25px,3vw,80px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

                    {/* Intro */}
                    <div className="max-w-4xl mb-[clamp(20px,4vw,50px)]">
                        <div className="flex items-center gap-4 mb-[clamp(12px,3vw,25px)]">
                            <div className="h-12 w-1 bg-[#2857AE]"></div>
                            <h2 className="text-xl md:text-4xl font-bold text-gray-900">Academic Excellence</h2>
                        </div>
                        <h3 className="text-md md:text-xl font-semibold mb-4 max-sm:mb-2">Empowering students with comprehensive education and innovative learning approaches</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Our curriculum is designed to meet national education standards and global best practices. We connect outstanding
                            students with local and international scholarship opportunities. Students receive mentorship and guidance to help them
                            choose future careers and university paths. Selected students participate in national and international exchange
                            programs to broaden their global perspective.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-[clamp(20px,3.5vw,50px)] relative">
                        {/* Left Column: Scrollable Content */}
                        <div className="w-full lg:w-1/2 space-y-[clamp(30px,3vw,60px)]">
                            <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-[clamp(10px,3vw,26px)] border-b pb-4 max-sm:text-[20px] inline-block">Learning Pathways</h2>

                            {academicSections.map((section) => (
                                <div
                                    key={section.id}
                                    id={section.id}
                                    ref={el => { if (el) observerRefs.current[section.id] = el; }}
                                    className="scroll-mt-32 h-fit flex flex-col justify-center"
                                >
                                    <div className="border-l-4 border-[#2857AE] pl-6 py-2 transition-all duration-300">
                                        <h3 className={`text-[clamp(20px,3vw,32px)] font-bold mb-3 ${activeSection === section.id ? 'text-[#2857AE]' : 'text-gray-900'}`}>{section.title}</h3>
                                        <p className="text-gray-600 text-lg mb-[clamp(15px,3vw,24px)] leading-relaxed">
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
                        <div className="hidden md:block w-1/2 relative">
                            <div className="sticky top-32 h-[400px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out">
                                <Image
                                    src={activeImage}
                                    alt="Academic Level"
                                    fill
                                    className="object-cover transition-opacity duration-500"
                                    priority
                                />
                                {/* Optional Overlay/Decoration resembling the book stack in the user request */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Calendar Section */}
            <section className="sm:py-[clamp(20px,3vw,50px)] max-sm:pt-5 bg-gray-50">
                <div className="container max-w-[1920px]] mx-auto px-5 md:px-[clamp(20px,5vw,60px)]">
                    <a href="/file/sample.pdf" target="_blank" rel="noopener noreferrer" className='block w-full h-full'>
                    <div className="bg-white p-[clamp(12px,4vw,26px)] rounded-xl md:shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg text-[#2857AE] font-bold text-xl max-md:text-sm">
                                2026/2027
                            </div>
                            <h3 className="text-xl max-md:text-sm font-bold text-gray-900">School Calendar</h3>
                        </div>
                        <Button variant="outline" className="gap-2 max-xs:w-full cursor-pointer border-gray-300 hover:border-[#2857AE] hover:text-[#2857AE]">
                            Download <FileText className="w-4 h-4" />
                        </Button>
                    </div>
                    </a>
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-[clamp(20px,3vw,80px)] bg-gray-50">
                <div className="container mx-auto px-5 max-w-[1920px] md:px-[clamp(20px,5vw,60px)]">
                    <div className="bg-[#f0f4f8] p-[clamp(12px,4vw,40px)] rounded-[clamp(12px,4vw,30px)]">
                        <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-[clamp(10px,3vw,26px)] border-b pb-4 max-sm:text-[20px]">Useful Academic Resources</h2>
                        <div className="space-y-1">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className='w-full h-full relative'>
                                    <a href='/file/sample.pdf' download rel='noopener noreferrer' className='block w-full h-full'>
                                <div  className="flex items-center justify-between py-[clamp(12px,3vw,24px)] border-b border-gray-200 last:border-0 hover:bg-white/50 px-4 rounded-lg max-md:rounded-sm transition-colors cursor-pointer group">
                                    <span className="text-gray-700 font-medium">Resources document -{item}</span>
                                    <div className="flex items-center gap-2 text-[#2857AE] opacity-70 max-md:opacity-100 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-semibold">Download</span>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </div>
                                </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}