"use client"
import React, { useState } from 'react';
import StrapiImage from '@/components/StrapiImage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CheckCircle, Clock, Send, Upload } from 'lucide-react';
import type { Opportunity } from '@/types/strapi';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

export default function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
    const [isApplied, setIsApplied] = useState(false);

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        setIsApplied(true);
        // Simulate API call
        setTimeout(() => setIsApplied(false), 3000); // Reset for demo
    };
    return (
        <div className="min-h-screen bg-white sm:pb-[clamp(25px,3vw,80px)]">
            {/* Header / Hero */}
            <div className="relative h-[50vh] min-h-[400px]">
                <StrapiImage
                    src={opportunity.image}
                    alt={opportunity.title}
                    fill
                    className="object-cover"
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-12 text-white">
                    <Link href="/opportunities" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Opportunities
                    </Link>
                    <div className="flex items-center gap-4 max-sm:flex-wrap text-sm font-medium mb-4">
                        <span className="bg-primary px-3 py-1 rounded-full">{opportunity.index}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Published: {opportunity.publishedDate}</span>
                        <span className="flex items-center gap-1 text-red-200"><Clock className="w-4 h-4" /> Deadline:   <div>
                            Deadline {opportunity.deadline}{" "}
                            <span className="text-white">{opportunity.dateNumber}</span>
                        </div></span>
                    </div>
                    <h1 className="text-xl md:text-5xl font-bold max-w-4xl leading-tight">
                        {opportunity.title}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-5 md:px-[clamp(20px,5vw,60px)] py-[clamp(25px,3vw,80px)] max-w-[1920px]">
                <div className="flex flex-col lg:flex-row gap-[clamp(20px,3.5vw,60px)]">
                    {/* Main Text */}
                    <div className="flex-1 space-y-10">
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Overview</h3>
                            <p className="leading-relaxed mb-6">
                                {opportunity.details.intro}
                            </p>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Eligibility Requirements</h3>
                            <ul className="space-y-3 mb-6">
                                {opportunity.details.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h3>
                            <ul className="space-y-3 mb-6">
                                {opportunity.details.benefits.map((ben, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                        <span>{ben}</span>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Apply</h3>
                            <p className="leading-relaxed bg-blue-50 p-6 rounded-xl border border-blue-100">
                                {opportunity.details.howToApply}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar / CTA */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-24 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-2">Ready to take the next step?</h3>
                            <p className="text-gray-500 mb-8 text-sm">
                                Don't miss this chance. Applications are open until {opportunity.deadline}.
                            </p>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button className="w-full bg-primary hover:bg-[#1e408a] py-6 text-lg shadow-blue-200 shadow-xl">
                                        Apply Now
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-w-2xl mx-auto rounded-t-[30px] px-0 bg-[#FDFBF7] border-none">
                                    <div className="px-8 py-10 h-full overflow-y-auto">
                                        <SheetHeader className="mb-8 text-left px-4">
                                            <SheetTitle className="text-4xl font-bold text-black tracking-tight mb-2">Application Form</SheetTitle>
                                            <SheetDescription className="text-base text-gray-500">
                                                Applying for: <span className="font-semibold text-primary">{opportunity.title}</span>
                                            </SheetDescription>
                                        </SheetHeader>

                                        <form onSubmit={handleApply} className="space-y-6 px-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Input placeholder="First Name" className="bg-transparent border-gray-400 h-12 rounded-xl" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input placeholder="Last Name" className="bg-transparent border-gray-400 h-12 rounded-xl" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input type="email" placeholder="Email Address" className="bg-transparent border-gray-400 h-12 rounded-xl" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input placeholder="Phone Number" className="bg-transparent border-gray-400 h-12 rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                                    <p className="font-medium text-gray-700">Upload Resume / CV</p>
                                                    <p className="text-xs text-gray-500">PDF, DOCX up to 10MB</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <textarea
                                                    className="flex min-h-[150px] w-full rounded-xl border border-gray-400 bg-transparent px-4 py-4 text-base placeholder:text-gray-500 focus-visible:outline-none focus:border-black resize-none"
                                                    placeholder="Why are you a good fit for this opportunity?"
                                                    required
                                                ></textarea>
                                            </div>

                                            <Button type="submit" className="w-full bg-primary hover:bg-[#1e408a] py-6 text-lg rounded-xl">
                                                {isApplied ? "Application Sent!" : "Submit Application"}
                                            </Button>
                                        </form>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="mt-6 text-center text-xs text-gray-400">
                                By applying, you agree to our Terms & Privacy Policy.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
