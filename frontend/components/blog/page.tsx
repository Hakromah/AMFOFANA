import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, User } from 'lucide-react';

import Breadcrumb from '@/components/Breadcrumb';

const blogPosts = [
    {
        id: 1,
        title: "AMFOFANA Wins Regional Science Fair",
        excerpt: "Our students showcased innovative projects at the annual regional science fair, securing top positions in physics and biology categories.",
        date: "March 15, 2024",
        author: "Science Dept.",
        image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1974&auto=format&fit=crop",
        category: "Academic Achievement"
    },
    {
        id: 2,
        title: "Annual Sports Day Highlights",
        excerpt: "A day filled with energy, sportsmanship, and record-breaking performances. See the highlights from our most exciting sports day yet.",
        date: "February 28, 2024",
        author: "Sports Dept.",
        image: "https://images.unsplash.com/photo-1576678927484-9918154f4ea9?q=80&w=1978&auto=format&fit=crop",
        category: "Events"
    },
    {
        id: 3,
        title: "New Art Wing Inauguration",
        excerpt: "We are proud to announce the opening of our new state-of-the-art visual arts wing, fostering creativity and expression for all students.",
        date: "January 10, 2024",
        author: "Administration",
        image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop",
        category: "Campus News"
    },
    {
        id: 4,
        title: "Community Service Initiative Launched",
        excerpt: "Students take the lead in giving back to the community through a new weekend volunteer program partnering with local shelters.",
        date: "December 05, 2023",
        author: "Student Council",
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
        category: "Community"
    },
    {
        id: 5,
        title: "Alumni Spotlight: Sarah Johnson",
        excerpt: "Catch up with our 2015 graduate Sarah Johnson who is now leading renewable energy research at MIT.",
        date: "November 20, 2023",
        author: "Alumni Relations",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
        category: "Alumni"
    },
    {
        id: 6,
        title: "Upcoming Parent-Teacher Conference",
        excerpt: "Important dates and information regarding the upcoming semester's parent-teacher meetings. Schedule your slots online.",
        date: "November 01, 2023",
        author: "Principal's Office",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop",
        category: "Announcements"
    }
];

export default function BlogPage() {
    return (
        <div className="w-full bg-background min-h-screen">
            {/* Header */}
            <Breadcrumb
                title="School News & Updates"
                description="Stay informed about the latest happenings, achievements, and stories from the AMFOFANA community."
                image="https://images.unsplash.com/photo-1499750310159-54f8f0ea9dbf?q=80&w=2070&auto=format&fit=crop"
                alt="Blog Header"
            />

            {/* Blog Grid */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.map((post) => (
                            <article key={post.id} className="group bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                                <div className="relative h-48 w-full overflow-hidden">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 left-4 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {post.category}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" /> {post.author}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                        <Link href={`/blog/${post.id}`}>{post.title}</Link>
                                    </h3>
                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-grow">
                                        {post.excerpt}
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-primary font-semibold self-start hover:no-underline group-hover:translate-x-1 transition-transform">
                                        Read Full Story &rarr;
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Pagination Placeholder */}
                    <div className="mt-16 flex justify-center gap-2">
                        <Button variant="outline" disabled>Previous</Button>
                        <Button variant="default" className="bg-primary">1</Button>
                        <Button variant="outline">2</Button>
                        <Button variant="outline">3</Button>
                        <Button variant="outline">Next</Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
