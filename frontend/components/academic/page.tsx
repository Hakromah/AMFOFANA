import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Microscope, Palette, Globe } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

export default function AcademicPage() {
    return (
        <div className="w-full min-h-screen bg-background">
            {/* Hero Section */}
            <Breadcrumb
                title="Academic Excellence"
                description="Fostering intellectual curiosity and critical thinking through a comprehensive and rigorous curriculum."
                image="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                alt="Academic Excellence"
            />

            {/* Curriculum Overview */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#2857AE] mb-4">Our Curriculum</h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto">
                            We offer a balanced education that combines core academic subjects with arts, sports, and technology. Our programs are designed to challenge students at every level.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Primary School */}
                        <div className="p-8 rounded-2xl bg-white shadow-lg border hover:shadow-xl transition-shadow">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Primary School</h3>
                            <p className="text-muted-foreground mb-6">
                                Building a strong foundation in literacy, numeracy, and social skills through play-based and inquiry learning.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Grades 1 - 5</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Focus on Core Skills</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Creative Arts Integration</li>
                            </ul>
                            <Button variant="outline" className="w-full">Learn More</Button>
                        </div>

                        {/* Middle School */}
                        <div className="p-8 rounded-2xl bg-white shadow-lg border hover:shadow-xl transition-shadow relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2857AE] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                                Most Popular
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Middle School</h3>
                            <p className="text-muted-foreground mb-6">
                                Encouraging independence and critical thinking as students explore a wider range of subjects and electives.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Grades 6 - 8</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Project-Based Learning</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Initial Career Guidance</li>
                            </ul>
                            <Button className="w-full bg-[#2857AE] hover:bg-[#1e408a]">Learn More</Button>
                        </div>

                        {/* High School */}
                        <div className="p-8 rounded-2xl bg-white shadow-lg border hover:shadow-xl transition-shadow">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">High School</h3>
                            <p className="text-muted-foreground mb-6">
                                Preparing distinguished young adults for university success with advanced placement courses and leadership roles.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Grades 9 - 12</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> University Prep</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Leadership Program</li>
                            </ul>
                            <Button variant="outline" className="w-full">Learn More</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Departments Section */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-bold text-[#2857AE]">Key Departments</h2>
                            <p className="text-muted-foreground">
                                Our specialized departments ensure that every student finds their passion and excels in it. From the precision of sciences to the expression of arts.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-background shadow-sm">
                                    <Microscope className="h-8 w-8 text-[#2857AE]" />
                                    <div>
                                        <h4 className="font-bold">STEM</h4>
                                        <p className="text-sm text-muted-foreground">Science, Technology, Engineering, Math</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-background shadow-sm">
                                    <Palette className="h-8 w-8 text-[#2857AE]" />
                                    <div>
                                        <h4 className="font-bold">Arts & Humanities</h4>
                                        <p className="text-sm text-muted-foreground">Visual Arts, Music, History, Literature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative h-[300px] w-full rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop"
                                alt="Science Lab"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
