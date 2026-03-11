import React from 'react';
import BlogPostDetail from '@/app/pages-sections/blog/BlogPostDetail';
import { fetchBlogPostById } from '@/lib/strapi-api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await fetchBlogPostById(id);

    if (!post) {
        return notFound();
    }

    return <BlogPostDetail post={post} />;
}
