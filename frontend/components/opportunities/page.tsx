import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Briefcase, Award, Users, ArrowRight } from 'lucide-react';

import Breadcrumb from '@/components/Breadcrumb';

export default function OpportunitiesPage() {
    return (
        <div className="w-full min-h-screen bg-background">
            {/* Hero Section */}
            <Breadcrumb
                title="Opportunities"
                description="Join our team, apply for scholarships, or lead student initiatives."
                image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
                alt="Opportunities"
            />

            {/* Main Content */}
            <section className="py-20">
                <div className="container mx-auto px-4">

                    {/* Careers */}
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#2857AE]">Careers at AMFOFANA</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <p className="text-muted-foreground leading-relaxed">
                                    We are always looking for passionate educators and staff to join our vibrant community. If you are dedicated to shaping the future of education, we would love to hear from you.
                                </p>
                                <ul className="space-y-4">
                                    <li className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-semibold">Senior Mathematics Teacher</h4>
                                            <p className="text-sm text-muted-foreground">High School • Full Time</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#2857AE] transition-colors" />
                                    </li>
                                    <li className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-semibold">Guidance Counselor</h4>
                                            <p className="text-sm text-muted-foreground">Student Services • Full Time</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#2857AE] transition-colors" />
                                    </li>
                                </ul>
                                <Button className="bg-[#2857AE] hover:bg-[#1e408a]">View All Openings</Button>
                            </div>
                            <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-lg">
                                <Image
                                    src="https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=2070&auto=format&fit=crop"
                                    alt="Teaching Staff"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scholarships */}
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                <Award className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#2857AE]">Scholarships & Financial Aid</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
                            <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-lg md:order-2">
                                <Image
                                    src="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1974&auto=format&fit=crop"
                                    alt="Graduation"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="space-y-6 md:order-1">
                                <p className="text-muted-foreground leading-relaxed">
                                    We believe that quality education should be accessible to all deserving students. AMFOFANA offers various scholarship programs based on academic merit, sports excellence, and financial need.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-bold mb-2">Merit Scholarship</h4>
                                        <p className="text-sm text-muted-foreground">Up to 100% tuition waiver for top performers.</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-bold mb-2">Sports Scholarship</h4>
                                        <p className="text-sm text-muted-foreground">For national and state-level athletes.</p>
                                    </div>
                                </div>
                                <Button variant="outline">Apply for Aid</Button>
                            </div>
                        </div>
                    </div>

                    {/* Student Leadership */}
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                <Users className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#2857AE]">Student Leadership</h2>
                        </div>
                        <div className="bg-muted/30 p-8 rounded-2xl">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-2xl font-bold">Student Council</h3>
                                    <p className="text-muted-foreground">
                                        The Student Council is the voice of the student body. Elections are held annually, giving students the chance to take on leadership roles, organize events, and impact school policy.
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> President & Vice President Roles</li>
                                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Event Committees</li>
                                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2857AE] rounded-full"></span> Peer Mentorship Program</li>
                                    </ul>
                                </div>
                                <div className="flex-1">
                                    <div className="relative h-[250px] w-full rounded-xl overflow-hidden shadow-sm">
                                        <Image
                                            src="https://images.unsplash.com/photo-1529156069896-85b7aaf83a2f?q=80&w=2070&auto=format&fit=crop"
                                            alt="Student Council"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
