"use client"
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

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
                image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                alt="Contact Us"
            />

            {/* Contact Content */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-[#2857AE] mb-4">Get in Touch</h2>
                                <p className="text-muted-foreground">
                                    Our administrative team is available to assist you during school hours. Feel free to visit us, give us a call, or send an email.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 bg-muted/30 rounded-xl flex flex-col gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Visit Us</h4>
                                        <p className="text-sm text-muted-foreground">
                                            123 Education Lane,<br />
                                            Knowledge City, ST 12345
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/30 rounded-xl flex flex-col gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Call Us</h4>
                                        <p className="text-sm text-muted-foreground">
                                            +1 (555) 123-4567<br />
                                            +1 (555) 987-6543
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/30 rounded-xl flex flex-col gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Email Us</h4>
                                        <p className="text-sm text-muted-foreground">
                                            admissions@amfofana.edu<br />
                                            info@amfofana.edu
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/30 rounded-xl flex flex-col gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2857AE]">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Office Hours</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Mon - Fri: 8:00 AM - 4:00 PM<br />
                                            Sat: 9:00 AM - 1:00 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg border">
                            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
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

                                <Button type="submit" className="w-full bg-[#2857AE] hover:bg-[#1e408a]">
                                    <Send className="mr-2 h-4 w-4" /> Send Message
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="relative w-full h-[400px] bg-muted">
                {/* Placeholder for real map */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <Image
                        src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=2662&auto=format&fit=crop"
                        alt="Map Location"
                        fill
                        className="object-cover opacity-60"
                    />
                    <div className="absolute z-10 bg-white p-4 rounded-lg shadow-lg">
                        <p className="font-bold flex items-center gap-2"><MapPin className='text-[#2857AE] h-4 w-4' /> AMFOFANA High School</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
