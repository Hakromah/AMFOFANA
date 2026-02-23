import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Link2, ArrowLeft } from 'lucide-react';

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

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
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
                        <div className="md:w-16 w-full md:flex-shrink-0 md:sticky  md:top-32 z-10">
                            <div className="flex max-md:flex-row md:flex-col gap-6 items-center bg-white/80 backdrop-blur-sm p-4 rounded-full border border-gray-100 shadow-sm">
                                <button className="text-gray-400 hover:text-[#2857AE] transition-colors"><Facebook className="w-5 h-5" /></button>
                                <button className="text-gray-400 hover:text-[#2857AE] transition-colors"><Twitter className="w-5 h-5" /></button>
                                <button className="text-gray-400 hover:text-[#2857AE] transition-colors"><Linkedin className="w-5 h-5" /></button>
                                <button className="text-gray-400 hover:text-[#2857AE] transition-colors"><Link2 className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                A.M. Fofana continues to create platforms that inspire excellence beyond the classroom.
                            </h2>

                            {/* Dynamically rendered HTML content */}
                            <div
                                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-xl prose-img:w-full prose-img:h-64 prose-img:object-cover [&_img]:rounded-xl [&_img]:w-full [&_img]:h-64 [&_img]:object-cover [&_div]:grid [&_div]:grid-cols-1 [&_div]:md:grid-cols-2 [&_div]:gap-4 [&_div]:my-8"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />


                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
