"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import printJS from 'print-js';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    category: string;
    author: string;
    image: string;
}

interface BlogPostDetailProps {
    post: BlogPost;
}

const socialShareLinks = [
    { name: "facebook", href: "#" },
    { name: "instagram", href: "#" },
    { name: "youtube", href: "#" },
    { name: "tiktok", href: "#" },
    { name: "whatsapp", href: "https://wa.me/231880386681" },
    { name: "linkedin", href: "#" },
    { name: "printer", action: "print" },
    { name: "link", action: "copy" },
];

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
    const [copied, setCopied] = useState(false);

    const handleAction = (action: string) => {
        if (action === "print") {
            printJS({
                printable: 'contToPrint',
                type: 'html',
                css: '/print.css',
                scanStyles: false,
            });
        } else if (action === "copy") {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <div className="w-full bg-background min-h-screen">
            {/* Full Width Hero Image with Overlay */}
            <div className="relative w-full h-[60vh] min-h-[400px]">
                <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Hero Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container mx-auto px-4 text-center text-white">
                        <p className="text-sm md:text-base font-medium mb-4 uppercase tracking-widest opacity-90">
                            Home / Blog / <span className="text-white font-bold">News Detail</span>
                        </p>
                        <h1 className="text-3xl md:text-5xl font-bold max-w-4xl mx-auto leading-tight">
                            {post.title}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-[1200px] px-5 md:px-[clamp(20px,3vw,80px)] py-[clamp(25px,3vw,35px)]">
                <div className="w-full h-full">
                    {/* Back to Home Button */}
                    <div className="mb-[clamp(20px,3vw,35px)]">
                        <Link href="/blog">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-[#2857AE]">
                                <ArrowLeft className="w-4 h-4" /> Back to News
                            </Button>
                        </Link>
                    </div>

                    {/* Meta Info */}
                    <div className="mb-[clamp(20px,3vw,35px)]">
                        <span className="text-[#2857AE] font-bold">Published</span> <span className="text-gray-600 ml-2">{post.date}</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-[clamp(20px,3vw,50px)] items-start">

                        {/* Left Column: Social Share (Sticky) */}
                        <div className="md:w-16 w-full md:flex-shrink-0 md:sticky md:top-32 z-10">
                            <div className="flex max-md:flex-row md:flex-col gap-6 max-xs:gap-2 max-xs:justify-between items-center max-sm:overflow-auto bg-white/80 backdrop-blur-sm p-4 rounded-full border border-gray-100 shadow-sm relative">
                                {socialShareLinks.map((social) => (
                                    <div key={social.name} className="relative">
                                        {social.action ? (
                                            <button
                                                onClick={() => handleAction(social.action!)}
                                                className={`icon icon-${social.name} cursor-pointer text-gray-400 hover:text-[#2857AE] transition-colors w-5 h-5 flex justify-center items-center`}
                                            />
                                        ) : (
                                            <a
                                                href={social.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <span
                                                    className={`icon icon-${social.name} ${social.name === "whatsapp" ? "text-[#25D366]/80 hover:text-[#25D366]" : "text-gray-400 hover:text-[#2857AE]"} transition-colors w-5 h-5 flex justify-center items-center`}
                                                />
                                            </a>
                                        )}
                                        {social.action === "copy" && copied && (
                                            <span className="absolute -right-16 md:-right-18 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium whitespace-nowrap">
                                                Copied!
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div id="contToPrint" className="flex-1 contToPrint">
                            <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-6">
                                A.M. Fofana continues to create platforms that inspire excellence beyond the classroom.
                            </h2>

                            {/* Dynamically rendered HTML content */}
                            <div
                                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-xl prose-img:w-full prose-img:h-64 prose-img:object-cover [&_img]:rounded-xl [&_img]:w-full [&_img]:h-64 [&_img]:object-cover [&_div]:grid [&_div]:grid-cols-1 [&_div]:md:grid-cols-2 [&_div]:gap-4 [&_div]:my-8"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* Apply Button for Scholarship Posts */}
                            {post.category.toLowerCase() === "scholarship" && (
                                <div className="mt-10 p-8 bg-gradient-to-r from-[#2857AE]/5 to-[#2857AE]/10 rounded-2xl border border-[#2857AE]/15 text-center">
                                    <h3 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-2">Interested in this scholarship?</h3>
                                    <p className="text-gray-600 mb-6">Submit your application today and take the next step in your academic journey.</p>
                                    <a
                                        href="#"
                                        className="inline-block bg-[#2857AE] hover:bg-[#1f448c] text-white font-semibold px-10 py-4 rounded-full transition-colors text-base"
                                    >
                                        Apply Now
                                    </a>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
