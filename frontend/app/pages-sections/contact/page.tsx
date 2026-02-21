"use client"
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Linkedin, Twitter, Youtube, ArrowRight } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

export default function ContactPage() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log("Form submitted");
    };

    return (
        <div className="w-full min-h-screen bg-background">
            {/* Header */}
            <Breadcrumb
                title="Contact Us"
                description="We're here to help. Reach out to us with any questions about admissions, academics, or school life."
                image="/home/intro3.png"
                alt="Contact Us"
            />

            {/* Contact Content */}
            <section className="py-[clamp(25px,3vw,80px)]">
                <div className="container mx-auto max-w-1920 px-5">
                    {/* Top Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-sm:gap-5 mb-[clamp(30px,3vw,80px)]">
                        {/* Address Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12 max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <Send className="h-5 w-5 rotate-45" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Address</h3>
                            <p className="text-gray-600 max-md:[&_br]:hidden max-md:w-full max-md:text-left text-sm leading-relaxed">
                                A.M. FOFANA High School<br />
                                Monrovia, Liberia<br />
                                West Africa
                            </p>
                        </div>

                        {/* Phone Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12 w-12  max-sm:hidden bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <Send className="h-5 w-5 rotate-45" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Phone</h3>
                            <div className="flex flex-col max-md:flex-row gap-3 text-gray-600 max-md:[&_br]:hidden text-sm leading-relaxed">
                                <p>   +231 054 678 13 13</p>
                                <p>   +231 077 123 4567</p>
                            </div>
                        </div>

                        {/* Email Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12  max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <Send className="h-5 w-5 rotate-45" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Email</h3>
                            <p className="text-gray-600 max-md:[&_br]:hidden text-sm leading-relaxed">
                                info@amfofana.edu.lr<br />
                                admissions@amfofana.edu.lr
                            </p>
                        </div>

                        {/* Office Hours Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12  max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <Send className="h-5 w-5 rotate-45" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                            <p className="text-gray-600 max-md:[&_br]:hidden text-sm leading-relaxed">
                                Mon - Fri: 8 AM - 4 PM<br />
                                Sat: 8 AM - 12 PM
                            </p>
                        </div>
                    </div>

                    {/* Bottom Section: Connect & Map */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Connect With Us */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect With Us</h2>
                                <p className="text-gray-600">
                                    Follow us on social media for updates, news, and student highlights.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <a href="#" className="text-[#2857AE] hover:text-blue-700 transition-colors"><Linkedin className="w-5 h-5" /></a>
                                <a href="#" className="text-[#2857AE] hover:text-blue-700 transition-colors"><Instagram className="w-5 h-5" /></a>
                                <a href="#" className="text-[#2857AE] hover:text-blue-700 transition-colors"><Facebook className="w-5 h-5" /></a>
                                <a href="#" className="text-[#2857AE] hover:text-blue-700 transition-colors"><Youtube className="w-5 h-5" /></a>
                                <a href="#" className="text-[#2857AE] hover:text-blue-700 transition-colors"><Twitter className="w-5 h-5" /></a>
                            </div>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button className="bg-[#2857AE] hover:bg-[#1e408a] text-white px-8 py-6 rounded-lg text-base font-medium w-full sm:w-auto">
                                        Contact Form
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-w-xl mx-auto rounded-t-[20px] px-0">
                                    <div className="px-6 py-6 h-full overflow-y-auto">
                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="text-2xl font-bold text-[#2857AE]">Send us a Message</SheetTitle>
                                            <SheetDescription>
                                                Fill out the form below and our team will get back to you shortly.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                                    <Input id="firstName" placeholder="John" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                                    <Input id="lastName" placeholder="Doe" required />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                                <Input id="email" type="email" placeholder="john@example.com" required />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                                <Input id="subject" placeholder="Inquiry about admissions" required />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="message" className="text-sm font-medium">Message</label>
                                                <textarea
                                                    id="message"
                                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="How can we help you?"
                                                    required
                                                ></textarea>
                                            </div>

                                            <Button type="submit" className="w-full bg-[#2857AE] hover:bg-[#1e408a] py-6 text-base">
                                                <Send className="mr-2 h-4 w-4" /> Send Message
                                            </Button>
                                        </form>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Map Section */}
                        <div className="bg-blue-50 rounded-3xl h-[400px] w-full relative overflow-hidden flex items-center justify-center border border-blue-100 z-0">
                            <Map />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
