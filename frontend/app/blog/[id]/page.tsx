import React from 'react';
import BlogPostDetail from '@/components/blog/BlogPostDetail';
import { blogPosts } from '@/data/blogPosts';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        id: post.id.toString(),
    }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = blogPosts.find((p) => p.id === parseInt(id));

    if (!post) {
        return notFound();
    }

    return <BlogPostDetail post={post} />;
}
